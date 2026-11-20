import type { ReactNode } from 'react'

/**
 * 상세 정보 1행 — **이름은 왼쪽 고정 폭, 값은 바로 옆, 줄 사이 선**.
 *
 * 🔄 **`spec 084`(사용자 결정 2026-11-20): 배치를 하나로 합쳤다.** 전에는 두 갈래였다 — `between`(이름 ↔ 값 양끝 ·
 * 값 굵게 · 선 없음 — 좁은 카드)과 `fixed`(이름 고정 폭 · 값 옆 — 넓은 페이지). 디자인 개편으로 영역의 카드 상자가
 * 없어지면서 줄 사이 선이 영역의 테두리 구실을 하고, 값이 이름 바로 옆에 있어야 눈이 덜 움직인다.
 * (11-06 의 "선이 많으면 카드가 표처럼 무겁다" 는 상자 + 선이 겹칠 때의 판단이었다.)
 *
 * 🔴 **줄들은 한 부모 안의 형제여야 한다** — 마지막 줄의 선을 `last:` 로 지운다.
 * 🔴 **긴 값은 칸 안에서 접는다**(`spec 050`) — `min-w-0` 이 없으면 긴 단어가 칸을 밀어낸다.
 */

interface AppDetailRowProps {
  label: string
  /** `ReactNode` 다 — 인증수단처럼 뱃지를 넣는 행이 있다 */
  value: ReactNode
}

const AppDetailRow = ({ label, value }: AppDetailRowProps) => (
  <div className="flex items-start gap-3 border-b border-border py-[9px] last:border-0">
    {/* 이름은 줄지 않는다 — 긴 값이 오면 값 쪽이 접힌다 */}
    <span className="w-[88px] shrink-0 text-muted-foreground">{label}</span>
    <span className="min-w-0 flex-1 break-words text-foreground tabular-nums">{value}</span>
  </div>
)

export default AppDetailRow
