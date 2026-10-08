import { format, isValid, parseISO } from 'date-fns'

import ZoneRow from './ZoneRow'
import DetailSection from './DetailSection'
import DetailRow from './DetailRow'
import AuthMethodDisplay from './AuthMethodDisplay'
import { resolveAuthMethodLabel, toAuthMethodLabel } from '../../lib/authMethod'
import type { PointDetail as PointDetailData } from '../../types'

/**
 * 지점 상세의 **본문** (`spec 027` Phase 2).
 *
 * ⚠️ 타입 `PointDetail` 과 이름이 같아 타입을 `PointDetailData` 로 받는다.
 * 타입명은 `api-spec.md` 실측 이름을 따른다(`CLAUDE.md` B4).
 *
 * 🔴 **순수 표시 컴포넌트다.** 제목·상태 뱃지·수정/삭제 액션은 **페이지**가 갖는다
 * (`PointDetailPage`). 상세가 패널이던 시절에는 한 덩어리였지만, 페이지가 되면서
 * "이 지점이 무엇인가"(헤더)와 "그 내용"(본문)의 주인이 갈렸다.
 *
 * 🔴 **섹션마다 카드를 나눈다**(사용자 결정 2026-10-08). 한 카드에 다 담으면 전체 폭에서
 * 세 덩어리의 경계가 흐려진다 — 기본정보·인증수단·소속 코스는 **읽는 목적이 다르고**
 * 길이도 제각각이다. `xl` 이상 2단, 미만 1단(`design-system.md` §2-5).
 *
 * **"지점명" 행은 페이지 제목과 중복이지만 의도적으로 둔다**(사용자 결정 2026-10-08) —
 * 기본정보 블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다.
 * 반면 **"사용여부" 는 제목 옆 뱃지**로 올라가 본문에 두지 않는다(상태는 한 곳에서만).
 * **생성일 행도 없다**: 서버 응답에 `createdAt` 이 없다(OQ-022-I, 실측 확인).
 * 대신 서버가 주는 **최근 순찰**을 보여준다.
 * ⚠️ 목업(`지점관리-신규.png`)에는 생성일이 있어 **갈라진 지점**이다(OQ-027-B).
 */

/** ISO 8601(타임존 없음) → 'yyyy-MM-dd HH:mm'. 값이 없거나 깨졌으면 '-' */
const formatPatrolDt = (value: string | null): string => {
  if (!value) return '-'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : '-'
}

/** 섹션 카드 — 경계를 나누는 것이 목적이라 공용으로 뽑지 않고 여기 둔다(A6) */
const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>{children}</div>
)

const PointDetail = ({ point }: { point: PointDetailData }) => {
  const method = toAuthMethodLabel(point.authMethod)
  const lastPatrol = point.lastPatrolDt
    ? `${formatPatrolDt(point.lastPatrolDt)}${point.lastPatrolUserName ? ` · ${point.lastPatrolUserName}` : ''}`
    : '순찰 기록 없음'

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card>
        <DetailSection title="기본정보">
          {/* 제목과 중복이지만 **의도적으로 둔다**(사용자 결정 2026-10-08) — 기본정보
              블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다 */}
          <DetailRow label="지점명" value={point.name} />
          <DetailRow label="설명" value={point.memo?.trim() || '-'} />
          <DetailRow label="최근 순찰" value={lastPatrol} />
        </DetailSection>
      </Card>

      <Card>
        <DetailSection
          title="인증 수단"
          description="근무자가 이 지점에서 순찰을 인증하는 방식입니다."
        >
          <AuthMethodDisplay value={method} />
          {/* TAG ID 도 같은 행 형식으로 — 카드마다 다른 모양을 쓰지 않는다 */}
          {method === 'NFC' && point.nfcTagId && (
            <DetailRow label="TAG ID" value={point.nfcTagId} />
          )}
          {/* 9·10 외 코드면 세그먼트 둘 다 비강조라 설명이 필요하다 */}
          {method === null && (
            <span className="text-caption text-muted-foreground">
              {resolveAuthMethodLabel(point.authMethod, point.authMethodName) ||
                '인증수단 정보를 확인할 수 없습니다.'}
            </span>
          )}
        </DetailSection>
      </Card>

      {/* 코스는 개수가 가변이라 전체 폭을 쓴다 */}
      <Card className="xl:col-span-2">
        <DetailSection title="소속 코스">
          {point.courseList.length === 0 ? (
            <span className="text-caption text-muted-foreground">소속된 코스가 없습니다.</span>
          ) : (
            point.courseList.map((course) => (
              <ZoneRow key={course.courseSeq} title={course.courseName} />
            ))
          )}
        </DetailSection>
      </Card>
    </div>
  )
}

export default PointDetail
