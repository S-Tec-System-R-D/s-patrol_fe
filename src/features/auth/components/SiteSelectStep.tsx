import { SiteOptionList } from '@/features/auth/components/SiteOptionList'
import type { SiteOption } from '@/features/auth/types/site'

/**
 * 사업장 선택 단계. 로그인 카드 안에서 입력 폼을 대체한다.
 *
 * **모달이 아니다.** 선택은 skip할 수 있는 단계가 아니라서 모달로 만들면 ESC·배경 클릭·X를
 * 모두 막아야 하고, 그건 `AppDialog`를 기본 동작과 반대로 쓰는 것이다. 단계 전환이면
 * "뒤로 = 다시 로그인" 하나로 끝난다(`spec 021` §3 규칙 4).
 *
 * 목록은 `SiteOptionList` — 로그인 뒤 사업장 전환 모달(`spec 061`, OQ-021-C)과 같이 쓴다.
 * 이 단계에 남은 것은 로그인 카드 제목 · 안내 문구다.
 *
 * 목업이 없다 — `design-system.md` 토큰과 `AppButton`만으로 구성한다.
 */

interface SiteSelectStepProps {
  options: SiteOption[]
  onSelect: (site: SiteOption) => void
  /** 진입 처리 중 연타 차단 */
  disabled?: boolean
}

export const SiteSelectStep = ({ options, onSelect, disabled }: SiteSelectStepProps) => (
  <div className="space-y-4">
    <div className="space-y-1 text-center">
      <h1 className="text-lg font-semibold">사업장 선택</h1>
      <p className="text-xs text-muted-foreground">이용할 사업장을 선택해주세요</p>
    </div>

    <SiteOptionList options={options} onSelect={onSelect} disabled={disabled} />
  </div>
)
