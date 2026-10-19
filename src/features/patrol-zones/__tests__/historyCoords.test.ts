import { describe, expect, it } from 'vitest'

import type { CourseDetailPoint } from '@/features/courses/types'
import type { CheckDetailRow } from '@/features/course-history/types'

import { historyPins } from '../lib/historyCoords'

/**
 * 순찰이력 지도 좌표 병합 (`spec 036` T516·T519).
 *
 * 🔴 **이 테스트가 세 결정을 고정한다**: 조인 키는 `pointSeq`(`orderNo` 아님) · 핀 번호는
 * `orderNo`(배열 위치 아님) · 핀 종류는 `status`(좌표 출처 아님). 셋 다 틀리면 **에러 없이
 * 그럴듯한 지도**가 나온다.
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

describe('historyPins — 좌표 출처 (🔴 등록 좌표가 1순위)', () => {
  it('🔴 등록 좌표를 먼저 쓴다 — 인증한 지점이어도 **지점 자리**에 찍는다', () => {
    // 이 지도는 "코스가 이렇게 구성돼 있고 어디가 인증됐나" 를 보여준다(사용자 결정).
    // 인증 좌표는 근무자가 버튼을 누른 위치라 지점에서 어긋나 있다 — 쓰면 코스 모양이 틀어진다
    const { pins, missing } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      [coursePoint()]
    )

    expect(missing).toBe(0)
    expect(pins[0]).toMatchObject({ lat: 37.49, lng: 127.07, source: 'point' })
  })

  it('🔴 미인증 행도 같은 등록 좌표에 찍힌다 — 색만 다르다', () => {
    const { pins } = historyPins([row()], [coursePoint()])

    expect(pins[0]).toMatchObject({ lat: 37.49, lng: 127.07, source: 'point', kind: 'norecord' })
  })

  it('등록 좌표가 없으면 인증 좌표로 폴백한다 — 핀을 잃지 않는다', () => {
    const { pins, missing } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      [coursePoint({ gpsLat: null, gpsLng: null })]
    )

    expect(missing).toBe(0)
    // 🔴 source 가 'check' 다 — 호출부가 "지점 자리가 아니다" 를 라벨에 적는다
    expect(pins[0]).toMatchObject({ lat: 37.5, lng: 127.1, source: 'check' })
  })

  it('🔴 둘 다 없으면 제외하고 missing 으로 센다', () => {
    const { pins, missing } = historyPins([row()], [coursePoint({ gpsLat: null, gpsLng: null })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('🔴 현재 편성에서 빠진 지점은 등록 좌표를 구할 수 없다', () => {
    // 회차는 과거고 GetCourseDetail 은 현재 편성이다 — 그 뒤 빠진 지점은 좌표가 없다
    const { pins, missing } = historyPins([row({ pointSeq: 99 })], [coursePoint({ pointSeq: 11 })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('🔴 편성이 아직 안 왔으면 코스 모양이 불완전하다 — 인증 좌표 핀만 나온다', () => {
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

  it('🔴 등록 좌표가 범위 밖이면 **인증 좌표로 내려간다** — 버리지 않는다', () => {
    // 지점이 어디인지는 대략이라도 알 수 있다. 그걸 아는 것이 지도의 값어치다
    const { pins } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      [coursePoint({ gpsLat: 123, gpsLng: 57.22 })]
    )

    expect(pins[0]).toMatchObject({ lat: 37.5, lng: 127.1, source: 'check' })
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

describe('historyPins — 🔴 핀 3종 (사용자 결정 2026-10-19)', () => {
  it('완료(4) → checked', () => {
    const { pins } = historyPins(
      [row({ status: 4, checkDt: '2026-05-01T10:06:00', authMethod: 9, gpsLat: 37.5, gpsLng: 127.1 })],
      []
    )

    expect(pins[0].kind).toBe('checked')
  })

  it('🔴 미완료(3) + checkDt 있음 → incomplete — **갔는데 인증이 안 됐다**', () => {
    // 실측 124건이 79 / 45 로 갈린다. 관리자가 할 일이 다르다(순찰 누락 vs 태그·단말 문제)
    const { pins } = historyPins(
      [row({ status: 3, checkDt: '2026-05-01T10:06:00' })],
      [coursePoint()]
    )

    expect(pins[0].kind).toBe('incomplete')
  })

  it('🔴 미완료(3) + checkDt 없음 → norecord — 아예 가지 않았다', () => {
    const { pins } = historyPins([row({ status: 3, checkDt: null })], [coursePoint()])

    expect(pins[0].kind).toBe('norecord')
  })

  it('🔴 대기중(0)·진행중(1)·순찰제외(2)도 norecord 다 — 빨갛게 칠하지 않는다', () => {
    // 진행 중인 회차에서 아직 안 간 지점을 danger 로 칠하면 **없는 문제를 만든다**
    const statuses = [0, 1, 2]
    statuses.forEach((status) => {
      const { pins } = historyPins([row({ status })], [coursePoint()])
      expect(pins[0].kind).toBe('norecord')
    })
  })

  it('🔴 kind 는 좌표 출처와 독립이다 (OQ-16)', () => {
    // historySeq 13 의 detailSeq 24·25·26 — 완료인데 authMethod·좌표·순찰자가 전부 null
    const { pins } = historyPins(
      [row({ status: 4, checkDt: '2026-07-16T10:15:14' })],
      [coursePoint()]
    )

    // 좌표는 폴백했지만 종류는 완료다 — 회색이면 "미인증" 으로 읽혀 거짓이 된다
    expect(pins[0]).toMatchObject({ source: 'point', kind: 'checked' })
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

  /**
   * ✅ **OQ-15 해소(2026-10-19)** — 규칙이 뒤집혔다. `checkDt` 는 지점 인증 시간이다.
   * 🔴 **시각과 수단은 따로 움직인다** — 미완료 45건은 `authMethod` 가 **0/45** 라
   * 시각만 남는다(실측).
   */
  it('✅ 미완료 행도 시각은 올린다 — 수단만 null 로 남는다 (OQ-15 해소)', () => {
    const { pins } = historyPins(
      [row({ status: 3, checkDt: '2026-05-01T10:06:00', authMethod: null })],
      [coursePoint()]
    )

    expect(pins[0]).toMatchObject({ checkedAt: '2026-05-01T10:06:00', authMethod: null })
  })

  it('checkDt 가 null 이면 시각도 null 이다', () => {
    const { pins } = historyPins([row({ status: 3, checkDt: null })], [coursePoint()])

    expect(pins[0]).toMatchObject({ checkedAt: null, authMethod: null })
  })
})
