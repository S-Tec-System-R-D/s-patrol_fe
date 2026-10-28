/**
 * 순찰코스 요청 DTO + 목록 조회 파라미터.
 *
 * 출처: `docs/swagger-api.json`(`AddCourseDto` / `UpdateCourseDto` / `*CoursePointDto`)
 * + 🔴 **변경계 실측**(`api-spec.md` §5-1-B, 2026-10-10 WF-1-0).
 *
 * 🔴 **`UpdateCourse` 는 `PUT` 이다**(지점의 `UpdatePoint` 는 PATCH). 메서드가 다르고
 * 동작도 다르다 — 아래 각 타입 주석 참조. **지점의 교훈을 그대로 옮기면 틀린다**
 * (`spec 023` §3 규칙 6).
 */

/**
 * `POST /api/v1/Course/W/sign/AddCourse`
 *
 * swagger required: `siteSeq` · `courseName`.
 *
 * 🔴🔴 **`points` 를 선언하지 않는다.** swagger 에는 있지만 **서버가 무시한다** —
 * 지점을 실어 보내도 `pointCount: 0` 으로 생성되고 **HTTP 200 이 돌아온다**(실측 B-27).
 * 즉 **성공 응답이 오면서 절반만 된다.** 그래서 ① UI 가 생성 모달에서 지점을 묻지 않고
 * (명칭·설명만 — 사용자 결정) ② **타입에서 필드를 지워** 실수로 보낼 수 없게 한다.
 * 편성은 생성 후 상세에서 `UpdateCourse` 로 한다.
 *
 * ⚠️ `AddCourseDto` 에서 `points` 를 빼 달라고 백엔드에 요청해 뒀다(B-27). 받아들여지면
 * 이 주석의 전반부만 지우면 된다 — **우리 코드는 바뀌지 않는다.**
 *
 * 🔴 **생성된 `courseSeq` 를 응답에서 주지 않는다**(`data: true` 뿐). 생성 직후 상세로
 * 이동할 수 없다 — 목록으로 돌아가 재조회한다(`spec 023` §4).
 */
export interface AddCourseRequest {
  siteSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number | null
}

/**
 * `UpdateCourse` 의 편성 지점 1건 (`UpdateCoursePointDto`).
 *
 * 🔴 **기존 행은 `coursePointSeq` 로 식별한다.** 새로 추가하는 지점은 그 값이 없으므로
 * `null` 을 보낸다(swagger nullable).
 *
 * 🔴 **`useYn` 이 없다 — 보낼 수단이 아예 없다.** 응답(`CourseDetailPoint`)에는 있는데
 * 요청 DTO 에 없다 — **코스에서 바꿀 값이 아니다**(B-29 철회). 화면에 토글을
 * 만들면 저장해도 안 바뀐다.
 */
export interface UpdateCoursePointRequest {
  pointSeq: number
  coursePointSeq: number | null
  orderNo: number
  memo: string | null
  courseMin: number | null
}

/**
 * `PUT /api/v1/Course/W/sign/UpdateCourse`
 *
 * 🔴🔴 **`points` 는 전체 교체다**(실측 B-25). 생략·빈 배열·일부 전송이 **모두 나머지를
 * 삭제**한다. 그래서 `points` 를 **required 로 선언한다** — 선택 필드로 두면 기본정보만
 * 고치는 호출에서 빼먹고, 그 순간 **코스의 지점이 전부 사라진다.** 지점 하나를 더해도
 * **현재 전체 목록을 다시 보낸다**(`spec 023` §3 규칙 3 — "변경분만 보내기" 를 만들지 않는다).
 *
 * 🔴 **`courseSeq` 를 required 로 선언한다.** 누락 시 서버가 **401** 을 주고(B-28)
 * axios 인터셉터가 그것을 **토큰 만료로 오해**해 재발급·로그아웃 경로를 탄다. 즉 코스를
 * 저장하려다 **로그아웃되는** 증상이 된다. swagger 는 required 가 아니지만 **우리가 더
 * 엄격하게 간다.**
 *
 * 🔴 **`memo: null` 은 반영된다**(비워짐 — 규칙 6).
 */
export interface UpdateCourseRequest {
  siteSeq: number
  courseSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number | null
  points: UpdateCoursePointRequest[]
}

/**
 * `GET /api/v1/Course/W/sign/GetCourseList` 쿼리 파라미터.
 *
 * `siteSeq` 는 **required**. 나머지는 선택이며 값이 없으면 **키를 보내지 않는다**
 * ("전체" 를 뜻하는 특수값을 만들지 않는다 — 022 승계).
 *
 * 🔴 `pageNumber` 는 **1-based**(`api-spec.md` §1-5). 변환은
 * `lib/courseListParams.ts` 한 곳에서만 한다.
 *
 * ⚠️ `courseStatus` 의 값 체계가 **불완전하다** — 테스트 DB 에 `0`(대기중)만 있고
 * 1·2·3 으로 필터하면 `totalCount: 0` 이 온다(OQ-3). 필터 UI 에 어떤 값을 노출할지는
 * OQ-023-B.
 */
export interface CourseListParams {
  siteSeq: number
  searchKey?: string
  useYn?: boolean
  switchYn?: boolean
  courseStatus?: number
  pageNumber: number
  pageSize: number
}
