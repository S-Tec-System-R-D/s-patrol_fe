import { CheckIcon, type LucideIcon } from 'lucide-react'

import AppFilterButton from '@/components/app/AppFilterButton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * 컴팩트 필터 — **트리거 버튼 + 단일 선택 팝오버**.
 *
 * 🔴 **`AppFilterButton` 은 시각만 있고 조립 사례가 0건이었다.** 주석에 "콘텐츠 조립은
 * 소비 측 책임" 이라 적혀 있었고, 실제로 `/patrol/points` 5개·`/users` 2개가 **눌러도
 * 아무 일도 안 일어나는 죽은 버튼**으로 남아 있었다(`spec 027` 분석). 이 컴포넌트가
 * 그 조립을 **처음으로 채운다** — 그래서 027 전용이 아니라 공용(`components/app/`)이다.
 *
 * 🔴 **"전체" 를 값이 아니라 해제로 다룬다.** 선택하면 `onChange(undefined)` 가 간다 —
 * `ALL` 같은 센티넬을 URL·서버로 흘리지 않기 위해서다(018 규약 승계, `spec 022` 규칙 8).
 *
 * ⚠️ **단일 선택만 한다.** 027 이 쓰는 것은 인증수단·사용여부 2종뿐이고, 날짜 범위·다중
 * 선택은 소비처가 생길 때 넓힌다(A6). `/patrol/points` 의 기간·순찰자 필터는 `spec 024`
 * 몫이다 — 지금 넣으면 안 쓰는 분기가 는다.
 */

export interface FilterOption {
  /** `undefined` 를 쓰지 않는다 — "전체" 는 옵션이 아니라 해제다(아래 `allLabel`) */
  value: string
  label: string
}

interface AppFilterPopoverProps {
  /** 버튼에 보이는 이름. 선택되면 `이름: 값` 으로 바뀐다 */
  label: string
  icon?: LucideIcon
  options: FilterOption[]
  /** 선택 없음 = `undefined` */
  value?: string
  onChange: (value: string | undefined) => void
  /** "전체" 항목의 문구. 누르면 `onChange(undefined)` */
  allLabel?: string
}

const AppFilterPopover = ({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel = '전체',
}: AppFilterPopoverProps) => {
  const selected = options.find((option) => option.value === value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        {/* 🔴 선택값을 **라벨에 붙인다** — 버튼만 보고 무엇이 걸려 있는지 알아야 한다.
            `active` 는 테두리·배경으로도 알리므로 색만으로 전달하지 않는다 */}
        <AppFilterButton
          icon={icon}
          label={selected ? `${label}: ${selected.label}` : label}
          active={selected !== undefined}
        />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-44 p-1">
        <ul role="listbox" aria-label={label}>
          <FilterItem
            label={allLabel}
            selected={selected === undefined}
            onSelect={() => onChange(undefined)}
          />
          {options.map((option) => (
            <FilterItem
              key={option.value}
              label={option.label}
              selected={option.value === value}
              onSelect={() => onChange(option.value)}
            />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

const FilterItem = ({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) => (
  <li>
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-left text-body transition-colors hover:bg-muted',
        selected && 'font-semibold text-point'
      )}
    >
      {label}
      {/* 선택 표시를 체크로도 준다 — 색·굵기만으로 전달하지 않는다(design-system §3) */}
      {selected && <CheckIcon size={14} strokeWidth={2} />}
    </button>
  </li>
)

export default AppFilterPopover
