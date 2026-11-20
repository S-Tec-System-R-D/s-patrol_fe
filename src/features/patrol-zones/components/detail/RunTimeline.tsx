import { useEffect, useRef } from 'react'
import { ChevronDownIcon, FlagIcon, ImageIcon, MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { formatDuration } from '@/features/course-history/lib/elapsed'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import {
  AUTH_METHOD,
  POINT_HISTORY_STATUS,
  type CheckDetailRow,
  type CourseHistoryDetail,
} from '@/features/course-history/types'
import { cn } from '@/lib/utils'

import { orderLabel, photoCountOf, type RunStep } from '../../lib/runTimeline'
import CheckDetailMemo from './CheckDetailMemo'

/**
 * 회차 상세 **수행 타임라인** (`spec 077` — 시안 `개선안/순찰이력`). 036 의 7칸 표 · 055 의 좁은 폭
 * 타임라인을 **모든 폭에서 하나로** 바꿨다.
 *
 * - `순찰 시작` → 지점들(순번 = `orderNo`) → `순찰 종료`. 지점 사이 연결선에 **`N분 이동`**
 *   (서버 값이 아니라 인증 시각 차이 — `runTimeline`). 시각 없는 지점을 건너뛰었으면 `(06→08)`.
 * - 🔴 **뱃지는 예외만**(D2 · 076 T1279) — 정상(`이상없음`)은 초록 원이 말한다. 줄마다 같은 뱃지가
 *   반복되면 정작 문제 행이 묻힌다(055 판단과 같다).
 * - 특이사항은 **메모 첫 줄 + 사진 수 한 줄**로 접어 두고, 누르면 펼친다. `기록 모두 펼치기` 토글.
 * - 진행 중 회차: 마지막 인증 다음 대기 지점에 `다음 지점` · 마지막 인증 아래 `N분 경과 · 진행중`.
 * - 🔴 **행 ↔ 핀 서로 강조**(D3): 지점 줄을 누르면 `onSelect` → 지도가 그 핀을 강조한다. 지도 · 요약에서
 *   고르면 이 목록이 그 행으로 스크롤한다.
 */

/**
 * 순번 원 — **테두리 + 연한 배경**(사용자 결정 2026-11-17, 레퍼런스 Carbon progress indicator).
 * 이 화면은 진행 표시가 아니라 기록이다 — 대부분인 인증 줄이 진한 채움으로 줄지어 서면 정상이 가장 눈에 띈다.
 * 완료 연초록 · 미인증 연회색 · 다음 파랑 테두리 + 고리 · 대기 **점선** 빈 원(연회색과 흰 바탕만으로는 헷갈려 선 모양으로 가른다).
 * ⚠️ 지도 핀은 채움 그대로다 — 지도 타일 위에서는 연한 색이 묻힌다(색은 같다).
 */
const chipClass = (step: RunStep): string => {
  if (step.row.status === POINT_HISTORY_STATUS.COMPLETED) return 'border-success/50 bg-success-bg text-success-foreground'
  if (step.row.status === POINT_HISTORY_STATUS.INCOMPLETE) return 'border-muted-foreground/50 bg-muted-foreground/15 text-foreground/75'
  if (step.isNext) return 'border-point bg-card text-point ring-4 ring-point/15'
  return 'border-dashed border-muted-foreground/60 bg-card text-muted-foreground'
}

const hhmm = (value: string | null): string | null => (value ? value.slice(11, 16) : null)

/** 오른쪽 끝 — 인증 시각 · 없으면 대기 / `—` */
const timeText = (step: RunStep): string => {
  const at = hhmm(step.row.checkDt)
  if (at) return at
  if (step.isNext || step.row.status === POINT_HISTORY_STATUS.WAITING || step.row.status === POINT_HISTORY_STATUS.IN_PROGRESS)
    return '대기'
  return '—'
}

/** 이 칸 아래 연결선 글자 — 다음 지점까지의 이동(다음 행에 시각이 있을 때만) */
const moveText = (next: RunStep | undefined): string | null => {
  if (!next || next.moveSeconds === null) return null
  const from = next.movedFrom === null ? '' : ` (${orderLabel(next.movedFrom)}→${orderLabel(next.row.orderNo)})`
  return `${formatDuration(next.moveSeconds)} 이동${from}`
}

const AuthChip = ({ authMethod }: { authMethod: number | null }) =>
  authMethod === AUTH_METHOD.QR ? (
    <AppBadge variant="plain" className={cardBadge}>
      QR
    </AppBadge>
  ) : authMethod === AUTH_METHOD.NFC ? (
    <AppBadge variant="plain" className={cardBadge}>
      NFC
    </AppBadge>
  ) : null

/** 한 줄 미리보기 — 메모 첫 줄 · 사진 수 */
const MemoPreview = ({ row, open, onToggle }: { row: CheckDetailRow; open: boolean; onToggle: () => void }) => {
  const first = row.memos[0]?.memo.split('\n')[0] ?? ''
  const photos = photoCountOf(row)
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`${row.pointName} 기록 ${open ? '접기' : '펼치기'}`}
      onClick={onToggle}
      className="mt-2 flex w-full max-w-[640px] items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-left text-caption hover:bg-muted"
    >
      <MessageSquareTextIcon size={13} className="shrink-0 text-warning-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-foreground">{first}</span>
      {row.memos.length > 1 && <span className="shrink-0 text-muted-foreground">메모 {row.memos.length}</span>}
      {photos > 0 && (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-muted-foreground tabular-nums">
          <ImageIcon size={12} aria-hidden />
          {photos}
        </span>
      )}
      <ChevronDownIcon
        size={14}
        aria-hidden
        className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
      />
    </button>
  )
}

