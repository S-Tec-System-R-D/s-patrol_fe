import api from '@/lib/axios'
import type { UserDetail } from '../types/user'

/**
 * 근무자 상세 조회 (`spec 038` T600).
 *
 * `GET /api/v1/User/W/sign/UserDetail?userId=`
 *
 * 🔴 파라미터 이름은 `userSeq` 가 아니라 **`userId`** 다(B-12). 현장관리자는 403(B-41).
 */

const GET_USER_DETAIL_PATH = '/api/v1/User/W/sign/UserDetail'

export const fetchUserDetail = async (userSeq: number): Promise<UserDetail> => {
  const res = await api.get<UserDetail>(GET_USER_DETAIL_PATH, { params: { userId: userSeq } })
  return res.data
}
