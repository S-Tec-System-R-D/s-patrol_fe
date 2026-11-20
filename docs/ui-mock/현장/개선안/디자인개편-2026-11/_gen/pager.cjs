// 페이지 이동 — 넓은 화면(1280px 이상): « ‹ 번호 다섯 개 › » / 그보다 좁으면: ‹ › 만
const ic = (d) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const first = ic('<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>')
const prev = ic('<path d="m15 18-6-6 6-6"/>')
const next = ic('<path d="m9 18 6-6-6-6"/>')
const last = ic('<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>')
/** current 를 가운데에 두고 다섯 개. 앞뒤가 모자라면 반대쪽으로 채운다 */
const pager = (pages, current = 1) => {
  const from = Math.max(1, Math.min(current - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => from + i)
  const off = (c) => (c ? ' off' : '')
  return `<span class="sp">${current} / ${pages} 페이지</span><span class="pg"><span class="p xl${off(current === 1)}" title="처음">${first}</span><span class="p${off(current === 1)}" title="이전">${prev}</span>${nums.map((n) => `<span class="p xl${n === current ? ' on' : ''}">${n}</span>`).join('')}<span class="p${off(current === pages)}" title="다음">${next}</span><span class="p xl${off(current === pages)}" title="마지막">${last}</span></span>`
}
module.exports = { pager }
