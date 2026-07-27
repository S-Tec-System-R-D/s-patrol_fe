import AppPageHeader from '@/components/app/AppPageHeader'
import { useMe } from '@/features/auth/hooks/useMe'
import DeploymentKpiRow from '@/features/deployments/components/DeploymentKpiRow'
import DeploymentHistoryTabs from '@/features/deployments/components/DeploymentHistoryTabs'
import DeploymentRequestList from '@/features/deployments/components/DeploymentRequestList'

const DeploymentsPage = () => {
  const { data: me } = useMe()

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader
        title="배치관리"
        subtitle={
          me?.locationName
            ? `${me.locationName} 소속 근무자의 배치 이력과 요청을 확인합니다`
            : undefined
        }
      />

      <DeploymentKpiRow />
      <DeploymentRequestList />
      <DeploymentHistoryTabs />
    </div>
  )
}

export default DeploymentsPage
