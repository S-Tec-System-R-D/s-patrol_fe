import AppIconButton from '@/components/AppIconButton'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { PointPatrolType, ZonePatrolType } from '@/pages/service/patrol/zones/PatrolZonesPage'
import { format } from 'date-fns'
import { CheckIcon, FlagIcon, PanelRightOpenIcon, PlayIcon, TriangleAlertIcon } from 'lucide-react'

const PatrolSheet = ({ patrol }: { patrol: ZonePatrolType }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <AppIconButton icon={PanelRightOpenIcon} />

        {/* <Button variant="outline">
          
        </Button> */}
      </SheetTrigger>

      <PatrolSheetContent patrol={patrol} />
    </Sheet>
  )
}

export default PatrolSheet

export const PatrolSheetContent = ({ patrol }: { patrol: ZonePatrolType }) => {
  return (
    <SheetContent className="overflow-auto" showCloseButton={false}>
      <SheetHeader>
        <SheetTitle>순찰이력</SheetTitle>
        <SheetDescription className="">순찰이력 상세정보를 확인할 수 있어요!</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-8 py-4">
        {/* 정보 */}
        <PatrolContentBody patrol={patrol} />
        {/* <DetailSection label="순찰정보">
          <DetailRow label="구역명" value={patrol.name} />
          <DetailRow label="시작일시" value={format(patrol.startedAt, 'yyyy-MM-dd HH:mm:ss')} />
          <DetailRow label="종료일시" value={format(patrol.endedAt, 'yyyy-MM-dd HH:mm:ss')} />
          <DetailRow label="순찰결과" value={patrol.result} />
        </DetailSection>
        <DetailSection label="타임라인">
          <TimeLineDefaultCard type="START" time={patrol.startedAt} />
          {patrol.points.map((p, i) => (
            <TimeLineCard
              key={`point` + i}
              name={p.name}
              completedAt={p.completedAt}
              status={p.status}
              note={p.note}
            />
          ))}
          <TimeLineDefaultCard type="END" time={patrol.endedAt} />
        </DetailSection> */}
      </div>
    </SheetContent>
  )
}

export const PatrolContentBody = ({ patrol }: { patrol: ZonePatrolType }) => {
  return (
    <>
      {/* 정보 */}
      <DetailSection label="순찰정보">
        <DetailRow label="구역명" value={patrol.name} />
        <DetailRow label="시작일시" value={format(patrol.startedAt, 'yyyy-MM-dd HH:mm:ss')} />
        <DetailRow label="종료일시" value={format(patrol.endedAt, 'yyyy-MM-dd HH:mm:ss')} />
        <DetailRow label="순찰결과" value={patrol.result} />
      </DetailSection>
      <DetailSection label="타임라인">
        <TimeLineDefaultCard type="START" time={patrol.startedAt} />
        {patrol.points.map((p, i) => (
          <TimeLineCard
            key={`point` + i}
            name={p.name}
            completedAt={p.completedAt}
            status={p.status}
            note={p.note}
          />
        ))}
        <TimeLineDefaultCard type="END" time={patrol.endedAt} />
      </DetailSection>
    </>
  )
}

// 섹션
const DetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div className="px-4 flex flex-col gap-4 text-muted-foreground">
      <label className="text-xs">{label}</label>
      {children}
    </div>
  )
}

// 로우
const DetailRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between border-b py-2">
      <span className="">{label}</span>
      <span className="text-black">{value}</span>
    </div>
  )
}

const TimeLineDefaultCard = ({ type, time }: { type: 'START' | 'END'; time: Date }) => {
  return (
    <div
      className={`flex items-center border rounded-sm px-4 py-2 justify-between bg-stone-200 text-black`}
    >
      <div className="flex items-center gap-2">
        {type === 'START' ? (
          <div className="p-1.5 rounded-full  bg-primary text-primary-foreground">
            <PlayIcon size={16} strokeWidth={3} />
          </div>
        ) : (
          <div className="p-1.5 rounded-full bg-primary text-primary-foreground">
            <FlagIcon size={16} strokeWidth={3} />
          </div>
        )}
        <span>{type ? '순찰 시작' : '순찰 종료'}</span>
      </div>
      <div className="text-xs">{format(time, 'HH:mm')}</div>
    </div>
  )
}

// 순찰카드 타임라인 아이템
const TimeLineCard = ({ name, status, completedAt }: PointPatrolType) => {
  return (
    <div
      className={`flex items-center border rounded-sm p-4 justify-between
        ${!status ? 'bg-danger-bg border-danger text-danger' : 'text-black'}
    `}
    >
      <div className="flex items-center gap-2">
        {status ? (
          <div className="p-1.5 rounded-full border text-success">
            <CheckIcon size={16} strokeWidth={3} />
          </div>
        ) : (
          <div
            className={`p-1.5 rounded-full border ${!status ? 'bg-danger border-danger text-background' : ''}`}
          >
            <TriangleAlertIcon size={16} strokeWidth={3} />
          </div>
        )}
        <div className="">{name}</div>
      </div>

      <div className="text-xs">{format(completedAt, 'HH:mm')}</div>
    </div>
  )
}
