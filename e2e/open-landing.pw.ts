import { test, expect, expectNoOverflow } from './support/fixtures'

/**
 * 랜딩 `/`(`spec 062`) — 1280px · 390px 둘 다 돈다(`open-*.pw.ts`).
 * 넓은 폭 = 로그인 + 소개 슬라이드, 좁은 폭 = 로그인만. 그 자리에서 로그인 → 사업장 선택 → 현장 홈.
 * 비밀번호는 mock 이 형식만 본다(`support/session.ts` 와 같은 값).
 */

test('랜딩 — 로그인 · 소개 슬라이드(넓은 폭만) · 그 자리에서 로그인', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'S-Patrol' })).toBeVisible()

  const slider = page.getByRole('region', { name: '서비스 소개' })
  const wide = (page.viewportSize()?.width ?? 0) >= 1280
  if (wide) await expect(slider).toBeVisible()
  else await expect(slider).toBeHidden()
  await expectNoOverflow(page)

  await page.getByLabel('사번').fill('333333')
  await page.getByLabel('비밀번호').fill('test1234!')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.getByRole('button', { name: '테스트 사업장2-1', exact: true }).click()
  await expect(page).toHaveURL(/\/zones$/)
})
