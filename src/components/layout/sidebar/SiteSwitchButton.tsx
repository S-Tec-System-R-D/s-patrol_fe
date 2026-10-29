import { useState } from 'react'
import { Building2Icon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SiteSwitchDialog } from '@/features/auth/components/SiteSwitchDialog'
import type { SiteOption } from '@/features/auth/types/site'

export interface SiteSwitchProps {
  options: SiteOption[]
  currentSiteSeq: number | null
  currentSiteName: string | null
  onSwitch: (site: SiteOption) => void
}

interface SiteSwitchButtonProps extends SiteSwitchProps {
  /** 툴팁 방향 — 레일 `right` · 하단 floating nav `top` */
  tooltipSide: 'right' | 'top'
}

/**
 * 레일 · floating nav 의 사업장 전환 버튼(`spec 061`). 모양은 옆의 `LogoutButton` 과 같다.
 * 아이콘은 건물(`Building2` — 본사 '사업장' 메뉴와 같은 뜻). ⇄ 는 배치관리 메뉴가 쓴다(사용자 결정 2026-10-29).
 * 툴팁에 지금 사업장명 — 레일 · nav 어디에도 사업장명이 없어서 여기서 확인한다.
 * 그릴지 말지(선택지 2개 이상)는 `ServiceLayout` 이 정한다.
 */
export const SiteSwitchButton = ({
  tooltipSide,
  options,
  currentSiteSeq,
  currentSiteName,
  onSwitch,
}: SiteSwitchButtonProps) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="사업장 전환"
            onClick={() => setOpen(true)}
            className="w-11 h-11 rounded-[10px] grid place-items-center text-rail-icon hover:text-white cursor-pointer"
          >
            <Building2Icon size={20} strokeWidth={1.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          {currentSiteName ? `${currentSiteName} · 사업장 전환` : '사업장 전환'}
        </TooltipContent>
      </Tooltip>
      <SiteSwitchDialog
        open={open}
        onOpenChange={setOpen}
        options={options}
        currentSiteSeq={currentSiteSeq}
        onSwitch={onSwitch}
      />
    </>
  )
}
