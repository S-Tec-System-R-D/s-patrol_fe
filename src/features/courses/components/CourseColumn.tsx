import type { ColumnDef } from '@tanstack/react-table'
import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'

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
 * 🔴 **상태 컬럼을 두지 않는다**(사용자 결정 2026-10-12). 실시간 진행 상황은 **별도
 * 페이지**로 만들기로 했고, 목록에서 "지금 어떤 상태인가" 를 읽을 이유가 사라졌다.
 * 덕분에 `courseStatusCode` 의 **코드 사전을 모른다는 문제(OQ-3·OQ-023-B)가 함께
 * 종결된다** — 1·2·3 으로 필터하면 0건이 오던 그 값이다. 응답 타입(`CourseRow`)에는
 * 실측대로 남겨 둔다(`CLAUDE.md` B4 — 안 쓰는 필드도 선언한다).
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
    // 🔴 **양쪽 다 뱃지다**(사용자 결정 2026-10-12). 처음에는 "켜진 것만 표시" 로 두었는데
    // (`-`), 같은 열에 뱃지와 하이픈이 섞여 **빈 칸처럼 읽혔다.** 구분은 variant 가 준다 —
    // 허용은 `success`, 허용 안 함은 `muted` 로 톤이 눌린다
    cell: ({ row }) =>
      row.original.switchYn ? (
        <AppBadge variant={row.original.useYn ? 'success' : 'muted'}>허용</AppBadge>
      ) : (
        <AppBadge variant="muted">허용 안 함</AppBadge>
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
  {
    id: 'open',
    header: '',
    // 링크가 아니라 꺾쇠만 — 이동은 행 클릭이 한다(꺾쇠 = 상세 페이지 이동, 046 T879)
    cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
  },
]
