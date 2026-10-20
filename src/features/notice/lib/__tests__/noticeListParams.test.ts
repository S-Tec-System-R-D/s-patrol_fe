import { describe, expect, it } from 'vitest'

import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'
import { ALL_VALUE } from '@/lib/listQuery'
import { toNoticeListParams } from '../noticeListParams'

/**
 * URL 쿼리 → `GetNoticeList` 파라미터 변환 (`spec 026` T572).
 *
 * 🔴 헬퍼 자체(`clampPageSize`·`orderRange`·`parsePageNumber`)는 `courseHistoryListParams.test.ts`
 * 가 이미 고정했다. 여기서는 **변환 함수를 거쳐도 그 규약이 지켜지는지**만 본다.
 */

describe('toNoticeListParams', () => {
  it('URL 키를 서버 파라미터 이름으로 옮긴다', () => {
    expect(
      toNoticeListParams(7, {
        q: '점검',
        from: '2026-05-01',
        to: '2026-05-31',
        page: '2',
        size: '50',
      })
    ).toEqual({
      siteSeq: 7,
      fromDt: '2026-05-01',
      toDt: '2026-05-31',
      keyword: '점검',
      pageNumber: 2,
      pageSize: 50,
    })
  })

  it('빈 값·"전체"·공백만은 키를 보내지 않는다', () => {
    const params = toNoticeListParams(7, { q: '   ', from: '', to: ALL_VALUE })
    expect(params.keyword).toBeUndefined()
    expect(params.fromDt).toBeUndefined()
    expect(params.toDt).toBeUndefined()
  })

  it('키워드 앞뒤 공백을 지운다', () => {
    expect(toNoticeListParams(7, { q: '  점검 ' }).keyword).toBe('점검')
  })

  it(`pageSize 는 ${MAX_PAGE_SIZE} 를 넘지 않는다`, () => {
    expect(toNoticeListParams(7, { size: '200' }).pageSize).toBe(MAX_PAGE_SIZE)
  })

  it('페이지는 1-based 이고 깨진 값은 1 로 수렴한다', () => {
    expect(toNoticeListParams(7, {}).pageNumber).toBe(1)
    expect(toNoticeListParams(7, { page: '0' }).pageNumber).toBe(1)
    expect(toNoticeListParams(7, { page: 'abc' }).pageNumber).toBe(1)
  })

  it('뒤집힌 기간은 순서를 바로잡는다(서버는 에러 없이 0건을 준다)', () => {
    const params = toNoticeListParams(7, { from: '2026-05-31', to: '2026-05-01' })
    expect(params.fromDt).toBe('2026-05-01')
    expect(params.toDt).toBe('2026-05-31')
  })

  it('형식이 틀린 날짜는 필터를 걸지 않는다', () => {
    expect(toNoticeListParams(7, { from: '2026/05/01' }).fromDt).toBeUndefined()
  })
})
