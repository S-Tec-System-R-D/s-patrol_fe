import api from '@/lib/axios'
import type { UpdateSiteRequest } from '../types/site'

/**
 * 사업장 수정 (`spec 044` T780) — **`PUT` JSON**, 성공 `data: true`(실측).
 *
 * 정보 수정 · 헬스체크 설정 · 헬스체크 켜기/끄기가 모두 이것이다. 갱신 규칙은 `UpdateSiteRequest` 주석.
 */

const UPDATE_SITE_PATH = '/api/v1/Site/W/sign/UpdateSite'

export const updateSite = async (body: UpdateSiteRequest): Promise<void> => {
  await api.put(UPDATE_SITE_PATH, body)
}