/** 시작 · 종료 줄 */
const EdgeRow = ({ label, sub, time, last }: { label: string; sub?: string; time: string; last?: boolean }) => (
  <div className="flex gap-3">
    <div className="flex shrink-0 flex-col items-center">
      <span className="grid size-7 place-items-center rounded-full bg-foreground text-background">
        <FlagIcon size={13} aria-hidden />
      </span>
      {!last && <span aria-hidden className="w-px flex-1 bg-border" />}
    </div>
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1">
      <div className="flex flex-col">
        <span className="text-body font-semibold">{label}</span>
        {sub && <span className="text-caption text-muted-foreground">{sub}</span>}
      </div>
      <span className="shrink-0 text-body font-semibold tabular-nums">{time}</span>
    </div>
  </div>
)

const Connector = ({ text, tone = 'muted' }: { text: string | null; tone?: 'muted' | 'point' }) => (
  <div className="flex gap-3">
    <div className="flex w-7 shrink-0 justify-center">
      <span aria-hidden className="w-px bg-border" />
    </div>
    <span className={cn('py-2 text-caption tabular-nums', tone === 'point' ? 'text-point' : 'text-muted-foreground')}>
      {text ?? ' '}
    </span>
  </div>
)

interface RunTimelineProps {
  detail: CourseHistoryDetail
  steps: RunStep[]
  selected: number | null
  onSelect: (detailSeq: number) => void
  expanded: Set<number>
  onToggle: (detailSeq: number) => void
  onToggleAll: (open: boolean) => void
  /** 진행 중 경과 계산 기준(테스트 고정용) */
  now?: Date
}

