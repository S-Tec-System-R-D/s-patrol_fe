import { test, expect } from './support/fixtures'
import { ACCOUNT, goMenu, loginAdmin, openFirstRow } from './support/session'

/**
 * 기능 흐름 확인 — 본사 S6 · S7(`spec 059` US2). 1280px 만 · 시스템관리자.
 * 🔴 **쓰기 뒤 이동은 클릭으로만** — `goto` 로 새로 불러오면 MSW 메모리 상태가 사라진다.
 */

test.beforeEach(async ({ page }) => {
  await loginAdmin(page, ACCOUNT.system)
})

test('S6 관리자 추가 → 삭제', async ({ page }) => {
  const name = 'e2e관리자'
  await goMenu(page, '관리자')

  // 시스템관리자는 마스터만 만든다(056 계층 권한) — 권한 칸은 고정이다
  await page.getByRole('button', { name: '관리자 추가' }).click()
  const form = page.getByRole('dialog', { name: '관리자 추가' })
  await form.getByLabel('이름').fill(name)
  await form.getByLabel('연락처').fill('010-5905-9059')
  await form.getByLabel('사번').fill('59059059')
  await form.getByLabel('초기 비밀번호').fill('test1234!')
  await form.getByLabel('비밀번호 확인').fill('test1234!')
  await form.getByRole('button', { name: '등록', exact: true }).click()
  await expect(form).toBeHidden()

  await page.getByRole('cell', { name, exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: '삭제', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '삭제', exact: true }).click()
  await expect(page.getByRole('cell', { name, exact: true })).toHaveCount(0)
})

test('S7 비상연락망 추가 → 해제', async ({ page }) => {
  await openFirstRow(page)
  await expect(page).toHaveURL(/\/admin\/locations\/\d+$/)

  await page.getByRole('button', { name: '화요일 담당자 추가' }).click()
  const picker = page.getByRole('dialog', { name: '화요일 담당자 추가' })
  // `AppCheckbox` 의 실제 input 은 감춰져 있다 — 사람처럼 이름 줄을 누른다
  await picker.getByText('이현성', { exact: true }).click()
  await expect(picker.getByRole('checkbox', { name: '이현성' })).toBeChecked()
  await picker.getByRole('button', { name: '추가 (1)', exact: true }).click()
  await expect(picker).toBeHidden()

  const remove = page.getByRole('button', { name: '화요일 이현성 해제' })
  await expect(remove).toBeVisible()
  // [×] 해제는 확인 모달 없이 바로 반영된다(057)
  await remove.click()
  await expect(remove).toHaveCount(0)
})
