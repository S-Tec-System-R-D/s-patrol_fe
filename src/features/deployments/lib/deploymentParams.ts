import {
  clampPageSize,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import {
  DEPLOYMENT_DIRECTION,
  type DeploymentDirectionCode,
  type DeploymentHistoryParams,
  type DeploymentRequestListParams,
} from '../types/deployment'

/**
 * URL 쿼리 ↔ 배치 API 파라미터 (`spec 039` T628).
 *
 * 한 화면에 **목록이 둘**(요청 · 이력)이라 페이지 키를 나눈다 — `?requestPage` · `?historyPage`.
 * 하나로 두면 요청 목록을 넘길 때 이력 페이지도 같이 넘어간다.
 *
 * 헬퍼(`parsePageNumber`·`clampPageSize`)는 `course-history` 것을 **재사용**한다(상한 100 · 1-based).
 */

export type HistoryTab = 'out' | 'in'

/** 🔴 `in` 이 아니면 전부 `out` 이다 — 손으로 고친 URL 이 화면을 깨뜨리지 않게(014 동작 유지) */
export const parseHistoryTab = (value?: string): HistoryTab => (value === 'in' ? 'in' : 'out')

export const toDirection = (tab: HistoryTab): DeploymentDirectionCode =>
  tab === 'in' ? DEPLOYMENT_DIRECTION.IN : DEPLOYMENT_DIRECTION.OUT

/** 요청·이력 목록의 한 페이지 행 수. 대시보드에 두 목록이 쌓이므로 짧게 둔다(014 값 유지) */
export const DEPLOYMENT_PAGE_SIZE = 10

export const toRequestListParams = (
  siteSeq: number,
  page?: string
): DeploymentRequestListParams => ({
  siteSeq,
  pageNumber: parsePageNumber(page),
  pageSize: clampPageSize(DEPLOYMENT_PAGE_SIZE),
})

export const toHistoryParams = (
  siteSeq: number,
  tab?: string,
  page?: string
): DeploymentHistoryParams => ({
  siteSeq,
  direction: toDirection(parseHistoryTab(tab)),
  pageNumber: parsePageNumber(page),
  pageSize: clampPageSize(DEPLOYMENT_PAGE_SIZE),
})
