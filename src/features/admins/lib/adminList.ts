import type { GroupNode } from '@/features/auth/types/site'
import type { GroupAdminRow } from '@/features/groups/types/group'
import { groupPath, walkGroups } from '@/features/groups/lib/groupTree'
import { ADMIN_CODE } from './adminRole'

/**
 * 관리자 목록 순수 함수 (`spec 045` T815).
 *
 * 🔴 **관리자 목록 API 가 없다**(B-61). `GetGroupAdminList` 는 어느 그룹으로 불러도 **본사 관리자 전원**을 같은 행
 * 집합으로 주고 `isInclude` 만 다르다 → 행은 루트 응답에서, 담당 그룹은 그룹별 `isInclude` 에서 모은다
 * (사용자 결정 2026-10-23 — 그룹마다 조회).
 */

/** 그룹 하나의 조회 결과 — 트리 순서(`walkGroups`)로 들어온다 */
export interface GroupAdmins {
  group: GroupNode
  rows: GroupAdminRow[]
}

export interface AdminRow {
  admin: GroupAdminRow
  /** 담당 그룹 — 트리 순서 */
  groups: GroupNode[]
}

/** 🔴 `isInclude` 는 그룹마다 다른 값이라 행에 남기지 않는다 — 담당은 `groups` 로만 본다 */
export const buildAdminRows = (entries: GroupAdmins[]): AdminRow[] => {
  if (entries.length === 0) return []
  return entries[0].rows.map((admin) => ({
    admin,
    groups: entries
      .filter((entry) => entry.rows.some((row) => row.userSeq === admin.userSeq && row.isInclude))
      .map((entry) => entry.group),
  }))
}

/** 회사(루트, `parentGroupSeq: null`)인가 — 범위 · 할당 변경 규칙이 갈린다 */
export const isTopGroup = (group: GroupNode): boolean => group.parentGroupSeq === null

/**
 * 선택 그룹 범위. 🔴 **회사(루트)면 전원**(미할당 포함) · 그 외는 선택 그룹 + 자손 그룹에 할당된 관리자.
 * Master · Manager 의 트리 루트는 회사가 아니다(할당 그룹만 온다 — 실측) — 그때도 할당 기준이다.
 */
export const scopeAdminRows = (rows: AdminRow[], selected: GroupNode): AdminRow[] => {
  if (isTopGroup(selected)) return rows
  const scope = new Set(walkGroups(selected).map((group) => group.groupSeq))
  return rows.filter((row) => row.groups.some((group) => scope.has(group.groupSeq)))
}

/** 트리 옆 수 — 범위와 같은 규칙(한 사람이 여러 자손 그룹에 있어도 1명) */
export const countAdmins = (rows: AdminRow[], group: GroupNode): number => scopeAdminRows(rows, group).length

/** URL `?role=` 값 — 목업 세그먼트 "전체 / 마스터 / 매니저" */
const ROLE_FILTER: Record<string, number> = { master: ADMIN_CODE.MASTER, manager: ADMIN_CODE.MANAGER }

/** 이름 검색 + 권한 필터. 🔴 잘못된 `role` 값은 전체로 본다 */
export const filterAdminRows = (rows: AdminRow[], keyword: string, role: string | undefined): AdminRow[] => {
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

/** 목록 칸 — 첫 그룹 + `외 N개`, 없으면 `—` */
export const adminGroupSummary = (root: GroupNode, groups: GroupNode[]): string => {
  if (groups.length === 0) return '—'
  const first = adminGroupLabel(root, groups[0])
  return groups.length > 1 ? `${first} 외 ${groups.length - 1}개` : first
}
