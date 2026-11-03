import { cn } from '@/lib/utils'

import { pointSteps } from '../lib/activeCourse'
import type { DashboardCoursePoint, PointStepStatus } from '../types'

/**
 * 진행 중 회차의 지점 단계 — `spec 067`. 상태는 서버 `status` 그대로(`spec 068` — `pointSteps`).
 *
 * 🔴 **뱃지형이다**(사용자 결정 2026-10-30) — 번호 + 지점명을 상태색 뱃지 하나로 묶고 선을 바로 붙인다.
 * 번호 원 + 이름(숫자 스테퍼)과 나란히 비교해 골랐다: 선이 이어진 느낌이 강하고 색만으로 어디까지 갔는지 보인다.
 * 🔴 **색은 회차 상세 지도 핀과 같은 규칙이다** — 인증 `success` · 건너뜀(미인증) `warning` · 아직 안 감 회색.
 * 파랑(`point`)은 **다음 지점** 하나에만 쓴다(점선 뱃지 + 점선 연결).
 * 🔴 **가로 스크롤 대신 줄바꿈** — 지점이 12개여도 390px 에서 전부 읽힌다.
 */

/** 뱃지 — 바탕은 상태의 옅은 색 */
const pillStyles: Record<PointStepStatus, string> = {
  done: 'border-success/30 bg-success-bg text-success-foreground',
  skipped: 'border-warning/40 bg-warning-bg text-warning-foreground',
  next: 'border-dashed border-point bg-point-bg font-semibold text-point',
  pending: 'border-border bg-card text-muted-foreground',
}

/** 뱃지 안 번호 원 — 진한 색 */
const numberStyles: Record<PointStepStatus, string> = {
  done: 'bg-success text-white',
  skipped: 'bg-warning text-white',
  next: 'bg-point text-white',
  pending: 'bg-muted text-muted-foreground',
}

const statusText: Record<PointStepStatus, string> = {
  done: '인증',
  skipped: '건너뜀',
  next: '다음',
  pending: '대기',
}

/**
 * 단계 **앞** 연결선 — 지나온 구간은 실선, 지금 가는 구간은 점선, 남은 구간은 옅은 선.
 *
 * 🔴 **줄 끝에 선이 혼자 남지 않게**(사용자 지적 2026-10-30) — 선을 단계 **뒤**에 붙이면 줄바꿈될 때
 * 윗줄 끝에 다음 단계 없는 선이 남는다. 그래서 **앞**에 붙이고, 목록을 선 폭(24px)만큼 왼쪽으로
 * 당겨 잘라낸다(`-ml-[24px]` + 감싼 `overflow-hidden`) — 줄 첫머리의 선은 늘 잘린 자리에 선다.
 * ⚠️ 폭(`w-6`)을 바꾸면 `-ml-[24px]` 도 같이 바꾼다.
 */
const Connector = ({ kind }: { kind: 'passed' | 'current' | 'rest' }) => (
  <span
    aria-hidden
    className={cn(
      'w-6 shrink-0 border-t-2',
      kind === 'passed' && 'border-success/60',
      kind === 'current' && 'border-dashed border-point',
      kind === 'rest' && 'border-border'
    )}
  />
)

interface CourseStepperProps {
  points: DashboardCoursePoint[]
}

const CourseStepper = ({ points }: CourseStepperProps) => {
  const steps = pointSteps(points)
  const nextIndex = steps.indexOf('next')

  return (
    // `py-1.5` — 현재 위치 퍼지는 원(1.5배 = 사방 5px)이 위아래로 잘리지 않게. 왼쪽은 여백을 두지 않는다 —
    // 선이 뱃지에 바로 붙어 여백을 두면 줄 첫머리에 선 끝이 보인다. 대신 번호 원을 뱃지 안쪽 5px
    // (`pl-1` + 테두리)에 둬 퍼지는 원이 왼쪽에서도 잘리지 않는다
    <div className="overflow-hidden py-1.5">
      <ol className="-ml-[24px] flex flex-wrap items-center gap-y-3" aria-label="지점 진행">
        {/* 아무 지점도 안 찍었으면 맨 앞에 출발 점 — 다음 지점까지 점선으로 잇는다 */}
        {nextIndex === 0 && (
          <li className="flex items-center text-caption text-muted-foreground">
            <Connector kind="rest" />
            <span aria-hidden className="size-2 rounded-full bg-point" />
            <span className="ml-1.5">출발</span>
          </li>
        )}
        {points.map((point, index) => {
          const step = steps[index]
          // 이 단계로 들어오는 선 — 다음 지점으로 가는 구간만 점선
          const connector = index === nextIndex ? 'current' : index < nextIndex || nextIndex === -1 ? 'passed' : 'rest'
          return (
            <li key={point.detailSeq} className="flex items-center">
              <Connector kind={connector} />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-2.5 pl-1 text-body whitespace-nowrap',
                  pillStyles[step]
                )}
              >
                {/* 🔴 **숫자 세로 중앙**(사용자 지적 2026-10-30) — 중앙 정렬만으로는 Pretendard 숫자가 위로
                    뜬다. 투명 1px 테두리 + 줄 높이 20px(`leading-5`)로 맞춘다(4배 캡처로 측정 — 18px 은 0.75px 위로 떴다) */}
                <span
                  className={cn(
                    'relative size-5 shrink-0 rounded-full border border-transparent text-center text-[10.5px] leading-5 font-bold tabular-nums',
                    numberStyles[step]
                  )}
                >
                  {step === 'next' && (
                    <span
                      aria-hidden
                      className="step-pulse-anim absolute inset-0 rounded-full bg-point/40 motion-reduce:hidden"
                    />
                  )}
                  {point.orderNo}
                </span>
                {point.pointName}
                <span className="sr-only"> ({statusText[step]})</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default CourseStepper
