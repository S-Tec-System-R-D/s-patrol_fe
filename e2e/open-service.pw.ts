import { test, expect, expectNoOverflow } from './support/fixtures'
import { goMenu, loginField, openFirstRow } from './support/session'
import type { Page } from '@playwright/test'

/**
 * 화면 열림 확인 — 현장 7화면(`spec 059` US1). 1280px · 390px 둘 다 돈다.
 * 목록 제목 → 첫 행 → 상세 주소 · 제목. 콘솔 에러 · API 실패는 fixture 가 본다.
 */

const expectHeading = (page: Page, name: string) =>
  expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()

/** 상세는 이름이 데이터마다 달라 주소 모양 + 제목 존재만 본다 */
const expectDetail = async (page: Page, path: RegExp) => {
  await expect(page).toHaveURL(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expectNoOverflow(page)
}

/** 목록 안의 탭(코스 ↔ 지점) */
const goTab = (page: Page, name: string) => page.getByRole('link', { name, exact: true }).click()

test.beforeEach(async ({ page }) => {
  await loginField(page)
})

test('코스 순찰이력 목록 · 상세', async ({ page }) => {
  await goMenu(page, '순찰이력')
  await expectHeading(page, '순찰이력')
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/patrol\/zones\/\d+$/)
})

test('지점 순찰이력 목록 · 상세', async ({ page }) => {
  await goMenu(page, '순찰이력')
  await goTab(page, '지점 순찰이력')
  await expect(page).toHaveURL(/\/patrol\/points$/)
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/patrol\/points\/\d+$/)
})

test('순찰코스 목록 · 상세', async ({ page }) => {
  await goMenu(page, '코스/지점')
  await expectHeading(page, '코스/지점')
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/zones\/\d+$/)
})

test('순찰지점 목록 · 상세', async ({ page }) => {
  await goMenu(page, '코스/지점')
  await goTab(page, '지점')
  await expect(page).toHaveURL(/\/points$/)
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/points\/\d+$/)
})

test('근무자 목록 · 상세', async ({ page }) => {
  await goMenu(page, '근무자')
  await expectHeading(page, '근무자')
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/users\/\d+$/)
})

test('배치관리', async ({ page }) => {
  await goMenu(page, '배치관리')
  await expectHeading(page, '배치관리')
  await expectNoOverflow(page)
})

test('공지사항 목록 · 상세', async ({ page }) => {
  await goMenu(page, '공지사항')
  await expectHeading(page, '공지사항')
  await expectNoOverflow(page)
  await openFirstRow(page)
  await expectDetail(page, /\/notice\/\d+$/)
})
