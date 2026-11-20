// A 컨셉 · Slate + Blue — 코스 상세 · 지점 상세. 틀(shell)과 아이콘은 gen-a.cjs 것을 쓴다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')
const charts = require('./charts.cjs')

const extra = `<style>
  .head h1 + .st { margin-left: 2px; }
  .head .titleline { display: flex; align-items: center; gap: 10px; }
  .head .titleline span.meta { color: var(--muted); }
  .map { height: 220px; border: 1px solid var(--line-strong); border-radius: 10px; overflow: hidden; background: var(--tint); margin-bottom: 18px; }
  .map.small { height: 170px; margin-bottom: 0; }
  .map svg { display: block; width: 100%; height: 100%; }
  .pt.num .dot { background: var(--accent-soft); color: var(--accent); border: 1px solid #bfd3fb; font-size: 10px; font-weight: 700; }
  .pt.num .nm { color: var(--fg); }
  .kvr { display: flex; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--line); }
  .kvr:last-child { border-bottom: 0; }
  .kvr dt { width: 88px; flex: none; color: var(--muted); }
  .kvr dd { color: var(--fg); min-width: 0; }
  .mono { font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
  .hb { display: grid; grid-template-columns: 56px 1fr 34px; align-items: center; gap: 10px; padding: 7px 0; color: var(--sub); }
  .hb i { display: block; height: 3px; border-radius: 2px; background: var(--tint-strong); overflow: hidden; }
  .hb i u { display: block; height: 100%; border-radius: 2px; background: var(--accent); }
  .hb span:last-child { text-align: right; color: var(--muted); font-size: 12px; }
  .days { display: flex; align-items: flex-end; gap: 8px; height: 72px; }
  .days .d { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; height: 100%; }
  .days i { display: block; border-radius: 2px; background: var(--accent); opacity: .35; }
  .days i.m { background: var(--muted); opacity: .45; }
  .days .sel i { opacity: 1; }
  .days .sel i.m { opacity: .6; }
  .daysx { display: flex; gap: 8px; margin: 6px 0 20px; font-size: 11px; color: var(--muted); }
  .daysx span { flex: 1; text-align: center; }
  .daysx span.sel { color: var(--fg); font-weight: 500; }
  .grp { height: 30px; display: flex; align-items: center; font-size: 12px; color: var(--muted); border-bottom: 1px solid var(--line); }
  .grp + table td { height: 46px; }
  table + .grp { margin-top: 14px; }
</style>`

const dots = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>'
const pen = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>'
const crumb = (parent, name) => `</b>${parent}<span style="margin:0 2px">›</span><b>${name}`

/** 자리 표시용 지도 — pins 가 여럿이면 경로를 잇고 번호를 적는다 */
const map = (pins, small) => `
<div class="map${small ? ' small' : ''}"><svg viewBox="0 0 900 220" preserveAspectRatio="xMidYMid slice">
  <rect width="900" height="220" fill="#eef1f5"/>
  <path d="M0 72H900M0 150H900M170 0V220M430 0V220M690 0V220" stroke="#fff" stroke-width="10"/>
  <rect x="200" y="88" width="200" height="46" rx="4" fill="#e2e8f0"/><rect x="460" y="18" width="200" height="38" rx="4" fill="#e2e8f0"/>
  <rect x="460" y="166" width="200" height="40" rx="4" fill="#e2e8f0"/><rect x="24" y="166" width="120" height="40" rx="4" fill="#dcfce7"/>
  ${pins.length > 1 ? `<polyline points="${pins.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>` : ''}
  ${pins
    .map(([x, y], i) =>
      pins.length > 1
        ? `<circle cx="${x}" cy="${y}" r="10" fill="#2563eb" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${i + 1}</text>`
        : `<circle cx="${x}" cy="${y}" r="18" fill="#2563eb" opacity=".18"/><circle cx="${x}" cy="${y}" r="8" fill="#2563eb" stroke="#fff" stroke-width="3"/>`
    )
    .join('')}
