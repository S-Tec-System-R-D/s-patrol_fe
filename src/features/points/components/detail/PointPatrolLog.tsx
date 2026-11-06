import { format, isValid, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'
import { paths } from '@/router/paths'

import type { PatrolSummary } from '../../lib/patrolSummary'
import PatrolBarChart from './PatrolBarChart'
import type { PointHistoryRow } from '@/features/course-history/types'

/**
 * 순찰 인증 기록 (`spec 027` Phase 3).
 *
 * 날짜별 막대 + 최근 기록 목록. 데이터는 `GetPointHistory`(실측) 하나에서 나오고,
 * 막대는 `lib/patrolSummary.ts` 가 센 결과를 그린다.
 *
 * 🔴 **0건일 때는 빈 상태이지 placeholder 가 아니다.** 기능은 있고 **데이터가 없는**
 * 것이다 — `PendingBlock` 과 섞으면 "아직 안 만든 것" 으로 읽힌다.
 *
 * ⚠️ 목록은 **최근 몇 건만** 보여주고 전체는 지점이력 화면으로 넘긴다. 상세는 요약이
 * 목적이고, 30일치를 다 쌓으면 아래 섹션이 안 보인다.
 */

/** 상세에서 보여줄 최근 기록 수 */
const PREVIEW_COUNT = 5

const formatCheckDt = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : '-'
}

/**
 * 🔴 **요약 값은 이 카드 머리에 둔다**(사용자 결정 2026-11-06) — 지점 상세의 KPI 줄을 없앴다.
 * 최근 순찰 · 인증률은 모두 이 기록의 요약이라, 근거인 그래프 바로 위가 제자리다.
 * 🔴 인증률에 색을 입히지 않는다 — 분모를 확신할 수 없다(`spec 023`).
 */
const summaryLine = (summary: PatrolSummary, sinceLabel: string | null): string => {
  const rate =
    summary.attempted > 0
      ? `인증 ${summary.total}/${summary.attempted} (${Math.round((summary.total / summary.attempted) * 100)}%)`
      : '순찰 기록 없음'
  return ['최근 2주', rate, sinceLabel && `최근 순찰 ${sinceLabel}`].filter(Boolean).join(' · ')
}

const PointPatrolLog = ({
  summary,
  sinceLabel,
  rows,
  isPending,
}: {
  summary: PatrolSummary
  /** `9시간 전` 같은 경과 표기. 기록이 없거나 미래 시각이면 `null` */
  sinceLabel: string | null
  rows: PointHistoryRow[]
  isPending: boolean
}) => {
  const preview = rows.slice(0, PREVIEW_COUNT)

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-panel-title font-semibold text-foreground">순찰 인증 기록</span>
          <p className="text-caption text-muted-foreground">{summaryLine(summary, sinceLabel)}</p>
        </div>
        <Link
          to={paths.service.patrolPoints}
          className="shrink-0 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
        </Link>
      </div>

      {isPending ? (
        <div className="mt-4 h-[140px] animate-pulse rounded-sm bg-muted" />
      ) : (
        <>
          {/* 일자별 막대 — 축·툴팁은 recharts 가 맡는다 */}
          <div className="mt-4">
            <PatrolBarChart buckets={summary.buckets} />
          </div>

          {summary.total === 0 ? (
            /* 🔴 기능은 있고 데이터가 없는 것 — placeholder 가 아니다 */
            <AppEmpty
              illustration="route"
              title="순찰 기록이 없습니다"
              description="코스에 배정된 뒤 근무자가 인증하면 이곳에 시간순으로 표시됩니다."
            />
          ) : (
            <ul className="mt-6 flex flex-col">
              {preview.map((row) => (
                <li
                  key={row.detailSeq}
                  className="flex items-center gap-3 border-border/50 py-2.5 text-body not-last:border-b"
                >
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatCheckDt(row.checkDt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{row.courseName}</span>
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {row.userName}
                  </span>
                  {/* status 3=미완료 4=완료 (지점이력 체계 — B-7) */}
                  <AppBadge variant={row.status === 4 ? 'success' : 'muted'}>
                    {row.statusName}
                  </AppBadge>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default PointPatrolLog
