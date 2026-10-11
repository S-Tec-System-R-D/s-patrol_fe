import { http, HttpResponse } from 'msw'

import { courseSeeds, type MockCourse } from '@/features/courses/mock/courseData'
import { toAuthMethodCode } from '@/features/points/lib/authMethod'
import { points as legacyPoints } from '@/features/points/mock/pointData'
import type {
  ClassificationPoint,
  CourseDetail,
  CourseRow,
  UpdateCourseRequest,
} from '@/features/courses/types'

/**
 * MSW 순찰코스 핸들러 (`spec 023` Phase 1).
 *
 * 🔴 **조회 전환과 같은 Phase 에 들어와야 한다.** `npm run dev`(mock)와 `npm run capture`
 * 가 **둘 다 MSW 위에서** 돈다(`.env.capture`: `VITE_USE_MSW=true`). 이 파일이 없으면
 * mock 모드의 `/zones` 가 통째로 빈 화면이 되고 baseline 캡쳐가 깨진다. `npm run capture`
 * 는 `verify`/`test` 밖이라 빼먹으면 **다음 캡쳐까지 드러나지 않는다**(022·027 교훈).
 *
 * 🔴🔴 **변경계 3종은 실측된 "결함 동작" 을 그대로 흉내낸다**(`api-spec.md` §5-1-B):
 * - `AddCourse` 는 `points` 를 **무시**하고 `pointCount: 0` 으로 만든다 (B-27)
 * - `UpdateCourse.points` 는 **전체 교체** — 생략·빈 배열·일부 전송이 모두 나머지를 지운다 (B-25)
 * - `UpdateCourse` 에 `courseSeq` 가 없으면 **401** (B-28)
 * - `DeleteCourse` 는 **`courseId`** 만 받는다 (B-12)
 *
 * ⚠️ **서버 결함을 mock 에서 "고쳐 주면" 실 전환에서 터진다.** mock 이 실 서버보다
 * 관대하거나 엄격하면 둘 다 거짓이다 — 022 가 `DeletePoint` 거부 분기를 지우며 배운 것.
 */

/** 지점이 어느 사업장에 속하는가 — `handlers/points.ts` 와 **같은 규칙**이어야 한다 */
const SITE_OF_POINT = (pointSeq: number): number => (pointSeq <= 10 ? 7 : 8)

/** 편성 지점의 표시 이름·인증수단 — 구 지점 mock 에서 끌어온다 */
const pointMeta = (pointSeq: number) => {
  const legacy = legacyPoints.find((point) => Number(point.id) === pointSeq)
  return {
    pointName: legacy?.title ?? `지점 ${pointSeq}`,
    memo: legacy?.description || null,
    authMethod: legacy ? toAuthMethodCode(legacy.authenticationMethod) : 9,
  }
}

/** 모듈 스코프 저장소 — 변경계 3종이 이 배열을 직접 고친다 */
let store: MockCourse[] = courseSeeds.map((course) => ({
  ...course,
  points: course.points.map((point) => ({ ...point })),
}))

/**
 * 저장소를 초기 상태로 되돌린다.
 *
 * 🔴 **테스트 격리에 필요하다.** `server.resetHandlers()` 는 핸들러만 되돌리고 이 배열은
 * 건드리지 않으므로, 생성·삭제 테스트가 뒤 테스트의 목록 건수를 바꿔 **순서 의존 flaky**
 * 가 된다(022 `resetPointStore` 선례). 변경계를 다루는 테스트는 `beforeEach` 에서 부른다.
 */
export const resetCourseStore = (): void => {
  store = courseSeeds.map((course) => ({
    ...course,
    points: course.points.map((point) => ({ ...point })),
  }))
}

/**
 * 최근 순찰 1건. 🔴 **`hasHistory: false` 면 `history` 자체가 `null`** 이다 — 빈 객체가
 * 아니다. 호출부가 `history?.historyEndDt` 로 접근하는지 확인할 수 있게 한다.
 */
const historyOf = (course: MockCourse): CourseRow['history'] =>
  course.hasHistory
    ? {
        historySeq: course.courseSeq * 10,
        historyUserSeq: 100 + course.courseSeq,
        historyUserName: '김근무',
        historyStatusCode: 4,
        historyStatusName: '완료',
        historyEndDt: `2026-10-0${(course.courseSeq % 7) + 1}T21:${10 + course.courseSeq}:00`,
      }
    : null

