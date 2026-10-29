import { test, expect } from './support/fixtures'
import { goMenu, loginField, openFirstRow } from './support/session'
import type { Page } from '@playwright/test'

/**
 * 기능 흐름 확인 — 현장 S1~S5(`spec 059` US2). 1280px 만.
 * 🔴 **쓰기 뒤 이동은 클릭으로만** — `goto` 로 새로 불러오면 MSW 메모리 상태(쓴 결과)가 사라진다.
 */

const dialog = (page: Page, name: string) => page.getByRole('dialog', { name })

/** 저장 뒤 모달이 닫혔는지 — 닫혀야 성공 처리까지 끝난 것이다 */
const submitAndClose = async (page: Page, name: string, button: string) => {
  await dialog(page, name).getByRole('button', { name: button, exact: true }).click()
  await expect(dialog(page, name)).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  await loginField(page)
})

test('S1 지점 설명 바꾸기 → 지우기', async ({ page }) => {
  const memo = 'e2e 설명 변경'
  await goMenu(page, '코스/지점')
  await page.getByRole('link', { name: '지점', exact: true }).click()
  await openFirstRow(page)

  await page.getByRole('button', { name: '기본정보 수정' }).click()
  await dialog(page, '지점 수정').getByLabel('설명').fill(memo)
  await submitAndClose(page, '지점 수정', '저장')
  await expect(page.getByText(memo)).toBeVisible()

  // 058 — 설명을 비우면 실제로 비워진다(B-15 해소)
  await page.getByRole('button', { name: '기본정보 수정' }).click()
  await dialog(page, '지점 수정').getByLabel('설명').fill('')
  await submitAndClose(page, '지점 수정', '저장')
  await expect(page.getByText(memo)).toHaveCount(0)
})

test('S2 코스 이름 바꾸기', async ({ page }) => {
  const name = 'e2e 코스 이름'
  await goMenu(page, '코스/지점')
  await openFirstRow(page)

  await page.getByRole('button', { name: '기본정보 수정' }).click()
  await dialog(page, '코스 수정').getByLabel('코스명').fill(name)
  await submitAndClose(page, '코스 수정', '저장')
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()

  await page.getByRole('navigation', { name: '현재 위치' }).getByRole('link', { name: '코스/지점' }).click()
  await expect(page.getByRole('cell', { name, exact: true })).toBeVisible()
})

test('S3 공지 작성 → 상세 → 삭제', async ({ page }) => {
  const title = 'e2e 공지 제목'
  await goMenu(page, '공지사항')

  await page.getByRole('button', { name: '공지 작성' }).click()
  await dialog(page, '공지 작성').getByLabel('제목').fill(title)
  await dialog(page, '공지 작성').getByPlaceholder('공지 내용을 입력해주세요').fill('e2e 공지 본문')
  await submitAndClose(page, '공지 작성', '등록')

  await page.getByRole('cell', { name: title }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

  await page.getByRole('button', { name: '삭제', exact: true }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: '삭제', exact: true }).click()
  await expect(page).toHaveURL(/\/notice$/)
  await expect(page.getByRole('cell', { name: title })).toHaveCount(0)
})

test('S4 근무자 추가', async ({ page }) => {
  const name = 'e2e근무자'
  await goMenu(page, '근무자')

  await page.getByRole('button', { name: '근무자 추가' }).click()
  const form = dialog(page, '근무자 추가')
  await form.getByLabel('이름').fill(name)
  await form.getByLabel('연락처').fill('010-1234-5678')
  await form.getByLabel('사번').fill('59059059')
  await form.getByLabel('초기 비밀번호').fill('test1234!')
  await form.getByLabel('비밀번호 확인').fill('test1234!')
  await submitAndClose(page, '근무자 추가', '등록')

  await expect(page.getByRole('cell', { name })).toBeVisible()
})

test('S5 배치 요청 승인', async ({ page }) => {
  await goMenu(page, '배치관리')
  const approve = page.getByRole('button', { name: /승인$/ }).first()
  const worker = ((await approve.getAttribute('aria-label')) ?? '').replace(/ 승인$/, '')
  expect(worker, '승인할 배치 요청이 없다').not.toBe('')

  await approve.click()
  await expect(page.getByRole('button', { name: `${worker} 승인` })).toHaveCount(0)

  // 승인한 요청은 이 사업장으로 오는 배치라 전입 이력에 남는다
  await page.getByRole('tab', { name: '전입 이력' }).click()
  await expect(page.getByRole('cell', { name: new RegExp(worker) }).first()).toBeVisible()
})

/**
 * S8 사업장 전환(`spec 061`) — 홈(2-1 · 7)에서 루트(6 · 코스 0건)로 → 빈 목록 → 다시 2-1 로 → 목록.
 * 🔴 **홈에서 바꾼다** — 같은 주소라 다시 그려지지 않을 수 있던 경우다(spec §3).
 * 레일(1280)과 floating nav(390) 둘 다. 버튼은 레일 · nav 에 하나씩 있어 **보이는 것**을 누른다.
 */
const switchSite = async (page: Page, siteName: string) => {
  await page.getByRole('button', { name: '사업장 전환' }).filter({ visible: true }).click()
  await dialog(page, '사업장 전환').getByRole('button', { name: siteName, exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: '사업장 전환 중' })).toBeHidden()
  await expect(page).toHaveURL(/\/zones$/)
}

/** 홈 목록의 행 — 넓은 폭 = 표의 행, 좁은 폭 = 카드(`openFirstRow` 와 같은 선택자) */
const homeRows = (page: Page) =>
  page
    .locator('tbody tr[tabindex]')
    .filter({ visible: true })
    .or(page.locator('div.flex-col.xl\\:hidden > button').filter({ visible: true }))

for (const width of [1280, 390]) {
  test.describe(`S8 사업장 전환 · ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1280 ? 900 : 844 } })

    test('홈에서 전환 → 새 사업장 목록 → 되돌리기', async ({ page }) => {
      await expect(homeRows(page).first()).toBeVisible()

      await switchSite(page, '테스트 사업장2')
      await expect(homeRows(page)).toHaveCount(0)

      await switchSite(page, '테스트 사업장2-1')
      await expect(homeRows(page).first()).toBeVisible()
    })
  })
}
