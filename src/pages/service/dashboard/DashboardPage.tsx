import { format } from 'date-fns'
import { useState } from 'react'

import AppPageHeader from '@/components/app/AppPageHeader'
import { TopBarRight } from '@/components/layout/TopBarRight'
import ActiveCourseSection from '@/features/dashboard/components/ActiveCourseSection'
import DashboardKpiCard from '@/features/dashboard/components/DashboardKpiCard'
import DashboardNoticePanel from '@/features/dashboard/components/DashboardNoticePanel'
import DashboardUpdatedAt from '@/features/dashboard/components/DashboardUpdatedAt'
import DeploymentPendingPanel from '@/features/dashboard/components/DeploymentPendingPanel'
import RecentRecordPanel from '@/features/dashboard/components/RecentRecordPanel'
import TodaySummaryPanel from '@/features/dashboard/components/TodaySummaryPanel'
import { useCourseList } from '@/features/courses/hooks/useCourseList'
import { MAX_PAGE_SIZE } from '@/features/course-history/lib/courseHistoryListParams'
import { useDashboardCourses } from '@/features/dashboard/hooks/useDashboardCourses'
import { useDashboardHandOvers } from '@/features/dashboard/hooks/useDashboardHandOvers'
import { useRecentCourses } from '@/features/dashboard/hooks/useRecentCourses'
import { useTodaySummary } from '@/features/dashboard/hooks/useTodaySummary'
import { pickFinishedCourses } from '@/features/dashboard/lib/finishedCourses'
import { pickIssueCourses } from '@/features/dashboard/lib/recentIssueCourses'
import { useDashboardRealtime } from '@/features/dashboard/realtime/useDashboardRealtime'
import type { AreaState } from '@/features/dashboard/types'
import { useDeploymentRequests } from '@/features/deployments/hooks/useDeploymentRequests'
import { useReturnRequests } from '@/features/deployments/hooks/useReturnRequests'
import { useNoticeList } from '@/features/notice/hooks/useNoticeList'
import { getSiteName, getSiteSeq } from '@/lib/auth/site'

/**
 * 현장 홈 = 대시보드(`spec 066` 셸 → `067` 본문 → `068` API 연결 → `069` 실시간 → `073` 개편).
 *
 * 🔴 **영역마다 쿼리가 따로다** — 한 영역이 실패해도 나머지는 그리고, 실패한 영역만 다시 시도한다.
 * 🔴 **새로고침 = 영역을 전부 다시 받는다.** 주기 조회는 없다 — 실시간 알림이 오면 해당 영역을 다시 받는다.
 * 🔴 **`마지막 갱신` = 영역 중 가장 최근에 받은 시각** — 새로고침 때만 바꾸면 `실시간` 인데 옛 시각이 보인다.
 * 사업장 전환은 `ServiceLayout` 의 `<Outlet key={siteSeq}>` 재마운트 + 키의 `siteSeq` 로 새로 받는다.
 *
 * 🔄 **배치(`spec 084`)** — 제목 오른쪽 한 줄 숫자 → 진행 중 전체 폭 → 세 칸(기록 | 오늘 요약 | 처리할 일). 실시간 표시는 위 줄 오른쪽.
 * (전) 🔴 **배치(`spec 073`)** — xl 은 2열 — 왼쪽 나머지 · 오른쪽 440px 고정(시안 `.gd`)(왼쪽 KPI · 진행 중 · 최근 기록 / 오른쪽 배치 대기 · 공지). 그 아래는 한 열로
 * KPI → 진행 중 → 배치 대기 → 최근 기록 → 공지. 두 열 묶음을 xl 미만에서 `contents` 로 풀고 `order` 로 섞는다 —
 * 행을 맞춘 grid 로 두면 배치 대기가 길 때 KPI 아래가 그만큼 빈다.
 */

const NOTICE_COUNT = 3

const areaState = (query: { isPending: boolean; isError: boolean }): AreaState =>
  query.isError ? 'error' : query.isPending ? 'loading' : 'ready'

