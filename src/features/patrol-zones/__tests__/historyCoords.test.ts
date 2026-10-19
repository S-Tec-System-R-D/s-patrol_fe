import { describe, expect, it } from 'vitest'

import type { CourseDetailPoint } from '@/features/courses/types'
import type { CheckDetailRow } from '@/features/course-history/types'

import { historyPins } from '../lib/historyCoords'

/**
 * 순찰이력 지도 좌표 병합 (`spec 036` T516·T519).
 *
 * 🔴 **이 테스트가 두 결정을 고정한다**: 조인 키는 `pointSeq`(`orderNo` 아님) · 핀 색은
 * `status`(좌표 출처 아님). 둘 다 틀리면 **에러 없이 그럴듯한 지도**가 나온다.
 */

/** 기본은 **미인증 행**이다 — 실측상 그게 주경로다(166행 중 132행) */
const row = (over: Partial<CheckDetailRow> = {}): CheckDetailRow => ({
  detailSeq: 1,
  pointSeq: 11,
  pointName: '정문',
  status: 3,
  checkDt: null,
  authMethod: null,
  checkUserSeq: null,
  userName: null,
  orderNo: 1,
  gpsLat: null,
  gpsLng: null,
  overtimeYn: null,
  memos: [],
  ...over,
})

const coursePoint = (over: Partial<CourseDetailPoint> = {}): CourseDetailPoint => ({
  coursePointSeq: 101,
  pointSeq: 11,
  pointName: '정문',
  authMethod: 9,
  orderNo: 1,
  useYn: true,
  courseMin: 0,
  gpsLat: 37.49,
  gpsLng: 127.07,
  ...over,
})

