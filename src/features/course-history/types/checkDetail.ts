/**
 * 코스 순찰 상세 — 지점 인증 내역 (`spec 036`).
 *
 * `GET /api/v1/History/W/sign/GetCourseHistoryCheckDetails?historySeq=`
 * → `CheckDetailRow[]` (🔴 `PagedData` 가 아니라 **배열 직접**, 페이징 없음)
 *
 * 실측 그대로 **전량 선언**한다 — 지금 쓰지 않는 필드도 둔다(`CLAUDE.md` B4).
 */

/**
 * 🔴🔴 **null 이 오는 필드가 셋 있다**(실측 2026-10-16, 166행 전수).
 *
 * `api-spec.md` 는 `checkUserSeq: number` / `userName: string` / `overtimeYn: boolean` 로
 * 적어 뒀었는데 **틀렸다**(같은 날 교정). 인증이 찍히지 않은 행은 **세 필드 모두 `null`** 이다.
 * 타입을 믿고 `userName.charAt(0)` 같은 접근을 하면 **런타임에서 터진다.**
 *
 * **상태별 필드 실태** (166행 전수 — `api-spec.md` §4 분포표와 같은 측정)
 * | status | checkDt | authMethod · 좌표 | 순찰자 · overtimeYn |
 * |---|---|---|---|
 * | 0 대기중 (3건) | 전부 null | 전부 null | 전부 null |
 * | 1 진행중 (2건) | 전부 null | 전부 null | 전부 null |
 * | 3 미완료 (124건) | **79 null / 45 값** | 전부 null | null 79 / 값 45 |
 * | 4 완료 (37건) | 전부 값 | ⚠️ **null 3건**(OQ-16) | ⚠️ null 3건 |
 *
 * 🔴 **`미완료`(3) 는 두 종류다** — `checkDt` 로 갈린다.
 * - `null` → **미인증**: 아예 가지 않았다(목업의 "방문 기록이 없습니다")
 * - 값 있음 → **미완료**: 순찰자·시각은 남았는데 **인증이 안 됐다**
 *
 * 🔴 **그 `checkDt` 를 "인증 시각" 으로 쓰면 안 된다**(OQ-15). 코스 `endDt` 와 같은 것이
 * 12건, 다른 것이 33건이라 **의미가 확정되지 않았다** — 화면에서는 숨긴다.
 *
 * ⚠️ `status` 는 **지점 사전**(`0~4`)이다. 코스 사전(`0~2`)과 값이 겹치는데 뜻이 다르다 —
 * `2` 가 코스에서는 `미완료`, 지점에서는 **`순찰제외`** 다. `historyBadge.ts` 를 쓸 것.
 */
export interface CheckDetailRow {
  detailSeq: number
  pointSeq: number
  pointName: string
  /** 🔴 지점 사전: 0=대기중 1=진행중 2=순찰제외 3=미완료 4=완료 */
  status: number
  /** 🔴 미완료의 두 종류를 가르는 필드. **인증 시각이 아니다**(OQ-15) */
  checkDt: string | null
  authMethod: number | null
  /** 🔴 `userSeq` 가 아니다. **null 이 온다** */
  checkUserSeq: number | null
  /** 🔴 **null 이 온다** */
  userName: string | null
  /** 🔴 서버가 중복 값을 저장한다 — 순번은 **배열 위치**로 센다(`spec 032` 선례) */
  orderNo: number
  /** 🔴 **인증 시점의 위치**다. 미인증 행은 null — 지점 등록 좌표는 `GetCourseDetail` 에 있다 */
  gpsLat: number | null
  gpsLng: number | null
  /** 🔴 **null 이 온다** */
  overtimeYn: boolean | null
  /** 순찰 중 남긴 메모 + 첨부 */
  memos: CheckDetailMemo[]
}

/**
 * 인증 내역의 메모.
 *
 * 🔴 **작성자·작성시각이 없다**(실측 확정 2026-10-16 — 세 필드가 전부다). 화면의
 * "누가 언제" 는 **행의 `userName`·`checkDt`** 로 대체한다.
 * 🔴 **"처리 상태"(시설팀 접수 등) 필드도 없다** — 목업에 있었지만 서버에 없다.
 */
export interface CheckDetailMemo {
  memoSeq: number
  memo: string
  /** 🔴 **nullable 이다** — 빈 배열이 아니라 `null` 이 올 수 있다 */
  attaches: CheckDetailAttach[] | null
}

/**
 * 메모 첨부.
 *
 * 🔴🔴 **URL 은 오지만 파일을 받을 수 없다 — 404 다**(B-40, 실측 2026-10-16).
 * `imagePath` 는 절대 URL 로 정상적으로 내려오는데(OQ-13) 실제로 요청하면 404 + 0바이트다
 * (순찰 2건·공지 1건 전부, 토큰 유무 무관). **응답에 경로가 있어 "데이터 있음" 으로 보이므로**
 * 화면은 **`onError` 폴백**을 반드시 둔다 — 없으면 깨진 이미지만 뜨고 원인을 알 수 없다.
 */
export interface CheckDetailAttach {
  attachSeq: number
  /** 절대 URL. ⚠️ 스킴이 `http` 라 운영이 HTTPS 면 mixed content 로 차단된다(OQ-13) */
  imagePath: string
  fileName: string
  fileExt: string
}

/**
 * 지점이력 쪽 메모 — **`spec 037` 이 쓴다.** 036 은 선언만 하고 쓰지 않는다.
 *
 * 🔴 **같은 데이터인데 이름이 다르다**(B-35, 실측 2026-10-16 `detailSeq 186`):
 * 코스는 `memos`/`attaches`/`imagePath`/`fileExt`, 지점은 `memoList`/`attachList`/
 * `attachPath` 이고 **`fileExt` 가 없다**. `memoSeq`·`attachSeq`·URL 은 **같은 값**이다.
 * → 백엔드에 통일을 요청해 뒀고, 그때까지 어댑터가 하나 더 필요하다.
 */
export interface PointHistoryMemo {
  memoSeq: number
  memo: string
  attachList: PointHistoryAttach[]
}

/** 지점이력 쪽 첨부 — 🔴 `fileExt` 가 없다(B-35). `spec 037` 이 쓴다 */
export interface PointHistoryAttach {
  attachSeq: number
  /** 코스는 `imagePath`. 값은 같은 절대 URL이고 **똑같이 404 다**(B-40) */
  attachPath: string
  fileName: string
}
