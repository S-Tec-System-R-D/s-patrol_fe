import AppEmpty from '@/components/app/AppEmpty'
import AppInput from '@/components/app/AppInput'
import AppPagination from '@/components/app/AppPagination'
import { MegaphoneIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { NoticeSummary } from '../types/notice'
import NoticeListItem from './NoticeListItem'

const NoticeList = ({ notices }: { notices: NoticeSummary[] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const pagedNotices = useMemo(
    () => notices.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize),
    [notices, pageIndex, pageSize]
  )

  return (
    <div className="flex flex-col gap-4">
      <AppInput
        variant="search"
        placeholder="제목 또는 작성자 검색"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {pagedNotices.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {pagedNotices.map((notice) => (
            <NoticeListItem key={notice.id} notice={notice} />
          ))}
        </div>
      ) : (
        <AppEmpty
          icon={MegaphoneIcon}
          title="등록된 공지가 없습니다"
          description="상단의 '공지 작성' 버튼으로 새 공지를 등록해주세요."
        />
      )}

      <AppPagination
        pageIndex={pageIndex}
        pageSize={pageSize}
        total={notices.length}
        onPageChange={setPageIndex}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPageIndex(0)
        }}
      />
    </div>
  )
}

export default NoticeList
