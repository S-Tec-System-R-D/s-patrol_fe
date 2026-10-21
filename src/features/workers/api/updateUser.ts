import api from '@/lib/axios'
import { toFormData } from '@/lib/formData'

import type { UpdateUserRequest } from '../types/user'

/**
 * 근무자 수정 (`spec 041` T683) — 정보 수정과 비밀번호 변경이 같은 API 다.
 *
 * 🔴 `POST /api/v1/User/W/sign/UpdateUser` — **PATCH 가 아니다**. `multipart/form-data`.
 *
 * 부분 갱신이라 **넘긴 필드만** 보낸다(`undefined` 는 빠진다). `loginPw` 는 즉시 반영된다(실측).
 */

const UPDATE_USER_PATH = '/api/v1/User/W/sign/UpdateUser'

export const updateUser = async (body: UpdateUserRequest): Promise<void> => {
  await api.post(UPDATE_USER_PATH, toFormData({ ...body }))
}
