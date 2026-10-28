import { ShieldCheckIcon, TriangleAlertIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppDetailCard from '@/components/app/AppDetailCard'
import AppEmpty from '@/components/app/AppEmpty'
import { ADMIN_CODE, adminRoleLabel } from '@/features/admins/lib/adminRole'
import type { SiteManager } from '../types/site'

/**
 * 담당 관리자 카드 (`spec 044` T800 → `048` 재디자인 → `spec 057` `GetSiteManagerList`).
 *
 * - 🔴 **조회만** — 매니저는 본부 · 지사에 속하고 그 아래 사업장을 모두 관리한다. 사업장 단위 지정 API 는 일부러 없다
 *   (사용자 2026-10-27). 그래서 [관리자 지정] · API 미지원 안내를 뺐다.
 * - 🔴 **매니저만** 보인다 — 응답은 전체 담당(시스템관리자 · 마스터)을 모든 사업장에 똑같이 넣어 구분이 안 된다
 *   (사용자 결정 2026-10-28, 관리자 목록과 같은 판단).
 * - 행 모양은 048 그대로 — 왼쪽 포인트 바(순찰 기록 메모 `CheckDetailMemo` 와 같다).
 */

interface SiteManagersCardProps {
  managers: SiteManager[] | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

const SiteManagersCard = ({ managers, isPending, isError, onRetry }: SiteManagersCardProps) => {
  const shown = managers?.filter((manager) => manager.codeSeq === ADMIN_CODE.MANAGER) ?? []

  return (
    <AppDetailCard
      icon={ShieldCheckIcon}
      title="담당 관리자"
      badge={
        !isPending &&
        !isError && <span className="text-caption text-muted-foreground">{shown.length}명</span>
      }
    >
      <p className="text-caption text-muted-foreground">
        관리자 메뉴에서 지정한 담당 그룹으로 정해집니다.
      </p>

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
        <div
          aria-label="담당 관리자 불러오는 중"
          className="h-14 animate-pulse rounded-md bg-muted"
        />
      ) : shown.length === 0 ? (
        <AppEmpty icon={ShieldCheckIcon} title="지정된 담당 관리자가 없습니다" />
      ) : (
        <ul aria-label="담당 관리자" className="flex flex-col gap-2">
          {shown.map((manager) => (
            <li
              key={manager.userSeq}
              className="flex items-center gap-2.5 border-l-2 border-l-point py-1 pl-3"
            >
              <span className="min-w-0 truncate font-semibold text-foreground">
                {manager.userName}
              </span>
              <AppBadge variant="muted">
                {adminRoleLabel(manager.codeSeq, manager.codeName)}
              </AppBadge>
            </li>
          ))}
        </ul>
      )}
    </AppDetailCard>
  )
}

export default SiteManagersCard
