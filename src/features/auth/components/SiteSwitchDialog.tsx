import AppDialog from '@/components/app/AppDialog'
import { SiteOptionList } from '@/features/auth/components/SiteOptionList'
import type { SiteOption } from '@/features/auth/types/site'

interface SiteSwitchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: SiteOption[]
  currentSiteSeq: number | null
  /** 다른 사업장을 골랐을 때만 부른다 */
  onSwitch: (site: SiteOption) => void
}

/**
 * 사업장 전환 모달(`spec 061`). 목록은 로그인 선택 단계와 같은 `SiteOptionList`.
 * 지금 사업장을 고르면 닫기만 한다 — 바뀌는 게 없는데 전환 중 오버레이 · 홈 이동을 할 이유가 없다.
 */
export const SiteSwitchDialog = ({
  open,
  onOpenChange,
  options,
  currentSiteSeq,
  onSwitch,
}: SiteSwitchDialogProps) => {
  const handleSelect = (site: SiteOption) => {
    onOpenChange(false)
    if (site.siteSeq !== currentSiteSeq) onSwitch(site)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="사업장 전환"
      description="이용할 사업장을 선택해주세요"
    >
      <SiteOptionList options={options} currentSiteSeq={currentSiteSeq} onSelect={handleSelect} />
    </AppDialog>
  )
}
