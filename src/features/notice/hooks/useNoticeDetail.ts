import { useQuery } from '@tanstack/react-query'

import { fetchNoticeDetail } from '../api/getNoticeDetail'
import { noticeKeys } from '../queryKeys'

/**
 * 공지사항 상세 (`spec 026` T573).
 *
 * 🔴 **`noticeSeq` 가 `null` 이면 호출하지 않는다** — 라우트 파라미터가 숫자가 아닌 경우다
 * (`/notice/abc`). ⚠️ 그때 쿼리는 **영원히 `isPending`** 이므로 호출부가 로딩보다 먼저
 * "주소 오류" 로 분기해야 한다(037 T557 이 잡은 결함).
 */
export const useNoticeDetail = (noticeSeq: number | null) =>
  useQuery({
    queryKey: noticeKeys.detail(noticeSeq ?? -1),
    queryFn: () => fetchNoticeDetail(noticeSeq as number),
    enabled: noticeSeq !== null,
  })
