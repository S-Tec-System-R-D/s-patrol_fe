import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { workLabel } from '../lib/userFormat'
import { roleBadgeVariant } from '../lib/userRole'
import type { UserRow } from '../types/user'
import WorkerAvatar from './WorkerAvatar'

/**
 * 근무자 목록 컬럼 (`spec 038` T607).
 *
 * 🔴 **mock 컬럼에서 서버 컬럼으로 바꿨다.** 빠진 것 — 서버에 근거가 없다(CLAUDE.md B4):
 * - **연락처** — 목록 응답에 없다(상세에만 `phone`). 붙이면 행마다 상세 조회(N+1)
 * - **사용자 상태(활성/비활성)** — 필드가 없다
 * - **"배치중" 뱃지** — mock 의 `isAssignedElsewhere` 는 서버에 없다. 대신 `originSiteSeq` 가
 *   **배치 온 사람의 소속지**임이 실측됐다(OQ-038-B) → 원소속 컬럼에 소속지 이름을 보인다
 *
 * 생긴 것 — **사번**(`loginId`) · **권한**(`codeName`): 목록에 관리자도 섞여 온다(사용자 결정 2026-10-21).
 */

/** `'2025-09-12T09:00:00'` → `'2025-09-12'` */
const formatDate = (value: string): string => value.slice(0, 10)

/** 🔴 정렬을 전부 끈다 — 서버 페이징이라 클릭하면 현재 페이지만 섞인다(026·037 과 같은 판단) */
const noSort = (columns: ColumnDef<UserRow>[]): ColumnDef<UserRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const workerColumns = (): ColumnDef<UserRow>[] =>
  noSort([
    {
      accessorKey: 'userName',
      header: '이름',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* ⚠️ `WorkerAvatar` 는 색 해시용 `id` 를 문자열로 받는다 — 컴포넌트는 고치지 않는다 */}
          <WorkerAvatar id={String(row.original.userSeq)} name={row.original.userName} />
          <span className="font-medium">{row.original.userName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'loginId',
      header: '사번',
      cell: ({ getValue }) => <span className="tabular-nums">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'codeName',
      header: '권한',
      cell: ({ row }) => (
        <AppBadge variant={roleBadgeVariant(row.original.codeSeq)}>{row.original.codeName}</AppBadge>
      ),
    },
    {
      accessorKey: 'workYn',
      header: '근무 상태',
      cell: ({ getValue }) => {
        const workYn = getValue<boolean>()
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                workYn ? 'bg-success' : 'bg-muted-foreground'
              }`}
            />
            <span>{workLabel(workYn)}</span>
          </div>
        )
      },
    },
    {
      id: 'origin',
      header: '원소속',
      /**
       * **Seq 가 있을 때만** 이름을 보인다 — Seq 가 있으면 **다른 사업장 소속으로 배치 온 사람**이고
       * 그 이름이 소속지다(실측 2026-10-21). Seq 가 `null` 인 행은 이름이 현재 사업장명이라 매 행 반복될 뿐이다
       */
      cell: ({ row }) => {
        const { originSiteSeq, originSiteName } = row.original
        return originSiteSeq !== null && originSiteName ? (
          <span>{originSiteName}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: 'createDt',
      header: '등록일',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'open',
      header: '',
      // 링크가 아니라 꺾쇠만 — 이동은 행 클릭이 한다(026·036·037 승계)
      cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
    },
  ])
