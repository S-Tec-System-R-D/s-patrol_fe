import { paths } from '@/router/paths'
import { format } from 'date-fns'
import { PaperclipIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { NoticeSummary } from '../types/notice'

const NoticeListItem = ({ notice }: { notice: NoticeSummary }) => {
  return (
    <Link
      to={paths.service.noticeDetail(notice.id)}
      className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {notice.isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-point" />}
          <span className="truncate text-panel-header font-semibold text-foreground">
            {notice.title}
          </span>
          {notice.hasAttachment && (
            <PaperclipIcon size={13} className="shrink-0 text-muted-foreground" />
          )}
        </div>

        <p className="w-full truncate text-caption text-muted-foreground">
          {notice.contentPreview}
        </p>

        <span className="text-caption text-muted-foreground">{notice.authorName}</span>
      </div>

      <span className="shrink-0 text-caption text-muted-foreground">
        {format(new Date(notice.createdAt), 'yy.MM.dd')}
      </span>
    </Link>
  )
}

export default NoticeListItem
