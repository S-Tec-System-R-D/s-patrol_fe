import { Outlet } from 'react-router-dom'
import { useDeploymentSummary } from '@/features/deployments/hooks/useDeploymentSummary'
import { getSiteSeq } from '@/lib/auth/site'
import { FloatingNav } from './sidebar/FloatingNav'
import { RailSidebar } from './sidebar/RailSidebar'
import { ServiceMenus } from './sidebar/sidebar.config'

/**
 * 현장 사이트(`/*`) 셸. 리디자인(007) 반영.
 * - TopNav 없음. `xl` 이상 68px `RailSidebar` · 미만 하단 `FloatingNav`(`spec 053`).
 * - 🔴 `xl` 미만 `pb-24` — floating nav 가 마지막 행 · 페이지네이션을 가리지 않게 스크롤 끝에 여백을 둔다.
 *   `min-h-screen` — 레일이 사라지면 짧은 페이지 아래가 배경색 없이 비어 보인다.
 * - `.app-shell`(overflow:hidden) 미사용 — 페이지 자연 스크롤.
 * layout.md §0-1
 */
const ServiceLayout = () => {
  /**
   * 배치관리 대기 건수 — 🔴 **KPI 와 같은 쿼리**(`spec 039` T637). 승인·거부가 `deploymentKeys.all` 을
   * 무효화하므로 페이지 이동 없이 뱃지도 함께 줄어든다. ⚠️ 실패·로딩이면 `undefined` → 뱃지를 그리지 않는다.
   * 🔴 레일이 아니라 **여기서** 부른다(`spec 043` T743) — 레일은 본사와 공용이다.
   */
  const deploymentPending = useDeploymentSummary(getSiteSeq()).data?.pendingCount

  return (
    <div className="flex">
      <RailSidebar menus={ServiceMenus} badges={{ deploymentPending }} />
      <div className="flex-1 min-w-0 min-h-screen pb-24 xl:pb-0 bg-contents-background">
        <Outlet />
      </div>
      <FloatingNav menus={ServiceMenus} badges={{ deploymentPending }} />
    </div>
  )
}

export default ServiceLayout
