import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryDetail } from '@/features/course-history/types'
import { paths } from '@/router/paths'

/**
 * 지점 인증 상세 — **상단 가로 요약 스트립** (목업 `순찰이력-지점상세제안1.png`,
 * 사용자 결정 2026-10-20).
 *
 * 🔴 **우측 세로 kv 카드(`PointHistoryInfoCard`)를 대체한다.** 같은 값 7개인데 배치가
 * 바뀌었다 — 세로 7행은 **우측 컬럼을 길게 먹어 지도를 아래로 밀어냈고**, 가로 스트립은
 * 한 번의 시선으로 훑힌다. 🔴 **결과 중복도 함께 풀린다**: 전에는 헤더 뱃지 + kv "결과" 행
 * 두 곳이었는데 이제 **스트립 끝 한 칸**이다(KPI 섹션을 뺀 것과 같은 정리다).
 *
 * 🔴 **페이지 타이틀 줄을 없앴다**(사용자 요청) — 지점명·인증시각이 **스트립 첫 두 칸과
 * 네 번째 칸**에 이미 있어 제목이 같은 말을 반복했다. 복귀는 브레드크럼이 맡는다.
 *
 * 🔴 **목업에서 뺀 것**: 지도 부제의 `수신감도 · 오차 8m`(**그런 필드가 서버에 없다** —
 * 좌표만 온다) · 푸터 `기록은 인증 시각 ±5분 이내 등록 건만 연결됩니다`(**그런 규칙을
 * 모른다** — 메모는 서버가 인증 1건에 묶어서 준다) · `원본 다운로드`(첨부 URL 이 404 다,
 * B-40). 셋 다 적으면 **지어낸 값**이 된다(A1).
 *
 * 🔴 **`인증수단 · 구간` 을 한 칸에 합치지 않았다**(목업은 합쳤다). `구간`(`pauseTime`)은
 * **무엇을 센 시간인지 확정되지 않았고**(OQ-037-A) 인증수단 옆에 붙이면 **그 부속처럼**
 * 읽힌다. 뜻을 모르는 값일수록 **자기 칸**에 둔다.
 */

interface PointHistorySummaryBarProps {
  detail: PointHistoryDetail
}

/** 🔴 상세의 `authMethodName` 은 null 일 때 `'Unknown'` 이다(B-6) — 화면에 내보내지 않는다 */
const UNKNOWN_AUTH = 'Unknown'

/** 값 없음은 하이픈이다(`design-system.md` §4-5A) */
const Dash = () => <span className="text-muted-foreground">-</span>

