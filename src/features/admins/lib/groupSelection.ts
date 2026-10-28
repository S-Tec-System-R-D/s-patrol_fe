import type { GroupNode } from '@/features/auth/types/site'
import { groupPath, walkGroups } from '@/features/groups/lib/groupTree'
import { isTopGroup } from './adminList'

/**
 * 담당 그룹 고르기 규칙 (`spec 045` 후속 — 사용자 결정 2026-10-23). 추가 폼(매니저) · 담당 그룹 추가 모달이 같이 쓴다.
 *
 * 1. **본부를 고르면 그 아래 지사가 전부** 담긴다 — 지사 일부만 빼는 경우는 없다. 지사는 체크된 채 잠긴다.
 * 2. **지사를 고르면 다른 본부(와 그 지사)는 고를 수 없다** — 같은 본부 안의 지사는 더 고를 수 있다.
 * 3. 본부끼리는 여러 개를 고를 수 있다.
 * → 선택은 항상 **"본부 여러 개"** 또는 **"한 본부 안의 지사 몇 개"** 다. 본부를 고르면 저장도 **본부 그룹만** 한다
 *   (서버 범위가 할당 그룹의 하위를 포함한다 — Master `AdminSiteSelect` 실측).
 *
 * `fixed` = 이미 맡은 그룹(모달) — 체크 · 잠금으로 보이고 규칙 계산에 들어간다.
 */

const isHq = (group: GroupNode): boolean => group.layer === 1

/**
 * 그 그룹의 본부(자기 포함). 🔴 Master 트리처럼 루트가 지사면 본부가 트리에 없다 → `null`(모두 같은 묶음으로 본다).
 */
export const hqOf = (root: GroupNode, group: GroupNode): GroupNode | null =>
  groupPath(root, group.groupSeq).find(isHq) ?? null

export interface PickState {
  checked: boolean
  disabled: boolean
  /** 본부가 골라져 함께 담긴 지사 */
  implied: boolean
}

const findIn = (root: GroupNode, seqs: number[]): GroupNode[] =>
  walkGroups(root).filter((group) => seqs.includes(group.groupSeq))

export const pickState = (root: GroupNode, group: GroupNode, selected: number[], fixed: number[] = []): PickState => {
  const all = findIn(root, [...selected, ...fixed])
  const hq = hqOf(root, group)

  if (fixed.includes(group.groupSeq)) return { checked: true, disabled: true, implied: false }
  if (!isHq(group) && hq && all.some((item) => item.groupSeq === hq.groupSeq)) {
    return { checked: true, disabled: true, implied: true }
  }
  if (selected.includes(group.groupSeq)) return { checked: true, disabled: false, implied: false }

  const otherHq = (item: GroupNode) => hqOf(root, item)?.groupSeq !== hq?.groupSeq
  const conflict = isHq(group)
    ? // 다른 본부의 지사가 골라져 있으면 본부를 더할 수 없다(같은 본부의 지사는 본부로 합쳐진다)
      all.some((item) => !isHq(item) && otherHq(item))
    : // 지사는 다른 본부 쪽에 무엇이든 골라져 있으면 안 된다
      all.some(otherHq)
  return { checked: false, disabled: conflict, implied: false }
}

/** 고르기 · 풀기. 본부를 고르면 그 본부의 지사 선택은 본부로 합친다 */
export const togglePick = (group: GroupNode, selected: number[]): number[] => {
  if (selected.includes(group.groupSeq)) return selected.filter((seq) => seq !== group.groupSeq)
  if (!isHq(group)) return [...selected, group.groupSeq]
  const branches = new Set(walkGroups(group).map((g) => g.groupSeq))
  return [...selected.filter((seq) => !branches.has(seq)), group.groupSeq]
}

/** 선택 칩 — 트리 순서. 본부는 `{본부} 전체` */
export const pickChips = (root: GroupNode, selected: number[]): { group: GroupNode; label: string }[] =>
  findIn(root, selected).map((group) => ({
    group,
    label: isHq(group) ? `${group.groupName} 전체` : group.groupName,
  }))

/** 검색 — 이름이 맞는 그룹 + 그 본부(맥락). 빈 검색어면 그대로. 대소문자 무시(강조 `splitByKeyword` 와 같다) */
export const searchChoices = (root: GroupNode, options: GroupNode[], keyword: string): GroupNode[] => {
  const needle = keyword.trim().toLowerCase()
  if (needle === '') return options
  const hits = options.filter((group) => group.groupName.toLowerCase().includes(needle))
  const keep = new Set(hits.flatMap((group) => [group.groupSeq, hqOf(root, group)?.groupSeq ?? -1]))
  return options.filter((group) => keep.has(group.groupSeq))
}

/** 상세의 담당 그룹 묶음 — 회사 · 본부가 할당되면 "전체" 한 줄, 아니면 본부 아래 지사 칩 */
export type AssignmentSection =
  | { kind: 'whole'; group: GroupNode; scope: string }
  | { kind: 'branches'; hq: GroupNode | null; branches: GroupNode[] }

export const assignmentSections = (root: GroupNode, groups: GroupNode[]): AssignmentSection[] => {
  const assigned = new Set(groups.map((group) => group.groupSeq))
  const sections: AssignmentSection[] = []
  const branchSections = new Map<number, Extract<AssignmentSection, { kind: 'branches' }>>()

  for (const group of walkGroups(root).filter((g) => assigned.has(g.groupSeq))) {
    if (isTopGroup(group) || isHq(group)) {
      sections.push({ kind: 'whole', group, scope: isTopGroup(group) ? '회사 전체' : '본부 전체' })
      continue
    }
    const hq = hqOf(root, group)
    // 🔴 본부가 이미 맡겨져 있으면 그 지사 할당은 본부 줄에 포함된다(겹친 실데이터 — 김용우 g4 + g8)
    if (hq && assigned.has(hq.groupSeq)) continue
    const key = hq?.groupSeq ?? -1
    const section = branchSections.get(key) ?? { kind: 'branches' as const, hq, branches: [] }
    if (!branchSections.has(key)) {
      branchSections.set(key, section)
      sections.push(section)
    }
    section.branches.push(group)
  }
  return sections
}
