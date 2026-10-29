import { Loader2Icon } from 'lucide-react'

interface AppBlockingOverlayProps {
  label: string
}

/**
 * 화면 전체를 덮어 아무것도 누를 수 없게 하는 진행 오버레이(`spec 061` — 사업장 전환 중).
 *
 * - 🔴 `z-[60]` — 레일 · floating nav(`z-40`) · 모달(`z-50`)까지 덮는다.
 * - 클릭은 이 판이 막는다. **키보드 포커스는 막지 못한다** — 부르는 쪽이 뒤 영역에 `inert` 를 준다.
 *   판 안에 포커스를 가두는 것보다 뒤를 통째로 끄는 쪽이 단순하다(포커스할 것이 없는 판이다).
 * - 모양은 모달 배경(`ui/dialog.tsx` 오버레이)과 같은 흐림 + 가운데 상자.
 */
const AppBlockingOverlay = ({ label }: AppBlockingOverlayProps) => (
  <div
    role="status"
    aria-live="polite"
    className="fixed inset-0 z-[60] grid place-items-center bg-black/10 supports-backdrop-filter:backdrop-blur-xs"
  >
    <div className="flex items-center gap-2 rounded-md bg-card px-4 py-3 text-sm shadow-sm">
      <Loader2Icon size={16} className="animate-spin text-muted-foreground" aria-hidden />
      {label}
    </div>
  </div>
)

export default AppBlockingOverlay
