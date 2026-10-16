import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronRightIcon, HistoryIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { useCourseHistoryDetail } from '@/features/course-history/hooks/useCourseHistoryDetail'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { paths } from '@/router/paths'

/**
 * 코스 순찰 상세 — 회차 하나 (`spec 036` T509·T510 일부).
 *
 * 🔴 **Phase 3 에서는 셸 + 순찰 정보까지다.** KPI 4종 · 인증 내역 표 · 지도 · 메모는
 * Phase 4~6 이 채운다. 라우트를 Phase 3 으로 끌어온 이유는 **목록의 행 클릭이 죽어 있으면
 * 브라우저 확인이 반쪽**이기 때문이다(사용자 결정 2026-10-16) — 빈 껍데기를 두지 않고
 * 상세 응답으로 채울 수 있는 것부터 채운다.
 *
 * 🔴 **`historySeq` 로 진입한다**(코스가 아니라 **회차**다). `/zones/:courseSeq` 는 코스의
 * 현재 편성이고 이쪽은 "그 코스를 언제 어떻게 돌았는지" 다.
 *
 * 🔴 **"기준 충족" 판정을 하지 않는다**(spec §3-4) — `totalMin` 이 검증되지 않고(B-31)
 * 어긋난 데이터가 전수 18건이며 `0` 인 코스도 있다. 값만 나란히 둔다.
 */

const PatrolZoneDetailPage = () => {
  const { historySeq: raw } = useParams<{ historySeq: string }>()
  const historySeq = Number(raw)
  const detail = useCourseHistoryDetail(Number.isInteger(historySeq) ? historySeq : null)

  const crumb = (
    <nav className="flex items-center gap-1 text-caption text-muted-foreground">
      <Link to={paths.service.patrolZones} className="hover:text-foreground">
        순찰이력
      </Link>
      <ChevronRightIcon size={14} aria-hidden />
      <span className="text-foreground">순찰 상세</span>
    </nav>
  )

  /**
   * 🔴 **조회 중과 "없음" 을 구분한다.** 빈 상태가 "삭제되었거나 접근할 수 없습니다" 라고
   * 단정하면, 조회 중에 그것이 뜨는 순간 사용자는 **방금 지운 줄 안다**(023 T375 선례).
   */
  if (detail.isPending) {
    return (
      <div className="flex flex-col gap-4 p-8">
        {crumb}
        <div className="h-9 w-80 animate-pulse rounded-md bg-muted" />
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

      <div className="max-w-xl">
        <AppDetailCard title="순찰 정보">
          <AppDetailRow
            label="순찰 코스"
            value={
              <Link
                to={paths.service.courseDetail(data.courseSeq)}
                className="text-point-foreground hover:underline"
              >
                {data.courseName}
              </Link>
            }
          />
          <AppDetailRow
            label="순찰자"
            // 🔴 순찰자 없는 이력이 실측 35% 다 — 빈 칸으로 두지 않는다
            value={data.startUserName || '순찰자 미지정'}
          />
          <AppDetailRow
            label="시작 일시"
            value={<span className="tabular-nums">{data.startDt.replace('T', ' ')}</span>}
          />
          <AppDetailRow
            label="종료 일시"
            value={
              data.endDt === null ? (
                '진행 중'
              ) : (
                <span className="tabular-nums">{data.endDt.replace('T', ' ')}</span>
              )
            }
          />
          <AppDetailRow
            label="소요시간"
            // 🔴 **판정하지 않는다** — 기준(`totalMin`)을 나란히 적기만 한다
            value={
              <span>
                {formatElapsed(data.elapsedTime)}
                <span className="text-muted-foreground"> (기준 {data.totalMin}분)</span>
              </span>
            }
          />
          <AppDetailRow
            label="지점 인증"
            value={`${data.completedPointCount} / ${data.totalPointCount}개`}
          />
          {/* 🔴 교대가 있으면 적는다 — 목업에는 없지만 서버가 세어 준다(실측 2명 6건) */}
          {data.handoverCount > 0 && (
            <AppDetailRow label="교대" value={`${data.handoverCount}회`} />
          )}
        </AppDetailCard>
      </div>
    </div>
  )
}

export default PatrolZoneDetailPage
