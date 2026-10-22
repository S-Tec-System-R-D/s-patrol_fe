import {
  clampPageSize,
  omitIfAll,
  parsePageNumber,
} from '@/features/course-history/lib/courseHistoryListParams'
import type { AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'
import {
  ASSIGNMENT_STATUS,
  type AssignmentHistoryParams,
  type AssignmentStatusCode,
} from '../types/deployment'

/**
 * URL 쿼리 ↔ 배치 API 파라미터 (`spec 039` T628 → `spec 042` T718 실측 API 로 정리).
 *
 * 🔴 **표가 하나라 페이지 키도 하나**(`?page`) — 요청·복귀·전입·전출을 탭(`?tab`)으로 오간다(사용자 결정
 * 2026-10-21). 탭을 바꾸면 페이지를 지운다(다른 탭의 같은 페이지는 비어 있을 수 있다).
 *
 * 🔴 **상태 필터는 서버가 거른다**(042 후속 — 2026-10-22 `status` 파라미터 생김). 이력 탭은 엔드포인트가
 * 둘이라 `direction` 은 없다.
 *
 * 헬퍼(`parsePageNumber`·`clampPageSize`)는 `course-history` 것을 **재사용**한다(상한 100 · 1-based).
 */

export type DeploymentTab = 'requests' | 'returns' | 'out' | 'in'

/** 요청 탭(승인·반려 표) — 이력 탭과 필터·컬럼이 다르다 */
export const isRequestTab = (tab: DeploymentTab): tab is 'requests' | 'returns' =>
  tab === 'requests' || tab === 'returns'

/**
 * 🔴 **기본은 요청 탭이다** — 처리할 일이 먼저다(014 "요청이 이력보다 위" 근거를 탭 순서로 지킨다).
 * 모르는 값도 요청 탭으로 수렴한다(손으로 고친 URL 이 화면을 깨뜨리지 않게).
 */
export const parseDeploymentTab = (value?: string): DeploymentTab =>
  value === 'returns' || value === 'out' || value === 'in' ? value : 'requests'

/** 한 페이지 행 수 기본값. 대시보드 아래 표라 짧게 둔다(014 값 유지) */
export const DEPLOYMENT_PAGE_SIZE = 10

/**
 * 이력 상태 필터 — URL `?status=scheduled|active|returned`. 그 외 값은 **전체**(손으로 고친 URL 이 400 을 내지 않게).
 * 근무자 상세 배치 이력 카드도 같은 옵션을 쓴다.
 */
export type HistoryStatusFilter = 'scheduled' | 'active' | 'returned'

export const parseHistoryStatus = (value?: string): HistoryStatusFilter | undefined =>
  value === 'scheduled' || value === 'active' || value === 'returned' ? value : undefined

export const toStatusCode = (status?: HistoryStatusFilter): AssignmentStatusCode | undefined => {
  if (status === 'scheduled') return ASSIGNMENT_STATUS.SCHEDULED
  if (status === 'active') return ASSIGNMENT_STATUS.ACTIVE
  if (status === 'returned') return ASSIGNMENT_STATUS.RETURNED
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
  page?: string,
  status?: string,
  /** 이름 검색 — URL `?q`(T658). 빈 값·공백은 키를 뺀다 */
  q?: string
): AssignmentHistoryParams => ({
  siteSeq,
  userName: omitIfAll(q),
  status: toStatusCode(parseHistoryStatus(status)),
  pageNumber: parsePageNumber(page),
  pageSize: clampPageSize(DEPLOYMENT_PAGE_SIZE),
})
