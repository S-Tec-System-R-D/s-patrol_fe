import type { ReactNode } from 'react'

interface AppPageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  /** 제목 **우측**에 붙는 것(상태 뱃지 등). `action`(헤더 맨 우측)과 자리가 다르다 */
  titleSuffix?: ReactNode
}

/**
 * 페이지 제목 블록.
 *
 * 제목 줄에 "제목 · 상태(`titleSuffix`)" 가 한 줄로 서고, `action` 은 그와 별개로
 * 헤더 **맨 우측**에 남는다 — 상태와 액션은 성격이 달라 자리를 섞지 않는다.
 * 🔄 `spec 084`(사용자 결정 2026-11-20): 제목 왼쪽의 남색 아이콘 타일을 없앴다 — 위 줄의 경로 표시
 * (`코스/지점 › 코스 상세`)가 "무엇의 상세인가" 를 이미 말한다.
 *
 * 🔴 좁은 폭(`spec 053`): 제목 줄은 `flex-wrap` — 뱃지가 다음 줄로 내려간다. 제목은 `break-keep` 이라 한글이
 * 글자 단위가 아니라 띄어쓰기에서만 꺾인다(전에는 320px 에서 `A동 순찰코스` 가 한 글자씩 6줄로 섰다).
 */
const AppPageHeader = ({
  title,
  subtitle,
  action,
  titleSuffix,
}: AppPageHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="break-keep text-page-title font-bold text-foreground">{title}</h1>
            {titleSuffix}
          </div>
          {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export default AppPageHeader
