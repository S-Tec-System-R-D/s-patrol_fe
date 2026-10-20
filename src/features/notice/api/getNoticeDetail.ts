import api from '@/lib/axios'
import type { NoticeDetail } from '../types/notice'

/**
 * 공지사항 상세 조회 (`spec 026` T571).
 *
 * `GET /api/v1/Notice/W/sign/DetailNotice?noticeSeq=`
 *
 * ⚠️ `siteSeq` 를 받지 않는다 — 권한 밖 공지도 주소를 고치면 열린다(B-9 와 같은 자리).
 */

const GET_NOTICE_DETAIL_PATH = '/api/v1/Notice/W/sign/DetailNotice'

export const fetchNoticeDetail = async (noticeSeq: number): Promise<NoticeDetail> => {
  const res = await api.get<NoticeDetail>(GET_NOTICE_DETAIL_PATH, { params: { noticeSeq } })
  return res.data
}
