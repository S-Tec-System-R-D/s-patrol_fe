import { useQuery } from '@tanstack/react-query'

import { fetchUserList } from '../api/getUserList'
import { userKeys } from '../queryKeys'
import type { UserListParams } from '../types/user'

/**
 * 근무자 목록 (`spec 038` T603).
 *
 * 🔴 **`params` 가 `null` 이면 호출하지 않는다**(= 사업장 미확보). 서버가 사업장 권한을 검사하지
 * 않으므로(B-9) 엉뚱한 값으로 보내면 **남의 사업장 사람이 정상 화면처럼** 온다(026 과 같은 판단).
 */
export const useUserList = (params: UserListParams | null) =>
  useQuery({
    queryKey: userKeys.list(params ?? ({ siteId: -1 } as UserListParams)),
    queryFn: () => fetchUserList(params as UserListParams),
    enabled: params !== null,
  })
