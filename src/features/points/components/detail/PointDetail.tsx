import AppButton from '@/components/app/AppButton'

import { format } from 'date-fns'
import { MapPinIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import AuthMethodDisplay from './AuthMethodDisplay'
import type { PointType } from '../../types'
import AppDialog from '@/components/app/AppDialog'
import EditPointForm from '../../form/EditPointForm'
import AppAlertDialog from '@/components/AppAlertDialog'

// 소속 코스 데모 상수 — 실제 지점-코스 연동은 Open Question(012 spec 참조)
const DEMO_BELONGING_COURSES = [
  { title: 'A동 순찰코스', isActive: true },
  { title: 'B동 순찰코스', isActive: true },
]

// 선택지점 정보
const PointDetail = ({ point }: { point: PointType }) => {
  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-2  p-4 border-b font-bold">
        <MapPinIcon size={16} strokeWidth={1.5} />
        {point.title}
      </div>
      {/* 바디 */}
      <div className="flex-1 flex flex-col gap-8 px-4 py-8 border-b">
        {/* 기본정보 */}
        <DetailSection title="기본정보">
          <DetailRow label="이름" value={point.title} />
          <DetailRow label="설명" value={point.description} />
          <DetailRow label="생성일" value={format(point.createdAt, 'yyyy-MM-dd')} />
        </DetailSection>
        {/* 소속 코스 */}
        <DetailSection title="소속 코스">
          {DEMO_BELONGING_COURSES.map((course) => (
            <ZoneRow key={course.title} title={course.title} isActive={course.isActive} />
          ))}
        </DetailSection>
        {/* 인증 수단 */}
        <DetailSection title="인증 수단">
          <AuthMethodDisplay value={point.authenticationMethod} />
          {point.authenticationMethod === 'NFC' && point.nfcTagId && (
            <div className="flex items-center justify-between rounded-sm bg-muted px-3 py-2 text-caption">
              <span className="font-medium text-muted-foreground">TAG ID</span>
              <span className="font-mono">{point.nfcTagId}</span>
            </div>
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
