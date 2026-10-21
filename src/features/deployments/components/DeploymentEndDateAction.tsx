import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarClockIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppIconButton from '@/components/app/AppIconButton'
import { Calendar } from '@/components/ui/calendar'
import { useUpdateDeploymentEndDate } from '../hooks/useUpdateDeploymentEndDate'
import type { DeploymentHistoryRow } from '../types/deployment'

const DATE_FORMAT = 'yyyy-MM-dd'

/**
 * 전입 이력 행의 **복귀일 지정** (`spec 039` T656, 배치 로직 4 — 사용자 정리 2026-10-21).
 *
 * 근무자가 종료일을 입력하지 않았거나(`미정`) 조기 복귀하면 **목적지 관리자**가 복귀일을 정한다.
 * 행 오른쪽 **아이콘 버튼** → 달력 모달(단일 날짜). 기간 필터(`AppDatePicker`)와 같은 달력이다.
 *
 * - 🔴 **시작일 이전은 고를 수 없다**(달력에서 막는다 — 서버도 400 으로 막는다고 가정)
 * - 기존 종료일이 있으면 그 날로, 없으면 **이번 달**로 열린다 — 시작월로 열면 오래 배치된 사람의 조기 복귀를
 *   지정할 때 다음 달 버튼을 여러 번 눌러야 한다(사용자 확인 2026-10-21). 아직 시작 전이면 시작월로 연다
 * - 🔴 **성공해야 닫는다**(029 규약) — 실패하면 고른 날이 남는다
 * - 행마다 자기 mutation 을 든다(셀 렌더 함수에서는 훅을 부를 수 없다 — `DeploymentRequestActions` 와 같다)
 */
const DeploymentEndDateAction = ({ row, siteSeq }: { row: DeploymentHistoryRow; siteSeq: number }) => {
  const update = useUpdateDeploymentEndDate(siteSeq)
  const [open, setOpen] = useState(false)
  const start = parseISO(row.startDt)
  const [selected, setSelected] = useState<Date | undefined>(
    row.endDt ? parseISO(row.endDt) : undefined
  )

  const today = new Date()
  const openMonth = selected ?? (today > start ? today : start)

  const submit = () => {
    if (!selected) return
    update.mutate(
      { row, endDt: format(selected, DATE_FORMAT) },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <AppDialog
      title="복귀일 지정"
      description={`${row.userName}님의 복귀일을 지정합니다. 배치 시작일(${format(start, DATE_FORMAT)}) 이후로 고를 수 있습니다.`}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <AppIconButton
          icon={CalendarClockIcon}
          aria-label={`${row.userName} 복귀일 지정`}
          title="복귀일 지정"
          className="bg-card"
        />
      }
    >
      <div className="flex flex-col items-center gap-4">
        <Calendar
          mode="single"
          locale={ko}
          defaultMonth={openMonth}
          selected={selected}
          onSelect={setSelected}
          disabled={{ before: start }}
        />
        <AppButton size="full" onClick={submit} disabled={!selected || update.isPending}>
          {selected ? `${format(selected, DATE_FORMAT)} 로 지정` : '날짜를 선택해주세요'}
        </AppButton>
      </div>
    </AppDialog>
  )
}

export default DeploymentEndDateAction
