import api from '@/lib/axios'
import { toFormData } from '@/lib/formData'

import type { AddUserRequest } from '../types/user'

/**
 * 근무자 추가 (`spec 041` T683).
 *
 * `POST /api/v1/User/W/sign/AddUser` — `multipart/form-data`
 *
 * 성공은 200 + `data: true`, 🔴 **ID 를 주지 않는다** → `void`. 사번 중복은 400 래퍼
 * `"이미 사용중인 아이디입니다."`(사유가 나오는 드문 경우 — 전역 토스트가 그대로 보여 준다).
 */

const ADD_USER_PATH = '/api/v1/User/W/sign/AddUser'

export const addUser = async (body: AddUserRequest): Promise<void> => {
  await api.post(ADD_USER_PATH, toFormData({ ...body }))
}
