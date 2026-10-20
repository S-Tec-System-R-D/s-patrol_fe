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

/**
 * `Date` → `yyyy-MM-dd` 쿼리 값 (`spec 037` T544 에서 승격).
 *
 * 🔴 **타임존 없이 로컬 날짜로 찍는다.** `toISOString()` 을 쓰면 UTC 로 밀려 **한국 시간
 * 오전 9시 이전이 전날**이 된다 — 서버는 날짜만 받으므로(`api-spec.md` §1) 하루가 통째로
 * 어긋난다.
 *
 * 🔴 **036 이 `PatrolZonesPage` 안에 두고 있던 것을 올렸다.** 037 이 **두 번째 소비처**고
 * 두 화면이 글자까지 같다 — 사본을 만들면 한쪽만 고쳐진다(`lib/listQuery.ts` 머리말이
 * `ALL_VALUE` 를 올릴 때 쓴 것과 같은 기준). ⚠️ `date-fns` `format` 을 쓰지 않는 이유는
 * 없다 — 승격하면서 같은 모듈의 `DATE_FORMAT` 을 쓰도록 통일했다.
 */
export const toDateQuery = (date: Date): string => format(date, DATE_FORMAT)
