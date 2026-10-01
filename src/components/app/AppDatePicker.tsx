import { format } from 'date-fns'
import { ko } from 'react-day-picker/locale'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface AppDateRange {
  from?: Date
  to?: Date
}

interface AppDatePickerProps {
  value: AppDateRange
  onChange: (range: AppDateRange) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const formatRange = ({ from, to }: AppDateRange) => {
  if (!from) return null
  const start = format(from, 'yyyy-MM-dd')
  return to ? `${start} ~ ${format(to, 'yyyy-MM-dd')}` : start
}

/**
 * 날짜 범위 선택 컨트롤.
 * - 범위 전용(017 결정). 단일 날짜 선택은 확정 수요가 생길 때 추가한다.
 * - 값은 Date 객체로만 다룬다 — 쿼리스트링 직렬화는 소비 측 책임(patterns.md §6).
 */
const AppDatePicker = ({
  value,
  onChange,
  placeholder = '기간 선택',
  disabled,
  className,
}: AppDatePickerProps) => {
  const label = formatRange(value)

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          'flex h-8 w-full items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-sm text-foreground outline-hidden transition-colors',
          'focus-visible:border-point focus-visible:ring-2 focus-visible:ring-point/20',
          'disabled:pointer-events-none disabled:opacity-50',
          !label && 'text-muted-foreground',
          className
        )}
      >
        <CalendarIcon className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{label ?? placeholder}</span>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          mode="range"
          locale={ko}
          defaultMonth={value.from}
          selected={value.from ? { from: value.from, to: value.to } : undefined}
          onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export default AppDatePicker
