import { ClockIcon, SquareArrowRightEnterIcon, SquareArrowRightExitIcon } from 'lucide-react'

import type { ReactNode } from 'react'

import AppKpiCard from '@/components/app/AppKpiCard'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import type { DeploymentTab } from '../lib/deploymentParams'
import { useDeploymentSummary } from '../hooks/useDeploymentSummary'

/**
 * KPI 3종 — 배치 나간 · 온 인원(복귀하지 않은 인원) + 대기 중 요청 (`spec 039` T636).
 *
 * 🔴 **요약 API(`GetAssignmentCount`)의 숫자를 그대로 쓴다**(`spec 042` 실측). 서버가 사업장 번호로 센다.
 * 🔴 **나간·온 숫자에는 배치예정(시작 전)도 들어 있다**(실측) — 지금 그 자리에 있는 인원이 아니라 복귀 안 한
 * 배치 건수다. 보조 줄로 알린다(OQ-042-C).
 *
 * 🔴 **실패는 `-` 다, 0 이 아니다** — "대기 0건" 은 처리할 것이 없다는 **거짓 안심**을 준다.
 * 요약만 실패해도 아래 목록·이력은 따로 뜬다(독립 쿼리, spec §4).
 */

/** 값 자리 — 로딩은 자리만 잡고, 실패는 `-`, 성공은 숫자 */
const valueOf = (isPending: boolean, isError: boolean, value: number | undefined) => {
  if (isError) return '-'
  if (isPending || value === undefined) {
    return <span className="inline-block h-7 w-8 animate-pulse rounded-sm bg-muted align-middle" />
  }
  return value
}

/**
 * 🔴 **카드를 누르면 해당 탭으로 간다**(T649g, 사용자 결정 2026-10-21) — KPI 3개와 탭 3개가 1:1 이다
 * (나간 ↔ 전출 · 온 ↔ 전입 · 대기 ↔ 배치 요청). 014 가 "클릭 시 스크롤 — 미구현" 으로 남긴 자리다.
 * `AppKpiCard` 는 클릭을 받지 않으므로 **버튼으로 감싼다**(공용 카드는 건드리지 않는다).
 */
const KpiButton = ({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={`${label} 보기`}
    className="rounded-lg text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-point/40"
  >
    {children}
  </button>
)

const DeploymentKpiRow = () => {
  const summary = useDeploymentSummary(getSiteSeq())
  const [, setParams] = useQueryParams<'tab' | 'page' | 'q'>()
  /**
   * 🔴 **탭만 바꾼다**(`spec 042`) — 039 는 `배치중` 필터를 걸고 갔지만 서버에 상태 필터가 없다.
   * 이력 탭은 기록(복귀완료 포함)이라 숫자와 행 수가 다를 수 있다.
   */
  const goTo = (tab: DeploymentTab) =>
    setParams({ tab: tab === 'requests' ? undefined : tab, page: undefined, q: undefined })
  const data = summary.data
  const pending = data?.pendingCount ?? 0

  return (
    /* 🔴 **한 줄 얇은 카드**(`inline`, 사용자 요청 2026-10-21) — 숫자 하나에 카드가 너무 두꺼웠다.
       🔴 `spec 031`: tone 은 **대기중 요청에만** 색을 남긴다 — 세 칸이 다른 색이면 무엇이 급한지가 사라진다.
       ⚠️ 보조 줄(`hint`)은 나간/온 인원에만 — "배치예정도 센다" 는 화면만으로 알 수 없는 집계 규칙이다 */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiButton label="전출 이력" onClick={() => goTo('out')}>
        <AppKpiCard
          inline
          // 이력 탭과 같은 아이콘 — 사업장(네모)에서 나간다 / 들어온다(사용자 요청 2026-10-21)
          icon={SquareArrowRightExitIcon}
          label="배치 나간 인원"
          value={valueOf(summary.isPending, summary.isError, data?.outCount)}
          unit={summary.isError ? undefined : '명'}
          hint="배치예정 포함"
        />
      </KpiButton>
      <KpiButton label="전입 이력" onClick={() => goTo('in')}>
        <AppKpiCard
          inline
          icon={SquareArrowRightEnterIcon}
          label="배치 온 인원"
          value={valueOf(summary.isPending, summary.isError, data?.inCount)}
          unit={summary.isError ? undefined : '명'}
          hint="배치예정 포함"
        />
      </KpiButton>
      <KpiButton label="배치 요청" onClick={() => goTo('requests')}>
        <AppKpiCard
          inline
          icon={ClockIcon}
          label="대기중인 배치요청"
          value={valueOf(summary.isPending, summary.isError, data?.pendingCount)}
          unit={summary.isError ? undefined : '건'}
          tone={pending > 0 ? 'warning' : 'neutral'}
        />
      </KpiButton>
    </div>
  )
}

export default DeploymentKpiRow
