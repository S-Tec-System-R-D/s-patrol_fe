import api from '@/lib/axios'

/**
 * 관리그룹 삭제 (`spec 043` T737).
 *
 * `DELETE /api/v1/Group/W/sign/DeleteGroup?groupSeq=`
 *
 * 🔴🔴 **하위 그룹과 소속 사업장까지 확인 없이 함께 지운다**(실측 2026-10-22, B-51). 호출 전 확인창에
 * 함께 지워지는 수를 반드시 보여 준다. 없는 그룹은 400 래퍼 `"관리그룹이 존재하지 않습니다."`.
 */

const DELETE_GROUP_PATH = '/api/v1/Group/W/sign/DeleteGroup'

export const deleteGroup = async (groupSeq: number): Promise<void> => {
  await api.delete(DELETE_GROUP_PATH, { params: { groupSeq } })
}
