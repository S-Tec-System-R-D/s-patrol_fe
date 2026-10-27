import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ActivityIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryDetail } from '@/features/course-history/types'
import PatrolBarChart from '@/features/points/components/detail/PatrolBarChart'
import { usePointHistory } from '@/features/points/hooks/usePointHistory'
import {
  SUMMARY_DAYS,
  summarizePatrolHistory,
  summaryFromDate,
  summaryToDate,
} from '@/features/points/lib/patrolSummary'
import { paths } from '@/router/paths'

/**
 * 이 지점의 **최근 인증 이력 + 추이** (`spec 037` Phase 5, US3).
 *
 * 🔴🔴 **집계 함수를 새로 만들지 않았다.** `tasks.md` T559 는 `pointHistoryTrend.ts` 를
 * 신설하는 계획이었는데, 열어 보니 **`spec 027` 이 같은 것을 이미 갖고 있었다** —
 * `summarizePatrolHistory`(14일 버킷 + 완료/대상 분모)와 `PatrolBarChart`(추세 라인)다.
 * 만들었다면 **같은 숫자를 세는 함수가 두 벌**이 되고, "미완료를 인증으로 세던" 결함
 * (031 에서 교정)이 한쪽에만 반영되는 상태가 된다. 🔴 **계획보다 코드가 맞다**(A3·A6).
 *
 * ✅ **그래서 OQ-037-D(14일 vs 30일)가 닫힌다** — `SUMMARY_DAYS` 가 **이미 14일**이고
 * (사용자 결정 2026-10-10: 30개 막대에는 날짜를 다 못 붙여 읽을 수 없었다) 목업 `04` 의
 * "14일 인증 추이" 와 같다. 코스 상세의 30일(`spec 023`)과 다른 것은 **보는 단위가 다르기
 * 때문**이다 — 코스는 회차가 드물고 지점은 매일 찍힌다.
 *
 * 🔴 **요청이 1개만 늘어난다**(`GetPointHistory?pointSeq`). 표와 추이가 **같은 응답**에서
 * 나온다 — 036 이 `CheckDetails` 하나로 네 자리를 채운 것과 같은 방식이다.
 * ✅ **027 지점 상세를 이미 봤다면 캐시를 그대로 쓴다** — `pointKeys.history` 가 같은 키다.
 *
 * 🔴 **이번 인증을 목록에서 강조한다.** 강조가 없으면 "지금 보고 있는 것이 어느 행인지"
 * 를 사용자가 날짜로 맞춰 봐야 한다.
 * ⚠️ **14일 밖의 인증이면 목록에 없다** — 그때는 조용히 넘기지 않고 **그 사실을 적는다**
 * (빠진 것처럼 보이면 데이터가 틀린 줄 안다).
 */

interface PointHistoryRecentCardProps {
  detail: PointHistoryDetail
  siteSeq: number | null
}

/** 목록에 보여줄 최근 기록 수. 🔴 상세는 **요약**이 목적이다 — 14일치를 다 쌓으면 아래가 안 보인다 */
const PREVIEW_COUNT = 8

/** `'2026-05-01T09:07:00'` → `'05.01 09:07'` — 같은 지점이라 연도는 반복이다 */
const formatCheckDt = (value: string): string => `${value.slice(5, 10).replace('-', '.')} ${value.slice(11, 16)}`

