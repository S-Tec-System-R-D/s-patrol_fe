import { describe, expect, it } from 'vitest'

import type { GroupNode, SiteNode } from '@/features/auth/types/site'
import {
  canAddChild,
  countSites,
  descendantGroups,
  findGroup,
  groupPath,
  layerName,
  walkGroups,
} from '../groupTree'

/**
 * 관리그룹 트리 순수 함수 (`spec 043` T741). 모양은 `AdminSiteSelect` 실측 그대로 — 그룹·사업장 이중 재귀.
 */

const site = (siteSeq: number, children: SiteNode[] = []): SiteNode => ({
  siteSeq,
  siteName: `사업장${siteSeq}`,
  parentSiteSeq: null,
  children,
})

const group = (
  groupSeq: number,
  layer: number,
  sites: SiteNode[],
  children: GroupNode[] = []
): GroupNode => ({
  groupSeq,
  groupName: `그룹${groupSeq}`,
  parentGroupSeq: layer === 0 ? null : 0,
  layer,
  depth: layer,
  sites,
  children,
})

// 1(회사) ─ 2(본부) ─ 3(지사)
//         └ 4(본부)
const tree = group(1, 0, [site(1)], [
  group(2, 1, [site(2)], [group(3, 2, [site(3, [site(4)]), site(9)])]),
  group(4, 1, [site(5), site(6, [site(7), site(8)])]),
])

describe('groupTree', () => {
  it('깊이 우선(전위) 순회 — 응답 순서 그대로', () => {
    expect(walkGroups(tree).map((g) => g.groupSeq)).toEqual([1, 2, 3, 4])
  })

  it('찾기 · 경로(양끝 포함) · 없으면 null / 빈 배열', () => {
    expect(findGroup(tree, 3)?.groupName).toBe('그룹3')
    expect(findGroup(tree, 99)).toBeNull()
    expect(groupPath(tree, 3).map((g) => g.groupSeq)).toEqual([1, 2, 3])
    expect(groupPath(tree, 1).map((g) => g.groupSeq)).toEqual([1])
    expect(groupPath(tree, 99)).toEqual([])
  })

  it('자손 그룹은 자기를 빼고 센다', () => {
    expect(descendantGroups(tree).map((g) => g.groupSeq)).toEqual([2, 3, 4])
    expect(descendantGroups(findGroup(tree, 3)!)).toEqual([])
  })

  it('🔴 사업장 수 = 자기 + 자손 그룹, 사업장의 children 까지', () => {
    // 3: 사업장 3 · 4(3의 child) · 9 = 3
    expect(countSites(findGroup(tree, 3)!)).toBe(3)
    // 2: 자기 2 + 3의 3개 = 4
    expect(countSites(findGroup(tree, 2)!)).toBe(4)
    // 4: 5 · 6 · 7 · 8 = 4
    expect(countSites(findGroup(tree, 4)!)).toBe(4)
    // 루트: 1 + 4 + 4 = 9
    expect(countSites(tree)).toBe(9)
  })

  it('🔴 단계 이름 · 하위 추가는 지사(layer 2) 미만에서만 — 서버는 깊이를 막지 않는다(B-49)', () => {
    expect([0, 1, 2].map(layerName)).toEqual(['회사', '본부', '지사'])
    expect(layerName(3)).toBe('')
    expect(canAddChild(tree)).toBe(true)
    expect(canAddChild(findGroup(tree, 2)!)).toBe(true)
    expect(canAddChild(findGroup(tree, 3)!)).toBe(false)
  })
})