</svg></div>`

/* ───────── 코스 상세 ───────── */
const route = [['정문 초소', '-'], ['본관 로비', '5분'], ['동측 주차장', '7분'], ['자재 창고', '6분'], ['후문 초소', '8분'], ['서측 담장', '9분'], ['기계실 앞', '7분'], ['정문 복귀', '8분']]
const hours = [2, 1, 4, 1, 6, 3, 1, 5, 2, 7, 2, 4]
const runs = [
  ['11-18 14:02', '정순찰', '4 / 8', '30분', '<span class="st blue">진행 중</span>'],
  ['11-18 10:24', '오주간', '8 / 8', '46분', '<span class="st green">완료</span>'],
  ['11-18 06:01', '한야간', '8 / 8', '<span class="over">61분</span>', '<span class="st green">완료</span><span class="st red">시간초과</span>'],
  ['11-17 22:03', '한야간', '7 / 8', '44분', '<span class="st green">완료</span>'],
  ['11-17 18:00', '정순찰', '3 / 8', '19분', '<span class="st">미완료</span>'],
  ['11-17 14:05', '오주간', '8 / 8', '48분', '<span class="st green">완료</span>'],
]

const courseDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>본관 외곽</h1><span class="st green">사용</span><span class="meta num">지점 8개 · 기준 50분</span></div></div>
    <div class="right"><span class="btn fill sq">${dots}</span></div>
  </div>

  <div class="kpis c3">
    <div class="k"><div class="t"><div class="kt">마지막 순찰</div><b class="num">14:02</b><span class="u now">진행 중 · 정순찰</span></div><div class="aside"><div class="kbar"><i style="width:50%"></i></div><div class="cap2 num"><span>지점 4 / 8</span><span>30분</span></div></div></div>
    <div class="k"><div class="t"><div class="kt">평균 소요시간</div><b class="num">46분</b><span class="u num">시간초과 2/14</span></div><div class="aside">${charts.slot('rc-runs')}</div></div>
    <div class="k"><div class="t"><div class="kt">지점 인증률</div><b class="num">97%</b><span class="u num">109/112</span></div><div class="aside">${charts.slot('rc-rates')}</div></div>
  </div>

  <div class="cols">
    <div class="mainc">
      <div class="block">
        <div class="sec"><h2>순찰 경로</h2><span class="cnt num">8</span><span class="more">${pen} 편성 편집</span></div>
        ${map([[150, 110], [230, 56], [430, 60], [640, 40], [760, 110], [680, 180], [430, 166], [230, 166]])}
        <div class="track" style="grid-template-columns: repeat(${route.length}, minmax(0, 1fr))">${route
          .map(([nm, t], i) => `<div class="pt num"><span class="dot num">${i + 1}</span><span class="nm">${nm}</span><span class="at num">${t}</span></div>`)
          .join('')}</div>
      </div>

      <div class="block">
        <div class="sec"><h2>최근 순찰 기록</h2><span class="cnt num">14</span><span class="more">순찰이력 전체 →</span></div>
        <table>
          <thead><tr><th>시작</th><th>근무자</th><th>인증</th><th>소요</th><th>상태</th></tr></thead>
          <tbody>${runs.map(([a, b, c, d, e]) => `<tr><td class="main num">${a}</td><td>${b}</td><td class="num">${c}</td><td class="num">${d}</td><td>${e}</td></tr>`).join('')}</tbody>
        </table>
      </div>
    </div>

    <div class="side">
      <div class="block">
        <div class="sec"><h2>기본정보</h2><span class="more">${pen} 수정</span></div>
        <dl>
          <div class="kvr"><dt>사업장</dt><dd>판교 테크노밸리 A동</dd></div>
          <div class="kvr"><dt>설명</dt><dd>건물 외곽과 출입구를 한 바퀴 도는 기본 코스</dd></div>
          <div class="kvr"><dt>기준 소요시간</dt><dd class="num">50분</dd></div>
          <div class="kvr"><dt>교대</dt><dd>허용</dd></div>
          <div class="kvr"><dt>상태</dt><dd>사용</dd></div>
        </dl>
      </div>
      <div class="block">
        <div class="sec"><h2>시간대별 순찰</h2><span class="cnt">시작 시각 기준 · 최근 14회</span></div>
        ${charts.slot('rc-chours')}
      </div>
      <div class="block">
        <div class="sec"><h2>근무자별 순찰</h2><span class="cnt">최근 14회</span></div>
        <div class="hb"><span>한야간</span><i><u style="width:100%"></u></i><span class="num">6회</span></div>
        <div class="hb"><span>정순찰</span><i><u style="width:67%"></u></i><span class="num">4회</span></div>
        <div class="hb"><span>오주간</span><i><u style="width:50%"></u></i><span class="num">3회</span></div>
        <div class="hb"><span>박순찰</span><i><u style="width:17%"></u></i><span class="num">1회</span></div>
      </div>
    </div>
  </div>

  ${charts.use(`chart.mbar('rc-runs', [["11.18 18:00",44],["11.18 22:00",48],["11.19 02:00",46],["11.19 06:00",38],["11.19 08:00",61],["11.19 10:00",45],["11.19 12:00",43]], { over: 50, min: 30 }); chart.marea('rc-rates', [["11.18 18:00",100,"8/8"],["11.18 22:00",100,"8/8"],["11.19 02:00",100,"8/8"],["11.19 06:00",100,"8/8"],["11.19 08:00",88,"7/8"],["11.19 10:00",100,"8/8"],["11.19 12:00",100,"8/8"]], { min: 70 }); chart.vbar('rc-chours', 120, [["0시",2],["2시",1],["4시",4],["6시",1],["8시",6],["10시",3],["12시",1],["14시",5],["16시",2],["18시",7],["20시",2],["22시",4]], { interval: 2 })`)}
  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시이고 지도는 자리 표시용 그림입니다. 지금 화면과 다른 점은 마지막 순찰 칸의 <b>진행 중 표시(순찰자 · 진행 막대 · 지점 4 / 8 · 경과 시간)</b>입니다. 숫자 칸은 지금 화면처럼 낮은 칸에 작은 그림(회차별 소요 막대 · 회차별 인증 선)을 오른쪽에 둡니다.</div>
`

