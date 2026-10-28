import { test as base, expect, type Page } from '@playwright/test'

/**
 * 모든 e2e 테스트에 자동으로 붙는 **화면 공통 확인**(`spec 059` DoD #2).
 *
 * 테스트가 도는 동안 다음을 모아 두었다가 **끝날 때 0건인지** 단언한다.
 * - `console.error` · `pageerror`(잡히지 않은 예외)
 * - 같은 origin `/api/` 응답의 4xx · 5xx
 *
 * 🔴 **바깥 origin 의 리소스 실패는 세지 않는다** — 지도 타일(V-World)은 외부 네트워크라
 * 사내망 · 오프라인에 따라 실패한다. 화면 회귀가 아니다.
 * 가드 확인처럼 **일부러** 실패를 일으키는 테스트는 `checks.allowApi(/패턴/)` 로 넘긴다.
 */
type Checks = { allowApi: (pattern: RegExp) => void }

export const test = base.extend<{ checks: Checks }>({
  checks: [
    async ({ page, baseURL }, use) => {
      const problems: string[] = []
      const allowed: RegExp[] = []
      const isAllowed = (url: string) => allowed.some((pattern) => pattern.test(url))
      const sameOrigin = (url: string) => !!baseURL && url.startsWith(baseURL)

      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() !== 'error') return
        // 실패한 요청은 브라우저가 "Failed to load resource" 로 한 번 더 찍는다 — 응답 쪽에서 센다
        const url = message.location().url
        if (message.text().startsWith('Failed to load resource') && (!sameOrigin(url) || isAllowed(url))) return
        problems.push(`console: ${message.text()}`)
      })
      page.on('response', (response) => {
        const url = response.url()
        if (sameOrigin(url) && url.includes('/api/') && response.status() >= 400 && !isAllowed(url)) {
          problems.push(`api ${response.status()}: ${url}`)
        }
      })

      await use({ allowApi: (pattern) => allowed.push(pattern) })

      expect(problems, '화면 공통 확인 — 콘솔 에러 · API 실패').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** 가로 넘침 없음 — 문서 폭이 화면 폭을 넘지 않는다(`053` 기준) */
export const expectNoOverflow = async (page: Page) => {
  // 데이터가 들어온 뒤에 잰다 — 빈 목록일 때는 넘치지 않다가 행이 차면 넘칠 수 있다
  await page.waitForLoadState('networkidle')
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, `가로 넘침 — ${page.url()}`).toBeLessThanOrEqual(innerWidth)
}
