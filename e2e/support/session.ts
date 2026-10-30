import { expect, type Page } from '@playwright/test'

/**
 * 로그인 · 목록 이동 헬퍼(`spec 059`).
 *
 * 🔴 **실제 로그인 폼으로 들어간다**(토큰 주입이 아니다) — 로그인 · 사업장 선택도 확인할 흐름이다.
 * 계정은 mock dev 계정(`src/mocks/handlers/auth.ts` `DEV_ACCOUNTS`). mock 은 **사번만** 보고,
 * 비밀번호는 폼 형식 검사(8자 · 영문 · 숫자 · 특수)만 통과하면 된다 — 실제 비밀번호가 아니다.
 */
export const ACCOUNT = {
  field: '333333',
  worker: '222222',
  system: '000000',
  master: '111111',
  manager: '777777',
} as const

const PASSWORD = 'test1234!'

/**
 * 현장 계정이 고를 사업장. 🔴 **첫 사업장(루트)이 아니다** — mock 시드는 `siteSeq 7` 에 데이터를
 * 몰아 두었고 루트(6)는 코스가 0건이다(`capture.pw.ts` 의 `auth.siteSeq` 와 같은 이유).
 */
const FIELD_SITE = '테스트 사업장2-1'

/** 로그인 폼 제출까지만 — 결과(사업장 선택 · 차단 안내 · 홈)는 호출부가 본다 */
export const submitLogin = async (page: Page, loginId: string, area: 'service' | 'admin') => {
  // 현장 로그인 = 랜딩 `/`(`spec 063`)
  await page.goto(area === 'admin' ? '/admin/login' : '/')
  await page.getByLabel('사번').fill(loginId)
  await page.getByLabel('비밀번호').fill(PASSWORD)
  await page.getByRole('button', { name: '로그인', exact: true }).click()
}

/** 현장관리자로 로그인 → 사업장 선택 → 현장 홈 */
export const loginField = async (page: Page) => {
  await submitLogin(page, ACCOUNT.field, 'service')
  await page.getByRole('button', { name: FIELD_SITE, exact: true }).click()
  await expect(page.getByRole('navigation', { name: '메뉴' })).toBeVisible()
}

/** 본사 계정으로 로그인 → 본사 홈 */
export const loginAdmin = async (page: Page, loginId: string) => {
  await submitLogin(page, loginId, 'admin')
  await expect(page.getByRole('navigation', { name: '메뉴' })).toBeVisible()
}

/** 레일 메뉴로 이동 — 쓰기 뒤에도 mock 상태가 남도록 `goto` 대신 클릭한다 */
export const goMenu = (page: Page, name: string) =>
  page.getByRole('navigation', { name: '메뉴' }).getByRole('link', { name, exact: true }).click()

/**
 * 목록의 첫 행(넓은 폭 = 표의 행, 좁은 폭 = 카드 버튼)을 연다.
 * 🔴 **행이 없으면 실패한다**(spec §4) — 조용히 건너뛰면 그 상세는 영영 검사되지 않는다.
 * 카드는 `AppTable` 의 `renderCard` 마크업(`div.flex-col.xl:hidden > button`)이다 — `xl:hidden`
 * 만으로 고르면 본사 목록 위의 관리그룹 선택 버튼이 먼저 잡힌다.
 */
export const openFirstRow = async (page: Page) => {
  const row = page
    .locator('tbody tr[tabindex]')
    .filter({ visible: true })
    .or(page.locator('div.flex-col.xl\\:hidden > button').filter({ visible: true }))
    .first()
  await expect(row, '목록에 열 수 있는 첫 행이 없다').toBeVisible()
  await row.click()
}
