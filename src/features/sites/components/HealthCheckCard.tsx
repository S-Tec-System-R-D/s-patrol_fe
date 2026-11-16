import { useState, type ReactNode } from 'react'
import { HeartPulseIcon, SquarePenIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppLinkButton from '@/components/app/AppLinkButton'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import HealthCheckForm from '../form/HealthCheckForm'
import { toHealthCheckFormValues, toHealthCheckRequest } from '../form/healthCheckSchema'
import { useUpdateHealthCheck } from '../hooks/useSiteMutations'
import { daySegments, isHealthCheckEmpty, toHHmm } from '../lib/healthCheck'
import type { SiteDetail } from '../types/site'

/**
 * 헬스체크 카드 (`spec 044` T804 · T805 → 🔄 **`spec 080`** 시안 `개선안/사업장`).
 *
 * - 🔄 080: `사용 · 30분` **뱃지 삭제** — 토글 하나가 상태를 말한다. 토글 · [수정] 은 **카드 머리 오른쪽** ·
 *   끄면 값이 흐려지고 안내 한 줄 · 좁은 폭의 [수정] 은 카드 아래 `설정 수정`.
 * - 🔄 080 B안(사용자 결정 2026-11-16): **값이 먼저**(사용 시간 · 체크 주기 · 타임아웃 · 반복) · 그 아래 **얇은 24시간 막대**는
 *   보조(사용 구간 칠함 · 예외는 빈 틈 · 자정 넘김은 두 구간). 레퍼런스 = CCTV 녹화 일정(Reolink · Hikvision)의 하루 막대 —
 *   설정이 아니라 **읽기 전용**. 눈금은 0 · 6 · 12 · 18 · 24 만(공대 느낌을 줄인다, 사용자).
 * - 🔄 꺼지면 [수정] · `설정 수정` 을 **숨긴다**(사용자) — 켜는 길은 토글 하나(값이 비었으면 토글이 설정 창을 연다).
 * - 🔴 타임아웃은 **숫자만**(D1) — 단위 미확인(OQ-044-B). 시안의 `1회 무응답 허용` 은 쓰지 않는다.
 * - 🔴 **토글은 비옵티미스틱** — 표시는 늘 상세 응답(`healthCheckYn`)이다. 처리 중 잠그고, 실패하면 그대로 남는다.
 * - 🔴 **값이 빈 사업장을 켜면 저장하지 않고 설정 모달을 연다** — 서버가 저장된 값까지 합쳐 검사해 토글만으로는
 *   400 이다(실측). 모달 저장이 곧 켜기이고, 취소하면 꺼진 채다.
 * - 끄면 `healthCheckYn: false` 만 보낸다 — 값은 서버에 남는다(실측). 그래서 미사용이어도 값을 흐리게 보여 준다.
 */

/** 값 없음 — `design-system.md` §4-5A(999 T869 에서 `—` → `-`) */
const EMPTY = '-'

const timeRange = (start: string | null, end: string | null): string =>
  start === null || end === null ? EMPTY : `${toHHmm(start)} – ${toHHmm(end)}`

/** 값 한 칸 — 라벨 위 · 값 아래 */
const Stat = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col gap-1', className)}>
    <dt className="text-caption text-muted-foreground">{label}</dt>
    <dd className="text-lg font-semibold text-foreground tabular-nums">{children}</dd>
  </div>
)

const TICKS = [0, 6, 12, 18, 24]

/**
 * 24시간 막대 — 보조 그림(값은 위 글자가 말한다 → `aria-hidden`). 사용 구간은 포인트색, 예외는 빈 틈.
 * 🔴 칠하는 순서: 사용 구간 → 예외를 카드색으로 덮는다(예외가 사용 구간 밖이어도 해가 없다).
 */
