import { describe, expect, it } from 'vitest'

import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'
import { ALL_VALUE } from '@/lib/listQuery'
import { toUserListParams } from '../userListParams'

/** URL 쿼리 → `UserList` 파라미터 변환 (`spec 038` T601) */

describe('toUserListParams', () => {
  it('🔴 사업장은 siteSeq 가 아니라 siteId 로 나간다 (B-12)', () => {
    const params = toUserListParams(6, {})
    expect(params.siteId).toBe(6)
    expect(params).not.toHaveProperty('siteSeq')
  })

  it('URL 키를 서버 파라미터 이름으로 옮긴다', () => {
    expect(
      toUserListParams(6, { q: '김', role: '7', work: 'true', page: '2', size: '50' })
    ).toEqual({
      siteId: 6,
      searchKey: '김',
      codeSeq: 7,
      workYn: true,
      pageNumber: 2,
      pageSize: 50,
    })
  })

  it('근무 상태는 true/false 만 인정하고 그 외는 키를 뺀다', () => {
    expect(toUserListParams(6, { work: 'false' }).workYn).toBe(false)
    expect(toUserListParams(6, { work: ALL_VALUE }).workYn).toBeUndefined()
    expect(toUserListParams(6, { work: 'yes' }).workYn).toBeUndefined()
  })

  it('빈 값·"전체"·깨진 권한은 키를 보내지 않는다', () => {
    const params = toUserListParams(6, { q: '  ', role: ALL_VALUE })
    expect(params.searchKey).toBeUndefined()
    expect(params.codeSeq).toBeUndefined()
    expect(toUserListParams(6, { role: 'abc' }).codeSeq).toBeUndefined()
  })

  it(`pageSize 는 ${MAX_PAGE_SIZE} 를 넘지 않고 페이지는 1-based 로 수렴한다`, () => {
    expect(toUserListParams(6, { size: '500' }).pageSize).toBe(MAX_PAGE_SIZE)
    expect(toUserListParams(6, { page: '0' }).pageNumber).toBe(1)
    expect(toUserListParams(6, { page: 'x' }).pageNumber).toBe(1)
  })
})
