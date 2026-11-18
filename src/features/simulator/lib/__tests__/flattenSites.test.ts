import { describe, expect, it } from 'vitest'
import type { GroupNode } from '@/features/auth/types/site'
import { flattenSites } from '../flattenSites'

const tree: GroupNode = {
  groupSeq: 1,
  groupName: '에스텍시스템',
  parentGroupSeq: null,
  layer: 0,
  depth: 0,
  sites: [{ siteSeq: 1, siteName: '강남우체국', parentSiteSeq: null, children: [] }],
  children: [
    {
      groupSeq: 14,
      groupName: '시스템개발연구소',
      parentGroupSeq: 1,
      layer: 1,
      depth: 1,
      sites: [],
      children: [
        {
          groupSeq: 15,
          groupName: '본부직할',
          parentGroupSeq: 14,
          layer: 2,
          depth: 2,
          sites: [
            {
              siteSeq: 6,
              siteName: '테스트 사업장2',
              parentSiteSeq: null,
              children: [{ siteSeq: 7, siteName: '2-1', parentSiteSeq: 6, children: [] }],
            },
            { siteSeq: 34, siteName: 'WEB 테스트 사업장', parentSiteSeq: null, children: [] },
          ],
          children: [],
        },
      ],
    },
  ],
}

describe('flattenSites', () => {
  it('그룹 트리를 나온 순서대로 사업장 목록으로 편다', () => {
    expect(flattenSites(tree).map((site) => site.siteSeq)).toEqual([1, 6, 7, 34])
  })

  it('그룹 경로를 위에서부터 이어 붙인다', () => {
    const site = flattenSites(tree).find((item) => item.siteSeq === 34)
    expect(site?.groupPath).toBe('에스텍시스템 / 시스템개발연구소 / 본부직할')
  })

  it('하위 사업장은 모 사업장 이름을 갖고 같은 그룹 경로를 쓴다', () => {
    const child = flattenSites(tree).find((item) => item.siteSeq === 7)
    expect(child).toMatchObject({
      siteName: '2-1',
      parentSiteName: '테스트 사업장2',
      groupPath: '에스텍시스템 / 시스템개발연구소 / 본부직할',
    })
  })
})
