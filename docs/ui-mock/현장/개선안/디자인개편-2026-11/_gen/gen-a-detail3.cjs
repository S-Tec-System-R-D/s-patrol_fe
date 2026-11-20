// A 컨셉 — 근무자 상세 · 공지사항 상세.
// 구성 · 문구는 지금 구현(UserDetailPage · NoticeDetailPage 와 detail 구성 요소)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell } = require('./gen-a.cjs')

const ic = (d, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const dots = ic('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>')
const pen = ic('<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/>')
const trash = ic('<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>')
const pushpin = ic('<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>', 16)
const img = ic('<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', 20)
const file = ic('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>', 16)
const down = ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>')
const bubble = ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')
const clock = ic('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>', 12)
const crumb = (parent, name) => `</b>${parent}<span style="margin:0 2px">›</span><b>${name}`

const extra = `<style>
  .head .titleline { display: flex; align-items: center; gap: 10px; }
  .head .titleline .meta { color: var(--muted); }
  .head .right .btn svg { color: var(--muted); }
  .head .right .btn.icon { width: 30px; padding: 0; justify-content: center; }
  /* 왼쪽이 좁은 정보 단, 오른쪽이 본문 */
  .cols2 { display: grid; grid-template-columns: 400px minmax(0, 1fr); }
  .cols2 > .info { padding-right: 28px; border-right: 1px solid var(--line); }
  .cols2 > .body { padding-left: 32px; min-width: 0; }
  .kvr { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .kvr:last-child { border-bottom: 0; }
  .kvr dt { width: 88px; flex: none; color: var(--muted); }
  .kvr dd { color: var(--fg); min-width: 0; }
  .asg { padding: 11px 0; border-bottom: 1px solid var(--line); }
  .asg:last-child { border-bottom: 0; }
  .asg .l1 { display: flex; align-items: center; gap: 8px; }
  .asg .l1 b { font-weight: 500; }
  .asg .l1 .st { margin-left: auto; }
  .asg .l2 { margin-top: 2px; font-size: 12px; color: var(--muted); }
  .days { display: flex; align-items: flex-end; gap: 8px; height: 84px; }
  .days .d { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; height: 100%; }
  .days i { display: block; border-radius: 2px; background: var(--accent); opacity: .35; }
  .days i.m { background: var(--muted); opacity: .45; }
  .days .sel i { opacity: 1; } .days .sel i.m { opacity: .6; }
  .daysx { display: flex; gap: 8px; margin: 6px 0 8px; font-size: 11px; color: var(--muted); }
  .daysx span { flex: 1; text-align: center; }
  .daysx span.sel { color: var(--fg); font-weight: 500; }
  .lgd { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; font-size: 11px; color: var(--muted); }
  .lgd i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; background: var(--accent); }
  .lgd i.m { background: var(--muted); opacity: .6; }
  .lgd .hint { margin-left: auto; font-size: 12px; }
  .grp { display: flex; align-items: center; gap: 8px; height: 32px; font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--line); }
  .grp .today { color: var(--accent); font-weight: 500; }
  table + .grp { margin-top: 14px; }
  .late { display: inline-flex; align-items: center; gap: 4px; font-weight: 500; color: var(--red); }
  .memoi { display: inline-flex; margin-left: 10px; color: var(--sub); vertical-align: middle; }
  .cert { display: flex; align-items: center; gap: 8px; }
  .cert i { display: block; width: 56px; height: 4px; border-radius: 2px; background: var(--tint-strong); overflow: hidden; }
  .cert i u { display: block; height: 100%; border-radius: 2px; background: var(--accent); }

  /* 공지 본문 */
  .doc { max-width: 880px; }
  .doc .text { padding: 20px 0 24px; border-top: 1px solid var(--line); font-size: 14px; line-height: 1.8; color: var(--fg); }
  .doc .text p + p { margin-top: 12px; }
  .imgs { display: flex; gap: 10px; }
  .imgs i { width: 200px; height: 140px; border-radius: 8px; background: var(--tint-strong); display: grid; place-items: center; color: var(--muted); }
  .frow { display: flex; align-items: center; gap: 10px; height: 44px; border-bottom: 1px solid var(--line); color: var(--fg); }
  .frow:first-of-type { border-top: 1px solid var(--line); }
  .frow svg:first-child { color: var(--muted); }
  .frow small { font-size: 12px; color: var(--muted); }
  .frow .dl { margin-left: auto; color: var(--sub); }
  .pin1 { color: var(--accent); display: inline-flex; }
</style>`

/* ───────── 근무자 상세 ───────── */
const days = [[4, 0], [3, 0], [4, 1], [4, 0], [3, 0], [0, 0], [0, 0], [4, 0], [4, 0], [3, 1], [4, 0], [4, 0], [3, 0], [2, 0]]
const run = (course, time, el, over, c, t, st, memo) =>
  `<tr><td class="main" style="width:200px">${course}</td><td class="num" style="width:150px">${time}</td><td class="num" style="width:130px">${over ? `<span class="late">${clock}${el}</span>` : el}</td><td><span class="cert"><i><u style="width:${Math.round((c / t) * 100)}%"></u></i><span class="num">${c}/${t}</span></span></td><td class="r">${st}${memo ? `<span class="memoi" title="특이사항 있음">${bubble}</span>` : ''}</td></tr>`
const done = '<span class="st green">완료</span>'

const userDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>정순찰</h1><span class="st green on">근무 중</span><span class="meta">판교 테크노밸리 A동</span></div></div>
    <div class="right"><span class="btn fill sq">${dots}</span></div>
  </div>

  <div class="cols2">
    <div class="info">
      <div class="block">
        <div class="sec"><h2>기본정보</h2></div>
        <dl>
          <div class="kvr"><dt>사번</dt><dd class="num">20231104</dd></div>
          <div class="kvr"><dt>권한</dt><dd>현장 근무자</dd></div>
          <div class="kvr"><dt>연락처</dt><dd class="num">010-1234-5678</dd></div>
          <div class="kvr"><dt>소속 사업장</dt><dd>판교 테크노밸리 A동</dd></div>
        </dl>
      </div>
      <div class="block">
        <div class="sec"><h2>배치 이력</h2><span class="cnt">전체 사업장 배치 기록</span></div>
        <div class="asg"><div class="l1"><b>강남 센터</b><span class="st">배치예정</span></div><div class="l2 num">2026-12-01 ~ 2026-12-14 · 12일 후 시작</div></div>
        <div class="asg"><div class="l1"><b>분당 물류</b><span class="st green">배치중</span></div><div class="l2 num">2026-11-10 ~ 2026-11-24 · 9일째 · 6일 남음</div></div>
        <div class="asg"><div class="l1"><b>수원 지사</b><span class="st">복귀</span></div><div class="l2 num">2026-09-01 ~ 2026-09-30 · 30일</div></div>
      </div>
    </div>

    <div class="body">
      <div class="block">
        <div class="sec"><h2>순찰 기록</h2><span class="cnt">최근 14일</span><span class="more">전체 기록 →</span></div>
        <div class="inl"><span class="mini">순찰<b class="num">46</b>회</span><span class="mini">미완료<b class="num">2</b>회</span><span class="mini">시간초과<b class="num">3</b>회</span><span class="mini">지점 인증<b class="num">97%</b>312/322</span></div>
        <div class="days">${days.map(([o, m], n) => `<div class="d${n === days.length - 1 ? ' sel' : ''}">${m ? `<i class="m" style="height:${m * 17}px"></i>` : ''}<i style="height:${o * 17}px"></i></div>`).join('')}</div>
        <div class="daysx num">${days.map((_, n) => `<span${n === days.length - 1 ? ' class="sel"' : ''}>${n === days.length - 1 ? '오늘' : `${5 + n}일`}</span>`).join('')}</div>
        <div class="lgd"><span><i></i>완료</span><span><i class="m"></i>미완료</span><span class="hint">최근 14일 전체 · 막대를 누르면 해당 일자만 표시</span></div>

        <div class="grp num">11월 18일 (수)<span class="today">오늘</span></div>
        <table><tbody>
          ${run('본관 외곽', '14:02 ~', '30분', 0, 4, 8, '<span class="st blue">진행중</span>', 0)}
          ${run('지하주차장 B2', '09:40 ~ 09:59', '19분', 0, 3, 7, '<span class="st">미완료</span>', 1)}
        </tbody></table>
        <div class="grp num">11월 17일 (화)</div>
        <table><tbody>
          ${run('본관 외곽', '18:00 ~ 18:19', '19분', 0, 3, 8, '<span class="st">미완료</span>', 0)}
          ${run('옥상 · 설비층', '16:12 ~ 16:40', '28분', 0, 5, 5, done, 0)}
          ${run('지하주차장 B2', '09:35 ~ 10:11', '36분', 0, 7, 7, done, 0)}
        </tbody></table>
        <div class="grp num">11월 16일 (월)</div>
        <table><tbody>
          ${run('본관 외곽', '22:01 ~ 23:04', '1시간 3분', 1, 8, 8, done, 1)}
          ${run('옥상 · 설비층', '15:30 ~ 15:58', '28분', 0, 5, 5, done, 0)}
        </tbody></table>
      </div>
    </div>
  </div>

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시입니다. 구성 · 문구는 지금 화면 그대로입니다(왼쪽 기본정보 · 배치 이력 / 오른쪽 순찰 기록 14일). 수정 · 비밀번호 변경 · 삭제는 오른쪽 위 <b>⋯</b> 메뉴 안에 있습니다.</div>
`

/* ───────── 공지사항 상세 ───────── */
const noticeDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>동절기 순찰 시 방한 장비 착용 안내</h1><span class="pin1" title="고정 공지">${pushpin}</span></div><p class="num">본사 관리자 · 2026-11-17 09:12</p></div>
    <div class="right"><span class="btn fill">${pen}수정</span><span class="btn fill red">${trash}삭제</span></div>
  </div>

  <div class="doc">
    <div class="text">
      <p>12월 1일부터 야간 순찰(22시 ~ 06시) 시에는 지급된 방한 장비를 반드시 착용해 주시기 바랍니다.</p>
      <p>옥상 · 설비층과 지하주차장 램프 구간은 결빙이 잦으므로 이동 시 각별히 주의하고, 결빙 구간을 발견하면 순찰 기록의 특이사항에 사진과 함께 남겨 주세요.</p>
      <p>장비가 부족하거나 파손된 경우 현장관리자에게 알려 주시면 교체해 드립니다.</p>
    </div>

    <div class="block">
      <div class="sec"><h2>이미지 2</h2></div>
      <div class="imgs"><i>${img}</i><i>${img}</i></div>
    </div>
    <div class="block">
      <div class="sec"><h2>첨부파일 1</h2></div>
      <div class="frow">${file}<span>동절기_안전수칙.pdf</span><span class="dl">${down}</span></div>
    </div>
  </div>

  <div class="note"><b>목업 메모</b> — 내용은 모두 예시입니다. 구성은 지금 화면 그대로입니다(제목 옆 고정 표시 · 작성자와 작성일시 한 줄 → 본문 → 이미지 → 첨부파일). 본문은 읽기 편하도록 폭을 880px 로 제한했습니다.</div>
`

const out = {
  'a-user-detail.html': shell('근무자', crumb('근무자', '근무자 상세'), '', userDetail),
  'a-notice-detail.html': shell('공지사항', crumb('공지사항', '공지 상세'), '', noticeDetail),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
