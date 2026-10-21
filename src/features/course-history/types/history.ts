import type { PointHistoryMemo } from './checkDetail'

/**
 * 순찰이력 응답 타입 — `docs/api-spec.md` §5-2 (15·17·19·20번 블록).
 *
 * 🔴 **`features/courses` 에 둔다**(코스 상세 B단). 소비처가 코스 상세 하나뿐이고,
 * `spec 025`(코스이력 전용 페이지)가 착수하면 **그쪽이 주인이 된다** — 그때
 * `features/course-history` 로 옮기거나 공유한다. ⚠️ 지금 `features/patrol-zones` 에 있는
 * 코스이력 화면은 **mock 전용 셸**이고 서버 타입과 무관하다(`spec 025` 가 교체한다).
 *
 * 🔴 **실측 그대로 전량 선언한다**(`CLAUDE.md` B4). 안 쓰는 필드도 둔다.
 */

/**
 * 순찰 중 남긴 메모. ✅ **구조 확정(백엔드 전달 2026-10-12, OQ-10 해소)**.
 *
 * ⚠️ **메모가 달린 샘플 데이터가 아직 없다**(빈 배열만 관측) — C단에서 쓴다.
 */
export interface CourseHistoryMemo {
  memoSeq: number
  memo: string
  /** 🔴 **nullable 이다** — 빈 배열이 아니라 `null` 이 올 수 있다 */
  attaches: CourseHistoryAttach[] | null
}

/** 메모 첨부. 🔴 `imagePath` 가 **절대 URL 인지 상대 경로인지 미확인**(OQ-13) */
export interface CourseHistoryAttach {
  attachSeq: number
  imagePath: string
  fileName: string
  fileExt: string
}

/**
 * `GET /api/v1/History/W/sign/GetCourseHistory` → `PagedData<CourseHistoryRow>`
 *
 * 🔴 **실측에서 나온 세 가지를 화면이 감당해야 한다**(2026-10-12):
 * 1. **`userList` 가 빈 배열인 이력이 실존한다** — 근무자 이름을 항상 그릴 수 없다.
 * 2. **`status: 1 완료` 인데 `checkedCount: 0` 인 행이 있다** — 상태와 인증률은 **독립**이다.
 *    "완료 = 전 지점 인증" 으로 묶으면 안 된다.
 * 3. **`actualElapsedTime` 에 시 단위가 온다**(`"02:17:40"`) — 분으로 가정하면 깨진다.
 *
 * ⚠️ `status` 는 **코스 사전**(`0` 진행중 / `1` 완료 / `2` 미완료)이다. 지점 사전(`0~4`)과
 * **값이 겹치는데 뜻이 다르다**(`2` = 코스 미완료 / 지점 **순찰제외**) — `api-spec.md` §4.
 */
export interface CourseHistoryRow {
  historySeq: number
  courseSeq: number
  courseName: string
  useYn: boolean
  startDt: string // ISO 8601, 타임존 없음
  endDt: string | null // 진행 중이면 null
  status: number // 🔴 코스 사전: 0=진행중 1=완료 2=미완료
  statusName: string
  overtimeYn: boolean // ⚠️ 상세·지점이력은 `overTimeYn`(대문자 T) — B-4
  pointCount: number
  checkedCount: number
  pauseTime: string // 'HH:mm:ss' — ⚠️ 상세는 number(B-5)
  actualElapsedTime: string // 'HH:mm:ss' — 🔴 시 단위가 온다
  hasMemo: boolean
  userList: { userSeq: number; userName: string }[] // 🔴 빈 배열이 실존한다
}

/**
 * `GET /api/v1/History/W/sign/GetCourseHistoryDetail?historySeq=` → `CourseHistoryDetail`
 *
 * 🔴 **목록과 필드명·타입이 어긋난다**(B-4·B-5) — 같은 값인데 이름이 다르다:
 * - `overTimeYn`(대문자 T) ↔ 목록은 `overtimeYn`
 * - `pauseTime: number` ↔ 목록은 `'HH:mm:ss'` **문자열**
 * 어댑터를 만들지 않고 **각자 실측대로 선언**한다(`CLAUDE.md` B4) — 어댑터로 이름을
 * 맞추면 어느 응답을 보고 있는지 호출부에서 사라진다.
 *
 * ⚠️ **`statusName` 이 없다**(목록에는 있다) — 라벨은 `lib/historyBadge.ts` 가 만든다.
 * ⚠️ **`siteSeq` 가 없다**(OQ-9 계열) — 다른 요청에 실을 값은 `getSiteSeq()` 로 보충한다.
 */
