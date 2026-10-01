import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDatePicker from '@/components/app/AppDatePicker'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppSelect from '@/components/app/AppSelect'
import AppTable from '@/components/AppTable'
import PatrolHistoryTabs from '@/features/patrol-zones/components/PatrolHistoryTabs'
import PatrolTimeline from '@/features/patrol-zones/components/PatrolTimeline'
import { patrolResultBadge, zoneColumns } from '@/features/patrol-zones/components/ZoneColumn'
import {
  ALL_VALUE,
  courseOptions,
  courseResultOptions,
} from '@/features/patrol-zones/lib/courseHistoryOptions'
import { filterCourseHistory } from '@/features/patrol-zones/lib/filterCourseHistory'
import { useQueryParams } from '@/hooks/useQueryParams'
import { parseDateRangeQuery, toDateRangeQuery } from '@/lib/dateRangeQuery'
import type { PaginationState } from '@tanstack/react-table'
import { format } from 'date-fns'
import { DownloadIcon, FilterIcon, LayersIcon, LayoutListIcon, ListIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

const PATROL_RESULT = {
  COMPLETE: 'COMPLETE',
  INCOMPLETE: 'INCOMPLETE',
  IN_PROGRESS: 'IN_PROGRESS',
} as const

export type PatrolResultType = (typeof PATROL_RESULT)[keyof typeof PATROL_RESULT]

export interface ZonePatrolType {
  name: string
  startedAt: Date
  endedAt: Date
  result: PatrolResultType
  points: PointPatrolType[]
}

export interface PointPatrolType {
  name: string // 지점명
  status: boolean // true 이상없음, false 이상
  completedAt: Date // 지점 완료시간
  note: string // 특이사항
}

type FilterKey = 'from' | 'to' | 'courseId' | 'result'

const PatrolZonesPage = () => {
  const [selectedPatrol, setSelectedPatrol] = useState<ZonePatrolType | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  const [params, setParams] = useQueryParams<FilterKey>()
  const range = useMemo(() => parseDateRangeQuery(params), [params])

  const filtered = useMemo(
    () =>
      filterCourseHistory(zonePatrols, {
        range,
        courseId: params.courseId,
        result: params.result,
      }),
    [range, params.courseId, params.result]
  )

  /**
   * 필터 변경은 히스토리를 쌓지 않는다(`replace`) — 탭 이동 뒤로가기를 보존하기 위해(spec §3).
   * 필터가 바뀌면 현재 페이지가 결과 범위를 벗어날 수 있어 첫 페이지로 돌린다.
   */
  const updateFilter = (next: Partial<Record<FilterKey, string | undefined>>) => {
    setParams(next, { replace: true })
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  /** "전체"는 URL에 남기지 않는다 — 키를 지운다. */
  const selectValue = (value: string) => (value === ALL_VALUE ? undefined : value)

  // 선택된 이력이 필터에서 빠지면 상세 패널도 함께 비운다.
  const activePatrol = selectedPatrol && filtered.includes(selectedPatrol) ? selectedPatrol : null

  const handleRowClick = (data: ZonePatrolType) => {
    setSelectedPatrol(data)
  }

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="순찰이력" subtitle="코스·지점 단위 순찰 수행 이력을 확인합니다" />

      <PatrolHistoryTabs />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AppDatePicker
            value={range}
            onChange={(next) => updateFilter(toDateRangeQuery(next))}
            active={Boolean(range.from)}
            className="w-auto"
          />
          <AppSelect
            aria-label="코스"
            icon={LayoutListIcon}
            options={courseOptions(zonePatrols)}
            value={params.courseId ?? ALL_VALUE}
            onChange={(value) => updateFilter({ courseId: selectValue(value) })}
            active={Boolean(params.courseId)}
            className="w-auto"
          />
          <AppSelect
            aria-label="결과"
            icon={FilterIcon}
            options={courseResultOptions}
            value={params.result ?? ALL_VALUE}
            onChange={(value) => updateFilter({ result: selectValue(value) })}
            active={Boolean(params.result)}
            className="w-auto"
          />
        </div>
        <AppButton variant="sub" className="bg-card">
          <DownloadIcon size={14} />
          내보내기
        </AppButton>
      </div>

      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-4 ">
          {filtered.length > 0 ? (
            <>
              <AppTable
                columns={zoneColumns}
                data={filtered}
                hidePagination
                pagination={pagination}
                onPaginationChange={setPagination}
                onRowClick={handleRowClick}
              />

              <AppPagination
                pageIndex={pagination.pageIndex}
                pageSize={pagination.pageSize}
                total={filtered.length}
                onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
                onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
              />
            </>
          ) : (
            <div className="flex flex-col rounded-lg border border-border bg-card">
              <AppEmpty
                title="조건에 맞는 순찰이력이 없습니다"
                description="기간·코스·결과 필터를 바꾸거나 전체로 되돌려 보세요."
                icon={FilterIcon}
              />
            </div>
          )}
        </div>

        <aside className="w-100 sticky top-6">
          {activePatrol ? (
            <PatrolDetailPanel patrol={activePatrol} />
          ) : (
            <div className="flex h-full flex-col rounded-lg border border-border bg-card p-4">
              <AppEmpty
                title="순찰이력을 선택해주세요"
                description="왼쪽 목록에서 이력을 선택하면 상세내용이 표시됩니다."
                icon={LayersIcon}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

const PatrolDetailPanel = ({ patrol }: { patrol: ZonePatrolType }) => {
  const { variant, label } = patrolResultBadge[patrol.result]
  const endedValue =
    patrol.result === 'IN_PROGRESS' ? '—' : format(patrol.endedAt, 'yyyy-MM-dd HH:mm:ss')
  return (
    <AppDetailCard
      icon={ListIcon}
      title={patrol.name}
      badge={<AppBadge variant={variant}>{label}</AppBadge>}
    >
      <section className="flex flex-col gap-1">
        <h4 className="text-label font-medium uppercase tracking-wide text-muted-foreground">
          순찰 정보
        </h4>
        <div className="flex flex-col divide-y divide-border/60">
          <AppDetailRow label="시작 일시" value={format(patrol.startedAt, 'yyyy-MM-dd HH:mm:ss')} />
          <AppDetailRow label="종료 일시" value={endedValue} />
          <AppDetailRow label="지점 수" value={`${patrol.points.length}개`} />
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <h4 className="text-label font-medium uppercase tracking-wide text-muted-foreground">
          타임라인
        </h4>
        <PatrolTimeline patrol={patrol} />
      </section>
    </AppDetailCard>
  )
}

export default PatrolZonesPage

const zonePatrols: ZonePatrolType[] = [
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 1, 9, 0),
    endedAt: new Date(2026, 4, 1, 9, 30),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 1, 9, 7), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 1, 9, 13), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 1, 9, 20), note: '' },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 1, 9, 28), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 1, 10, 0),
    endedAt: new Date(2026, 4, 1, 10, 45),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 1, 10, 10), note: '' },
      {
        name: 'B동 계단실',
        status: false,
        completedAt: new Date(2026, 4, 1, 10, 25),
        note: '비상구 잠금 해제 상태 확인됨',
      },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 1, 10, 40), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 1, 11, 0),
    endedAt: new Date(2026, 4, 1, 11, 20),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 1, 11, 8), note: '' },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 1, 11, 17), note: '' },
    ],
  },
  {
    name: '공용 구역',
    startedAt: new Date(2026, 4, 1, 13, 0),
    endedAt: new Date(2026, 4, 1, 13, 40),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '옥상 출입구', status: true, completedAt: new Date(2026, 4, 1, 13, 15), note: '' },
      { name: '화재 비상구 A', status: true, completedAt: new Date(2026, 4, 1, 13, 35), note: '' },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 2, 9, 0),
    endedAt: new Date(2026, 4, 2, 9, 35),
    result: PATROL_RESULT.IN_PROGRESS,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 2, 9, 8), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 2, 9, 16), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 2, 9, 25), note: '' },
      {
        name: '지하 주차장',
        status: false,
        completedAt: new Date(2026, 4, 2, 9, 33),
        note: '차량 불법 주차 발견',
      },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 2, 10, 0),
    endedAt: new Date(2026, 4, 2, 10, 50),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 2, 10, 15), note: '' },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 2, 10, 30), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 2, 10, 45), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 2, 11, 30),
    endedAt: new Date(2026, 4, 2, 12, 0),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      {
        name: '외벽 북측',
        status: false,
        completedAt: new Date(2026, 4, 2, 11, 42),
        note: '외벽 균열 발견',
      },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 2, 11, 55), note: '' },
    ],
  },
  {
    name: '외곽 순찰로',
    startedAt: new Date(2026, 4, 2, 14, 0),
    endedAt: new Date(2026, 4, 2, 14, 30),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '외벽 동측', status: true, completedAt: new Date(2026, 4, 2, 14, 10), note: '' },
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 2, 14, 20), note: '' },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 2, 14, 28), note: '' },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 3, 9, 0),
    endedAt: new Date(2026, 4, 3, 9, 25),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 3, 9, 6), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 3, 9, 12), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 3, 9, 18), note: '' },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 3, 9, 23), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 3, 10, 0),
    endedAt: new Date(2026, 4, 3, 10, 40),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 3, 10, 12), note: '' },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 3, 10, 25), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 3, 10, 37), note: '' },
    ],
  },
  {
    name: '공용 구역',
    startedAt: new Date(2026, 4, 3, 11, 0),
    endedAt: new Date(2026, 4, 3, 11, 30),
    result: PATROL_RESULT.IN_PROGRESS,
    points: [
      { name: '옥상 출입구', status: true, completedAt: new Date(2026, 4, 3, 11, 14), note: '' },
      {
        name: '화재 비상구 A',
        status: false,
        completedAt: new Date(2026, 4, 3, 11, 27),
        note: '소화기 위치 이탈 확인',
      },
    ],
  },
  {
    name: '외곽 순찰로',
    startedAt: new Date(2026, 4, 3, 13, 0),
    endedAt: new Date(2026, 4, 3, 13, 45),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '외벽 동측', status: true, completedAt: new Date(2026, 4, 3, 13, 15), note: '' },
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 3, 13, 28), note: '' },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 3, 13, 42), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 4, 9, 30),
    endedAt: new Date(2026, 4, 4, 10, 0),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 4, 9, 43), note: '' },
      {
        name: '외벽 남측',
        status: false,
        completedAt: new Date(2026, 4, 4, 9, 56),
        note: '외부인 접근 흔적 발견',
      },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 4, 10, 30),
    endedAt: new Date(2026, 4, 4, 11, 0),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 4, 10, 38), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 4, 10, 45), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 4, 10, 52), note: '' },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 4, 10, 58), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 4, 13, 0),
    endedAt: new Date(2026, 4, 4, 13, 30),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 4, 13, 10), note: '' },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 4, 13, 20), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 4, 13, 28), note: '' },
    ],
  },
  {
    name: '공용 구역',
    startedAt: new Date(2026, 4, 5, 9, 0),
    endedAt: new Date(2026, 4, 5, 9, 40),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '옥상 출입구', status: true, completedAt: new Date(2026, 4, 5, 9, 18), note: '' },
      { name: '화재 비상구 A', status: true, completedAt: new Date(2026, 4, 5, 9, 36), note: '' },
    ],
  },
  {
    name: '외곽 순찰로',
    startedAt: new Date(2026, 4, 5, 10, 0),
    endedAt: new Date(2026, 4, 5, 10, 50),
    result: PATROL_RESULT.IN_PROGRESS,
    points: [
      { name: '외벽 동측', status: true, completedAt: new Date(2026, 4, 5, 10, 16), note: '' },
      {
        name: '외벽 북측',
        status: false,
        completedAt: new Date(2026, 4, 5, 10, 32),
        note: 'CCTV 화각 이탈 확인 필요',
      },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 5, 10, 46), note: '' },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 5, 11, 0),
    endedAt: new Date(2026, 4, 5, 11, 25),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 5, 11, 6), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 5, 11, 12), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 5, 11, 18), note: '' },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 5, 11, 23), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 6, 9, 0),
    endedAt: new Date(2026, 4, 6, 9, 45),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      {
        name: 'B동 후문',
        status: false,
        completedAt: new Date(2026, 4, 6, 9, 15),
        note: '후문 잠금장치 고장',
      },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 6, 9, 30), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 6, 9, 42), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 6, 10, 30),
    endedAt: new Date(2026, 4, 6, 11, 0),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 6, 10, 43), note: '' },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 6, 10, 56), note: '' },
    ],
  },
  {
    name: '공용 구역',
    startedAt: new Date(2026, 4, 6, 13, 0),
    endedAt: new Date(2026, 4, 6, 13, 20),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '옥상 출입구', status: true, completedAt: new Date(2026, 4, 6, 13, 8), note: '' },
      { name: '화재 비상구 A', status: true, completedAt: new Date(2026, 4, 6, 13, 17), note: '' },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 7, 9, 0),
    endedAt: new Date(2026, 4, 7, 9, 30),
    result: PATROL_RESULT.IN_PROGRESS,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 7, 9, 7), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 7, 9, 14), note: '' },
      {
        name: '엘리베이터홀',
        status: false,
        completedAt: new Date(2026, 4, 7, 9, 22),
        note: '엘리베이터 오작동 발생',
      },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 7, 9, 28), note: '' },
    ],
  },
  {
    name: '외곽 순찰로',
    startedAt: new Date(2026, 4, 7, 10, 0),
    endedAt: new Date(2026, 4, 7, 10, 35),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '외벽 동측', status: true, completedAt: new Date(2026, 4, 7, 10, 11), note: '' },
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 7, 10, 23), note: '' },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 7, 10, 33), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 7, 11, 0),
    endedAt: new Date(2026, 4, 7, 11, 40),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 7, 11, 13), note: '' },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 7, 11, 26), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 7, 11, 38), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 8, 9, 30),
    endedAt: new Date(2026, 4, 8, 10, 0),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      {
        name: '외벽 북측',
        status: false,
        completedAt: new Date(2026, 4, 8, 9, 44),
        note: '낙서 및 훼손 흔적 발견',
      },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 8, 9, 57), note: '' },
    ],
  },
  {
    name: 'A동 순찰구역',
    startedAt: new Date(2026, 4, 8, 10, 0),
    endedAt: new Date(2026, 4, 8, 10, 30),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '정문 입구', status: true, completedAt: new Date(2026, 4, 8, 10, 7), note: '' },
      { name: '로비 1층', status: true, completedAt: new Date(2026, 4, 8, 10, 14), note: '' },
      { name: '엘리베이터홀', status: true, completedAt: new Date(2026, 4, 8, 10, 21), note: '' },
      { name: '지하 주차장', status: true, completedAt: new Date(2026, 4, 8, 10, 28), note: '' },
    ],
  },
  {
    name: '공용 구역',
    startedAt: new Date(2026, 4, 8, 11, 0),
    endedAt: new Date(2026, 4, 8, 11, 45),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: '옥상 출입구', status: true, completedAt: new Date(2026, 4, 8, 11, 20), note: '' },
      { name: '화재 비상구 A', status: true, completedAt: new Date(2026, 4, 8, 11, 42), note: '' },
    ],
  },
  {
    name: '외곽 순찰로',
    startedAt: new Date(2026, 4, 9, 9, 0),
    endedAt: new Date(2026, 4, 9, 9, 50),
    result: PATROL_RESULT.IN_PROGRESS,
    points: [
      { name: '외벽 동측', status: true, completedAt: new Date(2026, 4, 9, 9, 16), note: '' },
      {
        name: '외벽 북측',
        status: false,
        completedAt: new Date(2026, 4, 9, 9, 33),
        note: '외벽 조명 고장 확인',
      },
      { name: '외벽 남측', status: true, completedAt: new Date(2026, 4, 9, 9, 47), note: '' },
    ],
  },
  {
    name: 'B동 순찰구역',
    startedAt: new Date(2026, 4, 9, 10, 30),
    endedAt: new Date(2026, 4, 9, 11, 0),
    result: PATROL_RESULT.COMPLETE,
    points: [
      { name: 'B동 후문', status: true, completedAt: new Date(2026, 4, 9, 10, 40), note: '' },
      { name: 'B동 계단실', status: true, completedAt: new Date(2026, 4, 9, 10, 50), note: '' },
      { name: '비상구', status: true, completedAt: new Date(2026, 4, 9, 10, 58), note: '' },
    ],
  },
  {
    name: 'C동 순찰구역',
    startedAt: new Date(2026, 4, 9, 13, 0),
    endedAt: new Date(2026, 4, 9, 13, 35),
    result: PATROL_RESULT.INCOMPLETE,
    points: [
      { name: '외벽 북측', status: true, completedAt: new Date(2026, 4, 9, 13, 14), note: '' },
      {
        name: '외벽 남측',
        status: false,
        completedAt: new Date(2026, 4, 9, 13, 30),
        note: '배수구 막힘 발견',
      },
    ],
  },
]
