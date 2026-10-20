import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon, MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryRow } from '@/features/course-history/types'

/**
 * 지점 순찰이력 목록 컬럼 (`spec 037` T541).
 *
 * 🔴 **mock 8컬럼에서 서버 8컬럼으로 바꿨다**(목업 `03`). 숫자는 같지만 내용이 다르다 —
 * 이전 판은 `PointPatrolType`(`Date` 필드 + 로컬 결과 enum 5종)을 받았고 서버 응답과
 * **이름·타입·개수가 전부 달랐다.**
 *
 * 🔴 **뱃지 매핑을 여기서 만들지 않는다.** 이전 판은 `patrolPointResultBadge` ·
 * `pointAuthMethodBadge` **맵 2개를 이 파일에서 export** 했고 카드가 그것을 import 했다 —
 * 036 이 해소한 **enum 3중 분기**가 바로 이런 모양이었다. 지금은 `historyBadge.ts` 가
 * 단일 출처다.
 *
 * 🔴 **빼기로 한 것**(목업에 있으나 서버에 근거가 없다):
 * - **층·위치 서브텍스트**(`1F · 정문 출입구`) — 목록 응답에 **없다**
 * - **코스별 dot 색상** — 서버에 색이 없고 프론트가 만들 근거도 없다(036 과 같은 판단)
 * - **정렬 화살표** — 서버에 정렬 파라미터가 **없다**(아래 `noSort`)
 * - **기록 "N건"** — 목록은 `hasMemo: boolean` 뿐이다. 건수를 붙이면 **행마다 상세
 *   조회(N+1)** 다 → **아이콘**으로 바꿨다(036 이 코스 목록에서 한 것과 같다)
 * - **기록 칸의 사유 문구**(`사유 미등록`·`공사 구간`) — 🔴 **그런 필드가 없다.** 메모는
 *   앱에서 고른 키워드 조합 + 자유 입력이고 "왜 미인증인지" 가 아니다
 */

/** `'2026-05-01T09:07:00'` → `'2026-05-01'` */
const formatDate = (value: string): string => value.slice(0, 10)
/** `'2026-05-01T09:07:00'` → `'09:07'` */
const formatTime = (value: string): string => value.slice(11, 16)

/**
 * 🔴🔴 **정렬을 전부 끈다.** `AppTable` 이 `getSortedRowModel` 을 전역으로 켜 두고
 * TanStack 은 `accessorKey` 가 있는 컬럼을 **기본 정렬 가능**으로 본다 — 아무것도 안 하면
 * 헤더에 화살표가 뜨고 클릭이 먹는다.
 *
 * 🔴 이 목록은 **서버 페이징**이다. 클릭하면 **현재 페이지의 N행만** 섞이는데 화면은
 * "정렬했다" 고 보인다 — 2페이지의 더 이른 시각이 1페이지로 올라오지 않으므로 사용자는
 * **틀린 순서를 맞는 것으로 읽는다**(036 과 같은 판단).
 */
const noSort = (columns: ColumnDef<PointHistoryRow>[]): ColumnDef<PointHistoryRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const pointHistoryColumns = (): ColumnDef<PointHistoryRow>[] =>
  noSort([
    {
      accessorKey: 'checkDt',
      header: '순찰일시',
      /**
       * 🔴 **미완료 행에도 시각을 보여준다**(사용자 결정 2026-10-19, OQ-15 해소).
       * `checkDt` 는 **지점 인증 시간**이고, 애초에 이 응답은 `checkDt` 가 있는 행만 준다 —
       * 비워 두면 "시각을 모르는 기록" 처럼 보인다.
       */
      cell: ({ getValue }) => {
        const value = getValue<string>()
        return (
          <div className="flex flex-col">
            <span className="tabular-nums">{formatDate(value)}</span>
            <span className="tabular-nums text-caption text-muted-foreground">
              {formatTime(value)}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'pointName',
      header: '순찰지점',
      cell: ({ getValue }) => <span className="font-medium">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'courseName',
      header: '순찰코스',
      cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span>,
    },
    {
      accessorKey: 'authMethodName',
      header: '인증수단',
      /**
       * 🔴 **미완료 행은 빈 칸이다** — `authMethod` 가 `null` 이고 `authMethodName` 이
       * `''` 다(실측). "인증수단을 모른다" 가 아니라 **인증이 없었다**는 뜻이므로 뱃지를
       * 그리지 않는다.
       */
      cell: ({ row }) => {
        const { authMethod, authMethodName } = row.original
        if (authMethod === null || authMethodName === '') {
          return <span className="text-muted-foreground">-</span>
        }
        return <AppBadge variant="point">{authMethodName}</AppBadge>
      },
    },
    {
      accessorKey: 'userName',
      header: '순찰자',
      /** ⚠️ 완료인데 순찰자가 `null` 인 행이 3건 실재한다(OQ-16) — 터지지 않게 둔다 */
      cell: ({ getValue }) => {
        const value = getValue<string | null>()
        return value ? <span>{value}</span> : <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: 'pauseTime',
      header: '구간',
      /**
       * ⚠️ **`pauseTime` 이 무엇을 센 시간인지 확정되지 않았다**(OQ-037-A). 목업의
       * "구간 +7분" 자리이지만 문서에 정의가 없다.
       * 🔴 그래서 **값만 보여주고 판정하지 않는다** — "상한 +6분" 같은 비교 문구를 붙이면
       * 기준을 모르는 채로 관리자에게 판단을 주게 된다(023·036 의 "색을 입히지 않는다" 와
       * 같은 자리). ⚠️ 상세는 같은 필드가 **숫자**다(B-5).
       */
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">
          {formatElapsed(getValue<string>())}
        </span>
      ),
    },
    {
      id: 'result',
      header: '결과',
      cell: ({ row }) => {
        const { status, checkDt, hasMemo, overTimeYn } = row.original
        const result = pointCheckBadge(status, checkDt, hasMemo)
        // 🔴 **뱃지 2개 병기** — `overTimeYn` 은 `status` 와 독립 축이라 하나로 접으면
        //    우선순위를 정해야 하고 어느 쪽이든 정보가 사라진다(036 결정)
        const overtime = overtimeBadge(overTimeYn)
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
      header: '기록',
      // 🔴 **건수가 아니라 아이콘** — 목록에 건수가 없다(§위 머리말). 내용은 상세에서 본다
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <MessageSquareTextIcon
            size={16}
            className="text-warning-foreground"
            aria-label="순찰 기록 있음"
          />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      id: 'open',
      header: '',
      // 🔴 링크가 아니라 **꺾쇠만** — 이동은 행 클릭이 한다(목업의 "열기" 링크를 대체)
      cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
    },
  ])
