import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { addCourse } from '../addCourse'
import { deleteCourse } from '../deleteCourse'
import { fetchClassificationPoints } from '../getClassificationPoint'
import { fetchCourseDetail } from '../detailCourse'
import { fetchCourseList } from '../getCourseList'
import { updateCourse } from '../updateCourse'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { makeAccessToken } from '@/test/jwt'
import type { UpdateCourseRequest } from '../../types'

/**
 * 코스 api 6종 — **실측된 서버 동작을 계약으로 고정한다**(`spec 023` Phase 1).
 *
 * 🔴 **화면이 없는 Phase 에서 이 테스트가 유일한 안전망이다.** 여기서 고정하는 것은
 * "우리 코드가 서버의 **결함 동작**에 맞춰져 있는가" 다 — `api-spec.md` §5-1-B 의 실측
 * 5건(B-12·B-25·B-27·B-28·OQ-9)이 각각 한 건씩 대응된다. 나중에 누가 "이상한데" 하며
 * 되돌리면 여기서 깨진다.
 */

const SITE_SEQ = 7

const updateBody = (overrides: Partial<UpdateCourseRequest> = {}): UpdateCourseRequest => ({
  siteSeq: SITE_SEQ,
  courseSeq: 1,
  courseName: 'A동 순찰코스',
  memo: '수정됨',
  useYn: true,
  switchYn: true,
  totalMin: 45,
  points: [],
  ...overrides,
})

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
})

afterEach(() => {
  clearTokens()
})

describe('fetchCourseList', () => {
  it('선택한 사업장의 코스만 온다', async () => {
    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })

    expect(page.items.map((course) => course.courseName)).toContain('A동 순찰코스')
    // 사업장 8 의 코스는 섞이지 않는다
    expect(page.items.map((course) => course.courseName)).not.toContain('외벽 순회 코스')
  })

  it('🔴 권한 밖 사업장도 403 이 아니라 200 + 빈 목록이다 (B-9)', async () => {
    const page = await fetchCourseList({ siteSeq: 999, pageNumber: 1, pageSize: 20 })

    expect(page.items).toHaveLength(0)
    expect(page.totalCount).toBe(0)
  })

  it('🔴 순찰 기록이 없는 코스는 history 가 null 이다 — 빈 객체가 아니다', async () => {
    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })
    const fresh = page.items.find((course) => course.courseName === '옥상 점검 코스')

    expect(fresh?.history).toBeNull()
  })

  it('지점 0개 코스도 목록에 나온다 — pointCount 가 0 이다', async () => {
    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })

    expect(page.items.find((course) => course.courseName === '옥상 점검 코스')?.pointCount).toBe(0)
  })

  it('서버 필터가 적용된다 — 사용여부·교대·검색', async () => {
    const unused = await fetchCourseList({
      siteSeq: SITE_SEQ,
      useYn: false,
      pageNumber: 1,
      pageSize: 20,
    })
    expect(unused.items.every((course) => !course.useYn)).toBe(true)

    const searched = await fetchCourseList({
      siteSeq: SITE_SEQ,
      searchKey: 'B동',
      pageNumber: 1,
      pageSize: 20,
    })
    expect(searched.items).toHaveLength(1)
  })
})

describe('fetchCourseDetail', () => {
  it('편성 지점이 orderNo 순으로 온다', async () => {
    const detail = await fetchCourseDetail(1)

    expect(detail.points.map((point) => point.orderNo)).toEqual([1, 2, 3])
    expect(detail.points[0].pointName).toBe('정문 입구')
  })

  it('🔴 상세 응답에 siteSeq 가 없다 (OQ-9) — UpdateCourse 는 요구하므로 보충해야 한다', async () => {
    const detail = await fetchCourseDetail(1)

    expect(detail).not.toHaveProperty('siteSeq')
  })

  it('🔴 목록에만 있는 필드(courseStatusCode·pointCount)는 상세에 없다', async () => {
    const detail = await fetchCourseDetail(1)

    expect(detail).not.toHaveProperty('courseStatusCode')
    expect(detail).not.toHaveProperty('pointCount')
  })

  it('없는 courseSeq 는 거부된다 — 빈 상세를 돌려주지 않는다', async () => {
    await expect(fetchCourseDetail(9999)).rejects.toThrow()
  })
})

describe('fetchClassificationPoints', () => {
  it('🔴 응답이 배열이다 — PagedData 가 아니다', async () => {
    const candidates = await fetchClassificationPoints(SITE_SEQ)

    expect(Array.isArray(candidates)).toBe(true)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates[0]).toHaveProperty('authMethodName')
  })

  it('🔴 페이징이 없다 — 사업장의 지점이 전량 온다', async () => {
    const candidates = await fetchClassificationPoints(SITE_SEQ)

    // 사업장 7 의 지점은 10건(1~10) — 20건씩 끊는 페이징이 없다
    expect(candidates).toHaveLength(10)
  })
})