export interface CourseHistoryDetail {
  historySeq: number
  courseSeq: number
  courseName: string
  /** 🔴 상세는 대문자 T */
  overTimeYn: boolean
  /** 코스 사전(0·1·2). `statusName` 은 없다 */
  status: number
  startUserSeq: number
  startUserName: string
  startDt: string
  endDt: string | null
  /** 🔴 **검증되지 않은 값이다**(B-31) — 구간 합과 다를 수 있고 `0` 인 코스도 있다 */
  totalMin: number
  elapsedTime: string // 'HH:mm:ss'
  /** 🔴 상세는 number — 목록은 문자열(B-5) */
  pauseTime: number
  totalPointCount: number
  completedPointCount: number
  handoverCount: number
}

/**
 * `GET /api/v1/History/W/sign/GetPointHistory` → `PagedData<PointHistoryRow>`
 *
 * B단은 **`totalCount` 만** 쓴다(미인증 건수). 행은 C단에서 쓴다.
 *
 * ⚠️ `status` 는 **지점 사전**이다: `0` 대기중 / `1` 진행중 / **`2` 순찰제외** / `3` 미완료 /
 * `4` 완료.
 */
export interface PointHistoryRow {
  detailSeq: number
  courseSeq: number
  courseName: string
  pointSeq: number
  pointName: string
  checkDt: string
  userSeq: number
  userName: string
  authMethod: number | null
  authMethodName: string // null 일 때 '' (빈 문자열)
  status: number // 🔴 지점 사전
  statusName: string
  overTimeYn: boolean // ⚠️ 여기는 대문자 T — B-4
  hasMemo: boolean
  pauseTime: string // 'HH:mm:ss'
}

/**
 * 🔴 지점 상태 — **`순찰제외`(2) 가 있다**(백엔드 전달 2026-10-12).
 *
 * 인증률 분모에 순찰제외가 섞이면 **영원히 100% 가 안 되는 코스**가 생긴다. `pointCount`
 * 가 그것을 빼고 센 값인지 **미확인**이고 확인할 데이터도 없다 — 그래서 B단은 인증률을
 * **서버가 준 두 수의 비**로만 적고 **100% 미달을 경고로 바꾸지 않는다**.
 */
export const POINT_HISTORY_STATUS = {
  WAITING: 0,
  IN_PROGRESS: 1,
  EXCLUDED: 2,
  INCOMPLETE: 3,
  COMPLETED: 4,
} as const

/**
 * 인증수단 코드 (`api-spec.md` §4).
 *
 * ⚠️ **`features/points/lib/authMethod.ts` 와 겹치지 않는다** — 그쪽은 `'QR' | 'NFC'`
 * **문자열 enum ↔ 코드** 변환기(지점 생성·수정 폼이 쓴다)이고, 이력은 **응답의 정수를
 * 읽기만** 한다. 변환이 필요 없는데 변환기를 끌어오면 폼 전용 규약이 따라온다(A6).
 *
 * 🔴 **미인증·미완료 행은 `null`** 이다 — 사전에 없는 값이 아니라 **인증이 없었다**는 뜻이다.
 */
export const AUTH_METHOD = {
  QR: 9,
  NFC: 10,
} as const

/** 코스 상태 — 목록 `status` 와 요청 `eventType` 이 **같은 사전**을 쓴다(OQ-5 해소) */
export const COURSE_HISTORY_STATUS = {
  IN_PROGRESS: 0,
  COMPLETED: 1,
  INCOMPLETE: 2,
} as const

export interface CourseHistoryParams {
  siteSeq: number
  courseSeq?: number
  /** 🔴 `yyyy-MM-dd`. 시각을 붙여도 결과가 같아 붙이지 않는다(실측) */
  fromDt?: string
  /** 🔴 **그 날을 포함한다**(실측). from > to 면 **에러 없이 0건** 이므로 순서를 보장한다 */
  toDt?: string
  /** 코스 상태 필터 — `COURSE_HISTORY_STATUS` (OQ-5 해소) */
  eventType?: number
  userName?: string
  pageNumber: number
  pageSize: number
}

/**
 * `GetPointHistory` 쿼리 파라미터 — **목록 화면과 지점 상세가 같은 것을 쓴다**(`spec 037` T529).
 *
 * 🔴 **`siteSeq` 만 필수고 나머지는 전부 옵셔널이다.** 소비처가 두 종류이기 때문이다:
 * - 지점 상세(027)·지점 인증 상세(037)는 **`pointSeq` 로 좁혀** 그 지점만 본다
 * - 지점 순찰이력 목록(037)은 **`pointSeq` 없이** 사업장 전체를 보고 필터로 좁힌다
 *
 * 🔴 **`pointSeq` 를 필수로 두면 목록이 못 쓴다.** 통합 전 `features/points/types/history.ts`
 * 가 그렇게 좁혀 둬서(027 전용) 037 이 **같은 응답에 두 번째 타입을 만들 참이었다** —
 * 036 이 `PointResult` 에서 막 해소한 3중 분기와 같은 종류다.
 */
