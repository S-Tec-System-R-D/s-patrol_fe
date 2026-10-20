import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppDetailCardProps {
  icon?: LucideIcon
  title: string
  /**
   * 제목 **바로 옆**에 붙는 보조 설명(건수 등). 🔴 뱃지가 아니어도 된다 — 자리 이름이다.
   * ⚠️ **액션(링크·버튼)을 넣지 않는다** — 그건 카드 오른쪽 가장자리의 몫이다.
   */
  badge?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

/**
 * 마스터-디테일 우측 상세 패널 표준 컨테이너 (patterns.md §1, §11).
 * 정보행은 children 안에서 AppDetailRow로 조립한다.
 */
const AppDetailCard = ({ icon: Icon, title, badge, footer, children }: AppDetailCardProps) => {
  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/**
       * 🔴 **`badge` 는 제목 **바로 옆**이다**(2026-10-20, 사용자 판단).
       *
       * 두 번 옮겼다: 제목 **아래 줄** → **최우측** → **제목 옆**. 아래 줄일 때는 제목·badge·
       * 본문 메타가 **회색 세 줄로 쌓였고**, 최우측일 때는 **제목과 멀어 설명으로 안 읽혔다.**
       *
       * 🔴 **이 자리는 "그 제목이 무엇인가" 를 적는 곳이다** — 제목과 한 덩어리로 읽혀야 한다
       * (`순찰 기록  메모 1건 · 사진 1장`). ⚠️ **액션은 여기 두지 않는다**: 제목 옆 링크는
       * 탭·필터처럼 보이고, 이 앱은 **오른쪽 가장자리 = 액션** 으로 일관돼 있다
       * (`AppPageHeader` 버튼 · `전체 기록` 링크 · 지도 카드의 상태 표시).
       *
       * ⚠️ 소비처가 **1곳뿐**이라(`PointHistoryMemoCard`. 다른 `badge=` 둘은 `AppKpiCard` 다)
       * 옮겨도 번지지 않는다.
       */}
      <div className="flex items-baseline gap-2">
        <div className="flex items-center gap-1.5 text-panel-title font-bold text-foreground">
          {Icon && <Icon size={16} strokeWidth={1.75} />}
          <span>{title}</span>
        </div>
        {badge}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto">{children}</div>

      {footer && <div className="flex flex-col gap-2 border-t border-border pt-4">{footer}</div>}
    </div>
  )
}

export default AppDetailCard
