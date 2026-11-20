// A 컨셉 — 남은 목록 화면: 지점 순찰이력 · 코스 목록 · 지점 목록 · 공지사항 목록.
// 칸 · 필터 · 문구는 지금 구현(PatrolPointsPage · ZonesPage · PointsPage · NoticeListPage 와 각 Column)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')
const { extra, i, foot } = require('./gen-a-list.cjs')

const ic = (d, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const pushpin = ic('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>')
const clip = ic('<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>', 13)
const scan = ic('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>')
const toggle = ic('<rect width="20" height="12" x="2" y="6" rx="6"/><circle cx="16" cy="12" r="2"/>')

const more = `<style>
  tr.off td, tr.off td.main, tr.off .st { color: var(--muted); }
  .kind { font-size: 12px; color: var(--sub); }
  .pinc { width: 28px; color: var(--accent); }
  table.list th.pinc, table.list td.pinc { padding-right: 0; }
  .att { margin-left: 6px; color: var(--muted); vertical-align: middle; }
</style>`
const dash = '<span class="dash">-</span>'
const chev = `<td>${i.chev}</td>`
const crumb = (parent, name) => `</b>${parent}<span style="margin:0 2px">›</span><b>${name}`
const memo = `<span class="memo" title="특이사항 있음">${i.memo}</span>`
const note = (t) => `<div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 칸 · 필터 · 문구는 지금 화면 그대로이고 모양만 바꿨습니다. ${t}</div>`

/* ───────── 지점 순찰이력 ───────── */
const ok = '<span class="st green">인증</span>'
const miss = '<span class="st">미인증</span>'
const late = '<span class="st red">시간초과</span>'
const ph = [
  ['11-18', '14:24', '자재 창고', '본관 외곽', 'NFC', '정순찰', ok, 0],
  ['11-18', '14:20', '저수조', '지하주차장 B1', 'QR', '한야간', ok + late, 0],
  ['11-18', '14:16', '동측 주차장', '본관 외곽', 'NFC', '정순찰', ok, 0],
  ['11-18', '14:08', '본관 로비', '본관 외곽', 'NFC', '정순찰', ok, 0],
  ['11-18', '14:04', '정문 초소', '본관 외곽', 'NFC', '정순찰', ok, 0],
  ['11-18', '13:58', '비상계단 2', '지하주차장 B1', 'QR', '한야간', ok, 1],
  ['11-18', '13:40', '동측 램프', '지하주차장 B1', '', '', miss, 0],
  ['11-18', '13:31', '전기실', '지하주차장 B1', 'QR', '오주간', ok, 0],
  ['11-18', '13:23', 'B1 입구', '지하주차장 B1', 'QR', '오주간', ok, 0],
  ['11-18', '11:08', '정문 복귀', '본관 외곽', 'NFC', '오주간', ok, 0],
  ['11-18', '11:01', '기계실 앞', '본관 외곽', 'NFC', '오주간', ok, 0],
  ['11-18', '10:54', '서측 담장', '본관 외곽', 'NFC', '오주간', ok, 1],
  ['11-18', '10:47', '후문 초소', '본관 외곽', 'NFC', '오주간', ok, 0],
  ['11-18', '10:40', '자재 창고', '본관 외곽', 'NFC', '오주간', ok, 0],
  ['11-18', '09:59', '저수조', '지하주차장 B2', '', '', miss, 0],
  ['11-18', '09:52', '전기실', '지하주차장 B2', 'QR', '정순찰', ok, 0],
]
const pointHistory = `${extra}${more}
  <div class="head"><div><h1>순찰이력</h1><p>코스·지점 단위 순찰 수행 이력을 확인합니다</p></div></div>
  <div class="tabs"><a>${i.list}코스 순찰이력</a><a class="on">${i.pin}지점 순찰이력</a></div>
  <div class="toolbar">
    <div class="input">${icons.search}순찰자 검색</div>
    <span class="btn">${i.cal}기간 선택</span>
    <span class="btn">${i.list}코스 · 전체 ${icons.down}</span>
    <span class="btn">${scan}인증수단 · 전체 ${icons.down}</span>
    <span class="btn">${i.filter}결과 · 전체 ${icons.down}</span>
    <span class="sp"></span>
  </div>
  <table class="list">
    <thead><tr><th>순찰일시</th><th>순찰지점</th><th>순찰코스</th><th>인증수단</th><th>순찰자</th><th>결과</th><th></th></tr></thead>
    <tbody>${ph
      .map(([d, t, p, c, a, u, r, m], n) => `<tr${n === 5 ? ' class="hover"' : ''}><td class="two"><b class="num">2026-${d}</b><small class="num">${t}</small></td><td class="main">${p}</td><td>${c}</td><td>${a ? `<span class="kind">${a}</span>` : dash}</td><td>${u ? `<span class="here">${u}</span>` : dash}</td><td>${r}${m ? memo : ''}</td>${chev}</tr>`)
      .join('')}</tbody>
  </table>
  ${foot(1284, '건', 65)}
  ${note('특이사항은 코스 순찰이력과 같이 칸 없이 결과 옆 말풍선입니다. 인증수단은 상태가 아니라 분류라서 글자만 둡니다. 여섯 번째 줄은 마우스를 올린 모습입니다.')}
`

/* ───────── 코스 목록 ───────── */
const use = '<span class="st green">사용</span>'
const unuse = '<span class="st">미사용</span>'
const courses = [
  ['본관 외곽', 8, '50분', 1, '2026-11-18 11:10', 1],
  ['지하주차장 B1', 6, '1시간', 1, '2026-11-18 00:58', 1],
  ['지하주차장 B2', 7, '40분', 0, '2026-11-18 09:59', 1],
  ['옥상 · 설비층', 5, '-', 0, '2026-11-18 09:31', 1],
  ['야간 전체', 18, '1시간 50분', 1, '2026-11-18 03:34', 1],
  ['별관 창고', 4, '20분', 0, '2026-11-16 15:12', 1],
  ['주말 단축', 5, '30분', 0, '', 1],
  ['구 본관(폐쇄)', 6, '45분', 0, '2026-08-30 22:41', 0],
]
const tabsCP = (on) => `<div class="tabs"><a${on === 'c' ? ' class="on"' : ''}>${icons.route}코스</a><a${on === 'p' ? ' class="on"' : ''}>${i.pin}지점</a></div>`
const courseList = `${extra}${more}
  <div class="head"><div><h1>코스/지점</h1><p>순찰 코스와 지점을 구성하고 관리합니다</p></div></div>
  ${tabsCP('c')}
  <div class="toolbar">
    <div class="input">${icons.search}코스 이름 검색</div>
    <span class="btn">${toggle}사용여부 · 전체 ${icons.down}</span>
    <span class="btn">${i.swap.replace('width="12" height="12"', 'width="14" height="14"')}교대 · 전체 ${icons.down}</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}코스 생성</span>
  </div>
  <table class="list">
    <thead><tr><th>코스명</th><th>지점 수</th><th>총 소요시간</th><th>교대</th><th>최근 순찰</th><th>사용여부</th><th></th></tr></thead>
    <tbody>${courses
      .map(([nm, pc, t, sw, last, on], n) => `<tr class="${on ? '' : 'off'}${n === 1 ? ' hover' : ''}"><td class="main">${nm}</td><td class="num">${pc}개</td><td class="num">${t}</td><td>${sw ? '허용' : '<span class="dash">허용 안 함</span>'}</td><td class="num">${last || dash}</td><td>${on ? use : unuse}</td>${chev}</tr>`)
      .join('')}</tbody>
  </table>
  ${foot(8, '개', 1)}
  ${note('교대는 상태가 아니라 설정이라 아이콘 없이 글자만 둡니다. 미사용 코스는 줄 전체가 옅습니다. 두 번째 줄은 마우스를 올린 모습입니다.')}
`

/* ───────── 지점 목록 ───────── */
const points = [
  ['정문 초소', 'NFC', 2, '2026-11-18 14:04', 1], ['본관 로비', 'NFC', 2, '2026-11-18 14:08', 1], ['동측 주차장', 'NFC', 1, '2026-11-18 14:16', 1],
  ['자재 창고', 'NFC', 2, '2026-11-18 14:24', 1], ['후문 초소', 'NFC', 2, '2026-11-18 10:47', 1], ['서측 담장', 'NFC', 1, '2026-11-18 10:54', 1],
  ['기계실 앞', 'QR', 3, '2026-11-18 11:01', 1], ['B1 입구', 'QR', 2, '2026-11-18 13:23', 1], ['전기실', 'QR', 3, '2026-11-18 13:31', 1],
  ['동측 램프', 'QR', 1, '2026-11-17 21:44', 1], ['비상계단 2', 'QR', 1, '2026-11-18 13:58', 1], ['저수조', 'QR', 2, '2026-11-18 14:20', 1],
  ['옥상 출입문', 'NFC', 1, '2026-11-18 14:27', 1], ['냉각탑', 'NFC', 1, '2026-11-18 09:12', 1], ['신축동 로비', 'NFC', 0, '', 1], ['구 경비실', 'QR', 0, '2026-08-30 22:10', 0],
]
const pointList = `${extra}${more}
  <div class="head"><div><h1>코스/지점</h1><p>순찰 코스와 지점을 구성하고 관리합니다</p></div></div>
  ${tabsCP('p')}
  <div class="toolbar">
    <div class="input">${icons.search}지점 이름 검색</div>
    <span class="btn">${scan}인증수단 · 전체 ${icons.down}</span>
    <span class="btn">${toggle}사용여부 · 전체 ${icons.down}</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}지점 생성</span>
  </div>
  <table class="list">
    <thead><tr><th>지점명</th><th>인증수단</th><th>소속 코스</th><th>최근 순찰</th><th>사용여부</th><th></th></tr></thead>
    <tbody>${points
      .map(([nm, a, uc, last, on], n) => `<tr class="${on ? '' : 'off'}${n === 3 ? ' hover' : ''}"><td class="main">${nm}</td><td><span class="kind">${a}</span></td><td class="num">${uc ? `${uc}개` : dash}</td><td class="num">${last || dash}</td><td>${on ? use : unuse}</td>${chev}</tr>`)
      .join('')}</tbody>
  </table>
  ${foot(42, '개', 3)}
  ${note('네 번째 줄은 마우스를 올린 모습입니다.')}
`

/* ───────── 공지사항 목록 ───────── */
const notices = [
  [1, '동절기 순찰 시 방한 장비 착용 안내', 1, '본사 관리자', '2026-11-17'],
  [1, '비상연락망 변경 안내', 0, '본사 관리자', '2026-11-03'],
  [0, '11월 4주차 야간 근무 편성 변경', 0, '김현장', '2026-11-15'],
  [0, '지하주차장 B2 공사 구간 우회 동선', 1, '김현장', '2026-11-12'],
  [0, '후문 초소 NFC 태그 교체 완료', 0, '김현장', '2026-11-08'],
  [0, '순찰 앱 업데이트 안내(특이사항 사진 첨부)', 0, '본사 관리자', '2026-11-05'],
  [0, '11월 소방 점검 일정', 1, '김현장', '2026-11-01'],
  [0, '옥상 출입문 잠금 장치 교체', 0, '김현장', '2026-10-27'],
  [0, '10월 우수 근무자 안내', 0, '본사 관리자', '2026-10-21'],
]
const noticeList = `${extra}${more}
  <div class="head"><div><h1>공지사항</h1><p>근무자에게 전달할 공지를 관리합니다</p></div></div>
  <div class="toolbar">
    <div class="input">${icons.search}제목·내용 검색</div>
    <span class="btn">${i.cal}기간 선택</span>
    <span class="sp"></span>
    <span class="btn dark">${i.plus}공지 작성</span>
  </div>
  <table class="list">
    <thead><tr><th class="pinc"></th><th>제목</th><th style="width:220px">작성자</th><th style="width:180px">작성일</th><th></th></tr></thead>
    <tbody>${notices
      .map(([pin, t, att, who, d], n) => `<tr${n === 2 ? ' class="hover"' : ''}><td class="pinc">${pin ? pushpin : ''}</td><td class="main">${t}${att ? `<span class="att">${clip}</span>` : ''}</td><td>${who}</td><td class="num">${d}</td>${chev}</tr>`)
      .join('')}</tbody>
  </table>
  ${foot(27, '건', 2)}
  ${note('고정 공지는 맨 앞 칸의 파란 압정으로 표시합니다. 제목 옆 회색 클립은 첨부가 있는 공지입니다(지금 화면과 같음). 세 번째 줄은 마우스를 올린 모습입니다.')}
`

const out = {
  'a-point-history.html': shell('순찰이력', crumb('순찰이력', '지점 순찰이력'), '', pointHistory),
  'a-courses.html': shell('코스/지점', crumb('코스/지점', '코스'), '', courseList),
  'a-points.html': shell('코스/지점', crumb('코스/지점', '지점'), '', pointList),
  'a-notices.html': shell('공지사항', '공지사항', '', noticeList),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
