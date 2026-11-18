import { useQueries, useQuery } from '@tanstack/react-query'
import {
  fetchSimSites,
  fetchSiteCourses,
  fetchSitePoints,
  fetchSiteUsers,
  fetchWorkerStatus,
} from '../api/siteData'
import { SimApiError } from '../api/simError'
import type { SimSiteUser } from '../types'

/**
 * 시뮬레이터 조회 훅 (`spec 082`).
 * 키는 `['sim', …]` 으로 시작한다 — 앱의 다른 쿼리와 섞이지 않고, 작업이 끝나면 통째로 다시 읽는다.
 * 재시도하지 않는다(실패 원인을 바로 보이는 도구다).
 */
export const simKeys = {
  all: ['sim'] as const,
  sites: () => ['sim', 'sites'] as const,
  site: (siteSeq: number) => ['sim', 'site', siteSeq] as const,
  users: (siteSeq: number) => ['sim', 'site', siteSeq, 'users'] as const,
  points: (siteSeq: number) => ['sim', 'site', siteSeq, 'points'] as const,
  courses: (siteSeq: number) => ['sim', 'site', siteSeq, 'courses'] as const,
  worker: (siteSeq: number, loginId: string) => ['sim', 'site', siteSeq, 'worker', loginId] as const,
}

export const useSimSites = (enabled: boolean) =>
  useQuery({ queryKey: simKeys.sites(), queryFn: fetchSimSites, enabled, retry: false })

export const useSiteUsers = (siteSeq: number | null) =>
  useQuery({
    queryKey: simKeys.users(siteSeq ?? 0),
    queryFn: () => fetchSiteUsers(siteSeq!),
    enabled: siteSeq !== null,
    retry: false,
  })

export const useSitePoints = (siteSeq: number | null) =>
  useQuery({
    queryKey: simKeys.points(siteSeq ?? 0),
    queryFn: () => fetchSitePoints(siteSeq!),
    enabled: siteSeq !== null,
    retry: false,
  })

export const useSiteCourses = (siteSeq: number | null) =>
  useQuery({
    queryKey: simKeys.courses(siteSeq ?? 0),
    queryFn: () => fetchSiteCourses(siteSeq!),
    enabled: siteSeq !== null,
    retry: false,
  })

/** 근무자 상태를 다시 읽는 주기 — 실행 중인 순찰의 진행을 따라간다 */
const WORKER_STATUS_INTERVAL_MS = 10_000

/** 근무자마다 앱 서버에 로그인해 상태를 읽는다. 결과 배열은 `workers` 와 같은 순서다 */
export const useWorkerStatuses = (siteSeq: number | null, workers: SimSiteUser[]) =>
  useQueries({
    queries: workers.map((worker) => ({
      queryKey: simKeys.worker(siteSeq ?? 0, worker.loginId),
      queryFn: () => fetchWorkerStatus(worker.loginId, worker.userSeq),
      enabled: siteSeq !== null,
      retry: false,
      // 로그인이 안 되는 계정을 주기적으로 다시 두드리지 않는다
      refetchInterval: (query: { state: { error: unknown } }) =>
        query.state.error instanceof SimApiError ? false : WORKER_STATUS_INTERVAL_MS,
    })),
  })
