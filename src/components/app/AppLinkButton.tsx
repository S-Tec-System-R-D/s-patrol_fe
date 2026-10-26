import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

/**
 * 카드 · 모달 **안쪽**의 가벼운 액션 버튼 — 테두리 없는 point 글자 + hover 연한 배경(`048`, 사용자 결정 2026-10-26).
 * 관리자 상세 [그룹 추가] · 관리그룹 편집 [+ 본부 추가] 의 모양을 공용으로 뺐다.
 *
 * 🔴 클래스를 `cn`(tailwind-merge)에 넣지 않는다 — `text-meta`(폰트 크기 토큰)를 글자색으로 보고 지운다
 * (`AppBadge.variants.ts` 와 같은 함정). 같은 이유로 `AppButton` 의 variant 로도 넣지 않았다.
 */
const linkClass =
  'inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-meta font-semibold text-point-foreground hover:bg-point-bg ' +
  // 글자만 있는 버튼은 흐리게만 하면 막힌 줄 모른다 — 회색으로 바꾼다
  'disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent'

interface AppLinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
}

const AppLinkButton = ({ icon: Icon, type = 'button', className, children, ...props }: AppLinkButtonProps) => (
  <button type={type} className={className ? `${linkClass} ${className}` : linkClass} {...props}>
    {Icon && <Icon size={13} />}
    {children}
  </button>
)

export default AppLinkButton
