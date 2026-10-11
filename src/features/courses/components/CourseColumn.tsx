import type { ColumnDef } from '@tanstack/react-table'
import { format, isValid, parseISO } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'

import type { CourseRow } from '../types'

/**
 * 순찰코스 목록 테이블 컬럼 (`spec 023` Phase 2).
 *
 * 🔴 **`pointColumns` 와 같은 관심사를 같은 방식으로 지킨다**(027 승계):
 * 1. 미사용(`useYn: false`) 코스는 **행 전체 톤다운 + 사용여부 뱃지** — 서버가 목록에서
 *    제외하지 않으므로 구분은 프론트 책임이다
 * 2. 색·명도만으로 상태를 전달하지 않는다(`design-system.md` §3) — 뱃지가 글자를 준다
 *
 * 🔴 **설명(`memo`)은 컬럼에 없다. 서버가 목록에 주지 않는다**(실측 — 상세 전용). 지점은
 * "폭만 먹으니 빼자" 는 **결정**이었지만 코스는 **선택지가 없다.** 같은 결과라도 이유가
 * 달라, 나중에 "코스도 설명을 보여 주자" 가 나오면 **백엔드 요청**이 필요하다.
 *
 * ⚠️ **`courseStatusName` 을 그대로 쓴다.** 코드 사전이 불완전하다 — 테스트 DB 에 `0`
 * 만 있고 1·2·3 으로 필터하면 0건이다(OQ-3). 모르는 코드에 우리가 이름을 붙이면
 * 틀린 이름이 화면에 남는다(A1).
 */

/** ISO 8601(타임존 없음) → 'yyyy-MM-dd HH:mm'. 값이 없거나 깨졌으면 null */
const formatPatrolDt = (value: string | null | undefined): string | null => {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : null
}

/** 미사용 행의 셀 톤다운 — 코스명 외 컬럼에 공통 적용 */
const dim = (useYn: boolean) => (useYn ? '' : 'text-muted-foreground/70')

export const courseColumns = (): ColumnDef<CourseRow>[] => [
  {
    accessorKey: 'courseName',
    header: '코스명',
    cell: ({ row }) => (
      <span
        className={`font-semibold ${row.original.useYn ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {row.original.courseName}
      </span>
    ),
  },
  {
    id: 'courseStatus',
    header: '상태',
    cell: ({ row }) => {
      const { courseStatusName, useYn } = row.original
      // 서버가 이름을 비워 보내면 뱃지를 숨긴다 — 없는 상태 이름을 만들지 않는다(A1)
      if (!courseStatusName.trim()) return <span className="text-muted-foreground">-</span>
      return (
        <AppBadge variant={useYn ? 'point' : 'muted'}>{courseStatusName}</AppBadge>
      )
    },
  },
  {
    accessorKey: 'pointCount',
    header: '지점 수',
    cell: ({ row }) => (
      <span className={`tabular-nums text-muted-foreground ${dim(row.original.useYn)}`}>
        {/* 🔴 0개도 그대로 보여준다 — 자동 조치·경고를 하지 않는다(spec 규칙 12).
            의도적으로 비워 둔 코스가 있을 수 있고, "비어 있다 → 잘못됐다" 는 우리 추측이다 */}
        {row.original.pointCount}
      </span>
    ),
  },
  {
    accessorKey: 'totalMin',
    header: '총 소요시간',
    cell: ({ row }) => (
      <span className={`tabular-nums text-muted-foreground ${dim(row.original.useYn)}`}>
        {row.original.totalMin}분
      </span>
    ),
  },
  {
    accessorKey: 'switchYn',
    header: '교대',
    cell: ({ row }) =>
      row.original.switchYn ? (
        <AppBadge variant={row.original.useYn ? 'success' : 'muted'}>허용</AppBadge>
      ) : (
        // 🔴 "허용 안 함" 에 뱃지를 쓰지 않는다 — 뱃지가 두 상태 모두에 붙으면 훑을 때
        // 구분이 안 된다. 켜진 것만 표시가 생기는 쪽이 읽기 쉽다
        <span className={`text-muted-foreground ${dim(row.original.useYn)}`}>-</span>
      ),
  },
  {
    id: 'history',
    header: '최근 순찰',
    cell: ({ row }) => {
      // 🔴 이력이 없으면 `history` 자체가 null 이다 — 빈 객체가 아니다
      const formatted = formatPatrolDt(row.original.history?.historyEndDt)
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