const toCourseRow = (course: MockCourse): CourseRow => ({
  courseSeq: course.courseSeq,
  courseName: course.courseName,
  useYn: course.useYn,
  switchYn: course.switchYn,
  totalMin: course.totalMin,
  courseStatusCode: course.courseStatusCode,
  // 실측 사전은 0(대기중)만 확인됐다(OQ-3) — 모르는 코드를 만들어 내지 않는다
  courseStatusName: course.courseStatusCode === 0 ? '대기중' : `상태 ${course.courseStatusCode}`,
  pointCount: course.points.length,
  history: historyOf(course),
})

/**
 * 상세 응답.
 *
 * 🔴 **`siteSeq` 를 넣지 않는다** — 실 서버 응답에 없다(OQ-9). 넣어 주면 프론트가
 * `getSiteSeq()` 로 보충해야 하는 사실이 mock 에서 숨어, 실 전환에서 `UpdateCourse` 의
 * `siteSeq` 가 `undefined` 로 나간다.
 *
 * 🔴 **`courseStatusCode`·`pointCount` 도 넣지 않는다** — 목록에만 있는 필드다.
 */
const toCourseDetail = (course: MockCourse): CourseDetail => ({
  courseSeq: course.courseSeq,
  courseName: course.courseName,
  memo: course.memo,
  useYn: course.useYn,
  switchYn: course.switchYn,
  totalMin: course.totalMin,
  points: course.points
    .slice()
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((point) => ({
      coursePointSeq: point.coursePointSeq,
      pointSeq: point.pointSeq,
      pointName: pointMeta(point.pointSeq).pointName,
      // ⚠️ 상세의 편성 지점에는 `authMethodName` 이 없다(실측) — 코드만 준다
      authMethod: pointMeta(point.pointSeq).authMethod,
      orderNo: point.orderNo,
      useYn: point.useYn,
      courseMin: point.courseMin,
    })),
})

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

/** 변경계 성공 — 실측: `data` 가 `true`(boolean). 🔴 생성된 ID 를 주지 않는다 */
const mutationOk = () => ok(true)

/** 실측 비즈니스 오류 — `ApiResponse` 래퍼 + 4xx. 🔴 문구는 전부 이 한 문장이다(B-17) */
const businessError = (status = 400) =>
  HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: status }, { status })

/**
 * 🔴 **`courseSeq` 누락 → 401.** 인증 문제가 아닌데 401 이다(B-28).
 * mock 에서도 401 로 둬야 **인터셉터가 토큰 만료로 오해하는 경로**를 dev 에서 볼 수 있다.
 */
const missingCourseSeqError = () => businessError(401)

/** 🔴 파라미터명 오타는 래퍼가 아니라 **ProblemDetails** 다(실측) */
const problemDetails = (field: string) =>
  HttpResponse.json(
    {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: { [field]: ['The value is not valid.'] },
      traceId: '00-mock-course-00',
    },
    { status: 400 }
  )

const GET_COURSE_LIST_PATH = '/api/v1/Course/W/sign/GetCourseList'
const GET_COURSE_DETAIL_PATH = '/api/v1/Course/W/sign/GetCourseDetail'
const GET_CLASSIFICATION_POINT_PATH = '/api/v1/Course/W/sign/GetClassificationPoint'
const ADD_COURSE_PATH = '/api/v1/Course/W/sign/AddCourse'
const UPDATE_COURSE_PATH = '/api/v1/Course/W/sign/UpdateCourse'
const DELETE_COURSE_PATH = '/api/v1/Course/W/sign/DeleteCourse'

/** 새 `courseSeq` — 저장소 최대값 + 1. 삭제 후 재사용되지 않게 한다 */
const nextCourseSeq = (): number =>
  store.reduce((max, course) => Math.max(max, course.courseSeq), 0) + 1

/** 새 `coursePointSeq` — 전체 코스의 최대값 + 1(편성 행은 코스 간 유일하다) */
const nextCoursePointSeq = (): number =>
  store.reduce(
    (max, course) =>
      course.points.reduce((inner, point) => Math.max(inner, point.coursePointSeq), max),
    100
  ) + 1

