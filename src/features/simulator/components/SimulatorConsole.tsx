import { useQueryClient } from '@tanstack/react-query'
import { RefreshCwIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { patrolApi } from '../api/patrol'
import { toSimError } from '../api/simError'
import { useRunStore } from '../engine/runStore'
import {
  simKeys,
  useSimSites,
  useSiteCourses,
  useSitePoints,
  useSiteUsers,
  useWorkerStatuses,
} from '../hooks/useSimSiteData'
import type { PatrolPlan } from '../patrol/plan'
import { runPatrol } from '../patrol/runPatrol'
import { requestAssignmentTaskFor } from '../tasks/requestAssignment'
import { runEndPatrol, runReturnRequest, runSetWork } from '../tasks/workerActions'
import { SIM_TASKS, TASK_GROUPS } from '../tasks'
import type { SimTask, SiteData, TaskValues } from '../tasks/types'
import type { SimSiteUser } from '../types'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Spinner } from '../ui/spinner'
import { PatrolRunDialog, type PatrolWorker } from './PatrolRunDialog'
import { RunList } from './RunList'
import { TaskDialog } from './TaskDialog'
import { WorkerList, type WorkerActions } from './WorkerList'

/** `codeSeq` — 6 현장 관리자 · 7 현장 근무자 */
const FIELD_MANAGER = 6
const FIELD_WORKER = 7

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border bg-card">
      <header className="flex h-9 shrink-0 items-center justify-between border-b px-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">{title}</h2>
        {aside}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </section>
  )
}

function ErrorLine({ error }: { error: unknown }) {
  const simError = toSimError(error)
  return (
    <p className="px-3 py-4 text-sm text-destructive">
      {simError.status !== null && <span className="sim-mono">{simError.status} </span>}
      {simError.message}
    </p>
  )
}

