import { describe, expect, it } from 'vitest'

import { ALL_VALUE } from '@/lib/listQuery'
import { MAX_PAGE_SIZE } from '../courseHistoryListParams'
import { toPointHistoryListParams } from '../pointHistoryListParams'

/**
 * URL 쿼리 → `GetPointHistory` 파라미터 변환 (`spec 037` T534).
 *
 * 🔴 **헬퍼 자체는 여기서 다시 테스트하지 않는다** — `clampPageSize`·`orderRange`·
 * `parsePageNumber` 는 `courseHistoryListParams.test.ts` 가 이미 고정한 **같은 함수**다.
 * 사본이 아니라 import 라는 것이 이 파일의 전제이고, 아래 "변환 함수를 거치면" 테스트가
 * 그 전제를 지킨다.
 */

describe('toPointHistoryListParams', () => {
  it('필터 4종 + 순찰자 검색을 서버 파라미터 이름으로 옮긴다', () => {
    const params = toPointHistoryListParams(7, {
      from: '2026-05-01',
      to: '2026-05-07',
      course: '12',
      auth: '9',
      result: '4',
      user: '박지우',
      page: '2',
      size: '15',
    })
    expect(params).toEqual({
      siteSeq: 7,
      fromDt: '2026-05-01',
      toDt: '2026-05-07',
      courseSeq: 12,
      authMethod: 9,
      status: 4,
      userName: '박지우',
      pageNumber: 2,
      pageSize: 15,
    })
  })

  it('🔴 "전체"와 빈 값은 키 자체를 보내지 않는다', () => {
    // "전체" 는 값이 아니라 필터 해제다(018 규약)
    const params = toPointHistoryListParams(7, {
      course: ALL_VALUE,
      auth: ALL_VALUE,
      result: '',
      user: '  ',
    })
    expect(params.courseSeq).toBeUndefined()
    expect(params.authMethod).toBeUndefined()
    expect(params.status).toBeUndefined()
    expect(params.userName).toBeUndefined()
  })

  it('🔴 변환 함수를 거치면 pageSize 상한을 넘길 수 없다', () => {
    // spec 027 이 200 을 보내 실서버 조회가 통째로 400 이었고 화면에는 빈 상태가 떴다
    expect(toPointHistoryListParams(7, { size: '500' }).pageSize).toBe(MAX_PAGE_SIZE)
  })

  it('🔴 기간이 뒤집혀 들어오면 swap 한다', () => {
    // from > to 는 에러가 아니라 200 + 0건이다 — 빈 목록이 "기록 없음" 으로 읽힌다
    const params = toPointHistoryListParams(7, { from: '2026-05-07', to: '2026-05-01' })
    expect(params.fromDt).toBe('2026-05-01')
    expect(params.toDt).toBe('2026-05-07')
  })

  it('🔴 사전에 없는 결과·인증수단 코드도 통과시킨다', () => {
    // 목록에 실재하는 status 는 3·4 뿐이지만, 모르는 코드를 우리가 막으면 서버에 있는
    // 상태를 걸러 버린다(A1 — 코스 쪽 eventType 과 같은 판단)
    expect(toPointHistoryListParams(7, { result: '2' }).status).toBe(2)
    expect(toPointHistoryListParams(7, { auth: '11' }).authMethod).toBe(11)
  })

  it('정수가 아닌 필터는 미적용', () => {
    expect(toPointHistoryListParams(7, { course: 'abc' }).courseSeq).toBeUndefined()
    expect(toPointHistoryListParams(7, { auth: 'QR' }).authMethod).toBeUndefined()
  })

  it('🔴 목록은 pointSeq 를 받지 않는다 — 좁히는 쪽은 라우트 파라미터에서 온다', () => {
    const params = toPointHistoryListParams(7, { page: '1' })
    expect(params.pointSeq).toBeUndefined()
  })
})