const PointHistorySummaryBar = ({ detail }: PointHistorySummaryBarProps) => {
  const result = pointCheckBadge(detail.status, detail.checkDt, detail.hasMemo)
  const overtime = overtimeBadge(detail.overtimeYn)
  const hasAuth = detail.authMethod !== null && detail.authMethodName !== UNKNOWN_AUTH

  /**
   * 🔴 **값은 한 번만 만든다.** 아래에서 두 벌(스트립 / kv)로 그리지만 **값이 갈리면
   * 폭에 따라 다른 내용이 보인다** — `spec 030` 이 목록 카드에서 세운 규칙과 같다
   * (행은 `getRowModel()` 하나에서 나온다).
   */
  const cells: { label: string; value: React.ReactNode }[] = [
    { label: '순찰지점', value: detail.pointName },
    {
      label: '순찰코스',
      /* ✅ 코스 **관리** 상세로 간다 — 회차(`historySeq`)를 모르므로 "코스 순찰 상세" 로는
         보낼 수 없다(US4) */
      value: (
        <Link
          to={paths.service.courseDetail(detail.courseSeq)}
          className="text-point-foreground hover:underline"
        >
          {detail.courseName}
        </Link>
      ),
    },
    // ⚠️ 완료인데 순찰자가 null 인 행이 실재한다(OQ-16, 실측 3건)
    { label: '순찰자', value: detail.userName || '순찰자 미지정' },
    {
      label: '인증시각',
      // ✅ **미완료 행에도 적는다** — `checkDt` 는 지점 인증 시간이다(OQ-15 해소)
      value: <span className="tabular-nums">{detail.checkDt.replace('T', ' ')}</span>,
    },
    {
      label: '인증수단',
      value: hasAuth ? <AppBadge variant="point">{detail.authMethodName}</AppBadge> : <Dash />,
    },
    {
      label: '구간',
      /* 🔴 의미가 확정되지 않아(OQ-037-A) **값만 보여주고 판정하지 않는다** —
         목업의 `상한 +6분` 같은 비교 문구를 적지 않는다 */
      value: <span className="tabular-nums">{formatElapsed(detail.pauseTime)}</span>,
    },
    {
      label: '결과',
      value: (
        <span className="flex flex-wrap items-center gap-1">
          <AppBadge variant={result.variant}>{result.label}</AppBadge>
          {/* 🔴 시간초과는 결과와 **독립 축**이라 병기한다(목록과 같은 규칙) */}
          {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
        </span>
      ),
    },
  ]

  return (
    <>
      {/**
       * 🔴🔴 **좁은 폭에서는 kv 카드로 떨어진다**(사용자 결정 2026-10-20).
       *
       * 스트립을 2칸·4칸으로 접어 봤는데 **깔끔하지 않았다** — 칸이 접히면 라벨과 값이
       * 격자 안에서 들쭉날쭉 끊기고, 가로 구분선이 없어 **어디까지가 한 값인지** 가
       * 흐려진다. 가로 스트립은 **7칸이 한 줄에 들어갈 때만** 값어치가 있다.
       * → `xl` 미만에서는 **전에 쓰던 세로 kv 카드 모양**으로 돌아간다(라벨 좌 · 값 우).
       *
       * 🔴 **분기는 CSS 다**(`spec 030` 규칙). JS 로 폭을 재면 첫 렌더에 깜빡이고
       * 테스트·SSR 에서 폭이 0이라 **항상 한쪽만** 그려진다. DOM 이 두 벌이 되지만
       * 값은 7개뿐이다.
       */}
      <div
        /* 🔴 **두 벌에 각자 이름을 준다**(`spec 030` 선례) — jsdom 에는 스타일시트가 없어
           테스트에서 **둘 다 조회된다.** 이름이 없으면 어느 쪽을 보고 있는지 단언이
           말해 주지 못한다. 좁은 폭 쪽은 `AppDetailCard` 의 제목(`인증 정보`)이 이름을 겸한다 */
        role="group"
        aria-label="인증 요약"
        className="hidden rounded-lg border border-border bg-card xl:grid xl:grid-cols-7"
      >
        {cells.map((cell) => (
          /* 🔴 **왼쪽 구분선으로 칸을 가른다** — 첫 칸만 없다. 값이 몇 개인지 세지 않아도
             경계가 보인다 */
          <div
            key={cell.label}
            className="flex min-w-0 flex-col gap-1 border-l border-border/60 px-4 py-3 first:border-l-0"
          >
            <span className="text-caption text-muted-foreground">{cell.label}</span>
            <span className="truncate text-body font-semibold text-foreground">{cell.value}</span>
          </div>
        ))}
      </div>

      <div className="xl:hidden">
        {/* 🔴 **`AppDetailCard` + `AppDetailRow` 를 그대로 쓴다** — "이전 UI" 가 바로 이것이고,
            좁은 폭 상세 패널의 공용 어휘다. 새 좁은 폭 셸을 만들지 않는다 */}
        <AppDetailCard title="인증 정보">
          {cells.map((cell) => (
            <AppDetailRow key={cell.label} label={cell.label} value={cell.value} />
          ))}
        </AppDetailCard>
      </div>
    </>
  )
}

export default PointHistorySummaryBar
