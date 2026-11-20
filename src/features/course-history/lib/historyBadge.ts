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

export type BadgeVariant = 'success' | 'point' | 'warning' | 'danger' | 'muted' | 'neutral' | 'pending'

export interface HistoryBadge {
  variant: BadgeVariant
  label: string
}

/** 알 수 없는 값. 🔴 **빈 칸으로 두지 않는다** — 값이 없는 것과 모르는 것은 다르다 */
const UNKNOWN: HistoryBadge = { variant: 'muted', label: '알 수 없음' }

/**
 * 코스 순찰 결과 — **코스 사전**(`0` 진행중 / `1` 완료 / `2` 미완료).
 *
 * 🔄🔄 **`spec 079` D13(백엔드 회신 · 사용자 결정 2026-11-17): 회차는 `진행중` / `완료` / `미완료` 세 가지다.**
 * 서버 `2` 는 지점 결과가 아니라 **근무자가 도중에 순찰 종료를 누른 회차**다(`1` 은 종료를 누르지 않고 끝까지 간 회차 —
 * 지점을 전부 건너뛰어도 `완료`). 회차 자체의 상태라 그대로 적는다(D11 의 `2 → 완료` 를 되돌렸다). 회색(`neutral`).
 * 🔴 **회차 줄에는 회차 상태만** — 지점의 `미인증` 은 회차를 열었을 때만 보인다. `시간초과` 는 따로 붙는 뱃지(아래 `overtimeBadge`).
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
      return { variant: 'neutral', label: '미완료' }
    default:
      return UNKNOWN
  }
}

/**
 * 코스 상세의 **지점 인증 결과** — **지점 사전**(`0~4`). 코스 상세 테이블 전용이다.
 *
 * 🔴 **`미완료`(3) 는 화면 어디서나 `미인증` 하나다**(`spec 079` D8 사용자 결정 2026-11-16).
 * 서버는 건너뛴 지점(뒤 지점을 먼저 찍은 순간 `3` + `checkDt`)과 종료로 남은 지점(`3` · `checkDt` 없음)을
 * **같은 상태**로 둔다(백엔드 확인). 예전(077~)엔 `checkDt` 로 `건너뜀` · `미인증` 을 갈랐는데,
 * 둘 다 "인증이 남지 않았다" 이고 이름이 둘이면 헷갈린다 → 하나로. 🔄 색은 회색(`neutral`, D13 — 주황에서 바꿨다).
 *
 * 🔴 **`완료`(4) 는 `인증`** 이다 — 결과 칸에는 결과만(`spec 079` D15). 예전의 `이상없음` ↔ `순찰기록` 은 결과와
 * 메모 여부를 한 말에 묶은 것이라 뺐다(`이상없음` 은 "메모 없음" 일 뿐인데 "문제없음" 으로 읽혔다).
 * `hasMemo` 를 넘기면 `특이사항`(주황)을 준다 — **정상은 뱃지를 달지 않고 예외만 다는 자리**(순찰 상세 타임라인 ·
 * 지점 상세 순찰 기록)에서만 쓴다. 목록 · 상세 머리는 `false` 로 불러 `인증` 을 받고 특이사항은 따로 표시한다.
 *
 * ⚠️ `순찰제외`(2) 는 전 사업장 **0건**이다(OQ-18). 매핑은 두지만 **실데이터로 확인할 수
 * 없다** — 쓰이기 시작하면 인증률 분모도 함께 봐야 한다.
 *
 * @param hasMemo 그 행의 `memos.length > 0`
 */
export const pointCheckBadge = (status: number, hasMemo: boolean): HistoryBadge => {
  switch (status) {
    case POINT_HISTORY_STATUS.WAITING:
      return { variant: 'pending', label: '대기중' }
    case POINT_HISTORY_STATUS.IN_PROGRESS:
      return { variant: 'point', label: '진행중' }
    case POINT_HISTORY_STATUS.EXCLUDED:
      return { variant: 'warning', label: '순찰제외' }
    case POINT_HISTORY_STATUS.INCOMPLETE:
      return { variant: 'neutral', label: '미인증' }
    case POINT_HISTORY_STATUS.COMPLETED:
      return hasMemo
        ? { variant: 'warning', label: '특이사항' }
        : { variant: 'success', label: '인증' }
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
