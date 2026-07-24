import { Fragment } from 'react'
import { RouteIcon } from 'lucide-react'
import AppEmpty from '@/components/app/AppEmpty'
import AppBadge from '@/components/app/AppBadge'
import type { ZonePointType } from '../types'

const ROW_SIZE = 4

const chunkRows = <T,>(arr: T[], size: number): T[][] => {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size))
  }
  return rows
}

const laterOf = (a: ZonePointType, b: ZonePointType) => (a.order > b.order ? a : b)

/**
 * 코스 경로 다이어그램 카드. 체크포인트를 4개 단위로 zigzag 배치한다.
 * 조회 전용 — 드래그·수정·삭제 액션은 하단 "지점 순서·편집" 카드가 담당한다.
 */
const diagramCanvasStyle = {
  backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
}

const CourseDiagramCard = ({ points }: { points: ZonePointType[] }) => {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-8" style={diagramCanvasStyle}>
        <AppEmpty
          icon={RouteIcon}
          title="지점이 없습니다"
          description="코스에 지점을 추가하면 경로가 표시됩니다."
        />
      </div>
    )
  }

  const rows = chunkRows(points, ROW_SIZE)

  return (
    <div className="rounded-lg border border-border bg-muted/40 p-6" style={diagramCanvasStyle}>
      <div className="flex flex-col">
        {rows.map((naturalRow, rowIndex) => {
          const reversed = rowIndex % 2 === 1
          const displayRow = reversed ? [...naturalRow].reverse() : naturalRow
          const nextRow = rows[rowIndex + 1]
          const bridgeIndex = reversed ? 0 : displayRow.length - 1

          return (
            <div key={rowIndex} className="flex items-start">
              {displayRow.map((point, i) => (
                <Fragment key={point.id}>
                  <div className="flex flex-col items-center">
                    <DiagramNode point={point} />
                    {nextRow && i === bridgeIndex && (
                      <DiagramVerticalConnector minutes={nextRow[0].timeLimit} />
                    )}
                  </div>
                  {i < displayRow.length - 1 && (
                    <DiagramConnector minutes={laterOf(point, displayRow[i + 1]).timeLimit} />
                  )}
                </Fragment>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseDiagramCard

const DiagramNode = ({ point }: { point: ZonePointType }) => {
  const active = point.isActive

  return (
    <div className="flex w-32 flex-col items-center gap-2 text-center">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-panel-title font-bold ${
          active
            ? 'bg-point-bg text-point-foreground border-2 border-point'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {point.order}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-body font-semibold">{point.title}</span>
        <span className="text-caption text-muted-foreground line-clamp-1">{point.description}</span>
      </div>
      <AppBadge variant={point.authenticationMethod === 'QR' ? 'point' : 'success'}>
        {point.authenticationMethod}
      </AppBadge>
    </div>
  )
}

const DiagramConnector = ({ minutes }: { minutes: number }) => (
  <div className="flex min-w-8 flex-1 flex-col items-center justify-center px-1 pt-5">
    <span className="mb-1 text-label text-muted-foreground">{minutes}분</span>
    <div className="w-full border-t-2 border-dashed border-point" />
  </div>
)

const DiagramVerticalConnector = ({ minutes }: { minutes: number }) => (
  <div className="flex flex-col items-center py-1">
    <div className="h-4 border-l-2 border-dashed border-point" />
    <span className="text-label text-muted-foreground">{minutes}분</span>
    <div className="h-4 border-l-2 border-dashed border-point" />
  </div>
)
