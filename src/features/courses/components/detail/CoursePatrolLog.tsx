import { format, isValid, parseISO } from 'date-fns'
import { ArrowLeftRightIcon, ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import type { CourseHistoryRow } from '@/features/course-history/types'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'


/**
 * 최근 순찰 기록 (`spec 023` B단 → **`spec 074` T1237 개편**, 시안 `개선 · 코스 상세`).
 *
 * 🔴 **앞 10건만 · 나머지는 순찰이력 화면**(`전체 기록 N건 보기` → 코스 필터). KPI · 오른쪽 카드는 받은 회차
 * 전부(최대 100건)로 센다 — 표만 줄인다.
 * 🔴 **행을 누르면 회차 상세 모달**(`CourseRunDialog`) — 페이지가 모달을 들고 있다(`onSelect`).
 * 🔴 **인증은 막대 + `n/m`** — 상태와 따로 적는다(`완료` 인데 `0/3` 인 행이 실존한다, 023 실측).
 * 🔄 `spec 079` D11 — 상태는 `진행중` / `완료`(공통 `courseResultBadge`) + `시간초과`(공통 `overtimeBadge`, 빨강)만.
 *    `누락` 칸은 지웠다 — 지점별 미인증은 모달에서 본다(지점 상태가 회차 행을 침범하지 않는다).
 * 🔴 `userList` 빈 배열 · `actualElapsedTime` 시 단위(023 실측)는 그대로 받는다.
 */

const LOG_PREVIEW = 10

interface CoursePatrolLogProps {
  courseSeq: number
  rows: CourseHistoryRow[]
  /** 서버 전체 건수 */
  totalCount: number
  isPending?: boolean
  onSelect: (row: CourseHistoryRow) => void
}

const formatStartDt = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

/** 상태 — 공통 규칙(진행중 / 완료 / 미완료, D13) + 시간초과 + 교대(처리한 사람이 둘 이상). 라벨은 `statusName` 이 아니라 공통 함수 */
const StatusBadges = ({ row }: { row: CourseHistoryRow }) => {
  const result = courseResultBadge(row.status)
  const overtime = overtimeBadge(row.overtimeYn)
  return (
    <span className="flex items-center gap-1">
      <AppBadge variant={result.variant}>{result.label}</AppBadge>
      {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
      {row.userList.length > 1 && (
        <span className="inline-flex items-center gap-1 text-caption font-medium text-point-foreground">
          <ArrowLeftRightIcon size={12} aria-hidden />
          교대
        </span>
      )}
    </span>
  )
}

const CoursePatrolLog = ({ courseSeq, rows, totalCount, isPending, onSelect }: CoursePatrolLogProps) => {
  const preview = rows.slice(0, LOG_PREVIEW)

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-panel-title font-semibold">최근 순찰 기록</h2>
        {/* 🔄 `spec 084`(목업 대조 2026-11-20): 제목 옆은 건수만 · 링크는 늘 보인다(전에는 10건이 넘을 때만 표 아래에 있었다) */}
        <span className="text-caption text-muted-foreground tabular-nums">{totalCount}</span>
        <Link
          to={`${paths.service.patrolZones}?course=${courseSeq}`}
          className="ml-auto inline-flex items-center gap-0.5 text-caption font-medium text-point hover:underline"
        >
          순찰이력 전체
          <ChevronRightIcon size={13} aria-hidden />
        </Link>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-2">
          {/* 🔴 조회 중을 빈 상태로 보여주지 않는다(027 T324) */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">순찰 기록이 없습니다</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-caption whitespace-nowrap text-muted-foreground">
                  <th className="h-9 pr-3 text-left font-medium">시작</th>
                  <th className="h-9 pr-3 text-left font-medium">근무자</th>
                  <th className="h-9 pr-3 text-left font-medium">인증</th>
                  <th className="h-9 pr-3 text-left font-medium">소요</th>
                  <th className="h-9 text-left font-medium">상태</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row) => {
                  const startLabel = formatStartDt(row.startDt)
                  return (
                    <tr
                      key={row.historySeq}
                      tabIndex={0}
                      aria-label={`${startLabel} 회차 상세`}
                      onClick={() => onSelect(row)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onSelect(row)
                        }
                      }}
                      className="h-[46px] cursor-pointer border-b text-sub-foreground last:border-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                    >
                      <td className="pr-3 font-medium whitespace-nowrap text-foreground tabular-nums">{startLabel}</td>
                      <td className="max-w-[280px] truncate pr-3">
                        {row.userList.length === 0 ? (
                          <span className="text-muted-foreground">근무자 없음</span>
                        ) : (
                          row.userList.map((user) => user.userName).join(', ')
                        )}
                      </td>
                      <td className="pr-3 whitespace-nowrap">
                        <span className="tabular-nums">
                          {`${row.checkedCount} / ${row.pointCount}`}
                        </span>
                      </td>
                      <td className={cn('pr-3 whitespace-nowrap tabular-nums', row.overtimeYn && 'text-danger')}>
                        {formatElapsed(row.actualElapsedTime)}
                      </td>
                      <td className="whitespace-nowrap">
                        <StatusBadges row={row} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 🔴 한 번에 다 못 받았으면 KPI · 오른쪽 카드가 **몇 건 기준**인지 밝힌다(서버 집계 없음 · 023 규칙) */}
          {totalCount > rows.length && (
            <p className="text-caption text-muted-foreground">
              평균 소요 · 인증률 · 시간대 · 근무자 집계는 최근 {rows.length}건 기준입니다.
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default CoursePatrolLog
