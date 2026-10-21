import { ArrowRightIcon } from 'lucide-react'

/**
 * 배치 경로 `출발 → 도착` (`spec 039`, 사용자 요청 2026-10-21).
 *
 * 🔴 **도착 사업장을 진하게**(`foreground` + 굵게), 출발은 회색 — 경로에서 사람이 **지금 가는 곳**이
 * 먼저 읽히게 한다. 요청 표와 이력 표가 **같은 규칙**으로 읽히도록 둘 다 이 컴포넌트를 쓴다.
 */
const SiteRoute = ({ from, to }: { from: string; to: string }) => (
  <span className="flex min-w-0 items-center gap-1.5">
    <span className="truncate text-muted-foreground">{from}</span>
    <ArrowRightIcon size={13} className="shrink-0 text-muted-foreground" aria-label="에서" />
    <span className="truncate font-semibold text-foreground">{to}</span>
  </span>
)

export default SiteRoute
