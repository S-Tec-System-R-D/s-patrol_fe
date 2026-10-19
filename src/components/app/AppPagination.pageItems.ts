/**
 * `AppPagination` 의 페이지 번호 계산.
 *
 * 🔴 **인접 파일로 분리했다** — 컴포넌트 파일에서 함수를 함께 export 하면
 * `react-refresh/only-export-components` 에 걸린다(`CLAUDE.md` B4, `AppBadge.variants.ts` 선례).
 */

/**
 * 화면에 그릴 페이지 번호 목록. 🔴 **전부 그리지 않는다** — `pageSize 20` 에 1000건이면
 * 버튼이 50개가 되어 페이지네이션이 화면을 먹는다. 양끝 + 현재 주변만 두고 나머지는 `…`.
 *
 * `[1, '…', 4, 5, 6, '…', 20]` 꼴. 🔴 **`…` 는 버튼이 아니다**(눌러도 갈 곳이 없다).
 */
const WINDOW = 1

export const pageItems = (current: number, totalPages: number): (number | '…')[] => {
  if (totalPages <= 1) return totalPages === 1 ? [1] : []

  const pages = new Set<number>([1, totalPages])
  for (let p = current - WINDOW; p <= current + WINDOW; p += 1) {
    if (p >= 1 && p <= totalPages) pages.add(p)
  }

  const sorted = [...pages].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    // 🔴 **한 칸만 비었으면 `…` 대신 그 번호를 넣는다** — `1 … 3` 은 `1 2 3` 보다 길다
    if (i > 0) {
      const gap = p - sorted[i - 1]
      if (gap === 2) out.push(p - 1)
      else if (gap > 2) out.push('…')
    }
    out.push(p)
  })
  return out
}
