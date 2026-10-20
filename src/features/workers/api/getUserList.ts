import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { UserListParams, UserRow } from '../types/user'

/**
 * 근무자 목록 조회 (`spec 038` T600).
 *
 * `GET /api/v1/User/W/sign/UserList`
 *
 * 🔴 **현장관리자는 403(빈 body)이다**(B-41). 특별 처리하지 않는다 — 인터셉터가 주는 에러가
 * 화면의 "조회 실패" 분기로 간다. 권한을 단정하는 문구를 만들지 않는 이유는 B-41 이 풀리면
 * 그 문구가 거짓이 되기 때문이다.
 */

const GET_USER_LIST_PATH = '/api/v1/User/W/sign/UserList'

export const fetchUserList = async (params: UserListParams): Promise<PagedData<UserRow>> => {
  const res = await api.get<PagedData<UserRow>>(GET_USER_LIST_PATH, { params })
  return res.data
}
