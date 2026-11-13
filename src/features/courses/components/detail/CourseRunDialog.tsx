import { format, isValid, parseISO } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon, NfcIcon, QrCodeIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import { useCourseHistoryCheckDetails } from '@/features/course-history/hooks/useCourseHistoryDetail'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { COURSE_HISTORY_STATUS, POINT_HISTORY_STATUS, type CourseHistoryRow } from '@/features/course-history/types'
import type { CheckDetailRow } from '@/features/course-history/types/checkDetail'
import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import { paths } from '@/router/paths'

import { checkRatio } from '../../lib/courseRunStats'

/**
 * 회차 상세 모달 — `spec 074` T1238(시안 `개선 · 회차 상세 모달`). 최근 순찰 기록 행을 누르면 열린다.
 *
 * 🔴 **지점별 결과는 `GetCourseHistoryCheckDetails` 1번**(회차마다) — 대시보드 최근 미완료와 같은 조회 · 같은 키라
 * 다시 열면 캐시를 쓴다.
 * 🔴 **사진 · 메모 · 교대는 여기 없다** — `상세 보기` 로 순찰이력 상세 페이지에 넘긴다(사용자 결정 2026-11-12).
 * 🔴 **이전 · 다음은 받은 회차 목록 안에서만**(최대 100건) — 표에 10건만 보여도 모달은 전부 넘겨 본다.
 * 🔴 지점 순번은 **배열 위치**로 센다 — `orderNo` 는 서버가 중복 값을 저장한다(`spec 032` 선례).
 * 🔄 사용자 검토(2026-11-13): 상태 뱃지는 제목 오른쪽 · 🔴 **순번 동그라미는 회색**(주황이면 `초과` 뱃지와 헷갈린다 —
 *    색은 결과 칸만 쓴다) · 🔴 **진행 중 회차의 남은 지점은 누락이 아니다**(기록 표의 `-` 와 같은 규칙) ·
 *    지점 기록 0건(회차는 있는데 행이 없다, 실존)은 빈 안내.
 */

interface CourseRunDialogProps {
  rows: CourseHistoryRow[]
  /** 열린 회차의 위치. `null` 이면 닫혀 있다 */
  index: number | null
  /** 코스 기준 소요시간(분) */
  totalMin: number
  onIndexChange: (index: number | null) => void
}

const formatDt = (value: string | null, pattern: string): string | null => {
  if (value === null) return null
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, pattern) : value
}

const MethodChip = ({ code }: { code: number | null }) => {
  const label = code === null ? null : toAuthMethodLabel(code)
  if (!label) return null
  const Icon = label === 'QR' ? QrCodeIcon : NfcIcon
  return (
    <span className="inline-flex items-center gap-0.5 rounded-sm bg-muted px-1.5 py-0.5 text-label font-semibold text-muted-foreground">
      <Icon size={11} aria-hidden />
      {label}
    </span>
  )
}

/** 지점 결과 — 완료는 인증 시각, 미완료는 `누락` */
const PointResult = ({ row }: { row: CheckDetailRow }) => {
  if (row.status === POINT_HISTORY_STATUS.COMPLETED) {
    return <span className="tabular-nums text-foreground">{formatDt(row.checkDt, 'HH:mm') ?? '-'}</span>
  }
  if (row.status === POINT_HISTORY_STATUS.INCOMPLETE) {
    return <span className="font-semibold text-danger">누락</span>
  }
  const label =
    row.status === POINT_HISTORY_STATUS.EXCLUDED
      ? '제외'
      : row.status === POINT_HISTORY_STATUS.IN_PROGRESS
        ? '진행 중'
        : '대기'
  return <span className="text-muted-foreground">{label}</span>
}

const Summary = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center gap-4 text-body">
    <span className="w-10 shrink-0 text-caption text-muted-foreground">{label}</span>
    <span className="min-w-0 flex-1">{children}</span>
  </div>
)

