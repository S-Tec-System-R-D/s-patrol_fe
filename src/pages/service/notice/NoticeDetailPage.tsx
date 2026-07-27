import AppEmpty from '@/components/app/AppEmpty'
import NoticeDetailView from '@/features/notice/components/NoticeDetailView'
import { notices } from '@/features/notice/mocks/noticeData'
import { paths } from '@/router/paths'
import { ArrowLeftIcon, MegaphoneIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

const NoticeDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const notice = notices.find((item) => item.id === id)

  return (
    <div className="flex flex-col gap-4 p-8">
      <Link
        to={paths.service.notice}
        className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        목록으로
      </Link>

      {notice ? (
        <NoticeDetailView notice={notice} />
      ) : (
        <AppEmpty
          icon={MegaphoneIcon}
          title="공지를 찾을 수 없습니다"
          description="목록에서 다시 선택해주세요."
        />
      )}
    </div>
  )
}

export default NoticeDetailPage
