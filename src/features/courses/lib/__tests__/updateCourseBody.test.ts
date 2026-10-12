import { describe, expect, it } from 'vitest'

import { toUpdateCourseBody, toUpdateCoursePoints } from '../updateCourseBody'
import type { CourseDetail } from '../../types'

/**
 * `UpdateCourse` 바디 생성 (`spec 023` Phase 4).
 *
 * 🔴 **이 파일이 지키는 것은 "지점이 조용히 사라지지 않는 것" 이다.** `points` 는 전체
 * 교체이고(B-25) 생략·빈 배열·일부 전송이 **모두 나머지를 삭제하면서 200 을 준다** —
 * 즉 **실패가 성공처럼 보인다.** 바디를 호출부마다 손으로 만들면 네 자리(수정 모달 ·
 * 토글 2종 · 편성) 중 한 곳만 틀려도 그 코스의 편성이 날아간다.
 */

const course: CourseDetail = {
  courseSeq: 12,
  courseName: 'A동 순찰코스',
  memo: '야간 2회',
  useYn: true,
  switchYn: false,
  totalMin: 45,
  points: [
    {
      coursePointSeq: 101,
      pointSeq: 1,
      pointName: '정문 입구',
      authMethod: 9,
      orderNo: 1,
      useYn: true,
      courseMin: 10,
    },
    {
      coursePointSeq: 102,
      pointSeq: 2,
      pointName: '주차장',
      authMethod: 10,
      orderNo: 2,
      useYn: false,
      courseMin: 35,
    },
  ],
}

describe('toUpdateCourseBody — 지점이 사라지지 않게', () => {
  it('🔴 points 를 넘기지 않으면 **현재 편성 전량**이 실린다 (B-25)', () => {
    const body = toUpdateCourseBody(course, 7, { courseName: '새 이름' })

    expect(body.points).toHaveLength(2)
    expect(body.points.map((point) => point.pointSeq)).toEqual([1, 2])
  })

  it('🔴 courseSeq 가 항상 들어간다 — 누락 시 401 이고 인터셉터가 토큰 만료로 오해한다 (B-28)', () => {
    expect(toUpdateCourseBody(course, 7).courseSeq).toBe(12)
  })

  it('🔴 siteSeq 는 인자로 받는다 — 상세 응답에 없다 (OQ-9)', () => {
    expect(toUpdateCourseBody(course, 8).siteSeq).toBe(8)
  })

  it('넘기지 않은 필드는 현재 값 그대로 나간다', () => {
    const body = toUpdateCourseBody(course, 7, { useYn: false })

    expect(body.useYn).toBe(false)
    expect(body.switchYn).toBe(false)
    expect(body.courseName).toBe('A동 순찰코스')
    expect(body.memo).toBe('야간 2회')
  })

  it('🔴 memo: null 은 "비움" 으로 나간다 — undefined(안 바꿈)와 구분한다 (규칙 6)', () => {
    expect(toUpdateCourseBody(course, 7, { memo: null }).memo).toBeNull()
    expect(toUpdateCourseBody(course, 7, {}).memo).toBe('야간 2회')
  })

  it('🔴 totalMin 은 **항상 null** 이다 — 서버가 구간시간 합으로 채운다 (B-31)', () => {
    // 실측: 숫자를 보내면 그대로 저장되고 구간시간 합과 맞는지 **검사하지 않는다**.
    // null 을 보내면 서버가 합(10+35=45)으로 채운다 → 화면의 총 소요시간이 거짓이 될
    // 경로를 없앤다
    expect(toUpdateCourseBody(course, 7).totalMin).toBeNull()
    expect(toUpdateCourseBody(course, 7, { courseName: 'x' }).totalMin).toBeNull()
  })
})

describe('toUpdateCoursePoints', () => {
  it('🔴 coursePointSeq 를 그대로 실어 보낸다 — null 로 보내면 새 행이 생겨 번호가 바뀐다', () => {
    expect(toUpdateCoursePoints(course.points).map((point) => point.coursePointSeq)).toEqual([
      101, 102,
    ])
  })

  it('🔴 orderNo 를 건드리지 않는다 — 사용자가 순서를 바꾼 경우에만 재부여한다', () => {
    const shuffled = [
      { ...course.points[0], orderNo: 5 },
      { ...course.points[1], orderNo: 9 },
    ]

    expect(toUpdateCoursePoints(shuffled).map((point) => point.orderNo)).toEqual([5, 9])
  })

  it('🔴 memo 는 항상 null 이다 — 쓰기 전용이라 읽어서 보존할 수 없다 (B-30)', () => {
    expect(toUpdateCoursePoints(course.points).every((point) => point.memo === null)).toBe(true)
  })

  it('표시 전용 필드(useYn·pointName)를 보내지 않는다 — 요청 DTO 에 없다 (B-29)', () => {
    const [first] = toUpdateCoursePoints(course.points)

    expect(first).not.toHaveProperty('useYn')
    expect(first).not.toHaveProperty('pointName')
  })
})