const StatusBadges = ({ row }: { row: CourseHistoryRow }) => (
  <span className="flex items-center gap-1">
    {row.status === COURSE_HISTORY_STATUS.COMPLETED ? (
      <AppBadge variant="success">완료</AppBadge>
    ) : row.status === COURSE_HISTORY_STATUS.IN_PROGRESS ? (
      <AppBadge variant="point">진행중</AppBadge>
    ) : (
      <AppBadge variant="danger">미완료</AppBadge>
    )}
    {row.overtimeYn && <AppBadge variant="warning">초과</AppBadge>}
  </span>
)

const RunBody = ({ row, totalMin }: { row: CourseHistoryRow; totalMin: number }) => {
  const details = useCourseHistoryCheckDetails(row.historySeq)
  const remaining = Math.max(row.pointCount - row.checkedCount, 0)
  const inProgress = row.status === COURSE_HISTORY_STATUS.IN_PROGRESS
  const ratio = checkRatio(row.checkedCount, row.pointCount) ?? 0
  const points = details.data ?? []

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Summary label="근무자">
          {row.userList.length === 0 ? (
            <span className="text-muted-foreground">근무자 없음</span>
          ) : (
            row.userList.map((user) => user.userName).join(', ')
          )}
        </Summary>
        <Summary label="소요">
          <span className="tabular-nums">
            <span className="font-semibold">{formatElapsed(row.actualElapsedTime)}</span>
            <span className="text-caption text-muted-foreground"> 기준 {totalMin}분</span>
          </span>
        </Summary>
        <Summary label="인증">
          <span className="flex items-center gap-2 tabular-nums">
            <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-point" style={{ width: `${ratio * 100}%` }} />
            </span>
            {row.checkedCount}/{row.pointCount}
            {remaining > 0 &&
              (inProgress ? (
                <span className="text-muted-foreground">남은 지점 {remaining}</span>
              ) : (
                <span className="font-semibold text-danger">누락 {remaining}</span>
              ))}
          </span>
        </Summary>
      </div>

      <div className="min-h-0 overflow-y-auto border-t border-border">
        {details.isPending ? (
          <div className="flex flex-col gap-2 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : details.isError ? (
          <p className="py-6 text-center text-caption text-muted-foreground">지점별 결과를 불러오지 못했습니다</p>
        ) : points.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">이 회차의 지점 기록이 없습니다</p>
        ) : (
          <ol aria-label="지점별 결과" className="flex flex-col">
            {points.map((point, i) => (
              <li key={point.detailSeq} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-body font-semibold">{point.pointName}</span>
                <MethodChip code={point.authMethod} />
                <span className="w-12 text-right text-body">
                  <PointResult row={point} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

const CourseRunDialog = ({ rows, index, totalMin, onIndexChange }: CourseRunDialogProps) => {
  const row = index === null ? undefined : rows[index]
  const position = index ?? 0

  return (
    <AppDialog
      open={row !== undefined}
      onOpenChange={(open) => !open && onIndexChange(null)}
      title={row ? `${formatDt(row.startDt, 'MM.dd HH:mm')} 순찰` : '순찰'}
      titleClassName="text-lg font-semibold"
      titleSuffix={row && <StatusBadges row={row} />}
      contentClassName="sm:max-w-[560px]"
    >
      {row && (
        <div className="flex min-h-0 flex-col gap-4">
          <RunBody key={row.historySeq} row={row} totalMin={totalMin} />

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <AppButton
              variant="sub"
              icon={ChevronLeftIcon}
              iconSize={14}
              disabled={position === 0}
              onClick={() => onIndexChange(position - 1)}
            >
              이전 회차
            </AppButton>
            <span className="flex flex-col items-center gap-0.5 text-caption text-muted-foreground tabular-nums">
              {position + 1} / {rows.length}
              <Link
                to={paths.service.patrolZoneDetail(row.historySeq)}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                상세 보기
              </Link>
            </span>
            <AppButton
              variant="sub"
              icon={ChevronRightIcon}
              iconPosition="right"
              iconSize={14}
              disabled={position >= rows.length - 1}
              onClick={() => onIndexChange(position + 1)}
            >
              다음 회차
            </AppButton>
          </div>
        </div>
      )}
    </AppDialog>
  )
}

export default CourseRunDialog
