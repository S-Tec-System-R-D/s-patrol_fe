import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface AppSelectOption {
  value: string
  label: string
}

interface AppSelectProps {
  options: AppSelectOption[]
  /** 선택값. undefined면 placeholder 표시 */
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  /** 트리거 라벨 앞 아이콘. 목록 필터 트리거용 (018) */
  icon?: LucideIcon
  /** 필터가 걸린 상태 강조. 목록 필터 트리거용 (018) */
  active?: boolean
  /** `AppFormField` 외부 라벨이 없을 때 트리거의 접근성 이름 */
  'aria-label'?: string
}

/**
 * 단일 선택 컨트롤.
 * - label / error / hint는 갖지 않는다 — `AppFormField` 책임 (design-system.md D9).
 * - 다중 선택 미지원(017 결정). 필요해지면 기본값 false인 `multiple` prop으로 확장한다.
 * - `icon`·`active`는 목록 필터 트리거로 쓰일 때만 넘긴다(018). 둘 다 선택적이라
 *   폼 안에서 쓰는 기존 호출부는 외형이 변하지 않는다.
 */
const AppSelect = ({
  options,
  value,
  onChange,
  placeholder = '선택',
  disabled,
  className,
  icon: Icon,
  active,
  'aria-label': ariaLabel,
}: AppSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        data-active={active}
        className={cn(
          'bg-card focus-visible:border-point focus-visible:ring-point/20',
          'data-[active=true]:border-point data-[active=true]:bg-point-bg data-[active=true]:text-point-foreground',
          className
        )}
      >
        {/* 아이콘과 값을 한 묶음으로 둔다 — 트리거의 `justify-between`이 chevron만 우측으로 밀도록 */}
        <span className="flex min-w-0 items-center gap-1.5">
          {Icon && <Icon size={14} strokeWidth={1.75} className="shrink-0" />}
          <SelectValue placeholder={placeholder} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default AppSelect
