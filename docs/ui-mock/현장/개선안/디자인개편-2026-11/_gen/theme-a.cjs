// A 컨셉 색 조합 — Base Color(회색 계열) + Theme(포인트색). 첫 번째가 기본.
const THEMES = [
  {
    key: 'slate-blue', label: 'Slate + Blue',
    page: '#f3f5f8', fg: '#0f172a', sub: '#475569', muted: '#64748b',
    line: '#e8ecf1', lineStrong: '#dde3ea', tint: '#eef1f5', tintStrong: '#e2e8f0', track: '#dbe2ea',
    accent: '#2563eb', accentSoft: '#dbe7fe',
  },
  {
    key: 'zinc-indigo', label: 'Zinc + Indigo',
    page: '#f4f4f5', fg: '#18181b', sub: '#52525b', muted: '#8b8b93',
    line: '#ececee', lineStrong: '#e1e1e5', tint: '#f0f0f2', tintStrong: '#e4e4e8', track: '#dedee3',
    accent: '#4f46e5', accentSoft: '#e2e3ff',
  },
  {
    key: 'stone-teal', label: 'Stone + Teal',
    page: '#f6f4f1', fg: '#1c1917', sub: '#57534e', muted: '#928b84',
    line: '#ebe8e3', lineStrong: '#e1dcd5', tint: '#f1eee9', tintStrong: '#e7e2da', track: '#dfd9d0',
    accent: '#0f766e', accentSoft: '#d3eeea',
  },
]

const themeCss = (t) => `
  /* 색 조합: ${t.label} */
  :root {
    --page: ${t.page}; --fg: ${t.fg}; --sub: ${t.sub}; --muted: ${t.muted};
    --line: ${t.line}; --line-strong: ${t.lineStrong};
    --tint: ${t.tint}; --tint-strong: ${t.tintStrong}; --track: ${t.track};
    --accent: ${t.accent}; --accent-soft: ${t.accentSoft};
  }
  .brand i { background: var(--accent); }
  .nav a.on { background: var(--tint-strong); }
  .nav a.on svg { color: var(--accent); }
  .btn.dark { background: var(--accent); border-color: var(--accent); }
  .tabs a.on { border-bottom-color: var(--accent); }
  .tag, .pt .ho { background: var(--tint); }
  /* 처리할 건수 — 탭과 사이드바에서 포인트색 알약으로 */
  .tabs a em, .nav a em { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; display: inline-grid; place-items: center; background: var(--accent); color: #fff; font-size: 11px; font-weight: 600; }
  .sec .more { color: var(--accent); }
  .st.blue::before { background: var(--accent); }
  .prog i { background: var(--tint-strong); }
  .prog i u { background: var(--accent); }
  .prog i u.over { background: var(--red); }
  .spark i { background: var(--track); }
  .spark i.t { background: var(--accent); }

  /* 지점 경로 — 지나온 길이 포인트색 */
  .pt:not(:last-child)::after { background: var(--track); }
  .pt.start:not(:last-child)::after, .pt.done:not(:last-child)::after, .pt.skip:not(:last-child)::after { background: var(--accent); }
  .pt.last:not(:last-child)::after { height: 2px; border-top: 0; background: linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 10px) 0 0 / 10px 2px repeat-x; opacity: .7; }

  /* 움직임 — 진행 중 코스에서만, 화면이 뜨거나 값이 바뀐 직후 몇 초만 돌고 멈춘다 */
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ring { 0% { box-shadow: 0 0 0 0 rgb(37 99 235 / .5); } 100% { box-shadow: 0 0 0 12px rgb(37 99 235 / 0); } }
  @keyframes march { to { background-position: 10px 0; } }
  .course .st.blue::before { animation: spin 1s linear 4; }
  .course .pt.next .dot { animation: ring 1.3s ease-out 3; }
  .course .pt.last:not(:last-child)::after { animation: march .5s linear 8; }
  @media (prefers-reduced-motion: reduce) { .course * , .course *::before, .course *::after { animation: none !important; } }
  .pt.done .dot { background: var(--accent); }
  .pt.start .dot { background: var(--fg); color: #fff; }
  .pt.start .nm { color: var(--fg); font-weight: 500; }
  .pt.next .dot { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
  .pt.next .dot::after { background: var(--accent); }
  .pt.next .at { color: var(--accent); }
  .pt.wait .dot::after { background: var(--track); }
`

module.exports = { THEMES, themeCss }
