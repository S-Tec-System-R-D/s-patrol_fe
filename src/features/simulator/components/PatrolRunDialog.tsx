import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { cn } from '@/lib/utils'
import { fetchCourseDetail } from '../api/patrol'
import { toSimError } from '../api/simError'
import {
  applyPreset,
  buildRows,
  canHaveEvent,
  describePlan,
  emptyDraft,
  hasEvent,
  isActiveRow,
  PRESETS,
  setEvent,
  START_ROW,
  totalWaitSeconds,
  type EventContext,
  type PatrolPlan,
  type PlanDraft,
  type PlanRow,
  type PresetId,
  type RowEvent,
} from '../patrol/plan'
import { HANDOVER_PAUSE_SECONDS } from '../patrol/runPatrol'
import type { SimCourse, SimPoint, SimSite } from '../types'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Spinner } from '../ui/spinner'

/** 순찰을 맡길 수 있는 근무자 — 앱 서버에 로그인된 사람만 온다 */
export interface PatrolWorker {
  loginId: string
  name: string
  /** 이미 순찰 중 — 한 사람은 순찰 하나만 할 수 있다 */
  busy: boolean
}

const DEFAULT_INTERVAL_SECONDS = 10

/** 줄에 놓는 상황 버튼 — 순서가 곧 화면 순서 */
const POINT_EVENTS: { event: RowEvent; label: string }[] = [
  { event: 'skip', label: '미인증' },
  { event: 'memo', label: '특이사항' },
  { event: 'overtime', label: '시간초과' },
  { event: 'handover', label: '교대' },
  { event: 'end', label: '종료' },
]
const START_EVENTS = POINT_EVENTS.filter(({ event }) => event === 'handover' || event === 'end')

const duration = (seconds: number) =>
  seconds < 60 ? `${seconds}초` : `${Math.floor(seconds / 60)}분 ${seconds % 60}초`

