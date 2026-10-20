import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon, ChevronRightIcon, TriangleAlertIcon } from 'lucide-react'

import AppButton from '@/components/app/AppButton'
import AppEmpty from '@/components/app/AppEmpty'
import { usePointHistoryDetail } from '@/features/course-history/hooks/usePointHistoryDetail'
import PointHistoryMemoCard from '@/features/patrol-points/components/detail/PointHistoryMemoCard'
import PointHistorySummaryBar from '@/features/patrol-points/components/detail/PointHistorySummaryBar'
import PointHistoryRecentCard from '@/features/patrol-points/components/detail/PointHistoryRecentCard'
import PointLocationMapCard from '@/features/patrol-points/components/detail/PointLocationMapCard'
import { getSiteSeq } from '@/lib/auth/site'
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
  /* 🔴 최근 인증 조회는 `siteSeq` 가 필수다(상세 응답에는 없다) — `spec 021` 의 저장값이 유일한 출처 */
  const siteSeq = getSiteSeq()

  const crumb = (
    <nav className="flex items-center gap-1 text-caption text-muted-foreground">
      <Link to={paths.service.patrolPoints} className="hover:text-foreground">
        순찰이력
      </Link>
      <ChevronRightIcon size={14} aria-hidden />
      <span className="text-foreground">지점 인증 상세</span>
    </nav>
  )

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
      <div className="flex flex-col gap-4 p-8">
        {crumb}
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
      <div className="flex flex-col gap-4 p-8">
        {crumb}
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
      <div className="flex flex-col gap-4 p-8">
        {crumb}
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

  return (
    <div className="flex flex-col gap-4 p-8">
      {crumb}

      {/* 🔴 **페이지 타이틀 줄이 없다**(사용자 요청 2026-10-20 + 목업 `제안1`).
          지점명·인증시각·결과가 **아래 요약 스트립에 이미 있어** 제목이 같은 말을
          반복했다 — 복귀는 브레드크럼이 맡는다. 설명 한 줄도 같은 이유로 뺐다
          ("이 인증 1건의 수행 내역입니다" 는 화면을 보면 아는 것이다) */}
      <PointHistorySummaryBar detail={data} />

      {/* 🔴 **2열 골격**(목업 `제안1`) — 좌: 순찰 기록 → 최근 인증 / 우: **지도 전체**.
          전에는 우측이 kv 카드 7행 + 220px 지도였는데, 값이 스트립으로 올라가면서
          **지도가 우측을 통째로** 쓴다 — 220px 짜리는 "지도가 있다" 수준이라 주변
          건물·도로가 안 보여 위치를 판단할 수 없었다.
          🔴 **`items-start` 다** — 기본값 `stretch` 면 우측 카드가 좌측 높이만큼 늘어나
          아래에 큰 여백이 생긴다(036 브라우저 확인 2026-10-19에서 고친 자리) */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section className="flex flex-col gap-4 lg:col-span-2">
          {/* 🔴 **순찰 기록(메모·사진)이 위다** — 이 인증 1건에 대해 사용자가 보러 온 것이
              그것이다. 최근 이력은 "평소와 다른가" 를 가늠하는 **맥락**이라 그 다음이다 */}
          <PointHistoryMemoCard detail={data} />
          <PointHistoryRecentCard detail={data} siteSeq={siteSeq} />
        </section>
        <section>
          {/* ⚠️ **좌표가 없으면 카드 자체가 없다**(미완료 인증은 좌표가 구조적으로 null —
              실측 45/45). 그때는 이 컬럼이 비고 좌측이 2/3 폭 그대로 남는다 */}
          <PointLocationMapCard detail={data} />
        </section>
      </div>
    </div>
  )
}

export default PatrolPointDetailPage
