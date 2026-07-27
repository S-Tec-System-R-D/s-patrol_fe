import AppKpiCard from '@/components/app/AppKpiCard'
import { useMe } from '@/features/auth/hooks/useMe'
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from 'lucide-react'
import { useDeploymentStore } from '../store/deploymentStore'

/**
 * KPI 3종 — 배치 나간/온 인원(진행중인 이력만 집계) + 대기중인 배치요청.
 * 나간/온 판정은 별도 필드 없이 `historyItems`의 사업장명을 로그인 사업장명과 비교해 런타임에 계산한다(spec.md §3).
 */
const DeploymentKpiRow = () => {
  const { data: me } = useMe()
  const pendingRequests = useDeploymentStore((state) => state.pendingRequests)
  const historyItems = useDeploymentStore((state) => state.historyItems)

  const outgoingCount = historyItems.filter(
    (item) => item.fromLocationName === me?.locationName && !item.endedAt
  ).length
  const incomingCount = historyItems.filter(
    (item) => item.toLocationName === me?.locationName && !item.endedAt
  ).length

  return (
    <div className="grid grid-cols-3 gap-4">
      <AppKpiCard icon={ArrowRightIcon} label="배치 나간 인원" value={outgoingCount} unit="명" tone="point" />
      <AppKpiCard icon={ArrowLeftIcon} label="배치 온 인원" value={incomingCount} unit="명" tone="success" />
      <AppKpiCard
        icon={ClockIcon}
        label="대기중인 배치요청"
        value={pendingRequests.length}
        unit="건"
        tone="warning"
      />
    </div>
  )
}

export default DeploymentKpiRow
