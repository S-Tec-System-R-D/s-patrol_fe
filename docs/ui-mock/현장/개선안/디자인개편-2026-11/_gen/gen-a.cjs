// A 컨셉(조용한 목록형) 목업 — 배치관리 · 대시보드. 기존 *-mock.html 은 건드리지 않는다.
const fs = require('fs')
const path = require('path')
const { THEMES, themeCss } = require('./theme-a.cjs')
const charts = require('./charts.cjs')

// 상태 아이콘 — 색은 background, 모양은 mask 로 준다
const mask = (d) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>${d}</svg>`)}")`
const stIcon = {
  gray: mask("<circle cx='12' cy='12' r='10'/><path d='M8 12h8'/>"),
  blue: mask("<path d='M21 12a9 9 0 1 1-6.219-8.56'/>"),
  green: mask("<circle cx='12' cy='12' r='10'/><path d='m9 12 2 2 4-4'/>"),
  red: mask("<circle cx='12' cy='12' r='10'/><path d='M12 7v5l3 2'/>"),
  amber: mask("<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/>"),
  x: mask("<circle cx='12' cy='12' r='10'/><path d='m15 9-6 6M9 9l6 6'/>"),
}

const css = `
  :root {
    --page: #f6f6f4; --surface: #ffffff; --fg: #18181b; --sub: #52525b; --muted: #8b8b93;
    --line: #ececea; --line-strong: #e2e2df; --hover: #f7f7f6;
    --blue: #2563eb; --green: #16a34a; --red: #dc2626; --amber: #d97706;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; word-break: keep-all; font-size: 13px; line-height: 1.45; color: var(--fg); background: var(--page); -webkit-font-smoothing: antialiased; }
  .num { font-variant-numeric: tabular-nums; }
  svg { flex: none; }
  .shell { display: flex; width: 1920px; min-height: 911px; background: var(--page); }

  /* 사이드바 */
  .sidebar { width: 224px; padding: 12px 8px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 8px; padding: 4px 8px 12px; font-weight: 600; font-size: 14px; }
  .brand i { width: 22px; height: 22px; border-radius: 6px; background: var(--fg); color: #fff; font-style: normal; font-size: 12px; font-weight: 700; display: grid; place-items: center; }
  .site { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 8px; margin-bottom: 10px; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface); font-weight: 500; }
  .site span { flex: 1; }
  .nav-label { padding: 12px 8px 4px; font-size: 11px; font-weight: 500; color: var(--muted); }
  .nav a { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 8px; border-radius: 6px; color: var(--sub); }
  .nav a.on { background: #e9e9e6; color: var(--fg); font-weight: 500; }
  .nav a.sub { padding-left: 30px; }
  .nav a em { margin-left: auto; font-style: normal; font-size: 11px; color: var(--muted); }
  .me { margin-top: auto; padding: 8px; }
  .me b { display: block; font-weight: 500; }
  .me small { font-size: 12px; color: var(--muted); }

  /* 본문 카드 */
  .inset { flex: 1; min-width: 0; margin: 8px 8px 8px 0; background: var(--surface); border: 1px solid var(--line-strong); border-radius: 12px; display: flex; flex-direction: column; }
  .topbar { height: 44px; flex: none; display: flex; align-items: center; gap: 8px; padding: 0 20px; border-bottom: 1px solid var(--line); color: var(--muted); }
  .topbar b { color: var(--fg); font-weight: 500; }
  .topbar .right { margin-left: auto; display: flex; align-items: center; gap: 12px; font-size: 12px; }
  .live { display: inline-flex; align-items: center; gap: 6px; color: var(--sub); }
  .live i { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
  .content { flex: none; padding: 28px 32px 32px; }

  .head { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 20px; }
  .head h1 { font-size: 20px; font-weight: 600; letter-spacing: -.01em; line-height: 1.2; }
  .head p { margin-top: 4px; color: var(--muted); }
  .head .right { margin-left: auto; display: flex; gap: 6px; }

  .btn { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 7px; background: var(--surface); font: inherit; font-size: 12px; font-weight: 500; color: var(--fg); white-space: nowrap; }
  .btn.dark { background: var(--fg); border-color: var(--fg); color: #fff; }
  .btn.quiet { border-color: transparent; background: transparent; color: var(--sub); cursor: pointer; }
  /* 화면 제목 오른쪽 버튼 — 테두리 없이 옅은 회색 채움. 삭제는 옅은 빨강 채움 + 빨간 글자 */
  .btn.fill { border-color: transparent; background: #f1f5f9; color: var(--fg); cursor: pointer; }
  .btn.fill svg, .head .right .btn.fill svg { color: var(--sub); }
  .btn.fill:hover { background: #e2e8f0; }
  .btn.fill.sq { width: 30px; padding: 0; justify-content: center; }
  .btn.fill.red { background: #fef2f2; color: #dc2626; }
  .btn.fill.red svg, .head .right .btn.fill.red svg { color: #dc2626; }
  .btn.fill.red:hover { background: #fee2e2; }
  .btn.quiet:hover { background: var(--tint); color: var(--fg); }

  /* 숫자 칸 — 지금 구현처럼 낮게: 왼쪽에 이름 · 숫자 · 부가 값, 오른쪽에 작은 그림(있을 때만) */
  .kpis { display: grid; gap: 10px; margin-bottom: 24px; }
  .kpis.c3 { grid-template-columns: repeat(3, 1fr); }
  .kpis.c4 { grid-template-columns: repeat(4, 1fr); }
  .k { display: flex; align-items: center; gap: 16px; min-height: 60px; padding: 8px 16px 9px; border: 1px solid var(--line-strong); border-radius: 10px; }
  .k .t { flex: 1; min-width: 0; }
  .k .kt { font-size: 12px; font-weight: 500; color: var(--sub); }
  .k b { font-size: 18px; font-weight: 600; line-height: 1.35; }
  .k b.warn { color: var(--red); }
  .k .u { margin-left: 6px; font-size: 12px; color: var(--muted); white-space: nowrap; }
  .k .u.warn { color: var(--red); }
  .k .u.now { color: var(--accent); font-weight: 500; }
  .k .aside { flex: none; width: 120px; }
  .kbar { display: flex; gap: 2px; height: 5px; border-radius: 3px; background: var(--tint-strong); overflow: hidden; }
  .kbar i { display: block; height: 100%; background: var(--accent); }
  .cap2 { display: flex; justify-content: space-between; margin-top: 5px; font-size: 11px; color: var(--muted); }
  .rbars { display: flex; align-items: flex-end; gap: 3px; height: 30px; }
  .rbars i { flex: 1; border-radius: 2px; background: #bfd3fb; }
  .rbars i.o { background: var(--red); }
  .rline { display: block; width: 100%; height: 30px; overflow: visible; }
  .mini { display: flex; align-items: baseline; gap: 6px; padding: 0 4px 0 16px; border-left: 1px solid var(--line); color: var(--muted); font-size: 12px; }
  .mini:first-child { border-left: 0; padding-left: 0; }
  .mini b { font-size: 18px; font-weight: 600; color: var(--fg); }
  .mini.big { gap: 8px; padding: 0 6px 0 22px; font-size: 13px; color: var(--sub); }
  .mini.big b { font-size: 26px; line-height: 1; }
  .mini.big b.warn { color: var(--red); }
  /* 대시보드 — 진행 중 아래의 세 칸 */
  .tri { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .tri > .col { min-width: 0; padding: 0 28px; border-left: 1px solid var(--line); }
  .tri > .col:first-child { padding-left: 0; border-left: 0; }
  .tri > .col:last-child { padding-right: 0; }
  .tri > .col > .block:last-child { margin-bottom: 0; }
  .head .right .mini:first-child { padding-left: 16px; }
  .inl { display: flex; margin-bottom: 14px; }
  .hours { display: flex; align-items: flex-end; gap: 4px; height: 96px; margin-top: 4px; }
  .hours i { flex: 1; min-height: 2px; border-radius: 2px; background: #bfd3fb; }
  .hours i.z { background: var(--tint-strong); }
  .hours i.t { background: var(--accent); }
  .cb { display: grid; grid-template-columns: 120px 1fr 30px; align-items: center; gap: 10px; padding: 5px 0; color: var(--sub); }
  .cb span:first-child { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cb i { display: block; height: 4px; border-radius: 2px; background: var(--tint-strong); overflow: hidden; }
  .cb i u { display: block; height: 100%; border-radius: 2px; background: var(--accent); }
  .cb span:last-child { text-align: right; font-size: 12px; color: var(--muted); }
  .cb.zero span { color: var(--muted); }

  /* 영역 제목 · 밑줄 탭 */
  .sec { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
  .sec h2 { font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
  .sec .cnt { font-size: 12px; color: var(--muted); }
  .sec .more { margin-left: auto; font-size: 12px; color: var(--muted); }
  .tabs { display: flex; align-items: center; gap: 20px; border-bottom: 1px solid var(--line); }
  .tabs a { display: inline-flex; align-items: center; gap: 6px; height: 34px; margin-bottom: -1px; color: var(--muted); border-bottom: 2px solid transparent; }
  .tabs a.on { color: var(--fg); font-weight: 500; border-bottom-color: var(--fg); }
  .tabs a em { font-style: normal; font-size: 11px; min-width: 18px; height: 16px; padding: 0 5px; border-radius: 4px; background: #f0f0ee; color: var(--sub); display: inline-grid; place-items: center; }
  .tabs .tools { margin-left: auto; display: flex; gap: 6px; padding-bottom: 6px; }
  .input { display: flex; align-items: center; gap: 6px; height: 30px; width: 200px; padding: 0 9px; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--muted); font-size: 12px; }

  /* 표 — 목록처럼 */
  table { width: 100%; border-collapse: collapse; }
  th { height: 32px; padding: 0 12px 0 0; text-align: left; font-size: 12px; font-weight: 400; color: var(--muted); border-bottom: 1px solid var(--line); white-space: nowrap; }
  td { height: 46px; padding: 0 12px 0 0; border-bottom: 1px solid var(--line); white-space: nowrap; color: var(--sub); }
  td:last-child, th:last-child { padding-right: 0; }
  td.main { color: var(--fg); font-weight: 500; }
  td.main small { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--muted); }
  td.r, th.r { text-align: right; }
  .arrow { color: var(--muted); margin: 0 5px; }
  .here { color: var(--fg); }
  .foot { display: flex; align-items: center; gap: 6px; padding-top: 10px; font-size: 12px; color: var(--muted); }
  /* 빈 상태 — 흰 타일 아이콘(테두리 + 옅은 그림자) → 제목 → 설명. .sm 은 한 영역 안의 작은 크기 */
  .empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 72px 16px 64px; }
  .empty .tile { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; color: var(--sub); box-shadow: 0 1px 2px rgb(15 23 42 / .06), 0 4px 10px rgb(15 23 42 / .06); }
  .empty .tile svg { width: 22px; height: 22px; stroke-width: 1.7; }
  .empty .tile.red { color: var(--red); }
  .empty b { margin-top: 12px; font-size: 15px; font-weight: 600; color: var(--fg); }
  .empty p { color: var(--muted); }
  .empty.sm { gap: 10px; padding: 22px 8px 24px; }
  .empty.sm .tile { width: 34px; height: 34px; border-radius: 9px; box-shadow: 0 1px 2px rgb(15 23 42 / .06), 0 2px 6px rgb(15 23 42 / .05); }
  .empty.sm .tile svg { width: 16px; height: 16px; stroke-width: 1.8; }
  /* 목록 화면 전체가 비었을 때 — 남은 목록 영역의 가운데(살짝 위)에 둔다 */
  .empty.fill { min-height: calc(100vh - 250px); justify-content: center; padding: 0 16px 9vh; }
  /* 한 영역 안이 비었을 때 — 아이콘 없이 글자 한 줄 */
  .none { padding: 24px 0; text-align: center; font-size: 12px; color: var(--muted); }
  .emptybox { border: 1px solid var(--line-strong); border-radius: 10px; }
  .emptybox .empty { padding: 40px 16px 36px; }
  .foot .sp { margin-left: auto; margin-right: 6px; }
  .pg { display: inline-flex; align-items: center; gap: 2px; }
  .pg .p { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 30px; padding: 0 6px; border-radius: 7px; font-size: 12px; font-weight: 500; color: var(--sub); cursor: pointer; }
  .pg .p:hover { background: #f1f5f9; color: var(--fg); }
  .pg .p.on { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
  .pg .p.off { opacity: .35; pointer-events: none; }
  @media (max-width: 1279px) { .pg .p.xl { display: none; } }

  /* 상태 — 아이콘 + 글자. 색은 아이콘에만, 글자는 문제(빨강)일 때만 색 */
  .st { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--fg); white-space: nowrap; }
  .st::before { content: ''; flex: none; width: 13px; height: 13px; background: var(--muted); -webkit-mask: ${stIcon.gray} center / contain no-repeat; mask: ${stIcon.gray} center / contain no-repeat; }
  .st.blue::before { background: var(--blue); -webkit-mask-image: ${stIcon.blue}; mask-image: ${stIcon.blue}; }
  .st.green::before { background: var(--green); -webkit-mask-image: ${stIcon.green}; mask-image: ${stIcon.green}; }
  .st.red::before { background: var(--red); -webkit-mask-image: ${stIcon.red}; mask-image: ${stIcon.red}; }
  .st.red { color: var(--red); }
  .st.amber::before { background: var(--sub); -webkit-mask-image: ${stIcon.amber}; mask-image: ${stIcon.amber}; }
  .st.x::before { -webkit-mask-image: ${stIcon.x}; mask-image: ${stIcon.x}; }
  /* 정상 결과(완료 · 인증)는 조용하게 — 색은 진행 · 문제에만 */
  .st.ok { color: var(--sub); }
  .st.ok::before { -webkit-mask-image: ${stIcon.green}; mask-image: ${stIcon.green}; }
  td .st + .st, .end .st + .st { margin-left: 10px; }

  /* 대시보드 */
  .cols { display: grid; grid-template-columns: minmax(0, 1fr) 340px; }
  .cols > .mainc { padding-right: 32px; }
  .cols > .side { padding-left: 28px; border-left: 1px solid var(--line); }
  .block { margin-bottom: 28px; }
  .block:last-child { margin-bottom: 0; }
  .runs { display: flex; flex-direction: column; gap: 6px; }
  .run { display: grid; grid-template-columns: 1.5fr 1fr 64px 1.5fr 1.3fr 130px; align-items: center; gap: 12px; height: 46px; padding: 0 14px; border: 1px solid var(--line-strong); border-radius: 8px; color: var(--sub); }
  .run .n { color: var(--fg); font-weight: 500; }
  .run .n small { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--muted); }
  .runhead { display: grid; grid-template-columns: 1.5fr 1fr 64px 1.5fr 1.3fr 130px; gap: 12px; padding: 0 15px 6px; font-size: 12px; color: var(--muted); }
  .prog { display: flex; align-items: center; gap: 8px; }
  .prog i { display: block; width: 84px; height: 3px; border-radius: 2px; background: #ececea; overflow: hidden; }
  .prog i u { display: block; height: 100%; background: var(--blue); border-radius: 2px; }
  .prog i u.over { background: var(--red); }
  .over { color: var(--red); }
  .tag { font-size: 11px; padding: 1px 5px; border-radius: 4px; background: #f0f0ee; color: var(--sub); margin-left: 6px; }
  .box { border: 1px solid var(--line-strong); border-radius: 8px; }
  .box .li { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 14px; border-bottom: 1px solid var(--line); color: var(--sub); }
  .box .li:last-child { border-bottom: 0; }
  .box .li b { color: var(--fg); font-weight: 500; }
  .box .li .end { margin-left: auto; display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--muted); }
  /* 진행 중 — 코스마다 지점 경로를 그대로 펼친다 */
  .courses { display: flex; flex-direction: column; gap: 10px; }
  .course { border: 1px solid var(--line-strong); border-radius: 10px; padding: 14px 18px 14px; }
  .course .top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .course .top h3 { font-size: 14px; font-weight: 600; }
  .course .top .meta { margin-left: auto; display: flex; align-items: center; gap: 16px; color: var(--sub); }
  .course .top .meta b { color: var(--fg); font-weight: 500; }
  .track { display: grid; }
  .pt { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 0; }
  .pt:not(:last-child)::after { content: ''; position: absolute; top: 7px; left: calc(50% + 12px); width: calc(100% - 24px); height: 2px; border-radius: 1px; background: #e4e4e1; }
  .pt.done:not(:last-child)::after, .pt.skip:not(:last-child)::after { background: var(--fg); }
  .pt.last:not(:last-child)::after { height: 0; background: none; border-top: 2px dashed var(--blue); }
  .dot { position: relative; z-index: 1; width: 16px; height: 16px; border-radius: 50%; display: grid; place-items: center; margin-bottom: 8px; }
  .pt.done .dot { background: var(--fg); color: #fff; }
  .pt.skip .dot { background: #fff; border: 2px solid #a1a1aa; }
  .pt.skip .dot::after { content: ''; width: 6px; height: 2px; background: #a1a1aa; border-radius: 1px; }
  .pt.next .dot { background: #fff; border: 2px solid var(--blue); box-shadow: 0 0 0 4px #dbe7fe; }
  .pt.next .dot::after { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--blue); }
  .pt.wait .dot::after { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #d9d9d5; }
  .pt .nm { max-width: 100%; padding: 0 4px; font-size: 12px; color: var(--sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pt.next .nm { color: var(--fg); font-weight: 600; }
  .pt.wait .nm { color: var(--muted); }
  .pt .at { height: 16px; font-size: 11px; color: var(--muted); }
  .pt.next .at { color: var(--blue); font-weight: 500; }
  .pt .ho { position: absolute; top: -15px; font-size: 10px; color: var(--sub); background: #f0f0ee; border-radius: 3px; padding: 0 4px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  .side .li { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid var(--line); }
  .side .li:last-child { border-bottom: 0; }
  .side .li .t { flex: 1; min-width: 0; }
  .side .li .t b { display: block; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .side .li .t span { font-size: 12px; color: var(--muted); }
  .spark { display: flex; align-items: flex-end; gap: 4px; height: 44px; margin-top: 4px; }
  .spark i { flex: 1; background: #d4d4d1; border-radius: 2px; }
  .spark i.t { background: var(--fg); }
  .sparkx { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--muted); }

  .note { margin-top: 28px; padding: 10px 14px; border: 1px dashed var(--line-strong); border-radius: 8px; font-size: 12px; color: var(--muted); }
  .note b { color: var(--sub); font-weight: 500; }
`

