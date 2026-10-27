import { CalendarIcon, ChevronRightIcon, MegaphoneIcon, PaperclipIcon, PinIcon, UserIcon } from 'lucide-react'

import type { NoticeRow } from '../types/notice'

/**
 * 공지 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 026` T577).
 *
 * 🔴 **`spec 034` 카드 골격**: `타일 + 제목 줄 + 지표 줄 + 꺾쇠` — 이력·코스·지점 카드와 같은
 * 어휘다. ⚠️ `onRowClick` 이 있어 `AppTable` 이 카드를 **`button`** 으로 그리므로 안에 버튼을
 * 둘 수 없다(`patterns.md` §14). 셸(테두리·배경·클릭)은 `AppTable` 이 그린다.
 */

const formatDate = (value: string): string => value.slice(0, 10)

const NoticeCard = (row: NoticeRow) => (
  <div className="flex items-center gap-3">
    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-point-bg text-point">
      <MegaphoneIcon size={20} strokeWidth={1.75} />
    </span>

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-1.5">
        {row.isPin && <PinIcon size={13} className="shrink-0 text-point" aria-label="고정 공지" />}
        <span className="truncate text-body font-semibold text-foreground">{row.title}</span>
      </div>

      <div className="card-meta text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <CalendarIcon size={13} strokeWidth={1.75} className="shrink-0" />
          {formatDate(row.createDt)}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1">
          <UserIcon size={13} strokeWidth={1.75} className="shrink-0" />
          <span className="truncate">{row.userName}</span>
        </span>
        {row.attachCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <PaperclipIcon size={13} strokeWidth={1.75} className="shrink-0" />
            첨부 {row.attachCount}
          </span>
        )}
      </div>
    </div>

    <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
  </div>
)

export default NoticeCard
