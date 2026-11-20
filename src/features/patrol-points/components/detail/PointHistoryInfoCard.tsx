import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { POINT_HISTORY_STATUS, type PointHistoryDetail } from '@/features/course-history/types'
import { paths } from '@/router/paths'

/**
 * 지점 인증 상세 — **우측 인증 정보 카드** (`spec 050`, 사용자 결정 2026-10-26).
 *
 * 🔴 **순찰 상세(036)의 `HistoryInfoCard` 와 같은 자리 · 같은 모양이다.** 전에는 상단 가로
 * 요약 스트립(7칸, 2026-10-20)이었는데 두 상세의 골격이 달라 보여 **순찰 상세 골격으로
 * 맞췄다** — 머리(제목 + 결과 뱃지) · 좌 2/3 콘텐츠 · 우 1/3 kv 카드.
 *
 * 🔴 **`순찰지점` · `결과` 행이 없다** — 지점명은 페이지 제목이, 결과는 제목 옆 뱃지가
 * 말한다(순찰 상세도 결과는 머리 뱃지에만 있다).
 *
 * 🔴 **목업에서 뺀 것**: 지도 부제의 `수신감도 · 오차 8m`(**그런 필드가 서버에 없다** —
 * 좌표만 온다) · 푸터 `기록은 인증 시각 ±5분 이내 등록 건만 연결됩니다`(**그런 규칙을
 * 모른다** — 메모는 서버가 인증 1건에 묶어서 준다) · `원본 다운로드`(첨부 URL 이 404 다,
 * B-40). 셋 다 적으면 **지어낸 값**이 된다(A1).
 *
 * 🔄 **`spec 078`: `구간` 행을 뺐다**(사용자 결정 2026-11-13). `pauseTime` 은 무엇을 센 시간인지
 * 확정되지 않았고(OQ-037-A) 시안은 `이전 지점에서 N분 이동` 으로 이름을 붙였는데 그 근거가 없다.
 * 시안의 `순찰 회차` 링크도 없다 — 회차 번호(`historySeq`)가 응답에 없다(037 US4).
 * 🔄 특이사항이 있으면(또는 좌표가 없으면) 페이지가 `map` 으로 지도 · 좌표 없음 자리를 넘긴다 — 카드 맨 위에 틀 없이 붙는다(시안 · D5).
 */

interface PointHistoryInfoCardProps {
  detail: PointHistoryDetail
  /** 카드 맨 위에 붙일 지도(특이사항이 있거나 좌표가 없을 때) */
  map?: React.ReactNode
}

/** 🔴 상세의 `authMethodName` 은 null 일 때 `'Unknown'` 이다(B-6) — 화면에 내보내지 않는다 */
const UNKNOWN_AUTH = 'Unknown'

/** 값 없음은 하이픈이다(`design-system.md` §4-5A) */
const Dash = () => <span className="text-muted-foreground">-</span>

const PointHistoryInfoCard = ({ detail, map }: PointHistoryInfoCardProps) => {
  const hasAuth = detail.authMethod !== null && detail.authMethodName !== UNKNOWN_AUTH
  /* 🔄 `spec 078` D7 — 미인증(서버 3)은 수단이 **없는 게 맞다** → 이유를 적는다. 완료인데 없으면 값 누락이라 `-` */
  const notChecked = detail.status !== POINT_HISTORY_STATUS.COMPLETED

  return (
    /* 🔴 지도를 받으면 카드 틀은 이 바깥 상자가 갖는다 — 안쪽 `AppDetailCard` 의 테두리 · 모서리를 지운다 */
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {map}
      <div className="[&>div]:rounded-none [&>div]:border-0">
        <AppDetailCard title="인증 정보">
          {/* 🔴 **행을 한 번 감싼다**(`spec 050`) — `AppDetailCard` 의 `gap-4` 가 행 사이에 끼면 구분선이 윗행 밑에 붙는다 */}
          <div className="flex flex-col">
            <AppDetailRow
              label="순찰코스"
              value={
                /* ✅ 코스 **관리** 상세로 간다 — 회차(`historySeq`)를 몰라 "순찰 상세" 로는 보낼 수 없다(US4) */
                <Link to={paths.service.courseDetail(detail.courseSeq)} className="text-point-foreground hover:underline">
                  {detail.courseName}
                </Link>
              }
            />
            {/* ⚠️ 완료인데 순찰자가 null 인 행이 실재한다(OQ-16, 실측 3건) */}
            <AppDetailRow label="순찰자" value={detail.userName || '순찰자 미지정'} />
            <AppDetailRow
              label="인증시각"
              /* ✅ 미완료 행에도 적는다(OQ-15 해소). 🔴 초를 버리지 않는다 — 같은 분에 연달아 찍히는 경우가 있다 */
              value={<span className="tabular-nums">{detail.checkDt.replace('T', ' ')}</span>}
            />
            <AppDetailRow
              label="인증수단"
              value={
                hasAuth ? (
                  <AppBadge variant="plain">{detail.authMethodName}</AppBadge>
                ) : notChecked ? (
                  <span className="text-muted-foreground">인증하지 않음</span>
                ) : (
                  <Dash />
                )
              }
            />
          </div>
        </AppDetailCard>
      </div>
    </div>
  )
}

export default PointHistoryInfoCard
