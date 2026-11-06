import { Link } from 'react-router-dom'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import type { CourseAverage } from '@/features/course-history/lib/courseAverage'
import { formatDuration, formatElapsed } from '@/features/course-history/lib/elapsed'
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
 *
 * 🔴 **KPI 줄을 없애고 고유한 값만 여기로 옮겼다**(사용자 결정 2026-11-06) — 코스 평균 · 메모 · 사진.
 * 지점 인증 · 소요시간은 이 카드 · 지도 · 인증 내역과 겹쳤고, 구간 평균은 표의 `구간` 칸이 대신한다.
 */

interface HistoryInfoCardProps {
  detail: CourseHistoryDetail
  /** 인증수단 집계에 쓴다. 조회 전이면 빈 배열 */
  checks: CheckDetailRow[]
  /** 같은 코스의 완료 건 평균. 조회 전이면 `undefined` */
  average?: CourseAverage
}

/** `(기준 45분 · 평균 1시간 5분)`. 🔴 기준과 평균을 나란히 적기만 한다 */
const elapsedNote = (totalMin: number, average?: CourseAverage): string => {
  const target = totalMin > 0 ? `기준 ${totalMin}분` : '기준 미설정'
  if (average?.averageSeconds === null || average?.averageSeconds === undefined) return ` (${target})`
  const label = average.partial ? '최근 100회 평균' : '평균'
  return ` (${target} · ${label} ${formatDuration(average.averageSeconds)})`
}

const HistoryInfoCard = ({ detail, checks, average }: HistoryInfoCardProps) => {
  /**
   * 🔴 **인증수단 집계는 `CheckDetails` 에서 센다** — 상세 응답에는 없다. 요청은 늘지
   * 않는다(인증 내역을 이미 받는다).
   */
  const qr = checks.filter((row) => row.authMethod === AUTH_METHOD.QR).length
  const nfc = checks.filter((row) => row.authMethod === AUTH_METHOD.NFC).length

  const memoCount = checks.reduce((sum, row) => sum + row.memos.length, 0)
  const photoCount = checks.reduce(
    (sum, row) => sum + row.memos.reduce((n, memo) => n + (memo.attaches?.length ?? 0), 0),
    0
  )

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
        {/* 교대 회차는 이 값이 시작한 사람뿐이다 — 전체는 `교대 이력` 이 말한다(`spec 070`) */}
        <AppDetailRow
          label={detail.handoverCount > 0 ? '시작 순찰자' : '순찰자'}
          value={detail.startUserName || '순찰자 미지정'}
        />
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
              <span className="text-muted-foreground">{elapsedNote(detail.totalMin, average)}</span>
            </span>
          }
        />
        <AppDetailRow
          label="지점 인증"
          value={`${detail.completedPointCount} / ${detail.totalPointCount}개`}
        />
        {/* 🔴 인증이 하나도 없으면 집계 줄을 만들지 않는다 — `QR 0 · NFC 0` 은 정보가 없다 */}
        {qr + nfc > 0 && <AppDetailRow label="인증수단" value={`QR ${qr} · NFC ${nfc}`} />}
        {/* 🔴 인증 내역을 받기 전에는 `없음` 으로 단정하지 않는다 */}
        {checks.length > 0 && (
          <AppDetailRow
            label="특이사항"
            value={memoCount === 0 ? '없음' : `메모 ${memoCount} · 사진 ${photoCount}`}
          />
        )}
        {/* 교대가 있으면 적는다 — 목업에는 없지만 서버가 세어 준다(실측 2명 6건) */}
        {detail.handoverCount > 0 && (
          <AppDetailRow label="교대" value={`${detail.handoverCount}회`} />
        )}
      </div>
    </AppDetailCard>
  )
}

export default HistoryInfoCard
