import AppButton from '@/components/app/AppButton'
import AppFilterButton from '@/components/app/AppFilterButton'
import AppPageHeader from '@/components/app/AppPageHeader'
import AppPagination from '@/components/app/AppPagination'
import AppTable from '@/components/AppTable'
import PatrolHistoryTabs from '@/features/patrol-zones/components/PatrolHistoryTabs'
import PatrolRecordDialog from '@/features/patrol-points/components/PatrolRecordDialog'
import { pointColumns } from '@/features/patrol-points/components/PointColumn'
import type { PaginationState } from '@tanstack/react-table'
import {
  CalendarIcon,
  DownloadIcon,
  FilterIcon,
  LayoutListIcon,
  SmartphoneIcon,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'

export type PointAuthMethodType = 'QR' | 'NFC'

const PATROL_POINT_RESULT = {
  NORMAL: 'NORMAL',
  RECORDED: 'RECORDED',
  TIMEOUT: 'TIMEOUT',
  INCOMPLETE: 'INCOMPLETE',
  EXCLUDED: 'EXCLUDED',
} as const

export type PatrolPointResultType = (typeof PATROL_POINT_RESULT)[keyof typeof PATROL_POINT_RESULT]

export interface PointRecordType {
  recordedAt: Date
  content: string
  photoCount: number
  maxPhotoCount: number
}

export interface PointPatrolType {
  zoneName: string // 순찰코스
  pointName: string // 순찰지점
  patrolAt: Date
  authMethod: PointAuthMethodType
  worker: string
  result: PatrolPointResultType
  records: PointRecordType[]
}

const PatrolPointsPage = () => {
  const [selectedRecord, setSelectedRecord] = useState<PointPatrolType | null>(null)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  })

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="순찰이력" subtitle="코스·지점 단위 순찰 수행 이력을 확인합니다" />

      <PatrolHistoryTabs />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AppFilterButton icon={CalendarIcon} label="기간 선택" />
          <AppFilterButton icon={LayoutListIcon} label="순찰코스" />
          <AppFilterButton icon={SmartphoneIcon} label="인증수단" />
          <AppFilterButton icon={UserIcon} label="순찰자" />
          <AppFilterButton icon={FilterIcon} label="결과" />
        </div>
        <AppButton variant="sub" className="bg-card">
          <DownloadIcon size={14} />
          내보내기
        </AppButton>
      </div>

      <AppTable
        columns={pointColumns(setSelectedRecord)}
        data={pointPatrols}
        hidePagination
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      <AppPagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        total={pointPatrols.length}
        onPageChange={(pageIndex) => setPagination((prev) => ({ ...prev, pageIndex }))}
        onPageSizeChange={(pageSize) => setPagination({ pageIndex: 0, pageSize })}
      />

      <PatrolRecordDialog
        patrol={selectedRecord}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      />
    </div>
  )
}

export default PatrolPointsPage

const pointPatrols: PointPatrolType[] = [
  {
    zoneName: 'A동 순찰코스',
    pointName: '정문 입구',
    patrolAt: new Date(2026, 4, 1, 9, 7),
    authMethod: 'QR',
    worker: '김민준',
    result: PATROL_POINT_RESULT.NORMAL,
    records: [],
  },
  {
    zoneName: 'A동 순찰코스',
    pointName: '로비 1층',
    patrolAt: new Date(2026, 4, 1, 9, 13),
    authMethod: 'QR',
    worker: '김민준',
    result: PATROL_POINT_RESULT.RECORDED,
    records: [
      {
        recordedAt: new Date(2026, 4, 1, 9, 13),
        content: '안내 데스크 인근 바닥에 물기 발견. 미끄럼 주의 표지판 설치함.',
        photoCount: 2,
        maxPhotoCount: 3,
      },
      {
        recordedAt: new Date(2026, 4, 1, 9, 14),
        content: '엘리베이터 앞 소화기 압력 게이지 정상 확인.',
        photoCount: 1,
        maxPhotoCount: 3,
      },
    ],
  },
  {
    zoneName: 'A동 순찰코스',
    pointName: '엘리베이터홀 A',
    patrolAt: new Date(2026, 4, 1, 9, 21),
    authMethod: 'NFC',
    worker: '김민준',
    result: PATROL_POINT_RESULT.NORMAL,
    records: [],
  },
  {
    zoneName: 'A동 순찰코스',
    pointName: '지하 주차장 B1',
    patrolAt: new Date(2026, 4, 1, 9, 28),
    authMethod: 'NFC',
    worker: '김민준',
    result: PATROL_POINT_RESULT.TIMEOUT,
    records: [
      {
        recordedAt: new Date(2026, 4, 1, 9, 28),
        content: '정문 인증 후 예정 시간(15분) 내 지점 도달이 확인되지 않아 시간초과 처리됨.',
        photoCount: 0,
        maxPhotoCount: 3,
      },
    ],
  },
  {
    zoneName: 'B동 순찰코스',
    pointName: 'B동 후문',
    patrolAt: new Date(2026, 4, 1, 10, 12),
    authMethod: 'QR',
    worker: '박지우',
    result: PATROL_POINT_RESULT.NORMAL,
    records: [],
  },
  {
    zoneName: 'B동 순찰코스',
    pointName: 'B동 계단실',
    patrolAt: new Date(2026, 4, 1, 10, 28),
    authMethod: 'NFC',
    worker: '박지우',
    result: PATROL_POINT_RESULT.RECORDED,
    records: [
      {
        recordedAt: new Date(2026, 4, 1, 10, 28),
        content: '계단실 비상조명 1개 소등 상태 확인.',
        photoCount: 1,
        maxPhotoCount: 3,
      },
      {
        recordedAt: new Date(2026, 4, 1, 10, 29),
        content: '3층 계단참 적재물 발견, 안전관리팀 통보함.',
        photoCount: 3,
        maxPhotoCount: 3,
      },
      {
        recordedAt: new Date(2026, 4, 1, 10, 30),
        content: '계단실 소화전 함 파손 확인.',
        photoCount: 2,
        maxPhotoCount: 3,
      },
    ],
  },
  {
    zoneName: 'B동 순찰코스',
    pointName: '비상구 A',
    patrolAt: new Date(2026, 4, 1, 9, 7),
    authMethod: 'QR',
    worker: '박지우',
    result: PATROL_POINT_RESULT.INCOMPLETE,
    records: [],
  },
  {
    zoneName: '공용 코스',
    pointName: '지하 주차장 B2',
    patrolAt: new Date(2026, 3, 30, 22, 11),
    authMethod: 'NFC',
    worker: '강도현',
    result: PATROL_POINT_RESULT.EXCLUDED,
    records: [],
  },
  {
    zoneName: '공용 코스',
    pointName: '외벽 남측',
    patrolAt: new Date(2026, 3, 30, 22, 22),
    authMethod: 'QR',
    worker: '강도현',
    result: PATROL_POINT_RESULT.NORMAL,
    records: [],
  },
  {
    zoneName: 'B동 순찰코스',
    pointName: '비상구 A',
    patrolAt: new Date(2026, 3, 30, 18, 37),
    authMethod: 'QR',
    worker: '박지우',
    result: PATROL_POINT_RESULT.NORMAL,
    records: [],
  },
]