const DayBar = ({ detail }: { detail: SiteDetail }) => {
  const used = daySegments(detail.healthCheckStartTime, detail.healthCheckEndTime)
  const gaps = detail.exceptionTime.flatMap((row) => daySegments(row.exceptionStartTime, row.exceptionEndTime))
  const style = ({ from, to }: { from: number; to: number }) => ({ left: `${from * 100}%`, width: `${(to - from) * 100}%` })
  return (
    /* 🔴 양 끝 글자(0 · 24시)가 가운데 정렬로 반쯤 나가므로 좌우 여백을 둔다 */
    <div aria-hidden className="flex flex-col gap-1.5 pr-4 pl-1.5">
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        {used.map((segment) => (
          <span key={`u${segment.from}`} className="absolute inset-y-0 rounded-full bg-point/70" style={style(segment)} />
        ))}
        {gaps.map((segment) => (
          <span key={`g${segment.from}`} className="absolute inset-y-0 bg-muted" style={style(segment)} />
        ))}
      </div>
      {/* 🔴 글자를 시각 자리에 **가운데**로 둔다 — `justify-between` 은 글자 폭 때문에 6 · 12 · 18 이 눈금에서 밀렸다 */}
      <div className="relative h-4 text-label text-muted-foreground/80 tabular-nums">
        {TICKS.map((hour) => (
          <span key={hour} className="absolute top-0 -translate-x-1/2" style={{ left: `${(hour / 24) * 100}%` }}>
            {hour}
            {/* `시` 는 숫자 뒤에 띄워 붙인다 — 넣으면 `24` 가 눈금보다 왼쪽으로 밀린다 */}
            {hour === 24 && <span className="absolute left-full">시</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

const HealthCheckCard = ({ detail }: { detail: SiteDetail }) => {
  const update = useUpdateHealthCheck()
  const [formOpen, setFormOpen] = useState(false)
  const empty = isHealthCheckEmpty(detail)
  const on = detail.healthCheckYn

  const toggle = (next: boolean) => {
    if (next && empty) {
      setFormOpen(true)
      return
    }
    update.mutate({
      body: { siteSeq: detail.siteSeq, healthCheckYn: next },
      successMessage: next ? '헬스체크를 켰습니다.' : '헬스체크를 껐습니다.',
    })
  }

  return (
    <section aria-label="헬스체크" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-panel-title font-bold text-foreground">
          <HeartPulseIcon size={16} strokeWidth={1.75} aria-hidden />
          헬스체크
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2">
            <Switch
              id="health-check-toggle"
              aria-label="헬스체크 사용"
              checked={on}
              disabled={update.isPending}
              // 🔴 여기서 값을 바꾸지 않는다 — 저장 후 상세를 다시 받아 그린다
              onCheckedChange={toggle}
            />
            <label htmlFor="health-check-toggle" className="text-caption font-medium text-foreground">
              {on ? '사용' : '미사용'}
            </label>
          </span>
          {/* 넓은 폭만 머리에 — 좁은 폭은 카드 아래 `설정 수정`(시안) · 꺼지면 숨긴다(값이 빈 사업장은 토글이 모달을 연다) */}
          {on && (
            <span className="hidden xl:flex">
              <AppLinkButton icon={SquarePenIcon} onClick={() => setFormOpen(true)}>
                수정
              </AppLinkButton>
            </span>
          )}
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        {on
          ? '근무자 단말의 정상 동작 여부를 주기적으로 확인합니다. 응답이 없으면 비상연락망으로 알림이 발송됩니다.'
          : '헬스체크를 사용하지 않습니다. 켜면 아래 설정으로 단말 응답을 확인합니다.'}
      </p>

      {/* 미사용이어도 값은 남아 있다(서버 유지) — 흐리게 보여 준다. 값이 먼저 · 막대는 그 아래 보조 */}
      <div
        data-testid="health-check-values"
        className={cn('flex flex-col gap-4 rounded-md bg-muted/40 px-4 py-4', !on && 'opacity-50')}
      >
        <dl className="grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))]">
          <Stat label="사용 시간" className="col-span-3 sm:col-span-1">
            {timeRange(detail.healthCheckStartTime, detail.healthCheckEndTime)}
            <span className="mt-0.5 block text-caption font-normal text-muted-foreground">
              {detail.exceptionTime.length === 0 ? (
                '예외 시간 없음'
              ) : (
                <>
                  예외{' '}
                  {detail.exceptionTime.map((row, i) => (
                    <span key={row.detailSeq}>
                      {i > 0 && ' · '}
                      <span>{timeRange(row.exceptionStartTime, row.exceptionEndTime)}</span>
                    </span>
                  ))}
                </>
              )}
            </span>
          </Stat>
          <Stat label="체크 주기">{detail.healthCheckInterval > 0 ? `${detail.healthCheckInterval}분` : EMPTY}</Stat>
          {/* 단위 미확인(OQ-044-B) — 숫자만(D1) */}
          <Stat label="타임아웃">{detail.healthCheckTimeout > 0 ? String(detail.healthCheckTimeout) : EMPTY}</Stat>
          <Stat label="반복 횟수">{detail.healthCheckRetry === null ? EMPTY : `${detail.healthCheckRetry}회`}</Stat>
        </dl>
        <DayBar detail={detail} />
      </div>

      {on && (
        <AppButton variant="sub" icon={SquarePenIcon} onClick={() => setFormOpen(true)} className="w-full xl:hidden">
          설정 수정
        </AppButton>
      )}

      <AppDialog
        title="헬스체크 설정 수정"
        description="단말 정상 동작 확인 시간과 주기를 설정합니다."
        open={formOpen}
        onOpenChange={setFormOpen}
        contentClassName="sm:max-w-[500px]"
      >
        <HealthCheckForm
          defaultValues={toHealthCheckFormValues(detail)}
          pending={update.isPending}
          onSubmit={(data) =>
            update.mutate(
              {
                body: toHealthCheckRequest(detail.siteSeq, data),
                successMessage: on ? '헬스체크 설정을 저장했습니다.' : '헬스체크를 켰습니다.',
              },
              { onSuccess: () => setFormOpen(false) }
            )
          }
          onCancel={() => setFormOpen(false)}
        />
      </AppDialog>
    </section>
  )
}

export default HealthCheckCard
