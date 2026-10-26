import { PlusIcon, ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppEmpty from '@/components/app/AppEmpty'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { GroupAdminRow } from '@/features/groups/types/group'

/**
 * 담당 관리자 카드 (`spec 044` T800).
 *
 * 🔴 **사업장 단위 담당 관리자는 서버에 없다**(B-58 — 사용자가 백엔드에 요청 중). 그때까지 **소속 지사 그룹에
 * 할당된 관리자**(`GetGroupAdminList` 의 `isInclude`)를 보여 준다(사용자 결정 2026-10-23). 상위 그룹(본부·회사)
 * 할당은 넣지 않는다(OQ-044-A 기본값). B-58 이 오면 출처만 바꾼다.
 * [관리자 지정] 은 막는다 — 할당은 그룹 단위이고 045(관리자 메뉴)가 만든다.
 */

interface SiteManagersCardProps {
  admins: GroupAdminRow[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

const SiteManagersCard = ({ admins, isPending, isError, onRetry }: SiteManagersCardProps) => {
  const assigned = admins?.filter((admin) => admin.isInclude) ?? []

  return (
    <AppDetailCard
      icon={ShieldCheckIcon}
      title="담당 관리자"
      badge={!isPending && !isError && <span className="text-caption text-muted-foreground">{assigned.length}명</span>}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-caption text-muted-foreground">
          소속 지사 그룹에 할당된 관리자입니다. 할당은 관리자 메뉴에서 그룹 단위로 지정합니다.
        </p>
        {/* 🔴 disabled 버튼은 포인터 이벤트가 없어 툴팁이 안 뜬다 — 감싼 span 에 건다 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="shrink-0">
              <AppButton variant="sub" icon={PlusIcon} iconSize={14} disabled>
                관리자 지정
              </AppButton>
            </span>
          </TooltipTrigger>
          <TooltipContent>관리자 메뉴에서 그룹 단위로 지정합니다</TooltipContent>
        </Tooltip>
      </div>

      {isError ? (
        <div>
          <AppEmpty icon={TriangleAlertIcon} title="담당 관리자를 불러오지 못했습니다" />
          <div className="flex justify-center pb-2">
            <AppButton variant="sub" onClick={onRetry}>
              다시 시도
            </AppButton>
          </div>
        </div>
      ) : isPending ? (
        <div aria-label="담당 관리자 불러오는 중" className="h-14 animate-pulse rounded-md bg-muted" />
      ) : assigned.length === 0 ? (
        <AppEmpty icon={ShieldCheckIcon} title="지정된 담당 관리자가 없습니다" />
      ) : (
        <ul aria-label="담당 관리자" className="flex flex-wrap gap-3">
          {assigned.map((admin) => (
            <li
              key={admin.userSeq}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3"
            >
              <span className="font-medium text-foreground">{admin.userName}</span>
              <AppBadge variant="point">{admin.codeName}</AppBadge>
            </li>
          ))}
        </ul>
      )}
    </AppDetailCard>
  )
}

export default SiteManagersCard
