// 목업에서 shadcn 차트 모양(Recharts)을 그리는 공용 조각. 프로젝트는 Recharts 3.x, 목업은 CDN 의 2.x 를 쓴다.
const head = `
<style>
  .rc { width: 100%; }
  .stip { min-width: 120px; padding: 6px 10px; border: 1px solid rgb(226 232 240 / .6); border-radius: 8px; background: #fff; box-shadow: 0 10px 24px rgb(15 23 42 / .12); font-size: 12px; }
  .stip .l { font-weight: 500; margin-bottom: 4px; color: var(--fg); }
  .stip .r { display: flex; align-items: center; gap: 8px; color: var(--muted); }
  .stip .r i { width: 10px; height: 10px; border-radius: 2px; }
  .stip .r b { margin-left: auto; padding-left: 12px; color: var(--fg); font-size: 12px; font-weight: 500; font-variant-numeric: tabular-nums; }
  .stip { white-space: nowrap; line-height: 1.4; }
  /* 숫자 칸의 작은 차트 — 툴팁을 차트 아래, 오른쪽 끝에 맞춰 띄운다(칸 밖으로 잘리지 않게) */
  .k .rc .recharts-tooltip-wrapper { left: auto !important; right: 0; top: 36px !important; transform: none !important; }
</style>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/prop-types@15.8.1/prop-types.min.js"></script>
<script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.js"></script>
<script>
  window.chart = (() => {
    const h = React.createElement, R = Recharts
    const ACC = '#2563eb', SOFT = '#bfd3fb', RED = '#dc2626', GRID = '#e8ecf1', MUTED = '#64748b', TINT = '#eef1f5'
    const rows = (pairs) => pairs.map(([name, v, x]) => ({ name, v, x }))
    const mount = (id, height, el) => ReactDOM.createRoot(document.getElementById(id)).render(h(R.ResponsiveContainer, { width: '100%', height }, el))
    const tip = (label, unit) => ({ active, payload, label: l }) =>
      active && payload && payload.length
        ? h('div', { className: 'stip' }, h('div', { className: 'l' }, payload[0].payload.name), h('div', { className: 'r' }, h('i', { style: { background: payload[0].payload.c || ACC } }), label, h('b', null, payload[0].value + unit + (payload[0].payload.x ? ' · ' + payload[0].payload.x : ''))))
        : null
    const ax = { tickLine: false, axisLine: false, tickMargin: 8, fontSize: 11, stroke: MUTED }
    return {
      /** 세로 막대 — 가로 격자만 · 축 선 없음 · 둥근 막대 · 카드 툴팁. hi = 진하게 칠할 막대 번호 */
      vbar(id, height, pairs, { interval = 0, hi = -1, unit = '회', label = '순찰', show = -1 } = {}) {
        const data = rows(pairs).map((d, i) => ({ ...d, c: hi < 0 || i === hi ? (hi < 0 ? SOFT : ACC) : SOFT }))
        mount(id, height, h(R.BarChart, { data, margin: { top: 4, right: 0, left: 0, bottom: 0 } },
          h(R.CartesianGrid, { vertical: false, stroke: GRID }), h(R.XAxis, { dataKey: 'name', interval, ...ax }),
          h(R.Tooltip, { cursor: { fill: TINT }, content: tip(label, unit), ...(show >= 0 ? { defaultIndex: show } : {}) }),
          h(R.Bar, { dataKey: 'v', radius: 4 }, data.map((d, i) => h(R.Cell, { key: i, fill: d.c })))))
      },
      /** 숫자 칸 안의 작은 막대 — over 를 넘으면 빨강 */
      mbar(id, pairs, { over = Infinity, min = 0, unit = '분', label = '소요' } = {}) {
        const data = rows(pairs).map((d) => ({ ...d, c: d.v > over ? RED : SOFT, x: d.v > over ? '시간초과' : d.x }))
        mount(id, 30, h(R.BarChart, { data, margin: { top: 0, right: 0, left: 0, bottom: 0 } }, h(R.YAxis, { hide: true, domain: [min, 'dataMax'] }),
          h(R.Tooltip, { cursor: { fill: TINT }, content: tip(label, unit), allowEscapeViewBox: { x: true, y: true }, wrapperStyle: { zIndex: 20 } }), h(R.Bar, { dataKey: 'v', radius: 3 }, data.map((d, i) => h(R.Cell, { key: i, fill: d.c })))))
      },
      /** 숫자 칸 안의 작은 선 */
      marea(id, pairs, { min = 0, max = 100, unit = '%', label = '인증률' } = {}) {
        mount(id, 30, h(R.AreaChart, { data: rows(pairs), margin: { top: 4, right: 2, left: 2, bottom: 0 } }, h(R.YAxis, { hide: true, domain: [min, max] }),
          h(R.Tooltip, { content: tip(label, unit), allowEscapeViewBox: { x: true, y: true }, wrapperStyle: { zIndex: 20 } }), h(R.Area, { dataKey: 'v', type: 'monotone', stroke: ACC, strokeWidth: 2, fill: ACC, fillOpacity: 0.12 })))
      },
    }
  })()
</script>`

/** 차트 스크립트 한 묶음 — calls 는 `chart.vbar(...)` 같은 호출 문자열 */
const use = (calls) => `${head}\n<script>${calls}</script>`
const slot = (id) => `<div class="rc" id="${id}"></div>`
module.exports = { use, slot }
