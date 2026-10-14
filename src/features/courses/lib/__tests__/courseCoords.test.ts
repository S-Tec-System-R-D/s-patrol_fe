import { describe, expect, it } from 'vitest'

import { usableCoords } from '../courseCoords'
import type { CourseDetailPoint } from '../../types'

/**
 * 지도에 찍을 좌표 고르기 (`spec 032` T477).
 *
 * 🔴 **지도보다 먼저 고정한다.** 지도를 붙인 뒤에 여기를 만들면 "핀이 안 보이는 이유" 가
 * 좌표인지 타일인지 키인지 구분할 수 없다.
 *
 * 🔴🔴 **범위 검사는 우리 몫이다**(B-33). 서버에 `gpsLat: 123` 이 **실제로 저장돼 있다** —
 * 그대로 넘기면 핀이 날아가고 `fitBounds` 가 지구 반대편까지 벌어진다.
 */

const point = (over: Partial<CourseDetailPoint> = {}): CourseDetailPoint => ({
  coursePointSeq: 1,
  pointSeq: 1,
  pointName: '정문 입구',
  gpsLat: 37.4938925,
  gpsLng: 127.0779625,
  authMethod: 9,
  orderNo: 1,
  useYn: true,
  courseMin: 10,
  ...over,
})

describe('usableCoords — 고르기', () => {
  it('좌표가 있는 지점만 핀으로 만든다', () => {
    const { pins, missing } = usableCoords([
      point({ orderNo: 1, pointName: 'A' }),
      point({ orderNo: 2, pointName: 'B', gpsLat: 37.4936, gpsLng: 127.078 }),
    ])

    expect(pins.map((pin) => pin.name)).toEqual(['A', 'B'])
    expect(missing).toBe(0)
  })

  it('🔴 `orderNo` 로 세운다 — 응답 순서를 믿지 않는다', () => {
    const { pins } = usableCoords([
      point({ orderNo: 2, pointName: '두번째' }),
      point({ orderNo: 1, pointName: '첫번째' }),
    ])

    expect(pins.map((pin) => pin.name)).toEqual(['첫번째', '두번째'])
  })

  it('🔴 순번은 **배열 위치**다 — 서버가 중복 `orderNo` 를 그대로 저장한다', () => {
    const { pins } = usableCoords([
      point({ orderNo: 1, pointName: 'A' }),
      point({ orderNo: 1, pointName: 'B' }),
    ])

    expect(pins.map((pin) => pin.order)).toEqual([1, 2])
  })
})

describe('usableCoords — 걸러내기', () => {
  it('좌표가 `null` 이면 뺀다', () => {
    const { pins, missing } = usableCoords([
      point({ orderNo: 1 }),
      point({ orderNo: 2, gpsLat: null, gpsLng: null }),
    ])

    expect(pins).toHaveLength(1)
    expect(missing).toBe(1)
  })

  it('한쪽만 있어도 뺀다 — 위도만 있는 좌표는 찍을 수 없다', () => {
    const { pins, missing } = usableCoords([point({ gpsLng: null })])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(1)
  })

  it('🔴 **범위 밖 값을 뺀다**(B-33) — `gpsLat: 123` 이 서버에 실재한다', () => {
    const { pins, missing } = usableCoords([
      point({ orderNo: 1, gpsLat: 123, gpsLng: 57.22 }),
      point({ orderNo: 2 }),
    ])

    expect(pins).toHaveLength(1)
    expect(missing).toBe(1)
  })

  it('경도 범위도 본다(-180~180)', () => {
    expect(usableCoords([point({ gpsLng: 200 })]).missing).toBe(1)
  })

  it('`NaN`·무한대도 뺀다 — 숫자 타입이라고 찍을 수 있는 건 아니다', () => {
    expect(usableCoords([point({ gpsLat: Number.NaN })]).missing).toBe(1)
    expect(usableCoords([point({ gpsLng: Number.POSITIVE_INFINITY })]).missing).toBe(1)
  })

  it('경계값은 통과한다 — 90·180 은 유효한 좌표다', () => {
    expect(usableCoords([point({ gpsLat: 90, gpsLng: 180 })]).pins).toHaveLength(1)
    expect(usableCoords([point({ gpsLat: -90, gpsLng: -180 })]).pins).toHaveLength(1)
  })
})

describe('usableCoords — 번호 유지', () => {
  it('🔴 빠진 지점도 **번호를 차지한다** — 지점 순서 카드와 어긋나면 안 된다', () => {
    // 3번이 좌표가 없다고 4번이 3번이 되면, 같은 지점을 **화면마다 다른 번호**로 부른다
    const { pins } = usableCoords([
      point({ orderNo: 1, pointName: 'A' }),
      point({ orderNo: 2, pointName: 'B' }),
      point({ orderNo: 3, pointName: 'C', gpsLat: null, gpsLng: null }),
      point({ orderNo: 4, pointName: 'D' }),
    ])

    expect(pins.map((pin) => [pin.order, pin.name])).toEqual([
      [1, 'A'],
      [2, 'B'],
      [4, 'D'],
    ])
  })
})

describe('usableCoords — 빈 경우', () => {
  it('지점이 없으면 핀도 없다', () => {
    expect(usableCoords([])).toEqual({ pins: [], missing: 0 })
  })

  it('전부 좌표가 없으면 핀 0개 + missing 이 전체 수다 — 화면이 다이어그램으로 되돌아간다', () => {
    const { pins, missing } = usableCoords([
      point({ orderNo: 1, gpsLat: null, gpsLng: null }),
      point({ orderNo: 2, gpsLat: null, gpsLng: null }),
    ])

    expect(pins).toHaveLength(0)
    expect(missing).toBe(2)
  })
})
