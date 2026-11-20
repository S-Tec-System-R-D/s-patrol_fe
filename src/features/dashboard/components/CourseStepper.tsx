import { CheckIcon, PlayIcon, RepeatIcon } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

import { cn } from '@/lib/utils'
import { pointSteps } from '../lib/activeCourse'
import type { DashboardCoursePoint, PointStepStatus } from '../types'

/**
 * 진행 중 회차의 지점 경로 — `spec 067`. 상태는 서버 `status` 그대로(`spec 068` — `pointSteps`).
 *
 * 🔄 **`spec 084`: 알약 뱃지 → 선 위의 점**(목업 `01-대시보드`). 점 아래에 지점 이름 · 그 아래 인증 시각을 적는다.
 * - 맨 앞은 **`순찰 시작`** 점 + 시작 시각(전에는 카드 둘째 줄의 `08:20 시작` 이었다).
 * - 지나온 구간은 파란 실선 · 마지막으로 인증한 지점에서 다음 지점까지는 **점선** · 남은 구간은 옅은 선.
 * - 점(16px — 목업 수치 그대로): 인증 = 파란 바탕 체크 / 미인증(서버 3) = 흰 바탕 회색 테두리 + 짧은 줄 /
 *   다음 = 흰 바탕 파란 테두리 + **가운데 6px 파란 점** + 둘레 옅은 파랑 4px / 대기 = **테두리 없는 8px 옅은 회색 점** /
 *   순찰 시작 = 옅은 파랑 바탕 + 파란 재생 표시(🔴 검정 원을 쓰지 않는다 — 순서 번호 규칙과 같다).
 * - 🔴 **선은 점에서 4px 씩 띄운다** — 한 줄로 이으면 흰 바탕 점(다음 · 대기) 뒤로 선이 비친다(사용자 지적 2026-11-20).
 * - 🔴 **한 줄에 최대 10칸**(순찰 시작 포함) — 넘으면 다음 줄로 이어 간다(사용자 결정 2026-11-20). 지점이 많은 코스에서
 *   칸이 좁아져 이름이 다 잘리는 것을 막는다. 10칸 이하면 칸 수만큼 똑같이 나눠 한 줄을 채운다.
 * - 가로 스크롤은 쓰지 않는다(067 결정 유지 — 한눈에 다 보여야 한다).
 * (전 — 2026-10-30: 번호 + 지점명을 상태색 알약 하나로 묶고 줄바꿈했다. 색은 인증 초록이었다.)
 */

/** 한 줄에 놓는 칸 수(순찰 시작 포함) */
const PER_ROW = 10

const statusText: Record<PointStepStatus, string> = {
  done: '인증',
  skipped: '미인증',
  next: '다음',
  pending: '대기',
}

const dotStyles: Record<PointStepStatus | 'start', string> = {
  start: 'border border-point/30 bg-point-bg text-point',
  done: 'bg-point text-white',
  skipped: 'border-2 border-muted-foreground/50 bg-card',
  next: 'border-2 border-point bg-card shadow-[0_0_0_4px_var(--point-bg)]',
  pending: '',
}

const formatTime = (value: string | null): string => {
  if (value === null) return ''
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'HH:mm') : value
}

/** 칸으로 들어오는 선 — 앞 칸의 점 오른쪽 4px 에서 이 칸의 점 왼쪽 4px 까지(점 반지름 8 + 간격 4 = 12px) */
const Connector = ({ kind, paused }: { kind: 'passed' | 'current' | 'rest'; paused: boolean }) => (
  <span
    aria-hidden
    className={cn(
      'absolute top-[7px] right-[calc(50%+12px)] left-[calc(-50%+12px)] h-0.5 rounded-full',
      kind === 'passed' && 'bg-point',
      // 멈춘 회차(교대 요청 중)는 점선만 그리고 흐르지 않는다 — 진행 중이 아니다
      kind === 'current' && 'course-march-anim',
      kind === 'current' && paused && '[animation:none]',
      kind === 'rest' && 'bg-border'
    )}
  />
)

