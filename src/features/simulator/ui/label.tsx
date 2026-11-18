/**
 * shadcn/ui **Base UI · Rhea** 판을 그대로 옮긴 것이다(`spec 082` — 시뮬레이터 전용).
 * 출처: https://ui.shadcn.com/r/styles/base-rhea/label.json (2026-11-18)
 *
 * 🔴 `src/components/ui`(Radix · Nova)와 **다른 기반**이다. 현장 · 본사 화면에서 가져다 쓰지 않는다.
 * 바꾼 것: import 경로 · 아이콘(lucide 고정) · 누를 수 있는 요소에 `cursor-pointer`.
 */
import * as React from "react"
import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
