import { CalendarCheckIcon, CircleCheckIcon } from 'lucide-react'

import AppKpiCard from '@/components/app/AppKpiCard'
import { pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryDetail } from '@/features/course-history/types'
import { SUMMARY_DAYS, type PatrolSummary } from '@/features/points/lib/patrolSummary'

/**
 * 지점 인증 상세 KPI (`spec 037` T560).
 *
 * 🔴 **목업 `04` 의 4칸 중 2칸만 만든다.** **직전 지점 간격**과 **코스 내 순서**는
 * `historySeq` 가 없어 계산할 수 없다(`spec.md` §2-4, US4) — 🔴 **빈 칸을 두지 않는다.**
 * 빈 카드는 "데이터가 없다" 로 읽히고, `0` 이나 `—` 를 채우면 **없는 값을 지어낸 것**이
 * 된다(036 이 지도에서, 031 이 증감 뱃지에서 같은 판단을 했다).
 *
 * 🔴 **헤더 뱃지와 겹치는 것이 아니다**(036 선례 — `지점 인증`·`소요시간` 이 KPI 와 정보
 * 카드 양쪽에 있다). 역할이 갈린다: **헤더 뱃지는 결과 한 단어**, **KPI 는 구성**(메모·사진
 * 건수 / 14일 점등), **정보 카드는 값**(시각·수단·구간).
 *
 * 🔴 **판정하지 않는다**(spec §3-7) — `양호`·`개선 필요` 같은 평가어도, 기준 비교도 없다.
 */

interface PointHistoryKpiRowProps {
  detail: PointHistoryDetail
  /** 최근 14일 집계(`spec 027` 의 `summarizePatrolHistory` 결과) */
  summary: PatrolSummary
  /** 집계 조회 중이면 값 대신 `—`. 🔴 **0 으로 적지 않는다** — "한 번도 안 찍혔다" 로 읽힌다 */
  isPending: boolean
}

const PointHistoryKpiRow = ({ detail, summary, isPending }: PointHistoryKpiRowProps) => {
  const result = pointCheckBadge(detail.status, detail.checkDt, detail.hasMemo)

  const memoCount = detail.memoList.length
  const photoCount = detail.memoList.reduce((sum, memo) => sum + memo.attachList.length, 0)

  /**
   * 🔴 **그날 인증이 있었나**를 점으로 찍는다(`ticks`). 추세 라인(`PatrolBarChart`)과
   * **역할이 다르다** — 031 이 정한 분담이다: 점등은 "그날 했나" 라는 사실, 라인은 "늘고
   * 주는 흐름". 같은 데이터를 두 번 그리는 것이 아니라 **다른 질문에 답한다.**
   */
  const days = summary.buckets.map((bucket) => bucket.count > 0)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppKpiCard
        icon={CircleCheckIcon}
        label="인증 결과"
        value={result.label}
        /* 🔴 메모·사진 건수가 **구성**이다 — 결과 한 단어로는 "무엇이 남았는지" 를 모른다.
           ⚠️ 사진은 URL 이 404 라 **화면에 안 뜨지만 건수는 사실이다**(B-40) — 건수를
           숨기면 "사진이 없다" 로 읽혀 결함이 데이터 부재로 보인다 */
        hint={
          memoCount === 0
            ? '남긴 기록 없음'
            : `메모 ${memoCount}건${photoCount > 0 ? ` · 사진 ${photoCount}장` : ''}`
        }
      />

      <AppKpiCard
        icon={CalendarCheckIcon}
        label={`최근 ${SUMMARY_DAYS}일 인증`}
        /* 🔴 조회 중에는 `—` 다 — `0` 은 "한 번도 안 찍혔다" 는 **다른 사실**이다 */
        value={isPending ? '-' : summary.total}
        unit={isPending ? undefined : `/ 대상 ${summary.attempted}회`}
        /* 🔴 **점등은 조회 후에만**. 전부 꺼진 14칸을 먼저 그리면 "2주간 아무것도 안 했다"
           로 보이고, 응답이 오는 순간 점이 튀어나온다 */
        bar={isPending ? null : { kind: 'ticks', days }}
        hint={`최근 ${SUMMARY_DAYS}일 기준 · 이 지점`}
      />
    </div>
  )
}

export default PointHistoryKpiRow
