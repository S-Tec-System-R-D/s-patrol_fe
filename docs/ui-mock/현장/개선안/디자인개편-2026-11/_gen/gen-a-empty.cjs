// 비어 있을 때의 화면 — 근무자 목록(처음부터 없음 · 조건에 맞는 것 없음) · 대시보드.
// 문구는 지금 구현(UsersPage · ActiveCourseSection · RecentRecordPanel · DeploymentPendingPanel · DashboardNoticePanel)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')
const { extra, i } = require('./gen-a-list.cjs')

const ic = (d) => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const filterX = ic('<path d="M13.013 3H2l8 9.46V19l4 2v-8.54l.9-1.055"/><path d="m22 3-5 5M17 3l5 5"/>')
const chart = ic('<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9M13 17V5M8 17v-3"/>')
const reset = ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>')

/** 빈 상태 — 흰 타일 아이콘 → 제목 → 설명. emptySm 은 한 영역 안에서 쓰는 작은 크기(제목 없이 한 줄) */
const empty = (icon, title, desc, fill) => `<div class="empty${fill ? ' fill' : ''}"><span class="tile">${icon}</span><b>${title}</b>${desc ? `<p>${desc}</p>` : ''}</div>`
const emptySm = (icon, text) => `<p class="none">${text}</p>`

const usersHead = (n) => `${extra}
  <div class="head"><div><h1>근무자</h1><p>판교 테크노밸리 A동 소속 ${n}명</p></div></div>`
const usersEmpty = `${usersHead(0)}
  <div class="toolbar">
    <div class="input">${icons.search}이름·사번 검색</div>
    <span class="btn">${i.shield}권한 · 전체 ${icons.down}</span>
    <span class="btn">${i.clock}근무 상태 · 전체 ${icons.down}</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}근무자 추가</span>
  </div>
  ${empty(icons.users, '등록된 근무자가 없습니다', '근무자를 추가하면 여기에 표시됩니다.', 1)}
`
const usersNone = `${usersHead(12)}
  <div class="toolbar">
    <div class="input" style="color:var(--fg)">${icons.search}홍길동</div>
    <span class="btn on">${i.shield}권한 · 현장 관리자 ${icons.down}</span>
    <span class="btn">${i.clock}근무 상태 · 전체 ${icons.down}</span>
    <span class="btn icon" title="필터 초기화">${reset}</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}근무자 추가</span>
  </div>
  ${empty(filterX, '조건에 맞는 근무자가 없습니다', '검색어나 필터를 바꿔보세요.', 1)}
`

const live = `<span class="live"><i></i>실시간</span><span class="num">마지막 갱신 14:32</span><span class="btn">${icons.refresh}새로고침</span>`
const zero = (nm) => `<div class="cb zero"><span>${nm}</span><i><u style="width:0%"></u></i><span class="num">0회</span></div>`
const dashEmpty = `
  <div class="head">
    <div><h1>대시보드</h1><p>판교 테크노밸리 A동의 순찰 현황</p></div>
    <div class="right"><span class="mini big">진행 중<b class="num">0</b>건</span><span class="mini big">완료<b class="num">0</b>건</span><span class="mini big">미완료<b class="num">0</b>건</span><span class="mini big">시간초과<b class="num">0</b>건</span></div>
  </div>

  <div class="block">
    <div class="sec"><h2>진행 중</h2><span class="cnt num">0</span></div>
    <div class="emptybox">${empty(icons.route, '지금 진행 중인 순찰이 없습니다', '')}</div>
  </div>

  <div class="tri">
    <div class="col">
      <div class="block"><div class="sec"><h2>미완료 · 시간초과</h2><span class="cnt num">0</span><span class="more">전체 보기 →</span></div>${emptySm(icons.hist, '어제와 오늘 미완료 · 시간초과 순찰이 없습니다')}</div>
      <div class="block"><div class="sec"><h2>종료된 순찰</h2><span class="cnt num">0</span></div>${emptySm(icons.hist, '오늘 종료된 순찰이 없습니다')}</div>
    </div>
    <div class="col">
      <div class="block"><div class="sec"><h2>오늘 시간대별 순찰</h2><span class="cnt">시작 시각 기준 · 0회</span></div>${emptySm(chart, '오늘 시작한 순찰이 없습니다')}</div>
      <div class="block"><div class="sec"><h2>오늘 코스별 순찰</h2><span class="cnt">시작 기준 · 0회</span></div>${['본관 외곽', '지하주차장 B1', '지하주차장 B2', '옥상 · 설비층', '야간 전체', '별관 창고'].map(zero).join('')}</div>
    </div>
    <div class="col side">
      <div class="block"><div class="sec"><h2>배치 대기</h2><span class="cnt num">0</span><span class="more">전체 →</span></div>${emptySm(icons.swap, '대기 중인 배치 요청이 없습니다')}</div>
      <div class="block"><div class="sec"><h2>공지사항</h2><span class="more">전체 →</span></div>${emptySm(icons.horn, '등록된 공지가 없습니다')}</div>
    </div>
  </div>
  <div class="note"><b>목업 메모</b> — 모든 영역이 비어 있는 경우입니다(실제로는 일부만 비는 일이 많습니다). 문구는 지금 화면 그대로이고, <b>오늘 시간대별 순찰</b>의 문구만 새로 지었습니다(새로 넣는 영역). 진행 중은 넓은 자리라 타일 아이콘을 쓰고, 나머지 작은 영역은 지금 화면처럼 아이콘 없이 글자 한 줄입니다. 코스별 순찰은 코스가 있으면 0회로 줄을 그대로 보여 줍니다.</div>
`

const out = {
  'a-users-empty.html': shell('근무자', '근무자', '', usersEmpty),
  'a-users-noresult.html': shell('근무자', '근무자', '', usersNone),
  'a-dashboard-empty.html': shell('대시보드', '대시보드', live, dashEmpty),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