interface Cell {
  key: string
  step: PointStepStatus | 'start'
  name: string
  /** 이름 아래 한 줄 — 시각 · `다음 지점` · `미인증` */
  note: string
  noteTone?: 'point'
  connector: 'passed' | 'current' | 'rest' | null
  handOver?: boolean
}

interface CourseStepperProps {
  points: DashboardCoursePoint[]
  /** 순찰 시작 일시 — 맨 앞 `순찰 시작` 점 아래에 시각을 적는다 */
  startDt: string
  /** 교대가 일어난 지점 순번 — 그 점 위에 `교대` 를 적는다(`spec 070` → `spec 073`) */
  handOverOrders?: number[]
  /** 멈춘 회차(교대 요청 중) — 진행 중이 아니라 현재 위치 둘레를 끈다 */
  paused?: boolean
}

const CourseStepper = ({ points, startDt, handOverOrders = [], paused = false }: CourseStepperProps) => {
  const steps = pointSteps(points)
  const nextIndex = steps.indexOf('next')

  const cells: Cell[] = [
    { key: 'start', step: 'start', name: '순찰 시작', note: formatTime(startDt), connector: null },
    ...points.map((point, index): Cell => {
      const step = steps[index]
      return {
        key: String(point.detailSeq),
        step,
        name: point.pointName,
        note: step === 'next' ? '다음 지점' : step === 'skipped' ? '미인증' : formatTime(point.checkDt),
        noteTone: step === 'next' ? 'point' : undefined,
        // 이 칸으로 들어오는 선 — 다음 지점으로 가는 구간만 점선
        connector: index === nextIndex ? 'current' : index < nextIndex || nextIndex === -1 ? 'passed' : 'rest',
        handOver: handOverOrders.includes(point.orderNo),
      }
    }),
  ]
  const columns = Math.min(cells.length, PER_ROW)

  return (
    <ol
      aria-label="지점 진행"
      className="grid gap-y-4 pt-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cells.map((cell, index) => (
        <li key={cell.key} className="relative flex min-w-0 flex-col items-center text-center">
          {/* 줄의 첫 칸은 들어오는 선을 그리지 않는다 — 윗줄 끝에서 이어진다 */}
          {cell.connector && index % PER_ROW !== 0 && <Connector kind={cell.connector} paused={paused} />}
          {cell.handOver && (
            <span className="absolute -top-4 inline-flex items-center gap-0.5 text-[10px] leading-3.5 font-semibold text-sub-foreground">
              <RepeatIcon size={10} strokeWidth={2.5} aria-hidden />
              교대
            </span>
          )}
          <span className={cn('relative grid size-4 place-items-center rounded-full', dotStyles[cell.step])}>
            {cell.step === 'next' && !paused && (
              <span
                aria-hidden
                data-testid="step-pulse"
                className="step-pulse-anim pointer-events-none absolute -inset-[6px] rounded-full motion-reduce:hidden"
              />
            )}
            {cell.step === 'start' && <PlayIcon size={7} fill="currentColor" strokeWidth={0} aria-hidden />}
            {cell.step === 'done' && <CheckIcon size={10} strokeWidth={3.5} aria-hidden />}
            {cell.step === 'skipped' && <span aria-hidden className="h-0.5 w-1.5 rounded-full bg-muted-foreground/60" />}
            {cell.step === 'next' && <span aria-hidden className="size-1.5 rounded-full bg-point" />}
            {cell.step === 'pending' && <span aria-hidden className="size-2 rounded-full bg-border" />}
          </span>
          <span
            className={cn(
              'mt-2 w-full truncate px-1 text-caption',
              cell.step === 'pending' ? 'text-muted-foreground' : 'text-sub-foreground',
              cell.step === 'next' && 'font-medium text-foreground'
            )}
          >
            {cell.name}
            {cell.step !== 'start' && <span className="sr-only"> ({statusText[cell.step]})</span>}
          </span>
          <span
            className={cn(
              'h-4 text-[11px] leading-4 tabular-nums',
              cell.noteTone === 'point' ? 'font-medium text-point' : 'text-muted-foreground'
            )}
          >
            {cell.note}
          </span>
        </li>
      ))}
    </ol>
  )
}

export default CourseStepper
