import api from '@/lib/axios'

/**
 * 공지 삭제 (`spec 040` T663).
 *
 * `DELETE /api/v1/Notice/W/sign/DeleteNotice?noticeSeq=`
 *
 * 없는 ID·이중 삭제는 400 + 래퍼 `"잘못된 요청입니다."`(실측 2026-10-21).
 */

const DELETE_NOTICE_PATH = '/api/v1/Notice/W/sign/DeleteNotice'

export const deleteNotice = async (noticeSeq: number): Promise<void> => {
  await api.delete(DELETE_NOTICE_PATH, { params: { noticeSeq } })
}
