import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon, MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 순찰이력 목록 컬럼 (`spec 036` T503).
 *
 * 🔴 **mock 4컬럼에서 서버 8컬럼으로 바꿨다**(목업 `01`). 이전 판은 `ZonePatrolType`
 * (`Date` 필드)을 받았고 서버 응답과 **이름·타입·개수가 전부 달랐다.**
 *
 * 🔴 **빼기로 한 것**(사용자 결정 2026-10-16):
 * - **코스별 dot 색상** — 서버에 색이 없고 프론트가 만들 근거도 없다
 * - **사업장·지점수 서브텍스트** — 응답에 없다
 * - **정렬 화살표** — 🔴 서버에 정렬 파라미터가 **없다.** 서버 페이징 중 클라이언트
 *   정렬은 **현재 페이지만 섞어** 거짓이 된다(목업에는 화살표가 그려져 있다)
 */

/** 순찰자 표시. 🔴 **빈 배열이 실측 19/54(35%)** 다 — 폴백이 필수다 */
const runnerLabel = (userList: CourseHistoryRow['userList']): string => {
  if (userList.length === 0) return '순찰자 미지정'
  const [first, ...rest] = userList
  // 🔴 교대로 **2명 이상**이 온다(실측 6건) — 첫 사람만 그리면 교대를 숨긴다
  return rest.length === 0 ? first.userName : `${first.userName} 외 ${rest.length}명`
}

/** `'2026-05-01T09:00:00'` → `'2026-05-01 09:00'`. 초는 목록에서 버린다(비교에 쓰이지 않는다) */
const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16)

/**
 * 🔴🔴 **정렬을 전부 끈다.** `AppTable` 이 `getSortedRowModel` 을 **전역으로 켜 두고**
 * TanStack 은 `accessorKey` 가 있는 컬럼의 `getCanSort()` 를 **기본 true** 로 본다 —
 * 그래서 아무것도 안 하면 헤더에 화살표가 뜨고 **클릭이 먹는다.**
 *
 * 🔴 그게 왜 위험한가: 이 목록은 **서버 페이징**이다. 클릭하면 **현재 페이지의 N행만**
 * 섞이는데 화면은 "정렬했다" 고 보인다 — 2페이지의 더 이른 시각이 1페이지 맨 위로
 * 올라오지 않으므로 **사용자는 틀린 순서를 맞는 것으로 읽는다.** 서버에 정렬 파라미터가
 * 없으므로(`api-spec.md` §5-1) 정렬은 **제공하지 않는 것이 맞다**(사용자 결정 2026-10-16).
 *
 * 🔴 **map 으로 일괄 적용한다** — 컬럼마다 적으면 새 컬럼을 추가할 때 빠뜨린다.
 * ⚠️ 서버가 정렬을 주게 되면 **여기가 아니라 쿼리 파라미터로** 붙인다.
 */
const noSort = (columns: ColumnDef<CourseHistoryRow>[]): ColumnDef<CourseHistoryRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const zoneHistoryColumns = (): ColumnDef<CourseHistoryRow>[] =>
  noSort([
  {
    accessorKey: 'courseName',
    header: '코스명',
    cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
  },
  {
    id: 'runner',
    header: '순찰자',
    cell: ({ row }) => {
      const label = runnerLabel(row.original.userList)
      const missing = row.original.userList.length === 0
      return (
        <span className={missing ? 'text-muted-foreground' : 'text-foreground'}>{label}</span>
      )
    },
  },
  {
    accessorKey: 'startDt',
    header: '시작 일시',
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatDateTime(getValue<string>())}
      </span>
    ),
  },
  {
    accessorKey: 'endDt',
    header: '종료 일시',
    cell: ({ getValue }) => {
      const value = getValue<string | null>()
      // 🔴 진행 중이면 `—` 가 아니라 **"진행 중"** — `—` 는 값 누락으로 읽힌다(030 선례)
      if (value === null) return <span className="text-muted-foreground">진행 중</span>
      return (
        <span className="tabular-nums text-muted-foreground">{formatDateTime(value)}</span>
      )
    },
  },
  {
    accessorKey: 'actualElapsedTime',
    header: '소요',
    // 🔴 `'02:17:40'` 처럼 **시 단위가 온다** — 분으로 가정하면 2시간이 2분이 된다
    cell: ({ getValue }) => (
      <span className="tabular-nums text-muted-foreground">
        {formatElapsed(getValue<string>())}
      </span>
    ),
  },
  {
    id: 'checked',
    header: '지점 인증',
    cell: ({ row }) => {
      const { checkedCount, pointCount } = row.original
      const ratio = pointCount === 0 ? 0 : Math.min(checkedCount / pointCount, 1)
      return (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
            {/* 🔴 **색을 입히지 않는다**(023 승계) — 지점 상태에 `순찰제외` 가 있어
                분모를 확신할 수 없다. 100% 미달을 경고로 바꾸면 관리자가 **없는 문제**를
                찾는다. 막대는 비율만 보여 주고 판정하지 않는다 */}
            <div className="h-full rounded-full bg-foreground/40" style={{ width: `${ratio * 100}%` }} />
          </div>
          <span className="tabular-nums text-caption text-muted-foreground">
            {checkedCount}/{pointCount}
          </span>
        </div>
      )
    },
  },
  {
    id: 'result',
    header: '순찰 결과',
    cell: ({ row }) => {
      const result = courseResultBadge(row.original.status)
      // 🔴 **뱃지 2개 병기**(사용자 결정 2026-10-16) — `overtimeYn` 은 `status` 와 독립
      //    축이라 하나로 접으면 우선순위를 정해야 하고 어느 쪽이든 정보가 사라진다
      const overtime = overtimeBadge(row.original.overtimeYn)
      return (
        <div className="flex flex-wrap items-center gap-1">
          <AppBadge variant={result.variant}>{result.label}</AppBadge>
          {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
        </div>
      )
    },
  },
  {
    accessorKey: 'hasMemo',
    header: '특이사항',
    // 🔴 **건수가 아니라 아이콘**(사용자 결정) — 서버는 `hasMemo` boolean 뿐이고 건수는
    //    이력마다 `CheckDetails` 를 열어야 한다(15행이면 15요청)
    cell: ({ getValue }) =>
      getValue<boolean>() ? (
        <MessageSquareTextIcon
          size={16}
          className="text-warning-foreground"
          aria-label="특이사항 있음"
        />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: 'open',
    header: '',
    // 🔴 링크가 아니라 **꺾쇠만** 둔다 — 이동은 행 클릭이 한다(링크가 둘이 되면
    //    같은 행에서 두 군데를 눌러야 하는 것처럼 보인다)
    cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
  },
  ])
