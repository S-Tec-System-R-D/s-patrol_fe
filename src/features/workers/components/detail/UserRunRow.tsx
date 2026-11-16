import { Fragment, useId } from 'react'
import { ArrowLeftRightIcon, CameraIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, StickyNoteIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import {
  useCourseHistoryCheckDetails,
  useCourseHistoryHandOvers,
} from '@/features/course-history/hooks/useCourseHistoryDetail'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import {
  AUTH_METHOD,
  POINT_HISTORY_STATUS,
  type CheckDetailRow,
  type CourseHistoryRow,
  type HandOverRow,
} from '@/features/course-history/types'
import { cn } from '@/lib/utils'
import { paths } from '@/router/paths'

import { hasHandOver } from '../../lib/userPatrolRuns'

/**
 * 근무자 상세의 **회차 한 줄** + 펼침 (`spec 079` T1307 · T1308, 시안 `개선안/근무자`).
 *
 * 🔴 접힌 줄에는 **교대 · 시간초과만** 적는다(시안) — 미완료 · 특이사항은 펼친 한 줄 요약에서.
 * 🔴 교대 문장은 펼친 지점 목록의 점선 한 곳에만(D6) — 점선을 놓을 지점이 없는 교대만 요약 한 줄로.
 * 🔴 펼칠 때만 그 회차의 지점별 인증(`CheckDetails`) · 교대(`HandOvers`)를 부른다 — 목록에는 지점별 값이 없다(spec 제약 3).
 * 🔴 시간초과는 표시만(D3) — 목록에 코스 기준 시간이 없다.
 */

const hhmm = (value: string | null) => (value ? value.slice(11, 16) : null)

const authLabel = (authMethod: number | null) =>
  authMethod === AUTH_METHOD.QR ? 'QR' : authMethod === AUTH_METHOD.NFC ? 'NFC' : null

/** 나를 기준으로 교대 문장을 만든다 — 나와 상관없는 교대는 `A → B` */
const handOverText = (row: HandOverRow, me: number) => {
  if (row.fromUserSeq === me) return `${row.toUserName}에게 교대`
  if (row.toUserSeq === me) return `${row.fromUserName}에게서 교대받음`
  return `${row.fromUserName} → ${row.toUserName} 교대`
}

const PointLine = ({ check, me }: { check: CheckDetailRow; me: number }) => {
  const done = check.status === POINT_HISTORY_STATUS.COMPLETED
  const badge = pointCheckBadge(check.status, check.checkDt, false)
  const other = check.checkUserSeq !== null && check.checkUserSeq !== me ? check.userName : null
  const memo = check.memos[0]
  const photos = check.memos.reduce((sum, item) => sum + (item.attaches?.length ?? 0), 0)
  return (
    <li className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center gap-3 text-body">
        <span className="w-4 shrink-0 text-right text-caption tabular-nums text-muted-foreground">{check.orderNo}</span>
        <span className={cn('min-w-0 flex-1 truncate', done ? 'font-medium' : 'text-muted-foreground')}>
          {check.pointName}
          {other && <span className="ml-1.5 text-caption font-normal text-muted-foreground">{other}</span>}
        </span>
        {authLabel(check.authMethod) && (
          <span className="shrink-0 text-caption text-muted-foreground">{authLabel(check.authMethod)}</span>
        )}
        {done ? (
          <span className="w-11 shrink-0 text-right tabular-nums">{hhmm(check.checkDt) ?? '-'}</span>
        ) : (
          <AppBadge variant={badge.variant} className={cn('shrink-0', cardBadge)}>
            {badge.label}
          </AppBadge>
        )}
      </div>
      {memo && (
        <div className="ml-7 flex items-start gap-2 rounded-sm bg-warning/10 px-2.5 py-1.5 text-caption">
          <StickyNoteIcon size={13} className="mt-0.5 shrink-0 text-warning-foreground" aria-hidden />
          <span className="min-w-0 flex-1 whitespace-pre-line">{check.memos.map((item) => item.memo).join('\n')}</span>
          {photos > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
              <CameraIcon size={12} aria-hidden />
              사진 {photos}
            </span>
          )}
        </div>
      )}
    </li>
  )
}

