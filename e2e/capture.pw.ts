import { test, expect, type Page } from '@playwright/test'

/**
 * UI baseline 캡쳐 — 실 API 연동(spec 019~) 착수 전 현재 구현 상태를 고정한다.
 * 산출물: `docs/ui-current/**`. 조건·목록은 `docs/ui-current/README.md`.
 *
 * 인증: localStorage에 accessToken을 직접 주입해 AuthGuard를 통과시킨다.
 *
 * 🔴 **020부터 그 토큰은 진짜 JWT여야 한다.** 사용자 정보가 `/api/auth/me`(실재하지 않는
 * 엔드포인트)에서 **JWT 클레임**으로 바뀌었다. 의미 없는 문자열을 넣으면 디코딩이 실패해
 * `useMe`가 `isError`를 반환하고 AuthGuard가 로그인으로 보내 **캡쳐가 전부 로그인 화면이 된다.**
 * `dev.role` 스왑도 함께 사라졌다 — 권한은 토큰의 role 클레임이 정한다.
 */

const OUT = 'docs/ui-current'

/**
 * ASP.NET role 클레임 키 — `src/features/auth/types/claims.ts`의 `MS_ROLE_CLAIM`과 같은 값.
 * playwright는 vite alias(`@/`)를 해석하지 않아 import하지 않고 복제했다.
 * 바뀌면 양쪽을 함께 고쳐야 한다.
 */
const MS_ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

const base64url = (value: string) => Buffer.from(value, 'utf8').toString('base64url')

/** 캡쳐용 accessToken. 서명은 의미 없다 — 클라이언트는 payload만 읽는다. */
const makeAccessToken = (jwtRole: string) => {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(
    JSON.stringify({
      userSeq: 1,
      loginId: '333333',
      userName: '홍길동',
      uuid: 'a'.repeat(32),
      roleDisplay: '현장관리자',
      [MS_ROLE_CLAIM]: jwtRole,
      nbf: now,
      exp: now + 10800,
      iss: 'https://stsp.s-tec.co.kr',
      aud: 'https://stsp.s-tec.co.kr',
    })
  )
  return `${header}.${payload}.capture-signature`
}

/** `src/lib/auth/tokens.ts`의 저장 키와 일치해야 한다. */
const AUTH_SEED = {
  'auth.accessToken': makeAccessToken('FieldManager'),
  'auth.refreshToken': 'capture-refresh-token',
}

test.beforeEach(async ({ context }) => {
  await context.addInitScript((seed: Record<string, string>) => {
    for (const [key, value] of Object.entries(seed)) {
      localStorage.setItem(key, value)
    }
  }, AUTH_SEED)
})

/** 라우트 진입 + 렌더 안정화 대기. */
const open = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
  // MSW 응답 후 react-query 렌더 + 트랜지션 안착 여유
  await page.waitForTimeout(600)
}

/**
 * 전체 페이지로 찍는다. 뷰포트만 찍으면 코스 관리의 "지점 순서·편집" 카드처럼
 * 접히는 영역이 잘려 비교 기준으로 쓸 수 없다.
 */
const shoot = (page: Page, name: string) =>
  page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })

/** 마스터-디테일 화면에서 첫 행을 선택해 상세 패널을 띄운다. */
const selectFirstRow = async (page: Page) => {
  const rows = page.locator('tbody tr')
  await expect(rows.first()).toBeVisible()
  await rows.first().click()
  await page.waitForTimeout(400)
}

// ── 현장 사이트 (`/*`) ────────────────────────────────

test('순찰이력 — 코스 이력', async ({ page }) => {
  await open(page, '/patrol/zones')
  await shoot(page, '현장/patrol-zones--목록')

  // 이 화면은 초기 selectedPatrol이 null이라 상세 패널이 비어 있다 → 행 선택 후 1장 더
  await selectFirstRow(page)
  await shoot(page, '현장/patrol-zones--상세선택')
})

test('순찰이력 — 지점 이력', async ({ page }) => {
  await open(page, '/patrol/points')
  await shoot(page, '현장/patrol-points--목록')
})

test('순찰코스 관리', async ({ page }) => {
  // ZonesPage는 첫 코스를 자동 선택한다 → 경로 다이어그램이 기본 노출
  await open(page, '/zones')
  await shoot(page, '현장/zones--목록+다이어그램')
})

test('순찰지점 관리', async ({ page }) => {
  // PointsPage는 첫 지점을 자동 선택한다 → 상세 카드가 기본 노출
  await open(page, '/points')
  await shoot(page, '현장/points--목록+상세')
})

test('근무자', async ({ page }) => {
  await open(page, '/users')
  await shoot(page, '현장/users--목록')

  await selectFirstRow(page)
  await shoot(page, '현장/users--상세선택')
})

test('배치관리', async ({ page }) => {
  await open(page, '/deployments')
  await shoot(page, '현장/deployments--대시보드')
})

test('공지사항', async ({ page }) => {
  await open(page, '/notice')
  await shoot(page, '현장/notice--목록')

  // mock 공지 id '4' (src/features/notice/mocks)
  await open(page, '/notice/4')
  await shoot(page, '현장/notice--상세')
})

// ── 공통 / 에러 ───────────────────────────────────────

test('403 권한 없음', async ({ page }) => {
  await open(page, '/403')
  await shoot(page, '공통/403')
})

test('404 페이지 없음', async ({ page }) => {
  // catch-all 라우트(`path: '*'`) 확인용 — 존재하지 않는 경로로 진입
  await open(page, '/no-such-page')
  await shoot(page, '공통/404')
})
