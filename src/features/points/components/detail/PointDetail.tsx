import AppButton from '@/components/app/AppButton'

import { format } from 'date-fns'
import { MapPinIcon, SquarePenIcon, Trash2Icon } from 'lucide-react'
import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import type { PointType } from '../../types'
import AppDialog from '@/components/app/AppDialog'
import EditPointForm from '../../form/EditPointForm'
import AppAlertDialog from '@/components/AppAlertDialog'

// 선택지점 정보
const PointDetail = ({ point }: { point: PointType }) => {
  return (
    <div className="flex-1 flex flex-col bg-background">
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
        {/* 소속 구역 */}
        <DetailSection title="소속 구역">
          <ZoneRow idx={'2'} title="A동 순찰구역" />
          <ZoneRow idx={'3'} title="B동 순찰구역" />
        </DetailSection>
      </div>
      {/* 푸터 */}
      <div className="flex flex-col gap-4 p-4">
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
  )
}

export default PointDetail
