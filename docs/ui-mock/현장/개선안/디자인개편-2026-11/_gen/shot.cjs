// 사용: node shot.cjs <projectDir> <html> <out.png> [full]
// 기본은 브라우저 첫 화면(1920x911) 그대로, full 이면 같은 폭으로 페이지 전체.
const { createRequire } = require('module')
const path = require('path')
const { pathToFileURL } = require('url')

const [projectDir, htmlPath, outPath, mode] = process.argv.slice(2)
const { chromium } = createRequire(path.join(projectDir, 'package.json'))('@playwright/test')

;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1920, height: 911 }, deviceScaleFactor: 1 })
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  if (process.argv[6] === 'compact') await page.addStyleTag({ path: path.join(__dirname, 'compact.css') })
  if (mode === 'full') {
    await page.locator('.shell').screenshot({ path: outPath })
  } else {
    // 실제 앱처럼 사이드바는 고정, 본문만 화면 높이에서 잘린다
    await page.addStyleTag({ content: '.shell{height:911px;overflow:hidden}.inset{overflow:hidden}.topbar,.content,.note{flex:none}' })
    await page.screenshot({ path: outPath })
  }
  await browser.close()
})()
