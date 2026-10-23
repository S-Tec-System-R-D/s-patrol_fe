import api from '@/lib/axios'
import type { SiteDetail } from '../types/site'

/**
 * 사업장 상세 (`spec 044` T780) — `GET /api/v1/Site/W/sign/GetSiteDetail?siteSeq=`
 *
 * 🔴 없는(지워진) 사업장은 **400 래퍼 `"잘못된 요청입니다."`**(`data: null`)다 — 404 가 아니다. 현장 계정은 403.
 */

const GET_SITE_DETAIL_PATH = '/api/v1/Site/W/sign/GetSiteDetail'

export const getSiteDetail = async (siteSeq: number): Promise<SiteDetail> => {
  const res = await api.get<SiteDetail>(GET_SITE_DETAIL_PATH, { params: { siteSeq } })
  return res.data
}
