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

/**
 * 산출물 루트. 🔴 **덮어쓰기 전에 다른 곳에 먼저 찍어 비교하는 것이 규칙**이라
 * (`docs/ui-current/README.md` 변경 이력 2026-10-10) 환경변수로 뺐다. 그 전에는 매번
 * 이 줄을 손으로 고쳤고, 되돌리는 것을 잊으면 baseline 이 엉뚱한 곳에 쌓인다.
 *
 * `CAPTURE_OUT=<dir> npm run capture`
 */
const OUT = process.env.CAPTURE_OUT ?? 'docs/ui-current'

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

/**
 * `src/lib/auth/tokens.ts`·`src/lib/auth/site.ts`의 저장 키와 일치해야 한다.
 *
 * 🔴 **021부터 `auth.siteSeq`도 필요하다.** `AuthGuard`가 현장 영역에서 사업장 미선택을
 * 막기 때문에, 이 값이 없으면 보호 라우트가 전부 로그인으로 리다이렉트되어
 * **캡쳐가 전부 로그인 화면이 된다**(020에서 토큰 주입이 깨져 똑같은 일이 났다).
 *
 * ⚠️ `npm run capture`는 `verify`/`test`에 포함되지 않아 **자동 검증망 밖**이다.
 * 가드에 새 조건이 붙을 때마다 이 seed를 함께 갱신해야 하고, 빠뜨리면 다음 캡쳐까지
 * 드러나지 않는다.
 *
 * `siteSeq 7`·`강동 테크노타워`는 mock 데이터(`mocks/handlers/auth.ts`의 `DEV_SITES`)와
 * 맞춘 값이다.
 */
const AUTH_SEED = {
  'auth.accessToken': makeAccessToken('FieldManager'),
  'auth.refreshToken': 'capture-refresh-token',
  'auth.siteSeq': '7',
  'auth.siteName': '강동 테크노타워',
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
  // 🔴 **웹폰트가 적용된 뒤에 찍는다.** Pretendard 가 늦게 들어오면 같은 코드로 찍어도
  // 글자 모양이 달라져 baseline 이 흔들린다(027 재촬영에서 겪었다).
  await page.evaluate(() => document.fonts.ready)
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
})

/**
 * 🔴 **`spec 036` 에서 이름과 성격이 바뀌었다.** 전에는 행을 누르면 **우측 패널**이 열려
 * `patrol-zones--상세선택` 으로 찍었다(036 이전 마스터-디테일). 지금은 **별도 라우트**
 * (`/patrol/zones/:historySeq`)로 이동하므로 **독립 화면 1장**이고 이름도 `--상세` 다.
 *
 * 🔴 **URL 로 직접 들어간다.** 행 클릭에 의존하면 목록 정렬·필터 기본값이 바뀔 때마다
 * **다른 회차**가 찍혀 baseline 이 흔들린다. `historySeq 103` 은 MSW 시드다
 * (`mocks/handlers/history.ts` — 101~104).
 *
 * ⚠️ **지도가 외부 타일을 받는다**(`.env.capture` 가 `VITE_MAP_TILE_URL` 을 덮지 않아
 * `.env.local` 의 V-World 가 적용된다). 032 가 두 번 찍어 **0.06%** 차이를 확인했고
 * 기존 노이즈(±1%)보다 작다 — 그래서 `networkidle` + 여유 대기로 충분하다.
 */
test('순찰이력 — 코스 순찰 상세', async ({ page }) => {
  await open(page, '/patrol/zones/103')
  // 요청 4개(상세·인증 내역·코스 평균·코스 상세) + 타일이 안착할 여유
  await page.waitForTimeout(900)
  await shoot(page, '현장/patrol-zones--상세')
})

test('순찰이력 — 지점 이력', async ({ page }) => {
  await open(page, '/patrol/points')
  await shoot(page, '현장/patrol-points--목록')
})

/**
 * 🔴 **`spec 023` 에서 1장 → 2장이 됐다.** 좌/우 마스터-디테일이 **목록 페이지 + 상세
 * 페이지**로 분리돼(지점과 같은 구조) 한 화면에 담기지 않는다. baseline 파일명도 바뀐다
 * (`zones--목록+다이어그램` → `zones--목록` · `zones--상세`).
 */
test('순찰코스 목록', async ({ page }) => {
  await open(page, '/zones')
  await shoot(page, '현장/zones--목록')
})

test('순찰코스 상세', async ({ page }) => {
  // courseSeq 1(A동 순찰코스) — 지점 3개 + 순찰 이력 있음. 다이어그램·지점 순서·기본정보·
  // KPI·최근 순찰 기록·이상 이력이 **모두 채워지는** 코스다(mock seed 가 예외를 몰아 둔 곳)
  await open(page, '/zones/1')
  // 🔴 이력 2종(`GetCourseHistory`·`GetPointHistory`)이 상세 조회 **뒤에** 뜬다 —
  // KPI·최근 순찰 기록이 스켈레톤인 채로 찍히지 않게 한 번 더 기다린다
  await page.waitForTimeout(600)
  await shoot(page, '현장/zones--상세')
})

/**
 * 🔴 **`spec 027` 에서 1장 → 2장이 됐다.** 좌/우 마스터-디테일이 **목록 페이지 + 상세
 * 페이지**로 분리돼 한 화면에 담기지 않는다. baseline 파일명도 바뀐다
 * (`points--목록+상세` → `points--목록` · `points--상세`).
 */
test('순찰지점 목록', async ({ page }) => {
  await open(page, '/points')
  await shoot(page, '현장/points--목록')
})

test('순찰지점 상세', async ({ page }) => {
  // pointSeq 1(정문 입구) — QR + 코스 1개 + 순찰 기록 있음. 섹션이 모두 채워지는 지점이다
  await open(page, '/points/1')
  // 차트(recharts)는 ResponsiveContainer 가 크기를 잡은 뒤 그려진다
  await page.waitForTimeout(400)
  await shoot(page, '현장/points--상세')
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
