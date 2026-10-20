import api from '@/lib/axios'
import type { PagedData } from '@/types/api'
import type { NoticeListParams, NoticeRow } from '../types/notice'

/**
 * 공지사항 목록 조회 (`spec 026` T571).
 *
 * `GET /api/v1/Notice/W/sign/GetNoticeList`
 *
 * 받는 것: `siteSeq`(필수) · `fromDt` · `toDt` · `keyword` · 페이징(swagger).
 */

const GET_NOTICE_LIST_PATH = '/api/v1/Notice/W/sign/GetNoticeList'

export const fetchNoticeList = async (params: NoticeListParams): Promise<PagedData<NoticeRow>> => {
  const res = await api.get<PagedData<NoticeRow>>(GET_NOTICE_LIST_PATH, { params })
  return res.data
}
