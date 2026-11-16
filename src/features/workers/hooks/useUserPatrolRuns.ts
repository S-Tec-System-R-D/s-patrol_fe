import { useMemo } from 'react'

import { useCourseHistoryList } from '@/features/course-history/hooks/useCourseHistoryList'
import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'
import { recentRange } from '@/features/course-history/lib/historyRange'
import type { CourseHistoryParams } from '@/features/course-history/types'

import { filterMyRuns, RUN_DAYS } from '../lib/userPatrolRuns'

/**
 * 근무자의 **최근 14일 회차** (`spec 079` T1301).
 *
 * 🔴 `GetCourseHistory` 는 `userSeq` 를 받지 않는다 — `userName`(부분 일치)으로 받고 `userSeq` 로 다시 거른다(D4).
 * 🔴 **선택한 사업장**(`siteSeq`) 기준이다 — 상세의 `siteSeq` 는 소속지라 쓰지 않는다(038).
 * ⚠️ 한 요청 상한(100건)만 받는다 — 14일 · 이름 하나로 100회를 넘기는 경우는 아직 없다고 본다.
 */
export const useUserPatrolRuns = (siteSeq: number | null, userSeq: number, userName: string, today: Date) => {
  const params = useMemo<CourseHistoryParams | null>(
    () =>
      siteSeq === null || userName.trim() === ''
        ? null
        : { siteSeq, ...recentRange(today, RUN_DAYS), userName, pageNumber: 1, pageSize: MAX_PAGE_SIZE },
    [siteSeq, userName, today]
  )
  const query = useCourseHistoryList(params)
  const runs = useMemo(() => filterMyRuns(query.data?.items ?? [], userSeq), [query.data, userSeq])
  return { ...query, runs }
}
