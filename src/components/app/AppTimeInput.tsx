import { forwardRef, useEffect, useId, useRef, useState } from 'react'
import { ClockIcon } from 'lucide-react'

import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { formatTyping, HOURS, minuteOptions, normalizeTime, splitTime } from '@/lib/timeInput'
import { cn } from '@/lib/utils'

/**
 * 시각 입력 — 24시간 `HH:mm` (`spec 080` D8, 사용자 결정 2026-11-16).
 *
 * - 🔴 브라우저 `type="time"` 을 쓰지 않는다 — 시계 창 · `오전/오후` 칸은 디자인할 수 없다.
 * - **키보드**: 숫자만 치면 된다(`1230` → `12:30`). 칸을 떠날 때 짧은 값을 채운다(`9` → `09:00`).
 * - **시계 버튼**: 시 · 분 두 열 목록(분은 5분 단위 + 지금 값). 열면 고른 값으로 스크롤 · 분을 고르면 닫힌다.
 * - 값은 `react-hook-form` `Controller` 로 받는다(`value` · `onChange(string)`). 모양은 `AppInput` 과 같다.
 */

interface AppTimeInputProps {
  label?: string
  required?: boolean
  error?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  'aria-label': string
}

const scrollToSelected = (list: HTMLElement | null) =>
  list?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'center' })

const AppTimeInput = forwardRef<HTMLInputElement, AppTimeInputProps>(
  ({ label, required, error, value, onChange, onBlur, name, 'aria-label': ariaLabel }, ref) => {
    const id = useId()
    const errorId = `${id}-error`
    const [open, setOpen] = useState(false)
    const hourList = useRef<HTMLDivElement>(null)
    const minuteList = useRef<HTMLDivElement>(null)
    const parts = splitTime(value)
    const hour = parts?.[0] ?? null
    const minute = parts?.[1] ?? null

    useEffect(() => {
      if (!open) return
      const frame = requestAnimationFrame(() => {
        scrollToSelected(hourList.current)
        scrollToSelected(minuteList.current)
      })
      return () => cancelAnimationFrame(frame)
    }, [open])

    const option = (selected: boolean) =>
      cn(
        'block w-full rounded-sm py-1.5 text-center text-sm tabular-nums transition-colors',
        selected ? 'bg-point font-semibold text-white' : 'text-foreground hover:bg-muted'
      )

    return (
      <div className="flex w-full flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-[12px] font-medium text-sub-foreground">
            {label}
            {required && <span className="ml-1 text-danger">*</span>}
          </label>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor asChild>
            <div
              className={cn(
                'flex items-center rounded-sm border bg-card',
                'focus-within:border-point focus-within:ring-2 focus-within:ring-point/20',
                error ? 'border-danger focus-within:ring-danger' : 'border-border'
              )}
            >
              <input
                ref={ref}
                id={id}
                name={name}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="--:--"
                maxLength={5}
                aria-label={ariaLabel}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                value={value}
                onChange={(event) => onChange(formatTyping(event.target.value))}
                onBlur={() => {
                  const filled = normalizeTime(value)
                  if (filled !== value) onChange(filled)
                  onBlur?.()
                }}
                className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none"
              />
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${ariaLabel} 시각 선택`}
                  className="mr-1 grid size-7 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ClockIcon size={15} strokeWidth={1.75} />
                </button>
              </PopoverTrigger>
            </div>
          </PopoverAnchor>
          <PopoverContent align="end" className="w-44 p-1.5">
            <div className="grid grid-cols-2 gap-1">
              <div className="flex min-w-0 flex-col">
                <span className="pb-1 text-center text-caption font-medium text-muted-foreground">시</span>
                <div
                  ref={hourList}
                  role="listbox"
                  aria-label={`${ariaLabel} 시`}
                  className="flex h-52 flex-col gap-0.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]"
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="option"
                      aria-selected={h === hour}
                      onClick={() => onChange(`${h}:${minute ?? '00'}`)}
                      className={option(h === hour)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex min-w-0 flex-col border-l border-border pl-1">
                <span className="pb-1 text-center text-caption font-medium text-muted-foreground">분</span>
                <div
                  ref={minuteList}
                  role="listbox"
                  aria-label={`${ariaLabel} 분`}
                  className="flex h-52 flex-col gap-0.5 overflow-y-auto overscroll-contain pr-0.5 [scrollbar-width:thin]"
                >
                  {minuteOptions(minute).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={m === minute}
                      onClick={() => {
                        onChange(`${hour ?? '00'}:${m}`)
                        setOpen(false)
                      }}
                      className={option(m === minute)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {error && (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    )
  }
)
AppTimeInput.displayName = 'AppTimeInput'

export default AppTimeInput
