import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, HistoryIcon, MapPinIcon, MessageSquareTextIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { usePointHistoryDetail } from '@/features/course-history/hooks/usePointHistoryDetail'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import PointHistoryInfoCard from '@/features/patrol-points/components/detail/PointHistoryInfoCard'
import PointHistoryMemoCard from '@/features/patrol-points/components/detail/PointHistoryMemoCard'
import PointLocationMapCard from '@/features/patrol-points/components/detail/PointLocationMapCard'
import { isValidCoord } from '@/features/courses/lib/courseCoords'
import { paths } from '@/router/paths'

/**
 * 지점 인증 상세 — 인증 1건 (`spec 037` Phase 4).
 *
 * 🔴 **`detailSeq` 로 진입한다**(지점이 아니라 **인증 1건**이다). `/points/:pointSeq` 는
 * 그 지점 자체(지점 관리)이고 이쪽은 "그 지점을 언제 어떻게 인증했는지" 다. 같은 지점이
 * 하루에 여러 번 찍히고 **회차마다 결과가 다르다.**
 *
 * 🔴 **요청 1개로 시작한다**(US2). 기본 정보·메모·사진이 `GetPointHistoryDetail` 한
 * 응답에 다 들어 있다 — 036 코스 상세가 4개를 조립한 것과 다르다.
 *
 * 🔴 **US4 자리를 비워 두지 않는다.** 목업 `04` 의 KPI 4종 중 **직전 지점 간격 · 코스 내
 * 순서**와 **코스 내 위치 타임라인**, **"코스 순찰 상세" 링크**는 `historySeq` 가 없어
 * 만들 수 없다(`spec.md` §2-4) — 빈 카드를 두면 **"데이터가 없다" 로 읽힌다**(036 이
 * 지도에서 같은 판단을 했다). 백엔드 회신 후 한 번에 넣는다.
 *
 * 🔴 **조회 중과 "없음" 을 구분한다.** 빈 상태가 "삭제되었거나 접근할 수 없습니다" 라고
 * 단정하면, 조회 중에 그것이 뜨는 순간 사용자는 **방금 지운 줄 안다**(023 T375 선례).
 */

