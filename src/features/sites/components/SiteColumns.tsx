import type { ColumnDef } from '@tanstack/react-table'
import { ChevronRightIcon } from 'lucide-react'

import type { SiteRow } from '../lib/siteList'

/**
 * 사업장 목록 컬럼 (`spec 044` T789 → `spec 057`) — 사업장명 · 본부 · 지사 · 주소 + 꺾쇠.
 *
 * 🔄 소속 그룹 `본부 › 지사` 한 칸을 **본부 · 지사 두 열**로 나눴다(사용자 요청 2026-10-28). 경로에 그 단계가 없으면 `-`
 * (본부 직속 사업장 — 테스트 데이터). 좁은 폭 카드는 경로 한 줄 그대로다.
 *
 * 🔴 목업의 코스·지점 · 운영 상태 열은 **뺐다** — 사업장 개념에 없다(사용자 결정 2026-10-23).
 * 🔄 **담당 관리자 열은 뺐다**(`spec 057`) — 사업장마다 `GetSiteManagerList` 를 불러야 해서 목록에는 두지 않고 상세 카드에서만 본다
 *   (사용자 결정 2026-10-27).
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
      id: 'hq',
      header: '본부',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.hqName ?? EMPTY}</span>,
    },
    {
      id: 'branch',
      header: '지사',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.branchName ?? EMPTY}</span>,
    },
    {
      id: 'address',
      header: '주소',
      meta: { className: 'hidden xl:table-cell' },
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.site.address ?? EMPTY}</span>,
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
