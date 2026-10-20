import { useQuery } from '@tanstack/react-query'

import { fetchPointHistoryDetail } from '../api/getPointHistoryDetail'
import { pointHistoryKeys } from '../queryKeys'

/**
 * 지점 인증 1건 상세 (`spec 037` T551).
 *
 * 🔴 **`detailSeq` 가 `null` 이면 호출하지 않는다.** 라우트 파라미터가 숫자가 아닐 수 있다
 * (`/patrol/points/abc`) — 그대로 보내면 서버가 400 을 주고 화면은 **"불러오지 못했습니다"**
 * 를 띄우는데, 사실은 **주소가 잘못된 것**이다. 호출 전에 걸러 같은 화면을 띄우되 요청을
 * 낭비하지 않는다.
 *
 * ⚠️ **`siteSeq` 가 필요 없다** — `detailSeq` 는 전역 유일하다(코스 쪽 `historySeq` 와 같다).
 * 🔴 그래서 **권한 밖 인증 1건도 열린다**(B-9 — 서버가 검사하지 않는다). 목록에서만 진입하는
 * 화면이라 실사용 경로에서는 자기 사업장 값만 들어오지만, **주소를 고치면 남의 것이
 * 열린다**는 사실은 그대로다(`spec 035` 로 전달된 권한 계열 결함과 같은 자리).
 */

export const usePointHistoryDetail = (detailSeq: number | null) =>
  useQuery({
    queryKey: pointHistoryKeys.detail(detailSeq ?? -1),
    queryFn: () => fetchPointHistoryDetail(detailSeq as number),
    enabled: detailSeq !== null,
  })
