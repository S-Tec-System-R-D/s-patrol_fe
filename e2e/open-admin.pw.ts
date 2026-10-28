import { test, expect, expectNoOverflow } from './support/fixtures'
import { ACCOUNT, goMenu, loginAdmin, openFirstRow } from './support/session'

/**
 * 화면 열림 확인 — 본사(`spec 059` US1). 1280px · 390px 둘 다 돈다.
 * 권한마다 보이는 범위가 달라(서버 스코프 · 056 계층 권한) 3계정을 각각 연다.
 */

const ADMINS = [
  { role: '시스템관리자', loginId: ACCOUNT.system },
  { role: 'Master', loginId: ACCOUNT.master },
  { role: 'Manager', loginId: ACCOUNT.manager },
]

for (const { role, loginId } of ADMINS) {
  test(`${role} — 사업장 목록 · 상세 · 관리자`, async ({ page }) => {
    await loginAdmin(page, loginId)
    await expect(page.getByRole('heading', { level: 1, name: '사업장', exact: true })).toBeVisible()
    await expectNoOverflow(page)

    await openFirstRow(page)
    await expect(page).toHaveURL(/\/admin\/locations\/\d+$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoOverflow(page)

    await goMenu(page, '관리자')
    await expect(page.getByRole('heading', { level: 1, name: '관리자', exact: true })).toBeVisible()
    await expectNoOverflow(page)
  })
}
