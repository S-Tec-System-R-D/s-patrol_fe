import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import AppPageHeader from '@/components/app/AppPageHeader'
import ActiveCourseSection, {
  type ActiveCourseState,
} from '@/features/dashboard/components/ActiveCourseSection'
import RecentIssuePanel from '@/features/dashboard/components/RecentIssuePanel'
import DashboardKpiRow from '@/features/dashboard/components/DashboardKpiRow'
import DashboardNoticePanel from '@/features/dashboard/components/DashboardNoticePanel'
import DashboardUpdatedAt from '@/features/dashboard/components/DashboardUpdatedAt'
import {
  activeCoursesMock,
  recentIssuesMock,
  dashboardKpiMock,
  dashboardNoticesMock,
} from '@/features/dashboard/mocks/dashboardMock'
import { getSiteName } from '@/lib/auth/site'

/**
 * 현장 홈 = 대시보드(`spec 066` 셸 → `spec 067` 본문).
 *
 * 🔴 **API 를 부르지 않는다** — 화면을 먼저 보고 고친 뒤 API 를 요청한다(사용자 결정 2026-10-30).
 * 값은 전부 `features/dashboard/mocks/` 의 고정 데이터다.
 *
 * ⚠️ `?preview=empty|loading|error` — **개발 모드에서만** 진행 중 영역을 그 상태로 그린다(고정
 * 데이터라 그냥은 정상 화면만 보인다). 🔴 API 연결 spec 에서 지운다(실제 쿼리 상태로 대체).
 */

const readPreview = (value: string | null): { state: ActiveCourseState; empty: boolean } => {
  if (!import.meta.env.DEV) return { state: 'ready', empty: false }
  if (value === 'loading' || value === 'error') return { state: value, empty: false }
  return { state: 'ready', empty: value === 'empty' }
}

const DashboardPage = () => {
  const siteName = getSiteName()
  const [searchParams, setSearchParams] = useSearchParams()
  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const preview = readPreview(searchParams.get('preview'))

  const clearPreview = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('preview')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6 p-4 xl:p-8">
      <AppPageHeader
        title="대시보드"
        subtitle={siteName ? `${siteName}의 순찰 현황` : undefined}
        action={<DashboardUpdatedAt updatedAt={updatedAt} onRefresh={() => setUpdatedAt(new Date())} />}
      />

      <DashboardKpiRow kpi={dashboardKpiMock} />

      <ActiveCourseSection
        courses={preview.empty ? [] : activeCoursesMock}
        state={preview.state}
        onRetry={clearPreview}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentIssuePanel rows={recentIssuesMock} />
        </div>
        <div className="min-w-0">
          <DashboardNoticePanel rows={dashboardNoticesMock} />
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
