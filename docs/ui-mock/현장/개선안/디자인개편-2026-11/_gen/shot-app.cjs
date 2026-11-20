// 실제 앱의 현장 14화면을 1920×911 로 찍는다 — 목업과 나란히 대조하는 용도(`spec 084`).
// 가짜 서버(MSW)가 뜬 개발 서버를 대상으로 한다: `npm run dev -- --mode capture --port 5174 --strictPort`
// 사용: node shot-app.cjs <프로젝트 폴더> <출력 폴더> [주소 — 기본 http://localhost:5174]
// 🔴 이 파일은 한글이 든 경로에서 직접 돌리면 node 가 죽는다(sync.sh 머리말) — 임시 폴더로 복사해서 돌린다.
const { createRequire } = require('module')
const path = require('path')
const fs = require('fs')
const [root, out, base = 'http://localhost:5174'] = process.argv.slice(2)
const { chromium } = createRequire(path.join(root, 'package.json'))('@playwright/test')

// `e2e/capture.pw.ts` 와 같은 값 — 페이지 시계와 토큰 시각을 한 상수에서 만든다
const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const NOW = new Date('2026-10-20T09:00:00+09:00')
const b64 = (v) => Buffer.from(v, 'utf8').toString('base64url')
const now = Math.floor(NOW.getTime() / 1000)
const token = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify({ userSeq: 1, loginId: '333333', userName: '홍길동', uuid: 'a'.repeat(32), roleDisplay: '현장관리자', [ROLE]: 'FieldManager', nbf: now, exp: now + 10800, iss: 'x', aud: 'x' }))}.sig`

/** [파일 이름(목업 번호와 맞춘다), 목록 주소, 첫 줄을 눌러 상세로 갈지] */
const pages = [
  ['01-대시보드', '/dashboard'],
  ['02-순찰이력-코스', '/patrol/zones'],
  ['03-순찰이력-지점', '/patrol/points'],
  ['04-코스-목록', '/zones'],
  ['05-코스-상세', '/zones', true],
  ['06-지점-목록', '/points'],
  ['07-지점-상세', '/points', true],
  ['08-근무자-목록', '/users'],
  ['10-배치관리', '/deployments'],
  ['11-공지사항-목록', '/notice'],
  ['12-순찰이력-코스-상세', '/patrol/zones', true],
  ['13-순찰이력-지점-상세', '/patrol/points', true],
  ['14-근무자-상세', '/users', true],
  ['15-공지사항-상세', '/notice', true],
]

;(async () => {
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1920, height: 911 }, locale: 'ko-KR', timezoneId: 'Asia/Seoul', reducedMotion: 'reduce' })
  await context.addInitScript((seed) => { for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v) },
    { 'auth.accessToken': token, 'auth.refreshToken': 'r', 'auth.siteSeq': '7', 'auth.siteName': '강동 테크노타워' })
  const page = await context.newPage()
  await page.clock.setFixedTime(NOW)
  const settle = async () => {
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(900)
  }
  for (const [file, url, detail] of pages) {
    await page.goto(base + url)
    await settle()
    if (detail) {
      // 목록 화면마다 줄 모양이 다르다 — 표의 줄, 없으면 목록의 첫 링크
      const row = page.locator('tbody tr').first()
      if (await row.count()) await row.click()
      await settle()
    }
    await page.screenshot({ path: path.join(out, file + '.png') })
    console.log(file, page.url().replace(base, ''))
  }
  await browser.close()
})()
