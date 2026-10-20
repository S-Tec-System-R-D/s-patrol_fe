import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon, PaperclipIcon, PinIcon } from 'lucide-react'

import type { NoticeRow } from '../types/notice'

/**
 * 공지사항 목록 컬럼 (`spec 026` T576).
 *
 * 🔴 **서버에 없는 것은 컬럼으로 두지 않는다**(CLAUDE.md B4): 구 목록의 `#` 번호 ·
 * 읽음/신규 · 앱 푸시 뱃지 · 본문 미리보기. 목록 응답의 `description` 은 본문 전문이지만
 * (B-8) 미리보기로 쓰지 않는다 — 공지는 제목으로 고른다.
 */

/** `'2026-05-28T10:30:00'` → `'2026-05-28'` */
const formatDate = (value: string): string => value.slice(0, 10)

/**
 * 🔴 **정렬을 전부 끈다** — `AppTable` 은 `accessorKey` 컬럼을 기본 정렬 가능으로 보는데
 * 이 목록은 **서버 페이징**이라 클릭하면 현재 페이지만 섞인다(037 `PointColumn` 과 같은 판단).
 */
const noSort = (columns: ColumnDef<NoticeRow>[]): ColumnDef<NoticeRow>[] =>
  columns.map((column) => ({ ...column, enableSorting: false }))

export const noticeColumns = (): ColumnDef<NoticeRow>[] =>
  noSort([
    {
      accessorKey: 'isPin',
      // 🔴 헤더는 비워 보이되 **이름은 남긴다** — 아이콘만 있는 열은 낭독기에서 의미가 사라진다
      header: () => <span className="sr-only">고정</span>,
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <PinIcon size={14} className="text-point" aria-label="고정 공지" />
        ) : null,
      // 🔴 내용 폭까지 줄인다 — 없으면 자동 레이아웃이 남는 폭을 나눠 줘 아이콘 열이 넓어진다
      meta: { className: 'w-px pr-0' },
    },
    {
      accessorKey: 'title',
      header: '제목',
      cell: ({ row }) => {
        const { title, attachCount } = row.original
        return (
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{title}</span>
            {attachCount > 0 && (
              <PaperclipIcon
                size={13}
                className="shrink-0 text-muted-foreground"
                aria-label={`첨부 ${attachCount}개`}
              />
            )}
          </span>
        )
      },
    },
    {
      accessorKey: 'userName',
      header: '작성자',
    },
    {
      accessorKey: 'createDt',
      header: '작성일',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: 'open',
      header: '',
      // 링크가 아니라 꺾쇠만 — 이동은 행 클릭이 한다(036·037 승계)
      cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
    },
  ])
