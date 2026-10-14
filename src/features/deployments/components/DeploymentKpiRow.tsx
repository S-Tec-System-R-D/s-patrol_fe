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
    /* 🔴 `spec 031`: **이 화면은 작업 대상이 아니지만 같은 컴포넌트를 쓴다.** 공용 카드가
       바뀌면 여기도 바뀐다 — 회귀 확인 대상이다(`tasks.md` T460).
       🔴 **tone 을 `neutral` 로 내렸다**: 세 칸에 각각 다른 색을 주면 서로 경쟁해서
       **무엇이 급한지** 가 사라진다. 색은 **지금 조치가 필요한 것**(대기중 요청)에만 남긴다.
       ⚠️ 보조 줄(`hint`)은 **나간/온 인원에만** 붙인다 — "진행 중인 배치만 센다" 는
       화면만 봐서는 알 수 없는 **집계 규칙**이라 적을 값어치가 있다. 대기중 요청은
       라벨이 이미 전부를 말하므로 **지어내지 않는다**(A1). */
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppKpiCard
        icon={ArrowRightIcon}
        label="배치 나간 인원"
        value={outgoingCount}
        unit="명"
        hint="복귀하지 않은 인원"
      />
      <AppKpiCard
        icon={ArrowLeftIcon}
        label="배치 온 인원"
        value={incomingCount}
        unit="명"
        hint="복귀하지 않은 인원"
      />
      <AppKpiCard
        icon={ClockIcon}
        label="대기중인 배치요청"
        value={pendingRequests.length}
        unit="건"
        tone={pendingRequests.length > 0 ? 'warning' : 'neutral'}
      />
    </div>
  )
}

export default DeploymentKpiRow
