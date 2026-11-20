import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { NoticeRow } from '@/features/notice/types/notice'
import { paths } from '@/router/paths'

import type { AreaState } from '../types'
import AreaFallback from './AreaFallback'

/**
 * 공지사항 — `spec 067`. 🔴 **핀은 고정 공지에만** — 목업처럼 모든 행에 붙이면 고정이 구분되지 않는다.
 * `spec 068` — `GetNoticeList` 앞 3건(`NoticeRow`) · 서버 순서 그대로(고정 먼저 — 실측).
 */

const formatDate = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd') : value
}

interface DashboardNoticePanelProps {
  rows: NoticeRow[]
  state: AreaState
  onRetry: () => void
}

const DashboardNoticePanel = ({ rows, state, onRetry }: DashboardNoticePanelProps) => (
  <section className="flex flex-col gap-1">
    <div className="flex items-baseline gap-2">
      <h2 className="text-panel-title font-semibold text-foreground">공지사항</h2>
      <Link
        to={paths.service.notice}
        aria-label="공지사항 전체"
        className="ml-auto flex shrink-0 items-center text-caption font-medium text-point hover:underline"
      >
        전체
        <ChevronRightIcon size={14} aria-hidden />
      </Link>
    </div>

    {state !== 'ready' ? (
      <AreaFallback state={state} label="공지" onRetry={onRetry} />
    ) : rows.length === 0 ? (
      <p className="py-6 text-center text-caption text-muted-foreground">등록된 공지가 없습니다</p>
    ) : (
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.noticeSeq} className="border-b border-border last:border-0">
            <Link
              to={paths.service.noticeDetail(row.noticeSeq)}
              className="block py-[9px] hover:bg-muted/40"
            >
              {/* 🔄 `spec 084`(사용자 결정 2026-11-20 — 목업대로): 제목 / 아래 작은 글자 `고정 · 작성자 · 날짜`. 고정은 핀 아이콘 → 글자 */}
              <p className="truncate font-medium text-foreground">{row.title}</p>
              <p className="truncate text-caption text-muted-foreground tabular-nums">
                {row.isPin && <span aria-label="고정 공지">고정 · </span>}
                {row.userName && `${row.userName} · `}
                {formatDate(row.createDt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
)

export default DashboardNoticePanel
