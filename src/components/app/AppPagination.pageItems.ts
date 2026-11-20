/**
 * `AppPagination` 의 페이지 번호 계산.
 *
 * 🔴 **인접 파일로 분리했다** — 컴포넌트 파일에서 함수를 함께 export 하면
 * `react-refresh/only-export-components` 에 걸린다(`CLAUDE.md` B4, `AppBadge.variants.ts` 선례).
 */

/** 한 번에 보이는 번호 수 */
const VISIBLE = 5

/**
 * 화면에 그릴 페이지 번호 — **지금 페이지를 가운데에 둔 다섯 개**(`spec 083`, 사용자 결정 2026-11-20).
 *
 * `pageItems(7, 20)` → `[5, 6, 7, 8, 9]`. 앞뒤가 모자라면 반대쪽으로 채운다 —
 * `pageItems(1, 20)` → `[1, 2, 3, 4, 5]` · `pageItems(20, 20)` → `[16, 17, 18, 19, 20]`.
 * 페이지가 다섯보다 적으면 있는 만큼만.
 *
 * 🔄 전에는 `[1, '…', 4, 5, 6, '…', 20]`(양끝 + 지금 주변 + `…`)이었다. 양끝으로 가는 일은
 * `«` `»` 버튼이, 전체 쪽수는 옆의 `현재 / 전체 페이지` 글자가 맡는다.
 */
export const pageItems = (current: number, totalPages: number): number[] => {
  if (totalPages <= 0) return []

  const count = Math.min(VISIBLE, totalPages)
  const half = Math.floor(VISIBLE / 2)
  const first = Math.max(1, Math.min(current - half, totalPages - count + 1))
  return Array.from({ length: count }, (_, i) => first + i)
}
