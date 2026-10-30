import { LayoutDashboardIcon } from 'lucide-react'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { getSiteName } from '@/lib/auth/site'

/**
 * 현장 홈 = 대시보드(`spec 066`). 지금은 셸만 — 메뉴 · 라우트 · 로그인/사업장 전환 착지점.
 * 본문(무엇을 보여줄지)은 미정이라 placeholder 다.
 */
const DashboardPage = () => {
  const siteName = getSiteName()

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">
      <AppPageHeader
        title="대시보드"
        subtitle={siteName ? `${siteName}의 순찰 현황을 한눈에 확인합니다` : undefined}
      />
      <AppEmpty
        icon={LayoutDashboardIcon}
        title="대시보드 준비 중"
        description="곧 이곳에서 순찰 현황을 한눈에 볼 수 있습니다."
      />
    </div>
  )
}

export default DashboardPage
