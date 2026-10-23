import { Building2Icon } from 'lucide-react'

import AppEmpty from '@/components/app/AppEmpty'
import AppPageHeader from '@/components/app/AppPageHeader'
import { GroupEditTrigger } from '@/features/groups/components/GroupEditTrigger'
import { GroupFilterButton } from '@/features/groups/components/GroupFilterButton'
import { GroupFilterPanel } from '@/features/groups/components/GroupFilterPanel'
import { branchSiteCount } from '@/features/groups/lib/groupTree'

/**
 * 본사 사업장 `/admin/locations` (`spec 043` T752 — 골격).
 *
 * XL 이상 = 좌측 관리그룹 패널 + 본문 / XL 미만 = 필터 줄 맨 앞 경로 버튼 + 본문(목업 v2 `SitesPage`).
 * 🔴 본문(사업장 목록)은 `spec 044` 가 채운다 — 지금은 트리로 범위를 고르는 것까지만.
 */
const LocationsPage = () => {
  const filterProps = { unitLabel: '사업장', count: branchSiteCount, headerAction: <GroupEditTrigger /> }

  return (
    <div className="flex flex-col gap-4 p-8">
      <AppPageHeader title="사업장" />
      <div className="flex gap-4 items-start">
        <div className="hidden xl:block shrink-0 sticky top-6 self-start">
          <GroupFilterPanel {...filterProps} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="xl:hidden">
            <GroupFilterButton {...filterProps} />
          </div>
          <div className="rounded-lg border border-border bg-card py-12">
            <AppEmpty
              icon={Building2Icon}
              title="사업장 목록 준비 중"
              description="사업장 목록은 다음 단계에서 제공됩니다."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationsPage
