import type { LucideIcon } from 'lucide-react'
import { InboxIcon } from 'lucide-react'

interface AppEmptyProps {
  icon?: LucideIcon
  /**
   * `cards` = 겹친 카드(가운데 `icon`) · `route` = 순찰 경로 그림(`icon` 을 쓰지 않는다).
   * 🔴 `route` 는 **순찰 기록 · 코스가 없을 때만** 쓴다 — 오류 · 검색 결과 없음은 `cards` 다.
   */
  illustration?: 'cards' | 'route'
  title?: string
  description?: string
  action?: React.ReactNode
}

const CardsIllustration = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div aria-hidden className="relative h-[118px] w-[190px]">
    <span className="absolute inset-x-7 top-0 h-10 rounded-lg border border-border bg-card opacity-50" />
    <span className="absolute inset-x-3.5 top-3 h-10 rounded-lg border border-border bg-card opacity-80" />
    <span className="absolute inset-x-0 top-[26px] bottom-0 flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 shadow-md">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <span className="flex flex-1 flex-col gap-2">
        <span className="h-2 rounded-sm bg-muted" />
        <span className="h-2 w-3/5 rounded-sm bg-muted" />
      </span>
    </span>
  </div>
)

const RouteIllustration = () => (
  <svg aria-hidden viewBox="0 0 200 110" className="h-[110px] w-[200px] max-w-full">
    <path
      d="M16 90C56 90 52 32 100 42S150 88 184 26"
      fill="none"
      strokeWidth={2}
      strokeDasharray="2 7"
      strokeLinecap="round"
      className="stroke-muted-foreground/45"
    />
    <circle cx={16} cy={90} r={6} strokeWidth={2} className="fill-card stroke-muted-foreground/55" />
    <circle cx={100} cy={42} r={6} strokeWidth={2} className="fill-card stroke-muted-foreground/55" />
    <circle cx={184} cy={26} r={7} className="fill-muted-foreground/55" />
  </svg>
)

const AppEmpty = ({
  icon = InboxIcon,
  illustration = 'cards',
  title = '데이터가 없습니다',
  description,
  action,
}: AppEmptyProps) => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-10 text-center">
      {illustration === 'route' ? <RouteIllustration /> : <CardsIllustration icon={icon} />}

      {/* 텍스트 */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[15px] font-bold text-text-primary">{title}</p>
        {description && (
          <p className="max-w-[230px] text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* 액션 */}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export default AppEmpty
