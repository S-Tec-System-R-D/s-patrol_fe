import { useState } from 'react'
import { PhoneIcon, PlusIcon, TriangleAlertIcon, XIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppEmpty from '@/components/app/AppEmpty'
import AppLinkButton from '@/components/app/AppLinkButton'
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
 * - 요일 7행(토 · 일 빨강 — 048 그대로) · 행마다 담당자 칩(이름 · 권한 · 연락처) + [×] 해제 + [추가].
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
        <table aria-label="요일별 담당자" className="w-full text-body">
          <thead>
            <tr className="border-b border-border text-left text-caption text-muted-foreground">
              <th scope="col" className="w-14 px-2 py-2 font-medium">
                요일
              </th>
              <th scope="col" className="px-2 py-2 font-medium">
                담당자
              </th>
            </tr>
          </thead>
          <tbody>
            {week.data.map(({ day, users }) => (
              <tr key={day} className="border-b border-border last:border-0">
                <th
                  scope="row"
                  className={cn(
                    'px-2 py-2 text-left font-semibold',
                    isWeekend(day) ? 'text-danger' : 'text-foreground'
                  )}
                >
                  {DAY_LABEL[day]}
                </th>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {users.map((user) => (
                      <span
                        key={user.userSeq}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pr-1 pl-2.5 text-caption"
                      >
                        <span className="font-semibold text-foreground">{user.userName}</span>
                        <span className="text-muted-foreground">
                          {adminRoleLabel(user.codeSeq, user.codeName)}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {formatPhone(user.phone)}
                        </span>
                        <button
                          type="button"
                          aria-label={`${DAY_LABEL[day]}요일 ${user.userName} 해제`}
                          title="해제"
                          disabled={removing?.day === day && removing.userSeq === user.userSeq}
                          onClick={() => remove.mutate({ day, userSeq: user.userSeq })}
                          className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-danger-bg hover:text-danger disabled:opacity-50"
                        >
                          <XIcon className="size-3" />
                        </button>
                      </span>
                    ))}
                    <AppLinkButton
                      icon={PlusIcon}
                      aria-label={`${DAY_LABEL[day]}요일 담당자 추가`}
                      onClick={() => setAddDay(day)}
                    >
                      추가
                    </AppLinkButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