const PointHistoryRecentCard = ({ detail, siteSeq }: PointHistoryRecentCardProps) => {
  /* 🔴 **기준일을 한 번만 만든다** — 렌더마다 `new Date()` 를 부르면 버킷 경계가 흔들린다 */
  const today = useMemo(() => new Date(), [])
  const fromDt = summaryFromDate(today)
  const toDt = summaryToDate(today)

  const history = usePointHistory(siteSeq, detail.pointSeq, fromDt, toDt)
  const rows = useMemo(() => history.data?.items ?? [], [history.data?.items])
  const summary = useMemo(() => summarizePatrolHistory(rows, today), [rows, today])

  const preview = rows.slice(0, PREVIEW_COUNT)
  /* ⚠️ 이번 인증이 14일 밖이면 목록에 없다 — 강조할 행이 없다는 것을 화면이 말해야 한다 */
  const currentInRange = rows.some((row) => row.detailSeq === detail.detailSeq)

  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-panel-title font-bold text-foreground">이 지점의 최근 인증</h3>
          <p className="text-caption text-muted-foreground">
            최근 {SUMMARY_DAYS}일 · {detail.pointName}
          </p>
        </div>
        {/* ⚠️ **지점으로 좁힌 목록으로 보낼 수 없다** — 서버가 지점을 `pointSeq` 로만 받고
            목록 화면에 지점 필터를 두지 않았다(OQ-037-B). 그래서 전체 목록으로 보낸다 */}
        <Link
          to={paths.service.patrolPoints}
          className="shrink-0 text-caption text-muted-foreground hover:text-foreground"
        >
          전체 기록
        </Link>
      </div>

      {history.isPending ? (
        <div className="mt-4 h-[140px] animate-pulse rounded-sm bg-muted" />
      ) : history.isError ? (
        /* 🔴 **조회 실패를 "기록 없음" 으로 보여주지 않는다** — 이 카드만 실패할 수 있고
           (상세 본문은 이미 떠 있다) 둘을 섞으면 이 지점이 한 번도 안 찍힌 것처럼 읽힌다 */
        <div className="mt-2">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="최근 인증을 불러오지 못했습니다"
            description={history.error?.message}
          />
          <div className="flex justify-center">
            <AppButton variant="sub" onClick={() => void history.refetch()}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : (
        <>
          {/* 추세 라인 — 날짜별 사실은 아래 목록이, 늘고 주는 흐름은 차트가 맡는다(031 분담) */}
          <div className="mt-4">
            <PatrolBarChart buckets={summary.buckets} />
          </div>

          {/* 🔴 **분모를 함께 적는다**(031 판단) — "7회" 만으로는 잘한 것인지 알 수 없다.
              9회 중 7회와 7회 중 7회는 다른 사실이다. ⚠️ **판정은 하지 않는다** */}
          <p className="mt-3 text-caption text-muted-foreground">
            인증 {summary.total}회 · 대상 순찰 {summary.attempted}회
          </p>

          {summary.attempted === 0 ? (
            /* 🔴 기능은 있고 데이터가 없는 것이다 — placeholder 가 아니다(027 문구 계승) */
            <div className="mt-4 flex flex-col items-center gap-1.5 py-6 text-center">
              <ActivityIcon size={20} strokeWidth={1.5} className="text-muted-foreground/50" />
              <p className="text-body font-medium text-foreground">최근 인증 기록이 없습니다</p>
              <p className="max-w-[320px] text-caption text-muted-foreground">
                이 인증 외에는 최근 {SUMMARY_DAYS}일 안에 기록이 없습니다.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-4 flex flex-col">
                {preview.map((row) => {
                  const result = pointCheckBadge(row.status, row.checkDt, row.hasMemo)
                  const overtime = overtimeBadge(row.overTimeYn)
                  const isCurrent = row.detailSeq === detail.detailSeq

                  return (
                    <li
                      key={row.detailSeq}
                      /**
                       * 🔴 **모든 행에 왼쪽 바를 주고 현재 행만 포인트색이다**
                       * (사용자 결정 2026-10-20).
                       *
                       * 전에는 현재 행에만 바를 그려서 **바가 "강조" 그 자체**였다 — 행마다
                       * 들쭉날쭉한 왼쪽 선이 리스트의 리듬을 깼다. 이제 바는 **리스트 공통
                       * 장식**이고, 구분은 **색과 배경**이 한다.
                       *
                       * 🔴 **색만으로 구분하지 않는다** — 현재 행은 `point` 바 + 배경 +
                       * `aria-current` **셋이 함께** 움직인다(`design-system.md` §3).
                       * ⚠️ 바를 전 행에 **같은 색**으로 주면 현재 행을 가릴 수단이 사라진다 —
                       * 그래서 나머지는 `border` 톤이다.
                       */
                      className={`flex items-center gap-3 border-l-2 border-border/50 py-2.5 pl-2 text-body not-last:border-b ${
                        isCurrent ? 'border-l-point bg-point-bg/40' : 'border-l-border'
                      }`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatCheckDt(row.checkDt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {row.courseName}
                      </span>
                      {/* 🔴 강조가 **상태가 아니라 "지금 보고 있는 인증"** 임을 글로 말한다(`spec 055`) —
                          색만으로는 "순찰기록이라 강조됐다" 로 읽혔다(사용자 질문 2026-10-27) */}
                      {isCurrent && (
                        <span className="shrink-0 text-caption font-semibold text-point">이 인증</span>
                      )}
                      <span className="flex shrink-0 items-center gap-1">
                        <AppBadge variant={result.variant}>{result.label}</AppBadge>
                        {overtime && (
                          <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {/* ⚠️ **이번 인증이 기간 밖일 때** 그 사실을 적는다 — 강조가 없는 이유가
                  화면에 없으면 "빠졌다" 로 읽힌다 */}
              {!currentInRange && (
                <p className="mt-3 text-caption text-muted-foreground">
                  이번 인증({detail.checkDt.slice(0, 10)})은 최근 {SUMMARY_DAYS}일 범위 밖입니다.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}

export default PointHistoryRecentCard
