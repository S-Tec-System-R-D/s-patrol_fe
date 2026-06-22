import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppFormFieldProps {
  /** 필드 라벨 (생략 시 라벨 영역 미렌더) */
  label?: string
  /** 필수 표시(*) 토글 */
  required?: boolean
  /** 에러 메시지 (있으면 hint 대신 노출) */
  error?: string
  /** 보조 문구 (에러 없을 때만 노출) */
  hint?: string
  /** 인풋 컨트롤 (AppInput / AppSelect / 기타) */
  children: ReactNode
  /** 외부 래퍼 클래스 보강 */
  className?: string
}

/**
 * 폼 영역 컨테이너.
 * - `label / required / error / hint`를 한 곳에서 책임.
 * - 자식 컨트롤(AppInput, 향후 AppSelect/AppDatePicker)은 "디자인된 인풋" 책임만 가짐.
 * - 색·간격은 docs/design-system.md §1·§2-4 따름.
 *
 * 도입 사유: design-system.md §5 D9 + roadmap.md Phase 0 004.
 * 기존 AppInput의 label/error/required props는 점진 deprecation(콘솔 경고 없음, JSDoc만).
 */
export const AppFormField = ({
  label,
  required,
  error,
  hint,
  children,
  className,
}: AppFormFieldProps) => {
  const helper = error ?? hint
  const helperTone = error ? 'text-danger' : 'text-text-secondary'

  return (
    <div className={cn('flex flex-col gap-1 w-full', className)}>
      {label && (
        <label className="text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      {children}
      {helper && <p className={cn('text-xs', helperTone)}>{helper}</p>}
    </div>
  )
}
