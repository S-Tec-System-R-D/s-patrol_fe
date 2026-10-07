import AppButton from '@/components/app/AppButton'

import { format, isValid, parseISO } from 'date-fns'
import { MapPinIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import AuthMethodDisplay from './AuthMethodDisplay'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../../lib/authMethod'
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
 * ⚠️ 수정·삭제 버튼의 실제 동작 연결은 `spec 022` Phase 5(T266~T269)다. 지금은 목록·상세
 * 조회 전환까지만이라 폼·확인 모달의 기존 동작(빈 폼 / 빈 핸들러)을 유지한다.
 */

/** ISO 8601(타임존 없음) → 'yyyy-MM-dd HH:mm'. 값이 없거나 깨졌으면 '-' */
const formatPatrolDt = (value: string | null): string => {
  if (!value) return '-'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : '-'
}

const PointDetail = ({ point }: { point: PointDetailData }) => {
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
            title="지점 수정"
            description="지점 정보를 수정할 수 있습니다."
            trigger={
              <AppButton icon={SquarePenIcon} size="full" variant="sub">
                수정
              </AppButton>
            }
          >
            <EditPointForm />
          </AppDialog>
        </div>
        <div className="flex-1">
          <AppAlertDialog
            size="sm"
            icon={Trash2Icon}
            variant="destructive"
            title="지점을 삭제하시겠습니까?"
            onAction={() => {}}
          >
            <AppButton icon={Trash2Icon} size="full" variant="destructive">
              삭제
            </AppButton>
          </AppAlertDialog>
        </div>
      </div>
    </div>
  )
}

export default PointDetail
