import type { GroupNode } from '@/features/auth/types/site'
import { findGroup, groupPath, walkGroups } from '@/features/groups/lib/groupTree'
import type { AdminGroupNode, AdminListItem } from '../types/admin'
import type { Role } from '@/types/enum'
import { ADMIN_CODE, isSystemAdmin } from './adminRole'

/**
 * 관리자 목록 순수 함수 (`spec 045` T815 → `spec 056` T995 — `GetAdminList` 하나로).
 *
 * 🔴 `GetAdminList` 노드의 `admins` 는 **위에서 물려받은 관리자까지** 노드마다 반복된다(실측) → 행은 `userSeq` 로 중복 제거.
 * 🔴 **시스템관리자는 화면에 없다**(사용자 결정 2026-10-27) — 행 · 범위 · 수 모두에서 뺀다.
 */

export interface AdminRow {
  admin: AdminListItem
  /** 직접 할당 그룹을 트리(`AdminSiteSelect`) 노드로 — 트리에 없는 그룹은 뺀다(범위 밖, OQ-056-A). 마스터는 `[]` */
  groups: GroupNode[]
}

const walkAdminNodes = (node: AdminGroupNode): AdminGroupNode[] => [
  node,
  ...node.children.flatMap(walkAdminNodes),
]

const visibleAdmins = (node: AdminGroupNode): AdminListItem[] =>
  node.admins.filter((admin) => !isSystemAdmin(admin.codeSeq))

/** 첫 등장 순서(루트부터)로 중복 제거 */
export const buildAdminRows = (list: AdminGroupNode, tree: GroupNode): AdminRow[] => {
  const seen = new Map<number, AdminListItem>()
  walkAdminNodes(list).forEach((node) =>
    visibleAdmins(node).forEach((admin) => {
      if (!seen.has(admin.userSeq)) seen.set(admin.userSeq, admin)
    })
  )
  return [...seen.values()].map((admin) => ({
    admin,
    groups: admin.groups.flatMap((ref) => findGroup(tree, ref.groupSeq) ?? []),
  }))
}

/** 회사(루트, `parentGroupSeq: null`)인가 — 범위 · 할당 변경 규칙이 갈린다 */
export const isTopGroup = (group: GroupNode): boolean => group.parentGroupSeq === null

/**
 * 선택 그룹 범위. 🔴 **회사(루트)면 전원** · 본부 · 지사는 **그 그룹 + 하위 그룹에 할당된 매니저만**(사용자 결정 2026-10-28 —
 * 전체 담당 마스터가 본부마다 나오는 것이 이상하다. 서버 노드 `admins` 는 상속 기준이라 쓰지 않는다).
 */
export const scopeAdminRows = (rows: AdminRow[], selected: GroupNode): AdminRow[] => {
  if (isTopGroup(selected)) return rows
  const scope = new Set(walkGroups(selected).map((group) => group.groupSeq))
  return rows.filter(
    (row) => !row.admin.allGroupYn && row.groups.some((group) => scope.has(group.groupSeq))
  )
}

/** 트리 옆 수 — 범위와 같은 규칙(한 사람이 여러 하위 그룹에 있어도 1명) */
export const countAdmins = (rows: AdminRow[], group: GroupNode): number =>
  scopeAdminRows(rows, group).length

/** 상세 하단 버튼 권한 — [수정] · [비밀번호] 는 `edit`, [삭제] 는 `remove` */
export interface AdminPermission {
  edit: boolean
  remove: boolean
}

const NONE: AdminPermission = { edit: false, remove: false }

/**
 * 로그인한 사람이 그 관리자를 수정 · 비밀번호 변경 · 삭제할 수 있는가(`spec 056` T1015 — 사용자 결정 2026-10-28).
 *
 * | 로그인 | 대상 |
 * |---|---|
 * | 시스템관리자 | 마스터 · 매니저 전원 |
 * | 마스터 | 본인 + 매니저 전원 |
 * | 본부 매니저(담당에 본부가 있다) | 본인 + **담당 그룹이 전부 내 본부 아래 지사**인 매니저 |
 * | 지사 매니저 | 본인만 |
 *
 * - 🔴 **본인은 삭제할 수 없다** — 수정 · 비밀번호만(사용자 결정 2026-10-28, 근무자 화면과 같다).
 * - 본부 = `layer 1`. 다른 본부 그룹을 함께 맡은 매니저 · 같은 본부를 맡은 본부 매니저는 대상이 아니다.
 * - 🔴 서버는 검사하지 않는다(B-60) — 화면이 막는다. 추가 · 담당 그룹 권한은 이 규칙과 별개다(그대로).
 */
