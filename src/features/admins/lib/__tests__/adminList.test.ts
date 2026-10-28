import { describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import type { AdminGroupNode, AdminListItem } from '../../types/admin'
import {
  adminPermission,
  adminGroupLabel,
  adminGroupSummary,
  buildAdminRows,
  countAdmins,
  filterAdminRows,
  scopeAdminRows,
  type AdminRow,
} from '../adminList'
import { adminRoleLabel, adminRoleVariant, isSystemAdmin } from '../adminRole'

/**
 * 관리자 목록 순수 함수 (`spec 045` T821 → `spec 056` T995). 모양은 `GetAdminList` 실측 그대로 —
 * 노드마다 위에서 물려받은 관리자까지 반복된다.
 */

const group = (
  groupSeq: number,
  name: string,
  parent: number | null,
  layer: number,
  children: GroupNode[] = []
): GroupNode => ({
  groupSeq,
  groupName: name,
  parentGroupSeq: parent,
  layer,
  depth: layer,
  sites: [],
  children,
})

// 1 회사 ─ 2 본부A ─ 3 지사A1
//        └ 4 본부B
const branch = group(3, '지사A1', 2, 2)
const hqA = group(2, '본부A', 1, 1, [branch])
const hqB = group(4, '본부B', 1, 1)
const root = group(1, '회사', null, 0, [hqA, hqB])

const admin = (
  userSeq: number,
  codeSeq: number,
  userName: string,
  groupSeqs: number[] = []
): AdminListItem => ({
  userSeq,
  userName,
  phone: '01000000000',
  codeSeq,
  codeName: codeSeq === 2 ? '시스템관리자' : codeSeq === 3 ? '관리자' : '매니저',
  allGroupYn: codeSeq !== 4,
  groups: groupSeqs.map((groupSeq) => ({ groupSeq, groupName: `g${groupSeq}` })),
})

const system = admin(1, 2, '시스템관리자')
const master = admin(3, 3, '김용우')
const hqManager = admin(6, 4, '본부매니저', [2])
const branchManager = admin(7, 4, '지사매니저', [3])
/** 트리 밖 그룹(99)에 할당 — 표시에서 빠진다 */
const outsider = admin(8, 4, '바깥매니저', [99])

const node = (
  target: GroupNode,
  admins: AdminListItem[],
  children: AdminGroupNode[] = []
): AdminGroupNode => ({
  groupSeq: target.groupSeq,
  groupName: target.groupName,
  parentGroupSeq: target.parentGroupSeq,
  layer: target.layer,
  depth: target.depth,
  admins,
  children,
})

// 🔴 실측처럼 노드마다 상속 관리자를 반복한다
const list = node(
  root,
  [system, master, outsider],
  [
    node(
      hqA,
      [system, master, hqManager],
      [node(branch, [system, master, hqManager, branchManager])]
    ),
    node(hqB, [system, master]),
  ]
)

const rows = buildAdminRows(list, root)
const names = (target: AdminRow[]) => target.map((row) => row.admin.userName)

describe('buildAdminRows', () => {
  it('🔴 중복 제거 · 시스템관리자 제외 · 첫 등장 순서', () => {
    expect(names(rows)).toEqual(['김용우', '바깥매니저', '본부매니저', '지사매니저'])
  })

  it('담당 그룹은 트리 노드로 · 트리에 없는 그룹은 뺀다', () => {
    expect(rows.find((row) => row.admin.userSeq === 7)?.groups).toEqual([branch])
    expect(rows.find((row) => row.admin.userSeq === 8)?.groups).toEqual([])
  })
})

describe('scopeAdminRows · countAdmins', () => {
  it('🔴 회사(루트)면 전원', () => {
    expect(countAdmins(rows, root)).toBe(4)
  })

  it('🔴 본부는 자기 + 하위 지사에 할당된 매니저만 — 마스터 없음', () => {
    expect(names(scopeAdminRows(rows, hqA))).toEqual(['본부매니저', '지사매니저'])
  })

  it('지사는 그 지사 할당만 — 상위(본부) 할당은 없다', () => {
    expect(names(scopeAdminRows(rows, branch))).toEqual(['지사매니저'])
  })

  it('할당 없는 그룹은 0', () => {
    expect(countAdmins(rows, hqB)).toBe(0)
  })
})

describe('filterAdminRows', () => {
  it('이름 부분 일치 · 앞뒤 공백 무시', () => {
    expect(names(filterAdminRows(rows, ' 용우 ', undefined))).toEqual(['김용우'])
  })

  it('권한 master · manager', () => {
    expect(names(filterAdminRows(rows, '', 'master'))).toEqual(['김용우'])
    expect(filterAdminRows(rows, '', 'manager')).toHaveLength(3)
  })

  it('잘못된 role 은 전체', () => {
    expect(filterAdminRows(rows, '', 'system')).toHaveLength(4)
  })
})

describe('adminGroupLabel · adminGroupSummary', () => {
  it('회사는 빼고 본부 › 지사', () => {
    expect(adminGroupLabel(root, branch)).toBe('본부A › 지사A1')
    expect(adminGroupLabel(root, root)).toBe('회사')
  })

  it('🔴 마스터는 전체 · 첫 그룹 + 외 N개 · 없으면 -', () => {
    const row = (groups: GroupNode[], target = hqManager): AdminRow => ({ admin: target, groups })
    expect(adminGroupSummary(root, row([], master))).toBe('전체')
    expect(adminGroupSummary(root, row([hqA, branch]))).toBe('본부A 외 1개')
    expect(adminGroupSummary(root, row([branch]))).toBe('본부A › 지사A1')
    expect(adminGroupSummary(root, row([]))).toBe('-')
  })
})

describe('adminRole', () => {
  it('🔴 codeSeq 로 라벨 — Master 의 codeName "관리자" 를 쓰지 않는다', () => {
    expect(adminRoleLabel(3, '관리자')).toBe('마스터')
    expect(adminRoleLabel(4, '매니저')).toBe('매니저')
    expect(adminRoleLabel(9, '모름')).toBe('모름')
  })

  it('매니저만 기본 뱃지 · 시스템관리자 판정', () => {
    expect(adminRoleVariant(4)).toBe('muted')
    expect(adminRoleVariant(3)).toBe('point')
    expect(isSystemAdmin(2)).toBe(true)
    expect(isSystemAdmin(3)).toBe(false)
  })
})

describe('adminPermission (사용자 결정 2026-10-28)', () => {
  const byName = (name: string) => rows.find((row) => row.admin.userName === name) as AdminRow
  const as = (role: 'SYSTEM' | 'MASTER' | 'MANAGER', userSeq: number, name: string) =>
    adminPermission({ role, userSeq }, rows, byName(name))
  const ALL = { edit: true, remove: true }
  const SELF = { edit: true, remove: false }
  const NONE = { edit: false, remove: false }

  it('시스템관리자 = 마스터 · 매니저 전원', () => {
    expect(as('SYSTEM', 1, '김용우')).toEqual(ALL)
    expect(as('SYSTEM', 1, '지사매니저')).toEqual(ALL)
  })

  it('🔴 마스터 = 본인(삭제 없음) + 매니저 전원 · 다른 마스터 없음', () => {
    expect(as('MASTER', 3, '김용우')).toEqual(SELF)
    expect(as('MASTER', 3, '본부매니저')).toEqual(ALL)
    const otherMaster = {
      ...byName('김용우'),
      admin: { ...byName('김용우').admin, userSeq: 30, userName: '다른마스터' },
    }
    expect(adminPermission({ role: 'MASTER', userSeq: 3 }, rows, otherMaster)).toEqual(NONE)
  })

  it('🔴 본부 매니저 = 본인 + 내 본부 아래 지사 매니저 · 다른 본부 · 트리 밖은 없음', () => {
    expect(as('MANAGER', 6, '본부매니저')).toEqual(SELF)
    expect(as('MANAGER', 6, '지사매니저')).toEqual(ALL)
    expect(as('MANAGER', 6, '바깥매니저')).toEqual(NONE)
    expect(as('MANAGER', 6, '김용우')).toEqual(NONE)
  })

  it('🔴 지사 매니저 = 본인만', () => {
    expect(as('MANAGER', 7, '지사매니저')).toEqual(SELF)
    expect(as('MANAGER', 7, '본부매니저')).toEqual(NONE)
  })

  it('로그인 정보가 없으면 없음', () => {
    expect(adminPermission(undefined, rows, byName('김용우'))).toEqual(NONE)
  })
})
