import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, RouteIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import {
  useCourseHistoryCheckDetails,
  useCourseHistoryDetail,
  useCourseHistoryHandOvers,
} from '@/features/course-history/hooks/useCourseHistoryDetail'
import { historyPins } from '@/features/patrol-zones/lib/historyCoords'
import { memoRowCount, runTimeline } from '@/features/patrol-zones/lib/runTimeline'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail'
import HistoryMapCard from '@/features/patrol-zones/components/detail/HistoryMapCard'
import HandOverTimelineCard from '@/features/patrol-zones/components/detail/HandOverTimelineCard'
import RunSummaryStrip from '@/features/patrol-zones/components/detail/RunSummaryStrip'
import RunTimeline from '@/features/patrol-zones/components/detail/RunTimeline'
import { paths } from '@/router/paths'

/**
 * 코스 순찰 상세 — 회차 하나 (`spec 036` Phase 4).
 *
 * 🔴 **`historySeq` 로 진입한다**(코스가 아니라 **회차**다). `/zones/:courseSeq` 는 코스의
 * 현재 편성이고 이쪽은 "그 코스를 언제 어떻게 돌았는지" 다.
 *
 * 🔴 **요청 3개를 조립한다.** 상세 · 인증 내역 · 코스 평균. `GetCourseDetail`(지도의 미인증
 * 핀 좌표)은 **Phase 5 에서 이 페이지가 직접** 부른다 — 훅 안에서 부르면
 * `course-history → courses` **역방향 의존**이 생긴다(T497 판단).
 *
 * 🔴 **인증 내역이 네 자리를 채운다**(요청 1회): 표 · KPI 3종 · 인증수단 집계 · (Phase 5)
 * 지도의 인증 핀.
 *
 * 🔴 **조회 중과 "없음" 을 구분한다.** 빈 상태가 "삭제되었거나 접근할 수 없습니다" 라고
 * 단정하면, 조회 중에 그것이 뜨는 순간 사용자는 **방금 지운 줄 안다**(023 T375 선례).
 */

