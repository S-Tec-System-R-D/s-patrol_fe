import { ClockIcon, MapPinIcon } from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'

import AppBadge from '@/components/app/AppBadge'

import type { CourseRow } from '../types'

/**
 * 코스 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 030` T444).
 *
 * 🔴 **컬럼 6개를 그대로 세로로 쌓지 않는다.** 좁은 화면에서는 행을 훑어 **비교**하지
 * 않고 하나를 **찾아서 누른다** — 식별(코스명)과 상태(뱃지)를 앞에 두고, 비교용 수치는
 * 한 줄로 묶는다(`spec.md` §3 규칙 5).
 *
 * ⚠️ **셸(테두리·배경·클릭)은 `AppTable` 이 그린다.** 여기는 **내용만** 반환한다 —
 * 카드마다 셸을 들고 있으면 네 화면의 모양이 서서히 갈라진다.
 */

const formatPatrolDt = (value: string | null | undefined): string | null => {
  if (!value) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd HH:mm') : null
}

const CourseCard = (course: CourseRow) => {
  const lastPatrol = formatPatrolDt(course.history?.historyEndDt)

  return (
    <div className="flex flex-col gap-2">
      {/* 제목 줄 — 무엇인지 + 지금 어떤 상태인지 */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`text-body font-semibold ${course.useYn ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {course.courseName}
        </span>
        {course.useYn ? (
          <AppBadge variant="success">사용</AppBadge>
        ) : (
          <AppBadge variant="muted">미사용</AppBadge>
        )}
        {/* 🔴 교대는 **양쪽 다 뱃지**다(목록 테이블과 같은 규칙) — 한쪽만 표시하면
            같은 자리에 뱃지와 빈 칸이 섞여 "누락" 처럼 읽힌다 */}
        <AppBadge variant={course.switchYn && course.useYn ? 'success' : 'muted'}>
          {course.switchYn ? '교대 허용' : '교대 없음'}
        </AppBadge>
      </div>

      {/* 비교용 수치는 한 줄로 묶는다 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon size={13} strokeWidth={1.75} />
          {/* 🔴 0개도 그대로 보여준다 — 경고하지 않는다(`spec 023` 규칙 12) */}
          <span className="tabular-nums">지점 {course.pointCount}개</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.75} />
          <span className="tabular-nums">{course.totalMin}분</span>
        </span>
      </div>

      <span className="text-caption text-muted-foreground/80 tabular-nums">
        최근 순찰 {lastPatrol ?? '기록 없음'}
      </span>
    </div>
  )
}

export default CourseCard
