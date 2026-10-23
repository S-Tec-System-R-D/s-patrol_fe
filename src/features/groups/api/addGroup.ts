import api from '@/lib/axios'
import type { AddGroupRequest } from '../types/group'

/**
 * 하위 관리그룹 추가 (`spec 043` T737) — **`POST` JSON**, 성공 `data: true`(실측).
 *
 * 🔴 **새 `groupSeq` 를 주지 않는다** — 트리를 다시 받아서 찾는다.
 * 🔴 서버는 **깊이를 막지 않는다**(B-49) — 3단계 제한은 화면이 지킨다.
 * 같은 부모 아래 같은 이름은 409 래퍼(문구 그대로 노출 가능).
 */

const ADD_GROUP_PATH = '/api/v1/Group/W/sign/AddGroup'

export const addGroup = async (body: AddGroupRequest): Promise<void> => {
  await api.post(ADD_GROUP_PATH, body)
}
