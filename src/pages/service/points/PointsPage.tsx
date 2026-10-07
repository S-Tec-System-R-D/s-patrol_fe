import { useState } from 'react'
import { MapPinIcon, TriangleAlertIcon } from 'lucide-react'

import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import CourseTabs from '@/features/zone/components/CourseTabs'
import PointDetail from '@/features/points/components/detail/PointDetail'
import PointList from '@/features/points/components/PointList'
import PointTopNav from '@/features/points/components/PointTopNav'
import { usePointDetail } from '@/features/points/hooks/usePointDetail'
import { usePointList } from '@/features/points/hooks/usePointList'
import { getSiteSeq } from '@/lib/auth/site'

/**
 * 코스/지점 — 순찰지점 화면 (`spec 022`).
 *
 * 🔴 **마스터-디테일 구조가 022에서 바뀌었다.** 이전에는 mock 목록 객체를 그대로 상세
 * 패널에 넘겼는데, 서버는 목록(`PointRow`)과 상세(`PointDetail`)의 필드가 달라 그럴 수
 * 없다(이름부터 `pointName` ↔ `name`). 이제 **선택 상태는 `pointSeq` 만** 들고 상세는
 * `DetailPoint` 로 따로 조회한다(§3 규칙 4).
 *
 * 첫 행 자동 선택(`patterns.md` §1)은 **파생**으로 처리한다 — effect 로 `setState` 하면
 * "로딩 완료 → setState → 재렌더" 한 박자가 생기고, 그 사이 우측이 빈 상태로 깜빡인다.
 *
 * ⚠️ 검색·필터·페이지 이동은 Phase 6(T271~T275)에서 URL 에 연결한다. 지금은 1페이지
 * 기본 조회만 한다.
 */
const PointsPage = () => {
  // 🔴 `siteSeq` 는 URL 이 아니라 선택 결과(localStorage)에서 온다 — spec 021 DoD #13.
  const siteSeq = getSiteSeq()

  const list = usePointList(siteSeq, {})
  const items = list.data?.items ?? []

  const [selectedSeq, setSelectedSeq] = useState<number | null>(null)
  // 선택이 없거나 선택한 지점이 목록에서 사라졌으면 첫 행으로 떨어진다.
  const activeSeq =
    items.find((point) => point.pointSeq === selectedSeq)?.pointSeq ?? items[0]?.pointSeq ?? null

  const detail = usePointDetail(activeSeq)

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="코스/지점" subtitle="순찰 코스와 지점을 구성하고 관리합니다" />

      <CourseTabs />

      <div className="flex items-start gap-6">
        {/* 지점목록 영역 */}
        <div className="flex flex-col w-[340px] shrink-0 gap-3">
          <PointTopNav />
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <PointList
              items={items}
              selectedSeq={activeSeq}
              onSelectPoint={setSelectedSeq}
              isLoading={list.isPending && siteSeq !== null}
              isError={list.isError}
              errorMessage={list.error?.message}
              onRetry={() => void list.refetch()}
            />
          </div>
        </div>
        {/* 선택한 지점정보 카드 */}
        <div className="flex-1 min-w-0 rounded-lg border border-border bg-card overflow-hidden">
          {detail.isError ? (
            /* 🔴 상세가 실패해도 목록은 유지한다 — 목록까지 지우면 다른 지점으로 갈 수단이 없다 */
            <AppEmpty
              icon={TriangleAlertIcon}
              title="지점 정보를 불러오지 못했습니다"
              description={detail.error?.message}
            />
          ) : detail.data ? (
            <PointDetail point={detail.data} onDeleted={() => setSelectedSeq(null)} />
          ) : (
            <AppEmpty
              icon={MapPinIcon}
              title="지점을 생성해주세요"
              description="지점을 생성하여 목록에서 클릭하면 상세정보가 표시됩니다"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default PointsPage
