import api from '@/lib/axios'

/** 관리자 삭제 (`spec 056` T992) — `DELETE /api/v1/AdminUser/W/sign/DeleteAdmin?userSeq=`. 지우면 로그인 불가(실측) */

const DELETE_ADMIN_PATH = '/api/v1/AdminUser/W/sign/DeleteAdmin'

export const deleteAdmin = async (userSeq: number): Promise<void> => {
  await api.delete(DELETE_ADMIN_PATH, { params: { userSeq } })
}