const RunDetail = ({ row, me }: { row: CourseHistoryRow; me: number }) => {
  const checks = useCourseHistoryCheckDetails(row.historySeq)
  const handOvers = useCourseHistoryHandOvers(hasHandOver(row) ? row.historySeq : null)

  if (checks.isPending) return <div className="h-24 animate-pulse rounded-sm bg-muted" />
  if (checks.isError) {
    /* 🔴 실패를 "지점 없음" 으로 보이지 않는다 */
    return <p className="py-3 text-caption text-muted-foreground">지점별 기록을 불러오지 못했습니다.</p>
  }

  const list = [...checks.data].sort((a, b) => a.orderNo - b.orderNo)
  const turns = handOvers.data ?? []
  const missed = list.filter((check) => check.status === POINT_HISTORY_STATUS.INCOMPLETE).length
  const memos = list.filter((check) => check.memos.length > 0).length

  /* 점선을 놓을 지점이 없는 교대(nextOrderNo 없음 · 목록 밖)만 요약에 — 같은 교대를 두 번 적지 않는다 */
  const loose = turns.filter((turn) => !list.some((check) => check.orderNo === turn.nextOrderNo))
  const summary = [
    ...loose.map((turn, i) => ({ key: `h${i}`, text: handOverText(turn, me), tone: 'text-point-foreground' })),
    missed > 0 ? { key: 'm', text: `미완료 ${missed}`, tone: 'text-warning-foreground' } : null,
    memos > 0 ? { key: 's', text: `특이사항 ${memos}`, tone: 'text-warning-foreground' } : null,
    row.overtimeYn ? { key: 'o', text: '시간초과', tone: 'text-danger' } : null,
  ].filter((item): item is { key: string; text: string; tone: string } => item !== null)

  return (
    <div className="flex flex-col gap-2">
      {summary.length > 0 && (
        <p className="flex flex-wrap gap-x-2 text-caption font-medium">
          {summary.map((item, i) => (
            <span key={item.key} className={item.tone}>
              {i > 0 && <span className="mr-2 text-muted-foreground/60">·</span>}
              {item.text}
            </span>
          ))}
        </p>
      )}
      {list.length === 0 ? (
        /* ⚠️ 회차는 있는데 인증 행이 0건인 경우가 실재한다(완료인데 checkedCount 0) */
        <p className="py-2 text-caption text-muted-foreground">지점별 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col rounded-sm border border-border/60 bg-card px-3 py-1">
          {list.map((check) => {
            const turn = turns.find((item) => item.nextOrderNo === check.orderNo)
            return (
              <Fragment key={check.detailSeq}>
                {turn && (
                  <li className="flex items-center gap-2 py-1 text-caption font-medium text-point-foreground">
                    <ArrowLeftRightIcon size={12} aria-hidden />
                    {handOverText(turn, me)}
                    <span className="flex-1 border-t border-dashed border-point/40" aria-hidden />
                  </li>
                )}
                <PointLine check={check} me={me} />
              </Fragment>
            )
          })}
        </ul>
      )}
      <Link
        to={paths.service.patrolZoneDetail(row.historySeq)}
        className="ml-auto inline-flex items-center gap-0.5 text-caption font-medium text-point-foreground hover:underline"
      >
        순찰 이력 상세 보기
        <ChevronRightIcon size={13} aria-hidden />
      </Link>
    </div>
  )
}

interface UserRunRowProps {
  row: CourseHistoryRow
  /** 이 근무자 — 펼친 지점에서 상대 근무자 몫을 가른다 */
  userSeq: number
  open: boolean
  onToggle: () => void
}

const UserRunRow = ({ row, userSeq, open, onToggle }: UserRunRowProps) => {
  const panelId = useId()
  const ratio = row.pointCount > 0 ? Math.round((row.checkedCount / row.pointCount) * 100) : 0
  const end = hhmm(row.endDt)
  /* 🔴 접근 이름을 따로 준다 — 칸마다 span 이라 내용으로 셈하면 `14:28– 14:40지하 주차장…` 처럼 붙어 읽힌다 */
  const label = [
    `${hhmm(row.startDt)} – ${end ?? '진행 중'}`,
    row.courseName,
    `인증 ${row.checkedCount}/${row.pointCount}`,
    hasHandOver(row) ? '교대' : null,
    row.overtimeYn ? '시간초과' : null,
    formatElapsed(row.actualElapsedTime),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={cn('rounded-md', open && 'bg-muted/40')}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-md px-2 py-2.5 text-left hover:bg-muted/50"
      >
        {/* 🔴 좁은 폭에서는 시각 · 코스명 한 줄, 숫자들은 다음 줄 — 한 줄에 몰면 코스명이 한 글자로 잘렸다(390 캡처) */}
        <span className="flex min-w-[220px] flex-1 items-center gap-3">
          <span className="w-[92px] shrink-0 text-body tabular-nums">
            <span className="font-semibold">{hhmm(row.startDt)}</span>
            <span className="text-muted-foreground"> – {end ?? '진행 중'}</span>
          </span>
          <span className="min-w-0 flex-1 truncate text-body font-semibold">{row.courseName}</span>
        </span>
        <span className="ml-auto flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
          {/* 🔴 있다 없다 하는 표시는 막대 왼쪽 — 오른쪽(막대 · 인증 · 소요)은 폭을 고정해 줄마다 세로로 맞춘다(D7) */}
          {hasHandOver(row) && (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption font-medium text-point-foreground">
              <ArrowLeftRightIcon size={12} aria-hidden />
              교대
            </span>
          )}
          {row.overtimeYn && (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption font-medium text-danger">
              <ClockIcon size={12} aria-hidden />
              시간초과
            </span>
          )}
          <span className="flex shrink-0 items-center gap-2">
            {/* 🔴 비율만 — 지점별 인증 여부는 목록에 없다. 색을 입히지 않는다(분모 미확인, api-spec 15) */}
            <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
              <span className="block h-full rounded-full bg-point" style={{ width: `${ratio}%` }} />
            </span>
            <span className="w-[60px] text-caption tabular-nums text-muted-foreground">
              인증 {row.checkedCount}/{row.pointCount}
            </span>
          </span>
          <span className="w-12 shrink-0 text-right text-caption tabular-nums text-muted-foreground">
            {formatElapsed(row.actualElapsedTime)}
          </span>
          <ChevronDownIcon
            size={14}
            className={cn('shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-2 pt-1 pb-3">
          <RunDetail row={row} me={userSeq} />
        </div>
      )}
    </li>
  )
}

export default UserRunRow
