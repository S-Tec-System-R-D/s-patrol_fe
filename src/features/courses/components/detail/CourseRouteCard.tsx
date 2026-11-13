import { LockIcon, NfcIcon, QrCodeIcon, SquarePenIcon } from 'lucide-react'

import AppEmpty from '@/components/app/AppEmpty'
import AppLinkButton from '@/components/app/AppLinkButton'
import { HISTORY_DAYS } from '@/features/course-history/lib/historyRange'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { cn } from '@/lib/utils'

import type { CoursePin } from '../../lib/courseCoords'
import { placeholderPointRates } from '../../lib/pointRateStub'
import type { CourseDetailPoint } from '../../types'
import CourseDiagramCard from './CourseDiagramCard'
import CourseMapCard from './CourseMapCard'

/**
 * 순찰 경로 — `spec 074` T1234. `지점 순서` · `순찰 동선` 두 카드를 하나로 합쳤다(시안 `개선 · 코스 상세`).
 * 왼쪽 지도(좌표가 하나도 없으면 다이어그램 — `spec 032` 조건부 교체 그대로) · 오른쪽 지점 목록.
 *
 * 🔴🔴 **지점별 인증률은 자리표시 값이다**(OQ-074-A · 사용자 결정 2026-11-12) — `placeholderPointRates`.
 * 실데이터와 맞지 않는다. 가장 낮은 지점만 주황으로 강조한다(시안).
 * 🔴 편집은 이 카드의 `편성 편집` → 페이지가 `CoursePointEditor` 모달을 연다(전량 전송 B-25 는 편집기 몫).
 * 🔴 **번호는 배열 위치**다(`orderNo` 는 서버가 중복 값을 저장한다 · 지도 핀과 같은 번호 — `courseCoords.ts`).
 * 🔄 **미사용 지점은 번호 자리에 자물쇠 + 행 회색**(사용자 결정 2026-11-13) — `미사용` 뱃지가 이름을 밀어 잘랐다.
 *    번호는 건너뛴다(1 · 2 · 🔒 · 4) — 지도 핀 번호와 맞춘다.
 */

interface CourseRouteCardProps {
  points: CourseDetailPoint[]
  pins: CoursePin[]
  missing: number
  /** 받은 회차 수 — 인증률 분모 자리 */
  runs: number
  onEdit: () => void
}

const MethodIcon = ({ code }: { code: number }) => {
  const label = toAuthMethodLabel(code)
  if (!label) return null
  const Icon = label === 'QR' ? QrCodeIcon : NfcIcon
  return (
    <span className="inline-flex items-center gap-0.5">
      <Icon size={11} aria-hidden />
      {label}
    </span>
  )
}

const CourseRouteCard = ({ points, pins, missing, runs, onEdit }: CourseRouteCardProps) => {
  const sorted = [...points].sort((a, b) => a.orderNo - b.orderNo)
  const rates = placeholderPointRates(sorted, runs)
  const ratios = sorted.map((point) => {
    const rate = rates.get(point.coursePointSeq)
    return rate && rate.total > 0 ? rate.checked / rate.total : null
  })
  // 🔴 미사용 지점은 강조하지 않는다 — 돌지 않는 지점이 "가장 약한 지점" 으로 읽히면 안 된다
  const known = ratios.filter((ratio, index): ratio is number => ratio !== null && sorted[index].useYn)
  const lowest = known.length > 1 ? Math.min(...known) : null

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-baseline gap-2">
          <h2 className="text-panel-title font-semibold">순찰 경로</h2>
          <span className="text-caption text-muted-foreground">지점별 인증률 · 최근 {HISTORY_DAYS}일</span>
        </span>
        <AppLinkButton icon={SquarePenIcon} aria-label="지점 편성 편집" onClick={onEdit}>
          편성 편집
        </AppLinkButton>
      </div>

      {sorted.length === 0 ? (
        <AppEmpty
          illustration="route"
          title="편성된 지점이 없습니다"
          description="코스에 지점을 추가하면 순서대로 표시됩니다."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {pins.length > 0 ? (
            <CourseMapCard pins={pins} missing={missing} embedded />
          ) : (
            <CourseDiagramCard points={sorted} />
          )}

          <div className="flex min-w-0 flex-col">
            <ol aria-label="지점 순서" className="flex flex-col">
              {sorted.map((point, index) => {
                const rate = rates.get(point.coursePointSeq)
                const ratio = ratios[index]
                const weak = point.useYn && lowest !== null && ratio === lowest
                return (
                  <li
                    key={point.coursePointSeq}
                    className={cn(
                      'flex items-center gap-3 border-b border-border px-2 py-2.5 last:border-0',
                      !point.useYn && 'bg-muted/70'
                    )}
                  >
                    {point.useYn ? (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background">
                        {index + 1}
                      </span>
                    ) : (
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-background text-muted-foreground">
                        <LockIcon size={12} aria-hidden />
                        <span className="sr-only">미사용</span>
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          'truncate text-body font-semibold',
                          point.useYn ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {point.pointName}
                      </span>
                      <span className="flex items-center gap-1 text-caption text-muted-foreground tabular-nums">
                        <MethodIcon code={point.authMethod} />
                        {rate && rate.total > 0 && (
                          <span>
                            · {rate.checked}/{rate.total}회
                          </span>
                        )}
                      </span>
                    </span>
                    {ratio !== null && (
                      <>
                        <span aria-hidden className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                          <span
                            className={cn('block h-full rounded-full', weak ? 'bg-warning' : 'bg-muted-foreground/60')}
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </span>
                        <span
                          className={cn(
                            'w-10 text-right text-caption font-semibold tabular-nums',
                            weak ? 'text-warning-foreground' : 'text-foreground'
                          )}
                        >
                          {Math.round(ratio * 100)}%
                        </span>
                      </>
                    )}
                  </li>
                )
              })}
            </ol>
            <p className="pt-2 text-caption text-muted-foreground">
              경로 순서 기준 · 인증률은 화면 확인용 예시 값입니다
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default CourseRouteCard