const PatrolZoneDetailPage = () => {
  const { historySeq: raw } = useParams<{ historySeq: string }>()
  const parsed = Number(raw)
  const historySeq = Number.isInteger(parsed) ? parsed : null

  const detail = useCourseHistoryDetail(historySeq)
  const checkDetails = useCourseHistoryCheckDetails(historySeq)
  const handOvers = useCourseHistoryHandOvers(detail.data?.handoverCount ? historySeq : null)
  /* 🔄 `spec 077` — 행 ↔ 핀 서로 강조 · 펼친 기록. 타임라인 · 지도 · 요약이 함께 쓴다 */
  const [selected, setSelected] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  /* 🔴 **지도의 뒤인증 핸 좌표는 여기서 부른다**(T497 판단). 훅 안에서 부르면
     `course-history → courses` **역방향 의존**이 생긴다 — 페이지는 양쪽을 import 해도 정상이다.
     ⚠️ **“현재 편성” 이다**(회차 시점이 아니다) — 그래서 `historyPins` 가 `pointSeq` 로 조인한다.
     ✅ `courseKeys.detail` 로 추사하므로 코스 관리 상세를 이미 봤다면 **요구이 늘지 않는다** */
  const course = useCourseDetail(detail.data?.courseSeq ?? null)

  const checks = useMemo(() => checkDetails.data ?? [], [checkDetails.data])
  const steps = useMemo(
    () => (detail.data ? runTimeline(checks, detail.data.startDt, detail.data.endDt === null) : []),
    [checks, detail.data]
  )
  const nextDetailSeq = steps.find((step) => step.isNext)?.row.detailSeq
  const coords = useMemo(
    () => historyPins(checks, course.data?.points ?? [], nextDetailSeq),
    [checks, course.data?.points, nextDetailSeq]
  )

  const toggle = (detailSeq: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(detailSeq)) next.delete(detailSeq)
      else next.add(detailSeq)
      return next
    })
  const toggleAll = (open: boolean) =>
    setExpanded(open ? new Set(checks.filter((row) => row.memos.length > 0).map((row) => row.detailSeq)) : new Set())


  /**
   * 🔴🔴 **주소가 잘못된 경우를 로딩보다 먼저 분기한다**(`spec 037` Phase 4 에서 발견).
   *
   * `historySeq` 가 `null` 이면 쿼리가 `enabled: false` 라 **영원히 `isPending` 이다** —
   * 아래 로딩 분기에 걸려 **스켈레톤이 끝까지 남는다.** 사용자는 "느리다" 고 읽고 기다리는데
   * **요청은 애초에 나가지 않았다.** 조회 실패보다 나쁜 상태다(끝이 없다).
   *
   * 🔴 **036 만의 실수였다** — `spec 023`(`ZoneDetailPage`)·`spec 027`(`PointDetailPage`)은
   * `detail.isPending && seq !== null` 로 **이미 막아 뒀는데** 036 이 그 가드를 빼먹었다.
   * 037 이 같은 화면을 만들며 테스트로 잡았다.
   *
   * ⚠️ `enabled: false` 와 로딩이 같은 `isPending` 으로 오는 것은 react-query 규약이라
   * **호출부가 "안 보낸 것" 과 "기다리는 것" 을 구분해야 한다.**
   */
  if (historySeq === null) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="순찰 상세를 불러오지 못했습니다"
            /* 027 과 같은 문구 — 원인이 주소라는 것과 할 일을 함께 말한다 */
            description="주소가 올바르지 않습니다. 목록에서 다시 선택해주세요."
          />
          {/* 🔴 **"다시 시도" 를 주지 않는다** — 같은 주소로 또 실패한다(할 수 있는 일이 아니다) */}
          <div className="flex justify-center pb-6">
            <Link
              to={paths.service.patrolZones}
              className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon size={14} />
              순찰이력 목록으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <div className="h-9 w-80 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="순찰 상세를 불러오지 못했습니다"
            description={detail.error?.message}
          />
          {/* 🔴 **복귀 수단을 명시한다.** 브레드크럼 첫 조각이 목록 링크를 겸하지만,
              못 찾은 화면에서는 그것이 **빠져나갈 길로 읽히지 않는다**(023 브라우저 확인
              2026-10-12). `AppButton` 에 `asChild` 가 없어 링크는 `Link` 로 둔다 */}
          <div className="flex flex-col items-center gap-3 pb-6">
            <AppButton variant="sub" onClick={() => void detail.refetch()}>
              다시 시도
            </AppButton>
            <Link
              to={paths.service.patrolZones}
              className="flex w-fit items-center gap-1.5 text-caption text-muted-foreground hover:text-foreground"
            >
              <ArrowLeftIcon size={14} />
              순찰이력 목록으로
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const data = detail.data
  const result = courseResultBadge(data.status)
  // 🔴 상세는 `overTimeYn`(**대문자 T**) 다 — 목록은 소문자 t(B-4)
  const overtime = overtimeBadge(data.overTimeYn)

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">

      <AppPageHeader
        title={data.courseName}
        /* 🔄 `spec 077`: 부제 = **순찰자**(교대가 있으면 `· 교대 n`) — 036 의 `순찰 정보` 카드가 하던 일.
           🔴 순찰자 없는 이력이 실측 35% 다 — 빈 칸으로 두지 않는다 */
        subtitle={`${data.startUserName || '순찰자 미지정'}${data.handoverCount > 0 ? ` · 교대 ${data.handoverCount}` : ''}`}
        titleSuffix={
          <div className="flex items-center gap-1">
            <AppBadge variant={result.variant}>{result.label}</AppBadge>
            {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
          </div>
        }
        action={
          <Link
            to={paths.service.courseDetail(data.courseSeq)}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-[7px] bg-muted px-3 text-caption font-medium text-foreground hover:bg-border"
          >
            <RouteIcon size={14} aria-hidden />
            코스 상세
          </Link>
        }
      />

      <RunSummaryStrip
        detail={data}
        memoRows={checkDetails.data ? memoRowCount(checks) : null}
      />

      {/* 🔄 **`spec 077` 2열** — 왼쪽 수행 타임라인(나머지 폭) / 오른쪽 코스 경로 지도 + 교대 이력(D1).
          `xl` 미만 1단 — 타임라인이 먼저(이 화면의 본문), 지도는 그 아래.
          🔴 `items-start` — 오른쪽 열이 왼쪽 높이만큼 늘어나지 않게(036) */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        {checkDetails.isPending ? (
          /* 🔴 로딩을 "없음" 으로 보여주지 않는다 — 인증 행이 0건인 회차가 실재한다 */
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : checkDetails.isError ? (
          <div className="rounded-lg border border-border bg-card">
            <AppEmpty
              icon={TriangleAlertIcon}
              title="인증 내역을 불러오지 못했습니다"
              description={checkDetails.error?.message}
            />
            <div className="flex justify-center pb-6">
              <AppButton variant="sub" onClick={() => void checkDetails.refetch()}>
                다시 시도
              </AppButton>
            </div>
          </div>
        ) : (
          <RunTimeline
            detail={data}
            steps={steps}
            selected={selected}
            onSelect={setSelected}
            expanded={expanded}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        )}

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4">
          {course.isPending ? (
            /* 🔴 조회 중에는 지도를 그리지 않는다(T523) — 등록 좌표가 없어 핀이 튀어나온다 */
            <div className="h-[420px] animate-pulse rounded-lg bg-muted" />
          ) : course.isError ? (
            /* 🔴 조용히 넘어가면 "좌표가 등록되지 않았다" 로 거짓말을 한다 — 원인이 다르다 */
            <div className="rounded-lg border border-border bg-card">
              <AppEmpty
                icon={TriangleAlertIcon}
                title="코스 좌표를 불러오지 못했습니다"
                description={course.error?.message}
              />
              <div className="flex justify-center pb-6">
                <AppButton variant="sub" onClick={() => void course.refetch()}>
                  다시 시도
                </AppButton>
              </div>
            </div>
          ) : (
            <HistoryMapCard
              pins={coords.pins}
              missing={coords.missing}
              missingPoints={coords.missingPoints}
              selected={selected}
              onSelect={setSelected}
            />
          )}
          {/* 지점 내역을 받기 전엔 그리지 않는다 — 빈 내역이면 전부 `처리한 지점 없음` 으로 보인다 */}
          {handOvers.data && handOvers.data.length > 0 && checkDetails.data && (
            <HandOverTimelineCard rows={handOvers.data} checks={checkDetails.data} />
          )}
        </div>
      </div>
    </div>
  )
}

export default PatrolZoneDetailPage
