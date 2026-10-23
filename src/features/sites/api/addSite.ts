import api from '@/lib/axios'
import type { AddSiteRequest } from '../types/site'

/**
 * 사업장 추가 (`spec 044` T780) — **`POST` JSON**, 성공 `data: true`(실측).
 *
 * 🔴 **새 `siteSeq` 를 주지 않는다** — 목록을 다시 받아서 나타난다.
 * 같은 그룹 안 같은 이름은 409 래퍼 `"동일한 위치에 같은 이름의 사업장이 이미 존재합니다."`(그대로 노출 가능).
 * 다른 그룹이면 같은 이름이 허용된다.
 */

const ADD_SITE_PATH = '/api/v1/Site/W/sign/AddSite'

export const addSite = async (body: AddSiteRequest): Promise<void> => {
  await api.post(ADD_SITE_PATH, body)
}