export interface PointHistoryParams {
  siteSeq: number
  courseSeq?: number
  pointSeq?: number
  /** 지점 상태 필터 — `POINT_HISTORY_STATUS`. ⚠️ 목록에 실재하는 값은 `3`·`4` 뿐이다 */
  status?: number
  /** 인증수단 필터 — `AUTH_METHOD`(9 QR / 10 NFC) */
  authMethod?: number
  /** 🔴 `yyyy-MM-dd`. **그 날을 포함한다**(실측). from > to 면 에러 없이 0건 */
  fromDt?: string
  toDt?: string
  /** 순찰자명 부분 검색. 🔴 드롭다운이 아니라 **텍스트**다 — 현장 계정은 `UserList` 가 403 */
  userName?: string
  /**
   * 순찰자 **정확 일치**(`spec 038` 근무자 상세 — 최근 순찰 기록). 실측 2026-10-21: 그 사람 행만
   * 오고 최신순이다. 이름 부분 검색(`userName`)과 달리 동명이인이 섞이지 않는다
   */
  userSeq?: number
  /** 코스명 부분 검색. ⚠️ 037 은 쓰지 않는다(코스는 셀렉트) — 실측 파라미터라 선언만 둔다 */
  courseName?: string
  pageNumber: number
  pageSize: number
}

/**
 * `GET /api/v1/History/W/sign/GetPointHistoryDetail?detailSeq=` → `PointHistoryDetail`
 * (`api-spec.md` §5-2 20번, `spec 037` T530)
 *
 * 🔴 **목록과 어긋나는 것이 둘이다** — 같은 값인데 이름·null 표현이 다르다:
 * | | 목록(`PointHistoryRow`) | 상세(여기) |
 * |---|---|---|
 * | 시간초과 | `overTimeYn`(대문자 T) | **`overtimeYn`**(소문자) |
 * | 인증수단명 null | `''` | **`'Unknown'`** |
 *
 * ⚠️ **`pauseTime` 은 양쪽 다 `'HH:mm:ss'` 문자열이다**(실측, `api-spec.md` §5-2 20번).
 * 🔴 **B-5(목록 문자열 ↔ 상세 숫자)는 코스 쪽 이야기다** — `CourseHistoryDetail` 만
 * `number` 다. 지점 상세까지 숫자로 적어 두면 **분을 초로 읽는 코드**가 들어간다.
 *
 * 어댑터를 만들지 않고 **각자 실측대로 선언**한다(`CLAUDE.md` B4 — `CourseHistoryDetail`
 * 과 같은 판단). 어댑터로 이름을 맞추면 어느 응답을 보고 있는지 호출부에서 사라진다.
 *
 * 🔴 **`'Unknown'` 을 화면에 그대로 내보내지 않는다.** 영문이 섞이고 "알 수 없는 인증수단"
 * 처럼 읽히는데, 실제로는 **인증이 없었다**는 뜻이다 → 빈 칸으로 그린다.
 *
 * 🔴 **`historySeq` 가 없다.** `courseSeq` 만 있어서 "그 회차 안에서의 위치"(직전 지점 간격 ·
 * 코스 내 순서 · 타임라인 · 코스 상세 링크)를 **만들 수 없다** — `spec 037` US4 가 백엔드
 * 회신 대기 중인 이유다.
 */
export interface PointHistoryDetail {
  detailSeq: number
  pointSeq: number
  pointName: string
  /** 🔴 상세는 소문자 t — 목록은 `overTimeYn`(B-4) */
  overtimeYn: boolean
  hasMemo: boolean
  /** 지점 사전(`POINT_HISTORY_STATUS`) */
  status: number
  statusName: string
  /** 🔴 **인증 시점 좌표**다. 미인증 행은 `null` — 지점 등록 좌표와 다른 값이다 */
  gpsLat: number | null
  gpsLng: number | null
  courseSeq: number
  courseName: string
  userSeq: number
  userName: string
  /** `'HH:mm:ss'` — ⚠️ 목록과 **같은 타입**이다(코스 상세만 number 다, B-5) */
  pauseTime: string
  /** ✅ **지점 인증 시간**이다(사용자 DB 확인 2026-10-19, OQ-15 해소) */
  checkDt: string
  authMethod: number | null
  /** 🔴 null 일 때 **`'Unknown'`** — 목록은 `''` 다. 화면에는 내보내지 않는다 */
  authMethodName: string
  /** 🔴 코스 쪽 `memos` 와 **구조가 다르다**(B-35) — 어댑터가 흡수한다 */
  memoList: PointHistoryMemo[]
}
