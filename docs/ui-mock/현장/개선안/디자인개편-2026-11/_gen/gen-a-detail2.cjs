// A 컨셉 — 순찰이력 상세 두 화면: 코스 순찰 상세 · 지점 인증 상세.
// 구성 · 문구는 지금 구현(PatrolZoneDetailPage · PatrolPointDetailPage 와 detail 구성 요소)을 따른다.
const fs = require('fs')
const path = require('path')
const { shell, icons } = require('./gen-a.cjs')

const ic = (d, s = 14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const pin = ic('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>')
const swap = ic('<path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4"/>', 12)
const bubble = ic('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>')
const up = ic('<path d="m18 15-6-6-6 6"/>')
const img = ic('<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>', 18)
const check = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
const crumb = (parent, name) => `</b>${parent}<span style="margin:0 2px">›</span><b>${name}`

const extra = `<style>
  .head .titleline { display: flex; align-items: center; gap: 10px; }
  .head .right .btn svg { color: var(--muted); }
  /* 요약 줄 — 상자 없이 위아래 선 사이에 네 칸 */
  .sum4 { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 28px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .sum4 > div { padding: 12px 24px; border-left: 1px solid var(--line); }
  .sum4 > div:first-child { padding-left: 0; border-left: 0; }
  .sum4 small { display: block; font-size: 12px; color: var(--muted); }
  .sum4 b { font-size: 16px; font-weight: 600; }
  .sum4 span { margin-left: 8px; font-size: 12px; color: var(--muted); }
  .sum4 b.warn, .sum4 span.warn { color: var(--red); }
  .cols { grid-template-columns: minmax(0, 1fr) 440px; }

  /* 수행 타임라인 */
  .tl { position: relative; }
  .tr { position: relative; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; column-gap: 14px; align-items: center; min-height: 44px; }
  .tr::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: var(--line-strong); }
  .tr.first::before { top: 50%; } .tr.last::before { bottom: 50%; }
  .tr .d { position: relative; z-index: 1; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--green); color: #fff; font-size: 11px; font-weight: 700; }
  .tr.miss .d { background: #fff; border: 2px solid var(--muted); color: var(--muted); }
  .tr.edge .d { width: 12px; height: 12px; margin: 0 6px; background: #fff; border: 2px solid var(--fg); }
  .tr .nm { color: var(--fg); font-weight: 500; }
  .tr.edge .nm { font-weight: 600; }
  .tr .nm small { margin-left: 8px; font-size: 12px; font-weight: 400; color: var(--muted); }
  .tr .end { display: flex; align-items: center; gap: 16px; color: var(--sub); }
  .tr .end .tog { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--sub); }
  .tr .end .t { width: 44px; text-align: right; color: var(--fg); }
  .tr .end .stw { width: 64px; }
  .tr.sel { background: var(--tint); border-radius: 8px; box-shadow: 0 0 0 6px var(--tint); }
  .mv { position: relative; display: flex; align-items: center; gap: 6px; height: 24px; padding-left: 38px; font-size: 11px; color: var(--muted); }
  .mv::before { content: ''; position: absolute; left: 11px; top: 0; bottom: 0; width: 2px; background: var(--line-strong); }
  .mv.ho { color: var(--accent); font-weight: 500; }
  .memo { position: relative; margin: 0 0 12px; padding-left: 38px; }
  .memo::before { content: ''; position: absolute; left: 11px; top: 0; bottom: -12px; width: 2px; background: var(--line-strong); }
  .memo .in { padding: 12px 14px; border: 1px solid var(--line-strong); border-radius: 8px; background: #fff; color: var(--fg); line-height: 1.6; }
  .memo .who { display: block; margin-bottom: 4px; font-size: 12px; color: var(--muted); }
  .photos { display: flex; gap: 8px; margin-top: 10px; }
  .photos i { width: 72px; height: 72px; border-radius: 6px; background: var(--tint-strong); display: grid; place-items: center; color: var(--muted); }
  .photos.lg i { width: 132px; height: 132px; border-radius: 8px; }

  .map { height: 260px; border: 1px solid var(--line-strong); border-radius: 10px; overflow: hidden; background: var(--tint); }
  .map svg { display: block; width: 100%; height: 100%; }
  .lgd { display: flex; gap: 14px; margin-top: 8px; font-size: 11px; color: var(--muted); }
  .lgd i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; background: var(--green); }
  .lgd i.m { background: var(--muted); }
  .seg { display: grid; grid-template-columns: 72px 1fr auto; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); color: var(--sub); }
  .seg:last-child { border-bottom: 0; }
  .seg b { color: var(--fg); font-weight: 500; }
  .seg span:last-child { font-size: 12px; color: var(--muted); }
  .kvr { display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .kvr:last-child { border-bottom: 0; }
  .kvr dt { width: 88px; flex: none; color: var(--muted); }
  .kvr dd { color: var(--fg); min-width: 0; }
  .kvr dd a { color: var(--accent); }
  .rec { padding: 16px 0; border-bottom: 1px solid var(--line); line-height: 1.7; color: var(--fg); }
  .rec .who { display: block; margin-bottom: 4px; font-size: 12px; color: var(--muted); }
</style>`

/** 자리 표시용 지도 — pins: [x, y, 상태(ok|miss)] */
const map = (pins, numbered) => `
<div class="map"><svg viewBox="0 0 440 260" preserveAspectRatio="xMidYMid slice">
  <rect width="440" height="260" fill="#eef1f5"/>
  <path d="M0 84H440M0 180H440M96 0V260M228 0V260M352 0V260" stroke="#fff" stroke-width="9"/>
  <rect x="112" y="100" width="100" height="62" rx="4" fill="#e2e8f0"/><rect x="246" y="20" width="90" height="46" rx="4" fill="#e2e8f0"/><rect x="246" y="198" width="90" height="44" rx="4" fill="#e2e8f0"/>
  ${numbered ? `<polyline points="${pins.map((p) => p.slice(0, 2).join(',')).join(' ')}" fill="none" stroke="#2563eb" stroke-width="2" stroke-linejoin="round" opacity=".55"/>` : ''}
  ${pins
    .map(([x, y, st], n) =>
      numbered
        ? `<circle cx="${x}" cy="${y}" r="10" fill="${st === 'miss' ? '#64748b' : '#16a34a'}" stroke="#fff" stroke-width="2.5"/><text x="${x}" y="${y + 3.5}" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${n + 1}</text>`
        : `<circle cx="${x}" cy="${y}" r="18" fill="#16a34a" opacity=".18"/><circle cx="${x}" cy="${y}" r="8" fill="#16a34a" stroke="#fff" stroke-width="3"/>`
    )
    .join('')}
</svg></div>`

/* ───────── 코스 순찰 상세 ───────── */
const ok = '<span class="st green">인증</span>'
const step = (n, nm, t, opt = {}) => `
          <div class="tr${opt.miss ? ' miss' : ''}${opt.sel ? ' sel' : ''}"><span class="d num">${n}</span><span class="nm">${nm}${opt.who ? `<small>${opt.who}</small>` : ''}</span><span class="end">${opt.memo ? `<span class="tog">${bubble}특이사항 ${opt.open ? up : icons.down}</span>` : ''}<span class="t num">${t}</span><span class="stw">${opt.miss ? '<span class="st">미인증</span>' : ok}</span></span></div>`
const mv = (t) => `<div class="mv num">${t}</div>`

const runDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>본관 외곽</h1><span class="st green">완료</span><span class="st red">시간초과</span></div><p>한야간 · 교대 1</p></div>
    <div class="right"><span class="btn fill">${icons.route}코스 상세</span></div>
  </div>

  <div class="sum4" aria-label="순찰 요약">
    <div><small>시작</small><b class="num">06:01</b><span class="num">2026-11-18 (수)</span></div>
    <div><small>종료</small><b class="num">07:02</b><span class="num">2026-11-18 (수)</span></div>
    <div><small>소요시간</small><b class="num warn">1시간 1분</b><span class="num">기준 50분</span></div>
    <div><small>특이사항</small><b class="num">1건</b></div>
  </div>

  <div class="cols">
    <div class="mainc">
      <div class="block">
        <div class="sec"><h2>수행 타임라인</h2><span class="cnt num">7 / 8 인증</span></div>
        <div class="tl">
          <div class="tr edge first"><span class="d"></span><span class="nm">순찰 시작<small>한야간</small></span><span class="end"><span class="t num">06:01</span><span class="stw"></span></span></div>
          ${mv('3분 이동')}${step(1, '정문 초소', '06:04')}
          ${mv('6분 이동')}${step(2, '본관 로비', '06:10')}
          ${mv('9분 이동')}${step(3, '동측 주차장', '06:19', { memo: true, open: true })}
          <div class="memo"><div class="in"><span class="who num">한야간 · 06:20</span>주차장 3번 기둥 옆 조명이 꺼져 있음. 시설팀 확인 필요.<div class="photos"><i>${img}</i><i>${img}</i></div></div></div>
          ${mv('8분 이동')}${step(4, '자재 창고', '06:27')}
          <div class="mv ho">${swap}4번 지점 후 교대 · 한야간 → 오주간</div>
          ${step(5, '후문 초소', '-', { miss: true })}
          ${mv('17분 이동 · 4번 지점에서')}${step(6, '서측 담장', '06:44', { who: '오주간' })}
          ${mv('8분 이동')}${step(7, '기계실 앞', '06:52', { who: '오주간', sel: true })}
          ${mv('9분 이동')}${step(8, '정문 복귀', '07:01', { who: '오주간' })}
          ${mv('1분')}
          <div class="tr edge last"><span class="d"></span><span class="nm">순찰 종료</span><span class="end"><span class="t num">07:02</span><span class="stw"></span></span></div>
        </div>
      </div>
    </div>

    <div class="side">
      <div class="block">
        <div class="sec"><h2>코스 경로</h2><span class="cnt">행 · 핀을 누르면 서로 표시</span></div>
        ${map([[70, 130, 'ok'], [130, 60, 'ok'], [228, 70, 'ok'], [330, 50, 'ok'], [390, 130, 'miss'], [340, 215, 'ok'], [228, 196, 'ok'], [130, 200, 'ok']], true)}
        <div class="lgd"><span><i></i>인증</span><span><i class="m"></i>미인증</span></div>
      </div>
      <div class="block">
        <div class="sec"><h2>교대 이력</h2></div>
        <div class="seg"><b>한야간</b><span class="num">1 ~ 4번 지점</span><span>4번 지점 후 교대</span></div>
        <div class="seg"><b>오주간</b><span class="num">5 ~ 8번 지점</span><span></span></div>
      </div>
    </div>
  </div>

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시이고 지도는 자리 표시용 그림입니다. 구성 · 문구는 지금 화면 그대로입니다(요약 네 칸 → 왼쪽 수행 타임라인 / 오른쪽 코스 경로 · 교대 이력). 3번 지점은 특이사항을 펼친 모습(줄은 그대로, 내용만 얇은 테두리 상자), 7번 지점은 눌러서 지도와 서로 표시한 모습(옅은 바탕)입니다.</div>
`

/* ───────── 지점 인증 상세 ───────── */
const checkDetail = `${extra}
  <div class="head">
    <div><div class="titleline"><h1>동측 주차장</h1><span class="st green">인증</span><span class="st amber">특이사항</span></div><p class="num">한야간 · 2026-11-18 (수) 06:19 · NFC</p></div>
    <div class="right"><span class="btn fill">${pin}지점 상세</span></div>
  </div>

  <div class="cols">
    <div class="mainc">
      <div class="block">
        <div class="sec"><h2>순찰 기록</h2><span class="cnt num">메모 2건 · 사진 2장</span></div>
        <div class="rec" style="border-top:1px solid var(--line)"><span class="who num">한야간 · 06:20</span>주차장 3번 기둥 옆 조명이 꺼져 있음. 시설팀 확인 필요.<div class="photos lg"><i>${img}</i><i>${img}</i></div></div>
        <div class="rec"><span class="who num">한야간 · 06:22</span>출차 차량 1대 대기 중이라 순찰 지연.</div>
      </div>
    </div>

    <div class="side">
      <div class="block">
        <div class="sec"><h2>인증 정보</h2></div>
        <dl>
          <div class="kvr"><dt>순찰코스</dt><dd><a>본관 외곽 →</a></dd></div>
          <div class="kvr"><dt>순찰자</dt><dd>한야간</dd></div>
          <div class="kvr"><dt>인증시각</dt><dd class="num">2026-11-18 (수) 06:19:42</dd></div>
          <div class="kvr"><dt>인증수단</dt><dd>NFC</dd></div>
        </dl>
      </div>
      <div class="block">
        <div class="sec"><h2>인증 위치</h2><span class="cnt num">37.40231, 127.10874</span></div>
        ${map([[228, 130, 'ok']], false)}
      </div>
    </div>
  </div>

  <div class="note"><b>목업 메모</b> — 숫자 · 이름은 모두 예시이고 지도는 자리 표시용 그림입니다. 구성 · 문구는 지금 화면 그대로입니다(왼쪽 순찰 기록 / 오른쪽 인증 정보 · 인증 위치). 메모가 없는 인증은 지금 화면처럼 왼쪽에 지도가 옵니다 — 그 경우는 그리지 않았습니다.</div>
`

const out = {
  'a-run-detail.html': shell('순찰이력', crumb('순찰이력', '순찰 상세'), '', runDetail),
  'a-check-detail.html': shell('순찰이력', crumb('순찰이력', '지점 인증 상세'), '', checkDetail),
}
for (const [name, html] of Object.entries(out)) fs.writeFileSync(path.join(__dirname, name), html)
console.log(Object.keys(out).join('\n'))
