import { LockIcon, SquarePenIcon } from 'lucide-react'

import AppLinkButton from '@/components/app/AppLinkButton'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { cn } from '@/lib/utils'

import type { CoursePin } from '../../lib/courseCoords'
import type { CourseDetailPoint } from '../../types'
import CourseMapCard from './CourseMapCard'

/**
 * 순찰 경로 — `spec 074` T1234. `지점 순서` · `순찰 동선` 두 카드를 하나로 합쳤다(시안 `개선 · 코스 상세`).
 *
 * 🔄 **`spec 084`(사용자 결정 2026-11-20 — 목업 `05-코스-상세` 구성으로)**: 전체 폭 지도 → 아래에 **가로 지점 줄**
 * (번호 점 · 이름 · 구간 시간). 전에는 지도 옆 세로 목록에 지점별 인증률 막대를 그렸는데, 🔴 그 인증률은
 * **실제 값이 아니라 자리표시 값**이었다(서버가 지점별 인증률을 주지 않는다 — OQ-074-A). 가로 줄은 순서 · 이름 ·
 * 구간 시간 · 인증수단만 적는다 — 모두 실제 값이다. (`pointRateStub` · `CourseDiagramCard` 는 이제 화면에서 쓰지 않는다.)
 * - 한 줄 최대 10칸 · 넘으면 다음 줄(대시보드 지점 경로와 같은 규칙).
 * - 좌표가 하나도 없으면 지도 없이 지점 줄만 그린다(전에는 다이어그램으로 바꿨다 — 지점 줄이 같은 것을 말한다).
 *
 * 🔴 편집은 이 카드의 `편성 편집` → 페이지가 `CoursePointEditor` 모달을 연다(전량 전송 B-25 는 편집기 몫).
 * 🔴 **번호는 배열 위치**다(`orderNo` 는 서버가 중복 값을 저장한다 · 지도 핀과 같은 번호 — `courseCoords.ts`).
 * 🔄 **미사용 지점은 번호 자리에 자물쇠 + 회색 이름**(사용자 결정 2026-11-13).
 *    번호는 건너뛴다(1 · 2 · 🔒 · 4) — 지도 핀 번호와 맞춘다.
 */

/** 한 줄에 놓는 칸 수 */
const PER_ROW = 10

interface CourseRouteCardProps {
  points: CourseDetailPoint[]
  pins: CoursePin[]
  missing: number
  onEdit: () => void
}

const CourseRouteCard = ({ points, pins, missing, onEdit }: CourseRouteCardProps) => {
  const sorted = [...points].sort((a, b) => a.orderNo - b.orderNo)
  const columns = Math.min(sorted.length, PER_ROW)

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <h2 className="text-panel-title font-semibold">순찰 경로</h2>
          {sorted.length > 0 && (
            <span className="text-caption text-muted-foreground tabular-nums">{sorted.length}</span>
          )}
        </span>
        <AppLinkButton icon={SquarePenIcon} aria-label="지점 편성 편집" onClick={onEdit}>
          편성 편집
        </AppLinkButton>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-caption text-muted-foreground">편성된 지점이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-[18px]">
          {pins.length > 0 && <CourseMapCard pins={pins} missing={missing} embedded />}

          <ol
            aria-label="지점 순서"
            className="grid gap-y-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {sorted.map((point, index) => {
              const method = toAuthMethodLabel(point.authMethod)
              // 구간 시간은 "이 지점까지" 다 — 첫 지점에는 없다
              const note = [index > 0 ? `${point.courseMin}분` : null, method].filter(Boolean).join(' · ')
              return (
                <li key={point.coursePointSeq} className="relative flex min-w-0 flex-col items-center text-center">
                  {/* 앞 칸의 점 오른쪽 4px 에서 이 칸의 점 왼쪽 4px 까지 — 줄의 첫 칸은 선이 없다 */}
                  {index % PER_ROW !== 0 && (
                    <span
                      aria-hidden
                      className="absolute top-[7px] right-[calc(50%+12px)] left-[calc(-50%+12px)] h-0.5 rounded-full bg-border"
                    />
                  )}
                  {point.useYn ? (
                    <span className="relative grid size-4 place-items-center rounded-full border border-point/30 bg-point-bg text-[10px] leading-none font-bold text-point tabular-nums">
                      {index + 1}
                    </span>
                  ) : (
                    <span className="relative grid size-4 place-items-center rounded-full bg-muted text-muted-foreground">
                      <LockIcon size={9} aria-hidden />
                      <span className="sr-only">미사용</span>
                    </span>
                  )}
                  <span
                    className={cn(
                      'mt-2 w-full truncate px-1 text-caption',
                      point.useYn ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {point.pointName}
                  </span>
                  <span className="h-4 text-[11px] leading-4 text-muted-foreground tabular-nums">{note || '-'}</span>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}

export default CourseRouteCard
