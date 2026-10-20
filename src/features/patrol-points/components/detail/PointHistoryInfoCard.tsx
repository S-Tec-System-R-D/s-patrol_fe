import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryDetail } from '@/features/course-history/types'
import { paths } from '@/router/paths'

/**
 * 지점 인증 1건의 기본 정보 (`spec 037` T553).
 *
 * 🔴 **빼는 것**(`spec.md` §3-8): 이력번호(`PT-20260501-0418`) · 층·위치 · 처리담당자 ·
 * 처리 상태 · 단말 · 좌표 오차 · **확인 처리 버튼**. 전부 **서버에 없는 값**이거나
 * **쓰기 API 가 없다**(`History/*` 는 GET 8종뿐이다).
 *
 * 🔴 **`authMethodName` 의 `'Unknown'` 을 내보내지 않는다.** 상세는 인증수단이 없을 때
 * `'Unknown'` 을 주는데(목록은 `''`, B-6) 그대로 그리면 영문이 섞이고 **"알 수 없는
 * 인증수단"** 처럼 읽힌다 — 실제로는 **인증이 없었다**는 뜻이다.
 *
 * 🔴 **"기준 충족" 판정을 하지 않는다**(`spec.md` §3-7) — `pauseTime` 이 무엇을 센 시간인지
 * 확정되지 않았다(OQ-037-A). 목업의 `상한 +6분` 같은 비교 문구를 **적지 않는다**.
 */

interface PointHistoryInfoCardProps {
  detail: PointHistoryDetail
}

/** 🔴 상세의 `authMethodName` 은 null 일 때 `'Unknown'` 이다(B-6) — 화면에 내보내지 않는다 */
const UNKNOWN_AUTH = 'Unknown'

const PointHistoryInfoCard = ({ detail }: PointHistoryInfoCardProps) => {
  const result = pointCheckBadge(detail.status, detail.checkDt, detail.hasMemo)
  const overtime = overtimeBadge(detail.overtimeYn)
  const hasAuth = detail.authMethod !== null && detail.authMethodName !== UNKNOWN_AUTH

  return (
    <AppDetailCard title="인증 정보">
      <AppDetailRow label="순찰지점" value={detail.pointName} />
      <AppDetailRow
        label="순찰코스"
        value={
          /* ✅ 코스 **관리** 상세로 보낸다 — "그 코스를 언제 돌았는지"(회차)는 `historySeq`
             가 없어 보낼 수 없다(US4). 🔴 그래서 **"코스 순찰 상세" 링크가 아니다** */
          <Link
            to={paths.service.courseDetail(detail.courseSeq)}
            className="text-point-foreground hover:underline"
          >
            {detail.courseName}
          </Link>
        }
      />
      {/* ⚠️ 완료인데 순찰자가 null 인 행이 실재한다(OQ-16, 실측 3건) */}
      <AppDetailRow label="순찰자" value={detail.userName || '순찰자 미지정'} />
      <AppDetailRow
        label="인증시각"
        /* ✅ **미완료 행에도 적는다** — `checkDt` 는 지점 인증 시간이다(OQ-15 해소) */
        value={<span className="tabular-nums">{detail.checkDt.replace('T', ' ')}</span>}
      />
      <AppDetailRow
        label="인증수단"
        value={
          hasAuth ? (
            <AppBadge variant="point">{detail.authMethodName}</AppBadge>
          ) : (
            /* 값 없음은 하이픈이다(`design-system.md` §4-5A) */
            <span className="text-muted-foreground">-</span>
          )
        }
      />
      <AppDetailRow
        label="결과"
        value={
          <span className="flex flex-wrap items-center gap-1">
            <AppBadge variant={result.variant}>{result.label}</AppBadge>
            {/* 🔴 시간초과는 결과와 **독립 축**이라 병기한다(목록과 같은 규칙) */}
            {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
          </span>
        }
      />
      {/* ⚠️ **`pauseTime` 은 목록과 같은 `'HH:mm:ss'` 문자열이다** — 숫자인 것은 **코스**
          상세뿐이다(B-5). 그래서 목록과 **같은 변환 함수**를 쓴다.
          🔴 의미가 확정되지 않아(OQ-037-A) 라벨을 "구간" 으로 두고 **판정하지 않는다** */}
      <AppDetailRow
        label="구간"
        value={<span className="tabular-nums">{formatElapsed(detail.pauseTime)}</span>}
      />
    </AppDetailCard>
  )
}

export default PointHistoryInfoCard
