import { describe, expect, it } from 'vitest'

import { buildCourseAlerts, uncheckedByPoint } from '../courseAlerts'
import type { CourseHistoryRow, PointHistoryRow } from '../../types'

/**
 * 이상 이력 모으기 (`spec 023` 코스 상세 C단).
 *
 * 🔴 **고정하는 것은 겹침·빈 값이다**: 한 순찰이 미완료이면서 초과인 경우, 근무자 없는
 * 이력, 잘라내기 전 전체 건수. 컴포넌트 안에서는 이것들을 시험할 수 없어 꺼냈다.
 */

const run = (overrides: Partial<CourseHistoryRow> = {}): CourseHistoryRow => ({
  historySeq: 1,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: '2026-10-11T02:40:00',
  endDt: '2026-10-11T03:24:00',
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:44:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

const unchecked = (overrides: Partial<PointHistoryRow> = {}): PointHistoryRow => ({
  detailSeq: 900,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  pointSeq: 3,
  pointName: '옥상 출입문',
  checkDt: '2026-10-10T03:00:00',
  userSeq: 22,
  userName: '정우현',
  authMethod: 9,
  authMethodName: 'QR',
  status: 3,
  statusName: '미완료',
  overTimeYn: false,
  hasMemo: false,
  pauseTime: '00:00:00',
  ...overrides,
})

describe('buildCourseAlerts — 모으기', () => {
  it('미인증 지점을 지점명으로 적는다', () => {
    const { items } = buildCourseAlerts([], [unchecked()])

    expect(items[0].title).toBe('옥상 출입문 미인증')
    expect(items[0].meta).toBe('정우현')
    expect(items[0].kind).toBe('unchecked')
  })

  it('미완료 순찰은 인증 수를 함께 적는다', () => {
    const { items } = buildCourseAlerts([run({ status: 2, checkedCount: 1 })], [])

    expect(items[0].title).toBe('순찰 미완료')
    expect(items[0].meta).toBe('박성민 · 인증 1/3')
  })

  it('🔴 초과는 소요시간을 적는다 — "기준 대비 +n분" 은 적지 않는다', () => {
    // 기준(`totalMin`)은 **지금 값**이고 이력은 과거다. 편성을 바꾸면 과거 순찰의
    // 초과량이 따라 바뀌어 거짓이 된다
    const { items } = buildCourseAlerts([run({ overtimeYn: true, actualElapsedTime: '02:17:40' })], [])

    expect(items[0].title).toBe('소요시간 초과')
    expect(items[0].meta).toContain('2시간 18분 소요')
    expect(items[0].meta).not.toContain('기준')
  })

  it('정상 순찰은 들어가지 않는다', () => {
    expect(buildCourseAlerts([run()], []).totalCount).toBe(0)
  })
})

describe('buildCourseAlerts — 🔴 겹침', () => {
  it('🔴 미완료이면서 초과면 **두 건**이다 — 합치면 하나가 가려진다', () => {
    const { items, totalCount } = buildCourseAlerts([run({ status: 2, overtimeYn: true })], [])

    expect(totalCount).toBe(2)
    expect(items.map((item) => item.kind).sort()).toEqual(['incomplete', 'overtime'])
    // 🔴 key 가 겹치면 React 가 행을 잘못 재사용한다
    expect(new Set(items.map((item) => item.key)).size).toBe(2)
  })

  it('같은 지점이 여러 번 미인증이면 각각 들어간다', () => {
    const { totalCount } = buildCourseAlerts(
      [],
      [unchecked({ detailSeq: 901 }), unchecked({ detailSeq: 902 })]
    )

    expect(totalCount).toBe(2)
  })
})

describe('buildCourseAlerts — 🔴 빈 값', () => {
  it('🔴 근무자 없는 이력도 들어간다 — 비어 있다고 적는다', () => {
    const { items } = buildCourseAlerts([run({ status: 2, userList: [] })], [])

    expect(items[0].meta).toContain('근무자 기록 없음')
    expect(items[0].meta).not.toContain('undefined')
  })

  it('미인증 행의 근무자 이름이 비어도 깨지지 않는다', () => {
    const { items } = buildCourseAlerts([], [unchecked({ userName: '  ' })])

    expect(items[0].meta).toBe('근무자 기록 없음')
  })
})

describe('buildCourseAlerts — 정렬·자르기', () => {
  it('최근 순이다', () => {
    const { items } = buildCourseAlerts(
      [run({ historySeq: 2, status: 2, startDt: '2026-10-01T01:00:00' })],
      [unchecked({ checkDt: '2026-10-09T01:00:00' })]
    )

    expect(items.map((item) => item.kind)).toEqual(['unchecked', 'incomplete'])
  })

  it('🔴 자르기 전 전체 건수를 따로 준다 — 6건만 보고 "이상 6건" 으로 읽으면 안 된다', () => {
    const runs = Array.from({ length: 10 }, (_, index) =>
      run({ historySeq: index + 1, status: 2, startDt: `2026-10-${String(index + 1).padStart(2, '0')}T01:00:00` })
    )

    const { items, totalCount } = buildCourseAlerts(runs, [], 6)

    expect(totalCount).toBe(10)
    expect(items).toHaveLength(6)
  })
})

describe('buildCourseAlerts — 🔴 사유를 만들지 않는다', () => {
  it('🔴 메모는 **있다는 사실만** 전한다 — 내용은 상세 조회에만 있다', () => {
    const { items } = buildCourseAlerts([], [unchecked({ hasMemo: true })])

    expect(items[0].hasMemo).toBe(true)
    // 🔴 사유 문구를 지어 넣지 않는다. 실측된 메모는 "[조명 고장] [누수]" 류의
    // 키워드 조합이고 "왜 미인증인지" 가 아니다(A1)
    expect(items[0].meta).not.toMatch(/스캔|종료|사유/)
  })
})

/**
 * 🔴 **미인증 지점별 분포** (`spec 031`).
 *
 * `미인증 8건` 이 한 지점에서 8번인지 여덟 지점에서 한 번씩인지는 **완전히 다른 상황**이다 —
 * 전자는 그 지점을, 후자는 코스 운영을 봐야 한다.
 */
describe('uncheckedByPoint', () => {
  it('지점별로 묶고 많은 순으로 준다', () => {
    const result = uncheckedByPoint([
      unchecked({ pointName: '엘리베이터홀 A' }),
      unchecked({ pointName: '지하 B1' }),
      unchecked({ pointName: '엘리베이터홀 A' }),
      unchecked({ pointName: '엘리베이터홀 A' }),
    ])

    expect(result).toEqual([
      { label: '엘리베이터홀 A', value: 3 },
      { label: '지하 B1', value: 1 },
    ])
  })

  it('🔴 동률이면 지점명 순 — 렌더마다 순서가 바뀌면 눈이 쫓아간다', () => {
    const result = uncheckedByPoint([
      unchecked({ pointName: '나 지점' }),
      unchecked({ pointName: '가 지점' }),
    ])

    expect(result.map((item) => item.label)).toEqual(['가 지점', '나 지점'])
  })

  it('🔴 이름이 비어도 버리지 않는다 — 빼면 합이 총계와 어긋난다', () => {
    const result = uncheckedByPoint([unchecked({ pointName: '  ' }), unchecked({ pointName: 'A' })])

    expect(result.reduce((sum, item) => sum + item.value, 0)).toBe(2)
    expect(result.some((item) => item.label === '이름 없음')).toBe(true)
  })

  it('0건이면 빈 배열이다 — 호출부가 바를 그리지 않는다', () => {
    expect(uncheckedByPoint([])).toEqual([])
  })
})
