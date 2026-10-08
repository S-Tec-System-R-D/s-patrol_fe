import type { ColumnDef } from '@tanstack/react-table'
import { format, isValid, parseISO } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'

import { resolveAuthMethodLabel, toAuthMethodLabel } from '../lib/authMethod'
import type { PointRow } from '../types'

/**
 * 순찰지점 목록 테이블 컬럼 (`spec 027` Phase 1).
 *
 * 027 전까지 목록은 좌측 340px 의 `PointListCard` 였다. 전체 폭 테이블이 되면서
 * **폭 제약이 사라져** 022 에서 못 넣은 것들이 들어온다 — 설명·TAG ID·소속 코스·
 * 최근 순찰, 그리고 **사용여부 뱃지**.
 *
 * 🔴 **022 에서 고정한 계약 3개를 여기서도 지킨다.** `PointListCard` 와 함께 사라지는
 * 것이 아니라 **이 파일로 옮겨온 것**이다(`tasks.md` 제약 2):
 * 1. 미사용(`useYn: false`) 지점은 **톤다운**한다 — 서버가 목록에서 제외하지 않으므로
 *    구분은 프론트 책임이다(실측, OQ-022-G)
 * 2. 표시할 라벨이 없으면 **인증수단 뱃지를 숨긴다** — 없는 이름을 만들지 않는다(A1)
 * 3. `authMethodName` 이 비어도 **매핑표로 폴백**한다(B-6 — 서버가 `''`/`'Unknown'`
 *    두 가지로 null 을 표현한다)
 *
 * 🔴 **색·명도만으로 상태를 전달하지 않는다**(`design-system.md` §3). 022 는 340px 라
 * 톤다운 + `sr-only` 로 때웠지만, 전체 폭에서는 **사용여부 뱃지**가 그 역할을 정식으로
 * 한다 → `sr-only` 는 제거했다(중복 낭독 방지, spec 규칙 12).
 */

/** ISO 8601(타임존 없음) → 'yyyy-MM-dd HH:mm'. 값이 없거나 깨졌으면 null */
const formatPatrolDt = (value: string | null): string | null => {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : null
}

/** 미사용 행의 셀 톤다운 — 지점명 외 컬럼에 공통 적용 */
const dim = (useYn: boolean) => (useYn ? '' : 'text-muted-foreground/70')

export const pointColumns = (): ColumnDef<PointRow>[] => [
  {
    accessorKey: 'pointName',
    header: '지점명',
    cell: ({ row }) => (
      <span
        className={`font-semibold ${row.original.useYn ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {row.original.pointName}
      </span>
    ),
  },
  {
    accessorKey: 'memo',
    header: '설명',
    cell: ({ row }) => (
      <span className={`text-muted-foreground ${dim(row.original.useYn)}`}>
        {row.original.memo?.trim() || '-'}
      </span>
    ),
  },
  {
    id: 'authMethod',
    header: '인증수단',
    cell: ({ row }) => {
      const { authMethod, authMethodName, useYn } = row.original
      const label = resolveAuthMethodLabel(authMethod, authMethodName)
      // 표시할 라벨이 없으면 뱃지를 숨긴다 — 없는 인증수단 이름을 만들지 않는다(A1)
      if (!label) return <span className="text-muted-foreground">-</span>

      const method = toAuthMethodLabel(authMethod)
      // 미사용이면 뱃지도 함께 톤다운한다 — 행 안에서 강조가 하나만 튀면 어색하다
      const variant = !useYn
        ? 'muted'
        : method === 'QR'
          ? 'point'
          : method === 'NFC'
            ? 'success'
            : 'muted'

      return <AppBadge variant={variant}>{label}</AppBadge>
    },
  },
  {
    accessorKey: 'nfcTagId',
    header: 'TAG ID',
    cell: ({ row }) => (
      // ⚠️ NFC 인데 `nfcTagId` 가 null 인 실 데이터가 있다(B-13). 서버가 강제하지 않는다.
      <span className={`font-mono text-caption text-muted-foreground ${dim(row.original.useYn)}`}>
        {row.original.nfcTagId || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'usedCount',
    header: '소속 코스',
    cell: ({ row }) => (
      <span className={`tabular-nums text-muted-foreground ${dim(row.original.useYn)}`}>
        {row.original.usedCount}
      </span>
    ),
  },
  {
    accessorKey: 'lastPatrolDt',
    header: '최근 순찰',
    cell: ({ row }) => {
      const formatted = formatPatrolDt(row.original.lastPatrolDt)
      return (
        <span className={`tabular-nums text-muted-foreground ${dim(row.original.useYn)}`}>
          {formatted ?? '기록 없음'}
        </span>
      )
    },
  },
  {
    accessorKey: 'useYn',
    header: '사용여부',
    cell: ({ row }) =>
      row.original.useYn ? (
        <AppBadge variant="success">사용</AppBadge>
      ) : (
        <AppBadge variant="muted">미사용</AppBadge>
      ),
  },
]
