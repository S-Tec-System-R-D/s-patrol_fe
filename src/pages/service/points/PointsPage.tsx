import { useMemo, useState } from 'react'
import type { PaginationState } from '@tanstack/react-table'
import { MapPinIcon, TriangleAlertIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import CourseTabs from '@/features/zone/components/CourseTabs'
import { pointColumns } from '@/features/points/components/PointColumn'
import PointTopNav from '@/features/points/components/PointTopNav'
import { usePointList } from '@/features/points/hooks/usePointList'
import { getSiteSeq } from '@/lib/auth/site'
import { paths } from '@/router/paths'

/**
 * 코스/지점 — 순찰지점 목록 (`spec 027` Phase 1).
 *
 * 🔴 **좌/우 마스터-디테일을 걷어냈다.** 022 까지는 좌측 340px 목록 + 우측 상세 패널이었다.
 * 세 가지가 동시에 걸려 있었다(spec §1):
 * 1. 340px 에 필터 2종 + 페이지 이동이 들어갈 자리가 없다(OQ-022-E 가 이 이유로 멈춰 있었다)
 * 2. 분할화면에서 좌우 2단이 가장 먼저 깨진다(`CLAUDE.md` B4)
 * 3. 선택 상태가 `useState` 라 **새로고침하면 날아가고** 딥링크가 없다
 *
 * 이제 **행 클릭 → `/points/:pointSeq`** 로 이동한다. 선택 상태가 URL 에 있으므로
 * 022 의 "첫 행 자동 선택 파생" 과 "선택이 목록에서 빠지면 비우기" 가 **함께 사라졌다** —
 * 목록은 목록만 그린다.
 *
 * ⚠️ 검색·필터는 Phase 3(T317~T323)에서 연결한다. 지금은 1페이지 기본 조회만 한다.
 * 🔴 **페이지네이션은 로컬 상태**다 — URL 연동은 Phase 3 몫이고, 여기서 URL 을 쓰면
 * 필터와 두 군데에서 같은 쿼리를 만지게 된다.
 */
const PointsPage = () => {
  const navigate = useNavigate()
  // 🔴 `siteSeq` 는 URL 이 아니라 선택 결과(localStorage)에서 온다 — spec 021 DoD #13.
  const siteSeq = getSiteSeq()

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })

  const list = usePointList(siteSeq, {})
  const items = list.data?.items ?? []

  /**
   * 🔴 **컬럼 정의를 메모이즈한다.** `pointColumns()` 를 렌더마다 호출하면 `cell` 함수의
   * 참조가 매번 바뀌고, `flexRender` 가 그것을 **새 컴포넌트 타입**으로 보아 React 가
   * 행 전체를 언마운트→리마운트한다. 화면은 같아 보이지만 DOM 노드가 교체되므로
   * ① 포커스·선택이 날아가고 ② 재조회마다 깜빡인다. (027 Phase 1 에서 테스트가
   * "찾은 노드가 document 에서 분리됨" 으로 이것을 잡아냈다)
   */
  const columns = useMemo(() => pointColumns(), [])

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <PointTopNav />

      {list.isError ? (
        /* 🔴 조회 실패와 0건을 다르게 그린다 — 둘 다 "아무것도 없음" 이면 장애를
           데이터 없음으로 오해해 지점을 새로 만들려 한다(022 승계) */
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="지점 목록을 불러오지 못했습니다"
            description={list.error?.message}
          />
          <div className="flex justify-center pb-6">
            <AppButton variant="sub" onClick={() => void list.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : items.length === 0 && !list.isPending ? (
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={MapPinIcon}
            title="등록된 지점이 없습니다."
            description="우측 상단 + 버튼으로 지점을 추가해주세요."
          />
        </div>
      ) : (
        <>
          <AppTable
            columns={columns}
            data={items}
            hidePagination
            pagination={pagination}
            onPaginationChange={setPagination}
            onRowClick={(point) => navigate(paths.service.pointDetail(point.pointSeq))}
          />

          <AppPagination
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            total={list.data?.totalCount ?? items.length}
            onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
            onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
          />
        </>
      )}
    </div>
  )
}

export default PointsPage
