import type { GroupListNode, GroupListSite } from '@/features/groups/types/group'

/**
 * 사업장 목록 순수 함수 (`spec 044` T781). 입력은 `GetGroupList` 응답 그대로다(어댑터 없음 — B4).
 *
 * 🔴 단계는 `layer` 로만 판단한다 — `depth` 는 어긋나는 그룹이 있다(B-55).
 * 043 `groupTree.ts` 는 `AdminSiteSelect`(`GroupNode`) 용이라 여기서 같은 순회를 따로 둔다.
 */

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
  /** 소속 그룹 경로 표기 */
  groupPath: string
}

const matches = (site: GroupListSite, keyword: string): boolean =>
  site.siteName.toLowerCase().includes(keyword) ||
  (site.address ?? '').toLowerCase().includes(keyword)

/**
 * 하위 사업장을 펼친다. 🔴 검색어가 하위에만 맞으면 **모 사업장 행도 남긴다**(맥락 유지) —
 * 모 사업장만 맞으면 맞지 않는 하위는 빠진다.
 */
const flattenSites = (
  sites: GroupListSite[],
  depth: number,
  keyword: string,
  groupPath: string
): SiteRow[] =>
  sites.flatMap((site) => {
    const childRows = flattenSites(site.children, depth + 1, keyword, groupPath)
    const keep = keyword === '' || matches(site, keyword) || childRows.length > 0
    return keep ? [{ site, depth, groupPath }, ...childRows] : []
  })

/**
 * 선택 그룹 + 자손 그룹의 사업장 행(응답 순서 · 하위 사업장 포함).
 * 그룹이 트리에 없으면 루트로 본다(043 `?group` 규칙과 같다). 검색은 이름·주소, 대소문자 무시.
 */
export const collectSiteRows = (root: GroupListNode, groupSeq: number | null, search = ''): SiteRow[] => {
  const scope = (groupSeq === null ? null : findListGroup(root, groupSeq)) ?? root
  const keyword = search.trim().toLowerCase()
  return walkListGroups(scope).flatMap((group) =>
    flattenSites(group.sites, 0, keyword, groupPathText(root, group.groupSeq))
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

/** 소속 그룹 선택지 1개 */
export interface GroupOption {
  groupSeq: number
  label: string
}

/**
 * 소속 그룹 선택지 — 🔴 **지사만**(OQ-043-E — 서버는 막지 않는다).
 * `keepGroupSeq` 가 지사가 아니어도 선택지에 넣는다 — 이미 회사·본부에 있는 사업장이 **현재 그룹 그대로** 저장할 수 있게.
 */
export const groupOptions = (root: GroupListNode, keepGroupSeq?: number): GroupOption[] =>
  walkListGroups(root)
    .filter((group) => group.layer === BRANCH_LAYER || group.groupSeq === keepGroupSeq)
    .map((group) => ({ groupSeq: group.groupSeq, label: groupPathText(root, group.groupSeq) }))

export const isBranch = (group: GroupListNode): boolean => group.layer === BRANCH_LAYER