const RunTimeline = ({ detail, steps, selected, onSelect, expanded, onToggle, onToggleAll, now }: RunTimelineProps) => {
  const listRef = useRef<HTMLOListElement>(null)

  /* 지도 · 요약에서 고른 행으로 스크롤 — 🔴 jsdom 에는 scrollIntoView 가 없다 */
  useEffect(() => {
    if (selected === null) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-detail="${selected}"]`)
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [selected])

  const memoRows = steps.filter((step) => step.row.memos.length > 0)
  const allOpen = memoRows.length > 0 && memoRows.every((step) => expanded.has(step.row.detailSeq))
  /* 🔴 **머리 숫자는 아래 행에서 센다**(사용자 지적 2026-11-13) — 서버 집계(`completedPointCount`)를 쓰면
     행과 어긋난 회차에서 `2 / 3 인증` 아래에 인증 행이 1개뿐인 화면이 된다. 미인증도 행에서 센다 */
  const checked = steps.filter((step) => step.row.status === POINT_HISTORY_STATUS.COMPLETED).length
  const missed = steps.filter((step) => step.row.status === POINT_HISTORY_STATUS.INCOMPLETE).length
  const rate = steps.length > 0 ? (checked / steps.length) * 100 : 0
  const inProgress = detail.endDt === null
  const startMove = moveText(steps[0])

  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-panel-title font-semibold">수행 타임라인</h3>
        <span className="text-body tabular-nums">
          <span className="font-semibold">{checked}</span>
          <span className="text-muted-foreground"> / {steps.length} 인증</span>
        </span>
        <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
          {/* 인증 비율 막대는 메인 포인트색 하나(2026-11-16 사용자 결정 — 색 수를 줄인다) */}
          <span className="block h-full rounded-full bg-point" style={{ width: `${rate}%` }} />
        </span>
        {missed > 0 && <span className="text-caption font-semibold text-muted-foreground">미인증 {missed}</span>}
        {memoRows.length > 0 && (
          <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-caption text-muted-foreground">
            <input
              type="checkbox"
              className="size-3.5 accent-point"
              checked={allOpen}
              onChange={(event) => onToggleAll(event.target.checked)}
            />
            기록 모두 펼치기
          </label>
        )}
      </div>

      {steps.length === 0 ? (
        /* 🔴 이력은 있는데 인증 행이 0건인 경우가 **실재한다** — 장애가 아니라 사실이다 */
        <p className="py-6 text-center text-body text-muted-foreground">이 회차에는 기록된 지점 인증이 없습니다.</p>
      ) : (
        <div className="flex flex-col">
          <EdgeRow label="순찰 시작" sub={detail.startUserName || '순찰자 미지정'} time={hhmm(detail.startDt) ?? '-'} />
          <Connector text={startMove} />

          <ol ref={listRef} aria-label="지점 인증 내역" className="flex flex-col">
            {steps.map((step, index) => {
              const { row } = step
              const badge = pointCheckBadge(row.status, row.memos.length > 0)
              const plain = row.status === POINT_HISTORY_STATUS.COMPLETED && row.memos.length === 0
              // 🔴 대기 지점도 뱃지를 달지 않는다 — 오른쪽 끝 `대기` 와 같은 말을 두 번 한다(시안)
              const quiet = plain || row.status === POINT_HISTORY_STATUS.WAITING
              const waiting = !plain && row.status !== POINT_HISTORY_STATUS.COMPLETED && row.status !== POINT_HISTORY_STATUS.INCOMPLETE
              const overtime = overtimeBadge(row.overtimeYn)
              const isOpen = expanded.has(row.detailSeq)
              const isSelected = selected === row.detailSeq
              const elapsed =
                step.isLatest && inProgress && row.checkDt
                  ? formatDuration(Math.max(0, Math.round(((now ?? new Date()).getTime() - new Date(row.checkDt).getTime()) / 1000)))
                  : null
              const below = elapsed ? `${elapsed} 경과 · 진행중` : moveText(steps[index + 1])

              return (
                <li key={row.detailSeq} data-detail={row.detailSeq}>
                  <div className="flex gap-3">
                    <div className="flex shrink-0 flex-col items-center">
                      <span
                        className={cn(
                          // 🔴 숫자 세로 중앙 — 가운데 정렬(grid)만으로는 Pretendard 숫자가 위로 뜬다. 줄 높이를 안쪽 높이에 맞춘다(`CourseStepper` 와 같은 방법)
                          'block size-7 rounded-full border-2 text-center text-label font-bold leading-6 tabular-nums',
                          chipClass(step)
                        )}
                      >
                        {row.orderNo}
                        <span className="sr-only"> {badge.label}</span>
                      </span>
                      <span aria-hidden className="w-px flex-1 bg-border" />
                    </div>

                    <div
                      className={cn(
                        'min-w-0 flex-1 rounded-md px-2 py-1 -mx-2 transition-colors',
                        isSelected && 'bg-point-bg'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onSelect(row.detailSeq)}
                        aria-label={`${row.orderNo}. ${row.pointName} 지도에서 보기`}
                        aria-pressed={isSelected}
                        className="flex w-full items-start justify-between gap-3 text-left"
                      >
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'text-body font-semibold break-keep',
                                step.isNext && 'text-point',
                                waiting && !step.isNext && 'text-muted-foreground'
                              )}
                            >
                              {row.pointName}
                            </span>
                            {step.isNext ? (
                              <AppBadge variant="point" className={cardBadge}>
                                다음 지점
                              </AppBadge>
                            ) : (
                              // 🔴 정상(이상없음) · 대기는 뱃지를 달지 않는다(D2)
                              !quiet && (
                                <AppBadge variant={badge.variant} className={cardBadge}>
                                  {badge.label}
                                </AppBadge>
                              )
                            )}
                            {overtime && (
                              <AppBadge variant={overtime.variant} className={cardBadge}>
                                {overtime.label}
                              </AppBadge>
                            )}
                          </span>
                          {row.authMethod !== null && (
                            <span>
                              <AuthChip authMethod={row.authMethod} />
                            </span>
                          )}
                        </span>
                        <span
                          className={cn(
                            'shrink-0 pt-0.5 text-body tabular-nums',
                            row.checkDt ? 'font-semibold' : 'text-muted-foreground'
                          )}
                        >
                          {timeText(step)}
                        </span>
                      </button>

                      {row.memos.length > 0 && (
                        <MemoPreview row={row} open={isOpen} onToggle={() => onToggle(row.detailSeq)} />
                      )}
                      {isOpen && (
                        <div className="mt-2 max-w-[640px]">
                          <CheckDetailMemo row={row} photoLimit={3} />
                        </div>
                      )}
                    </div>
                  </div>
                  <Connector text={below} tone={elapsed ? 'point' : 'muted'} />
                </li>
              )
            })}
          </ol>

          <EdgeRow label="순찰 종료" time={hhmm(detail.endDt) ?? '—'} last />
        </div>
      )}
    </section>
  )
}

export default RunTimeline
