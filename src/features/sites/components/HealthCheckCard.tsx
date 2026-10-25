import { useState } from 'react'
import { HeartPulseIcon, SquarePenIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppDialog from '@/components/app/AppDialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import HealthCheckForm from '../form/HealthCheckForm'
import { toHealthCheckFormValues, toHealthCheckRequest } from '../form/healthCheckSchema'
import { useUpdateHealthCheck } from '../hooks/useSiteMutations'
import { isHealthCheckEmpty, toHHmm } from '../lib/healthCheck'
import type { SiteDetail } from '../types/site'

/**
 * 헬스체크 카드 (`spec 044` T804 · T805) — 사업장 상세 우측, 담당 관리자 카드 아래.
 *
 * - 토글 · [수정] 은 설명 줄 오른쪽(담당 관리자 카드의 [관리자 지정] 과 같은 자리 — 사용자 승인 2026-10-23).
 *   `AppDetailCard` 머리에는 액션을 두지 않는다.
 * - 🔴 **토글은 비옵티미스틱** — 표시는 늘 상세 응답(`healthCheckYn`)이다. 처리 중 잠그고, 실패하면 그대로 남는다.
 * - 🔴 **값이 빈 사업장을 켜면 저장하지 않고 설정 모달을 연다** — 서버가 저장된 값까지 합쳐 검사해 토글만으로는
 *   400 이다(실측). 모달 저장이 곧 켜기이고, 취소하면 꺼진 채다.
 * - 끄면 `healthCheckYn: false` 만 보낸다 — 값은 서버에 남는다(실측). 그래서 미사용이어도 값을 흐리게 보여 준다.
 */

/** 값 없음 — `design-system.md` §4-5A(999 T869 에서 `—` → `-`) */
const EMPTY = '-'

const timeRange = (start: string | null, end: string | null): string =>
  start === null || end === null ? EMPTY : `${toHHmm(start)} – ${toHHmm(end)}`

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
    <AppDetailCard
      icon={HeartPulseIcon}
      title="헬스체크"
      badge={
        on ? (
          <AppBadge variant="success">사용 · {detail.healthCheckInterval}분</AppBadge>
        ) : (
          <AppBadge variant="muted">미사용</AppBadge>
        )
      }
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-caption text-muted-foreground">
          근무자 단말의 정상 동작 여부를 주기적으로 확인합니다. 설정 시간대에 응답이 없으면
          비상연락망으로 알림이 발송됩니다.
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <span className="flex items-center gap-2">
            <label htmlFor="health-check-toggle" className="text-caption text-muted-foreground">
              사용
            </label>
            <Switch
              id="health-check-toggle"
              aria-label="헬스체크 사용"
              checked={on}
              disabled={update.isPending}
              // 🔴 여기서 값을 바꾸지 않는다 — 저장 후 상세를 다시 받아 그린다
              onCheckedChange={toggle}
            />
          </span>
          <AppDialog
            title="헬스체크 설정 수정"
            description="단말 정상 동작 확인 시간과 주기를 설정합니다."
            open={formOpen}
            onOpenChange={setFormOpen}
            contentClassName="sm:max-w-[500px]"
            trigger={
              // 미사용이면 막는다(목업) — 값이 빈 사업장은 토글이 모달을 연다
              <AppButton
                variant="sub"
                icon={SquarePenIcon}
                iconSize={14}
                className="bg-card"
                disabled={!on}
              >
                수정
              </AppButton>
            }
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
        </div>
      </div>

      {/* 미사용이어도 값은 남아 있다(서버 유지) — 흐리게 보여 준다 */}
      <div className={cn('flex flex-col', !on && 'opacity-50')} data-testid="health-check-values">
        <AppDetailRow
          variant="fixed"
          label="사용 시간"
          value={timeRange(detail.healthCheckStartTime, detail.healthCheckEndTime)}
        />
        <AppDetailRow
          variant="fixed"
          label="예외 시간"
          value={
            detail.exceptionTime.length === 0 ? (
              '없음'
            ) : (
              <span className="flex flex-col">
                {detail.exceptionTime.map((row) => (
                  <span key={row.detailSeq}>
                    {timeRange(row.exceptionStartTime, row.exceptionEndTime)}
                  </span>
                ))}
              </span>
            )
          }
        />
        <AppDetailRow
          variant="fixed"
          label="체크 주기"
          value={detail.healthCheckInterval > 0 ? `${detail.healthCheckInterval}분` : EMPTY}
        />
        {/* 단위 미확인(OQ-044-B) — 숫자만 */}
        <AppDetailRow
          variant="fixed"
          label="타임아웃"
          value={detail.healthCheckTimeout > 0 ? String(detail.healthCheckTimeout) : EMPTY}
        />
        <AppDetailRow
          variant="fixed"
          label="반복 횟수"
          value={detail.healthCheckRetry === null ? EMPTY : `${detail.healthCheckRetry}회`}
        />
      </div>
    </AppDetailCard>
  )
}

export default HealthCheckCard
