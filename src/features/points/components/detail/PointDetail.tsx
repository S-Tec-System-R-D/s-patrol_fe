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
import AppBadge from '@/components/app/AppBadge'
import AppDialog from '@/components/app/AppDialog'
import EditPointForm from '../../form/EditPointForm'
import AppAlertDialog from '@/components/AppAlertDialog'

/**
 * 선택한 지점의 상세 본문 (`spec 027` Phase 2).
 *
 * ⚠️ 타입 `PointDetail` 과 이름이 같아 타입을 `PointDetailData` 로 받는다.
 * 타입명은 `api-spec.md` 실측 이름을 따른다(`CLAUDE.md` B4).
 *
 * 🔴 **027 에서 패널 → 페이지가 됐다.** 바뀐 것 세 가지:
 * 1. **액션이 하단 풋터에서 헤더 우측으로 올라왔다.** `patterns.md` §11(마스터-디테일의
 *    액션 풋터)은 **우측 패널**을 전제한 패턴이다. 전체 폭 페이지에서 하단 full-width
 *    버튼 2개는 폭에 비해 과하고, 본문이 길면 **스크롤 아래로 밀려 보이지 않는다.**
 * 2. **본문을 2단으로 폈다**(`xl` 이상). 340px 패널일 때는 세로로 쌓을 수밖에 없었다.
 *    `xl` 미만은 1단 — 단계는 `xl` 하나다(`design-system.md` §2-5).
 * 3. **중복 제거** — "이름" 행은 **헤더 제목과 같은 값**이고, "사용여부" 행은 헤더
 *    뱃지로 올렸다. 패널 헤더는 작아서 티가 안 났지만 페이지에서는 바로 위에 같은
 *    값이 두 번 보인다.
 *
 * 🔴 **생성일 행이 없다.** 서버 응답에 `createdAt` 이 없다(OQ-022-I 해소 — 실측으로
 * 확인). 대신 서버가 주는 **최근 순찰**을 보여준다. ⚠️ 목업(`지점관리-신규.png`)에는
 * 생성일이 있어 **목업과 갈라진 지점**이다(OQ-027-B).
 *
 * 🔴 **수정 모달은 성공해야 닫는다**(§4) — 먼저 닫으면 실패 시 입력값이 사라진다.
 * 반면 **삭제 확인 모달은 확인 즉시 닫는다**: 잃을 입력이 없고 거부 사유는 전역 토스트가
 * 전달한다. 닫기 제어를 추가하는 것은 얻는 것 없이 `AppAlertDialog` 계약만 늘린다(A6).
 *
 * 🔴 **삭제 거부 시 아무것도 건드리지 않는다**(§4). 무효화·`onDeleted` 는 `onSuccess` 에만
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
  /** 삭제 성공 시 호출. 페이지가 목록으로 되돌린다 — 없어진 지점에 머물 수 없다 */
  onDeleted?: () => void
}) => {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const removal = useMutation({
    mutationFn: deletePoint,
    onSuccess: async () => {
      // 🔴 이동을 **무효화보다 먼저** 한다. 목록이 먼저 갱신되면 사라진 지점의 상세를
      // 다시 조회해 "찾을 수 없음" 이 한 번 깜빡인다.
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
      {/* 헤더 — 제목 + 상태 + 액션 */}
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <MapPinIcon size={16} strokeWidth={1.5} className="shrink-0" />
        <span className="font-bold">{point.name}</span>
        {point.useYn ? (
          <AppBadge variant="success">사용</AppBadge>
        ) : (
          <AppBadge variant="muted">미사용</AppBadge>
        )}

        {/* 액션은 우측 정렬 — 본문이 길어도 스크롤 위에 남는다 */}
        <div className="ml-auto flex items-center gap-2">
          <AppDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            title="지점 수정"
            description="지점 정보를 수정할 수 있습니다."
            trigger={
              <AppButton icon={SquarePenIcon} variant="sub">
                수정
              </AppButton>
            }
          >
            <EditPointForm point={point} onSuccess={() => setEditOpen(false)} />
          </AppDialog>

          <AppAlertDialog
            size="sm"
            icon={Trash2Icon}
            variant="destructive"
            title="지점을 삭제하시겠습니까?"
            onAction={() => removal.mutate(point.pointSeq)}
          >
            <AppButton icon={Trash2Icon} variant="destructive" disabled={removal.isPending}>
              삭제
            </AppButton>
          </AppAlertDialog>
        </div>
      </div>

      {/* 본문 — xl 이상 2단, 미만 1단 */}
      <div className="grid grid-cols-1 gap-8 p-6 xl:grid-cols-2">
        <DetailSection title="기본정보">
          <DetailRow label="설명" value={point.memo?.trim() || '-'} />
          <DetailRow label="최근 순찰" value={lastPatrol} />
        </DetailSection>

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

        {/* 코스는 개수가 가변이라 전체 폭을 쓴다 */}
        <div className="xl:col-span-2">
          <DetailSection title="소속 코스">
            {point.courseList.length === 0 ? (
              <span className="text-caption text-muted-foreground">소속된 코스가 없습니다.</span>
            ) : (
              point.courseList.map((course) => (
                <ZoneRow key={course.courseSeq} title={course.courseName} />
              ))
            )}
          </DetailSection>
        </div>
      </div>
    </div>
  )
}

export default PointDetail
