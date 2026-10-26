import { Link } from 'react-router-dom'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { AUTH_METHOD, type CheckDetailRow, type CourseHistoryDetail } from '@/features/course-history/types'
import { paths } from '@/router/paths'

/**
 * 회차의 순찰 정보 (`spec 036` T512).
 *
 * 🔴 **빼는 것**(spec §3-8, 사용자 결정 2026-10-16): 이력번호 · 사업장 동 · 교대조 ·
 * 단말 · 확인 처리. 전부 **서버에 없는 값**이거나(동·교대조·단말) **쓰기 API 가 없다**
 * (확인 처리 — `History/*` 는 GET 8종뿐이다).
 *
 * 🔴 **"기준 충족" 판정을 하지 않는다** — 소요시간 옆에 기준을 **적기만** 한다(B-31).
 * ⚠️ `totalMin: 0` 인 코스가 실재해 **"기준 0분" 으로 쓰지 않는다**(설정 안 됨과 0분은 다르다).
 */

interface HistoryInfoCardProps {
  detail: CourseHistoryDetail
  /** 인증수단 집계에 쓴다. 조회 전이면 빈 배열 */
  checks: CheckDetailRow[]
}

const HistoryInfoCard = ({ detail, checks }: HistoryInfoCardProps) => {
  /**
   * 🔴 **인증수단 집계는 `CheckDetails` 에서 센다** — 상세 응답에는 없다. 요청은 늘지
   * 않는다(인증 내역을 이미 받는다).
   */
  const qr = checks.filter((row) => row.authMethod === AUTH_METHOD.QR).length
  const nfc = checks.filter((row) => row.authMethod === AUTH_METHOD.NFC).length

  return (
    <AppDetailCard title="순찰 정보">
      {/* 🔴 **행을 한 번 감싼다**(`spec 050`) — `AppDetailCard` 의 `gap-4` 가 행 사이에 끼면
          구분선이 윗행 밑에 붙는다(위 6px · 아래 22px). `SiteInfoCard` · `UserInfoCard` 와 같은 모양 */}
      <div className="flex flex-col">
        <AppDetailRow
          label="순찰 코스"
          value={
            <Link
              to={paths.service.courseDetail(detail.courseSeq)}
              className="text-point-foreground hover:underline"
            >
              {detail.courseName}
            </Link>
          }
        />
        {/* 🔴 순찰자 없는 이력이 실측 35% 다 — 빈 칸으로 두지 않는다 */}
        <AppDetailRow label="순찰자" value={detail.startUserName || '순찰자 미지정'} />
        <AppDetailRow
          label="시작 일시"
          value={<span className="tabular-nums">{detail.startDt.replace('T', ' ')}</span>}
        />
        <AppDetailRow
          label="종료 일시"
          value={
            detail.endDt === null ? (
              /* 🔴 목록과 같은 규칙 — 상태는 헤더 뱃지가 말한다(030 규칙을 뒤집은 자리) */
              <span className="text-muted-foreground">-</span>
            ) : (
              <span className="tabular-nums">{detail.endDt.replace('T', ' ')}</span>
            )
          }
        />
        <AppDetailRow
          label="소요시간"
          value={
            <span>
              {formatElapsed(detail.elapsedTime)}
              <span className="text-muted-foreground">
                {detail.totalMin > 0 ? ` (기준 ${detail.totalMin}분)` : ' (기준 미설정)'}
              </span>
            </span>
          }
        />
        <AppDetailRow
          label="지점 인증"
          value={`${detail.completedPointCount} / ${detail.totalPointCount}개`}
        />
        {/* 🔴 인증이 하나도 없으면 집계 줄을 만들지 않는다 — `QR 0 · NFC 0` 은 정보가 없다 */}
        {qr + nfc > 0 && <AppDetailRow label="인증수단" value={`QR ${qr} · NFC ${nfc}`} />}
        {/* 교대가 있으면 적는다 — 목업에는 없지만 서버가 세어 준다(실측 2명 6건) */}
        {detail.handoverCount > 0 && (
          <AppDetailRow label="교대" value={`${detail.handoverCount}회`} />
        )}
      </div>
    </AppDetailCard>
  )
}

export default HistoryInfoCard
