import { format, subDays } from 'date-fns'

/**
 * 코스 상세가 보는 기간 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **30일 고정이고 기간 변경 UI 가 없다**(사용자 결정 2026-10-12). 서버에 집계
 * 엔드포인트가 없어 **행을 받아 프론트가 더하기** 때문이다 — 30일이면 코스당 수십 행이라
 * 한 요청으로 끝나지만, 6개월·1년을 열면 전량 조회가 무너진다. 그 요구가 생기면
 * **집계 API 를 요청하고** 그때 기간 선택을 만든다.
 *
 * 🔴 **`from ≤ to` 를 여기서 보장한다.** 실측(2026-10-12) `from > to` 는 에러가 아니라
 * **200 + 0건** 이라, 뒤집힌 구간은 "이력 없음" 으로 보이고 버그처럼 보이지 않는다.
 */

/** 오늘을 포함한 30일 */
export const HISTORY_DAYS = 30

/** 🔴 `yyyy-MM-dd` — 시각을 붙여도 결과가 같아 붙이지 않는다(실측) */
const DATE_FORMAT = 'yyyy-MM-dd'

export interface HistoryRange {
  fromDt: string
  toDt: string
}

/**
 * 기준일(기본 오늘)로부터 **오늘을 포함한 30일** 구간.
 *
 * `toDt` 는 **그 날을 포함**하므로(실측) 오늘을 그대로 끝으로 둔다.
 */
export const recentRange = (today: Date = new Date(), days: number = HISTORY_DAYS): HistoryRange => ({
  fromDt: format(subDays(today, days - 1), DATE_FORMAT),
  toDt: format(today, DATE_FORMAT),
})
