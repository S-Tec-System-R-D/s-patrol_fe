import { Fragment } from 'react'
import { RouteIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppEmpty from '@/components/app/AppEmpty'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'

import type { CourseDetailPoint } from '../../types'

/**
 * 코스 경로 다이어그램 — 편성 지점을 4개 단위로 zigzag 배치한다. **조회 전용.**
 *
 * 🔴 **`features/zone` 에서 옮겨오며 서버 타입으로 갈아탔다**(`spec 023` T357).
 * mock 타입(`ZonePointType`)과의 필드 대응:
 * `id`→`coursePointSeq` · `order`→`orderNo` · `title`→`pointName` ·
 * `timeLimit`→`courseMin` · `isActive`→`useYn` · `authenticationMethod`→`authMethod`(정수).
 *
 * 🔴🔴 **설명 줄이 사라졌다 — 서버가 편성 지점의 `memo` 를 돌려주지 않는다.**
 * `UpdateCoursePointDto` 는 `memo` 를 **받지만**(200), `GetCourseDetail` 의 `points[]` 에는
 * 그 필드가 **없다**(실측 2026-10-11 — 보내고 바로 읽어 확인했다). 즉 **쓰기 전용 필드**다.
 * 추측으로 자리를 비워 두지 않고 **줄을 없앴다**(A1) — 백엔드 요청 대상(B-30).
 *
 * 🔴 **인증수단 뱃지는 코드로만 만든다.** 편성 지점에는 `authMethodName` 이 없어
 * (목록용 `ClassificationPoint` 에만 있다) 매핑표로 라벨을 얻고, **모르는 코드면 뱃지를
 * 숨긴다** — 없는 인증수단 이름을 만들지 않는다(022·027 승계).
 *
 * ⚠️ **드래그·수정은 여기가 아니다.** 편집은 아래 "지점 순서" 카드가 맡는다(Phase 4).
 */

const ROW_SIZE = 4

const chunkRows = <T,>(arr: T[], size: number): T[][] => {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size))
  }
  return rows
}

/** 두 지점 중 **나중 지점**의 구간 시간이 그 구간의 소요시간이다 */
const laterOf = (a: CourseDetailPoint, b: CourseDetailPoint) => (a.orderNo > b.orderNo ? a : b)

const diagramCanvasStyle = {
  backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
  backgroundSize: '18px 18px',
}

const CourseDiagramCard = ({ points }: { points: CourseDetailPoint[] }) => {
  if (points.length === 0) {
    /**
     * 🔴 **"준비 중" 이 아니라 빈 상태다** — 기능은 있고 데이터가 없는 것이다
     * (027 placeholder 규약). 🔴 지점 0개 자체를 **문제로 다루지 않는다**: 경고·배너·
     * 자동 비활성화 없이 추가를 **유도**만 한다(spec 규칙 12).
     */
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
                <Fragment key={point.coursePointSeq}>
                  <div className="flex flex-col items-center">
                    <DiagramNode point={point} />
                    {nextRow && i === bridgeIndex && (
                      <DiagramVerticalConnector minutes={nextRow[0].courseMin} />
                    )}
                  </div>
                  {i < displayRow.length - 1 && (
                    <DiagramConnector minutes={laterOf(point, displayRow[i + 1]).courseMin} />
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

const DiagramNode = ({ point }: { point: CourseDetailPoint }) => {
  const active = point.useYn
  const method = toAuthMethodLabel(point.authMethod)

  return (
    <div className="flex w-32 flex-col items-center gap-2 text-center">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-panel-title font-bold ${
          active
            ? 'bg-point-bg text-point-foreground border-2 border-point'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {point.orderNo}
      </div>
      <span className="text-body font-semibold">{point.pointName}</span>
      {/* 모르는 코드면 뱃지를 숨긴다 — 없는 이름을 만들지 않는다 */}
      {method && (
        <AppBadge variant={!active ? 'muted' : method === 'QR' ? 'point' : 'success'}>
          {method}
        </AppBadge>
      )}
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
