import { format, isValid, parseISO } from 'date-fns'
import { ChevronRightIcon, PinIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { paths } from '@/router/paths'

import type { DashboardNoticeRow } from '../types'

/**
 * 공지사항 — `spec 067`. 🔴 **핀은 고정 공지에만** — 목업처럼 모든 행에 붙이면 고정이 구분되지 않는다.
 */

const formatDate = (value: string): string => {
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, 'MM.dd') : value
}

interface DashboardNoticePanelProps {
  rows: DashboardNoticeRow[]
}

const DashboardNoticePanel = ({ rows }: DashboardNoticePanelProps) => (
  <section className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
    <div className="flex items-center gap-2">
      <h2 className="text-panel-title font-bold text-foreground">공지사항</h2>
      <Link
        to={paths.service.notice}
        className="ml-auto flex shrink-0 items-center text-caption text-muted-foreground hover:text-foreground"
      >
        전체 보기
        <ChevronRightIcon size={14} />
      </Link>
    </div>

    {rows.length === 0 ? (
      <p className="py-6 text-center text-caption text-muted-foreground">등록된 공지가 없습니다</p>
    ) : (
      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.noticeSeq} className="border-b border-border last:border-0">
            <Link
              to={paths.service.noticeDetail(row.noticeSeq)}
              className="flex items-center gap-2 rounded-sm px-1 py-2.5 text-body hover:bg-muted/40"
            >
              {row.isPin && <PinIcon size={14} className="shrink-0 text-point" aria-label="고정 공지" />}
              <span className="min-w-0 flex-1 truncate text-foreground">{row.title}</span>
              <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                {formatDate(row.createDt)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
)

export default DashboardNoticePanel
