import { Fragment, useId } from 'react'
import { ArrowLeftRightIcon, CameraIcon, ChevronDownIcon, ChevronRightIcon, ClockIcon, MessageSquareTextIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge } from '@/components/app/AppBadge.variants'
import {
  useCourseHistoryCheckDetails,
  useCourseHistoryHandOvers,
} from '@/features/course-history/hooks/useCourseHistoryDetail'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import { courseResultBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import {
  AUTH_METHOD,
  COURSE_HISTORY_STATUS,
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
 * 🔴 접힌 줄에는 **미완료 · 교대 · 특이사항 · 시간초과만** 적는다 — 회차의 것만이다(`spec 079` D13). 지점 `미인증` 은
 *    펼친 지점 목록이 말한다 — 목록 위 요약(`미인증 n` · `특이사항 n` · `시간초과`)은 뺐다(줄 · 목록과 같은 말을 두 번 한다, 사용자).
 * 🔄 `특이사항` 표시(D14) — 요약의 `특이사항` 칸을 빼면서 줄로 옮겼다(안 그러면 줄을 하나씩 펼쳐야 안다).
 *    있는지만 적는다 — 목록 응답에는 `hasMemo` 뿐이고 건수가 없다.
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

/**
 * 펼친 내용의 지점 한 줄 — **세로 타임라인**(사용자 결정 2026-11-21 · A안. 순찰이력 상세의 수행 타임라인을 작게 줄인 모양).
 *
 * 전에는 번호 · 이름 · 시각이 같은 크기 · 같은 색으로 쌓인 목록이라 밋밋했다 — 상태가 글자에만 있고 순서가 이어져 보이지 않았다.
 * - 번호를 원 안에 넣고 세로 선으로 잇는다. 인증 = 초록 채움 · 미인증 = 회색 테두리 · 그 밖(대기 등) = 회색 바탕.
 * - 특이사항은 회색 띠 → **옅은 테두리 상자**로 그 지점 아래에 들여 넣는다(타임라인에서 가지가 나온 모양).
 */
const PointLine = ({ check, me, last }: { check: CheckDetailRow; me: number; last: boolean }) => {
  const done = check.status === POINT_HISTORY_STATUS.COMPLETED
  const missed = check.status === POINT_HISTORY_STATUS.INCOMPLETE
  const badge = pointCheckBadge(check.status, false)
  const other = check.checkUserSeq !== null && check.checkUserSeq !== me ? check.userName : null
  const memo = check.memos[0]
  const photos = check.memos.reduce((sum, item) => sum + (item.attaches?.length ?? 0), 0)
  return (
    <li className="flex gap-3">
      <div className="flex w-[22px] shrink-0 flex-col items-center">
        <span
          className={cn(
            'grid size-[22px] shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums',
            done
              ? 'bg-success text-white'
              : missed
                ? 'border-2 border-muted-foreground/50 bg-card text-muted-foreground'
                : 'bg-muted text-muted-foreground'
          )}
        >
          {check.orderNo}
        </span>
        {!last && <span aria-hidden className="w-px flex-1 bg-border" />}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', !last && 'pb-3')}>
        <div className="flex min-h-[22px] items-center gap-3 text-body">
          <span className={cn('min-w-0 flex-1 truncate', done ? 'font-medium text-foreground' : 'text-muted-foreground')}>
            {check.pointName}
            {other && <span className="ml-1.5 text-caption font-normal text-muted-foreground">{other}</span>}
          </span>
          {authLabel(check.authMethod) && (
            <span className="shrink-0 text-caption text-muted-foreground">{authLabel(check.authMethod)}</span>
          )}
          {done ? (
            <span className="w-11 shrink-0 text-right text-sub-foreground tabular-nums">{hhmm(check.checkDt) ?? '-'}</span>
          ) : (
            <AppBadge variant={badge.variant} className={cn('shrink-0', cardBadge)}>
              {badge.label}
            </AppBadge>
          )}
        </div>
        {memo && (
          <div className="flex items-start gap-2 rounded-md border border-border px-2.5 py-2 text-caption">
            <MessageSquareTextIcon size={13} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 whitespace-pre-line text-foreground">
              {check.memos.map((item) => item.memo).join('\n')}
            </span>
            {photos > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                <CameraIcon size={12} aria-hidden />
                사진 {photos}
              </span>
            )}
          </div>
        )}
      </div>
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

  /* 점선을 놓을 지점이 없는 교대(nextOrderNo 없음 · 목록 밖)만 목록 위 한 줄에 — 같은 교대를 두 번 적지 않는다 */
  const loose = turns.filter((turn) => !list.some((check) => check.orderNo === turn.nextOrderNo))

  return (
    <div className="flex flex-col gap-3">
      {loose.length > 0 && (
        <p className="flex flex-wrap gap-x-2 text-caption font-medium text-point-foreground">
          {loose.map((turn, i) => (
            <span key={i}>
              {i > 0 && <span className="mr-2 text-muted-foreground/60">·</span>}
              {handOverText(turn, me)}
            </span>
          ))}
        </p>
      )}
      {list.length === 0 ? (
        /* ⚠️ 회차는 있는데 인증 행이 0건인 경우가 실재한다(완료인데 checkedCount 0) */
        <p className="py-2 text-caption text-muted-foreground">지점별 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col">
          {list.map((check, index) => {
            const turn = turns.find((item) => item.nextOrderNo === check.orderNo)
            return (
              <Fragment key={check.detailSeq}>
                {turn && (
                  /* 교대 — 타임라인의 세로 선은 끊지 않는다(왼쪽에 선 조각을 잇는다) */
                  <li className="flex gap-3">
                    <span className="flex w-[22px] shrink-0 justify-center" aria-hidden>
                      <span className="w-px bg-border" />
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2 pb-3 text-caption font-medium text-point">
                      <ArrowLeftRightIcon size={12} aria-hidden />
                      {handOverText(turn, me)}
                      <span className="flex-1 border-t border-dashed border-point/40" aria-hidden />
                    </span>
                  </li>
                )}
                <PointLine check={check} me={me} last={index === list.length - 1} />
              </Fragment>
            )
          })}
        </ul>
      )}
      <Link
        to={paths.service.patrolZoneDetail(row.historySeq)}
        className="ml-auto inline-flex items-center gap-0.5 text-caption font-medium text-point hover:underline"
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
  /** 회차 상태 — 순찰이력 목록과 같은 표시(진행중 · 완료 · 미완료) */
  const result = courseResultBadge(row.status)
  /* 🔴 접근 이름을 따로 준다 — 칸마다 span 이라 내용으로 셈하면 `14:28– 14:40지하 주차장…` 처럼 붙어 읽힌다 */
  const label = [
    `${hhmm(row.startDt)} – ${end ?? '진행 중'}`,
    row.courseName,
    `인증 ${row.checkedCount}/${row.pointCount}`,
    row.status === COURSE_HISTORY_STATUS.INCOMPLETE ? '미완료' : null,
    hasHandOver(row) ? '교대' : null,
    row.hasMemo ? '특이사항' : null,
    row.overtimeYn ? '시간초과' : null,
    formatElapsed(row.actualElapsedTime),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    /* 🔄 `spec 084`(목업 `14`): 한 줄 = **코스 · 시각 · 소요 · 막대 + n/N | 교대 · 특이사항 · 상태 · 펼침**(전에는 시각이 맨 앞 · 상태 글자가 막대 왼쪽).
       줄 사이 선 · 줄 높이 46px. 펼침은 유지한다(사용자 결정 2026-11-21) — 펼친 내용은 "내용만 흰 상자" */
    <li className="border-b border-border">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-[46px] w-full flex-wrap items-center gap-x-4 gap-y-1 py-1.5 text-left hover:bg-muted/50"
      >
        <span className="w-[200px] min-w-0 shrink-0 truncate font-medium text-foreground">{row.courseName}</span>
        <span className="w-[130px] shrink-0 text-sub-foreground tabular-nums">
          {hhmm(row.startDt)} ~ {end ?? ''}
        </span>
        <span className={cn('inline-flex w-[110px] shrink-0 items-center gap-1 tabular-nums', row.overtimeYn ? 'text-danger' : 'text-sub-foreground')}>
          {row.overtimeYn && <ClockIcon size={12} aria-hidden />}
          {row.overtimeYn && <span className="sr-only">시간초과</span>}
          {formatElapsed(row.actualElapsedTime)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {/* 🔴 비율만 — 지점별 인증 여부는 목록에 없다. 색을 입히지 않는다(분모 미확인, api-spec 15) */}
          <span className="hidden h-1 w-14 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
            <span className="block h-full rounded-full bg-point" style={{ width: `${ratio}%` }} />
          </span>
          <span className="text-caption tabular-nums text-muted-foreground">
            <span className="sr-only">인증 </span>
            {row.checkedCount}/{row.pointCount}
          </span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2.5">
          {hasHandOver(row) && (
            <span className="inline-flex shrink-0 items-center gap-1 text-caption text-sub-foreground">
              <ArrowLeftRightIcon size={12} className="text-muted-foreground" aria-hidden />
              교대
            </span>
          )}
          <AppBadge variant={result.variant}>{result.label}</AppBadge>
          {row.hasMemo && (
            <span className="inline-flex shrink-0">
              <MessageSquareTextIcon size={14} className="text-muted-foreground" aria-hidden />
              <span className="sr-only">특이사항</span>
            </span>
          )}
          <ChevronDownIcon
            size={14}
            className={cn('shrink-0 text-muted-foreground/70 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </span>
      </button>
      {open && (
        <div id={panelId} className="mb-3 rounded-lg border border-border bg-card p-3.5">
          <RunDetail row={row} me={userSeq} />
        </div>
      )}
    </li>
  )
}

export default UserRunRow
