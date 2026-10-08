import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppPageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  /** 제목 **좌측** 아이콘. 상세 페이지에서 "무엇의 상세인가" 를 한눈에 준다 */
  icon?: LucideIcon
  /** 제목 **우측**에 붙는 것(상태 뱃지 등). `action`(헤더 맨 우측)과 자리가 다르다 */
  titleSuffix?: ReactNode
}

/**
 * 페이지 제목 블록.
 *
 * `icon`·`titleSuffix` 는 **027 상세 페이지**에서 처음 쓴다. 둘 다 선택이라 기존 호출부는
 * 영향이 없다. 제목 줄에 "아이콘 · 제목 · 상태" 가 한 줄로 서고, `action` 은 그와 별개로
 * 헤더 **맨 우측**에 남는다 — 상태와 액션은 성격이 달라 자리를 섞지 않는다.
 */
const AppPageHeader = ({
  title,
  subtitle,
  action,
  icon: Icon,
  titleSuffix,
}: AppPageHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />}
          <h1 className="text-page-title font-bold text-foreground">{title}</h1>
          {titleSuffix}
        </div>
        {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default AppPageHeader