describe('historyPins — 좌표 출처', () => {
  it('인증 좌표가 있으면 그것을 쓴다(source: check)', () => {
    const { pins, missing } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      [coursePoint()]
    )

    expect(missing).toBe(0)
    expect(pins).toHaveLength(1)
    expect(pins[0]).toMatchObject({ lat: 37.5, lng: 127.1, source: 'check' })
  })

  it('🔴 미인증 행은 **등록 좌표로 채워진다**(source: point)', () => {
    // 인증하지 않으면 인증 좌표를 서버에 저장하지 않는다 — 원시 지점 좌표를 쓴다
    const { pins, missing } = historyPins([row()], [coursePoint()])

    expect(missing).toBe(0)
    expect(pins[0]).toMatchObject({ lat: 37.49, lng: 127.07, source: 'point', checked: false })
  })

  it('🔴 둘 다 없으면 제외하고 missing 으로 센다', () => {
    const { pins, missing } = historyPins([row()], [coursePoint({ gpsLat: null, gpsLng: null })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('🔴 현재 편성에서 빠진 지점도 missing 이다', () => {
    // 회차는 과거고 GetCourseDetail 은 현재 편성이다 — 그 뒤 빠진 지점은 좌표를 구할 길이 없다
    const { pins, missing } = historyPins([row({ pointSeq: 99 })], [coursePoint({ pointSeq: 11 })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('편성이 아직 안 왔으면(빈 배열) 인증 좌표가 있는 핀만 나온다', () => {
    const rows = [row({ gpsLat: 37.5, gpsLng: 127.1 }), row({ detailSeq: 2, orderNo: 2 })]
    const { pins, missing } = historyPins(rows, [])

    expect(pins).toHaveLength(1)
    expect(missing).toBe(1)
  })

  it('좌표가 하나도 없으면 pins 가 비어 호출부가 지도를 그리지 않는다', () => {
    const { pins } = historyPins([row(), row({ detailSeq: 2, orderNo: 2 })], [])

    expect(pins).toHaveLength(0)
  })
})

describe('historyPins — 범위 검사 (B-33)', () => {
  it('🔴 범위 밖 등록 좌표는 탈락한다 — gpsLat: 123 이 서버에 실재한다', () => {
    const { pins, missing } = historyPins([row()], [coursePoint({ gpsLat: 123, gpsLng: 57.22 })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('🔴 인증 좌표가 범위 밖이면 **등록 좌표로 내려간다** — 버리지 않는다', () => {
    // 지점이 어디인지는 여전히 알 수 있다. 그걸 아는 것이 지도의 값어치다
    const { pins } = historyPins([row({ gpsLat: 123, gpsLng: 127.1 })], [coursePoint()])

    expect(pins[0]).toMatchObject({ lat: 37.49, lng: 127.07, source: 'point' })
  })

  it('NaN·무한대·경계값을 가른다', () => {
    const bad = historyPins([row({ gpsLat: NaN, gpsLng: 127 })], [])
    expect(bad.missing).toBe(1)

    const infinite = historyPins([row({ gpsLat: 37.5, gpsLng: Infinity })], [])
    expect(infinite.missing).toBe(1)

    const edge = historyPins([row({ gpsLat: 90, gpsLng: -180 })], [])
    expect(edge.pins).toHaveLength(1)
  })
})

describe('historyPins — 🔴 조인 키는 pointSeq 다', () => {
  it('orderNo 가 아니라 pointSeq 로 등록 좌표를 찾는다', () => {
    // 순찰 뒤 편성이 재배치된 코스: orderNo 로 맞추면 옥상이 창고 좌표를 집는다
    const rows = [row({ detailSeq: 1, pointSeq: 13, pointName: '옥상', orderNo: 3 })]
    const points = [
      coursePoint({ pointSeq: 14, pointName: '창고', orderNo: 3, gpsLat: 37.6, gpsLng: 127.2 }),
      coursePoint({ pointSeq: 13, pointName: '옥상', orderNo: 5, gpsLat: 37.49, gpsLng: 127.07 }),
    ]

    const { pins } = historyPins(rows, points)

    expect(pins[0]).toMatchObject({ name: '옥상', lat: 37.49, lng: 127.07 })
  })

  it('pointSeq 가 중복돼도 같은 지점이라 좌표가 같다 — 충돌이 무해하다', () => {
    const points = [coursePoint({ coursePointSeq: 101 }), coursePoint({ coursePointSeq: 102 })]
    const { pins } = historyPins([row()], points)

    expect(pins[0]).toMatchObject({ lat: 37.49, lng: 127.07 })
  })
})

describe('historyPins — 🔴 핀 번호는 orderNo 다', () => {
  it('인증 내역 표와 같은 번호를 쓴다 — 배열 위치로 다시 매기지 않는다', () => {
    const rows = [
      row({ detailSeq: 1, pointSeq: 11, orderNo: 1, gpsLat: 37.5, gpsLng: 127.1 }),
      row({ detailSeq: 2, pointSeq: 12, orderNo: 2 }),
      row({ detailSeq: 3, pointSeq: 13, orderNo: 3, gpsLat: 37.52, gpsLng: 127.12 }),
    ]
    // 2번 지점만 좌표가 없다
    const { pins, missing } = historyPins(rows, [])

    expect(missing).toBe(1)
    // 🔴 빠진 지점도 번호를 차지한다 — 3번이 2번으로 당겨지지 않는다
    expect(pins.map((pin) => pin.order)).toEqual([1, 3])
  })

  it('orderNo 순서로 정렬한다 — 응답 순서를 믿지 않는다', () => {
    const rows = [
      row({ detailSeq: 1, pointSeq: 11, orderNo: 3, gpsLat: 37.5, gpsLng: 127.1 }),
      row({ detailSeq: 2, pointSeq: 12, orderNo: 1, gpsLat: 37.51, gpsLng: 127.11 }),
    ]
    const { pins } = historyPins(rows, [])

    expect(pins.map((pin) => pin.order)).toEqual([1, 3])
  })
})

describe('historyPins — 🔴 핀 색은 status 가 정한다 (OQ-16)', () => {
  it('완료(4)인데 좌표가 null 인 행은 등록 좌표를 쓰면서도 **인증 핀으로 남는다**', () => {
    // historySeq 13 의 detailSeq 24·25·26 — 완료인데 authMethod·좌표·순찰자가 전부 null
    const { pins } = historyPins(
      [row({ status: 4, checkDt: '2026-07-16T10:15:14' })],
      [coursePoint()]
    )

    // 좌표는 폴백했지만 색은 완료다 — 회색이면 "미인증" 으로 읽혀 거짓이 된다
    expect(pins[0]).toMatchObject({ source: 'point', checked: true })
  })

  it('대기중(0)·진행중(1)·미완료(3)는 회색이다', () => {
    const statuses = [0, 1, 3]
    statuses.forEach((status) => {
      const { pins } = historyPins([row({ status })], [coursePoint()])
      expect(pins[0].checked).toBe(false)
    })
  })
})

describe('historyPins — 라벨 (OQ-15)', () => {
  it('인증이 찍힌 행만 시각·수단을 올린다', () => {
    const { pins } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      []
    )

    expect(pins[0]).toMatchObject({ checkedAt: '2026-05-01T10:06:00', authMethod: 9 })
  })

  it('🔴 미완료 행의 checkDt 는 올리지 않는다 — 인증한 것처럼 보인다', () => {
    // 45건이 값을 갖는데 코스 endDt 와 같은 것이 12건·다른 것이 33건이라 의미가 미확정이다
    const { pins } = historyPins(
      [row({ status: 3, checkDt: '2026-05-01T10:06:00', authMethod: null })],
      [coursePoint()]
    )

    expect(pins[0]).toMatchObject({ checkedAt: null, authMethod: null })
  })
})
