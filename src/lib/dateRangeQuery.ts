import { endOfDay, format, isAfter, isBefore, isValid, parse, startOfDay } from 'date-fns'

import type { AppDateRange } from '@/components/app/AppDatePicker'

/**
 * 날짜 범위 ↔ 쿼리스트링 변환.
 *
 * 두 순찰이력 화면이 공유한다(018). 화면마다 따로 두면 `to`의 포함 여부 해석이
 * 갈릴 수 있어 한 곳에 모았다 — `to`는 **그 날 전체를 포함**한다.
 *
 * 쿼리 키·형식은 `data-model.md` §5-4 (`from`/`to`, `YYYY-MM-DD`)를 따른다.
 */

const QUERY_DATE_FORMAT = 'yyyy-MM-dd'

export interface DateRangeQuery {
  from?: string
  to?: string
}

/** 파싱 실패는 `undefined` — 손으로 고친 URL이 화면을 깨뜨리지 않게 한다(spec §3). */
const parseQueryDate = (value?: string): Date | undefined => {
  if (!value) return undefined
  const parsed = parse(value, QUERY_DATE_FORMAT, new Date())
  return isValid(parsed) ? parsed : undefined
}

export const parseDateRangeQuery = (query: DateRangeQuery): AppDateRange => ({
  from: parseQueryDate(query.from),
  to: parseQueryDate(query.to),
})

export const toDateRangeQuery = (range: AppDateRange): DateRangeQuery => ({
  from: range.from ? format(range.from, QUERY_DATE_FORMAT) : undefined,
  to: range.to ? format(range.to, QUERY_DATE_FORMAT) : undefined,
})

/**
 * 일자 단위 포함 비교. `target`의 시·분은 무시된다.
 * `from`·`to`가 비어 있으면 그 방향 조건은 적용하지 않는다.
 */
export const isWithinDateRange = (target: Date, { from, to }: AppDateRange): boolean => {
  if (from && isBefore(target, startOfDay(from))) return false
  if (to && isAfter(target, endOfDay(to))) return false
  return true
}
