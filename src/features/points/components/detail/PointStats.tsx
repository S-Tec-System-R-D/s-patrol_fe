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
 * 🔴 **`spec 031` 확장에서 두 칸에 바가 붙었다.** 착수 때는 "셋 다 분모가 없다" 고 봤는데,
 * ① 2주 인증의 분모는 **`attempted`**(완료 + 미완료)로 **결함을 고치다가 생겼고**
 * (2026-10-14 — 그 전에는 미완료를 인증으로 세고 있었다), ② 최근 순찰은 숫자가 아니지만
 * **일별 점등**으로 "그날 했나" 를 보여줄 수 있다(버킷이 이미 있다).
 * 🔴 **소속 코스에는 여전히 바가 없다** — 분모(사업장 전체 코스 수)가 **요청 +1** 이라
 * 넣지 않기로 했다(사용자 결정 2026-10-14).
 */

const PointStats = ({
  patrolCount,
  attemptedCount,
  ticks,
  lastPatrol,
  sinceLabel,
  courseCount,
  firstCourseName,
}: {
  /** 최근 14일 **인증(완료)** 횟수 — 🔴 미완료는 빠진다(결함 수정 2026-10-14) */
  patrolCount: number
  /** 같은 기간 **대상 순찰** 횟수(완료 + 미완료) — 인증률의 분모 */
  attemptedCount: number
  /** 날짜별 점등 14칸 */
  ticks: boolean[]
  /** 'MM.dd HH:mm' 또는 null */
  lastPatrol: string | null
  /** `9시간 전` 같은 경과 표기. 미래 시각이면 `null` */
  sinceLabel: string | null
  courseCount: number
  /** 소속 코스 중 하나의 이름 — 🔴 **분모는 넣지 않는다**(요청 +1 회피) */
  firstCourseName: string | null
}) => {
  /** 🔴 분모가 0 이면 비율을 만들지 않는다 — `0%` 는 "하나도 못 했다" 로 읽힌다 */
  const rate = attemptedCount > 0 ? patrolCount / attemptedCount : null

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <AppKpiCard
        icon={ActivityIcon}
        label="2주 인증"
        value={patrolCount}
        unit="회"
        /* 🔴 **분모가 생겼다**(결함 수정 2026-10-14). 그 전에는 "7회" 가 잘한 것인지
           알 수 없었다 — 9회 중 7회와 7회 중 7회는 다른 사실이다 */
        badge={rate === null ? undefined : `${Math.round(rate * 100)}%`}
        bar={rate === null ? undefined : { kind: 'ratio', value: rate }}
        foot={
          attemptedCount > 0
            ? { left: `인증 ${patrolCount}`, right: `대상 순찰 ${attemptedCount}회` }
            : undefined
        }
        hint={attemptedCount === 0 ? '순찰 기록 없음' : undefined}
      />
      <AppKpiCard
        icon={ClockIcon}
        label="최근 순찰"
        value={lastPatrol ?? '—'}
        /* 🔴 **숫자가 아니라 시각이다** — 큰 숫자 자리에 그대로 넣으면 줄바꿈된다 */
        compactValue
        /* 🔴 **"얼마 전" 이 시각보다 먼저 읽힌다** — `10.14 10:14` 만 있으면 오늘인지
           지난주인지 머릿속으로 빼야 한다 */
        badge={sinceLabel ?? undefined}
        /* 일별 인증 여부. 🔴 본문 차트는 **추세(라인)** 를 맡고 여기는 **그날 했나**를 맡는다 */
        bar={{ kind: 'ticks', days: ticks }}
        foot={{ left: '14일 전', right: '오늘' }}
        hint={lastPatrol ? undefined : '아직 방문 이력이 없습니다'}
      />
      <AppKpiCard
        icon={RouteIcon}
        label="소속 코스"
        value={courseCount}
        unit="개"
        /* 🔴 **분모를 넣지 않는다**(사용자 결정 2026-10-14) — 사업장 전체 코스 수는
           `GetCourseList` **요청 +1** 이다. 어느 코스인지만 적는다 */
        foot={firstCourseName ? { left: firstCourseName } : undefined}
        hint={courseCount === 0 ? '코스에 배정되지 않음' : undefined}
      />
    </div>
  )
}

export default PointStats
