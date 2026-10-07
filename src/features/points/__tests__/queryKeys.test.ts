import { describe, expect, it } from 'vitest'

import { pointKeys } from '../queryKeys'
import type { PointListParams } from '../types'

const params = (overrides: Partial<PointListParams> = {}): PointListParams => ({
  siteSeq: 7,
  pageNumber: 1,
  pageSize: 20,
  ...overrides,
})

describe('pointKeys', () => {
  it('목록 키에 siteSeq가 들어간다 — 사업장 전환 시 캐시가 섞이지 않게', () => {
    expect(pointKeys.list(params())).toContain(7)
  })

  it('siteSeq가 다르면 다른 키가 된다', () => {
    expect(pointKeys.list(params({ siteSeq: 7 }))).not.toEqual(
      pointKeys.list(params({ siteSeq: 8 }))
    )
  })

  it('필터가 다르면 다른 키가 된다', () => {
    expect(pointKeys.list(params())).not.toEqual(
      pointKeys.list(params({ searchKey: '정문' }))
    )
  })

  it('목록 키는 lists 접두사로 시작한다 — 무효화가 전파되도록', () => {
    expect(pointKeys.list(params()).slice(0, pointKeys.lists.length)).toEqual([
      ...pointKeys.lists,
    ])
  })

  it('상세 키는 pointSeq로 구분된다', () => {
    expect(pointKeys.detail(3)).toEqual(['point', 3])
    expect(pointKeys.detail(3)).not.toEqual(pointKeys.detail(4))
  })

  it('상세 키는 lists 접두사에 걸리지 않는다 — 따로 무효화해야 한다', () => {
    expect(pointKeys.detail(3)[0]).not.toBe(pointKeys.lists[0])
  })
})
