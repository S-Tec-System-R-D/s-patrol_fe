import type { GroupNode, SiteNode } from '@/features/auth/types/site'

/**
 * 관리그룹 트리 순수 함수 (`spec 043` T738). 입력은 `AdminSiteSelect` 응답 그대로다(어댑터 없음 — B4).
 */

/** 단계 이름 — 명세 "회사 › 본부 › 지사" 3단계(`layer` 0·1·2) */
const LAYER_NAME: Record<number, string> = { 0: '회사', 1: '본부', 2: '지사' }

export const layerName = (layer: number): string => LAYER_NAME[layer] ?? ''

/**
 * 하위 그룹을 만들 수 있는가. 🔴 서버는 깊이를 막지 않는다(B-49) — **이 함수가 3단계 제한의 유일한 방어선**이다.
 */
export const canAddChild = (group: GroupNode): boolean => group.layer < 2

/** 깊이 우선(전위) 순회 — 루트 먼저, 응답 순서 그대로 */
export const walkGroups = (root: GroupNode): GroupNode[] => [
  root,
  ...root.children.flatMap(walkGroups),
]

export const findGroup = (root: GroupNode, groupSeq: number): GroupNode | null =>
  walkGroups(root).find((group) => group.groupSeq === groupSeq) ?? null

/** 루트부터 대상까지(양끝 포함). 없으면 빈 배열 */
export const groupPath = (root: GroupNode, groupSeq: number): GroupNode[] => {
  if (root.groupSeq === groupSeq) return [root]
  for (const child of root.children) {
    const path = groupPath(child, groupSeq)
    if (path.length > 0) return [root, ...path]
  }
  return []
}

/** 자손 그룹(자기 제외) */
export const descendantGroups = (group: GroupNode): GroupNode[] => walkGroups(group).slice(1)

const countSiteNodes = (sites: SiteNode[]): number =>
  sites.reduce((sum, site) => sum + 1 + countSiteNodes(site.children), 0)

/**
 * 그 그룹과 자손 그룹의 사업장 수.
 *
 * 🔴 **사업장의 `children` 도 센다** — 사업장도 자기 트리를 갖는다(`테스트 사업장2` 아래 2-1 · 2-2).
 * 그룹을 지우면 이 사업장들이 **함께 지워진다**(B-51) — 삭제 확인 문구가 이 숫자를 쓴다.
 */
export const countSites = (group: GroupNode): number =>
  walkGroups(group).reduce((sum, g) => sum + countSiteNodes(g.sites), 0)

/**
 * 화면에 보이는 사업장 개수 — 🔴 **지사 행에만** 쓴다(사용자 결정 2026-10-22).
 *
 * 사업장은 **지사 아래에만** 놓인다(업무 규칙, 사용자 전달 2026-10-22). 회사·본부 행의 합계는 "그 그룹 자체의
 * 사업장" 으로 오해된다. ⚠️ 실서버 테스트 데이터는 규칙과 달리 회사·본부에도 사업장이 직접 붙어 있다 — 그 수는
 * 어디에도 표시되지 않는다. 삭제 확인 문구는 이 값이 아니라 `countSites`(실제로 함께 지워지는 전부)를 쓴다.
 */
export const branchSiteCount = (group: GroupNode): number | null =>
  group.layer === 2 ? countSites(group) : null
