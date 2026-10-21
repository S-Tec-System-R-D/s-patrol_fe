import api from '@/lib/axios'
import { toFormData } from '@/lib/formData'
import type { AddNoticeRequest } from '../types/notice'

/**
 * 공지 작성 (`spec 040` T663).
 *
 * `POST /api/v1/Notice/W/sign/AddNotice` — `multipart/form-data`
 *
 * 성공은 200 + `data: true`. 🔴 **생성된 `noticeSeq` 를 주지 않는다**(실측 2026-10-21) → `void`.
 */

const ADD_NOTICE_PATH = '/api/v1/Notice/W/sign/AddNotice'
/** 🔴 기본 5초(`lib/axios`)로는 첨부 업로드(요청 한도 ~30MB, OQ-19)가 끊긴다 */
export const UPLOAD_TIMEOUT_MS = 60_000

export const addNotice = async ({ file, ...fields }: AddNoticeRequest): Promise<void> => {
  await api.post(ADD_NOTICE_PATH, toFormData(fields, { file }), { timeout: UPLOAD_TIMEOUT_MS })
}
