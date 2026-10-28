import type { GroupListNode, GroupListSite } from '@/features/groups/types/group'

/**
 * 사업장 목록 순수 함수 (`spec 044` T781). 입력은 `GetGroupList` 응답 그대로다(어댑터 없음 — B4).
 *
 * 🔴 단계는 `layer` 로만 판단한다 — `depth` 는 어긋나는 그룹이 있다(B-55).
 * 043 `groupTree.ts` 는 `AdminSiteSelect`(`GroupNode`) 용이라 여기서 같은 순회를 따로 둔다.
 */

const HQ_LAYER = 1
/** 지사 — 사업장은 지사 아래에만 놓인다(업무 규칙, OQ-043-E) */
const BRANCH_LAYER = 2

/** 깊이 우선(전위) — 루트 먼저, 응답 순서 그대로 */
export const walkListGroups = (root: GroupListNode): GroupListNode[] => [
  root,
  ...root.children.flatMap(walkListGroups),
]

export const findListGroup = (root: GroupListNode, groupSeq: number): GroupListNode | null =>
  walkListGroups(root).find((group) => group.groupSeq === groupSeq) ?? null

const pathTo = (node: GroupListNode, groupSeq: number): GroupListNode[] => {
  if (node.groupSeq === groupSeq) return [node]
  for (const child of node.children) {
    const path = pathTo(child, groupSeq)
    if (path.length > 0) return [node, ...path]
  }
  return []
}

/**
 * 그룹 경로 표기 `본부 › 지사` — 회사(루트)는 뺀다(043 경로 버튼과 같다).
 * 루트 자신이면 루트 이름. 트리에 없으면 빈 문자열.
 */
export const groupPathText = (root: GroupListNode, groupSeq: number): string => {
  const path = pathTo(root, groupSeq)
  if (path.length === 0) return ''
  const shown = path.length > 1 ? path.slice(1) : path
  return shown.map((group) => group.groupName).join(' › ')
}

/** 목록 표의 한 행 — `depth` 0 = 최상위 사업장, 1 이상 = 하위 사업장(들여쓰기) */
export interface SiteRow {
  site: GroupListSite
  depth: number
  /** 소속 그룹 경로 표기 — 좁은 폭 카드 */
  groupPath: string
  /** 표의 본부 · 지사 열(`spec 057` 사용자 요청 2026-10-28). 그 단계가 경로에 없으면 `null`(본부 직속 사업장의 지사 등) */
  hqName: string | null
  branchName: string | null
}

type SitePlace = Pick<SiteRow, 'groupPath' | 'hqName' | 'branchName'>

/** 🔴 단계는 `layer` 로 고른다(B-55 — `depth` 는 어긋난다) */
const placeOf = (root: GroupListNode, groupSeq: number): SitePlace => {
  const path = pathTo(root, groupSeq)
  return {
    groupPath: groupPathText(root, groupSeq),
    hqName: path.find((group) => group.layer === HQ_LAYER)?.groupName ?? null,
    branchName: path.find((group) => group.layer === BRANCH_LAYER)?.groupName ?? null,
  }
}

const matches = (site: GroupListSite, keyword: string): boolean =>
  site.siteName.toLowerCase().includes(keyword) ||
  (site.address ?? '').toLowerCase().includes(keyword)

/**
 * 하위 사업장을 펼친다. 🔴 검색어가 하위에만 맞으면 **모 사업장 행도 남긴다**(맥락 유지) —
 * 모 사업장만 맞으면 맞지 않는 하위는 빠진다.
 */
const flattenSites = (sites: GroupListSite[], depth: number, keyword: string, place: SitePlace): SiteRow[] =>
  sites.flatMap((site) => {
    const childRows = flattenSites(site.children, depth + 1, keyword, place)
    const keep = keyword === '' || matches(site, keyword) || childRows.length > 0
    return keep ? [{ site, depth, ...place }, ...childRows] : []
  })

/**
 * 선택 그룹 + 자손 그룹의 사업장 행(응답 순서 · 하위 사업장 포함).
 * 그룹이 트리에 없으면 루트로 본다(043 `?group` 규칙과 같다). 검색은 이름·주소, 대소문자 무시.
 */
export const collectSiteRows = (root: GroupListNode, groupSeq: number | null, search = ''): SiteRow[] => {
  const scope = (groupSeq === null ? null : findListGroup(root, groupSeq)) ?? root
  const keyword = search.trim().toLowerCase()
  return walkListGroups(scope).flatMap((group) =>
    flattenSites(group.sites, 0, keyword, placeOf(root, group.groupSeq))
  )
}

const walkSites = (sites: GroupListSite[]): GroupListSite[] =>
  sites.flatMap((site) => [site, ...walkSites(site.children)])

/** 사업장 노드와 그 소속 그룹 — 상세의 소속 그룹 · 모 사업장 출처(`GetSiteDetail` 에 없다) */
export const findSite = (
  root: GroupListNode,
  siteSeq: number
): { site: GroupListSite; group: GroupListNode } | null => {
  for (const group of walkListGroups(root)) {
    const site = walkSites(group.sites).find((candidate) => candidate.siteSeq === siteSeq)
    if (site) return { site, group }
  }
  return null
}

/** 하위 사업장 전부(자기 제외 · 손자 포함) — 🔴 삭제하면 함께 지워진다(B-54) */
export const countDescendantSites = (site: GroupListSite): number => walkSites(site.children).length

/** 본부 · 지사 선택지 1개 — 라벨은 그룹 이름만(단계를 나눠 고른다, `spec 051`) */
export interface GroupOption {
  groupSeq: number
  label: string
}

export const isBranch = (group: GroupListNode): boolean => group.layer === BRANCH_LAYER

const toOption = (group: GroupListNode): GroupOption => ({ groupSeq: group.groupSeq, label: group.groupName })

/** 본부 선택지(`layer 1`). 🔴 루트가 지사인 트리(할당 그룹만 받는 계정)면 빈 배열 — 본부 칸을 숨긴다 */
export const hqOptions = (root: GroupListNode): GroupOption[] =>
  walkListGroups(root)
    .filter((group) => group.layer === HQ_LAYER)
    .map(toOption)

/**
 * 지사 선택지 — 🔴 **지사만**(OQ-043-E — 서버는 막지 않는다). `hqSeq` 아래만, `null` 이면 트리 전체.
 */
export const branchOptions = (root: GroupListNode, hqSeq: number | null): GroupOption[] => {
  const scope = hqSeq === null ? root : findListGroup(root, hqSeq)
  return scope ? walkListGroups(scope).filter(isBranch).map(toOption) : []
}

/** 그룹이 속한 본부 — 없으면 `null` */
export const hqOf = (root: GroupListNode, groupSeq: number): number | null =>
  pathTo(root, groupSeq).find((group) => group.layer === HQ_LAYER)?.groupSeq ?? null

/** 모 사업장 후보 1개 */
export interface SiteOption {
  siteSeq: number
  siteName: string
}

/** 모 사업장 후보 — 🔴 그 지사의 **최상위 사업장만**(계층은 2단계까지, 사용자 결정 2026-10-26) */
export const parentSiteOptions = (root: GroupListNode, branchSeq: number): SiteOption[] =>
  (findListGroup(root, branchSeq)?.sites ?? []).map((site) => ({ siteSeq: site.siteSeq, siteName: site.siteName }))
