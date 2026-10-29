import { CheckIcon } from 'lucide-react'
import AppButton from '@/components/app/AppButton'
import type { SiteOption } from '@/features/auth/types/site'

interface SiteOptionListProps {
  options: SiteOption[]
  onSelect: (site: SiteOption) => void
  /** 지금 사업장 — 체크 표시. 로그인 단계는 아직 고른 게 없어 넘기지 않는다 */
  currentSiteSeq?: number | null
  /** 진입 처리 중 연타 차단 */
  disabled?: boolean
}

/**
 * 사업장 선택지 목록 — 로그인 선택 단계(`SiteSelectStep`, 021)와 사업장 전환 모달(`spec 061`)이 같이 쓴다.
 * 선택지 규칙(루트 포함 · 루트 먼저 · 계층 표시 없음)은 `toSiteOptions` 가 정한다.
 */
export const SiteOptionList = ({
  options,
  onSelect,
  currentSiteSeq,
  disabled,
}: SiteOptionListProps) => (
  <ul className="space-y-2">
    {options.map((site) => {
      const isCurrent = site.siteSeq === currentSiteSeq
      return (
        <li key={site.siteSeq}>
          <AppButton
            variant="sub"
            size="full"
            type="button"
            disabled={disabled}
            aria-current={isCurrent || undefined}
            icon={isCurrent ? CheckIcon : undefined}
            iconPosition="right"
            className={isCurrent ? 'border-point text-point' : undefined}
            onClick={() => onSelect(site)}
          >
            {site.siteName}
          </AppButton>
        </li>
      )
    })}
  </ul>
)