export const adminPermission = (
  me: { role: Role; userSeq: number } | undefined,
  rows: AdminRow[],
  target: AdminRow
): AdminPermission => {
  if (!me) return NONE
  const self = me.userSeq === target.admin.userSeq
  if (self) return { edit: true, remove: false }
  if (me.role === 'SYSTEM') return { edit: true, remove: true }
  const targetIsManager = target.admin.codeSeq === ADMIN_CODE.MANAGER
  if (me.role === 'MASTER') return targetIsManager ? { edit: true, remove: true } : NONE
  if (me.role !== 'MANAGER' || !targetIsManager || target.groups.length === 0) return NONE

  const myHqs = (rows.find((row) => row.admin.userSeq === me.userSeq)?.groups ?? []).filter(
    (group) => group.layer === 1
  )
  const under = new Set(
    myHqs.flatMap((hq) =>
      walkGroups(hq)
        .slice(1)
        .map((group) => group.groupSeq)
    )
  )
  const managed = target.groups.every((group) => under.has(group.groupSeq))
  return managed ? { edit: true, remove: true } : NONE
}

/**
 * 담당 그룹으로 고를 수 있는 그룹 — 트리 순서(`spec 045` T841). 🔴 **회사(루트)는 뺀다** — 루트 할당 변경은 미실측(OQ-045-A).
 * Master 의 트리는 자기 할당 그룹만이라(실측) 선택지도 자연히 그 안이다.
 */
export const groupChoices = (root: GroupNode, exclude: GroupNode[] = []): GroupNode[] => {
  const excluded = new Set(exclude.map((group) => group.groupSeq))
  return walkGroups(root).filter((group) => !isTopGroup(group) && !excluded.has(group.groupSeq))
}

/** URL `?role=` 값 — 목업 세그먼트 "전체 / 마스터 / 매니저" */
const ROLE_FILTER: Record<string, number> = {
  master: ADMIN_CODE.MASTER,
  manager: ADMIN_CODE.MANAGER,
}

/** 이름 검색 + 권한 필터. 🔴 잘못된 `role` 값은 전체로 본다 */
export const filterAdminRows = (
  rows: AdminRow[],
  keyword: string,
  role: string | undefined
): AdminRow[] => {
  const needle = keyword.trim()
  const codeSeq = role ? ROLE_FILTER[role] : undefined
  return rows.filter(
    (row) =>
      (needle === '' || row.admin.userName.includes(needle)) &&
      (codeSeq === undefined || row.admin.codeSeq === codeSeq)
  )
}

/**
 * 그룹 경로 `본부 › 지사` — 회사(루트)는 뺀다(사업장 목록 `groupPathText` 와 같다).
 * 회사 자신이면 회사 이름. Master 트리처럼 루트가 회사가 아니면 그 트리 안 경로다.
 */
export const adminGroupLabel = (root: GroupNode, group: GroupNode): string => {
  const shown = groupPath(root, group.groupSeq).filter((node) => !isTopGroup(node))
  return shown.length > 0 ? shown.map((node) => node.groupName).join(' › ') : group.groupName
}

/** 목록 칸 — 🔴 전체 담당(마스터)은 `전체` · 그 외 첫 그룹 + `외 N개`, 없으면 `-` */
export const adminGroupSummary = (root: GroupNode, row: AdminRow): string => {
  if (row.admin.allGroupYn) return '전체'
  const { groups } = row
  // 값 없음은 하이픈(`design-system.md` §4-5A — em dash 를 쓰지 않는다, 999 T869)
  if (groups.length === 0) return '-'
  const first = adminGroupLabel(root, groups[0])
  return groups.length > 1 ? `${first} 외 ${groups.length - 1}개` : first
}
