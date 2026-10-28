import api from '@/lib/axios'
import type { SiteManager } from '../types/site'

/**
 * 사업장 담당 관리자 (`spec 057` T1016) — `GET /api/v1/Site/W/sign/GetSiteManagerList?siteSeq=`.
 * 🔴 상속 포함(전체 담당 + 상위 그룹 할당)이다. 화면은 매니저만 쓴다(사용자 결정 2026-10-28).
 */

const GET_SITE_MANAGER_LIST_PATH = '/api/v1/Site/W/sign/GetSiteManagerList'

export const getSiteManagerList = async (siteSeq: number): Promise<SiteManager[]> => {
  const res = await api.get<SiteManager[]>(GET_SITE_MANAGER_LIST_PATH, { params: { siteSeq } })
  return res.data
}
