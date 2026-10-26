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
 * 🔴 **회색 패널을 쓰지 않는다**(사용자 지적 2026-10-20) — 036 의 회색 바탕은 **표 행을
 * 펼친 패널**이라는 경계였다. 전용 카드 안에서는 **카드 속 카드**가 되고, 지점 인증은
 * 메모가 **대개 1건**이라 경계를 만들 이유도 없다.
 * ✅ **그 뒤 036 이 같은 모양으로 합쳐져 `surface` prop 이 사라졌다**(2026-10-20) — 두
 * 화면이 같은 모양이면 갈래를 둘 이유가 없다.
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
  const memoCount = detail.memoList.length
  const hasMemo = memoCount > 0
  const photoCount = detail.memoList.reduce((sum, memo) => sum + memo.attachList.length, 0)

  return (
    <AppDetailCard
      title="순찰 기록"
      /**
       * 🔴 **건수를 제목 옆에 적는다**(2026-10-20 — KPI 섹션을 제거하며 흡수했다).
       *
       * KPI 칸이 하던 유일한 고유 정보가 이 건수였다 — 나머지(결과·14일 집계)는 헤더 뱃지와
       * 최근 인증 카드가 이미 같은 말을 하고 있었다. 🔴 **사진 건수를 숨기지 않는다**:
       * URL 이 404 라 화면에 안 뜨지만(B-40) **건수는 사실**이고, 숨기면 "사진이 없다" 로
       * 읽혀 **결함이 데이터 부재로** 보인다.
       */
      badge={
        hasMemo ? (
          /* 🔴 **pill 을 걷어냈다**(사용자 요청 2026-10-20) — 자리를 **제목 줄 오른쪽**으로
             옮기자 pill 이 필요 없어졌다. 아래 메타와 섞여 보이던 것이 문제였는데, 그건
             **같은 줄에 쌓여 있었기 때문**이지 모양 탓이 아니었다. 이제 **설명 톤**이다 */
          <span className="shrink-0 text-caption font-normal text-muted-foreground">
            메모 {memoCount}건{photoCount > 0 ? ` · 사진 ${photoCount}장` : ''}
          </span>
        ) : undefined
      }
    >
      {hasMemo ? (
        <CheckDetailMemo row={toCheckDetailRow(detail)} />
      ) : (
        /* 🔴 **"기록이 없다" 와 "불러오지 못했다" 를 섞지 않는다** — 메모 없는 인증이
           정상이고 대부분이다. 조회 실패는 페이지 단위로 따로 그린다 */
        <AppEmpty
          icon={MessageSquareOffIcon}
          title="남긴 기록이 없습니다"
          description="순찰 중 메모나 사진을 남기면 여기에 표시됩니다."
        />
      )}
    </AppDetailCard>
  )
}

export default PointHistoryMemoCard