export const courseHandlers = [
  /**
   * 목록. 🔴 **필터·페이징을 실제로 구현한다** — 전량 반환으로 때우면 "서버 파라미터로
   * 나간다" 는 검증 기준(DoD #3)을 세울 수 없다.
   *
   * ⚠️ 실 서버가 이 4종을 정말 거르는지는 **미실측**이다(T355). mock 이 거른다는 사실이
   * 실측을 대신하지 않는다 — 여기서 걸리는 것은 **우리 쪽 계약**일 뿐이다.
   */
  http.get(GET_COURSE_LIST_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const siteSeq = Number(query.get('siteSeq'))
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)

    // 실측: pageNumber=0 은 400 (`api-spec.md` §1-5)
    if (pageNumber < 1) return businessError()

    const searchKey = query.get('searchKey')?.trim() ?? ''
    const useYn = query.get('useYn')
    const switchYn = query.get('switchYn')
    const courseStatus = query.get('courseStatus')

    // 🔴 권한 밖 사업장이어도 403 이 아니라 빈 목록이다 (B-9)
    const filtered = store
      .filter((course) => course.siteSeq === siteSeq)
      .filter((course) => (searchKey ? course.courseName.includes(searchKey) : true))
      .filter((course) => (useYn ? course.useYn === (useYn === 'true') : true))
      .filter((course) => (switchYn ? course.switchYn === (switchYn === 'true') : true))
      .filter((course) =>
        courseStatus ? course.courseStatusCode === Number(courseStatus) : true
      )

    // 실측: pageNumber 초과는 에러가 아니라 빈 items + 요청값 그대로 에코
    const start = (pageNumber - 1) * pageSize
    return ok({
      items: filtered.slice(start, start + pageSize).map(toCourseRow),
      page: pageNumber,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    })
  }),

  /** 상세. 없는 `courseSeq` 는 **400 + 래퍼**(실측) */
  http.get(GET_COURSE_DETAIL_PATH, ({ request }) => {
    const courseSeq = Number(new URL(request.url).searchParams.get('courseSeq'))
    const found = store.find((course) => course.courseSeq === courseSeq)
    if (!found) return businessError()
    return ok(toCourseDetail(found))
  }),

  /**
   * 편성 후보 지점.
   *
   * 🔴 **`PagedData` 로 감싸지 않는다 — 배열을 그대로 준다**(실측 §5-2 14번). 다른 5종과
   * 모양이 달라 `res.data.items` 로 읽으면 `undefined` 가 되는데, mock 이 감싸 버리면
   * 그 차이가 숨어 실 전환에서 "후보 0건" 으로 조용히 빈다.
   *
   * 🔴 **페이징하지 않는다** — 실 서버도 전량을 준다. 후보가 많을 때의 검색 필요성
   * (OQ-023-C)이 dev 에서 드러나야 한다.
   */
  http.get(GET_CLASSIFICATION_POINT_PATH, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    const items: ClassificationPoint[] = legacyPoints
      .filter((point) => SITE_OF_POINT(Number(point.id)) === siteSeq)
      .map((point) => {
        const meta = pointMeta(Number(point.id))
        return {
          pointSeq: Number(point.id),
          pointName: meta.pointName,
          memo: meta.memo,
          authMethod: meta.authMethod,
          authMethodName: meta.authMethod === 9 ? 'QR' : 'NFC',
        }
      })
    return ok(items)
  }),

  /**
   * 생성.
   *
   * 🔴🔴 **`points` 를 받아도 무시한다 — 실측 그대로다**(B-27). 지점을 실어 보내도
   * `pointCount: 0` 인 코스가 생기고 **200 이 돌아온다.** mock 이 친절하게 편성해 주면
   * 우리 화면에서는 되는데 실 서버에서는 절반만 되는, 가장 알아채기 어려운 불일치가 된다.
   *
   * ⚠️ 프론트는 애초에 `points` 를 보내지 않는다(`AddCourseRequest` 에 필드가 없다).
   * 그래도 여기서 무시 동작을 재현해 두는 이유는, 누군가 타입을 우회해 보냈을 때
   * **mock 이 실 서버와 같은 결과를 주어야** 하기 때문이다.
   */
  http.post(ADD_COURSE_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    const siteSeq = body?.siteSeq
    const courseName = body?.courseName

    if (typeof siteSeq !== 'number' || typeof courseName !== 'string' || !courseName.trim()) {
      return businessError()
    }

    store.push({
      siteSeq,
      courseSeq: nextCourseSeq(),
      courseName: courseName.trim(),
      memo: typeof body?.memo === 'string' ? body.memo : null,
      useYn: typeof body?.useYn === 'boolean' ? body.useYn : true,
      switchYn: typeof body?.switchYn === 'boolean' ? body.switchYn : false,
      totalMin: typeof body?.totalMin === 'number' ? body.totalMin : 0,
      courseStatusCode: 0,
      hasHistory: false, // 새 코스는 순찰 기록이 없다
      points: [], // 🔴 body.points 는 **무시**한다(B-27)
    })

    return mutationOk()
  }),

  /**
   * 수정 — 기본정보와 편성이 같은 엔드포인트다. 🔴 **`PUT`** 이다(지점은 PATCH).
   *
   * 🔴🔴 **`points` 는 전체 교체**(B-25). 생략·빈 배열·일부 전송이 **모두 나머지를
   * 삭제**한다 — 아래가 그 동작이다. 기존 행은 `coursePointSeq` 로 알아보고, 없는 것은
   * 새 행으로 번호를 받는다.
   *
   * 🔴 **`courseSeq` 누락은 401**(B-28). 토큰 문제가 아닌데 401 이라 인터셉터가 **토큰
   * 만료로 오해**한다 — dev 에서 그 증상(저장하려다 로그아웃)을 볼 수 있어야 한다.
   *
   * 🔴 **`memo: null` 은 반영된다**(비워짐). 지점(`UpdatePoint`)은 `null`·`''` 을 무시해
   * 값을 비울 수 없지만(B-15) **코스는 비워진다** — 반대 동작이다.
   *
   * ⚠️ 편성 지점의 `useYn` 은 요청 DTO 에 없어(B-29) **기존 값을 유지**한다. 새 행은
   * `true` 로 들어간다 — 보낼 수단이 없으니 서버 기본값에 맡기는 셈이다.
   */
  http.put(UPDATE_COURSE_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<UpdateCourseRequest> | null

    // 🔴 실측: courseSeq 가 없으면 401 (인증 문제가 아닌데 401)
    if (typeof body?.courseSeq !== 'number') return missingCourseSeqError()

    const index = store.findIndex((course) => course.courseSeq === body.courseSeq)
    if (index < 0) return businessError()

    const current = store[index]
    const incoming = body.points ?? [] // 🔴 생략도 "전부 삭제" 다

    store[index] = {
      ...current,
      courseName: body.courseName?.trim() || current.courseName,
      // 🔴 null 이 반영된다 — 지점과 반대(B-15 / 규칙 6)
      memo: body.memo === undefined ? current.memo : body.memo,
      useYn: body.useYn ?? current.useYn,
      switchYn: body.switchYn ?? current.switchYn,
      totalMin: body.totalMin ?? current.totalMin,
      points: incoming.map((point) => {
        const existing = current.points.find(
          (saved) => saved.coursePointSeq === point.coursePointSeq
        )
        return {
          coursePointSeq: existing?.coursePointSeq ?? nextCoursePointSeq(),
          pointSeq: point.pointSeq,
          orderNo: point.orderNo,
          memo: point.memo ?? null,
          courseMin: point.courseMin ?? 0,
          // ⚠️ 요청에 useYn 이 없다(B-29) — 기존 값 유지, 새 행은 true
          useYn: existing?.useYn ?? true,
        }
      }),
    }

    return mutationOk()
  }),

  /**
   * 삭제.
   *
   * 🔴🔴 **파라미터는 `courseId` 다.** `courseSeq` 로 오면 실 서버는 **400 ProblemDetails**
   * (`errors.courseId`)를 준다 — 래퍼가 아니라 **형태까지 다르다**(B-12). mock 도 그대로
   * 재현한다: 관대하게 둘 다 받으면 틀린 파라미터명이 실 전환까지 살아남는다.
   *
   * 🔴 **편성 지점이 있어도 거부하지 않는다**(실측). "사용 중이라 못 지운다" 는 서버 규칙이
   * 없다 — mock 만 거부하면 dev 에서는 막히고 실 서버에서는 지워진다.
   */
  http.delete(DELETE_COURSE_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const courseId = query.get('courseId')

    // 🔴 `courseSeq` 로 보낸 경우 — 실 서버와 같은 ProblemDetails 를 준다
    if (courseId === null) return problemDetails('courseId')

    const index = store.findIndex((course) => course.courseSeq === Number(courseId))
    if (index < 0) return businessError()

    store.splice(index, 1)
    return mutationOk()
  }),
]
