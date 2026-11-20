// 로그인 겸 랜딩 — 슬라이드를 없앤다. 오른쪽 패널은 화면 이미지 + 소개 문구(움직임 없음). 효과는 카드 바깥 — 페이지 배경을 감싼 div(.stage)에 옅은 연기가 지나간다.
// 로그인 폼의 칸 · 문구는 지금 구현(LoginLanding · LoginPanel · LandingPage)을 따른다.
// 화면 이미지는 대시보드 목업을 찍은 것(dash-thumb.png — `node shot-thumb.cjs` 로 만든다).
const fs = require('fs')
const path = require('path')
const thumb = fs.readFileSync(path.join(__dirname, 'dash-thumb.png')).toString('base64')

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>로그인 · 랜딩 — 목업</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap" />
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: 'Noto Sans KR', sans-serif; font-size: 13px; color: #0f172a; word-break: keep-all; }
  /* 카드 바깥 배경 — 옅은 연기가 천천히 지나간다 */
  .stage { position: relative; overflow: hidden; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: #f1f5f9; isolation: isolate; }
  .card { position: relative; display: grid; grid-template-columns: 1fr 1fr; width: 1100px; height: 640px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; box-shadow: 0 1px 2px rgb(15 23 42 / .05); }

  .login { display: grid; place-items: center; padding: 0 64px; }
  .login > .form { width: 100%; max-width: 384px; }
  .smoke { position: absolute; inset: -10%; z-index: -1; filter: blur(70px); }
  .smoke i { position: absolute; border-radius: 50%; }
  .smoke i:nth-child(1) { left: -40%; top: 2%; width: 55%; height: 40%; background: rgb(37 99 235 / .22); animation: pass 16s linear infinite; }
  .smoke i:nth-child(2) { left: -45%; top: 38%; width: 60%; height: 36%; background: rgb(100 116 139 / .22); animation: pass 21s linear infinite; animation-delay: -7s; }
  .smoke i:nth-child(3) { left: -40%; top: 66%; width: 50%; height: 34%; background: rgb(56 189 248 / .2); animation: pass 18s linear infinite; animation-delay: -12s; }
  @keyframes pass { 0% { transform: translateX(-20%) scale(1); } 50% { transform: translateX(150%) scale(1.25, .85); } 100% { transform: translateX(320%) scale(1); } }
  @media (prefers-reduced-motion: reduce) { .smoke i { animation: none; transform: translateX(120%); } }
  .login h1 { font-size: 26px; font-weight: 700; letter-spacing: -.01em; }
  .login h1 + p { margin-top: 6px; font-size: 12px; color: #64748b; }
  .f { margin-top: 18px; } .f:first-of-type { margin-top: 28px; }
  .f label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500; color: #334155; }
  .f div { display: flex; align-items: center; height: 40px; padding: 0 12px; border: 1px solid #dde3ea; border-radius: 8px; background: #fff; color: #94a3b8; }
  .submit { display: grid; place-items: center; height: 40px; margin-top: 24px; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 500; }

  /* 오른쪽 — 어두운 패널에 소개 문구와 화면 이미지. 움직이지 않는다 */
  .intro { position: relative; overflow: hidden; padding: 44px 0 0 44px; border-radius: 12px; background: #0f172a; color: #fff; }
  .intro small { font-size: 12px; font-weight: 500; letter-spacing: .08em; color: rgb(255 255 255 / .55); }
  .intro h2 { margin-top: 12px; font-size: 26px; font-weight: 600; line-height: 1.35; letter-spacing: -.02em; }
  .intro p { margin-top: 12px; max-width: 400px; padding-right: 44px; font-size: 14px; line-height: 1.7; color: rgb(255 255 255 / .7); }
  .intro .shot { position: absolute; left: 44px; top: 248px; width: 900px; border: 1px solid rgb(255 255 255 / .14); border-radius: 10px 0 0 0; overflow: hidden; box-shadow: 0 24px 60px rgb(0 0 0 / .45); }
  .intro .shot img { display: block; width: 100%; }
  .note { position: relative; width: 1100px; background: rgb(241 245 249 / .8); padding: 10px 14px; border: 1px dashed #cbd5e1; border-radius: 8px; font-size: 12px; color: #64748b; }
  .note b { color: #0f172a; font-weight: 600; }
</style></head><body>
<div class="stage">
<div class="smoke"><i></i><i></i><i></i></div>
<div class="card">
  <div class="login">
    <div class="form">
      <h1>S-Patrol</h1><p>사업장 순찰 업무를 한곳에서 관리하세요</p>
      <div class="f"><label>사번</label><div>사번을 입력해주세요</div></div>
      <div class="f"><label>비밀번호</label><div>비밀번호를 입력해주세요</div></div>
      <div class="submit">로그인</div>
    </div>
  </div>
  <div class="intro">
    <small>S-PATROL</small>
    <h2>순찰의 시작부터 끝까지,<br>한 화면에서 확인합니다</h2>
    <p>코스와 지점을 구성하고, 진행 중인 순찰과 결과를 실시간으로 살펴봅니다.</p>
    <div class="shot"><img alt="대시보드 화면" src="data:image/png;base64,${thumb}"></div>
  </div>
</div>
<div class="note"><b>목업 메모</b> — 왼쪽 로그인 폼의 칸 · 문구는 지금 화면 그대로입니다. 오른쪽은 5초마다 넘어가던 소개 슬라이드(아이콘 · 점 · 화살표)를 없애고 <b>소개 문구 + 화면 이미지</b>로 바꿨고 움직이지 않습니다. <b>소개 문구는 임시로 지은 것</b>이고, 화면 이미지는 대시보드 목업을 찍은 것이라 실제 화면 캡처로 바꿔야 합니다. 효과는 <b>카드 바깥의 페이지 배경</b>에만 있습니다(배경을 감싼 div 에 건다) — 옅은 연기 세 덩이가 약 18초에 걸쳐 왼쪽에서 오른쪽으로 지나가고, 카드는 그 위에 그대로 떠 있습니다(CSS 로 만든 것). 시스템의 움직임 줄이기 설정이 켜져 있으면 멈춘 그림입니다.</div>
</div>
</body></html>`
fs.writeFileSync(path.join(__dirname, 'c-landing.html'), html)
console.log('c-landing.html')
