import { test, expect } from './support/fixtures'
import { ACCOUNT, loginAdmin, loginField, submitLogin } from './support/session'

/**
 * 로그인 · 가드 5종(`spec 059` US1). 1280px 만 — 폭과 무관한 분기다.
 * 기대값은 CLAUDE.md B1 · `flow.md` §0 그대로다(테스트가 새 규칙을 만들지 않는다).
 * 여기는 주소를 직접 친다(`goto`) — 쓰기가 없어 mock 상태를 잃어도 상관없다.
 */

test('로그인 없이 현장 주소 → 로그인 화면(랜딩 /)', async ({ page }) => {
  await page.goto('/zones')
  await expect(page).toHaveURL(/:\d+\/(\?.*)?$/)
  await expect(page.getByLabel('사번')).toBeVisible()
})

test('현장관리자가 본사 주소 → 403', async ({ page }) => {
  await loginField(page)
  await page.goto('/admin/locations')
  await expect(page.getByText('접근 권한이 없습니다')).toBeVisible()
})

test('본사 계정이 현장 주소 → 본사 홈', async ({ page }) => {
  await loginAdmin(page, ACCOUNT.system)
  await page.goto('/zones')
  await expect(page).toHaveURL(/\/admin\/locations$/)
})

test('근무자 로그인 → 차단 안내 · 진입 안 됨', async ({ page }) => {
  await submitLogin(page, ACCOUNT.worker, 'service')
  await expect(page.getByRole('alert')).toHaveText('근무자는 웹에서 이용할 수 없습니다. 모바일 앱을 사용해주세요.')
  await expect(page).toHaveURL(/:\d+\/$/)
})

test('예전 현장 로그인 주소 /login → 랜딩 / (spec 063)', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/:\d+\/$/)
  await expect(page.getByLabel('사번')).toBeVisible()
})

test('없는 주소 → 404', async ({ page }) => {
  await loginField(page)
  await page.goto('/no-such-page')
  await expect(page.getByText('페이지를 찾을 수 없습니다')).toBeVisible()
})
