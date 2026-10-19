import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronRightIcon, HistoryIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import {
  useCourseHistoryCheckDetails,
  useCourseHistoryDetail,
} from '@/features/course-history/hooks/useCourseHistoryDetail'
import { useCourseAverage } from '@/features/course-history/hooks/useCourseAverage'
import { checkIntervals } from '@/features/course-history/lib/checkIntervals'
import { historyPins } from '@/features/patrol-zones/lib/historyCoords'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { useCourseDetail } from '@/features/courses/hooks/useCourseDetail'
import CheckDetailTable from '@/features/patrol-zones/components/detail/CheckDetailTable'
import HistoryMapCard from '@/features/patrol-zones/components/detail/HistoryMapCard'
import HistoryInfoCard from '@/features/patrol-zones/components/detail/HistoryInfoCard'
import HistoryKpiRow from '@/features/patrol-zones/components/detail/HistoryKpiRow'
import { getSiteSeq } from '@/lib/auth/site'
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
  const siteSeq = getSiteSeq()

  const detail = useCourseHistoryDetail(historySeq)
  const checkDetails = useCourseHistoryCheckDetails(historySeq)
  const average = useCourseAverage(siteSeq, detail.data?.courseSeq ?? null)

  /* 🔴 **지도의 뒤인증 핸 좌표는 여기서 부른다**(T497 판단). 훅 안에서 부르면
     `course-history → courses` **역방향 의존**이 생긴다 — 페이지는 양쪽을 import 해도 정상이다.
     ⚠️ **“현재 편성” 이다**(회차 시점이 아니다) — 그래서 `historyPins` 가 `pointSeq` 로 조인한다.
     ✅ `courseKeys.detail` 로 추사하므로 코스 관리 상세를 이미 봤다면 **요구이 늘지 않는다** */
  const course = useCourseDetail(detail.data?.courseSeq ?? null)

  const checks = useMemo(() => checkDetails.data ?? [], [checkDetails.data])
  const intervals = useMemo(() => checkIntervals(checks), [checks])
  const coords = useMemo(
    () => historyPins(checks, course.data?.points ?? []),
    [checks, course.data?.points]
  )

  const crumb = (
    <nav className="flex items-center gap-1 text-caption text-muted-foreground">
      <Link to={paths.service.patrolZones} className="hover:text-foreground">
        순찰이력
      </Link>
      <ChevronRightIcon size={14} aria-hidden />
      <span className="text-foreground">순찰 상세</span>
    </nav>
  )

  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4 p-8">
        {crumb}
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
      <div className="flex flex-col gap-4 p-8">
        {crumb}
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
    <div className="flex flex-col gap-4 p-8">
      {crumb}

      <AppPageHeader
        icon={HistoryIcon}
        title={`${data.courseName} · ${data.startDt.replace('T', ' ').slice(0, 16)}`}
        subtitle="이 회차의 순찰 수행 내역입니다"
        titleSuffix={
          <div className="flex items-center gap-1">
            <AppBadge variant={result.variant}>{result.label}</AppBadge>
            {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
          </div>
        }
      />

      <HistoryKpiRow detail={data} checks={checks} intervals={intervals} average={average.data} />

      {/* 🔴 **2열 골격**(목업 `02`) — 좌: 지도 + 인증 내역 / 우: 순찰 정보.
          좁은 폭에서는 한 줄로 쌓인다.
          🔴 **`items-start` 다**(사용자 확인 2026-10-19) — 기본값 `stretch` 면 우측 순찰 정보
          카드가 **좌측 컬럼 높이만큼 늘어나** 아래에 큰 여백이 생긴다. 카드 높이는 내용이 정한다 */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section className="flex flex-col gap-4 lg:col-span-2">
          {/* 🔴 **지도가 인증 내역보다 위다**(사용자 결정 2026-10-19 — 순서를 바꿨다).
              지도는 "어느 지점이 비었나" 를 한눈에 주고, 표는 그 다음 단계인 행별 확인이다.
              표를 먼저 두면 메모를 펼칠수록 지도가 아래로 밀려 **처음 보는 그림이 안 보인다**.
              🔴 **항목이 생길 때만 보여준다**(T519 기준: 좌표 0개 → 비표시) — 빈 회색 박스는
              화면만 차지하고 아무 판단에도 안 쓰인다. 지점 목록은 아래 표가 이미 말한다 */}
          {coords.pins.length > 0 && <HistoryMapCard pins={coords.pins} missing={coords.missing} />}

          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-body font-semibold">지점 인증 내역</h3>
              <span className="text-caption text-muted-foreground">
                {data.totalPointCount}개 지점 · {data.completedPointCount}개 인증
              </span>
            </div>

            {checkDetails.isPending ? (
              /* 🔴 로딩을 "없음" 으로 보여주지 않는다 — 인증 행이 0건인 회차가 실재해서
                 둘을 섞으면 **사실과 장애를 구분할 수 없다** */
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : checkDetails.isError ? (
              <div>
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
              <CheckDetailTable rows={checks} />
            )}
          </div>
        </section>

        <section className="lg:col-span-1">
          <HistoryInfoCard detail={data} checks={checks} />
        </section>
      </div>
    </div>
  )
}

export default PatrolZoneDetailPage
