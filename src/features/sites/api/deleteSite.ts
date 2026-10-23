import api from '@/lib/axios'

/**
 * 사업장 삭제 (`spec 044` T780) — `DELETE /api/v1/Site/W/sign/DeleteSite?siteSeq=`
 *
 * 🔴🔴 **하위 사업장과 소속 지점까지 확인 없이 함께 지운다**(실측 2026-10-23, B-54). 코스·이력·근무자 영향은 미실측.
 * 호출 전 확인창에 영향 범위를 반드시 보여 준다. 없는 사업장은 400 래퍼 `"사업장이 존재하지 않습니다."`.
 */

const DELETE_SITE_PATH = '/api/v1/Site/W/sign/DeleteSite'

export const deleteSite = async (siteSeq: number): Promise<void> => {
  await api.delete(DELETE_SITE_PATH, { params: { siteSeq } })
}
