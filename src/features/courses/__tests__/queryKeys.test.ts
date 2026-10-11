import { describe, expect, it } from 'vitest'

import { courseKeys } from '../queryKeys'
import type { CourseListParams } from '../types'

/**
 * `data-model.md` §8 규약을 코스에서도 고정한다. 지점(`points/__tests__/queryKeys.test.ts`)
 * 과 같은 관심사를 본다 — 규약이 두 도메인에서 같은지가 확인 대상이다.
 */

const params = (overrides: Partial<CourseListParams> = {}): CourseListParams => ({
  siteSeq: 7,
  pageNumber: 1,
  pageSize: 20,
  ...overrides,
})

describe('courseKeys', () => {
  it('목록 키에 siteSeq가 들어간다 — 사업장 전환 시 캐시가 섞이지 않게', () => {
    expect(courseKeys.list(params())).toContain(7)
  })

  it('siteSeq가 다르면 다른 키가 된다', () => {
    expect(courseKeys.list(params({ siteSeq: 7 }))).not.toEqual(
      courseKeys.list(params({ siteSeq: 8 }))
    )
  })

  it('필터가 다르면 다른 키가 된다', () => {
    expect(courseKeys.list(params())).not.toEqual(
      courseKeys.list(params({ searchKey: 'A동' }))
    )
    expect(courseKeys.list(params())).not.toEqual(
      courseKeys.list(params({ switchYn: true }))
    )
  })

  it('목록 키는 lists 접두사로 시작한다 — 무효화가 전파되도록', () => {
    expect(courseKeys.list(params()).slice(0, courseKeys.lists.length)).toEqual([
      ...courseKeys.lists,
    ])
  })

  it('상세 키는 courseSeq로 구분된다', () => {
    expect(courseKeys.detail(3)).toEqual(['course', 3])
    expect(courseKeys.detail(3)).not.toEqual(courseKeys.detail(4))
  })

  it('상세 키는 lists 접두사에 걸리지 않는다 — 따로 무효화해야 한다', () => {
    expect(courseKeys.detail(3)[0]).not.toBe(courseKeys.lists[0])
  })

  it('🔴 편성 후보 키는 목록·상세 무효화에 딸려 들어가지 않는다', () => {
    const candidates = courseKeys.classificationPoints(7)
    expect(candidates[0]).not.toBe(courseKeys.lists[0])
    expect(candidates[0]).not.toBe(courseKeys.detail(3)[0])
  })

  it('편성 후보 키도 사업장별로 갈린다', () => {
    expect(courseKeys.classificationPoints(7)).not.toEqual(
      courseKeys.classificationPoints(8)
    )
  })
})
