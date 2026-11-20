import type { LucideIcon } from 'lucide-react'
import { InboxIcon, RouteIcon, TriangleAlertIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppEmptyProps {
  icon?: LucideIcon
  /**
   * 🔄 `spec 083`: 그림 두 종류(겹친 카드 · 순찰 경로)를 없앴다 — 어느 쪽이든 **흰 타일 아이콘** 하나다.
   * 값은 받기만 한다: `route`(순찰 기록 · 코스가 없을 때)는 `icon` 을 넘기지 않아도 경로 아이콘을 쓴다.
   */
  illustration?: 'cards' | 'route'
  title?: string
  description?: string
  action?: React.ReactNode
}

/**
 * 데이터가 없을 때의 자리 — **흰 타일 아이콘 → 제목 → 설명 → (버튼)**(`spec 083`, 목업 `27` · `28`).
 * 남은 영역의 가운데에 놓인다(`flex-1` + 가운데 정렬 — 감싸는 쪽이 세로 flex 여야 한다).
 *
 * - 처음부터 없음 / 조건에 맞는 것 없음 / 불러오지 못함은 **아이콘과 문구**로 구분한다(쓰는 쪽이 넘긴다).
 * - 🔴 불러오지 못함(`TriangleAlertIcon`)은 아이콘이 빨강이다 — 쓰는 곳이 모두 그 아이콘을 넘기고 있어
 *   따로 종류를 받지 않고 아이콘으로 가린다.
 * - 🔴 넓은 자리용이다. 화면의 한 영역 안(카드 · 옆 단)에서는 회색 글자 한 줄을 쓴다(`디자인-규칙.md` — 084 에서 옮긴다).
 */
const AppEmpty = ({
  icon,
  illustration = 'cards',
  title = '데이터가 없습니다',
  description,
  action,
}: AppEmptyProps) => {
  const Icon = icon ?? (illustration === 'route' ? RouteIcon : InboxIcon)
  const failed = Icon === TriangleAlertIcon

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
      <span
        aria-hidden
        className={cn(
          'grid size-12 place-items-center rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(15_23_42/0.06),0_4px_10px_rgb(15_23_42/0.06)]',
          failed ? 'text-danger' : 'text-foreground/70'
        )}
      >
        <Icon size={22} strokeWidth={1.7} />
      </span>

      {/* 텍스트 */}
      <p className="mt-[18px] text-[15px] font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {/* 액션 */}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default AppEmpty
