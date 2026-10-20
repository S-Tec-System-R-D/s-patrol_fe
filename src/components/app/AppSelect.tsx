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
  /**
   * 필터가 걸린 상태 강조. 목록 필터 트리거용 (018).
   *
   * 🔴 **`false` 와 `undefined` 가 다르다**(2026-10-20). `false` 는 "필터인데 안 걸렸다",
   * `undefined` 는 "필터가 아니다"(폼 안의 셀렉트)다 — 미선택 톤은 **앞쪽에만** 입힌다.
   */
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
          /**
           * 🔴 **미선택 톤을 기간 필터와 맞춘다**(사용자 지적 2026-10-20).
           *
           * 같은 필터 바인데 **기간만 연한 회색**이고 코스·결과는 진한 먹이었다. 원인은
           * 색 설정이 아니라 **값의 유무**다: 셀렉트는 미선택일 때도 `전체` 라는 **값을 들고
           * 있어**(`courseHistoryFilters` 의 `allOption`) shadcn 의
           * `data-placeholder:text-muted-foreground` 가 **영원히 안 걸린다** — 선택과 미선택이
           * 같은 색이 된다.
           *
           * ⚠️ `data-[active=false]` 라 **폼 안의 셀렉트는 그대로다**(`active` 미전달 → 속성 없음).
           */
          'data-[active=false]:text-muted-foreground',
          className
        )}
      >
        {/* 아이콘과 값을 한 묶음으로 둔다 — 트리거의 `justify-between`이 chevron만 우측으로 밀도록 */}
        {/* 🔴 **`whitespace-nowrap`**(사용자 확인 2026-10-16) — 목록 필터로 쓸 때는 트리거
            폭이 `w-auto` 라, 코스명처럼 긴 값이 오면 **글자가 두 줄로 접혀 깨졌다.**
            선택값은 한 줄로 두고 넘치면 `truncate` 가 자른다(트리거 폭은 호출부가 정한다) */}
        <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
          {/* 🔴 **치수·불투명도를 `AppDatePicker` 와 맞춘다**(2026-10-20) — 같은 줄에서
              기간 아이콘은 16px·60% 인데 이쪽만 14px·불투명이라 **무게가 달라 보였다** */}
          {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0 opacity-60" />}
          <SelectValue placeholder={placeholder} className="truncate" />
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
