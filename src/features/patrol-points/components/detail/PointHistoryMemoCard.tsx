import { MessageSquareOffIcon } from 'lucide-react'

import AppEmpty from '@/components/app/AppEmpty'
import AppDetailCard from '@/components/app/AppDetailCard'
import type { PointHistoryDetail } from '@/features/course-history/types'
import CheckDetailMemo from '@/features/patrol-zones/components/detail/CheckDetailMemo'
import { toCheckDetailRow } from '@/features/patrol-points/lib/pointHistoryMemo'

/**
 * 지점 인증 1건의 **순찰 기록**(메모 + 사진) (`spec 037` T555).
 *
 * 🔴 **`CheckDetailMemo` 를 그대로 쓴다**(036 자산). 어댑터 한 개(`toCheckDetailRow`)로
 * 이름 차이(B-35)를 흡수하고 **컴포넌트는 복제하지 않는다** — 거기에 036 이 쌓은 판단이
 * 들어 있다: 메타를 패널 머리에 한 번만 · 첨부마다 따로 실패 상태(B-40 폴백) ·
 * `whitespace-pre-line` · "처리 상태" 칸을 만들지 않기.
 *
 * 🔴 **코스 상세와 달리 "펼침" 이 아니다.** 코스 상세는 **인증 내역 표의 한 행**을 펼쳐
 * 메모를 보여 주지만(여러 지점 중 하나), 이 화면은 **그 인증 1건 전용 페이지**다 — 접어
 * 둘 이유가 없다. 같은 컴포넌트를 **카드 본문에 그대로** 놓는다.
 *
 * 🔴 **메모가 없으면 빈 상태를 적는다.** `hasMemo: false` 인 인증이 대부분이라(실측) 카드를
 * 아예 숨기면 "기록 칸이 어디 갔나" 가 되고, 빈 카드만 두면 **조회 실패처럼** 보인다.
 *
 * ⚠️ **목업의 "기록 추가"·"원본 다운로드" 버튼은 없다** — `History/*` 에 쓰기 엔드포인트가
 * **하나도 없고**(GET 8종) 첨부 URL 은 **404 다**(B-40). 누르면 아무 일도 없는 버튼은
 * 자리 차지다(023 이 "코스에 추가" 버튼을 제거한 것과 같은 판단).
 */

interface PointHistoryMemoCardProps {
  detail: PointHistoryDetail
}

const PointHistoryMemoCard = ({ detail }: PointHistoryMemoCardProps) => {
  const hasMemo = detail.memoList.length > 0

  return (
    <AppDetailCard title="순찰 기록">
      {hasMemo ? (
        <CheckDetailMemo row={toCheckDetailRow(detail)} />
      ) : (
        /* 🔴 **"기록이 없다" 와 "불러오지 못했다" 를 섞지 않는다** — 메모 없는 인증이
           정상이고 대부분이다. 조회 실패는 페이지 단위로 따로 그린다 */
        <AppEmpty
          icon={MessageSquareOffIcon}
          title="남긴 기록이 없습니다."
          description="순찰 중 메모나 사진을 남기면 여기에 표시됩니다."
        />
      )}
    </AppDetailCard>
  )
}

export default PointHistoryMemoCard