export function SimulatorConsole({ adminId }: { adminId: string }) {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const sites = useSimSites(true)
  const siteParam = Number(searchParams.get('site'))
  // 🔴 목록에 있는 사업장만 받는다 — 주소창에 아무 번호나 넣어도 조회하지 않는다
  const site = sites.data?.find((item) => item.siteSeq === siteParam) ?? null
  const siteSeq = site?.siteSeq ?? null

  const users = useSiteUsers(siteSeq)
  const points = useSitePoints(siteSeq)
  const courses = useSiteCourses(siteSeq)
  const workers = (users.data ?? []).filter((user) => user.codeSeq === FIELD_WORKER)
  const managers = (users.data ?? []).filter((user) => user.codeSeq === FIELD_MANAGER)
  const statuses = useWorkerStatuses(siteSeq, workers)

  // 작업은 사업장의 근무자 · 지점 · 코스를 다 읽은 뒤에 열 수 있다(입력 기본값이 거기서 나온다)
  // 앱 서버에 로그인된 근무자만 순찰 · 정리의 대상이 된다(로그인 불가 계정은 뺀다)
  const patrolWorkers: PatrolWorker[] = workers.flatMap((worker, index) => {
    const status = statuses[index]?.data
    return status
      ? [{ loginId: worker.loginId, name: worker.userName, busy: status.activePatrol !== null }]
      : []
  })

  const siteData: SiteData | null =
    site && sites.data && users.data && points.data && courses.data
      ? {
          site,
          sites: sites.data,
          users: users.data,
          points: points.data,
          courses: courses.data,
          readyLoginIds: patrolWorkers.map((worker) => worker.loginId),
        }
      : null

  const [openTask, setOpenTask] = useState<SimTask | null>(null)
  const [patrolOpen, setPatrolOpen] = useState(false)
  const startRun = useRunStore((state) => state.startRun)
  const hasFinishedRuns = useRunStore((state) => state.runs.some((run) => run.status !== 'running'))
  const clearFinished = useRunStore((state) => state.clearFinished)

  const refreshAll = () => void queryClient.invalidateQueries({ queryKey: simKeys.all })

  const startPatrolRun = (plan: PatrolPlan, summary: string) => {
    setPatrolOpen(false)
    const names = Object.fromEntries(patrolWorkers.map((worker) => [worker.loginId, worker.name]))
    startRun({ taskName: '순찰 실행', summary }, (ctx) => runPatrol(ctx, patrolApi, plan, { names }), refreshAll)
    // 시작 직후 근무자 줄에 "순찰 중"이 보이도록 한 번 다시 읽는다
    setTimeout(refreshAll, 1500)
  }

  // ── 근무자 줄의 동작 — 입력 창 없이 바로 실행한다(배치 요청만 받는 사업장을 묻는다)
  const actor = (worker: SimSiteUser) => ({ loginId: worker.loginId, name: worker.userName })
  const workerActions: WorkerActions = {
    onToggleWork: (worker, workYn) =>
      startRun(
        { taskName: workYn ? '근무 시작' : '근무 종료', summary: worker.userName },
        (ctx) => runSetWork(ctx, [actor(worker)], workYn),
        refreshAll
      ),
    onRequestAssignment: (worker) => setOpenTask(requestAssignmentTaskFor(worker)),
    onRequestReturn: (worker, assignmentSeq) =>
      startRun(
        { taskName: '복귀 요청', summary: worker.userName },
        async (ctx) => void (await runReturnRequest(ctx, actor(worker), assignmentSeq)),
        refreshAll
      ),
    onEndPatrol: (worker) =>
      startRun(
        { taskName: '순찰 종료', summary: worker.userName },
        (ctx) => runEndPatrol(ctx, actor(worker)),
        refreshAll
      ),
  }

  /** 전체 근무 시작 · 종료 — 🔴 **이미 그 상태인 사람은 건드리지 않는다** */
  const workTargets = (workYn: boolean) =>
    workers.filter((_, index) => {
      const status = statuses[index]?.data
      return status !== undefined && status.today.workYn !== workYn
    })
  const setWorkAll = (workYn: boolean) => {
    const targets = workTargets(workYn)
    startRun(
      { taskName: workYn ? '전체 근무 시작' : '전체 근무 종료', summary: `${targets.length}명` },
      (ctx) => runSetWork(ctx, targets.map(actor), workYn),
      refreshAll
    )
  }

  const runTask = (task: SimTask, data: SiteData, values: TaskValues) => {
    setOpenTask(null)
    startRun(
      { taskName: task.name, summary: `${data.site.siteName} · ${task.summary(values, data)}` },
      (ctx) => task.run(ctx, values, data),
      // 끝나면(성공 · 실패 · 중단) 화면의 목록을 다시 읽는다
      refreshAll
    )
  }

  const siteItems = (sites.data ?? []).map((item) => ({
    value: String(item.siteSeq),
    label: item.parentSiteName ? `${item.parentSiteName} › ${item.siteName}` : item.siteName,
  }))

  return (
    <div className="flex h-dvh min-h-0 flex-col gap-3 bg-background p-3 text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-3 rounded-lg border bg-card px-3 py-2">
        <p className="text-xs font-semibold tracking-wide text-primary">SIMULATOR</p>

        {sites.isPending && <Spinner className="text-muted-foreground" />}
        {sites.error && <ErrorLine error={sites.error} />}
        {sites.data && (
          <Select
            items={siteItems}
            value={siteSeq === null ? null : String(siteSeq)}
            onValueChange={(value) => setSearchParams(value ? { site: String(value) } : {})}
          >
            <SelectTrigger size="sm" className="min-w-56" aria-label="사업장">
              <SelectValue placeholder="사업장 선택" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="start">
              {siteItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {site && (
          <p className="text-xs text-muted-foreground">
            <span className="sim-mono">#{site.siteSeq}</span> · {site.groupPath}
          </p>
        )}
        {siteData && (
          <p className="text-xs text-muted-foreground">
            지점 <b className="sim-mono text-foreground">{siteData.points.length}</b> · 코스{' '}
            <b className="sim-mono text-foreground">{siteData.courses.length}</b> · 근무자{' '}
            <b className="sim-mono text-foreground">{workers.length}</b>
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            본사 <span className="sim-mono text-foreground">{adminId}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
          >
            <RefreshCwIcon data-icon="inline-start" />
            새로고침
          </Button>
        </div>
      </header>

      {!site ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">작업할 사업장을 골라 주세요.</p>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-3 md:grid-cols-[420px_minmax(0,1fr)]">
          <Panel
            title="근무자"
            aside={
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={workTargets(true).length === 0}
                  onClick={() => setWorkAll(true)}
                >
                  전체 근무 시작
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={workTargets(false).length === 0}
                  onClick={() => setWorkAll(false)}
                >
                  전체 근무 종료
                </Button>
              </div>
            }
          >
            {managers.length > 0 && (
              <p className="truncate border-b px-3 py-1.5 text-xs text-muted-foreground">
                현장관리자 {managers.map((manager) => `${manager.userName} ${manager.loginId}`).join(', ')}
              </p>
            )}
            {users.isPending && (
              <div className="flex justify-center py-6">
                <Spinner className="text-muted-foreground" />
              </div>
            )}
            {users.error && <ErrorLine error={users.error} />}
            {users.data && siteSeq !== null && (
              <WorkerList workers={workers} statuses={statuses} siteSeq={siteSeq} actions={workerActions} />
            )}
          </Panel>

          <Panel title="작업">
            <div className="flex flex-col gap-3 p-3">
              {TASK_GROUPS.map((group) => (
                <div key={group} className="flex items-center gap-2">
                  <p className="w-10 shrink-0 text-xs text-muted-foreground">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {SIM_TASKS.filter((task) => task.group === group).map((task) => (
                      <Button
                        key={task.id}
                        variant="secondary"
                        size="sm"
                        disabled={!siteData}
                        onClick={() => setOpenTask(task)}
                      >
                        {task.name}
                      </Button>
                    ))}
                    {group === '순찰' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!siteData}
                        onClick={() => setPatrolOpen(true)}
                      >
                        순찰 실행
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {(points.error || courses.error) && <ErrorLine error={points.error ?? courses.error} />}
              <p className="text-xs text-muted-foreground">
                근무 · 배치 요청 · 복귀 요청 · 한 명의 순찰 종료는 근무자 줄에서 합니다. 배치 · 복귀의 승인과
                거절은 웹의 배치 화면에서 합니다.
              </p>
            </div>
          </Panel>

          <div className="flex min-h-0 flex-col md:col-span-2 [&>section]:flex-1">
            <Panel
              title="실행"
              aside={
                hasFinishedRuns && (
                  <Button variant="ghost" size="xs" onClick={clearFinished}>
                    끝난 실행 지우기
                  </Button>
                )
              }
            >
              <RunList />
            </Panel>
          </div>
        </div>
      )}

      {patrolOpen && siteData && (
        <PatrolRunDialog
          site={siteData.site}
          workers={patrolWorkers}
          courses={siteData.courses}
          points={siteData.points}
          onClose={() => setPatrolOpen(false)}
          onRun={startPatrolRun}
        />
      )}

      {openTask && siteData && (
        <TaskDialog
          key={openTask.id}
          task={openTask}
          data={siteData}
          onClose={() => setOpenTask(null)}
          onRun={(values) => runTask(openTask, siteData, values)}
        />
      )}
    </div>
  )
}
