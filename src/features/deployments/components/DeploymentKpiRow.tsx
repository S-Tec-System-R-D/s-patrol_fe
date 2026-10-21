import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'
import { getSiteSeq } from '@/lib/auth/site'
import { useDeploymentSummary } from '../hooks/useDeploymentSummary'

/**
 * KPI 3종 — 배치 나간 · 온 인원(복귀하지 않은 인원) + 대기 중 요청 (`spec 039` T636).
 *
 * 🔴 **요약 API 의 숫자를 그대로 쓴다**(가정 계약 — 요청서 7번). 전에는 store 의 이력을 **사업장명
 * 문자열**(`useMe().locationName`)과 비교해 셌는데, 그 값이 JWT 에 없어 실제로는 항상 0 이 될 수
 * 있었다(`deploymentData.ts` 2026-10-10 교정 주석의 근본 원인). 이제 서버가 사업장 번호로 센다.
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

const DeploymentKpiRow = () => {
  const summary = useDeploymentSummary(getSiteSeq())
  const data = summary.data
  const pending = data?.pendingCount ?? 0

  return (
    /* 🔴 `spec 031`: tone 은 **대기중 요청에만** 색을 남긴다 — 세 칸이 다른 색이면 무엇이 급한지가 사라진다.
       ⚠️ 보조 줄(`hint`)은 나간/온 인원에만 — "진행 중인 배치만 센다" 는 화면만으로 알 수 없는 집계 규칙이다 */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppKpiCard
        icon={ArrowRightIcon}
        label="배치 나간 인원"
        value={valueOf(summary.isPending, summary.isError, data?.outCount)}
        unit={summary.isError ? undefined : '명'}
        hint="복귀하지 않은 인원"
      />
      <AppKpiCard
        icon={ArrowLeftIcon}
        label="배치 온 인원"
        value={valueOf(summary.isPending, summary.isError, data?.inCount)}
        unit={summary.isError ? undefined : '명'}
        hint="복귀하지 않은 인원"
      />
      <AppKpiCard
        icon={ClockIcon}
        label="대기중인 배치요청"
        value={valueOf(summary.isPending, summary.isError, data?.pendingCount)}
        unit={summary.isError ? undefined : '건'}
        tone={pending > 0 ? 'warning' : 'neutral'}
      />
    </div>
  )
}

export default DeploymentKpiRow
