import { describe, expect, it } from 'vitest'

import type {
  EmergencyDayEntry,
  EmergencyTreeMember,
  EmergencyTreeNode,
} from '../../types/emergency'
import { contactCount, pickableTree, registeredOn, searchTree } from '../emergencyTree'

/** 비상연락망 순수 함수 (`spec 057` T1019) — 모양은 `GetEmergencyUserTree` 실측 그대로 */

const member = (userSeq: number, userName: string, codeSeq: number): EmergencyTreeMember => ({
  userSeq,
  userName,
  phone: '01000000000',
  codeSeq,
  codeName: '',
  assignmentYn: false,
  assignmentType: null,
  assignedSiteSeq: null,
  assignedSiteName: null,
})

const node = (
  nodeType: EmergencyTreeNode['nodeType'],
  nodeSeq: number | null,
  name: string,
  members: EmergencyTreeMember[],
  children: EmergencyTreeNode[] = []
): EmergencyTreeNode => ({ nodeType, nodeSeq, name, members, children })

const tree = [
  node('ROOT', null, '전체 관리자', [member(1, '시스템관리자', 2), member(3, '김용우', 3)]),
  node(
    'GROUP',
    1,
    '회사',
    [],
    [
      node(
        'GROUP',
        3,
        '강동지사',
        [member(6, '테스트', 4)],
        [
          node('SITE', 11, '지가사업장', [member(9, 'test유저', 7)]),
          node('SITE', 9, '빈사업장', []),
        ]
      ),
    ]
  ),
]

const names = (nodes: EmergencyTreeNode[]): string[] =>
  nodes.flatMap((n) => [...n.members.map((m) => m.userName), ...names(n.children)])
const nodeNames = (nodes: EmergencyTreeNode[]): string[] =>
  nodes.flatMap((n) => [n.name, ...nodeNames(n.children)])

describe('pickableTree', () => {
  it('🔴 시스템관리자 제외 · 사람 없는 노드 숨김', () => {
    const picked = pickableTree(tree)
    expect(names(picked)).toEqual(['김용우', '테스트', 'test유저'])
    expect(nodeNames(picked)).not.toContain('빈사업장')
  })

  it('시스템관리자만 있던 ROOT 는 사라진다', () => {
    expect(
      nodeNames(pickableTree([node('ROOT', null, '전체 관리자', [member(1, 'a', 2)])]))
    ).toEqual([])
  })
})

describe('searchTree', () => {
  it('맞은 사람과 그 경로만 · 대소문자 무시', () => {
    const found = searchTree(pickableTree(tree), 'TEST')
    expect(names(found)).toEqual(['test유저'])
    expect(nodeNames(found)).toEqual(['회사', '강동지사', '지가사업장'])
  })

  it('빈 검색어는 그대로', () => {
    expect(searchTree(tree, '  ')).toBe(tree)
  })
})

describe('registeredOn · contactCount', () => {
  const week: EmergencyDayEntry[] = [
    { day: 'MON', users: [member(6, '테스트', 4), member(3, '김용우', 3)] },
    { day: 'TUE', users: [] },
    { day: 'SAT', users: [member(3, '김용우', 3)] },
  ]

  it('그 요일 등록자', () => {
    expect([...registeredOn(week, 'MON')]).toEqual([6, 3])
    expect(registeredOn(week, 'SUN').size).toBe(0)
  })

  it('🔴 담당자 수는 중복 제거', () => {
    expect(contactCount(week)).toBe(2)
  })
})
