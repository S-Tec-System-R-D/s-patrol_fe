/**
 * shadcn/ui **Base UI · Rhea** 판을 그대로 옮긴 것이다(`spec 082` — 시뮬레이터 전용).
 * 출처: https://ui.shadcn.com/r/styles/base-rhea/collapsible.json (2026-11-18)
 *
 * 🔴 `src/components/ui`(Radix · Nova)와 **다른 기반**이다. 현장 · 본사 화면에서 가져다 쓰지 않는다.
 * 바꾼 것: import 경로 · 아이콘(lucide 고정) · 누를 수 있는 요소에 `cursor-pointer`.
 */
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
