import { useQuery } from '@tanstack/react-query'

import { fetchNoticeList } from '../api/getNoticeList'
import { noticeKeys } from '../queryKeys'
import type { NoticeListParams } from '../types/notice'

/**
 * 공지사항 목록 (`spec 026` T573).
 *
 * 🔴 **`params` 가 `null` 이면 호출하지 않는다**(= `siteSeq` 미확보). 서버가 `siteSeq` 권한을
 * 검사하지 않으므로(B-9) 엉뚱한 값으로 보내면 400 이 아니라 **남의 사업장 공지가 정상
 * 화면처럼** 온다(037 `usePointHistoryList` 와 같은 판단).
 */
export const useNoticeList = (params: NoticeListParams | null) =>
  useQuery({
    queryKey: noticeKeys.list(params ?? ({ siteSeq: -1 } as NoticeListParams)),
    queryFn: () => fetchNoticeList(params as NoticeListParams),
    enabled: params !== null,
  })
