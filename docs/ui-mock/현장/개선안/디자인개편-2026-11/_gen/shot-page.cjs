// 사용: node shot-page.cjs <projectDir> <html> <out.png> — 페이지 전체를 1920 폭으로 찍는다
const { createRequire } = require('module')
const path = require('path')
const { pathToFileURL } = require('url')
const [projectDir, htmlPath, outPath] = process.argv.slice(2)
const { chromium } = createRequire(path.join(projectDir, 'package.json'))('@playwright/test')
;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 911 } })
  await page.goto(pathToFileURL(htmlPath).href + (process.argv[5] || String()), { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: outPath, fullPage: false })
  await browser.close()
})()
