import api from '@/lib/axios'
import { toUpsertNoticeFormData } from '../lib/formData'
import type { UpsertNoticeRequest } from '../types/notice'
import { UPLOAD_TIMEOUT_MS } from './addNotice'

/**
 * 공지 수정 (`spec 040` T663).
 *
 * `PATCH /api/v1/Notice/W/sign/UpsertNotice` — `multipart/form-data`
 *
 * 진짜 부분 갱신이다. 🔴 `title`·`description` 에 `''` 를 보내면 **무시**된다(비울 수 없다) —
 * 폼이 둘 다 필수라 화면에서는 생기지 않는다. 첨부 펼침 규칙은 `toUpsertNoticeFormData`.
 */

const UPSERT_NOTICE_PATH = '/api/v1/Notice/W/sign/UpsertNotice'

export const upsertNotice = async (body: UpsertNoticeRequest): Promise<void> => {
  await api.patch(UPSERT_NOTICE_PATH, toUpsertNoticeFormData(body), { timeout: UPLOAD_TIMEOUT_MS })
}
