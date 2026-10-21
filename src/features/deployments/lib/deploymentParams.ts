import {
  clampPageSize,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import type { AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'
import {
  DEPLOYMENT_DIRECTION,
  DEPLOYMENT_HISTORY_STATUS,
  type DeploymentDirectionCode,
  type DeploymentHistoryStatusCode,
  type DeploymentHistoryParams,
  type DeploymentRequestListParams,
} from '../types/deployment'

/**
 * URL 쿼리 ↔ 배치 API 파라미터 (`spec 039` T628 → T649g 에서 탭 3개로 개편).
 *
 * 🔴 **표가 하나라 페이지 키도 하나**(`?page`) — 요청·전출·전입을 탭(`?tab`)으로 오간다(사용자 결정
 * 2026-10-21). 탭을 바꾸면 페이지를 지운다(다른 탭의 같은 페이지는 비어 있을 수 있다).
 *
 * 헬퍼(`parsePageNumber`·`clampPageSize`)는 `course-history` 것을 **재사용**한다(상한 100 · 1-based).
 */

export type DeploymentTab = 'requests' | 'out' | 'in'

/**
 * 🔴 **기본은 요청 탭이다** — 처리할 일이 먼저다(014 "요청이 이력보다 위" 근거를 탭 순서로 지킨다).
 * 모르는 값도 요청 탭으로 수렴한다(손으로 고친 URL 이 화면을 깨뜨리지 않게).
 */
export const parseDeploymentTab = (value?: string): DeploymentTab =>
  value === 'out' || value === 'in' ? value : 'requests'

export const toDirection = (tab: 'out' | 'in'): DeploymentDirectionCode =>
  tab === 'in' ? DEPLOYMENT_DIRECTION.IN : DEPLOYMENT_DIRECTION.OUT

/** 한 페이지 행 수 기본값. 대시보드 아래 표라 짧게 둔다(014 값 유지) */
export const DEPLOYMENT_PAGE_SIZE = 10

export const toRequestListParams = (
  siteSeq: number,
  page?: string
): DeploymentRequestListParams => ({
  siteSeq,
  pageNumber: parsePageNumber(page),
  pageSize: clampPageSize(DEPLOYMENT_PAGE_SIZE),
})

/**
 * 이력 상태 필터 — URL `?status=scheduled|active|returned`(T649h · T656 배치예정 추가). 그 외 값은 **전체**.
 * 🔴 KPI(현재 인원)를 누르면 `active` 로 온다 — 숫자와 행 수가 맞게.
 */
export type HistoryStatusFilter = 'scheduled' | 'active' | 'returned'

export const parseHistoryStatus = (value?: string): HistoryStatusFilter | undefined =>
  value === 'scheduled' || value === 'active' || value === 'returned' ? value : undefined

const toStatusCode = (status?: HistoryStatusFilter): DeploymentHistoryStatusCode | undefined => {
  if (status === 'scheduled') return DEPLOYMENT_HISTORY_STATUS.SCHEDULED
  if (status === 'active') return DEPLOYMENT_HISTORY_STATUS.ACTIVE
  if (status === 'returned') return DEPLOYMENT_HISTORY_STATUS.RETURNED
  return undefined
}

export const historyStatusOptions: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'scheduled', label: '배치예정' },
  { value: 'active', label: '배치중' },
  { value: 'returned', label: '복귀완료' },
]

export const toHistoryParams = (
  siteSeq: number,
  tab: 'out' | 'in',
  page?: string,
  status?: string
): DeploymentHistoryParams => ({
  siteSeq,
  direction: toDirection(tab),
  status: toStatusCode(parseHistoryStatus(status)),
  pageNumber: parsePageNumber(page),
  pageSize: clampPageSize(DEPLOYMENT_PAGE_SIZE),
})
