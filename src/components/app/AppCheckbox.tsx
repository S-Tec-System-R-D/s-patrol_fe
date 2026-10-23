import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** 글자 외 노드도 받는다 — 검색 강조(`spec 045` 담당 그룹 고르기) */
  label?: React.ReactNode
  error?: string
}

const AppCheckbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label
          className={cn(
            'flex items-center gap-2 cursor-pointer select-none',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="relative flex items-center justify-center">
            <input
              ref={ref}
              type="checkbox"
              disabled={disabled}
              className="peer sr-only"
              {...props}
            />
            {/* ✅ input의 형제로 배치 */}
            <div
              className={cn(
                'w-4 h-4 rounded-sm border border-border bg-surface',
                'peer-focus:ring-2 peer-focus:ring-point peer-focus:ring-offset-1',
                'peer-checked:bg-point peer-checked:border-point',
                'transition-colors',
                error && 'border-danger',
                className
              )}
            />
            {/* ✅ input의 형제로 빼고 absolute 위치 */}
            <CheckIcon
              className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
              strokeWidth={3}
            />
          </div>

          {label && <span className="text-sm text-text-primary">{label}</span>}
        </label>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

AppCheckbox.displayName = 'AppCheckbox'

export default AppCheckbox
