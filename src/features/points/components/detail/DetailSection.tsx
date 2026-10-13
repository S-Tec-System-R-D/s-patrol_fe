/**
 * 상세 섹션 — 제목 + (선택) 설명 + 본문.
 *
 * `description` 은 **섹션 제목만으로 의미가 불분명할 때** 한 줄 보탠다
 * (027 — "인증 수단" 이 무엇을 정하는 값인지 화면만 봐서는 알기 어렵다).
 */
const DetailSection = ({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  /** 제목 줄 **우측**에 붙는 것(수정 아이콘 등). `spec 029` — 제목을 두 번 그리지 않으려고 둔다 */
  action?: React.ReactNode
  children: React.ReactNode
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{title}</span>
          {description && <p className="text-caption text-muted-foreground/80">{description}</p>}
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export default DetailSection
