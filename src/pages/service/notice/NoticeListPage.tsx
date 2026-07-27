import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppPageHeader from '@/components/app/AppPageHeader'
import NoticeList from '@/features/notice/components/NoticeList'
import NoticeForm from '@/features/notice/form/NoticeForm'
import { notices } from '@/features/notice/mocks/noticeData'
import { PlusIcon } from 'lucide-react'

const NoticeListPage = () => {
  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader
        title="공지사항"
        subtitle={`총 ${notices.length}건`}
        action={
          <AppDialog
            title="공지 작성"
            description="근무자에게 전달할 공지를 작성합니다."
            trigger={
              <AppButton icon={PlusIcon} variant="default">
                공지 작성
              </AppButton>
            }
          >
            <NoticeForm />
          </AppDialog>
        }
      />
      <NoticeList notices={notices} />
    </div>
  )
}

export default NoticeListPage
