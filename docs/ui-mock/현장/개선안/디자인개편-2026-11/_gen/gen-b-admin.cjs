// 본사 사이트 — 사업장 목록 · 사업장 상세 · 관리자 + 안내 화면(권한 없음 · 찾을 수 없음).
// 구성 · 문구는 지금 구현(LocationsPage · LocationDetailPage · AdminsPage · GroupTree · 사업장 상세 카드들 · ForbiddenPage · NotFoundPage)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')
const { extra: listCss, i } = require('./gen-a-list.cjs')

const ic = (d, s = 14, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const pen = ic('<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>', 12)
const dots = ic('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>')
const vdots = ic('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>')
const chevS = ic('<path d="m9 18 6-6-6-6"/>', 12, 2.2)
const chevD = ic('<path d="m6 9 6 6 6-6"/>', 12, 2.2)
const bld = ic('<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>')
const plusS = ic('<path d="M5 12h14M12 5v14"/>', 12)
const shieldOff = ic('<path d="m2 2 20 20"/><path d="M5 5a1 1 0 0 0-1 1v7c0 5 3.5 7.5 7.67 8.94a1 1 0 0 0 .67.01c2.35-.82 4.48-1.97 5.9-3.71"/><path d="M9.309 3.652A12.252 12.252 0 0 0 11.24 2.28a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v7a9.784 9.784 0 0 1-.08 1.264"/>', 26, 1.8)
const compass = ic('<path d="m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z"/><circle cx="12" cy="12" r="10"/>', 26, 1.8)
const crumb = (parent, name) => `</b>${parent}<span style="margin:0 2px">›</span><b>${name}`

/** 본사 틀 — 사업장을 고르지 않고(선택 칸 없음) 메뉴는 사업장 · 관리자 둘 */
const adminShell = (active, crumbText, main) =>
  shell(active, crumbText, '', main)
    .replace(/<div class="site">[\s\S]*?<\/div>\s*/, '')
    .replace(/<nav class="nav">[\s\S]*?<\/nav>/, `<nav class="nav"><a${active === '사업장' ? ' class="on"' : ''}>${bld}사업장</a><a${active === '관리자' ? ' class="on"' : ''}>${icons.users}관리자</a></nav>`)
    .replace('<div class="me"><b>김현장</b><small>현장관리자</small></div>', '<div class="me"><b>박본사</b><small>마스터</small></div>')
    .replace(/<title>[^<]*<\/title>/, `<title>본사 · ${active} — 목업</title>`)

const css = `${listCss}<style>
  /* 왼쪽 관리그룹 단 + 본문 — 카드 대신 세로 선으로 나눈다 */
  .split { display: grid; grid-template-columns: 232px minmax(0, 1fr); }
  .split > .tree { padding-right: 16px; border-right: 1px solid var(--line); }
  .split > .main { padding-left: 28px; min-width: 0; }
  .tree .th { display: flex; align-items: baseline; gap: 6px; height: 30px; margin-bottom: 6px; }
  .tree .th b { font-size: 15px; font-weight: 600; }
  .tree .th small { font-size: 12px; color: var(--muted); }
  .tree .th .edit { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--accent); }
  .tn { display: flex; align-items: center; gap: 4px; height: 32px; padding-right: 8px; border-radius: 6px; color: var(--sub); }
  .tn .a { flex: none; width: 20px; display: grid; place-items: center; color: var(--muted); }
  .tn .a u { width: 5px; height: 5px; border-radius: 1px; background: var(--muted); opacity: .6; }
  .tn .n { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tn em { font-style: normal; font-size: 12px; color: var(--muted); }
  .tn.l0 { padding-left: 2px; color: var(--fg); font-weight: 600; }
  .tn.l1 { padding-left: 18px; color: var(--fg); font-weight: 500; }
  .tn.l1 > svg { color: var(--muted); flex: none; margin-right: 2px; }
  .tn.l2 { padding-left: 50px; }
  .tn.on { background: var(--tint-strong); color: var(--fg); font-weight: 500; }
  .tn.on .a u { background: var(--accent); opacity: 1; }
  .tn.on em { color: var(--fg); }
  .sub1 { color: var(--muted); margin-right: 6px; }
  .total { padding-top: 10px; font-size: 12px; color: var(--muted); }
  .total b { color: var(--fg); font-weight: 500; }

  /* 사업장 상세 */
  .head .gp { font-size: 12px; color: var(--muted); margin-bottom: 2px; }
  .cols2 { display: grid; grid-template-columns: 400px minmax(0, 1fr); }
  .cols2 > .info { padding-right: 28px; border-right: 1px solid var(--line); }
  .cols2 > .body { padding-left: 32px; min-width: 0; }
  .kvr { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .kvr:last-child { border-bottom: 0; }
  .kvr dt { width: 110px; flex: none; color: var(--muted); }
  .kvr dd { color: var(--fg); min-width: 0; }
  .kvr dd a { display: flex; align-items: center; gap: 2px; color: var(--accent); font-weight: 500; }
  .kvr dd a + a { margin-top: 4px; }
  .desc { margin: -4px 0 10px; font-size: 12px; color: var(--muted); }
  .sec .act { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--accent); }
  .pl { display: flex; align-items: center; gap: 6px; height: 40px; border-bottom: 1px solid var(--line); }
  .pl:last-child { border-bottom: 0; }
  .pl b { font-weight: 500; color: var(--fg); }
  .pl small { font-size: 12px; color: var(--muted); }
  .pl .m { margin-left: auto; width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .sw { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; font-size: 12px; font-weight: 500; color: var(--fg); }
  .sw i { width: 30px; height: 18px; border-radius: 9px; background: var(--accent); position: relative; }
  .sw i::after { content: ''; position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; }
  .sw + .act { margin-left: 14px; }
  .hc { display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr; gap: 16px; padding: 4px 0 16px; }
  .hc dt { font-size: 12px; color: var(--muted); margin-bottom: 3px; }
  .hc dd { font-size: 18px; font-weight: 600; color: var(--fg); line-height: 1.3; }
  .hc dd small { display: block; margin-top: 2px; font-size: 12px; font-weight: 400; color: var(--muted); }
  .day { position: relative; height: 6px; margin: 0 14px 0 4px; border-radius: 3px; background: var(--tint-strong); overflow: hidden; }
  .day i { position: absolute; top: 0; bottom: 0; background: var(--accent); opacity: .7; }
  .day i.gap { background: var(--tint-strong); opacity: 1; }
  .dayx { position: relative; height: 16px; margin: 5px 14px 0 4px; font-size: 11px; color: var(--muted); }
  .dayx span { position: absolute; transform: translateX(-50%); }
  .week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; }
  .week .dn { height: 30px; display: grid; place-items: center; border-bottom: 1px solid var(--line); margin-bottom: 8px; font-weight: 600; color: var(--fg); }
  .week .dn.we { color: var(--red); }
  .week .p { padding: 7px 10px; margin-bottom: 6px; border: 1px solid var(--line-strong); border-radius: 8px; }
  .week .p b { font-weight: 500; color: var(--fg); }
  .week .p small { font-size: 12px; color: var(--muted); }
  .week .p span { display: block; font-size: 12px; color: var(--muted); }
  .week .add { display: flex; align-items: center; justify-content: center; gap: 4px; height: 30px; border: 1px dashed var(--line-strong); border-radius: 8px; font-size: 12px; color: var(--muted); }
  .week .none { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 0; border: 1px dashed #fca5a5; border-radius: 8px; background: #fef2f2; font-size: 12px; font-weight: 500; color: var(--red); }
  .week .none small { font-weight: 400; opacity: .85; }

  /* 관리그룹 편집 창 — 회사 머리 줄 + 본부마다 상자 하나 + 그 안에 지사 */
  .modal.grp { width: 600px; }
  .ge .co { display: flex; align-items: baseline; gap: 6px; height: 30px; margin-bottom: 8px; }
  .ge .co b { font-size: 15px; font-weight: 600; }
  .ge small { font-size: 12px; color: var(--muted); }
  .ge .lk { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--accent); }
  .ge .hq { margin-bottom: 10px; border: 1px solid var(--line-strong); border-radius: 10px; }
  .ge .hq:last-child { margin-bottom: 0; }
  .ge .hh { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 14px; border-bottom: 1px solid var(--line); }
  .ge .hh > svg { color: var(--accent); flex: none; }
  .ge .hh b { font-weight: 600; margin-right: -2px; }
  .ge .br { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 18px; }
  .ge .br u { flex: none; width: 5px; height: 5px; border-radius: 1px; background: var(--muted); opacity: .6; margin-right: 4px; }
  .ge .br b { font-weight: 500; margin-right: -2px; }
  .ge .cnt { margin-left: auto; font-size: 12px; color: var(--muted); }
  .ge .m { width: 26px; height: 26px; display: grid; place-items: center; border-radius: 6px; color: var(--muted); }
  .ge .hh .m { margin-left: auto; }
  .ge .m.open { background: #f1f5f9; color: var(--fg); }
  .ge .none { padding: 12px 18px; font-size: 12px; color: var(--muted); }
  .ge .hf { padding: 8px 14px 10px; border-top: 1px solid var(--line); }
  .ge .hf .lk { margin-left: 0; }
  .ge .pop { position: absolute; right: 8px; top: 36px; z-index: 2; width: 132px; padding: 4px; border: 1px solid var(--line-strong); border-radius: 8px; background: #fff; box-shadow: 0 10px 24px rgb(15 23 42 / .14); }
  .ge .pop a { display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 8px; border-radius: 5px; color: var(--fg); }
  .ge .pop a svg { color: var(--muted); }
  .ge .pop a.red, .ge .pop a.red svg { color: var(--red); }
  .ge .pop hr { margin: 4px 0; border: 0; border-top: 1px solid var(--line); }
</style>`

/* 관리그룹 — [단계, 이름, 수, 고름] */
const tree = (unit, rows, u) => `
    <div class="tree">
      <div class="th"><b>관리그룹</b><small>${unit} 수</small><span class="edit">${pen}편집</span></div>
      ${rows
        .map(([l, nm, n, on]) =>
          l === 0
            ? `<div class="tn l0${on ? ' on' : ''}"><span class="a">${chevD}</span><span class="n">${nm}</span>${n !== null ? `<em class="num">${n}${u}</em>` : ''}</div>`
            : l === 1
              ? `<div class="tn l1${on ? ' on' : ''}"><span class="a">${chevD}</span>${bld}<span class="n">${nm}</span>${n !== null ? `<em class="num">${n}${u}</em>` : ''}</div>`
              : `<div class="tn l2${on ? ' on' : ''}"><span class="a"><u></u></span><span class="n">${nm}</span>${n !== null ? `<em class="num">${n}${u}</em>` : ''}</div>`
        )
        .join('')}
    </div>`

/* ───────── 사업장 목록 ───────── */
const siteTree = [[0, '에스텍시스템', null], [1, '수도권본부', null], [2, '서울지사', 4], [2, '경기남부지사', 6, 1], [2, '경기북부지사', 3], [1, '영남본부', null], [2, '부산지사', 5], [2, '대구지사', 2]]
const sites = [
  [0, '판교 테크노밸리 A동', '경기 성남시 분당구 판교역로 235'],
  [1, '판교 테크노밸리 B동', '경기 성남시 분당구 판교역로 241'],
  [1, '판교 테크노밸리 주차타워', '경기 성남시 분당구 판교역로 229'],
  [0, '분당 물류', '경기 성남시 분당구 야탑로 81'],
  [0, '수원 지사', '경기 수원시 영통구 광교로 107'],
  [0, '용인 데이터센터', '경기 용인시 기흥구 흥덕중앙로 120'],
]
const sitesPage = `${css}
  <div class="head"><div><h1>사업장</h1><p>경기남부지사 하위 사업장 6개</p></div></div>
  <div class="split">${tree('사업장', siteTree, '개')}
    <div class="main">
      <div class="toolbar">
        <div class="input" style="width:260px">${icons.search}사업장명·주소 검색</div>
        <span class="sp"></span>
        <span class="btn dark">${i.plus}사업장 추가</span>
      </div>
      <table class="list">
        <thead><tr><th>사업장명</th><th>본부</th><th>지사</th><th>주소</th><th></th></tr></thead>
        <tbody>${sites.map(([d, nm, addr], n) => `<tr${n === 3 ? ' class="hover"' : ''}><td class="main"${d ? ' style="padding-left:24px"' : ''}>${d ? '<span class="sub1">└</span>' : ''}${nm}</td><td>수도권본부</td><td>경기남부지사</td><td>${addr}</td><td>${i.chev}</td></tr>`).join('')}</tbody>
      </table>
      <div class="total num">총 <b>6</b>개</div>
    </div>
  </div>
  <div class="note"><b>목업 메모</b> — 이름 · 주소는 모두 예시입니다. 구성 · 문구는 지금 화면 그대로입니다(왼쪽 관리그룹 · 검색 · 사업장 추가 · 표 4칸). 관리그룹은 상자 대신 세로 선으로 나눴고, 고른 그룹은 사이드바 메뉴와 같은 회색 바탕입니다. 목록은 한 번에 다 보여 주므로 쪽 넘김이 없습니다. 네 번째 줄은 마우스를 올린 모습입니다.</div>
`

/* ───────── 사업장 상세 ───────── */
const week = [
  ['월', [['박본사', '마스터', '010-2345-6789'], ['이지사', '매니저', '010-3456-7890']]],
  ['화', [['이지사', '매니저', '010-3456-7890']]],
  ['수', [['이지사', '매니저', '010-3456-7890']]],
  ['목', [['최경기', '매니저', '010-4567-8901']]],
  ['금', [['최경기', '매니저', '010-4567-8901']]],
  ['토', []],
  ['일', [['박본사', '마스터', '010-2345-6789']]],
]
const siteDetail = `${css}
  <div class="head">
    <div><div class="gp">수도권본부 › 경기남부지사</div><h1>판교 테크노밸리 A동</h1></div>
    <div class="right"><span class="btn fill sq">${dots}</span></div>
  </div>
  <div class="cols2">
    <div class="info">
      <div class="block">
        <div class="sec"><h2>기본정보</h2></div>
        <dl>
          <div class="kvr"><dt>주소</dt><dd>경기 성남시 분당구 판교역로 235</dd></div>
          <div class="kvr"><dt>대표 연락처</dt><dd class="num">031-123-4567</dd></div>
          <div class="kvr"><dt>순찰 코스 · 지점</dt><dd class="num">5개 · 42개</dd></div>
          <div class="kvr"><dt>하위 사업장</dt><dd><a>판교 테크노밸리 B동${chevS}</a><a>판교 테크노밸리 주차타워${chevS}</a></dd></div>
        </dl>
      </div>
      <div class="block">
        <div class="sec"><h2>담당 관리자</h2><span class="cnt num">2명</span></div>
        <p class="desc">관리자 메뉴에서 지정한 담당 그룹으로 정해집니다.</p>
        <div class="pl"><b>이지사</b><small>매니저</small></div>
        <div class="pl"><b>최경기</b><small>매니저</small></div>
      </div>
      <div class="block">
        <div class="sec"><h2>현장관리자</h2><span class="cnt num">2명</span><span class="act">${plusS}추가</span></div>
        <p class="desc">현장 사이트에 로그인해 이 사업장의 근무자 · 순찰을 관리하는 계정입니다.</p>
        <div class="pl"><b>김현장</b><small class="num">10021</small><span class="m">${vdots}</span></div>
        <div class="pl"><b>송현장</b><small class="num">10058</small><span class="m">${vdots}</span></div>
      </div>
    </div>

    <div class="body">
      <div class="block">
        <div class="sec"><h2>헬스체크</h2><span class="sw"><i></i>사용</span><span class="act">${pen}수정</span></div>
        <p class="desc">근무자 단말의 정상 동작 여부를 주기적으로 확인합니다. 응답이 없으면 비상연락망으로 알림이 발송됩니다.</p>
        <dl class="hc num">
          <div><dt>사용 시간</dt><dd>22:00 – 06:00<small>예외 02:00 – 03:00</small></dd></div>
          <div><dt>체크 주기</dt><dd>30분</dd></div>
          <div><dt>타임아웃</dt><dd>1회</dd></div>
          <div><dt>반복 횟수</dt><dd>3회</dd></div>
        </dl>
        <div class="day"><i style="left:0;width:25%"></i><i style="left:91.67%;width:8.33%"></i><i class="gap" style="left:8.33%;width:4.17%"></i></div>
        <div class="dayx num">${[0, 6, 12, 18, 24].map((h) => `<span style="left:${(h / 24) * 100}%">${h}${h === 24 ? '시' : ''}</span>`).join('')}</div>
      </div>
      <div class="block">
        <div class="sec"><h2>비상연락망</h2></div>
        <p class="desc">헬스체크 이상 감지 시 요일별로 지정된 담당자에게 알림이 발송됩니다.</p>
        <div class="week">${week
          .map(
            ([d, ps]) =>
              `<div><div class="dn${d === '토' || d === '일' ? ' we' : ''}">${d}</div>${
                ps.length
                  ? `${ps.map(([nm, role, tel]) => `<div class="p"><b>${nm}</b> <small>${role}</small><span class="num">${tel}</span></div>`).join('')}<div class="add">${plusS}추가</div>`
                  : `<div class="none">${plusS}담당자 지정<small>비어 있음</small></div>`
              }</div>`
          )
          .join('')}</div>
      </div>
    </div>
  </div>
  <div class="note"><b>목업 메모</b> — 이름 · 값은 모두 예시입니다. 구성 · 문구는 지금 화면 그대로입니다(왼쪽 기본정보 · 담당 관리자 · 현장관리자 / 오른쪽 헬스체크 · 비상연락망). 사업장 수정 · 삭제는 오른쪽 위 <b>⋯</b> 메뉴 안에 있고, 현장관리자 줄의 세로 점은 정보 수정 · 비밀번호 변경 · 삭제 메뉴입니다. 지금 화면과 다른 점은 <b>비어 있는 요일이 주황 대신 빨강</b>인 것 하나입니다(주황을 쓰지 않기로 해서). 토 · 일은 달력 관례대로 빨강입니다.</div>
`

/* ───────── 관리자 ───────── */
const adminTree = [[0, '에스텍시스템', 9], [1, '수도권본부', 5], [2, '서울지사', 2], [2, '경기남부지사', 3, 1], [2, '경기북부지사', 1], [1, '영남본부', 3], [2, '부산지사', 2], [2, '대구지사', 1]]
const admins = [
  ['이지사', 0, '010-3456-7890', '경기남부지사'],
  ['최경기', 0, '010-4567-8901', '경기남부지사 외 1개'],
  ['한수도', 0, '010-5678-9012', '경기남부지사 외 2개'],
]
const adminsPage = `${css}
  <div class="head"><div><h1>관리자</h1><p>경기남부지사 담당 관리자 3명</p></div></div>
  <div class="split">${tree('관리자', adminTree, '명')}
    <div class="main">
      <div class="toolbar">
        <div class="input" style="width:260px">${icons.search}이름 검색</div>
        <span class="btn">${i.shield}권한 · 전체 ${icons.down}</span>
        <span class="sp"></span>
        <span class="btn dark">${i.plus}관리자 추가</span>
      </div>
      <table class="list">
        <thead><tr><th>이름</th><th>권한</th><th>연락처</th><th>담당 그룹</th><th></th></tr></thead>
        <tbody>${admins.map(([nm, master, tel, grp], n) => `<tr${n === 1 ? ' class="hover"' : ''}><td class="main">${nm}</td><td><span class="role${master ? ' mgr' : ''}">${master ? '마스터' : '매니저'}</span></td><td class="num">${tel}</td><td>${grp}</td><td></td></tr>`).join('')}</tbody>
      </table>
      <div class="total num">총 <b>3</b>명</div>
    </div>
  </div>
  <div class="note"><b>목업 메모</b> — 이름 · 연락처는 모두 예시입니다. 구성 · 문구는 지금 화면 그대로입니다(왼쪽 관리그룹 · 이름 검색 · 권한 필터 · 관리자 추가 · 표 4칸). 줄을 누르면 관리자 정보 창이 뜹니다(상세 화면이 따로 없어 꺾쇠가 없습니다). 지사를 고르면 그 지사에 할당된 매니저만 보이고, 회사를 고르면 마스터까지 전원이 보입니다. 두 번째 줄은 마우스를 올린 모습입니다.</div>
`

/* ───────── 안내 화면 — 틀 없이 화면 가운데 ───────── */
const notice = (icon, title, desc) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title} — 목업</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100vh; display: grid; place-items: center; background: #f1f5f9; font-family: 'Noto Sans KR', sans-serif; font-size: 13px; color: #0f172a; word-break: keep-all; }
  .box { display: flex; flex-direction: column; align-items: center; text-align: center; }
  .ico { width: 56px; height: 56px; display: grid; place-items: center; border: 1px solid #e2e8f0; border-radius: 14px; background: #fff; color: #334155; margin-bottom: 18px; box-shadow: 0 1px 2px rgb(15 23 42 / .06), 0 4px 10px rgb(15 23 42 / .06); }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 6px; }
  p { color: #64748b; margin-bottom: 20px; }
  .btn { display: inline-flex; align-items: center; height: 36px; padding: 0 16px; border-radius: 7px; background: #2563eb; color: #fff; font-weight: 500; }
</style></head><body><div class="box"><div class="ico">${icon}</div><h1>${title}</h1><p>${desc}</p><span class="btn">홈으로 이동</span></div></body></html>`

/* ───────── 관리그룹 편집 창 ───────── */
const trash = ic('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>')
const pencil = ic('<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>')
const xI = ic('<path d="M18 6 6 18M6 6l12 12"/>')
const br = (nm, n, menu) => `<div class="br" style="position:relative"><u></u><b>${nm}</b><small>지사</small><span class="cnt num">사업장 ${n}개</span><span class="m${menu ? ' open' : ''}">${vdots}</span>${menu ? `<div class="pop"><a>${pencil}이름 변경</a><hr><a class="red">${trash}삭제</a></div>` : ''}</div>`
const hq = (nm, rows) => `<div class="hq"><div class="hh">${bld}<b>${nm}</b><small>본부</small><span class="m">${vdots}</span></div>${rows.length ? rows.join('') : '<div class="none">지사가 없습니다</div>'}<div class="hf"><span class="lk">${plusS}지사 추가</span></div></div>`
const groupModal = `
  <div class="dim"><div class="modal grp">
    <div class="mh"><div><h2>관리그룹 편집</h2><p>그룹은 회사 › 본부 › 지사 3단계까지 만들 수 있습니다.</p></div><span class="close">${xI}</span></div>
    <div class="ge">
      <div class="co"><b>에스텍시스템</b><small>회사</small><span class="lk">${plusS}본부 추가</span></div>
      ${hq('수도권본부', [br('서울지사', 4), br('경기남부지사', 6, 1), br('경기북부지사', 3)])}
      ${hq('영남본부', [br('부산지사', 5), br('대구지사', 2)])}
      ${hq('호남본부', [])}
    </div>
  </div></div>`

const out = {
  'b-modal-group.html': adminShell('사업장', '사업장', sitesPage.replace('<div class="note">', groupModal + '<div class="note">')),
  'b-sites.html': adminShell('사업장', '사업장', sitesPage),
  'b-site-detail.html': adminShell('사업장', crumb('사업장', '사업장 상세'), siteDetail),
  'b-admins.html': adminShell('관리자', '관리자', adminsPage),
  'c-403.html': notice(shieldOff, '접근 권한이 없습니다', '이 페이지를 볼 수 있는 권한이 없습니다. 본인 영역으로 돌아가 작업을 이어가세요.'),
  'c-404.html': notice(compass, '페이지를 찾을 수 없습니다', '주소가 잘못되었거나 페이지가 이동했을 수 있습니다.'),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join(', '))