describe('addCourse', () => {
  it('명칭·설명만으로 생성된다', async () => {
    await addCourse({
      siteSeq: SITE_SEQ,
      courseName: '신규 코스',
      memo: '설명',
      useYn: true,
      switchYn: false,
      totalMin: null,
    })

    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })
    expect(page.items.map((course) => course.courseName)).toContain('신규 코스')
  })

  it('🔴 points 를 실어 보내도 무시된다 — 200 인데 pointCount: 0 이다 (B-27)', async () => {
    // 타입에는 `points` 가 없다. 서버 결함을 고정하기 위해 **타입을 우회해** 보낸다 —
    // 이것이 실패하면 mock 이 서버보다 친절해진 것이고, 그 순간 "생성 모달에서 지점을
    // 묻지 않는다" 는 UI 결정의 근거가 사라진다.
    await addCourse({
      siteSeq: SITE_SEQ,
      courseName: '지점 실어 보낸 코스',
      memo: null,
      useYn: true,
      switchYn: false,
      totalMin: 30,
      points: [{ pointSeq: 1, orderNo: 1, memo: null, courseMin: 10 }],
    } as never)

    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })
    const created = page.items.find((course) => course.courseName === '지점 실어 보낸 코스')

    expect(created).toBeDefined()
    expect(created?.pointCount).toBe(0) // 🔴 절반만 됐다
  })

  it('🔴 생성된 courseSeq 를 돌려주지 않는다 — 반환이 void 다', async () => {
    const result = await addCourse({
      siteSeq: SITE_SEQ,
      courseName: '반환값 확인용',
      memo: null,
      useYn: true,
      switchYn: false,
      totalMin: null,
    })

    expect(result).toBeUndefined()
  })
})

describe('updateCourse', () => {
  it('기본정보가 수정된다', async () => {
    await updateCourse(
      updateBody({
        courseName: '이름 바뀐 코스',
        points: [
          { pointSeq: 1, coursePointSeq: 101, orderNo: 1, memo: null, courseMin: 10 },
          { pointSeq: 2, coursePointSeq: 102, orderNo: 2, memo: null, courseMin: 15 },
          { pointSeq: 3, coursePointSeq: 103, orderNo: 3, memo: null, courseMin: 20 },
        ],
      })
    )

    const detail = await fetchCourseDetail(1)
    expect(detail.courseName).toBe('이름 바뀐 코스')
    expect(detail.points).toHaveLength(3) // 전량을 보냈으니 유지된다
  })

  it('🔴🔴 points 는 전체 교체다 — 빈 배열을 보내면 편성이 전부 지워진다 (B-25)', async () => {
    await updateCourse(updateBody({ points: [] }))

    const detail = await fetchCourseDetail(1)
    expect(detail.points).toHaveLength(0)
  })

  it('🔴🔴 일부만 보내도 나머지가 지워진다 — "변경분만 보내기" 를 만들면 안 되는 이유', async () => {
    await updateCourse(
      updateBody({
        points: [{ pointSeq: 1, coursePointSeq: 101, orderNo: 1, memo: null, courseMin: 10 }],
      })
    )

    const detail = await fetchCourseDetail(1)
    expect(detail.points).toHaveLength(1)
  })

  it('새 편성 행은 coursePointSeq 없이 보낸다 — 서버가 번호를 준다', async () => {
    await updateCourse(
      updateBody({
        courseSeq: 3, // 지점 0개 코스
        courseName: '옥상 점검 코스',
        points: [{ pointSeq: 4, coursePointSeq: null, orderNo: 1, memo: null, courseMin: 5 }],
      })
    )

    const detail = await fetchCourseDetail(3)
    expect(detail.points).toHaveLength(1)
    expect(detail.points[0].coursePointSeq).toBeGreaterThan(0)
  })

  it('🔴 memo: null 이 반영된다 — 지점(UpdatePoint)과 반대다 (B-15 / 규칙 6)', async () => {
    await updateCourse(
      updateBody({
        memo: null,
        points: [{ pointSeq: 1, coursePointSeq: 101, orderNo: 1, memo: null, courseMin: 10 }],
      })
    )

    const detail = await fetchCourseDetail(1)
    expect(detail.memo).toBeNull()
  })

  it('🔴🔴 courseSeq 가 없으면 401 이다 — 인증 문제가 아닌데 401 (B-28)', async () => {
    // 타입이 required 로 막고 있으므로 **우회해야** 재현된다. 이 401 은 axios
    // 인터셉터가 **토큰 만료로 오해**해 재발급·로그아웃 경로를 태운다 — 코스를
    // 저장하려다 로그아웃되는 증상이다. 그래서 타입 required 를 풀면 안 된다.
    const invalid = { ...updateBody() } as Partial<UpdateCourseRequest>
    delete invalid.courseSeq

    await expect(updateCourse(invalid as UpdateCourseRequest)).rejects.toThrow()
  })

  it('없는 courseSeq 는 400 이다 — 조용히 성공하지 않는다', async () => {
    await expect(updateCourse(updateBody({ courseSeq: 9999 }))).rejects.toThrow()
  })
})

describe('deleteCourse', () => {
  it('🔴 courseId 로 나간다 — courseSeq 가 아니다 (B-12)', async () => {
    await deleteCourse(2)

    const page = await fetchCourseList({ siteSeq: SITE_SEQ, pageNumber: 1, pageSize: 20 })
    expect(page.items.map((course) => course.courseSeq)).not.toContain(2)
  })

  it('🔴 편성 지점이 있어도 거부하지 않는다 — "사용 중이라 못 지운다" 는 규칙이 없다', async () => {
    const before = await fetchCourseDetail(1)
    expect(before.points.length).toBeGreaterThan(0)

    await expect(deleteCourse(1)).resolves.toBeUndefined()
  })

  it('없는 코스 삭제는 거부된다', async () => {
    await expect(deleteCourse(9999)).rejects.toThrow()
  })
})
