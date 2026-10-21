import AppPageHeader from '@/components/app/AppPageHeader'
import DeploymentKpiRow from '@/features/deployments/components/DeploymentKpiRow'
import DeploymentBoard from '@/features/deployments/components/DeploymentBoard'
import { getSiteName } from '@/lib/auth/site'

const DeploymentsPage = () => {
  /**
   * 🔴 **선택한 사업장 이름**(`spec 039` T638). 전에는 `useMe().locationName` 이었는데 JWT 클레임에
   * **없어서** 부제가 한 번도 나오지 않았다(038 근무자 화면과 같은 결함).
   */
  const siteName = getSiteName()

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader
        title="배치관리"
        subtitle={
          siteName ? `${siteName} 소속 근무자의 배치 이력과 요청을 확인합니다` : undefined
        }
      />

      <DeploymentKpiRow />
      {/* 🔴 요청 · 전출 · 전입을 **탭 3개 + 표 1개**로(T649g) — 다른 목록 화면 틀(헤더 → 탭 → 표) */}
      <DeploymentBoard />
    </div>
  )
}

export default DeploymentsPage
