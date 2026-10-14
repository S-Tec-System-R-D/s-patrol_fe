import { ActivityIcon, ClockIcon, RouteIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'

/**
 * 지점 상세 상단 요약 3칸 (`spec 027` Phase 3 → **`spec 031` 에서 공용 카드로 교체**).
 *
 * 🔴 **031 전까지 이 파일은 자기 카드를 직접 그렸다**(로컬 `Stat` — 카드 1장을 세로선으로
 * 3분할). 코스 상세는 `AppKpiCard` 를 쓰고 있어 **같은 자리가 화면마다 다르게** 보였다.
 * 지금은 셋 다 한 컴포넌트를 쓴다 — 이 파일은 **값을 고르고 문구를 붙이는 역할**만 한다.
 *
 * ⚠️ **목업은 4칸이지만 3칸으로 간다.** 네 번째 "QR 발행"(발행일·버전)은 서버에
 * **발행 메타가 없다**(B-23). 빈 칸을 두느니 칸 수를 줄였다 — 통계는 **채워진 숫자**가
 * 의미인데 하나가 비면 나머지 신뢰도까지 떨어진다.
 *
 * 🔴 **바를 그리는 칸이 없다**(`spec 031` §3 표). 세 값 모두 **기준값(분모)이 없다** —
 * 2주 인증·소속 코스는 "몇 개 중 몇 개" 가 아니고, 최근 순찰은 숫자도 아니다.
 */

const PointStats = ({
  patrolCount,
  lastPatrol,
  courseCount,
}: {
  /** 최근 14일 인증 횟수 — `GetPointHistory` 를 클라이언트에서 집계한 값 */
  patrolCount: number
  /** 'MM.dd HH:mm' 또는 null */
  lastPatrol: string | null
  courseCount: number
}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <AppKpiCard
      icon={ActivityIcon}
      label="2주 인증"
      value={patrolCount}
      unit="회"
      hint={patrolCount === 0 ? '순찰 기록 없음' : '최근 14일 기준'}
    />
    <AppKpiCard
      icon={ClockIcon}
      label="최근 순찰"
      value={lastPatrol ?? '—'}
      /* 🔴 **숫자가 아니라 시각이다** — 큰 숫자 자리에 그대로 넣으면 줄바꿈된다 */
      compactValue
      hint={lastPatrol ? '마지막 인증 시각' : '아직 방문 이력이 없습니다'}
    />
    <AppKpiCard
      icon={RouteIcon}
      label="소속 코스"
      value={courseCount}
      unit="개"
      hint={courseCount === 0 ? '코스에 배정되지 않음' : '이 지점이 포함된 코스'}
    />
  </div>
)

export default PointStats
