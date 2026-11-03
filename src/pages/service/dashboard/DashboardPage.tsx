import { useState } from 'react'

import AppPageHeader from '@/components/app/AppPageHeader'
import ActiveCourseSection from '@/features/dashboard/components/ActiveCourseSection'
import DashboardKpiRow from '@/features/dashboard/components/DashboardKpiRow'
import DashboardNoticePanel from '@/features/dashboard/components/DashboardNoticePanel'
import DashboardUpdatedAt from '@/features/dashboard/components/DashboardUpdatedAt'
import RecentIssuePanel from '@/features/dashboard/components/RecentIssuePanel'
import { useDashboardCourses } from '@/features/dashboard/hooks/useDashboardCourses'
import { useRecentIssues } from '@/features/dashboard/hooks/useRecentIssues'
import { useTodaySummary } from '@/features/dashboard/hooks/useTodaySummary'
import type { AreaState } from '@/features/dashboard/types'
import { useNoticeList } from '@/features/notice/hooks/useNoticeList'
import { getSiteName, getSiteSeq } from '@/lib/auth/site'

/**
 * 현장 홈 = 대시보드(`spec 066` 셸 → `spec 067` 본문 → `spec 068` API 연결).
 *
 * 🔴 **영역마다 쿼리가 따로다** — 한 영역이 실패해도 나머지는 그리고, 실패한 영역만 다시 시도한다.
 * 🔴 **새로고침 = 4개 영역을 전부 다시 받는다** — 끝난 뒤 `마지막 갱신` 을 바꾼다. 주기 조회 · 실시간은 `069`.
 * 사업장 전환은 `ServiceLayout` 의 `<Outlet key={siteSeq}>` 재마운트 + 키의 `siteSeq` 로 새로 받는다.
 */

const NOTICE_COUNT = 3

const areaState = (query: { isPending: boolean; isError: boolean }): AreaState =>
  query.isError ? 'error' : query.isPending ? 'loading' : 'ready'

const DashboardPage = () => {
  const siteName = getSiteName()
  const siteSeq = getSiteSeq()

  const summary = useTodaySummary(siteSeq)
  const courses = useDashboardCourses(siteSeq)
  const recent = useRecentIssues(siteSeq)
  const notices = useNoticeList(siteSeq === null ? null : { siteSeq, pageNumber: 1, pageSize: NOTICE_COUNT })

  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([summary.refetch(), courses.refetch(), recent.refetch(), notices.refetch()])
    setUpdatedAt(new Date())
    setRefreshing(false)
  }

  return (
    <div className="flex flex-col gap-6 p-4 xl:p-8">
      <AppPageHeader
        title="대시보드"
        subtitle={siteName ? `${siteName}의 순찰 현황` : undefined}
        action={<DashboardUpdatedAt updatedAt={updatedAt} refreshing={refreshing} onRefresh={refresh} />}
      />

      <DashboardKpiRow summary={summary.data} state={areaState(summary)} onRetry={() => summary.refetch()} />

      <ActiveCourseSection
        courses={courses.data ?? []}
        state={areaState(courses)}
        receivedAt={courses.dataUpdatedAt}
        onRetry={() => courses.refetch()}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentIssuePanel rows={recent.rows} state={areaState(recent)} onRetry={() => recent.refetch()} />
        </div>
        <div className="min-w-0">
          <DashboardNoticePanel
            rows={notices.data?.items ?? []}
            state={areaState(notices)}
            onRetry={() => notices.refetch()}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
