import AppButton from '@/components/app/AppButton'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isValid, parseISO } from 'date-fns'
import { useState } from 'react'
import { MapPinIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import AuthMethodDisplay from './AuthMethodDisplay'
import { deletePoint } from '../../api/deletePoint'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../../lib/authMethod'
import { pointKeys } from '../../queryKeys'
import type { PointDetail as PointDetailData } from '../../types'
import AppDialog from '@/components/app/AppDialog'
import EditPointForm from '../../form/EditPointForm'
import AppAlertDialog from '@/components/AppAlertDialog'

/**
 * 선택한 지점의 상세 카드.
 *
 * ⚠️ 타입 `PointDetail` 과 이 컴포넌트의 이름이 같아 타입을 `PointDetailData` 로 받는다.
 * 타입명은 `api-spec.md` 실측 이름을 따른다(`CLAUDE.md` B4).
 *
 * 🔴 **"생성일" 행이 사라졌다.** 서버 응답에 `createdAt` 이 없다(OQ-022-I) — 022 전까지는
 * mock 의 `createdAt` 을 쓰고 있었다. 대신 서버가 주는 **최근 순찰**(`lastPatrolDt` +
 * `lastPatrolUserName`)을 보여준다. 생성일이 실제로 필요하면 백엔드에 요청한다(B4).
 *
 * 🔴 **수정 모달은 성공해야 닫는다**(§4) — 먼저 닫으면 실패 시 입력값이 사라진다.
 * 반면 **삭제 확인 모달은 확인 즉시 닫는다**: 사용자가 입력한 값이 없어 잃을 것이 없고,
 * 거부 사유는 전역 토스트가 전달한다. 닫기 제어를 추가하는 것은 얻는 것 없이
 * `AppAlertDialog` 의 계약만 늘린다(A6).
 *
 * 🔴 **삭제 거부 시 목록을 건드리지 않는다**(§4). 무효화·선택 해제는 `onSuccess` 에만
 * 있다. 사유 노출은 `queryClient.ts:18-20` 의 전역 `MutationCache.onError` 가 띄우는
 * 토스트가 전담하며, 여기서 메시지를 또 그리지 않는다(규칙 3 — 중복 노출 금지).
 */

/** ISO 8601(타임존 없음) → 'yyyy-MM-dd HH:mm'. 값이 없거나 깨졌으면 '-' */
const formatPatrolDt = (value: string | null): string => {
  if (!value) return '-'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : '-'
}

const PointDetail = ({
  point,
  onDeleted,
}: {
  point: PointDetailData
  /** 삭제 성공 시 부모의 선택 상태를 비운다 — 없어진 지점을 계속 선택하고 있을 수 없다 */
  onDeleted?: () => void
}) => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const removal = useMutation({
    mutationFn: deletePoint,
    onSuccess: async () => {
      // 🔴 선택 해제를 **무효화보다 먼저** 한다. 목록이 먼저 갱신되면 사라진 지점을
      // 선택한 채 상세를 다시 조회해 "찾을 수 없음" 이 한 번 깜빡인다.
      onDeleted?.()
      await queryClient.invalidateQueries({ queryKey: pointKeys.lists })
    },
  })

  const method = toAuthMethodLabel(point.authMethod)
  const lastPatrol = point.lastPatrolDt
    ? `${formatPatrolDt(point.lastPatrolDt)}${point.lastPatrolUserName ? ` · ${point.lastPatrolUserName}` : ''}`
    : '순찰 기록 없음'

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2  p-4 border-b font-bold">
        <MapPinIcon size={16} strokeWidth={1.5} />
        {point.name}
      </div>
      {/* 바디 */}
      <div className="flex-1 flex flex-col gap-8 px-4 py-8 border-b">
        {/* 기본정보 */}
        <DetailSection title="기본정보">
          <DetailRow label="이름" value={point.name} />
          <DetailRow label="설명" value={point.memo ?? '-'} />
          <DetailRow label="사용여부" value={point.useYn ? '사용' : '미사용'} />
          <DetailRow label="최근 순찰" value={lastPatrol} />
        </DetailSection>
        {/* 소속 코스 */}
        <DetailSection title="소속 코스">
          {point.courseList.length === 0 ? (
            <span className="text-caption text-muted-foreground">소속된 코스가 없습니다.</span>
          ) : (
            point.courseList.map((course) => (
              <ZoneRow key={course.courseSeq} title={course.courseName} />
            ))
          )}
        </DetailSection>
        {/* 인증 수단 */}
        <DetailSection title="인증 수단">
          <AuthMethodDisplay value={method} />
          {method === 'NFC' && point.nfcTagId && (
            <div className="flex items-center justify-between rounded-sm bg-muted px-3 py-2 text-caption">
              <span className="font-medium text-muted-foreground">TAG ID</span>
              <span className="font-mono">{point.nfcTagId}</span>
            </div>
          )}
          {/* 9·10 외 코드면 세그먼트 둘 다 비강조라 설명이 필요하다 */}
          {method === null && (
            <span className="text-caption text-muted-foreground">
              {resolveAuthMethodLabel(point.authMethod, point.authMethodName) ||
                '인증수단 정보를 확인할 수 없습니다.'}
            </span>
          )}
        </DetailSection>
      </div>
      {/* 푸터 */}
      <div className="flex gap-2 p-4">
        <div className="flex-1">
          <AppDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            title="지점 수정"
            description="지점 정보를 수정할 수 있습니다."
            trigger={
              <AppButton icon={SquarePenIcon} size="full" variant="sub">
                수정
              </AppButton>
            }
          >
            <EditPointForm point={point} onSuccess={() => setEditOpen(false)} />
          </AppDialog>
        </div>
        <div className="flex-1">
          <AppAlertDialog
            size="sm"
            icon={Trash2Icon}
            variant="destructive"
            title="지점을 삭제하시겠습니까?"
            onAction={() => removal.mutate(point.pointSeq)}
          >
            <AppButton
              icon={Trash2Icon}
              size="full"
              variant="destructive"
              disabled={removal.isPending}
            >
              삭제
            </AppButton>
          </AppAlertDialog>
        </div>
      </div>
    </div>
  )
}

export default PointDetail
