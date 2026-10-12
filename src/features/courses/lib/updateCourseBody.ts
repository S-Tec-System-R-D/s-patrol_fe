import type {
  CourseDetail,
  CourseDetailPoint,
  UpdateCoursePointRequest,
  UpdateCourseRequest,
} from '../types'

/**
 * `UpdateCourse` 요청 바디를 **한 자리에서** 만든다 (`spec 023` Phase 4).
 *
 * 🔴🔴 **이 파일이 Phase 4 에서 가장 위험한 자리다.** `UpdateCourse` 는 코스의
 * 기본정보 수정 · 활성화 토글 · 교대 허용 토글 · 지점 편성이 **모두 쓰는 하나의
 * 엔드포인트**이고, `points` 는 **전체 교체**다(B-25). 호출부마다 바디를 손으로 만들면
 * 네 자리 중 **한 곳만 `points` 를 빼먹어도 그 코스의 지점이 전부 사라지고 200 이 온다.**
 * 그래서 바디 생성을 함수 하나로 모으고, 호출부는 **바꾸고 싶은 것만** 넘긴다.
 *
 * 세 가지를 타입·기본값으로 못 박는다:
 * 1. `courseSeq` — 누락 시 **401**(B-28). 인터셉터가 토큰 만료로 오해해 **저장하려다
 *    로그아웃**된다. `course.courseSeq` 에서 항상 채운다.
 * 2. `points` — 넘기지 않으면 **현재 편성 전량**이 들어간다. 생략이 "유지" 가 아니라
 *    "삭제" 이기 때문에, 기본값이 빈 배열이면 안 된다(B-25).
 * 3. `totalMin` — 항상 **`null`** 을 보낸다. 사유는 아래 실측 블록.
 *
 * 🔴 **`siteSeq` 는 상세 응답에 없다**(OQ-9). 호출부가 `getSiteSeq()`(spec 021 저장값)로
 * 보충해 인자로 준다 — **상세만 보고 수정 요청을 만들 수 없다.**
 */

/**
 * 🔴 **실측(2026-10-12, B-31): `totalMin` 은 서버가 계산하지 않는다 — 보낸 값을 그대로
 * 저장한다.** 구간시간 합(`courseMin`)과 **맞는지 검사하지 않는다**: 지점 2개가 10분+15분
 * 인데 `totalMin: 99` 를 보내면 **99 가 저장되고 200 이 온다.** 즉 화면의 "총 소요시간" 이
 * 지점 합과 다른 값일 수 있다.
 *
 * ✅ **단, `totalMin: null` 을 보내면 서버가 `courseMin` 합으로 채운다**(실측: 합 15 →
 * 15, 합 9 → 9, 지점 0개 → 0). 그래서 **우리는 언제나 `null` 을 보낸다** — 프론트에서
 * 합을 계산해 보내는 것보다 정확하고(서버가 저장한 `courseMin` 이 기준), 둘이 어긋날
 * 경로가 아예 사라진다.
 *
 * ⚠️ 그래서 **총 소요시간은 사용자가 직접 입력하는 값이 아니다** — 구간시간을 고치면
 * 따라 바뀐다. 수정 모달에 "총 소요시간" 입력을 두지 않는 이유다.
 */
const SERVER_DERIVES_TOTAL = null

/**
 * 편성 지점을 요청 형태로 바꾼다 — **순서를 건드리지 않는다.**
 *
 * 🔴 **`orderNo` 를 다시 매기지 않는다.** 서버는 중복 `orderNo` 도 그대로 저장하므로
 * (실측 2026-10-12) 다른 경로로 들어간 순서가 비정상일 수 있는데, 토글 한 번에 그것을
 * 조용히 정규화하면 **사용자가 건드리지 않은 데이터가 바뀐다.** 순서를 1..N 으로 다시
 * 매기는 것은 **드래그로 순서를 직접 바꾼 경우뿐**이다(`lib/coursePointOrder.ts`).
 *
 * 🔴 **`memo` 는 항상 `null` 이다 — 알고도 보낸다.** 구간 메모는 **쓰기 전용**이라
 * (`GetCourseDetail.points[]` 에 필드가 없다, B-30) 기존 값을 읽을 방법이 없다. 전량
 * 전송 규약과 겹쳐 **다른 경로로 들어간 메모가 저장할 때마다 지워진다** — 피할 수단이
 * 없으므로 UI 를 만들지 않고(T367), 이 사실을 여기 적어 둔다. `GetCourseDetail` 이
 * `memo` 를 돌려주게 되면 이 한 줄만 바뀐다.
 *
 * 🔴 **`coursePointSeq` 를 그대로 실어 보낸다.** 기존 편성 행의 식별자이고, 보내면
 * 서버가 그 행을 유지한다(실측: 93·94 를 보내면 93·94 가 남는다). `null` 로 보내면
 * **새 행이 생겨 번호가 바뀐다**(실측: 93·94 → 95·96).
 */
export const toUpdateCoursePoints = (points: CourseDetailPoint[]): UpdateCoursePointRequest[] =>
  points.map((point) => ({
    pointSeq: point.pointSeq,
    coursePointSeq: point.coursePointSeq,
    orderNo: point.orderNo,
    memo: null, // 🔴 B-30 — 읽을 수 없는 값이라 보존할 수 없다
    courseMin: point.courseMin,
  }))

/**
 * 바꾸고 싶은 필드만 넘긴다. 넘기지 않은 것은 **현재 상세 값 그대로** 나간다.
 *
 * ⚠️ `memo` 는 `undefined`(안 바꿈)와 `null`(비움)을 구분해야 하므로 `??` 를 쓰지 않는다 —
 * 🔴 코스의 `memo: null` 은 **실제로 반영된다**(비워진다). 지점(`UpdatePoint`)은 `null`·
 * `''` 를 무시해 값을 비울 수 없는데(B-15) **코스는 반대다.**
 */
export interface UpdateCourseOverrides {
  courseName?: string
  memo?: string | null
  useYn?: boolean
  switchYn?: boolean
  /** 🔴 편성을 바꿀 때만 넘긴다. 넘기지 않으면 **현재 편성 전량**이 나간다 */
  points?: UpdateCoursePointRequest[]
}

export const toUpdateCourseBody = (
  course: CourseDetail,
  siteSeq: number,
  overrides: UpdateCourseOverrides = {}
): UpdateCourseRequest => ({
  siteSeq,
  // 🔴 누락 시 401 → 인터셉터가 토큰 만료로 오해한다(B-28). 여기서 항상 채운다
  courseSeq: course.courseSeq,
  courseName: overrides.courseName ?? course.courseName,
  memo: overrides.memo === undefined ? course.memo : overrides.memo,
  useYn: overrides.useYn ?? course.useYn,
  switchYn: overrides.switchYn ?? course.switchYn,
  totalMin: SERVER_DERIVES_TOTAL,
  // 🔴 전체 교체다 — 생략하면 지점이 전부 사라진다(B-25)
  points: overrides.points ?? toUpdateCoursePoints(course.points),
})
