import AppAlertDialog from '@/components/AppAlertDialog'
import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import NoticeForm from '@/features/notice/form/NoticeForm'
import { paths } from '@/router/paths'
import { PaperclipIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Notice } from '../types/notice'

const NoticeDetailView = ({ notice }: { notice: Notice }) => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <h2 className="text-panel-title font-bold text-foreground">{notice.title}</h2>
        {notice.appPushSent && <AppBadge variant="point">앱 푸시 발송</AppBadge>}
      </div>

      <div className="flex flex-col divide-y divide-border/60">
        <AppDetailRow label="작성자" value={notice.authorName} />
        <AppDetailRow label="작성일" value={notice.createdAt} />
      </div>

      <p className="whitespace-pre-line text-body text-foreground">{notice.content}</p>

      {notice.attachments.length > 0 && (
        <section className="flex flex-col gap-2 border-t border-border pt-4">
          <h4 className="text-label font-medium uppercase tracking-wide text-muted-foreground">
            첨부파일
          </h4>
          <ul className="flex flex-col gap-1">
            {notice.attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center gap-2 text-body text-foreground"
              >
                <PaperclipIcon size={14} className="text-muted-foreground" />
                {attachment.fileName}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-2 flex gap-2 border-t border-border pt-4">
        <AppDialog
          title="공지 수정"
          description="공지 내용을 수정할 수 있습니다."
          trigger={
            <AppButton icon={SquarePenIcon} variant="sub">
              수정
            </AppButton>
          }
        >
          <NoticeForm notice={notice} />
        </AppDialog>

        <AppAlertDialog
          icon={Trash2Icon}
          variant="destructive"
          title="공지를 삭제하시겠습니까?"
          description="삭제된 공지는 복구할 수 없습니다."
          onAction={() => navigate(paths.service.notice)}
        >
          <AppButton icon={Trash2Icon} variant="destructive">
            삭제
          </AppButton>
        </AppAlertDialog>
      </div>
    </div>
  )
}

export default NoticeDetailView
