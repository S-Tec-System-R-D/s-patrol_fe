import { describe, expect, it } from 'vitest'

import type { GroupListNode, GroupListSite } from '@/features/groups/types/group'
import {
  collectSiteRows,
  countDescendantSites,
  findSite,
  groupOptions,
  groupPathText,
} from '../siteList'

/**
 * 사업장 목록 순수 함수 (`spec 044` T786). 모양은 `GetGroupList` 실측 그대로 — 그룹·사업장 이중 재귀.
 */

const site = (
  siteSeq: number,
  siteName: string,
  address: string | null,
  children: GroupListSite[] = []
): GroupListSite => ({
  siteSeq,
  siteName,
  siteGroupSeq: 0,
  siteGroupName: '',
  address,
  tel: null,
  healthCheckYn: false,
  userCount: 0,
  count: children.length,
  parentSiteSeq: null,
  children: children.map((child) => ({ ...child, parentSiteSeq: siteSeq })),
})

const group = (
  groupSeq: number,
  groupName: string,
  layer: number,
  sites: GroupListSite[],
  children: GroupListNode[] = []
): GroupListNode => ({
  groupSeq,
  groupName,
  parentGroupSeq: layer === 0 ? null : 0,
  layer,
  depth: 0, // 🔴 layer 와 어긋나도 쓰이지 않는다(B-55)
  count: 0,
  sites,
  children,
})

// 회사(1, 사업장 1) ─ 본부(2) ─ 지사(3: 사업장 3 › 4, 사업장 9)
//                 └ 본부(4, 사업장 5)
const ROOT = group(1, '에스텍시스템', 0, [site(1, '강남우체국', '서울 강남구')], [
  group(2, '수도권본부', 1, [], [
    group(3, '강동지사', 2, [
      site(3, '그랜드타워', '서울 강동구 천호대로', [site(4, '그랜드타워 별관', '서울 강동구 양재대로')]),
      site(9, '센트럴플라자', null),
    ]),
  ]),
  group(4, '부산본부', 1, [site(5, '마린시티', '부산 해운대구')]),
])

const names = (rows: ReturnType<typeof collectSiteRows>) => rows.map((row) => `${row.depth}:${row.site.siteName}`)

describe('collectSiteRows — 범위 · 평탄화', () => {
  it('선택 그룹 + 자손 그룹의 사업장을 응답 순서로, 하위 사업장은 depth 1', () => {
    expect(names(collectSiteRows(ROOT, 2))).toEqual(['0:그랜드타워', '1:그랜드타워 별관', '0:센트럴플라자'])
  })

  it('루트면 전부', () => {
    expect(collectSiteRows(ROOT, 1)).toHaveLength(5)
  })

  it('그룹이 없거나 트리에 없으면 루트로 본다', () => {
    expect(collectSiteRows(ROOT, null)).toHaveLength(5)
    expect(collectSiteRows(ROOT, 999)).toHaveLength(5)
  })

  it('행마다 소속 그룹 경로(회사 제외)', () => {
    const rows = collectSiteRows(ROOT, 1)
    expect(rows[0].groupPath).toBe('에스텍시스템')
    expect(rows[1].groupPath).toBe('수도권본부 › 강동지사')
  })
})

describe('collectSiteRows — 검색', () => {
  it('이름 · 주소로 찾는다(대소문자 무시 · 앞뒤 공백 무시)', () => {
    expect(names(collectSiteRows(ROOT, 1, ' 해운대 '))).toEqual(['0:마린시티'])
    expect(names(collectSiteRows(ROOT, 1, '센트럴'))).toEqual(['0:센트럴플라자'])
  })

  it('🔴 하위만 맞으면 모 사업장 행도 남는다', () => {
    expect(names(collectSiteRows(ROOT, 1, '양재대로'))).toEqual(['0:그랜드타워', '1:그랜드타워 별관'])
  })

  it('모 사업장만 맞으면 맞지 않는 하위는 빠진다', () => {
    expect(names(collectSiteRows(ROOT, 1, '천호대로'))).toEqual(['0:그랜드타워'])
  })

  it('주소가 null 이어도 터지지 않는다', () => {
    expect(collectSiteRows(ROOT, 1, '없는말')).toEqual([])
  })
})

describe('findSite · countDescendantSites · groupPathText', () => {
  it('하위 사업장도 찾고 소속 그룹을 준다', () => {
    const found = findSite(ROOT, 4)
    expect(found?.site.siteName).toBe('그랜드타워 별관')
    expect(found?.group.groupSeq).toBe(3)
    expect(findSite(ROOT, 999)).toBeNull()
  })

  it('하위 사업장 수(손자 포함)', () => {
    expect(countDescendantSites(findSite(ROOT, 3)!.site)).toBe(1)
    expect(countDescendantSites(findSite(ROOT, 9)!.site)).toBe(0)
  })

  it('없는 그룹 경로는 빈 문자열', () => {
    expect(groupPathText(ROOT, 999)).toBe('')
  })
})

describe('groupOptions — 소속 그룹 선택지', () => {
  it('🔴 지사(layer 2)만', () => {
    expect(groupOptions(ROOT)).toEqual([{ groupSeq: 3, label: '수도권본부 › 강동지사' }])
  })

  it('지사가 아닌 현재 그룹은 유지용으로 넣는다', () => {
    expect(groupOptions(ROOT, 4).map((option) => option.groupSeq)).toEqual([3, 4])
  })
})
