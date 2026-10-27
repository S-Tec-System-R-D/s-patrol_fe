import { Building2Icon, ChevronRightIcon, FolderTreeIcon, MapPinIcon } from 'lucide-react'

import type { SiteRow } from '../lib/siteList'

/**
 * 사업장 목록의 **좁은 폭(`xl` 미만) 카드** (`046` T889) — 근무자 · 지점 카드와 같은 골격(타일 + 이름 줄 + 보조 줄 + 꺾쇠).
 *
 * 🔴 **하위 사업장은 들여쓴다**(사용자 결정 2026-10-26, A안) — 표와 같이 `└` 를 붙인다.
 * 카드 자체의 들여쓰기는 `LocationsPage` 의 `rowClassName` 이 맡는다(카드 외곽은 `AppTable` 이 그린다).
 * ⚠️ 카드는 `AppTable` 이 `button` 으로 감싸므로 안에 버튼을 두지 않는다(`patterns.md` §14).
 */

const SiteCard = ({ site, depth, groupPath }: SiteRow) => (
  <div className="flex items-center gap-3">
    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
      <Building2Icon size={20} strokeWidth={1.75} />
    </span>

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="truncate text-body font-semibold text-foreground">
        {depth > 0 && <span className="mr-1 text-muted-foreground">└</span>}
        {site.siteName}
      </span>

      <div className="card-meta text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FolderTreeIcon size={13} strokeWidth={1.75} className="shrink-0" />
          {groupPath}
        </span>
        {site.address && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPinIcon size={13} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate">{site.address}</span>
          </span>
        )}
      </div>
    </div>

    <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
  </div>
)

export default SiteCard
