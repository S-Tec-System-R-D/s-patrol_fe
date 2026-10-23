import type { ColumnDef } from '@tanstack/react-table'

import type { SiteRow } from '../lib/siteList'

/**
 * 사업장 목록 컬럼 (`spec 044` T789) — 목업 v2 `SitesPage` 의 6열.
 *
 * 🔴 **코스·지점 · 담당 관리자 · 운영 상태는 고정 `—`** — 서버에 값이 없다(B-55 · B-56 · OQ-044-D).
 * 자리는 목업대로 두고 막는다(사용자 결정 2026-10-23). 백엔드가 채워 주면 값으로 바꾼다.
 */

const EMPTY = '—'

/** 서버 값이 없는 열 — 같은 모양 3개 */
const emptyColumn = (id: string, header: string): ColumnDef<SiteRow> => ({
  id,
  header,
  cell: () => <span className="text-muted-foreground">{EMPTY}</span>,
})

/** 🔴 정렬을 끈다 — 하위 사업장이 모 사업장 바로 아래 있어야 한다(응답 순서) */
export const siteColumns = (): ColumnDef<SiteRow>[] => {
  const columns: ColumnDef<SiteRow>[] = [
    {
      id: 'siteName',
      header: '사업장명',
      cell: ({ row }) => {
        const { site, depth } = row.original
        return (
          // 하위 사업장은 단계마다 16px 들여쓰고 `└` 를 붙인다
          <div className="flex flex-col" style={{ paddingLeft: depth * 16 }}>
            <span className="font-medium">
              {depth > 0 && <span className="mr-1 text-muted-foreground">└</span>}
              {site.siteName}
            </span>
            {/* XL 미만은 주소 열이 없어 이름 아래 보조 줄로(목업) */}
            {site.address && <span className="text-caption text-muted-foreground xl:hidden">{site.address}</span>}
          </div>
        )
      },
    },
    {
      id: 'group',
      header: '소속 그룹',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.groupPath}</span>,
    },
    {
      id: 'address',
      header: '주소',
      meta: { className: 'hidden xl:table-cell' },
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.site.address ?? EMPTY}</span>,
    },
    emptyColumn('coursePoint', '코스 · 지점'),
    emptyColumn('managers', '담당 관리자'),
    emptyColumn('status', '운영 상태'),
  ]
  return columns.map((column) => ({ ...column, enableSorting: false }))
}
