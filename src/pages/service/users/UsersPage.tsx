import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppEmpty from '@/components/app/AppEmpty'
import AppFilterButton from '@/components/app/AppFilterButton'
import AppInput from '@/components/app/AppInput'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import { useMe } from '@/features/auth/hooks/useMe'
import { workerColumns } from '@/features/workers/components/WorkerColumns'
import WorkerDetailPanel from '@/features/workers/components/WorkerDetailPanel'
import AddWorkerForm from '@/features/workers/form/AddWorkerForm'
import { workerData } from '@/features/workers/mocks/workerData'
import type { Worker } from '@/features/workers/types/worker'
import type { PaginationState } from '@tanstack/react-table'
import { ClockIcon, PlusIcon, UserIcon, UsersIcon } from 'lucide-react'
import { useState } from 'react'

const UsersPage = () => {
  const { data: me } = useMe()
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader
        title="근무자"
        subtitle={
          me?.locationName ? `${me.locationName} 소속 근무자 ${workerData.length}명` : undefined
        }
        action={
          <AppDialog
            title="근무자 추가"
            description="새 근무자를 등록할 수 있습니다."
            trigger={
              <AppButton icon={PlusIcon}>
                근무자 추가
              </AppButton>
            }
          >
            <AddWorkerForm />
          </AppDialog>
        }
      />

      <div className="flex items-center gap-2">
        <AppInput variant="search" placeholder="이름 또는 연락처 검색" className="w-64" />
        <AppFilterButton icon={ClockIcon} label="근무 상태" />
        <AppFilterButton icon={UserIcon} label="사용자 상태" />
      </div>

      <div className="flex items-start gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <AppTable
            columns={workerColumns}
            data={workerData}
            hidePagination
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={setSelectedWorker}
          />

          <AppPagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            total={workerData.length}
            onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
            onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
          />
        </div>

        <aside className="sticky top-6 w-100">
          {selectedWorker ? (
            <WorkerDetailPanel worker={selectedWorker} />
          ) : (
            <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
              <AppEmpty
                title="근무자를 선택해주세요"
                description="왼쪽 목록에서 근무자를 선택하면 상세내용이 표시됩니다."
                icon={UsersIcon}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default UsersPage
