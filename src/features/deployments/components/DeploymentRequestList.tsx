import { useEffect, useMemo, useState } from 'react'
import { InboxIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPagination from '@/components/app/AppPagination'
import { parsePageNumber } from '@/features/course-history/lib/courseHistoryListParams'
import { toPageIndex, toPageNumber } from '@/features/courses/lib/courseListParams'
import { useQueryParams } from '@/hooks/useQueryParams'
import { getSiteSeq } from '@/lib/auth/site'
import { useDeploymentRequests } from '../hooks/useDeploymentRequests'
import { DEPLOYMENT_PAGE_SIZE, toRequestListParams } from '../lib/deploymentParams'
import DeploymentRequestRow from './DeploymentRequestRow'

/**
 * 배치 요청 목록 (`spec 039` T640).
 *
 * 🔴 **서버 페이징 + 상태 분기 4종**(다른 목록과 같은 규약). 페이지는 `?requestPage`(이력과 따로 —
 * 한 화면에 목록이 둘이다).
 *
 * 🔴 **마지막 행을 처리하면 이전 페이지로**(spec §4) — 2페이지의 유일한 요청을 승인하면 무효화 뒤
 * 2페이지가 **정상 응답인 빈 페이지**가 되고, 사용자는 요청이 다 없어진 줄 안다.
 */
const DeploymentRequestList = () => {
  const siteSeq = getSiteSeq()
  const [params, setParams] = useQueryParams<'requestPage'>()
  const pageNumber = parsePageNumber(params.requestPage)
  /** 행 수는 URL 에 두지 않지만 동작은 한다(026·038 승계). 바꾸면 첫 페이지로 */
  const [pageSize, setPageSize] = useState(DEPLOYMENT_PAGE_SIZE)

  const listParams = useMemo(
    () =>
      siteSeq === null
        ? null
        : { ...toRequestListParams(siteSeq, params.requestPage), pageSize },
    [siteSeq, params.requestPage, pageSize]
  )
  const list = useDeploymentRequests(listParams)
  const items = list.data?.items ?? []

  const pageEmptied = list.isSuccess && items.length === 0 && pageNumber > 1
  useEffect(() => {
    if (pageEmptied) {
      setParams(
        { requestPage: pageNumber - 1 > 1 ? String(pageNumber - 1) : undefined },
        { replace: true }
      )
    }
  }, [pageEmptied, pageNumber, setParams])

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-panel-title font-bold text-foreground">배치 요청 목록</h2>
        <p className="text-caption text-muted-foreground">타 현장 근무자의 배치 요청 · 승인/거부</p>
      </div>

      {list.isError ? (
        /* 🔴 조회 실패를 "요청 없음" 으로 보여주지 않는다 — 처리할 요청을 놓친다 */
        <div>
          <AppEmpty
            icon={TriangleAlertIcon}
            title="배치 요청을 불러오지 못했습니다"
            description={list.error?.message}
          />
          <div className="flex justify-center pb-2">
            <AppButton variant="sub" onClick={() => void list.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : list.isPending || pageEmptied ? (
        <div className="flex flex-col">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border-b border-border/50 py-3 last:border-0">
              <div className="h-10 animate-pulse rounded-md bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <AppEmpty icon={InboxIcon} title="대기 중인 요청이 없습니다" />
      ) : (
        <>
          <div className="flex flex-col">
            {items.map((request) => (
              <DeploymentRequestRow
                key={request.requestSeq}
                request={request}
                siteSeq={siteSeq as number}
              />
            ))}
          </div>
          <AppPagination
            pageIndex={toPageIndex(pageNumber)}
            pageSize={pageSize}
            total={list.data?.totalCount ?? items.length}
            pageSizeOptions={[10, 20, 50]}
            onPageChange={(pageIndex) => {
              const next = toPageNumber(pageIndex)
              setParams({ requestPage: next > 1 ? String(next) : undefined })
            }}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setParams({ requestPage: undefined })
            }}
          />
        </>
      )}
    </section>
  )
}

export default DeploymentRequestList
