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
  /** `AppFormField` 외부 라벨이 없을 때 트리거의 접근성 이름 */
  'aria-label'?: string
}

/**
 * 단일 선택 컨트롤.
 * - label / error / hint는 갖지 않는다 — `AppFormField` 책임 (design-system.md D9).
 * - 다중 선택 미지원(017 결정). 필요해지면 기본값 false인 `multiple` prop으로 확장한다.
 */
const AppSelect = ({
  options,
  value,
  onChange,
  placeholder = '선택',
  disabled,
  className,
  'aria-label': ariaLabel,
}: AppSelectProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          'bg-card focus-visible:border-point focus-visible:ring-point/20',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
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