/* ───────── 지점 상세 ───────── */
const days = [[6, 0], [6, 0], [5, 1], [6, 0], [6, 0], [4, 0], [4, 0], [6, 0], [6, 0], [5, 1], [6, 0], [6, 0], [6, 0], [3, 1]]
const rec = (t, who, where, st) => `<tr><td class="main num" style="width:80px">${t}</td><td style="width:120px">${who}</td><td>${where}</td><td class="r">${st}</td></tr>`
const ok = '<span class="st green">인증</span>'

const pointDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>후문 초소</h1><span class="st green">사용</span></div></div>
    <div class="right"><span class="btn fill sq">${dots}</span></div>
  </div>

  <div class="cols">
    <div class="mainc">
      <div class="block">
        <div class="sec"><h2>인증 기록</h2><span class="cnt">최근 14일 · 막대를 누르면 해당 일자만 표시</span><span class="more">지점 순찰이력 전체 →</span></div>
        <div class="inl"><span class="mini">인증<b class="num">75</b>/ 78회</span><span class="mini">미인증<b class="num">3</b>회</span><span class="mini">최근 순찰<b class="num">28분 전</b>정순찰</span></div>
        <div class="days">${days
          .map(([o, m], i) => `<div class="d${i === days.length - 1 ? ' sel' : ''}">${m ? `<i class="m" style="height:${m * 11}px"></i>` : ''}<i style="height:${o * 11}px"></i></div>`)
          .join('')}</div>
        <div class="daysx num">${days.map((_, i) => `<span${i === days.length - 1 ? ' class="sel"' : ''}>${i === days.length - 1 ? '오늘' : `${5 + i}일`}</span>`).join('')}</div>

        <div class="grp">오늘 · 11월 18일 (수)</div>
        <table><tbody>
          ${rec('14:21', '정순찰', '본관 외곽', ok)}
          ${rec('10:47', '오주간', '본관 외곽', ok)}
          ${rec('06:30', '한야간', '본관 외곽', '<span class="st amber">특이사항</span>')}
          ${rec('02:12', '한야간', '야간 전체', '<span class="st">미인증</span>')}
        </tbody></table>
        <div class="grp">11월 17일 (화)</div>
        <table><tbody>
          ${rec('22:26', '한야간', '본관 외곽', ok)}
          ${rec('18:19', '정순찰', '본관 외곽', ok)}
          ${rec('14:08', '오주간', '본관 외곽', ok)}
        </tbody></table>
      </div>
    </div>

    <div class="side">
      <div class="block">
        <div class="sec"><h2>위치</h2><span class="cnt num">37.40213, 127.10842</span></div>
        ${map([[450, 110]], true)}
      </div>
      <div class="block">
        <div class="sec"><h2>기본정보</h2><span class="more">${pen} 수정</span></div>
        <dl>
          <div class="kvr"><dt>인증수단</dt><dd>NFC</dd></div>
          <div class="kvr"><dt>소속 코스</dt><dd>본관 외곽 · 야간 전체</dd></div>
          <div class="kvr"><dt>사업장</dt><dd>판교 테크노밸리 A동</dd></div>
          <div class="kvr"><dt>설명</dt><dd>후문 차량 출입구 옆 초소 벽면</dd></div>
          <div class="kvr"><dt>TAG ID</dt><dd><span class="mono">04:A3:1F:7C:92:5E:80</span><span class="tag">복사</span></dd></div>
        </dl>
      </div>
    </div>
  </div>

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시이고 지도는 자리 표시용 그림입니다. 구성은 지금 화면 그대로입니다(인증 · 미인증 · 최근 순찰은 인증 기록 안).</div>
`

const out = {
  'a-course-detail.html': shell('코스/지점', crumb('순찰코스', '본관 외곽'), '', courseDetail),
  'a-point-detail.html': shell('코스/지점', crumb('순찰지점', '후문 초소'), '', pointDetail),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
