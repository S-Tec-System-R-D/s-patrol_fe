import { MessageSquareTextIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 030` T446 → `spec 036` T506 서버 전환).
 *
 * 🔴 **구조는 030·034 가 세운 것을 그대로 두고 필드만 바꿨다** — 030 이 "서버로 전환하면
 * 필드명이 바뀐다. 카드 구조는 유지하고 매핑만 손본다" 로 적어 둔 그 작업이다.
 *
 * 🔴 **진행 중이면 종료를 `—` 로 둔다**(사용자 결정 2026-10-16 — **030 의 규칙을
 * 뒤집었다**). 030 은 카드에서 `—` 가 **값 누락**으로 읽힌다고 봤지만, 지금 카드에는
 * **`진행중` 결과 뱃지가 같은 블록 안에** 있어 맥락이 이미 있다 — "종료 진행 중" 은
 * 같은 말을 두 번 하는 것이고 문장으로도 어색하다. 테이블과 표기를 맞춘다.
 *
 * 🔴 **순찰자가 없는 이력이 실측 35%** 다 — 빈 칸으로 두면 데이터 누락처럼 보인다.
 */

const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16)

const ZoneHistoryCard = (row: CourseHistoryRow) => {
  const result = courseResultBadge(row.status)
  const overtime = overtimeBadge(row.overtimeYn)
  const runner =
    row.userList.length === 0
      ? '순찰자 미지정'
      : row.userList.length === 1
        ? row.userList[0].userName
        : `${row.userList[0].userName} 외 ${row.userList.length - 1}명`

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-body font-semibold text-foreground">{row.courseName}</span>
        <AppBadge variant={result.variant}>{result.label}</AppBadge>
        {/* 🔴 좁은 폭에서도 **2개 병기**를 유지한다 — 접으면 테이블과 다른 정보를 준다 */}
        {overtime && <AppBadge variant={overtime.variant}>{overtime.label}</AppBadge>}
        {row.hasMemo && (
          <MessageSquareTextIcon
            size={14}
            className="text-warning-foreground"
            aria-label="특이사항 있음"
          />
        )}
      </div>

      <div className="flex flex-col gap-0.5 text-caption text-muted-foreground tabular-nums">
        <span>{runner}</span>
        <span>시작 {formatDateTime(row.startDt)}</span>
        <span>
          종료 {row.endDt === null ? '—' : formatDateTime(row.endDt)}
          {' · '}
          {formatElapsed(row.actualElapsedTime)}
        </span>
        <span>
          지점 인증 {row.checkedCount}/{row.pointCount}
        </span>
      </div>
    </div>
  )
}

export default ZoneHistoryCard
