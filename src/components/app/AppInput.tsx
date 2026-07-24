import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { SearchIcon, EyeIcon, EyeOffIcon } from 'lucide-react'

type InputVariant = 'default' | 'search' | 'password'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** @deprecated 004 D9 — `AppFormField`로 옮길 것. 점진 마이그레이션 대상. */
  label?: string
  /** @deprecated 004 D9 — `AppFormField`로 옮길 것. 점진 마이그레이션 대상. */
  error?: string
  /** @deprecated 004 D9 — `AppFormField`로 옮길 것. 점진 마이그레이션 대상. */
  required?: boolean
  variant?: InputVariant
}

const AppInput = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className, variant = 'default', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const isSearch = variant === 'search'
    const isPassword = variant === 'password'

    // password variant일 때 표시 상태에 따라 type 결정
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {/* 검색 아이콘 */}
          {isSearch && (
            <SearchIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
              strokeWidth={1.5}
            />
          )}

          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:border-point focus:ring-2 focus:ring-point/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isSearch && 'pl-9', // 왼쪽 아이콘 자리 확보
              isPassword && 'pr-9', // 오른쪽 아이콘 자리 확보
              error && 'border-danger focus:ring-danger',
              className
            )}
            {...props}
          />

          {/* 패스워드 토글 버튼 */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <EyeIcon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

AppInput.displayName = 'AppInput'

export default AppInput
