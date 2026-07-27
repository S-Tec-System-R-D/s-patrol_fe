import AppEmpty from '@/components/app/AppEmpty'
import AppPagination from '@/components/app/AppPagination'
import { InboxIcon } from 'lucide-react'
import { useState } from 'react'
import { useDeploymentStore } from '../store/deploymentStore'
import DeploymentRequestRow from './DeploymentRequestRow'

const DeploymentRequestList = () => {
  const pendingRequests = useDeploymentStore((state) => state.pendingRequests)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const paged = pendingRequests.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-panel-title font-bold text-foreground">배치 요청 목록</h2>
        <p className="text-caption text-muted-foreground">타 현장 근무자의 배치 요청 · 승인/거부</p>
      </div>

      {paged.length > 0 ? (
        <>
          <div className="flex flex-col">
            {paged.map((request) => (
              <DeploymentRequestRow key={request.id} request={request} />
            ))}
          </div>
          <AppPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={pendingRequests.length}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPageIndex(0)
            }}
          />
        </>
      ) : (
        <AppEmpty icon={InboxIcon} title="대기중인 배치 요청이 없습니다" />
      )}
    </section>
  )
}

export default DeploymentRequestList
