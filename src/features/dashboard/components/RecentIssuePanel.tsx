import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon, MessageSquareTextIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import { POINT_HISTORY_STATUS } from '@/features/course-history/types'
import { paths } from '@/router/paths'

import type { RecentIssueRow } from '../types'

/**
 * 최근 미완료 · 시간초과 — `spec 067`. 최근에 생긴 미완료 · 미인증 · 시간초과 지점을 시간 역순으로 보여준다.
 *
 * 🔴 **"처리할 목록" 이 아니라 최근 기록이다**(사용자 결정 2026-10-30). 처음엔 `확인이 필요한 이력`
 * 이었는데, 그 이름이면 확인하면 사라져야 한다 — 확인 여부를 담을 DB 컬럼이 없다. 그래서 제목 ·
 * 건수 뱃지를 빼고 **일어난 사실만** 적는다.
 * 🔴 **뱃지는 지점 순찰이력과 같은 매핑**(`pointCheckBadge` · `overtimeBadge`) — 시간초과는 빨강이다.
 * 🔴 **단, 인증을 마친 행(`완료`)은 결과 뱃지를 빼고 `시간초과` 만**(사용자 결정 2026-10-30) — 문제만 모은
 * 패널에서 `이상없음 + 시간초과` 는 서로 반대 말이다. 이력 화면들은 그대로 둔다(정상 행과 섞여 있다).
 * 🔴 좁은 폭(`md` 미만)은 코스 · 순찰자를 숨긴다 — 시각 · 지점 · 뱃지만으로 읽힌다.
 */

const formatDateTime = (value: string | null): string => {
  if (value === null) return '-'
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd HH:mm') : value
}

interface RecentIssuePanelProps {
  rows: RecentIssueRow[]
}

const RecentIssuePanel = ({ rows }: RecentIssuePanelProps) => (
  <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-2">
      <h2 className="text-panel-title font-bold text-foreground">최근 미완료 · 시간초과</h2>
      <Link
        to={paths.service.patrolPoints}
        className="ml-auto flex shrink-0 items-center text-caption text-muted-foreground hover:text-foreground"
      >
        전체 보기
        <ChevronRightIcon size={14} />
      </Link>
    </div>

    {rows.length === 0 ? (
      <p className="py-6 text-center text-caption text-muted-foreground">최근 미완료 · 시간초과 기록이 없습니다</p>
    ) : (
      <ul className="flex flex-col">
        {rows.map((row) => {
          const result =
            row.status === POINT_HISTORY_STATUS.COMPLETED
              ? null
              : pointCheckBadge(row.status, row.checkDt, row.hasMemo)
          const overtime = overtimeBadge(row.overtimeYn)
          return (
            <li key={row.detailSeq} className="border-b border-border last:border-0">
              <Link
                to={paths.service.patrolPointDetail(row.detailSeq)}
                className="flex items-center gap-3 rounded-sm px-1 py-2.5 text-body hover:bg-muted/40"
              >
                <span className="w-[72px] shrink-0 text-caption text-muted-foreground tabular-nums">
                  {formatDateTime(row.checkDt)}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{row.pointName}</span>
                <span className="hidden w-24 shrink-0 truncate text-caption text-muted-foreground md:block">
                  {row.courseName}
                </span>
                <span className="hidden w-14 shrink-0 truncate text-caption text-muted-foreground md:block">
                  {row.userName}
                </span>
                {/* 🔴 **폭 고정**(사용자 지적 2026-10-30) — 뱃지가 1개 · 2개로 갈리면 앞의 코스 · 순찰자
                    열이 행마다 밀린다. 가장 긴 조합(`미완료` + `시간초과`)이 들어가는 폭에 왼쪽 정렬 */}
                <span className="flex w-24 shrink-0 gap-1">
                  {result && (
                    <AppBadge variant={result.variant} className={cardBadge}>
                      {result.label}
                    </AppBadge>
                  )}
                  {overtime && (
                    <AppBadge variant={overtime.variant} className={cardBadge}>
                      {overtime.label}
                    </AppBadge>
                  )}
                </span>
                <span className="w-4 shrink-0 text-muted-foreground">
                  {row.hasMemo && <MessageSquareTextIcon size={14} aria-label="메모 있음" />}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    )}
  </section>
)

export default RecentIssuePanel
