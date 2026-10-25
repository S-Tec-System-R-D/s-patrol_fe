import { describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import type { GroupAdminRow } from '@/features/groups/types/group'
import { walkGroups } from '@/features/groups/lib/groupTree'
import {
  adminGroupLabel,
  adminGroupSummary,
  buildAdminRows,
  countAdmins,
  filterAdminRows,
  scopeAdminRows,
} from '../adminList'
import { adminRoleLabel, adminRoleVariant, isSystemAdmin } from '../adminRole'

/**
 * 관리자 목록 순수 함수 (`spec 045` T821). 모양은 `GetGroupAdminList` 실측 그대로 — 그룹마다 같은 행 집합 + `isInclude`.
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

// 1 회사 ─ 2 본부A ─ 3 지사A1
//        └ 4 본부B
const branch = group(3, '지사A1', 2, 2)
const hqA = group(2, '본부A', 1, 1, [branch])
const hqB = group(4, '본부B', 1, 1)
const root = group(1, '회사', null, 0, [hqA, hqB])

const ADMINS: Omit<GroupAdminRow, 'isInclude'>[] = [
  { userSeq: 1, codeSeq: 2, codeName: '시스템관리자', userName: '시스템관리자' },
  { userSeq: 3, codeSeq: 3, codeName: '관리자', userName: '김용우' },
  { userSeq: 6, codeSeq: 4, codeName: '매니저', userName: '박매니저' },
  { userSeq: 9, codeSeq: 3, codeName: '관리자', userName: '미할당' },
]

/** 그룹별 할당 → 트리 순서 응답 */
const assigned: Record<number, number[]> = { 1: [1], 2: [3], 3: [3, 6], 4: [] }
const entries = walkGroups(root).map((g) => ({
  group: g,
  rows: ADMINS.map((admin) => ({ ...admin, isInclude: assigned[g.groupSeq].includes(admin.userSeq) })),
}))
const rows = buildAdminRows(entries)
const names = (list: { admin: GroupAdminRow }[]) => list.map((row) => row.admin.userName)

describe('buildAdminRows', () => {
  it('행은 응답 순서 · 담당 그룹은 트리 순서로 모은다', () => {
    expect(names(rows)).toEqual(['시스템관리자', '김용우', '박매니저', '미할당'])
    expect(rows[1].groups.map((g) => g.groupSeq)).toEqual([2, 3])
    expect(rows[3].groups).toEqual([])
  })

  it('응답이 없으면 빈 목록', () => {
    expect(buildAdminRows([])).toEqual([])
  })
})

describe('scopeAdminRows · countAdmins', () => {
  it('🔴 회사(루트)면 미할당까지 전원', () => {
    expect(names(scopeAdminRows(rows, root))).toEqual(['시스템관리자', '김용우', '박매니저', '미할당'])
    expect(countAdmins(rows, root)).toBe(4)
  })

  it('본부는 자기 + 자손 지사 할당 — 두 곳에 있어도 1명', () => {
    expect(names(scopeAdminRows(rows, hqA))).toEqual(['김용우', '박매니저'])
    expect(countAdmins(rows, hqA)).toBe(2)
  })

  it('할당 없는 그룹은 0', () => {
    expect(countAdmins(rows, hqB)).toBe(0)
  })

  it('🔴 Master 트리처럼 루트가 회사가 아니면 할당 기준', () => {
    // 지사 하나만 받은 트리(실측: Master `AdminSiteSelect` 는 할당 그룹만 루트로 준다)
    expect(names(scopeAdminRows(rows, branch))).toEqual(['김용우', '박매니저'])
  })
})

describe('filterAdminRows', () => {
  it('이름 부분 일치 · 앞뒤 공백 무시', () => {
    expect(names(filterAdminRows(rows, ' 용우 ', undefined))).toEqual(['김용우'])
  })

  it('권한 master · manager', () => {
    expect(names(filterAdminRows(rows, '', 'master'))).toEqual(['김용우', '미할당'])
    expect(names(filterAdminRows(rows, '', 'manager'))).toEqual(['박매니저'])
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

  it('첫 그룹 + 외 N개 · 없으면 -', () => {
    expect(adminGroupSummary(root, [hqA, branch])).toBe('본부A 외 1개')
    expect(adminGroupSummary(root, [branch])).toBe('본부A › 지사A1')
    expect(adminGroupSummary(root, [])).toBe('-')
  })

  it('Master 트리 안 경로 — 루트가 회사가 아니어도 그 그룹 이름이 나온다', () => {
    expect(adminGroupLabel(branch, branch)).toBe('지사A1')
  })
})

describe('adminRole', () => {
  it('🔴 codeSeq 로 라벨 — Master 의 codeName "관리자" 를 쓰지 않는다', () => {
    expect(adminRoleLabel(3, '관리자')).toBe('마스터')
    expect(adminRoleLabel(2, '시스템관리자')).toBe('시스템관리자')
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
