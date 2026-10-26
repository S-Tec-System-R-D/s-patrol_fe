import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'

import type { SiteRow } from '../lib/siteList'

/**
 * 사업장 목록 컬럼 (`spec 044` T789) — 목업 v2 `SitesPage` 에서 4열.
 *
 * 🔴 목업의 코스·지점 · 운영 상태 열은 **뺐다** — 사업장 개념에 없다(사용자 결정 2026-10-23).
 * 🔴 **담당 관리자는 고정 `—`** — 서버에 값이 없다. 사용자가 백엔드에 요청 중이라 자리를 둔다(OQ-044-D).
 */

/** 값 없음 — `design-system.md` §4-5A(999 T869 에서 `—` → `-`) */
const EMPTY = '-'

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
    {
      id: 'managers',
      header: '담당 관리자',
      cell: () => <span className="text-muted-foreground">{EMPTY}</span>,
    },
    {
      id: 'open',
      header: '',
      // 링크가 아니라 꺾쇠만 — 이동은 행 클릭이 한다(꺾쇠 = 상세 페이지 이동, 046 T879)
      cell: () => <ChevronRightIcon size={16} className="text-muted-foreground" aria-hidden />,
    },
  ]
  return columns.map((column) => ({ ...column, enableSorting: false }))
}
