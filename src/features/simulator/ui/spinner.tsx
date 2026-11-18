/**
 * shadcn/ui **Base UI · Rhea** 판을 그대로 옮긴 것이다(`spec 082` — 시뮬레이터 전용).
 * 출처: https://ui.shadcn.com/r/styles/base-rhea/spinner.json (2026-11-18)
 *
 * 🔴 `src/components/ui`(Radix · Nova)와 **다른 기반**이다. 현장 · 본사 화면에서 가져다 쓰지 않는다.
 * 바꾼 것: import 경로 · 아이콘(lucide 고정) · 누를 수 있는 요소에 `cursor-pointer`.
 */
import { cn } from "@/lib/utils"

import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
