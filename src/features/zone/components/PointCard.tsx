import AppAlertDialog from '@/components/AppAlertDialog'
import AppIconButton from '@/components/app/AppIconButton'
import AppBadge from '@/components/app/AppBadge'
import { ClockIcon, GripVerticalIcon, LockKeyholeIcon, LockKeyholeOpenIcon } from 'lucide-react'
import { useState } from 'react'

import { ActiveMenu } from './point-card/ActiveMenu'
import type { ZonePointType } from '../types'

const PointCard = ({ data }: { data: ZonePointType }) => {
  const [isActive, setIsActive] = useState<boolean>(true)
  // 지점 데이터 전달받아야함

  /**
   * 필요 내용 및 기능
   * 1. view : 순서, 지점명, 인증수단정보, 사용여부, 소요시간
   * 2. edit : 순서(드래그앤드롭으로만 가능 — dnd-kit 미도입, 그립은 데코레이션), 사용여부(비활성화 버튼), 소요시간
   * 3. delete : 구역에서 삭제
   * 4. 비활성화 시 순서에서 제외
   *
   */

  const handleActive = (status: boolean) => {
    setIsActive(status)
  }
  const handleDelete = () => {}

  return (
    <div className="flex justify-between items-center relative p-3 border border-border rounded-sm bg-card hover:shadow-sm hover:border-point/20">
      {/* 바디 */}
      <div className="flex justify-center items-center gap-2 ">
        <GripVerticalIcon className="text-muted-foreground/50" size={16} />
        <div
          className={`flex items-center justify-center text-body font-medium rounded-sm  w-8 h-8 aspect-square p-2
          bg-point-bg text-point-foreground
          `}
        >
          {data.order}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-body font-medium">{data.title}</span>
          <span className="text-muted-foreground text-caption">{data.description}</span>
        </div>
      </div>
      {/* 푸터 */}

      <div className="flex items-center justify-end gap-4">
        <div className="flex gap-2 items-center justify-center text-muted-foreground text-caption">
          <ClockIcon size={14} />
          {data.timeLimit} 분
        </div>

        <AppBadge variant={data.authenticationMethod === 'QR' ? 'point' : 'success'}>
          {data.authenticationMethod}
        </AppBadge>
        <ActiveMenu onActive={handleActive} onDelete={handleDelete} />
      </div>
      {/* 비활성화시 오버레이로 감싸기 */}
      {!isActive && (
        <div className="absolute top-0 left-0 w-full h-full bg-muted/70 flex items-center justify-center">
          <AppAlertDialog
            size="sm"
            icon={LockKeyholeOpenIcon}
            title="지점을 활성화하시겠습니까?"
            onAction={() => handleActive(true)}
          >
            <AppIconButton className="bg-muted" iconSize={20} icon={LockKeyholeIcon} />
          </AppAlertDialog>
        </div>
      )}
    </div>
  )
}

export default PointCard
