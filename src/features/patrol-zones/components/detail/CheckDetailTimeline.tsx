import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as COMPACT_BADGE } from '@/components/app/AppBadge.variants'
import { checkGaps } from '@/features/course-history/lib/checkIntervals'
import { formatDuration } from '@/features/course-history/lib/elapsed'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import { AUTH_METHOD, POINT_HISTORY_STATUS, type CheckDetailRow } from '@/features/course-history/types'

import CheckDetailMemo from './CheckDetailMemo'

/**
 * 지점 인증 내역 — **`xl` 미만 타임라인** (`spec 055`, 사용자 결정 2026-10-27).
 *
 * 7칸 표는 좁은 폭에서 옆으로 밀어야 읽혔다. 순번 · 지점 · 시각이 **위에서 아래로 흐르는**
 * 내역이라 세로 타임라인이 맞다 — 표의 **구간** 칸은 노드 아래 줄로 읽힌다.
 *
 * 배치(사용자 조정 2026-10-27): **시각 → 번호 → 지점명 + 인증수단**, 나머지는 아래 줄.
 * - 🔴 **완료는 뱃지가 아니라 번호 원이 녹색**이다 — 거의 모든 행이 `이상없음` 이라 뱃지가 줄마다
 *   반복되면 정작 문제 행이 묻힌다. 메모가 있는 완료(`순찰기록`)는 아래 기록 버튼이 말한다.
 * - 🔴 **미완료 · 미인증 등은 번호 원 색 + 뱃지 글자**를 함께 둔다 — 색만으로 구분하지 않는다
 *   (`design-system.md` §3). 완료 원에도 결과를 화면 낭독기용 글자로 넣는다.
 * 뱃지 · 시각 · 구간 · 기록 건수 규칙은 표(`CheckDetailTable`)와 같다. 표 쪽 주석이 근거다.
 *
 * 🔴 **펼침은 버튼이다**(표는 행 전체가 토글) — 카드 전체를 누르게 하면 스크롤하다 닿기만 해도
 * 열린다. 여러 개를 동시에 펼칠 수 있는 것은 표와 같다.
 */

const formatTime = (value: string): string => value.slice(11, 16)

/** 번호 원 색 — 완료 녹색 · 미완료 빨강 · 그 외(대기 · 진행 · 제외) 회색 */
const chipClass = (status: number): string =>
  status === POINT_HISTORY_STATUS.COMPLETED
    ? 'bg-success text-white'
    : status === POINT_HISTORY_STATUS.INCOMPLETE
      ? 'bg-danger text-white'
      : 'bg-muted text-muted-foreground'

const CheckDetailTimeline = ({ rows, className }: { rows: CheckDetailRow[]; className?: string }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const gaps = checkGaps(rows)
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)

  const toggle = (detailSeq: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(detailSeq)) next.delete(detailSeq)
      else next.add(detailSeq)
      return next
    })

  return (
    <ol aria-label="지점 인증 내역" className={className}>
      {ordered.map((row, index) => {
        const completed = row.status === POINT_HISTORY_STATUS.COMPLETED
        const result = pointCheckBadge(row.status, row.checkDt, row.memos.length > 0)
        const overtime = overtimeBadge(row.overtimeYn)
        const gap = gaps.get(row.detailSeq) ?? null
        const memoCount = row.memos.length
        const photoCount = row.memos.reduce((sum, memo) => sum + (memo.attaches?.length ?? 0), 0)
        const isOpen = expanded.has(row.detailSeq)
        const isLast = index === ordered.length - 1
        const hasSubLine = !completed || overtime || gap !== null

        return (
          <li key={row.detailSeq} className="flex gap-2.5">
            <span className="w-10 shrink-0 pt-0.5 text-body tabular-nums text-muted-foreground">
              {row.checkDt === null ? '-' : formatTime(row.checkDt)}
            </span>

            {/* 번호 원 + 다음 노드로 잇는 세로선(마지막 노드 아래에는 없다) */}
            <div className="flex shrink-0 flex-col items-center">
              <span
                className={`grid size-6 place-items-center rounded-full text-label font-semibold leading-none tabular-nums ${chipClass(row.status)}`}
              >
                {row.orderNo}
                <span className="sr-only"> {result.label}</span>
              </span>
              {!isLast && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-4'}`}>
              <div className="flex min-h-6 items-center gap-1.5">
                <span className="min-w-0 break-keep text-body font-medium">{row.pointName}</span>
                {row.authMethod === AUTH_METHOD.QR && (
                  <AppBadge variant="point" className={COMPACT_BADGE}>
                    QR
                  </AppBadge>
                )}
                {row.authMethod === AUTH_METHOD.NFC && (
                  <AppBadge variant="success" className={COMPACT_BADGE}>
                    NFC
                  </AppBadge>
                )}
              </div>

              {hasSubLine && (
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {!completed && (
                    <AppBadge variant={result.variant} className={COMPACT_BADGE}>
                      {result.label}
                    </AppBadge>
                  )}
                  {overtime && (
                    <AppBadge variant={overtime.variant} className={COMPACT_BADGE}>
                      {overtime.label}
                    </AppBadge>
                  )}
                  {gap !== null && (
                    <span className="whitespace-nowrap text-caption tabular-nums text-muted-foreground">
                      구간 +{formatDuration(gap)}
                    </span>
                  )}
                </div>
              )}

              {memoCount > 0 && (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={`${row.pointName} 기록 ${isOpen ? '접기' : '펼치기'}`}
                  onClick={() => toggle(row.detailSeq)}
                  className="mt-1 flex items-center gap-1 rounded-sm py-1 text-caption text-warning-foreground"
                >
                  <span className="tabular-nums">
                    {photoCount > 0 && `사진 ${photoCount} · `}메모 {memoCount}
                  </span>
                  <ChevronDownIcon
                    size={14}
                    aria-hidden
                    className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              )}

              {isOpen && (
                <div className="mt-1.5 rounded-md border border-border bg-card p-3">
                  <CheckDetailMemo row={row} />
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default CheckDetailTimeline