const PatrolPointDetailPage = () => {
  const { detailSeq: raw } = useParams<{ detailSeq: string }>()
  const parsed = Number(raw)
  /* 🔴 숫자가 아니면 **요청하지 않는다** — 주소가 잘못된 것이고 서버 400 을 기다릴 이유가 없다 */
  const detailSeq = Number.isInteger(parsed) ? parsed : null

  const detail = usePointHistoryDetail(detailSeq)

  /**
   * 🔴🔴 **주소가 잘못된 경우를 로딩보다 먼저 분기한다**(T557 이 잡아낸 결함).
   *
   * `detailSeq` 가 `null` 이면 쿼리가 `enabled: false` 라 **영원히 `isPending` 이다** —
   * 아래 로딩 분기에 걸려 **스켈레톤이 끝까지 남는다.** 사용자는 "느리다" 고 읽고 기다리는데
   * 요청은 애초에 나가지 않았다. 🔴 **조회 실패보다 나쁜 상태다**(끝이 없다).
   *
   * ⚠️ `enabled: false` 와 로딩이 같은 `isPending` 으로 오는 것은 react-query 의 규약이다 —
   * 호출부가 "안 보낸 것" 과 "기다리는 것" 을 구분해야 한다.
   */
  if (detailSeq === null) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <div className="rounded-lg border border-border bg-card">
          <AppEmpty
            icon={TriangleAlertIcon}
            title="인증 상세를 불러오지 못했습니다"
            description="주소가 올바르지 않습니다."
          />
          {/* 🔴 **"다시 시도" 를 주지 않는다** — 같은 주소로 또 실패한다(할 수 있는 일이 아니다) */}
          <div className="flex justify-center pb-6">
            <Link
              to={paths.service.patrolPoints}
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
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-lg bg-muted lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    )
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col gap-4 p-4 xl:p-8">
        <div className="rounded-lg border border-border bg-card">
          {/* 🔴 **"삭제되었다" 고 단정하지 않는다** — 네트워크 실패·권한·잘못된 주소가 모두
              이 분기로 떨어진다. 사용자가 할 수 있는 일(다시 시도 / 목록으로)만 준다 */}
          <AppEmpty
            icon={TriangleAlertIcon}
            title="인증 상세를 불러오지 못했습니다"
            description={detail.error?.message}
          />
          {/* 🔴 **복귀 수단을 명시한다.** 브레드크럼이 목록 링크를 겸하지만, 못 찾은 화면에서는
              그것이 **빠져나갈 길로 읽히지 않는다**(023 브라우저 확인 2026-10-12) */}
          <div className="flex flex-col items-center gap-3 pb-6">
            <AppButton variant="sub" onClick={() => void detail.refetch()}>
              다시 시도
            </AppButton>
            <Link
              to={paths.service.patrolPoints}
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
  /* 🔄 `spec 078` D3 — 결과 하나 + `특이사항` + `시간초과`. 완료는 메모와 상관없이 `인증`(목록도 같다 — `spec 079` D15) */
  const result = pointCheckBadge(data.status, false)
  // 🔴 상세는 `overtimeYn`(**소문자 t**) 다 — 코스 상세와 다르다(B-4)
  const overtime = overtimeBadge(data.overtimeYn)
  const hasMemo = data.memoList.length > 0
  /* 🔄 `spec 078` D5 — 메모가 없어도 좌표까지 없으면 지도를 왼쪽으로 옮기지 않는다. 왼쪽은 `순찰 기록` 빈 상태,
     오른쪽은 좌표 없음 자리 */
  const recordFirst = hasMemo || !isValidCoord(data.gpsLat, data.gpsLng)
  const subtitle = [
    data.userName || '순찰자 미지정',
    formatWhen(data.checkDt),
    // 🔴 `authMethodName` 은 null 일 때 `'Unknown'` 이다(B-6) — 화면에 내보내지 않는다
    data.authMethod !== null && data.authMethodName !== 'Unknown' ? data.authMethodName : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-4 p-4 xl:p-8">

      <AppPageHeader
        icon={HistoryIcon}
        title={data.pointName}
        subtitle={subtitle}
        titleSuffix={
          <div className="flex flex-wrap items-center gap-1">
            <AppBadge variant={result.variant}>{result.label}</AppBadge>
            {hasMemo && (
              <AppBadge variant="warning" className="gap-1">
                <MessageSquareTextIcon size={12} aria-hidden />
                특이사항
              </AppBadge>
            )}
            {/* 🔴 시간초과는 결과와 **독립 축**이라 병기한다(목록과 같은 규칙) */}
            {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
          </div>
        }
        action={
          <Link
            to={paths.service.pointDetail(data.pointSeq)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-body font-medium hover:bg-muted"
          >
            <MapPinIcon size={14} aria-hidden />
            지점 상세
          </Link>
        }
      />

      {/* 🔄 **`spec 078` 시안** — 이 화면의 고유 정보(순찰 기록)를 맨 위로.
          - 특이사항 있음 · 또는 메모 · 좌표 둘 다 없음: 왼쪽 **순찰 기록**(없으면 빈 상태) / 오른쪽 **지도(없으면 좌표 없음 자리) + 인증 정보** 한 패널
          - 메모 없음 · 좌표 있음: 왼쪽 **지도**(인증 위치 카드) / 오른쪽 인증 정보
          🔄 최근 14일 한 줄은 뺐다(D6 — 머리 `지점 상세` 와 겹친다).
          🔴 `items-start` — 오른쪽이 왼쪽 높이만큼 늘어나지 않게(036). `xl` 미만 1단 — DOM 순서대로 본문이 먼저 */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <section className="min-w-0">
          {recordFirst ? <PointHistoryMemoCard detail={data} /> : <PointLocationMapCard detail={data} />}
        </section>
        <section className="min-w-0">
          <PointHistoryInfoCard
            detail={data}
            map={recordFirst ? <PointLocationMapCard detail={data} bare /> : undefined}
          />
        </section>
      </div>
    </div>
  )
}

/** `11.07 (토) 10:53` — 부제용 */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const formatWhen = (value: string): string | null => {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return `${value.slice(5, 7)}.${value.slice(8, 10)} (${WEEKDAYS[date.getDay()]}) ${value.slice(11, 16)}`
}

export default PatrolPointDetailPage