const ic = (d) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const icons = {
  dash: ic('<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>'),
  hist: ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>'),
  route: ic('<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>'),
  pin: ic('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
  users: ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  swap: ic('<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>'),
  horn: ic('<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),
  bld: ic('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>'),
  updown: ic('<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>'),
  panel: ic('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'),
  search: ic('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  down: ic('<path d="m6 9 6 6 6-6"/>'),
  refresh: ic('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
}

const menu = [
  ['label', '현황'],
  ['대시보드', icons.dash],
  ['순찰이력', icons.hist],
  ['label', '관리'],
  ['코스/지점', icons.pin],
  ['근무자', icons.users],
  ['배치관리', icons.swap, '3'],
  ['공지사항', icons.horn],
]

const shell = (active, crumb, right, main, theme = THEMES[0]) => `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${active} — A 컨셉 목업</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" />
<style>${css}${themeCss(theme)}</style>
</head>
<body>
<div class="shell">
  <aside class="sidebar">
    <div class="brand"><i>S</i>S-Patrol</div>
    <div class="site">${icons.bld}<span>판교 테크노밸리 A동</span>${icons.updown}</div>
    <nav class="nav">
      ${menu
        .map(([a, b, c]) =>
          a === 'label'
            ? `<div class="nav-label">${b}</div>`
            : a === 'sub'
              ? `<a class="sub">${b}</a>`
              : `<a${a === active ? ' class="on"' : ''}>${b}${a}${c ? `<em class="num">${c}</em>` : ''}</a>`
        )
        .join('\n      ')}
    </nav>
    <div class="me"><b>김현장</b><small>현장관리자</small></div>
  </aside>
  <main class="inset">
    <div class="topbar">${icons.panel}<b>${crumb}</b>${right ? `<div class="right">${right}</div>` : ''}</div>
    <div class="content">${main}</div>
  </main>
</div>
</body>
</html>
`

const arrow = '<span class="arrow">→</span>'
const here = '<span class="here">판교 테크노밸리 A동</span>'

/* ───────── 배치관리 ───────── */
const deployments = `
  <div class="head">
    <div><h1>배치관리</h1><p>판교 테크노밸리 A동 소속 근무자의 배치 이력과 요청을 확인합니다</p></div>
    <div class="right"><span class="mini">전출 인원<b class="num">2</b>명</span><span class="mini">전입 인원<b class="num">3</b>명</span></div>
  </div>

  <div class="block">
    <div class="tabs">
      <a class="on">배치 요청 <em class="num">2</em></a><a>복귀 요청 <em class="num">1</em></a><a>전입 이력</a><a>전출 이력</a>
    </div>
    <table>
      <thead><tr><th>근무자</th><th>배치 경로</th><th>배치 기간</th><th>사유</th><th>요청일</th><th class="r">처리</th></tr></thead>
      <tbody>
        <tr><td class="main">박순찰<small class="num">20231104</small></td><td>강남 센터${arrow}${here}</td><td class="num">2026-11-20 ~ 2026-11-30</td><td>야간 인력 보강</td><td class="num">2026-11-16</td><td class="r"><span class="btn quiet">반려</span> <span class="btn dark">승인</span></td></tr>
        <tr><td class="main">이경비<small class="num">20220817</small></td><td>분당 물류${arrow}${here}</td><td class="num">2026-11-22 ~ 2026-12-05</td><td>행사 기간 지원</td><td class="num">2026-11-17</td><td class="r"><span class="btn quiet">반려</span> <span class="btn dark">승인</span></td></tr>
      </tbody>
    </table>
    <div class="foot num"><span>총 2건</span>${require('./pager.cjs').pager(1)}</div>
  </div>

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 구성은 지금 화면 그대로입니다(제목 오른쪽 전출 · 전입 인원 → 탭 → 표).</div>
`

/* ───────── 대시보드 ───────── */
const run = (name, next, who, tag, start, done, total, bar, time, overTime, status) => `
      <div class="run">
        <span class="n">${name}<small>다음 · ${next}</small></span>
        <span>${who}${tag ? `<span class="tag">${tag}</span>` : ''}</span>
        <span class="num">${start}</span>
        <span class="prog"><i><u style="width:${Math.round((done / total) * 100)}%"></u></i><span class="num">${done} / ${total}</span></span>
        <span class="prog">${bar === null ? '' : `<i><u class="${overTime ? 'over' : ''}" style="width:${bar}%"></u></i>`}<span class="num${overTime ? ' over' : ''}">${time}</span></span>
        ${status}
      </div>`

const check = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
/** points: [이름, 상태(done|skip|next|wait), 아래 글자, 교대 여부] — 마지막으로 지난 지점에서 다음 지점까지는 점선 */
const course = (name, status, meta, start, rest) => {
  const points = [['순찰 시작', 'start', start], ...rest]
  const nextAt = points.findIndex((p) => p[1] === 'next')
  return `
        <div class="course">
          <div class="top"><h3>${name}</h3>${status}<div class="meta">${meta}</div></div>
          <div class="track" style="grid-template-columns: repeat(${points.length}, minmax(0, 1fr))">${points
            .map(
              ([nm, st, at, ho], i) =>
                `<div class="pt ${st}${i === nextAt - 1 ? ' last' : ''}">${ho ? '<span class="ho">교대</span>' : ''}<span class="dot">${st === 'done' ? check : st === 'start' ? play : ''}</span><span class="nm">${nm}</span><span class="at num">${at}</span></div>`
            )
            .join('')}</div>
        </div>`
}
const play = '<svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4v16l13-8z"/></svg>'
const bar = (pct, over) => `<span class="prog"><i><u class="${over ? 'over' : ''}" style="width:${pct}%"></u></i></span>`

const spark = [10, 11, 9, 12, 11, 7, 7, 12, 11, 12, 9, 12, 8, 10]
const dashboard = `
  <div class="head">
    <div><h1>대시보드</h1><p>판교 테크노밸리 A동의 순찰 현황</p></div>
    <div class="right"><span class="mini big">진행 중<b class="num">3</b>건</span><span class="mini big">완료<b class="num">12</b>건</span><span class="mini big">미완료<b class="num">1</b>건</span><span class="mini big">시간초과<b class="num warn">2</b>건</span></div>
  </div>

  <div class="block">
        <div class="sec"><h2>진행 중</h2><span class="cnt num">3</span></div>
        <div class="courses">${course('본관 외곽', '<span class="st blue">순찰 중</span>', `<span><b>정순찰</b></span>${bar(60, false)}<span class="num">30분 / 50분</span>`, '14:02', [['정문 초소', 'done', '14:04'], ['본관 로비', 'done', '14:08'], ['동측 주차장', 'done', '14:16'], ['자재 창고', 'done', '14:24'], ['후문 초소', 'next', '다음 지점'], ['서측 담장', 'wait', ''], ['기계실 앞', 'wait', ''], ['정문 복귀', 'wait', '']])}${course('지하주차장 B1', '<span class="st red">시간초과 +12분</span>', `<span><b>한야간</b></span>${bar(100, true)}<span class="num over">72분 / 60분</span>`, '13:20', [['B1 입구', 'done', '13:23'], ['전기실', 'done', '13:31'], ['동측 램프', 'skip', '미인증'], ['비상계단 2', 'done', '13:58', true], ['저수조', 'done', '14:20'], ['기계실 앞', 'next', '다음 지점']])}${course('옥상 · 설비층', '<span class="st blue">순찰 중</span>', `<span><b>오주간</b></span><span class="num">7분 · 기준 없음</span>`, '14:25', [['옥상 출입문', 'done', '14:27'], ['냉각탑', 'next', '다음 지점'], ['물탱크실', 'wait', ''], ['안테나 기단', 'wait', ''], ['설비층 복도', 'wait', '']])}
        </div>
      </div>

  <div class="tri">
    <div class="col">
        <div class="block">
          <div class="sec"><h2>미완료 · 시간초과</h2><span class="cnt num">2</span><span class="more">전체 보기 →</span></div>
          <div class="box">
            <div class="li"><b>지하주차장 B2</b><span>정순찰</span><div class="end"><span class="num">09:40</span><span class="num">소요 19분</span><span class="st">미완료</span></div></div>
            <div class="li"><b>본관 외곽</b><span>한야간</span><div class="end"><span class="num">06:01</span><span class="num">소요 1시간 1분</span><span class="st red">시간초과</span></div></div>
          </div>
        </div>
        <div class="block">
          <div class="sec"><h2>종료된 순찰</h2><span class="cnt num">12</span></div>
          <div class="box">
            <div class="li"><b>본관 외곽</b><span>오주간</span><div class="end"><span class="num">10:24 ~ 11:10</span><span class="num">소요 46분</span></div></div>
            <div class="li"><b>옥상 · 설비층</b><span>오주간</span><div class="end"><span class="num">09:02 ~ 09:31</span><span class="num">소요 29분</span></div></div>
          </div>
        </div>
    </div>
    <div class="col">
        <div class="block">
          <div class="sec"><h2>오늘 시간대별 순찰</h2><span class="cnt">시작 시각 기준 · 16회</span></div>
          ${charts.slot('rc-hours')}
        </div>
  
        <div class="block">
          <div class="sec"><h2>오늘 코스별 순찰</h2><span class="cnt">시작 기준 · 16회</span></div>
          <div class="cb"><span>본관 외곽</span><i><u style="width:100%"></u></i><span class="num">6회</span></div>
          <div class="cb"><span>지하주차장 B1</span><i><u style="width:50%"></u></i><span class="num">3회</span></div>
          <div class="cb"><span>지하주차장 B2</span><i><u style="width:50%"></u></i><span class="num">3회</span></div>
          <div class="cb"><span>옥상 · 설비층</span><i><u style="width:50%"></u></i><span class="num">3회</span></div>
          <div class="cb"><span>야간 전체</span><i><u style="width:17%"></u></i><span class="num">1회</span></div>
          <div class="cb zero"><span>별관 창고</span><i><u style="width:0%"></u></i><span class="num">0회</span></div>
        </div>
    </div>
    <div class="col side">
      <div class="block">
        <div class="sec"><h2>배치 대기</h2><span class="cnt num">3</span><span class="more">전체 →</span></div>
        <div class="li"><div class="t"><b>박순찰</b><span>배치 요청 · 강남 센터 → 이 사업장</span></div><span class="btn">승인</span></div>
        <div class="li"><div class="t"><b>이경비</b><span>배치 요청 · 분당 물류 → 이 사업장</span></div><span class="btn">승인</span></div>
        <div class="li"><div class="t"><b>최야간</b><span>복귀 요청 · 이 사업장 → 수원 지사</span></div><span class="btn">승인</span></div>
      </div>

      <div class="block">
        <div class="sec"><h2>공지사항</h2><span class="more">전체 →</span></div>
        <div class="li"><div class="t"><b>동절기 순찰 시 방한 장비 착용 안내</b><span class="num">고정 · 본사 관리자 · 11-17</span></div></div>
        <div class="li"><div class="t"><b>11월 4주차 야간 근무 편성 변경</b><span class="num">김현장 · 11-15</span></div></div>
        <div class="li"><div class="t"><b>지하주차장 B2 공사 구간 우회 동선</b><span class="num">김현장 · 11-12</span></div></div>
      </div>

    </div>
  </div>

  ${charts.use(`chart.vbar('rc-hours', 150, [["0시",1],["1시",0],["2시",1],["3시",0],["4시",1],["5시",0],["6시",1],["7시",0],["8시",1],["9시",2],["10시",2],["11시",1],["12시",1],["13시",2],["14시",3],["15시",0],["16시",0],["17시",0],["18시",0],["19시",0],["20시",0],["21시",0],["22시",0],["23시",0]], { interval: 5, hi: 14 })`)}
  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 지금 화면과 다른 점은 진행 중 경로의 <b>순찰 시작 지점</b>과 <b>지점별 인증 시각</b>, 오늘 숫자 네 개를 제목 오른쪽 한 줄로 옮긴 것, 진행 중을 전체 폭으로 두고 아래를 세 칸(기록 · 오늘 요약 · 처리할 일)으로 나눈 것, 그리고 가운데 칸의 <b>오늘 시간대별 순찰</b> · <b>오늘 코스별 순찰</b>(추가 후보 — 이미 받는 어제~오늘 순찰 기록으로 셉니다. 0회인 코스를 보이려면 코스 목록도 받아야 합니다)입니다. 시간대별 막대는 shadcn 차트 모양(Recharts)이라 마우스를 올리면 값이 뜹니다. 화면이 뜬 뒤 약 4초 동안 <b>순찰 중 아이콘이 돌고, 다음 지점에 물결이 퍼지고, 이동 중 점선이 흐릅니다</b>(새로고침하면 다시 보입니다). 진행 중의 점선 구간은 마지막으로 인증한 지점에서 다음 지점으로 가는 구간입니다(구간 안의 정확한 위치는 서버가 주지 않습니다).</div>
`

const live = `<span class="live"><i></i>실시간</span><span class="num">마지막 갱신 14:32</span><span class="btn">${icons.refresh}새로고침</span>`

const out = {
  'a-deployments.html': shell('배치관리', '배치관리', '', deployments),
  'a-dashboard.html': shell('대시보드', '대시보드', live, dashboard),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))

module.exports = { shell, icons }
