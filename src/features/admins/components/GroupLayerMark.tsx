import { Building2Icon, BuildingIcon } from 'lucide-react'

/**
 * 그룹 단계 표시 — 관리그룹 트리(`GroupTree`)와 같은 모양(사용자 요청 2026-10-23).
 * 회사 = 큰 건물 · 본부 = 건물 · 지사 = 네모 닷. 담당 그룹 고르기 · 상세 담당 그룹이 같이 쓴다.
 */
const GroupLayerMark = ({ layer }: { layer: number }) =>
  layer === 0 ? (
    <Building2Icon aria-hidden size={14} className="shrink-0 text-muted-foreground" />
  ) : layer === 1 ? (
    <BuildingIcon aria-hidden size={14} className="shrink-0 text-muted-foreground" />
  ) : (
    <span aria-hidden className="grid w-3.5 shrink-0 place-items-center">
      <span className="size-1.5 rounded-[1px] bg-point" />
    </span>
  )

export default GroupLayerMark
