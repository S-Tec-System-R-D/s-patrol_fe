import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'

import { fetchCourseHistory } from '@/features/course-history/api/getCourseHistory'
import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'

import { dashboardKeys } from '../queryKeys'

/**
 * 최근 회차 100건(어제~오늘) — `spec 069` 최근 종료 → `spec 073` 최근 미완료 · 시간초과도 여기서 고른다.
 * 원본을 그대로 주고 고르기는 화면이 한다(`pickFinishedCourses` · `pickIssueCourses`).
 * `siteSeq` 가 `null` 이면 호출하지 않는다(`useTodaySummary` 와 같은 판단).
 *
 * 🔴 **5건이 아니라 100건(서버 상한)을 받는다** — 서버가 시작 순이라 5건만 받으면 오래 걸린 순찰이 빠진다.
 * 🔴 **어제부터 받는다** — 자정을 넘긴 순찰도 오늘 끝났으면 보여야 하고, 최근 미완료는 어제~오늘을 본다
 * (사용자 결정 2026-11-11).
 */
export const useRecentCourses = (siteSeq: number | null) => {
  const now = new Date()
  const params = {
    siteSeq: siteSeq ?? -1,
    fromDt: format(subDays(now, 1), 'yyyy-MM-dd'),
    toDt: format(now, 'yyyy-MM-dd'),
    pageNumber: 1,
    pageSize: MAX_PAGE_SIZE,
  }

  return useQuery({
    queryKey: dashboardKeys.recentCourse(params),
    queryFn: () => fetchCourseHistory(params),
    enabled: siteSeq !== null,
    select: (data) => data.items,
  })
}
