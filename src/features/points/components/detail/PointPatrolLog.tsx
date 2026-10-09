import { format, isValid, parseISO } from 'date-fns'
import { ActivityIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { paths } from '@/router/paths'

import type { PatrolSummary } from '../../lib/patrolSummary'
import type { PointHistoryRow } from '../../types'

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

/** 막대 높이 — 최대값 기준 상대. 0건인 날도 얇은 바닥선을 남겨 "쉰 날" 을 보여준다 */
const barHeight = (count: number, max: number): string => {
  if (count === 0) return '3px'
  return `${Math.max(6, Math.round((count / max) * 40))}px`
}

const PointPatrolLog = ({
  summary,
  rows,
  isPending,
}: {
  summary: PatrolSummary
  rows: PointHistoryRow[]
  isPending: boolean
}) => {
  const max = Math.max(...summary.buckets.map((b) => b.count), 1)
  const preview = rows.slice(0, PREVIEW_COUNT)

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">순찰 인증 기록</span>
          <p className="text-caption text-muted-foreground/80">
            최근 30일 · 이 지점에서 발생한 인증 내역
          </p>
        </div>
        <Link
          to={paths.service.patrolPoints}
          className="shrink-0 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
        </Link>
      </div>

      {isPending ? (
        <div className="mt-6 h-[60px] animate-pulse rounded-sm bg-muted" />
      ) : (
        <>
          {/* 날짜별 막대 */}
          <div className="mt-6 flex items-end gap-[3px]" aria-hidden>
            {summary.buckets.map((bucket) => (
              <div
                key={bucket.date}
                title={`${bucket.date} · ${bucket.count}회`}
                className={`flex-1 rounded-[2px] ${
                  bucket.count === 0 ? 'bg-border' : 'bg-point/70'
                }`}
                style={{ height: barHeight(bucket.count, max) }}
              />
            ))}
          </div>

          {summary.total === 0 ? (
            /* 🔴 기능은 있고 데이터가 없는 것 — placeholder 가 아니다 */
            <div className="mt-6 flex flex-col items-center gap-1.5 py-6 text-center">
              <ActivityIcon size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
              <p className="text-body font-medium text-foreground">순찰 기록이 없습니다</p>
              <p className="max-w-[320px] text-caption text-muted-foreground">
                코스에 배정된 뒤 근무자가 인증하면 이곳에 시간순으로 표시됩니다.
              </p>
            </div>
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