/** 켜고 끄는 상황 버튼 — 켜지면 강조색 */
function EventChip({
  label,
  on,
  disabled,
  title,
  onToggle,
}: {
  label: string
  on: boolean
  disabled: boolean
  title?: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      title={title}
      onClick={onToggle}
      className={cn(
        'h-6 cursor-pointer rounded-md border px-2 text-xs font-medium transition-colors outline-none',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
        'disabled:cursor-not-allowed disabled:opacity-35',
        on
          ? 'border-primary/50 bg-primary/15 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {label}
    </button>
  )
}

/**
 * 순찰 실행 입력 창 (`spec 082` US3).
 *
 * 🔴 **상황은 줄에서 켠다**(사용자 결정 2026-11-18) — 미인증 · 특이사항 · 시간초과 · 교대 · 종료를 지점 줄마다
 * 눌러 켜고 끈다. 교대 · 종료는 **그 지점을 처리한 뒤**에 일어나 웹 대시보드의 표시와 같은 줄이 된다.
 * 상단 프리셋은 정해진 자리에 한 번에 얹는 지름길이다(겹쳐 누를 수 있고 "정상 완료"가 되돌린다).
 */
export function PatrolRunDialog({
  site,
  workers,
  courses,
  points,
  onClose,
  onRun,
}: {
  site: SimSite
  workers: PatrolWorker[]
  courses: SimCourse[]
  points: SimPoint[]
  onClose: () => void
  onRun: (plan: PatrolPlan, summary: string) => void
}) {
  // 지금 바로 시작할 수 있는 코스 — 사용 중 · 지점 있음 · 대기중(0)
  const startable = courses.filter(
    (course) => course.useYn && course.pointCount > 0 && course.courseStatusCode === 0
  )
  const freeWorkers = workers.filter((worker) => !worker.busy)

  const [workerId, setWorkerId] = useState(freeWorkers[0]?.loginId ?? '')
  const [courseSeq, setCourseSeq] = useState<number | null>(startable[0]?.courseSeq ?? null)
  const [interval, setIntervalSeconds] = useState(DEFAULT_INTERVAL_SECONDS)
  // 표에서 고친 내용 — 코스 · 간격이 바뀌면 버린다(key 로 묶는다)
  const [edited, setEdited] = useState<{ key: string; draft: PlanDraft } | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const course = startable.find((item) => item.courseSeq === courseSeq) ?? null
  const detail = useQuery({
    queryKey: ['sim', 'site', site.siteSeq, 'course-detail', courseSeq],
    queryFn: () => fetchCourseDetail(courseSeq!),
    enabled: courseSeq !== null,
    retry: false,
  })

  const fresh: PlanRow[] = detail.data ? buildRows(detail.data.points, points, interval) : []
  const draftKey = `${courseSeq}:${interval}:${detail.dataUpdatedAt}`
  const draft: PlanDraft = edited?.key === draftKey ? edited.draft : emptyDraft(fresh)
  const setDraft = (next: PlanDraft) => setEdited({ key: draftKey, draft: next })

  const canHandover = course?.switchYn === true
  // 교대받을 수 있는 사람 — 순찰을 시작하는 근무자가 아니고 지금 순찰 중이 아닌 사람
  const handoverCandidates = freeWorkers.filter((worker) => worker.loginId !== workerId)
  const handoverBlocked = !canHandover
    ? '이 코스는 교대 허용이 꺼져 있습니다.'
    : handoverCandidates.length === 0
      ? '교대받을 수 있는 다른 근무자가 없습니다.'
      : null
  const eventContext: EventContext = {
    intervalSeconds: interval,
    handoverTo: handoverBlocked ? null : handoverCandidates[0].loginId,
  }

  const patchRow = (index: number, patch: Partial<PlanRow>) =>
    setDraft({ ...draft, rows: draft.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)) })

  const toggle = (index: number, event: RowEvent) =>
    setDraft(setEvent(draft, index, event, !hasEvent(draft, index, event), eventContext))

  const pressPreset = (preset: PresetId) => {
    if (preset === 'handover' && handoverBlocked) return setProblem(handoverBlocked)
    setProblem(null)
    setDraft(applyPreset(preset, draft, fresh, eventContext))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!workerId) return setProblem('순찰할 근무자를 골라 주세요.')
    if (!course) return setProblem('코스를 골라 주세요.')
    if (draft.rows.length === 0) return setProblem('코스의 지점을 아직 읽지 못했습니다.')
    if (draft.rows.some((row) => !Number.isFinite(row.waitSeconds) || row.waitSeconds < 0)) {
      return setProblem('대기 시간은 0초 이상이어야 합니다.')
    }
    const workerName = workers.find((worker) => worker.loginId === workerId)?.name ?? workerId
    onRun(
      { workerLoginId: workerId, siteSeq: site.siteSeq, courseSeq: course.courseSeq, ...draft },
      `${workerName} · ${course.courseName} · ${describePlan(draft)}`
    )
  }

  const workerItems = freeWorkers.map((worker) => ({
    value: worker.loginId,
    label: `${worker.name} ${worker.loginId}`,
  }))
  const courseItems = startable.map((item) => ({
    value: String(item.courseSeq),
    label: `${item.courseName} · 지점 ${item.pointCount}`,
  }))
  const handoverItems = handoverCandidates.map((worker) => ({ value: worker.loginId, label: worker.name }))

  /** 그 줄의 상황 버튼들. `index` 가 `START_ROW` 면 "순찰 시작" 줄 */
  const chips = (index: number, events: typeof POINT_EVENTS) =>
    events.map(({ event, label }) => {
      const on = hasEvent(draft, index, event)
      const blocked = event === 'handover' && handoverBlocked !== null
      return (
        <EventChip
          key={event}
          label={label}
          on={on}
          // 켜진 것은 언제든 끌 수 있다. 단 인증값이 없는 지점의 미인증은 끌 수 없다
          disabled={on ? event === 'skip' && !canHaveEvent(draft, index, event) : blocked || !canHaveEvent(draft, index, event)}
          title={blocked ? handoverBlocked : undefined}
          onToggle={() => toggle(index, event)}
        />
      )
    })

  /** 교대를 켠 줄에만 보이는 "누구에게" 선택 */
  const handoverSelect = (value: string, label: string, onChange: (loginId: string) => void) => (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      교대 →
      <Select items={handoverItems} value={value} onValueChange={(next) => onChange(String(next))}>
        <SelectTrigger size="sm" className="min-w-24" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} align="start">
          {handoverItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </span>
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* 줄마다 버튼 5개 + 세부 입력이 한 줄에 들어가야 한다 */}
      <DialogContent className="sm:max-w-[1040px]">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>순찰 실행</DialogTitle>
            <DialogDescription>
              {site.siteName} <span className="sim-mono">#{site.siteSeq}</span> · 근무자의 순찰을 API로 대신
              돌립니다. 대기 시간은 실제로 기다립니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">근무자</span>
              <Select items={workerItems} value={workerId || null} onValueChange={(value) => setWorkerId(String(value))}>
                <SelectTrigger className="min-w-44" aria-label="근무자">
                  <SelectValue placeholder="순찰 가능한 근무자 없음" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {workerItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">코스</span>
              <Select
                items={courseItems}
                value={courseSeq === null ? null : String(courseSeq)}
                onValueChange={(value) => setCourseSeq(Number(value))}
              >
                <SelectTrigger className="min-w-56" aria-label="코스">
                  <SelectValue placeholder="시작할 수 있는 코스 없음" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                  {courseItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sim-interval" className="text-xs font-medium text-muted-foreground">
                인증 간격(초)
              </label>
              <Input
                id="sim-interval"
                type="number"
                min={0}
                className="sim-mono w-24"
                value={String(interval)}
                onChange={(event) => setIntervalSeconds(Math.max(0, Number(event.target.value) || 0))}
              />
            </div>
            {course && (
              <p className="pb-1.5 text-xs text-muted-foreground">
                교대 {course.switchYn ? '허용' : '미허용'} · 총 {course.totalMin}분
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">한 번에 채우기</span>
            {PRESETS.map((preset) => (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={preset.id === 'normal' ? 'outline' : 'secondary'}
                disabled={draft.rows.length === 0}
                onClick={() => pressPreset(preset.id)}
              >
                {preset.label}
              </Button>
            ))}
            <span className="text-xs text-muted-foreground">
              정해진 자리에 얹습니다. 지점별로는 아래 줄에서 켜고 끕니다.
            </span>
          </div>

          <div className="max-h-[42vh] overflow-auto rounded-lg border">
            {detail.isPending && courseSeq !== null && (
              <div className="flex justify-center py-6">
                <Spinner className="text-muted-foreground" />
              </div>
            )}
            {detail.error && <p className="px-3 py-4 text-sm text-destructive">{toSimError(detail.error).message}</p>}
            {courseSeq === null && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                시작할 수 있는 코스가 없습니다. 코스를 추가하거나 진행 중인 순찰을 종료해 주세요.
              </p>
            )}
            {draft.rows.length > 0 && (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-card text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="w-8 px-2.5 py-1.5 font-medium">#</th>
                    <th className="w-52 px-2 py-1.5 font-medium">지점</th>
                    <th className="w-72 px-2 py-1.5 font-medium">이 줄에서 일어나는 일</th>
                    <th className="px-2 py-1.5 font-medium">세부</th>
                  </tr>
                </thead>
                <tbody>
                  {/* 순찰 시작 줄 — 첫 지점보다 앞에서 일어나는 일 */}
                  <tr className="border-b bg-muted/20">
                    <td className="sim-mono px-2.5 py-1.5 text-xs text-muted-foreground">0</td>
                    <td className="px-2 py-1.5">
                      <p>순찰 시작</p>
                      <p className="text-xs text-muted-foreground">첫 지점 전</p>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap gap-1">{chips(START_ROW, START_EVENTS)}</div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        {draft.startHandoverTo !== null &&
                          handoverSelect(draft.startHandoverTo, '시작하자마자 교대받을 근무자', (loginId) =>
                            setDraft({ ...draft, startHandoverTo: loginId })
                          )}
                        {draft.endAfterIndex === START_ROW && (
                          <span className="text-xs text-(--sim-warn)">인증 없이 바로 종료 — 전부 미완료</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {draft.rows.map((row, index) => {
                    const active = isActiveRow(draft, index)
                    const isLast = index === draft.rows.length - 1
                    return (
                      <tr key={row.pointSeq} className={cn('border-b last:border-b-0', !active && 'opacity-40')}>
                        <td className="sim-mono px-2.5 py-1.5 text-xs text-muted-foreground">{index + 1}</td>
                        <td className="px-2 py-1.5">
                          <p className="truncate">{row.pointName}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.authMethod === 10 ? 'NFC' : 'QR'} · 제한 {row.courseMin}분
                            {!row.canCertify && <span className="text-destructive"> · 인증값 없음</span>}
                            {isLast && ' · 마지막(자동 종료)'}
                          </p>
                        </td>
                        <td className="px-2 py-1.5">
                          {/* 실행되지 않는 줄은 누를 수 없다 — fieldset 이 안쪽 버튼을 한꺼번에 막는다 */}
                          <fieldset disabled={!active} className="flex flex-wrap gap-1">
                            {chips(index, POINT_EVENTS)}
                          </fieldset>
                        </td>
                        <td className="px-2 py-1.5">
                          {/* fieldset 은 폭을 내용에 맞춰 줄이는 버릇이 있어 flex 를 안쪽 div 에 둔다 */}
                          <fieldset disabled={!active} className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              대기
                              <Input
                                type="number"
                                min={0}
                                aria-label={`${row.pointName} 대기(초)`}
                                className={cn(
                                  'sim-mono h-7 w-20',
                                  hasEvent(draft, index, 'overtime') ? 'text-(--sim-warn)' : 'text-foreground'
                                )}
                                value={String(row.waitSeconds)}
                                onChange={(event) => patchRow(index, { waitSeconds: Number(event.target.value) })}
                              />
                              초
                            </label>
                            {row.memo !== null && (
                              <Input
                                aria-label={`${row.pointName} 특이사항`}
                                className="h-7 w-48"
                                placeholder="특이사항"
                                value={row.memo}
                                onChange={(event) => patchRow(index, { memo: event.target.value })}
                              />
                            )}
                            {row.handoverTo !== null &&
                              handoverSelect(row.handoverTo, `${row.pointName} 뒤에 교대받을 근무자`, (loginId) =>
                                patchRow(index, { handoverTo: loginId })
                              )}
                            {draft.endAfterIndex === index && (
                              <span className="text-xs text-(--sim-warn)">이 지점까지 하고 종료</span>
                            )}
                            </div>
                          </fieldset>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {draft.rows.length > 0 && (
            <p className="text-xs text-muted-foreground">
              이 계획: <span className="text-foreground">{describePlan(draft)}</span> · 대기 합계{' '}
              <span className="sim-mono text-foreground">
                {duration(totalWaitSeconds(draft, HANDOVER_PAUSE_SECONDS))}
              </span>{' '}
              · 교대와 종료는 그 줄의 지점을 처리한 뒤에 일어납니다(교대는 {HANDOVER_PAUSE_SECONDS}초 멈춤).
            </p>
          )}

          {problem && (
            <p role="alert" className="text-sm text-destructive">
              {problem}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={draft.rows.length === 0 || !workerId}>
              실행
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
