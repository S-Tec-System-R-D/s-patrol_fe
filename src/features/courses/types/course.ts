/**
 * 순찰코스 응답 타입 — `docs/api-spec.md` §5-2 (12·13·14번 블록).
 *
 * 🔴 **실측 그대로 전량 선언한다**(`CLAUDE.md` B4). 안 쓰는 필드도 둔다 — 서버 응답이
 * 메인이고, 우리가 "쓸 것만" 남기면 다음 사람이 서버에 더 있는 줄 모른다.
 *
 * 🔴 **구 `features/zone` 의 `ZoneType` 과 섞지 않는다.** 그쪽은 mock 전용 셸 타입이고
 * (`id: string` · `createdAt: Date` · `timeLimit` · `isActive` · `isRotation`) 서버와
 * **이름·타입·개수가 전부 다르다.** 어댑터 조건 3개(목록↔상세 차이 · 정수 enum ·
 * 포맷 차이) 중 해당하는 것이 없어 **어댑터를 만들지 않고 교체**한다
 * (`spec 023` tasks 제약 1). 구 타입은 `spec 023` Phase 2 에서 제거된다.
 */

/**
 * 코스의 최근 순찰 1건. **이력이 없으면 `history` 자체가 `null`** 이다.
 *
 * ⚠️ 필드가 전부 `history~` 접두사를 갖는다 — 중첩 객체인데 접두사가 또 붙는다
 * (서버 네이밍). 평탄화하지 않는다.
 */
export interface CourseRowHistory {
  historySeq: number
  historyUserSeq: number
  historyUserName: string
  historyStatusCode: number
  historyStatusName: string
  historyEndDt: string // ISO 8601, 타임존 없음
}

/**
 * `GET /api/v1/Course/W/sign/GetCourseList` → `PagedData<CourseRow>`
 *
 * 🔴 **설명(`memo`)이 목록에 없다.** 상세에만 있다 — 목록 컬럼에 설명을 넣을 수 없다.
 */
export interface CourseRow {
  courseSeq: number
  courseName: string
  useYn: boolean
  switchYn: boolean // 교대 사용
  totalMin: number
  courseStatusCode: number
  courseStatusName: string
  pointCount: number
  history: CourseRowHistory | null
}

/**
 * `GetCourseDetail` 의 편성 지점 1건.
 *
 * 🔴 **`coursePointSeq` 가 편성 행의 식별자다.** `UpdateCourse` 가 이 값으로 기존 행을
 * 알아본다 — 새로 추가하는 지점은 이 값이 없다(`null`).
 *
 * ⚠️ **`authMethodName` 이 없다.** 목록(`ClassificationPoint`)에는 있는데 여기엔 코드만
 * 온다 — 이름이 필요하면 `lib/authMethod.ts` 로 변환한다.
 *
 * 🔴🔴 **`useYn` 은 지금 아무 정보도 주지 않는다 — 항상 `true` 다**(실측 2026-10-13,
 * `spec 028`). 지점을 `useYn=false` 로 꺼도 그 지점이 편성된 코스 3개(65·37·38)에서
 * 모두 `true` 로 내려왔다. **지점의 실제 값을 따라오지 않는다.**
 *
 * 🔴 요청 DTO(`UpdateCoursePointDto`)에 `useYn` 이 없는 것은 **결함이 아니다** —
 * "코스 안에서 이 지점만 미사용" 이라는 개념 자체가 없고(사용자 확인 2026-10-13),
 * 사용여부는 **지점 상세에서만** 바꾼다. 그래서 **B-29 는 철회**했다. 편집 수단을
 * 만들지 않는 결론은 그대로이되 **근거가 바뀌었다**(서버에 수단이 없어서가 아니라
 * 여기서 바꿀 값이 아니라서).
 */
export interface CourseDetailPoint {
  coursePointSeq: number
  pointSeq: number
  pointName: string
  authMethod: number // 9=QR / 10=NFC (api-spec.md §4)
  orderNo: number
  useYn: boolean // 🔴 항상 true — 지점의 실제 값을 따라오지 않는다(실측 2026-10-13)
  courseMin: number // 이 지점까지의 구간 시간(분)
}

/**
 * `GET /api/v1/Course/W/sign/GetCourseDetail?courseSeq=` → `CourseDetail`
 *
 * 🔴 **`siteSeq` 가 응답에 없다**(OQ-9). 그런데 `UpdateCourseDto` 는 `siteSeq` 를
 * 요구한다 → `getSiteSeq()`(spec 021)가 들고 있는 값으로 보충한다. 상세만 보고
 * 수정 요청을 만들 수 없다는 뜻이다.
 *
 * ⚠️ 목록(`CourseRow`)에 있는 `courseStatusCode`·`pointCount` 가 **상세에는 없다.**
 * 상세에서 상태 뱃지를 보여주려면 목록 값을 들고 오거나 생략해야 한다.
 */
export interface CourseDetail {
  courseSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number
  points: CourseDetailPoint[]
}

/**
 * `GET /api/v1/Course/W/sign/GetClassificationPoint?siteSeq=` → `ClassificationPoint[]`
 *
 * 코스 편성용 **지점 후보 목록**이다.
 *
 * 🔴 **`PagedData` 가 아니라 배열이 직접 온다**(실측 §5-2 14번). 페이징이 없어 사업장의
 * 지점이 **전량** 내려온다 — 후보가 많으면 클라이언트에서 검색해야 한다(OQ-023-C).
 *
 * ✅ `useYn` 이 없지만 **필요 없다** — 서버가 미사용 지점을 후보에서 **제외하고 준다**
 * (실측 2026-10-13, `spec 028`).
 */
export interface ClassificationPoint {
  pointSeq: number
  pointName: string
  memo: string | null
  authMethod: number
  authMethodName: string
}
