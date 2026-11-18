import type { GroupNode, SiteNode } from '@/features/auth/types/site'
import type { SimSite } from '../types'

/**
 * 본사 `AdminSiteSelect` 의 그룹 트리를 **사업장 선택 목록**으로 편다 (`spec 082`).
 * 그룹 → 그 그룹의 사업장(하위 사업장 포함) → 하위 그룹 순서로, 트리에 나온 순서를 지킨다.
 */
export const flattenSites = (root: GroupNode): SimSite[] => {
  const result: SimSite[] = []

  const visitSite = (site: SiteNode, groupPath: string, parentSiteName: string | null) => {
    result.push({ siteSeq: site.siteSeq, siteName: site.siteName, groupPath, parentSiteName })
    site.children.forEach((child) => visitSite(child, groupPath, site.siteName))
  }

  const visitGroup = (group: GroupNode, parentPath: string) => {
    const groupPath = parentPath ? `${parentPath} / ${group.groupName}` : group.groupName
    group.sites.forEach((site) => visitSite(site, groupPath, null))
    group.children.forEach((child) => visitGroup(child, groupPath))
  }

  visitGroup(root, '')
  return result
}
