// 랜딩 오른쪽 패널에 넣을 화면 이미지 — 대시보드 목업의 본문 카드를 찍는다. 직접 돌리지 말고 `sh sync.sh thumb` 로 돌린다(PATROL_ROOT 가 필요하다)
const { createRequire } = require('module')
const path = require('path')
const { pathToFileURL } = require('url')
const { chromium } = createRequire(path.join(process.env.PATROL_ROOT, 'package.json'))('@playwright/test')
;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 911 } })
  await page.goto(pathToFileURL(path.join(__dirname, 'a-dashboard.html')).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(5000) // 처음 4초 움직임과 차트가 다 그려진 뒤
  await page.screenshot({ path: path.join(__dirname, 'dash-thumb.png'), clip: { x: 224, y: 8, width: 1688, height: 760 } })
  await browser.close()
})()
