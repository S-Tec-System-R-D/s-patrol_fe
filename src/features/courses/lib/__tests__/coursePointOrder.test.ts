import { describe, expect, it } from 'vitest'

import {
  isDirty,
  moveDraft,
  newDraftKey,
  toDrafts,
  toOrderedPoints,
  type CoursePointDraft,
} from '../coursePointOrder'
import type { CourseDetailPoint } from '../../types'

/**
 * 편성 순서 계산 (`spec 023` Phase 4, T367).
 *
 * 🔴 **드래그 자체는 jsdom 에서 재현되지 않는다**(`dnd-kit` 이 레이아웃을 측정하는데
 * jsdom 에서는 전부 0 이다). 그래서 "드래그하면 무엇이 되는가" 를 **순수 함수로 꺼내**
 * 여기서 고정한다 — 컴포넌트 안에 두면 **테스트할 길이 없는 로직**이 된다.
 *
 * 🔴 여기서 막는 가장 큰 사고는 **`orderNo` 재부여 누락**이다. 서버는 중복·구멍 난
 * `orderNo` 도 그대로 저장하고 고쳐 주지 않는다(실측 2026-10-12: 둘 다 `orderNo: 1` 로
 * 저장됐다) — 화면에서 순서를 바꿨는데 번호를 다시 매기지 않으면 **다음 조회에서 순서가
 * 무너진다.**
 */

const point = (overrides: Partial<CourseDetailPoint> = {}): CourseDetailPoint => ({
  coursePointSeq: 101,
  pointSeq: 1,
  pointName: '정문 입구',
  authMethod: 9,
  orderNo: 1,
  useYn: true,
  courseMin: 10, gpsLat: null, gpsLng: null,
  ...overrides,
})

const threePoints: CourseDetailPoint[] = [
  point({ coursePointSeq: 103, pointSeq: 3, pointName: '세번째', orderNo: 3, courseMin: 30 }),
  point({ coursePointSeq: 101, pointSeq: 1, pointName: '첫번째', orderNo: 1, courseMin: 10 }),
  point({ coursePointSeq: 102, pointSeq: 2, pointName: '두번째', orderNo: 2, courseMin: 20 }),
]

describe('toDrafts', () => {
  it('orderNo 순으로 세운다 — 응답 순서를 믿지 않는다', () => {
    expect(toDrafts(threePoints).map((draft) => draft.pointName)).toEqual([
      '첫번째',
      '두번째',
      '세번째',
    ])
  })

  it('🔴 기존 행은 coursePointSeq 를 들고 있다 — 저장 시 행을 유지하는 열쇠다', () => {
    expect(toDrafts(threePoints).map((draft) => draft.coursePointSeq)).toEqual([101, 102, 103])
  })

  it('🔴 key 가 coursePointSeq 기반이라 **같은 지점이 두 번** 있어도 겹치지 않는다', () => {
    // 실측(2026-10-12): 서버는 같은 pointSeq 를 한 코스에 두 번 받아들인다
    const twice = toDrafts([
      point({ coursePointSeq: 201, pointSeq: 5, orderNo: 1 }),
      point({ coursePointSeq: 202, pointSeq: 5, orderNo: 2 }),
    ])

    expect(new Set(twice.map((draft) => draft.key)).size).toBe(2)
  })
})

describe('moveDraft', () => {
  const drafts = toDrafts(threePoints)

  it('맨 아래를 맨 위로 옮긴다', () => {
    const moved = moveDraft(drafts, 'cp-103', 'cp-101')

    expect(moved.map((draft) => draft.pointName)).toEqual(['세번째', '첫번째', '두번째'])
  })

  it('가운데로 옮긴다', () => {
    const moved = moveDraft(drafts, 'cp-101', 'cp-102')

    expect(moved.map((draft) => draft.pointName)).toEqual(['두번째', '첫번째', '세번째'])
  })

  it('같은 자리로 놓거나 없는 key 면 원본을 그대로 돌려준다', () => {
    expect(moveDraft(drafts, 'cp-101', 'cp-101')).toBe(drafts)
    expect(moveDraft(drafts, 'cp-999', 'cp-101')).toBe(drafts)
  })
})

describe('toOrderedPoints — 🔴 orderNo 재부여', () => {
  it('🔴 드래그 후 배열 순서대로 1..N 을 다시 매긴다', () => {
    const moved = moveDraft(toDrafts(threePoints), 'cp-103', 'cp-101')

    expect(toOrderedPoints(moved)).toEqual([
      { pointSeq: 3, coursePointSeq: 103, orderNo: 1, memo: null, courseMin: 30 },
      { pointSeq: 1, coursePointSeq: 101, orderNo: 2, memo: null, courseMin: 10 },
      { pointSeq: 2, coursePointSeq: 102, orderNo: 3, memo: null, courseMin: 20 },
    ])
  })

  it('🔴 중간을 제거해도 번호에 구멍이 생기지 않는다', () => {
    const removed = toDrafts(threePoints).filter((draft) => draft.key !== 'cp-102')

    expect(toOrderedPoints(removed).map((point) => point.orderNo)).toEqual([1, 2])
  })

  it('🔴 새로 추가한 행은 coursePointSeq 가 null 로 나간다 — 서버가 부여한다', () => {
    const added: CoursePointDraft[] = [
      ...toDrafts([point()]),
      {
        key: newDraftKey(0),
        coursePointSeq: null,
        pointSeq: 7,
        pointName: '신규',
        authMethod: 9,
        useYn: true,
        courseMin: 0,
      },
    ]

    expect(toOrderedPoints(added)[1]).toEqual({
      pointSeq: 7,
      coursePointSeq: null,
      orderNo: 2,
      memo: null,
      courseMin: 0,
    })
  })

  it('🔴 memo 를 보내지 않는다(항상 null) — 쓰기 전용이라 보존할 수 없다 (B-30)', () => {
    expect(toOrderedPoints(toDrafts(threePoints)).every((point) => point.memo === null)).toBe(true)
  })
})

describe('isDirty', () => {
  it('바뀐 것이 없으면 false — 의미 없는 전량 전송을 막는다', () => {
    expect(isDirty(toDrafts(threePoints), threePoints)).toBe(false)
  })

  it('순서·구간시간·개수 변화를 각각 잡는다', () => {
    const drafts = toDrafts(threePoints)

    expect(isDirty(moveDraft(drafts, 'cp-103', 'cp-101'), threePoints)).toBe(true)
    expect(
      isDirty(
        drafts.map((draft, index) => (index === 0 ? { ...draft, courseMin: 99 } : draft)),
        threePoints
      )
    ).toBe(true)
    expect(isDirty(drafts.slice(1), threePoints)).toBe(true)
  })
})
