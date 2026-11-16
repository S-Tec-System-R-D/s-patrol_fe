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
import { isHealthCheckEmpty, toHHmm } from '../lib/healthCheck'
import type { SiteDetail } from '../types/site'

/**
 * 헬스체크 카드 (`spec 044` T804 · T805 → 🔄 **`spec 080`** 시안 `개선안/사업장`).
 *
 * - 🔄 080: `사용 · 30분` **뱃지 삭제** — 토글 하나가 상태를 말한다. 토글 · [수정] 은 **카드 머리 오른쪽** ·
 *   값 5개는 **가로 한 줄**(좁은 폭 2×2 + 타임아웃) · 끄면 값이 흐려지고 안내 한 줄 · 좁은 폭의 [수정] 은 카드 아래 `설정 수정`.
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

/** 값 한 칸 — 라벨 위 · 값 아래(시안) */
const Cell = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className={cn('flex min-w-0 flex-col gap-1 bg-card px-4 py-3', className)}>
    <dt className="text-caption text-muted-foreground">{label}</dt>
    <dd className="text-body font-semibold text-foreground tabular-nums">{children}</dd>
  </div>
)

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
          {/* 넓은 폭만 머리에 — 좁은 폭은 카드 아래 `설정 수정`(시안) · 미사용이면 막는다(값이 빈 사업장은 토글이 모달을 연다) */}
          <span className="hidden xl:flex">
            <AppLinkButton icon={SquarePenIcon} disabled={!on} onClick={() => setFormOpen(true)}>
              수정
            </AppLinkButton>
          </span>
        </div>
      </div>

      <p className="text-caption text-muted-foreground">
        {on
          ? '근무자 단말의 정상 동작 여부를 주기적으로 확인합니다. 응답이 없으면 비상연락망으로 알림이 발송됩니다.'
          : '헬스체크를 사용하지 않습니다. 켜면 아래 설정으로 단말 응답을 확인합니다.'}
      </p>

      {/* 미사용이어도 값은 남아 있다(서버 유지) — 흐리게 보여 준다.
          칸 구분선 = `gap-px` 사이로 비치는 테두리색(칸 순서가 폭마다 달라 테두리를 칸에 달지 않는다) */}
      <dl
        data-testid="health-check-values"
        className={cn(
          'grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border xl:grid-cols-5',
          !on && 'opacity-50'
        )}
      >
        <Cell label="사용 시간">{timeRange(detail.healthCheckStartTime, detail.healthCheckEndTime)}</Cell>
        <Cell label="예외 시간">
          {detail.exceptionTime.length === 0 ? (
            '없음'
          ) : (
            <span className="flex flex-col">
              {detail.exceptionTime.map((row) => (
                <span key={row.detailSeq}>{timeRange(row.exceptionStartTime, row.exceptionEndTime)}</span>
              ))}
            </span>
          )}
        </Cell>
        <Cell label="체크 주기">{detail.healthCheckInterval > 0 ? `${detail.healthCheckInterval}분` : EMPTY}</Cell>
        {/* 순서 — 넓은 폭: 사용 · 예외 · 주기 · 타임아웃 · 반복 / 좁은 폭: 2×2 뒤에 타임아웃 한 줄(시안) */}
        <Cell label="반복 횟수" className="xl:order-last">
          {detail.healthCheckRetry === null ? EMPTY : `${detail.healthCheckRetry}회`}
        </Cell>
        {/* 단위 미확인(OQ-044-B) — 숫자만(D1) */}
        <Cell label="타임아웃" className="col-span-2 xl:col-span-1">
          {detail.healthCheckTimeout > 0 ? String(detail.healthCheckTimeout) : EMPTY}
        </Cell>
      </dl>

      <AppButton
        variant="sub"
        icon={SquarePenIcon}
        disabled={!on}
        onClick={() => setFormOpen(true)}
        className="w-full xl:hidden"
      >
        설정 수정
      </AppButton>

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
