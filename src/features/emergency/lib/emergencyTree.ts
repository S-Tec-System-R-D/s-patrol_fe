import type { EmergencyDay, EmergencyDayEntry, EmergencyTreeNode } from '../types/emergency'

/**
 * 비상연락망 순수 함수 (`spec 057` T1019).
 *
 * 🔴 후보 트리는 사업장 · 요일과 무관한 **전사 후보**다(실측) — "그 요일에 이미 등록됨" 은 `GetEmergency` 와 대조한다.
 */

export const DAY_LABEL: Record<EmergencyDay, string> = {
  MON: '월',
  TUE: '화',
  WED: '수',
  THU: '목',
  FRI: '금',
  SAT: '토',
  SUN: '일',
}

export const isWeekend = (day: EmergencyDay): boolean => day === 'SAT' || day === 'SUN'

const SYSTEM_ADMIN_CODE = 2

/** 아래 트리에 사람이 하나라도 있는 노드만 남긴다 */
const prune = (nodes: EmergencyTreeNode[]): EmergencyTreeNode[] =>
  nodes.flatMap((node) => {
    const children = prune(node.children)
    return node.members.length > 0 || children.length > 0 ? [{ ...node, children }] : []
  })

const mapMembers = (
  nodes: EmergencyTreeNode[],
  keep: (member: EmergencyTreeNode['members'][number]) => boolean
): EmergencyTreeNode[] =>
  nodes.map((node) => ({
    ...node,
    members: node.members.filter(keep),
    children: mapMembers(node.children, keep),
  }))

/** 🔴 시스템관리자 제외(사용자 결정 2026-10-27) · 빈 노드 숨김 */
export const pickableTree = (nodes: EmergencyTreeNode[]): EmergencyTreeNode[] =>
  prune(mapMembers(nodes, (member) => member.codeSeq !== SYSTEM_ADMIN_CODE))

/** 이름 부분 일치(대소문자 무시) — 맞은 사람과 그 노드 경로만 남긴다 */
export const searchTree = (nodes: EmergencyTreeNode[], keyword: string): EmergencyTreeNode[] => {
  const needle = keyword.trim().toLowerCase()
  if (needle === '') return nodes
  return prune(mapMembers(nodes, (member) => member.userName.toLowerCase().includes(needle)))
}

/** 그 요일에 이미 등록된 사람 */
export const registeredOn = (week: EmergencyDayEntry[], day: EmergencyDay): Set<number> =>
  new Set(week.find((entry) => entry.day === day)?.users.map((user) => user.userSeq) ?? [])

/** 카드 머리 "담당자 N명" — 7요일 중 하루라도 등록된 사람(중복 제거) */
export const contactCount = (week: EmergencyDayEntry[]): number =>
  new Set(week.flatMap((entry) => entry.users.map((user) => user.userSeq))).size
