import { describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import { findGroup } from '@/features/groups/lib/groupTree'
import { assignmentSections, pickChips, pickState, searchChoices, togglePick } from '../groupSelection'
import { groupChoices } from '../adminList'

/**
 * 담당 그룹 고르기 규칙 (`spec 045` 후속 — 사용자 결정 2026-10-23):
 * 본부 = 지사 전부(일부 제외 없음) · 지사를 고르면 다른 본부는 못 고른다 · 본부끼리는 여러 개.
 */

const group = (groupSeq: number, name: string, parent: number | null, layer: number, children: GroupNode[] = []): GroupNode => ({
  groupSeq,
  groupName: name,
  parentGroupSeq: parent,
  layer,
  depth: layer,
  sites: [],
  children,
})

// 1 회사 ─ 2 본부A[3 지사A1 · 4 지사A2] · 5 본부B[6 지사B1]
const root = group(1, '회사', null, 0, [
  group(2, '본부A', 1, 1, [group(3, '지사A1', 2, 2), group(4, '지사A2', 2, 2)]),
  group(5, '본부B', 1, 1, [group(6, 'Branch-B1', 5, 2)]),
])
const g = (seq: number) => findGroup(root, seq) as GroupNode

describe('pickState', () => {
  it('본부를 고르면 그 지사는 체크 · 잠금(포함)', () => {
    expect(pickState(root, g(3), [2])).toEqual({ checked: true, disabled: true, implied: true })
  })

  it('본부끼리는 여러 개 — 본부A 를 골라도 본부B 는 열려 있다', () => {
    expect(pickState(root, g(5), [2]).disabled).toBe(false)
  })

  it('🔴 본부를 고르면 다른 본부의 지사는 막힌다(지사 = 한 본부 안)', () => {
    expect(pickState(root, g(6), [2]).disabled).toBe(true)
  })

  it('🔴 지사를 고르면 다른 본부와 그 지사는 막히고 같은 본부 지사 · 자기 본부는 열려 있다', () => {
    expect(pickState(root, g(5), [3]).disabled).toBe(true)
    expect(pickState(root, g(6), [3]).disabled).toBe(true)
    expect(pickState(root, g(4), [3]).disabled).toBe(false)
    expect(pickState(root, g(2), [3]).disabled).toBe(false)
  })

  it('이미 맡은 그룹(fixed)은 체크 · 잠금이고 규칙에 들어간다', () => {
    expect(pickState(root, g(3), [], [3])).toEqual({ checked: true, disabled: true, implied: false })
    expect(pickState(root, g(5), [], [3]).disabled).toBe(true)
  })
})

describe('togglePick', () => {
  it('본부를 고르면 그 본부의 지사 선택은 본부로 합친다', () => {
    expect(togglePick(g(2), [3, 4])).toEqual([2])
  })

  it('다시 누르면 푼다', () => {
    expect(togglePick(g(3), [3, 4])).toEqual([4])
  })
})

describe('pickChips · searchChoices', () => {
  it('칩은 트리 순서 · 본부는 "전체"', () => {
    expect(pickChips(root, [5, 2]).map((chip) => chip.label)).toEqual(['본부A 전체', '본부B 전체'])
  })

  it('검색은 맞은 그룹 + 그 본부 · 대소문자 무시', () => {
    expect(searchChoices(root, groupChoices(root), 'a1').map((x) => x.groupName)).toEqual(['본부A', '지사A1'])
    expect(searchChoices(root, groupChoices(root), 'branch').map((x) => x.groupName)).toEqual(['본부B', 'Branch-B1'])
    expect(searchChoices(root, groupChoices(root), ' ')).toHaveLength(5)
  })
})

describe('assignmentSections', () => {
  it('회사 · 본부는 "전체" 한 줄 · 지사만이면 본부 아래 묶음', () => {
    const sections = assignmentSections(root, [g(1), g(3), g(4)])
    expect(sections).toMatchObject([
      { kind: 'whole', scope: '회사 전체' },
      { kind: 'branches', hq: { groupSeq: 2 } },
    ])
    expect(sections[1].kind === 'branches' && sections[1].branches.map((b) => b.groupSeq)).toEqual([3, 4])
  })

  it('🔴 본부가 맡겨지면 그 지사 개별 할당은 본부 줄에 포함된다', () => {
    expect(assignmentSections(root, [g(2), g(3)])).toMatchObject([{ kind: 'whole', scope: '본부 전체' }])
  })
})
