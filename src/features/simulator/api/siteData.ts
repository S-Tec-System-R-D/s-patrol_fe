import type { GroupNode } from '@/features/auth/types/site'
import type { PagedData } from '@/types/api'
import type {
  ActivePatrol,
  AppUserDetail,
  SimCourse,
  SimPoint,
  SimSite,
  SimSiteUser,
  TodayPatrolCount,
} from '../types'
import { flattenSites } from '../lib/flattenSites'
import { appRequest } from './appClient'
import { webRequest } from './webClient'

/**
 * 사업장 정보 조회 (`spec 082`).
 * 사업장 목록 · 근무자 · 지점 · 코스는 **본사 토큰 + 웹 API** 로 읽는다(본사 토큰으로 사업장 안
 * 조회가 된다 — 실측 2026-11-18). 근무자 본인의 상태는 **그 근무자 토큰 + 앱 API** 로 읽는다.
 */

/** 본사 계정이 볼 수 있는 사업장 전체 */
export const fetchSimSites = async (): Promise<SimSite[]> => {
  const root = await webRequest<GroupNode>({ url: '/api/v1/Login/W/sign/AdminSiteSelect' })
  return flattenSites(root)
}

const PAGE_SIZE = 100

/** 웹 목록을 끝 페이지까지 읽는다 */
const fetchAllPages = async <T>(url: string, params: Record<string, number>): Promise<T[]> => {
  const items: T[] = []
  for (let pageNumber = 1; ; pageNumber += 1) {
    const page = await webRequest<PagedData<T>>({
      url,
      params: { ...params, pageNumber, pageSize: PAGE_SIZE },
    })
    items.push(...page.items)
    if (pageNumber >= page.totalPages) return items
  }
}

/** 그 사업장의 사용자 전원(현장관리자 + 근무자). 🔴 이 API 만 사업장 키 이름이 `siteId` 다 */
export const fetchSiteUsers = (siteSeq: number): Promise<SimSiteUser[]> =>
  fetchAllPages<SimSiteUser>('/api/v1/User/W/sign/UserList', { siteId: siteSeq })

export const fetchSitePoints = (siteSeq: number): Promise<SimPoint[]> =>
  fetchAllPages<SimPoint>('/api/v1/Point/W/sign/GetPointList', { siteSeq })

export const fetchSiteCourses = (siteSeq: number): Promise<SimCourse[]> =>
  fetchAllPages<SimCourse>('/api/v1/Course/W/sign/GetCourseList', { siteSeq })

export interface WorkerStatus {
  /** 근무 중 여부 · 오늘 순찰 수 */
  today: TodayPatrolCount
  /** 진행 중인 순찰 — 없으면 `null` */
  activePatrol: ActivePatrol | null
  /** 원 소속과 배치 정보 */
  detail: AppUserDetail
}

/** 근무자 본인 토큰으로 읽는다. 로그인이 안 되면 `SimApiError` 가 그대로 올라간다 */
export const fetchWorkerStatus = async (loginId: string, userSeq: number): Promise<WorkerStatus> => {
  const [today, activePatrol, detail] = await Promise.all([
    appRequest<TodayPatrolCount>(loginId, { url: '/api/v1/User/M/sign/GetTodayPatrolCount' }),
    appRequest<ActivePatrol | null>(loginId, { url: '/api/v1/UserPatrol/M/sign/GetMyActivePatrol' }),
    appRequest<AppUserDetail>(loginId, { url: '/api/v1/User/M/sign/DetailUser', params: { userSeq } }),
  ])
  return { today, activePatrol, detail }
}