const DashboardPage = () => {
  const siteName = getSiteName()
  const siteSeq = getSiteSeq()

  const summary = useTodaySummary(siteSeq)
  const courses = useDashboardCourses(siteSeq)
  const handOvers = useDashboardHandOvers(courses.data ?? [])
  const recent = useRecentCourses(siteSeq)
  const requests = useDeploymentRequests(siteSeq)
  const returns = useReturnRequests(siteSeq)
  const notices = useNoticeList(siteSeq === null ? null : { siteSeq, pageNumber: 1, pageSize: NOTICE_COUNT })
  const realtime = useDashboardRealtime(siteSeq)
  /** 오늘 코스별 순찰의 0회 줄 — 사용 중인 코스만. 실패해도 영역은 그린다(오늘 돈 코스만 보인다) */
  const courseList = useCourseList(siteSeq, { useYn: 'true' }, MAX_PAGE_SIZE)

  const [openedAt] = useState(() => Date.now())
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    await Promise.all([
      summary.refetch(),
      courses.refetch(),
      recent.refetch(),
      requests.refetch(),
      returns.refetch(),
      notices.refetch(),
    ])
    setRefreshing(false)
  }

  const updatedAt = new Date(
    Math.max(
      openedAt,
      summary.dataUpdatedAt,
      courses.dataUpdatedAt,
      recent.dataUpdatedAt,
      requests.dataUpdatedAt,
      returns.dataUpdatedAt,
      notices.dataUpdatedAt
    )
  )

  const recentRows = recent.data ?? []
  const now = new Date()
  const deploymentState: AreaState =
    requests.isError || returns.isError ? 'error' : requests.isPending || returns.isPending ? 'loading' : 'ready'

  return (
    <div className="flex flex-col gap-7 p-4 xl:p-8">
      {/* 실시간 표시 · 새로고침은 위 줄 오른쪽으로(`spec 084`) — 틀이 없으면 제자리에 그려진다 */}
      <TopBarRight>
        <DashboardUpdatedAt updatedAt={updatedAt} realtime={realtime} refreshing={refreshing} onRefresh={refresh} />
      </TopBarRight>

      {/* 제목 오른쪽 한 줄 숫자 — 🔴 `xl` 미만은 제목 아래로 내린다. 제목 옆에 두면 좁은 폭에서 숫자 줄이 제목 · 부제를
          밀어내 안 보인다(390px e2e 로 확인). 그래서 `AppPageHeader` 의 `action` 자리에 넣지 않는다 */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <AppPageHeader title="대시보드" subtitle={siteName ? `${siteName}의 순찰 현황` : undefined} />
        <DashboardKpiCard
          summary={summary.data}
          activeCount={courses.data ? courses.data.length : null}
          state={areaState(summary)}
          onRetry={() => summary.refetch()}
        />
      </div>

      <ActiveCourseSection
        courses={courses.data ?? []}
        state={areaState(courses)}
        receivedAt={courses.dataUpdatedAt}
        handOvers={handOvers}
        onRetry={() => courses.refetch()}
      />

      {/* 세 칸 — 기록 | 오늘 요약 | 처리할 일. `2xl` 미만은 두 칸 · `xl` 미만은 한 칸 */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-7 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] 2xl:divide-x 2xl:divide-border 2xl:gap-x-0 2xl:[&>*]:px-7 2xl:[&>*:first-child]:pl-0 2xl:[&>*:last-child]:pr-0">
        <div className="min-w-0">
          <RecentRecordPanel
            issues={pickIssueCourses(recentRows)}
            finished={pickFinishedCourses(recentRows, format(now, 'yyyy-MM-dd'))}
            state={areaState(recent)}
            onRetry={() => recent.refetch()}
          />
        </div>

        <div className="min-w-0">
          <TodaySummaryPanel
            rows={recentRows}
            courses={courseList.data?.items}
            today={format(now, 'yyyy-MM-dd')}
            currentHour={now.getHours()}
            state={areaState(recent)}
            onRetry={() => recent.refetch()}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-7">
          {siteSeq !== null && (
            <DeploymentPendingPanel
              siteSeq={siteSeq}
              requests={requests.data ?? []}
              returns={returns.data ?? []}
              state={deploymentState}
              onRetry={() => void Promise.all([requests.refetch(), returns.refetch()])}
            />
          )}
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
