// A 컨셉 — 배치관리 나머지 탭(복귀 요청 · 전입 이력 · 전출 이력)과 모달 대표 유형(삭제 확인 · 지점 순서 편집 · 회차 보기).
// 칸 · 문구는 지금 구현(DeploymentBoard 와 각 Columns · ZoneDetailPage 의 모달 · CourseRunDialog)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')
require('./gen-a-detail.cjs') // 모달 바탕으로 쓸 a-course-detail.html 을 새로 만든다

const ic = (d, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const x = ic('<path d="M18 6 6 18M6 6l12 12"/>')
const trash = ic('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', 18)
const grip = ic('<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>')
const dots = ic('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>')
const left = ic('<path d="m15 18-6-6 6-6"/>')
const right = ic('<path d="m9 18 6-6-6-6"/>')
const toggle = ic('<rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="16" cy="12" r="2"/>')

/* ───────── 배치관리 탭 ───────── */
const arrow = '<span class="arrow">→</span>'
const here = '<span class="here">판교 테크노밸리 A동</span>'
const more = `<style>
  .tabs { margin-bottom: 0; }
  .toolbar { display: flex; align-items: center; gap: 6px; margin: 12px 0 2px; }
  .toolbar .input { width: 240px; }
  .toolbar .btn svg:first-child { color: var(--muted); }
</style>`
const tabs = (on) =>
  `<div class="tabs">${[['배치 요청', 2], ['복귀 요청', 1], ['전입 이력'], ['전출 이력']].map(([n, c]) => `<a${n === on ? ' class="on"' : ''}>${n}${c ? ` <em class="num">${c}</em>` : ''}</a>`).join('')}</div>`
const deployHead = `
  <div class="head">
    <div><h1>배치관리</h1><p>판교 테크노밸리 A동 소속 근무자의 배치 이력과 요청을 확인합니다</p></div>
    <div class="right"><span class="mini">전출 인원<b class="num">2</b>명</span><span class="mini">전입 인원<b class="num">3</b>명</span></div>
  </div>`
const filter = `<div class="toolbar"><div class="input">${icons.search}이름 검색</div><span class="btn">${toggle}상태 · 전체 ${icons.down}</span></div>`
const st = { plan: '<span class="st">배치예정</span>', on: '<span class="st green">배치중</span>', back: '<span class="st">복귀</span>' }
const foot = (n, pages) => `<div class="foot num"><span>총 ${n}건</span>${require('./pager.cjs').pager(pages)}</div>`
const note = (t) => `<div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 칸 · 필터 · 문구는 지금 화면 그대로입니다. ${t}</div>`

const returns = `${more}${deployHead}
  <div class="block">
    ${tabs('복귀 요청')}
    <table>
      <thead><tr><th>근무자</th><th>복귀 경로</th><th>배치 기간</th><th>사유</th><th>요청일</th><th class="r">처리</th></tr></thead>
      <tbody>
        <tr><td class="main">최야간<small class="num">20210630</small></td><td>${here}${arrow}수원 지사</td><td class="num">2026-11-01 ~ 2026-11-30</td><td>현지 인력 충원 완료</td><td class="num">2026-11-17</td><td class="r"><span class="btn quiet">반려</span> <span class="btn dark">승인</span></td></tr>
      </tbody>
    </table>
    ${foot(1, 1)}
  </div>
  ${note('요청 탭 두 개에는 검색 · 필터 줄이 없습니다(지금 화면과 같음). 복귀 경로의 방향 표기는 지금 화면과 대조하지 않았습니다.')}
`
const history = (on, rows, n) => `${more}${deployHead}
  <div class="block">
    ${tabs(on)}
    ${filter}
    <table>
      <thead><tr><th>근무자</th><th>배치 경로</th><th>기간</th><th>상태</th></tr></thead>
      <tbody>${rows.map(([who, route, period, s]) => `<tr><td class="main">${who}</td><td>${route}</td><td class="num">${period}</td><td>${s}</td></tr>`).join('')}</tbody>
    </table>
    ${foot(n, 1)}
  </div>
  ${note('이력 탭 두 개에만 검색 · 상태 필터 줄이 있습니다(지금 화면과 같음).')}
`
const inRows = [
  ['박순찰', `강남 센터${arrow}${here}`, '2026-11-20 ~ 2026-11-30', st.plan],
  ['최야간', `수원 지사${arrow}${here}`, '2026-11-01 ~ 2026-11-30', st.on],
  ['이경비', `분당 물류${arrow}${here}`, '2026-11-10 ~', st.on],
  ['오주간', `분당 물류${arrow}${here}`, '2026-10-01 ~ 2026-10-31', st.back],
  ['김보안', `강남 센터${arrow}${here}`, '2026-09-12 ~ 2026-09-20', st.back],
]
const outRows = [
  ['한야간', `${here}${arrow}강남 센터`, '2026-11-10 ~ 2026-11-24', st.on],
  ['정순찰', `${here}${arrow}분당 물류`, '2026-11-10 ~ 2026-11-24', st.on],
  ['장주간', `${here}${arrow}수원 지사`, '2026-09-01 ~ 2026-09-30', st.back],
]

/* ───────── 모달 ───────── */
const modalCss = `<style>
  .dim { position: fixed; inset: 0; z-index: 20; display: grid; place-items: center; background: rgb(15 23 42 / .42); }
  .modal { padding: 22px 24px 24px; border-radius: 12px; background: #fff; box-shadow: 0 24px 60px rgb(15 23 42 / .28), 0 0 0 1px rgb(15 23 42 / .06); }
  .modal .mh { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
  .modal h2 { font-size: 16px; font-weight: 600; line-height: 1.3; }
  .modal .mh p { margin-top: 4px; color: var(--muted); line-height: 1.6; }
  .modal .close { margin-left: auto; flex: none; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .modal .acts { display: flex; justify-content: flex-end; gap: 6px; margin-top: 20px; }
  .modal .acts .btn { height: 34px; padding: 0 14px; font-size: 13px; }
  .btn.danger { background: var(--red); border-color: var(--red); color: #fff; }
  .warnic { flex: none; width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: #fee2e2; color: var(--red); }
  /* 확인 창 — 아이콘 · 제목 · 설명을 가운데로, 버튼은 반반 */
  .modal.center { padding: 28px 24px 24px; text-align: center; }
  .modal.center .warnic { width: 44px; height: 44px; margin: 0 auto 14px; border-radius: 50%; }
  .modal.center p { margin-top: 6px; color: var(--muted); line-height: 1.6; }
  .modal .acts.half { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 22px; }
  .modal .acts.half .btn { justify-content: center; height: 36px; }
  /* 순서 번호 — 검정 대신 옅은 파랑 바탕 + 파란 글자 · 테두리 */
  .ord .no, .cand .no { background: var(--accent-soft) !important; color: var(--accent) !important; border: 1px solid #bfd3fb; }
  .addbtn { display: flex; align-items: center; justify-content: center; gap: 6px; height: 38px; margin-top: 12px; border: 1px dashed var(--line-strong); border-radius: 8px; color: var(--sub); font-weight: 500; }
  .menu { position: absolute; right: 0; top: 36px; z-index: 5; width: 156px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 8px; background: #fff; box-shadow: 0 10px 28px rgb(15 23 42 / .16); }
  .menu div { display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 8px; border-radius: 6px; color: var(--fg); }
  .menu div svg { color: var(--muted); }
  .menu div.hov { background: var(--tint); }
  .menu div.red, .menu div.red svg { color: var(--red); }
  .menu hr { margin: 4px 0; border: 0; border-top: 1px solid var(--line); }
  .ord .mn { position: relative; }
  .ord .mn.open { color: var(--fg); background: var(--tint); border-radius: 6px; height: 28px; }
  .dim.back .modal { filter: brightness(.86); }
  .dim.top { z-index: 30; background: rgb(15 23 42 / .28); }
  .srch { display: flex; align-items: center; gap: 6px; height: 34px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--muted); }
  .chips { display: flex; gap: 6px; margin: 10px 0 8px; }
  .chips span { height: 26px; padding: 0 10px; display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--line-strong); border-radius: 13px; font-size: 12px; color: var(--sub); }
  .chips span.on { border-color: var(--accent); background: #f5f8ff; color: var(--accent); font-weight: 500; }
  .cand { display: grid; grid-template-columns: 18px minmax(0, 1fr) auto 22px; align-items: center; gap: 10px; height: 42px; border-bottom: 1px solid var(--line); color: var(--sub); }
  .cand:first-of-type { border-top: 1px solid var(--line); }
  .cand .cb { width: 16px; height: 16px; border: 1.5px solid var(--line-strong); border-radius: 4px; display: grid; place-items: center; color: #fff; }
  .cand.on .cb { background: var(--accent); border-color: var(--accent); }
  .cand .nm { color: var(--fg); font-weight: 500; }
  .cand .nm small { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--muted); }
  .cand .no { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
  /* 후보 목록의 마지막 줄 — 후보 줄과 같은 높이 · 같은 왼쪽 자리 */
  .newpt { display: grid; grid-template-columns: 18px minmax(0, 1fr); align-items: center; gap: 10px; height: 42px; border-bottom: 1px solid var(--line); color: var(--accent); font-weight: 500; }
  .newpt svg { justify-self: center; }
  .newpt.only { border-top: 1px solid var(--line); }
  .nores { padding: 22px 0; text-align: center; color: var(--muted); }
  .srch.has { color: var(--fg); }
  .picked { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--line); }
  .picked span { height: 26px; padding: 0 6px 0 10px; display: inline-flex; align-items: center; gap: 4px; border-radius: 6px; background: var(--tint); font-size: 12px; color: var(--fg); }
  .picked span svg { color: var(--muted); }

  .ord { display: grid; grid-template-columns: 20px 24px minmax(0, 1fr) 92px 28px; align-items: center; gap: 10px; height: 44px; border-bottom: 1px solid var(--line); }
  .ord:first-of-type { border-top: 1px solid var(--line); }
  .ord .g { color: var(--muted); }
  .ord .no { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--fg); color: #fff; font-size: 11px; font-weight: 700; }
  .ord .nm { color: var(--fg); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ord .min { display: flex; align-items: center; justify-content: flex-end; gap: 6px; height: 30px; padding: 0 10px; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--fg); }
  .ord .min span { color: var(--muted); font-size: 12px; }
  .ord .mn { color: var(--muted); display: grid; place-items: center; }
  .ord.drag { margin: 0 -8px; padding: 0 8px; border: 1px solid var(--accent); border-radius: 8px; background: #fff; box-shadow: 0 8px 20px rgb(15 23 42 / .12); }

  .runsum { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 14px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .runsum > div { padding: 10px 16px; border-left: 1px solid var(--line); }
  .runsum > div:first-child { padding-left: 0; border-left: 0; }
  .runsum small { display: block; font-size: 12px; color: var(--muted); }
  .runsum b { font-size: 14px; font-weight: 600; }
  .runsum b.warn { color: var(--red); }
  .rr { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 12px; height: 40px; border-bottom: 1px solid var(--line); }
  .rr:last-child { border-bottom: 0; }
  .rr .no { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--green); color: #fff; font-size: 11px; font-weight: 700; }
  .rr.miss .no { background: #fff; border: 2px solid var(--muted); color: var(--muted); }
  .rr .nm { color: var(--fg); }
  .rr .t { color: var(--sub); }
  .rr.miss .t { color: var(--muted); font-weight: 500; }
  .navs { margin-left: auto; display: flex; gap: 4px; }
  .navs span { width: 28px; height: 28px; display: grid; place-items: center; border: 1px solid var(--line-strong); border-radius: 7px; color: var(--sub); }
</style>`
const base = fs.readFileSync(path.join(__dirname, 'a-course-detail.html'), 'utf8')
const withModal = (title, modal) => base.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`).replace('</body>', `${modalCss}\n<div class="dim">${modal}</div>\n</body>`)

const confirm = `<div class="modal center" style="width:400px">
  <span class="warnic">${trash}</span>
  <h2>코스를 삭제하시겠습니까?</h2>
  <p>삭제된 코스와 지점 편성은 복구할 수 없습니다.<br>지점 자체는 삭제되지 않습니다.</p>
  <div class="acts half"><span class="btn">취소</span><span class="btn danger">삭제</span></div>
</div>`

const pts = [['정문 초소', '-'], ['본관 로비', 5], ['동측 주차장', 7], ['자재 창고', 6], ['후문 초소', 8], ['서측 담장', 9], ['기계실 앞', 7], ['정문 복귀', 8]]
const plus = ic('<path d="M5 12h14M12 5v14"/>')
const upI = ic('<path d="m5 12 7-7 7 7M12 19V5"/>')
const downI = ic('<path d="M12 5v14M19 12l-7 7-7-7"/>')
const trashS = ic('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>')
const chk = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
const rowMenu = `<div class="menu"><div>${upI}위로 이동</div><div>${downI}아래로 이동</div><hr><div class="red hov">${trashS}편성에서 제거</div></div>`
/** state: drag = 4번 줄을 끄는 중 · menu = 5번 줄의 ⋯ 메뉴를 연 모습 · plain = 아무것도 안 함 */
const editor = (state) => `<div class="modal" style="width:640px">
  <div class="mh"><div><h2>지점 순서 편집</h2><p>드래그로 순서를 바꾸고 구간시간을 입력합니다.</p></div><span class="close">${x}</span></div>
  ${pts.map(([nm, m], n) => `<div class="ord${state === 'drag' && n === 3 ? ' drag' : ''}"><span class="g">${grip}</span><span class="no num">${n + 1}</span><span class="nm">${nm}</span><span class="min num">${m}<span>분</span></span><span class="mn${state === 'menu' && n === 4 ? ' open' : ''}">${dots}${state === 'menu' && n === 4 ? rowMenu : ''}</span></div>`).join('')}
  <div class="addbtn">${plus}지점 추가</div>
  <div class="acts"><span class="btn">취소</span><span class="btn dark">저장</span></div>
</div>`
const reorder = editor('drag')
const reorderMenu = editor('menu')

const cands = [['신축동 로비', 'NFC', 1], ['별관 후문', 'QR', 2], ['별관 창고', 'QR', 0], ['냉각탑', 'NFC', 0], ['물탱크실', 'NFC', 0], ['안테나 기단', 'QR', 0]]
const addPoint = (empty) => `<div class="modal" style="width:520px">
  <div class="mh"><div><h2>지점 추가</h2><p>고른 순서대로 코스 끝에 추가됩니다. 구간시간은 추가한 뒤 입력합니다.</p></div><span class="close">${x}</span></div>
  <div class="srch${empty ? ' has' : ''}">${icons.search}${empty ? '별관 3층' : '지점 이름 검색'}</div>
  <div class="chips" aria-label="인증수단 필터"><span class="on">전체 <b class="num">${empty ? 0 : 6}</b></span><span>QR <b class="num">${empty ? 0 : 3}</b></span><span>NFC <b class="num">${empty ? 0 : 3}</b></span></div>
  ${empty ? '<div class="nores">검색 결과가 없습니다.</div>' : cands.map(([nm, a, n]) => `<div class="cand${n ? ' on' : ''}"><span class="cb">${n ? chk : ''}</span><span class="nm">${nm}</span><span style="font-size:12px">${a}</span>${n ? `<span class="no num">${8 + n}</span>` : '<span></span>'}</div>`).join('')}
  <div class="newpt${empty ? ' only' : ''}">${plus}<span>${empty ? "'별관 3층' 새 지점 만들기" : '새 지점 만들기'}</span></div>
  ${empty ? '' : `<div class="picked"><span>신축동 로비${x}</span><span>별관 후문${x}</span></div>`}
  <div class="acts"><span class="btn">취소</span><span class="btn dark"${empty ? ' style="opacity:.45"' : ''}>${empty ? '추가' : '2개 추가'}</span></div>
</div>`

const res = [['정문 초소', '06:04'], ['본관 로비', '06:10'], ['동측 주차장', '06:19'], ['자재 창고', '06:27'], ['후문 초소', ''], ['서측 담장', '06:44'], ['기계실 앞', '06:52'], ['정문 복귀', '07:01']]
const runDialog = `<div class="modal" style="width:480px">
  <div class="mh" style="align-items:center"><h2 class="num">11.18 06:01 순찰</h2><div class="navs"><span title="이전 회차">${left}</span><span title="다음 회차">${right}</span></div><span class="close" style="margin-left:4px">${x}</span></div>
  <div class="runsum"><div><small>근무자</small><b>한야간</b></div><div><small>소요</small><b class="num warn">1시간 1분</b></div><div><small>인증</small><b class="num">7/8</b></div></div>
  ${res.map(([nm, t], n) => `<div class="rr${t ? '' : ' miss'}"><span class="no num">${n + 1}</span><span class="nm">${nm}</span><span class="t num">${t || '미인증'}</span></div>`).join('')}
</div>`

const out = {
  'a-deploy-returns.html': shell('배치관리', '배치관리', '', returns),
  'a-deploy-in.html': shell('배치관리', '배치관리', '', history('전입 이력', inRows, 5)),
  'a-deploy-out.html': shell('배치관리', '배치관리', '', history('전출 이력', outRows, 3)),
  'a-modal-confirm.html': withModal('모달 — 삭제 확인', confirm),
  'a-modal-reorder.html': withModal('모달 — 지점 순서 편집', reorder),
  'a-modal-reorder-menu.html': withModal('모달 — 지점 순서 편집(줄 메뉴)', reorderMenu),
  'a-modal-point-add.html': withModal('모달 — 지점 추가', editor('plain')).replace('<div class="dim">', '<div class="dim back">').replace('</body>', `<div class="dim top">${addPoint(false)}</div>\n</body>`),
  'a-modal-point-add-empty.html': withModal('모달 — 지점 추가(검색 결과 없음)', editor('plain')).replace('<div class="dim">', '<div class="dim back">').replace('</body>', `<div class="dim top">${addPoint(true)}</div>\n</body>`),
  'a-modal-run.html': withModal('모달 — 회차 보기', runDialog),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
