import type { ColumnDef } from '@tanstack/react-table'

import WorkerAvatar from '@/features/workers/components/WorkerAvatar'
import { formatPeriod } from '../lib/deploymentPeriod'
import type { DeploymentRequestRow } from '../types/deployment'
import DeploymentRequestActions from './DeploymentRequestActions'
import SiteRoute from './SiteRoute'

/**
 * 배치 요청 컬럼 (`spec 039` T649e — 카드형 → **표**, 사용자 결정 2026-10-21).
 *
 * 🔴 **구분(배치/복귀) 칸을 지웠다**(T656) — "복귀 요청" 은 없다(사용자 정리 2026-10-21). 대신 근무자가
 * 입력한 **배치 기간**(시작 ~ 종료 · 없으면 `미정`)을 보인다 — 승인할지 판단하는 데 필요하다.
 *
 * 카드 행이 근무자 · 경로 · 사유 · 요청일 · 액션으로 **이미 열 구조**가 됐다(사유 칸을 맞추려고
 * 왼쪽 묶음 폭을 고정했던 것이 그 신호다). 아래 이력 표와 같은 모양 · 같은 경로 표기(`SiteRoute`)다.
 *
 * 처리할 일이라는 점은 **액션 칸**과 KPI(대기 · 주황)가 말한다.
 */

/** `'2026-05-30T10:20:00'` → `'2026-05-30'` */
const formatDate = (value: string): string => value.slice(0, 10)

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다 */
const noSort = (columns: ColumnDef<DeploymentRequestRow>[]): ColumnDef<DeploymentRequestRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const deploymentRequestColumns = (siteSeq: number): ColumnDef<DeploymentRequestRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '근무자',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* 이력 표·근무자 목록과 같은 사람이면 같은 색 — 해시 키를 `userSeq` 로 맞춘다 */}
          <WorkerAvatar id={String(row.original.userSeq)} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      id: 'route',
      header: '배치 경로',
      cell: ({ row }) => (
        <SiteRoute from={row.original.fromSiteName} to={row.original.toSiteName} />
      ),
    },
    {
      id: 'period',
      header: '배치 기간',
      cell: ({ row }) => (
        <span className="tabular-nums whitespace-nowrap">
          {formatPeriod(row.original.startDt, row.original.endDt)}
        </span>
      ),
    },
    {
      accessorKey: 'reason',
      header: '사유',
      cell: ({ getValue }) => (
        <span className="block max-w-[280px] truncate" title={getValue<string>()}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'requestDt',
      header: '요청일',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">처리</span>,
      cell: ({ row }) => (
        <DeploymentRequestActions
          requestSeq={row.original.requestSeq}
          userName={row.original.userName}
          siteSeq={siteSeq}
        />
      ),
      // 버튼 폭만큼만 — 남는 폭을 나눠 받으면 버튼이 표 가운데로 밀린다
      meta: { className: 'w-px' },
    },
  ])
