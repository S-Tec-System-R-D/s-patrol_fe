// A 컨셉 · Slate + Blue — 근무자 목록 · 근무자 추가 모달 · 코스 순찰이력 목록. 틀(shell)은 gen-a.cjs 것을 쓴다.
// 칸 · 필터 · 문구는 지금 구현(UsersPage · WorkerColumns · AddWorkerForm · PatrolZonesPage · ZoneColumn)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')

const ic = (d, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const i = {
  plus: ic('<path d="M5 12h14M12 5v14"/>'),
  shield: ic('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'),
  clock: ic('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  clockS: ic('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', 12),
  cal: ic('<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>'),
  list: ic('<path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/>'),
  filter: ic('<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>'),
  chev: ic('<path d="m9 18 6-6-6-6"/>'),
  swap: ic('<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>', 12),
  memo: ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  x: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
  eye: ic('<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>'),
  pin: ic('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
}
const dotMask = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.2'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='3.5' fill='black'/></svg>")}")`

const extra = `<style>
  /* 목록 화면 — 제목 → (탭) → 검색 · 필터 한 줄 → 표 → 쪽 넘김 */
  .toolbar { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .toolbar .input { width: 240px; }
  .toolbar .btn svg:first-child { color: var(--muted); }
  .toolbar .btn.on { border-color: var(--accent); color: var(--accent); background: #f5f8ff; }
  .toolbar .btn.on svg:first-child { color: var(--accent); }
  .toolbar .btn.icon { width: 30px; padding: 0; justify-content: center; color: var(--sub); }
  .toolbar .sp { flex: 1; }
  .toolbar .btn.dark svg:first-child { color: #fff; }
  .tabs { margin-bottom: 14px; }
  .tabs a svg { color: currentColor; }

  /* 줄 전체가 누르는 대상이라 줄 바탕이 글자보다 8px 넓다 */
  table.list { width: calc(100% + 16px); margin: 0 -8px; }
  table.list th:first-child, table.list td:first-child { padding-left: 8px; }
  table.list th:last-child, table.list td:last-child { padding-right: 8px; width: 32px; text-align: right; color: var(--muted); }
  table.list tr.hover td { background: var(--tint); }
  table.list tr.hover td:first-child { border-radius: 6px 0 0 6px; }
  table.list tr.hover td:last-child { border-radius: 0 6px 6px 0; color: var(--fg); }
  table.list td svg { vertical-align: middle; }
  .two b { display: block; color: var(--fg); font-weight: 500; line-height: 1.3; }
  .two small { font-size: 12px; color: var(--muted); }
  .dash { color: var(--muted); }
  .role { font-size: 12px; color: var(--sub); }
  .role.mgr { padding: 2px 7px; border-radius: 5px; background: var(--tint); color: var(--fg); font-weight: 500; }
  .st.on::before { -webkit-mask-image: ${dotMask}; mask-image: ${dotMask}; }
  .ho2 { display: inline-flex; align-items: center; gap: 3px; margin-left: 8px; font-size: 12px; font-weight: 500; color: var(--accent); }
  .late { display: inline-flex; align-items: center; gap: 4px; font-weight: 500; color: var(--red); }
  .memo { display: inline-flex; margin-left: 10px; color: var(--sub); vertical-align: middle; }
  .cert { display: flex; align-items: center; gap: 8px; }
  .cert i { display: block; width: 56px; height: 4px; border-radius: 2px; background: var(--tint-strong); overflow: hidden; }
  .cert i u { display: block; height: 100%; border-radius: 2px; background: var(--accent); }
  .foot .size { display: inline-flex; align-items: center; gap: 4px; margin-left: 12px; }

  /* 모달 */
  .dim { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgb(15 23 42 / .42); }
  .modal { width: 520px; padding: 22px 24px 24px; border-radius: 12px; background: #fff; box-shadow: 0 24px 60px rgb(15 23 42 / .28), 0 0 0 1px rgb(15 23 42 / .06); }
  .modal .mh { display: flex; align-items: flex-start; margin-bottom: 18px; }
  .modal h2 { font-size: 16px; font-weight: 600; line-height: 1.3; }
  .modal .mh p { margin-top: 3px; color: var(--muted); }
  .modal .close { margin-left: auto; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { margin-bottom: 14px; }
  .field label { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500; color: var(--sub); }
  .field label em { margin-left: 2px; font-style: normal; color: var(--red); }
  .field .ctl { display: flex; align-items: center; height: 34px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--fg); }
  .field .ctl.ph { color: var(--muted); }
  .field .ctl.focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  .field .ctl.focus::after { content: ''; width: 1px; height: 15px; margin-left: 1px; background: var(--fg); }
  .field .ctl.off { background: var(--tint); border-color: var(--line); color: var(--sub); }
  .field .ctl svg { margin-left: auto; color: var(--muted); }
  .field .ctl.err { border-color: var(--red); }
  .field .msg { margin-top: 4px; font-size: 12px; color: var(--red); }
  .modal .submit { display: grid; place-items: center; height: 36px; margin-top: 18px; border-radius: 7px; background: var(--accent); color: #fff; font-weight: 500; }
</style>`

const foot = (total, unit, pages) =>
  `<div class="foot num"><span>총 ${total}${unit}</span><span class="size">페이지당 <span class="btn">20 ${icons.down}</span></span>${require('./pager.cjs').pager(pages)}</div>`

/* ───────── 근무자 목록 ───────── */
const users = [
  ['김현장', '10021', 'mgr', true, '', '2025-03-04'],
  ['정순찰', '20231104', '', true, '', '2025-03-04'],
  ['한야간', '20220817', '', true, '', '2025-03-11'],
  ['오주간', '20240102', '', true, '', '2025-04-02'],
  ['박순찰', '20231120', '', false, '강남 센터', '2026-11-20'],
  ['이경비', '20220905', '', false, '분당 물류', '2026-11-22'],
  ['최야간', '20210630', '', true, '수원 지사', '2026-11-01'],
  ['김보안', '20230412', '', false, '', '2025-06-18'],
  ['윤경비', '20240715', '', false, '', '2025-08-25'],
  ['장주간', '20250203', '', true, '', '2026-02-03'],
  ['서야간', '20250519', '', false, '', '2026-05-19'],
  ['문순찰', '20250901', '', false, '', '2026-09-01'],
]
const usersPage = (modal) => `${extra}
  <div class="head">
    <div><h1>근무자</h1><p>판교 테크노밸리 A동 소속 12명</p></div>
  </div>

  <div class="toolbar">
    <div class="input">${icons.search}이름·사번 검색</div>
    <span class="btn">${i.shield}권한 · 전체 ${icons.down}</span>
    <span class="btn">${i.clock}근무 상태 · 전체 ${icons.down}</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}근무자 추가</span>
  </div>

  <table class="list">
    <thead><tr><th>이름</th><th>권한</th><th>근무 상태</th><th>배치</th><th>등록일</th><th></th></tr></thead>
    <tbody>${users
      .map(
        ([nm, id, role, work, origin, dt], n) =>
          `<tr${n === 2 ? ' class="hover"' : ''}><td class="two"><b>${nm}</b><small class="num">${id}</small></td><td><span class="role${role ? ' mgr' : ''}">${role ? '현장 관리자' : '현장 근무자'}</span></td><td>${work ? '<span class="st green on">근무 중</span>' : '<span class="st">근무 종료</span>'}</td><td>${origin || '<span class="dash">-</span>'}</td><td class="num">${dt}</td><td>${i.chev}</td></tr>`
      )
      .join('')}</tbody>
  </table>
  ${foot(12, '명', 1)}

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 칸 · 필터 · 문구는 지금 화면 그대로이고 모양만 바꿨습니다. 세 번째 줄은 마우스를 올린 모습입니다.</div>
  ${modal || ''}
`

const field = (label, body, cls = '', tail = '') => `<div class="field"><label>${label}<em>*</em></label><div class="ctl ${cls}">${body}${tail}</div></div>`
const addModal = `
  <div class="dim"><div class="modal">
    <div class="mh"><div><h2>근무자 추가</h2><p>새 근무자를 등록합니다.</p></div><span class="close">${i.x}</span></div>
    <div class="frow">${field('이름', '홍길동')}${field('연락처', '010-1234-56', 'focus')}</div>
    ${field('사번', '로그인에 쓰는 사번(8자리 이하)', 'ph')}
    ${field('초기 비밀번호', '8자리 이상, 영문·숫자·특수문자 포함', 'ph', i.eye)}
    ${field('비밀번호 확인', '비밀번호를 한 번 더 입력해주세요', 'ph', i.eye)}
    <div class="field" style="margin-bottom:0"><label>소속 사업장</label><div class="ctl off">판교 테크노밸리 A동</div></div>
    <div class="submit">등록</div>
  </div></div>`

/* ───────── 코스 순찰이력 목록 ───────── */
const done = '<span class="st green">완료</span>'
const live = '<span class="st blue">진행중</span>'
const part = '<span class="st">미완료</span>'
// [코스, 순찰자, 교대, 시작, 종료, 소요, 시간초과, 인증, 전체, 결과, 특이사항]
const hist = [
  ['본관 외곽', '정순찰', 0, '14:02', '', '30분', 0, 4, 8, live, 0],
  ['옥상 · 설비층', '오주간', 0, '14:25', '', '7분', 0, 1, 5, live, 0],
  ['지하주차장 B1', '한야간 외 1명', 1, '13:20', '', '1시간 12분', 1, 5, 6, live, 0],
  ['본관 외곽', '오주간', 0, '10:24', '11:10', '46분', 0, 8, 8, done, 0],
  ['지하주차장 B2', '정순찰', 0, '09:40', '09:59', '19분', 0, 3, 7, part, 1],
  ['옥상 · 설비층', '오주간', 0, '09:02', '09:31', '29분', 0, 5, 5, done, 0],
  ['본관 외곽', '한야간', 0, '06:01', '07:02', '1시간 1분', 1, 8, 8, done, 1],
  ['야간 전체', '한야간', 0, '02:00', '03:34', '1시간 34분', 0, 17, 18, done, 0],
  ['지하주차장 B1', '', 0, '00:10', '00:58', '48분', 0, 6, 6, done, 0],
].map((r) => ['11-18', ...r])
const prev = [
  ['본관 외곽', '한야간', 0, '22:03', '22:47', '44분', 0, 7, 8, done, 0],
  ['지하주차장 B2', '최야간', 0, '21:30', '22:02', '32분', 0, 7, 7, done, 0],
  ['본관 외곽', '정순찰', 0, '18:00', '18:19', '19분', 0, 3, 8, part, 0],
  ['옥상 · 설비층', '정순찰', 0, '16:12', '16:40', '28분', 0, 5, 5, done, 0],
  ['본관 외곽', '오주간', 0, '14:05', '14:53', '48분', 0, 8, 8, done, 0],
  ['지하주차장 B1', '오주간 외 1명', 1, '13:02', '13:55', '53분', 0, 6, 6, done, 1],
  ['본관 외곽', '오주간', 0, '10:20', '11:05', '45분', 0, 8, 8, done, 0],
  ['지하주차장 B2', '정순찰', 0, '09:35', '10:11', '36분', 0, 7, 7, done, 0],
  ['옥상 · 설비층', '', 0, '09:00', '09:27', '27분', 0, 5, 5, done, 0],
  ['본관 외곽', '한야간', 0, '06:00', '06:44', '44분', 0, 8, 8, done, 0],
  ['야간 전체', '한야간', 0, '02:01', '03:49', '1시간 48분', 1, 18, 18, done, 0],
].map((r) => ['11-17', ...r])

const histRow = ([d, course, who, ho, s, e, el, over, c, t, res, memo], n) =>
  `<tr${n === 3 ? ' class="hover"' : ''}><td class="main">${course}</td><td>${who ? `<span class="here">${who}</span>` : '<span class="dash">순찰자 미지정</span>'}${ho ? `<span class="ho2">${i.swap}교대</span>` : ''}</td><td class="num">2026-${d} ${s}</td><td class="num">${e ? `2026-${d} ${e}` : '<span class="dash">-</span>'}</td><td class="num">${over ? `<span class="late">${i.clockS}${el}</span>` : el}</td><td><span class="cert"><i><u style="width:${Math.round((c / t) * 100)}%"></u></i><span class="num">${c}/${t}</span></span></td><td>${res}${memo ? `<span class="memo" title="특이사항 있음">${i.memo}</span>` : ''}</td><td>${i.chev}</td></tr>`

const historyPage = `${extra}
  <div class="head">
    <div><h1>순찰이력</h1><p>코스·지점 단위 순찰 수행 이력을 확인합니다</p></div>
  </div>

  <div class="tabs"><a class="on">${i.list}코스 순찰이력</a><a>${i.pin}지점 순찰이력</a></div>

  <div class="toolbar">
    <div class="input">${icons.search}순찰자 검색</div>
    <span class="btn">${i.cal}기간 선택</span>
    <span class="btn">${i.list}코스 · 전체 ${icons.down}</span>
    <span class="btn">${i.filter}결과 · 전체 ${icons.down}</span>
    <span class="sp"></span>
  </div>

  <table class="list">
    <thead><tr><th>코스명</th><th>순찰자</th><th>시작 일시</th><th>종료 일시</th><th>소요</th><th>지점 인증</th><th>순찰 결과</th><th></th></tr></thead>
    <tbody>${[...hist, ...prev].map(histRow).join('')}</tbody>
  </table>
  ${foot(148, '건', 8)}

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 칸 · 필터 · 문구는 지금 화면 그대로이고 모양만 바꿨습니다(시간초과는 소요 칸, 교대는 순찰자 칸, 특이사항은 칸 없이 순찰 결과 옆 말풍선). 네 번째 줄은 마우스를 올린 모습입니다.</div>
`

const out = {
  'a-users.html': shell('근무자', '근무자', '', usersPage('')),
  'a-users-add.html': shell('근무자', '근무자', '', usersPage(addModal)),
  'a-course-history.html': shell('순찰이력', '</b>순찰이력<span style="margin:0 2px">›</span><b>코스 순찰이력', '', historyPage),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))

module.exports = { extra, i, foot }
