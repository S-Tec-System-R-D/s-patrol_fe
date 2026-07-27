import AppEmpty from '@/components/app/AppEmpty'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMe } from '@/features/auth/hooks/useMe'
import { useQueryParams } from '@/hooks/useQueryParams'
import type { PaginationState } from '@tanstack/react-table'
import { ArrowLeftRightIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDeploymentStore } from '../store/deploymentStore'
import { deploymentHistoryColumns } from './DeploymentHistoryColumns'

type HistoryTab = 'out' | 'in'

/**
 * 배치 이력 하단 탭 — 나간/온 방향은 별도 필드 없이 로그인 사업장명과
 * fromLocationName/toLocationName을 비교해 런타임에 판정한다(spec.md §3).
 * 탭 선택 상태는 `?historyTab=out|in` 쿼리스트링으로 보존한다.
 */
const DeploymentHistoryTabs = () => {
  const { data: me } = useMe()
  const historyItems = useDeploymentStore((state) => state.historyItems)
  const [params, setParams] = useQueryParams<'historyTab'>()
  const activeTab: HistoryTab = params.historyTab === 'in' ? 'in' : 'out'

  const [outPagination, setOutPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [inPagination, setInPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const locationName = me?.locationName
  const outHistory = useMemo(
    () => historyItems.filter((item) => item.fromLocationName === locationName),
    [historyItems, locationName]
  )
  const inHistory = useMemo(
    () => historyItems.filter((item) => item.toLocationName === locationName),
    [historyItems, locationName]
  )

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setParams({ historyTab: value === 'in' ? 'in' : undefined })}
      >
        <TabsList>
          <TabsTrigger value="out">전출 이력</TabsTrigger>
          <TabsTrigger value="in">전입 이력</TabsTrigger>
        </TabsList>

        <TabsContent value="out">
          {outHistory.length > 0 ? (
            <div className="flex flex-col gap-4">
              <AppTable
                columns={deploymentHistoryColumns}
                data={outHistory}
                hidePagination
                pagination={outPagination}
                onPaginationChange={setOutPagination}
              />
              <AppPagination
                pageIndex={outPagination.pageIndex}
                pageSize={outPagination.pageSize}
                total={outHistory.length}
                onPageChange={(pageIndex) => setOutPagination((prev) => ({ ...prev, pageIndex }))}
                onPageSizeChange={(pageSize) => setOutPagination({ pageIndex: 0, pageSize })}
              />
            </div>
          ) : (
            <AppEmpty icon={ArrowLeftRightIcon} title="전출 이력이 없습니다" />
          )}
        </TabsContent>

        <TabsContent value="in">
          {inHistory.length > 0 ? (
            <div className="flex flex-col gap-4">
              <AppTable
                columns={deploymentHistoryColumns}
                data={inHistory}
                hidePagination
                pagination={inPagination}
                onPaginationChange={setInPagination}
              />
              <AppPagination
                pageIndex={inPagination.pageIndex}
                pageSize={inPagination.pageSize}
                total={inHistory.length}
                onPageChange={(pageIndex) => setInPagination((prev) => ({ ...prev, pageIndex }))}
                onPageSizeChange={(pageSize) => setInPagination({ pageIndex: 0, pageSize })}
              />
            </div>
          ) : (
            <AppEmpty icon={ArrowLeftRightIcon} title="전입 이력이 없습니다" />
          )}
        </TabsContent>
      </Tabs>
    </section>
  )
}

export default DeploymentHistoryTabs
