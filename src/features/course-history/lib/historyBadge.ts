import { COURSE_HISTORY_STATUS, POINT_HISTORY_STATUS } from '../types'

/**
 * 순찰이력 결과 뱃지 — **화면별 매핑의 SSOT** (`spec 036` T491).
 *
 * 🔴🔴 **매핑을 "응답 단위" 가 아니라 "화면 단위" 로 나눈다.** 두 응답이 **내려주는 범위가
 * 다르기 때문이다**(실측 2026-10-16, `api-spec.md` §4):
 *
 * | status | `CheckDetails`(코스 상세) | `GetPointHistory`(지점이력) |
 * |---|---|---|
 * | 0 대기중 | 3건 | **0건** |
 * | 1 진행중 | 2건 | **0건** |
 * | 2 순찰제외 | **0건** | **0건** |
 * | 3 미완료 | 124건 | 45건 |
 * | 4 완료 | 37건 | 41건 |
 *
 * `GetPointHistory` 는 **`checkDt` 가 있는 행만** 준다 — 미완료 124건 중 45건이고 그
 * 45건이 지점이력의 미완료다. 겹치는 82행에서 `status`·`checkDt` **불일치 0건**이었다.
 * 즉 두 응답은 모순되지 않고 **범위가 다르다.** 한쪽 매핑표를 다른 쪽에 쓰면 쓰이지 않는
 * 분기를 끌고 다니거나(지점) 빠진 값을 만난다(코스).
 *
 * 🔴 **공용 enum 으로 묶지 않는다** — 코스 `2` = `미완료`, 지점 `2` = **`순찰제외`** 다.
 * 값이 겹치는데 뜻이 다르다(B-7: 백엔드 확인 결과 **의도된 것**이다).
 *
 * 🔴 **`시간초과`를 결과 뱃지에 섞지 않는다.** `overtimeYn` 은 `status` 와 **독립 축**이라
 * 뱃지를 **2개 병기**한다(사용자 결정 2026-10-16). 실측에 `status 4` + `overtimeYn` +
 * 메모가 **동시에 참인 행이 실재**한다(`detailSeq 85`) — 하나로 접으면 우선순위를 정해야
 * 하고 어느 쪽이든 정보가 사라진다. 그래서 `overtimeBadge()` 가 **별 함수**다.
 */

export type BadgeVariant = 'success' | 'point' | 'warning' | 'danger' | 'muted'

export interface HistoryBadge {
  variant: BadgeVariant
  label: string
}

/** 알 수 없는 값. 🔴 **빈 칸으로 두지 않는다** — 값이 없는 것과 모르는 것은 다르다 */
const UNKNOWN: HistoryBadge = { variant: 'muted', label: '알 수 없음' }

/**
 * 코스 순찰 결과 — **코스 사전**(`0` 진행중 / `1` 완료 / `2` 미완료).
 *
 * ⚠️ `0 진행중` 은 테스트 DB 에 **0건**이다(OQ-036-A) — `eventType=0` 으로만 조회되고
 * mock 시드로 검증한다. 사전은 백엔드 확인으로 확정돼 있다(OQ-5 해소).
 *
 * ⚠️ 서버가 `statusName` 을 함께 주지만(목록만) **상세에는 없다** — 그래서 라벨을 여기
 * 둔다. 목록에서도 이 함수를 써서 두 화면의 문구가 갈라지지 않게 한다.
 */
export const courseResultBadge = (status: number): HistoryBadge => {
  switch (status) {
    case COURSE_HISTORY_STATUS.IN_PROGRESS:
      return { variant: 'point', label: '진행중' }
    case COURSE_HISTORY_STATUS.COMPLETED:
      return { variant: 'success', label: '완료' }
    case COURSE_HISTORY_STATUS.INCOMPLETE:
      return { variant: 'danger', label: '미완료' }
    default:
      return UNKNOWN
  }
}

/**
 * 코스 상세의 **지점 인증 결과** — **지점 사전**(`0~4`). 코스 상세 테이블 전용이다.
 *
 * 🔴 **`미완료`(3) 를 두 종류로 가른다** — `checkDt` 로 갈린다(실측: 79 vs 45):
 * - `null` → **미인증**: 아예 가지 않았다. 순찰자·시각도 전부 없다
 * - 값 있음 → **미완료**: 순찰자·시각은 남았는데 인증이 안 됐다(`authMethod` 는 null)
 *
 * 둘을 한 뱃지로 묶으면 **"안 간 것" 과 "갔는데 인증 실패" 가 구분되지 않는다** — 관리자가
 * 해야 할 일이 다르다(전자는 순찰 누락, 후자는 태그·단말 문제일 수 있다).
 *
 * 🔴 **`완료`(4) 는 `hasMemo` 로 갈린다** — 서버 `status` 에 그 구분이 없다. 메모가 있으면
 * `순찰기록`(정보성), 없으면 `이상없음`. `design-system.md` §1-1 의 5종 매핑이 이것이다.
 *
 * ⚠️ `순찰제외`(2) 는 전 사업장 **0건**이다(OQ-18). 매핑은 두지만 **실데이터로 확인할 수
 * 없다** — 쓰이기 시작하면 인증률 분모도 함께 봐야 한다.
 *
 * @param hasMemo 그 행의 `memos.length > 0`
 */
export const pointCheckBadge = (
  status: number,
  checkDt: string | null,
  hasMemo: boolean
): HistoryBadge => {
  switch (status) {
    case POINT_HISTORY_STATUS.WAITING:
      return { variant: 'muted', label: '대기중' }
    case POINT_HISTORY_STATUS.IN_PROGRESS:
      return { variant: 'point', label: '진행중' }
    case POINT_HISTORY_STATUS.EXCLUDED:
      return { variant: 'warning', label: '순찰제외' }
    case POINT_HISTORY_STATUS.INCOMPLETE:
      return checkDt === null
        ? { variant: 'danger', label: '미인증' }
        : { variant: 'danger', label: '미완료' }
    case POINT_HISTORY_STATUS.COMPLETED:
      return hasMemo
        ? { variant: 'point', label: '순찰기록' }
        : { variant: 'success', label: '이상없음' }
    default:
      return UNKNOWN
  }
}

/**
 * 시간초과 — 🔴 **결과 뱃지와 나란히 놓는 별 뱃지다.**
 *
 * `null` 이면 뱃지를 **그리지 않는다**(인증이 찍히지 않은 행은 이 필드가 null 이다 —
 * `false` 와 다르다. "초과하지 않았다" 가 아니라 "판단할 근거가 없다" 다).
 *
 * ⚠️ 필드명이 응답마다 다르다(B-4): 코스 목록·`CheckDetails` 는 `overtimeYn`(소문자 t),
 * 코스 상세는 `overTimeYn`, 지점이력은 `overTimeYn` — **호출부가 맞는 필드를 넘긴다.**
 */
export const overtimeBadge = (overtimeYn: boolean | null | undefined): HistoryBadge | null =>
  overtimeYn === true ? { variant: 'danger', label: '시간초과' } : null
