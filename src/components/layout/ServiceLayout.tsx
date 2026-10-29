import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import AppBlockingOverlay from '@/components/app/AppBlockingOverlay'
import { useMe } from '@/features/auth/hooks/useMe'
import { useSiteOptions } from '@/features/auth/hooks/useSiteOptions'
import type { SiteOption } from '@/features/auth/types/site'
import { useDeploymentSummary } from '@/features/deployments/hooks/useDeploymentSummary'
import { getSiteName, getSiteSeq, setSite } from '@/lib/auth/site'
import { paths } from '@/router/paths'
import { FloatingNav } from './sidebar/FloatingNav'
import { RailSidebar } from './sidebar/RailSidebar'
import type { SiteSwitchProps } from './sidebar/SiteSwitchButton'
import { ServiceMenus } from './sidebar/sidebar.config'

/**
 * 전환 중 오버레이 상한(`spec 061`). 홈 조회가 끝나지 않아도 이만큼 지나면 걷는다 —
 * axios `timeout` 5초 + 토큰 재발급 1회 여유. 걷히지 않는 오버레이는 화면을 통째로 잠근다.
 */
const SITE_SWITCH_TIMEOUT_MS = 10_000

/**
 * 현장 사이트(`/*`) 셸. 리디자인(007) 반영.
 * - TopNav 없음. `xl` 이상 68px `RailSidebar` · 미만 하단 `FloatingNav`(`spec 053`).
 * - 🔴 `xl` 미만 `pb-24` — floating nav 가 마지막 행 · 페이지네이션을 가리지 않게 스크롤 끝에 여백을 둔다.
 *   `min-h-screen` — 레일이 사라지면 짧은 페이지 아래가 배경색 없이 비어 보인다.
 * - `.app-shell`(overflow:hidden) 미사용 — 페이지 자연 스크롤.
 * layout.md §0-1
 *
 * **사업장 전환**(`spec 061`) — 선택지 2개 이상일 때만 레일 · nav 에 버튼을 넘긴다.
 * 전환 = 저장값 교체 → 오버레이 → 홈. 🔴 **`<Outlet key={siteSeq}>`** — `getSiteSeq()` 는 렌더 때 읽기만 해서
 * 홈에서 바꾸면(같은 주소) 다시 그려지지 않는다. 현장 영역을 통째로 다시 띄워 그 값을 읽는 화면을 손대지 않는다.
 */
const ServiceLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [switching, setSwitching] = useState(false)

  const siteSeq = getSiteSeq()

  /**
   * 배치관리 대기 건수 — 🔴 **KPI 와 같은 쿼리**(`spec 039` T637). 승인·거부가 `deploymentKeys.all` 을
   * 무효화하므로 페이지 이동 없이 뱃지도 함께 줄어든다. ⚠️ 실패·로딩이면 `undefined` → 뱃지를 그리지 않는다.
   * 🔴 레일이 아니라 **여기서** 부른다(`spec 043` T743) — 레일은 본사와 공용이다.
   */
  const deploymentPending = useDeploymentSummary(siteSeq).data?.pendingCount

  // 로딩 · 실패면 `undefined` → 버튼을 그리지 않는다(뱃지와 같은 방침)
  const siteOptions = useSiteOptions(me?.userSeq).data

  const handleSwitch = (site: SiteOption) => {
    setSwitching(true)
    setSite(site.siteSeq, site.siteName)
    navigate(paths.service.zones, { replace: true })
  }

  const siteSwitch: SiteSwitchProps | undefined =
    siteOptions && siteOptions.length >= 2
      ? {
          options: siteOptions,
          currentSiteSeq: siteSeq,
          currentSiteName: getSiteName(),
          onSwitch: handleSwitch,
        }
      : undefined

  // 상한 — 홈에 닿지 못해도(이동 실패 등) 걷힌다
  useEffect(() => {
    if (!switching) return
    const timer = window.setTimeout(() => setSwitching(false), SITE_SWITCH_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [switching])

  /*
   * 홈 첫 조회가 끝나면(성공 · 실패 모두) 걷는다. 🔴 홈이 그려진 뒤에 본다 — 자식 effect(쿼리 시작)가
   * 이 effect 보다 먼저 돌아서, 여기서 `isFetching() === 0` 이면 홈 조회가 이미 끝났거나 캐시로 그렸다는 뜻이다.
   * 전환 전 화면의 조회가 남아 있으면 그것까지 기다린다(오버레이 아래라 보이지 않는다).
   */
  useEffect(() => {
    if (!switching || pathname !== paths.service.zones) return
    const releaseIfIdle = () => {
      if (queryClient.isFetching() === 0) setSwitching(false)
    }
    const unsubscribe = queryClient.getQueryCache().subscribe(releaseIfIdle)
    const check = window.setTimeout(releaseIfIdle)
    return () => {
      unsubscribe()
      window.clearTimeout(check)
    }
  }, [switching, pathname, queryClient])

  return (
    <>
      {/* 🔴 `inert` — 오버레이는 클릭만 막는다. 키보드 포커스는 뒤를 통째로 꺼서 막는다 */}
      <div className="flex" inert={switching}>
        <RailSidebar menus={ServiceMenus} badges={{ deploymentPending }} siteSwitch={siteSwitch} />
        <div className="flex-1 min-w-0 min-h-screen pb-24 xl:pb-0 bg-contents-background">
          <Outlet key={siteSeq} />
        </div>
        <FloatingNav menus={ServiceMenus} badges={{ deploymentPending }} siteSwitch={siteSwitch} />
      </div>
      {switching && <AppBlockingOverlay label="사업장 전환 중" />}
    </>
  )
}

export default ServiceLayout
