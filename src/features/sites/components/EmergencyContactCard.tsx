import { useState } from 'react'
import { PhoneIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppEmpty from '@/components/app/AppEmpty'
import { adminRoleLabel } from '@/features/admins/lib/adminRole'
import EmergencyAddDialog from '@/features/emergency/components/EmergencyAddDialog'
import {
  useAddEmergency,
  useEmergencyWeek,
  useRemoveEmergency,
} from '@/features/emergency/hooks/useEmergency'
import {
  contactCount,
  DAY_LABEL,
  isWeekend,
  registeredOn,
} from '@/features/emergency/lib/emergencyTree'
import type { EmergencyDay } from '@/features/emergency/types/emergency'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { cn } from '@/lib/utils'

/**
 * 비상연락망 카드 (`spec 044` T808 자리 → `048` 예시 화면 → `spec 057` 실제 API).
 *
 * - 🔄 **`spec 080`**(시안 `개선안/사업장`): `2xl` = **월~일 7칸 주간 표**(칸마다 담당자 카드 · `×` 는 마우스 올림/포커스 ·
 *   `+ 추가`) / 좁은 폭 = **요일별 카드**(사이 간격 — 이어 붙인 목록은 요일 구분이 약하다, D3 · `×` 늘 보임).
 *   **빈 요일은 주황 점선 `+ 담당자 지정`** — 비어 있는 날이 먼저 보여야 한다. 토 · 일 빨강(048 그대로).
 * - 🔄 048 의 **담당자 풀 · 예시 안내는 없앴다** — 서버에 사업장별 풀이 없다(사용자 결정 2026-10-28). 후보는 [추가] 모달의 전사 트리.
 * - 해제는 확인창 없이 바로(045 담당 그룹 해제와 같다) · 처리 중 그 칩 비활성.
 * - 머리 "담당자 N명" = 7요일 중 하루라도 등록된 사람(중복 제거).
 * - 아바타는 그리지 않는다(045 판단 그대로).
 */

const EmergencyContactCard = ({ siteSeq }: { siteSeq: number }) => {
  const week = useEmergencyWeek(siteSeq)
  const add = useAddEmergency(siteSeq)
  const remove = useRemoveEmergency(siteSeq)
  const [addDay, setAddDay] = useState<EmergencyDay | null>(null)

  const removing = remove.isPending ? remove.variables : undefined

  return (
    <AppDetailCard
      icon={PhoneIcon}
      title="비상연락망"
      badge={
        week.data && (
          <span className="text-caption text-muted-foreground">
            담당자 {contactCount(week.data)}명
          </span>
        )
      }
    >
      <p className="text-caption text-muted-foreground">
        헬스체크 이상 감지 시 요일별로 지정된 담당자에게 알림이 발송됩니다.
      </p>

      {week.isError ? (
        <div>
          <AppEmpty icon={TriangleAlertIcon} title="비상연락망을 불러오지 못했습니다" />
          <div className="flex justify-center pb-2">
            <AppButton variant="sub" onClick={() => void week.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : week.isPending ? (
        <div
          aria-label="비상연락망 불러오는 중"
          className="h-40 animate-pulse rounded-md bg-muted"
        />
      ) : (
        /* 🔄 `spec 080` — 한 DOM 을 폭마다 다르게 그린다(`2xl` 7칸 주간 표 / 그 아래 요일별 카드, D3).
           🔴 7칸은 `2xl`(1536) 부터 — 1280 에서는 칸이 90px 남짓이라 연락처가 잘렸다(캡처).
           두 벌을 그리면 같은 버튼이 둘이 되어 접근 이름이 겹친다 */
        <ul aria-label="요일별 담당자" className="flex flex-col gap-2.5 2xl:grid 2xl:grid-cols-7 2xl:gap-2">
          {week.data.map(({ day, users }) => {
            const empty = users.length === 0
            return (
              <li
                key={day}
                aria-label={`${DAY_LABEL[day]}요일`}
                className={cn(
                  'flex rounded-md border 2xl:flex-col 2xl:gap-2 2xl:rounded-none 2xl:border-0 2xl:bg-transparent 2xl:p-0',
                  empty
                    ? /* 빈 요일 = 주황 점선(시안) — 비어 있는 날이 먼저 보여야 한다 */
                      'items-center gap-3 border-dashed border-warning/60 bg-warning-bg/50 px-3 py-2.5 2xl:items-stretch'
                    : 'flex-col gap-2 border-border p-3'
                )}
              >
                <div className="flex items-baseline gap-1.5 2xl:justify-center 2xl:border-b 2xl:border-border 2xl:pb-1.5">
                  <span className={cn('font-semibold', isWeekend(day) ? 'text-danger' : 'text-foreground')}>
                    {DAY_LABEL[day]}
                  </span>
                  <span className="text-caption text-muted-foreground 2xl:hidden">
                    {empty ? '비어 있음' : `${users.length}명`}
                  </span>
                </div>

                {empty ? (
                  <button
                    type="button"
                    aria-label={`${DAY_LABEL[day]}요일 담당자 추가`}
                    onClick={() => setAddDay(day)}
                    className="ml-auto flex items-center gap-1 text-caption font-semibold text-warning-foreground hover:underline 2xl:ml-0 2xl:flex-col 2xl:gap-0.5 2xl:rounded-md 2xl:border 2xl:border-dashed 2xl:border-warning/60 2xl:bg-warning-bg/50 2xl:py-2.5 2xl:hover:no-underline 2xl:hover:bg-warning-bg"
                  >
                    <PlusIcon className="size-3.5" aria-hidden />
                    담당자 지정
                    <span className="hidden font-normal text-warning-foreground/80 2xl:block">비어 있음</span>
                  </button>
                ) : (
                  <>
                    <ul className="flex flex-col gap-1.5">
                      {users.map((user) => (
                        <li
                          key={user.userSeq}
                          className="group relative flex items-start gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0 2xl:rounded-md 2xl:border 2xl:border-border 2xl:px-2.5 2xl:py-1.5 2xl:last:border 2xl:last:pb-1.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body">
                              <span className="font-semibold text-foreground">{user.userName}</span>{' '}
                              <span className="text-caption text-muted-foreground">
                                {adminRoleLabel(user.codeSeq, user.codeName)}
                              </span>
                            </p>
                            <p className="truncate text-caption tabular-nums text-muted-foreground">
                              {formatPhone(user.phone)}
                            </p>
                          </div>
                          {/* 주간 표(`2xl`)는 마우스를 올리거나 포커스할 때만(시안) · 요일별 카드는 늘 보인다(터치) */}
                          <button
                            type="button"
                            aria-label={`${DAY_LABEL[day]}요일 ${user.userName} 해제`}
                            title="해제"
                            disabled={removing?.day === day && removing.userSeq === user.userSeq}
                            onClick={() => remove.mutate({ day, userSeq: user.userSeq })}
                            className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger disabled:opacity-50 2xl:absolute 2xl:top-1 2xl:right-1 2xl:size-5 2xl:opacity-0 2xl:group-hover:opacity-100 2xl:focus-visible:opacity-100"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      aria-label={`${DAY_LABEL[day]}요일 담당자 추가`}
                      onClick={() => setAddDay(day)}
                      className="flex items-center justify-center gap-1 rounded-md border border-dashed border-border py-1.5 text-caption font-medium text-muted-foreground hover:border-point/50 hover:text-point-foreground"
                    >
                      <PlusIcon className="size-3.5" aria-hidden />
                      추가
                    </button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <EmergencyAddDialog
        day={addDay}
        onOpenChange={(open) => !open && setAddDay(null)}
        registered={week.data && addDay ? registeredOn(week.data, addDay) : new Set()}
        pending={add.isPending}
        onSubmit={(userSeqs) =>
          addDay && add.mutate({ day: addDay, userSeqs }, { onSuccess: () => setAddDay(null) })
        }
      />
    </AppDetailCard>
  )
}

export default EmergencyContactCard
