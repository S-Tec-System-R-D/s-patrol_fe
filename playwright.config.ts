import { defineConfig } from '@playwright/test'

/**
 * playwright 설정 — 프로젝트 3개(`spec 059`).
 *
 * | 프로젝트 | 명령 | 하는 일 |
 * |---|---|---|
 * | `capture` | `npm run capture` | UI baseline 캡쳐(`docs/ui-current/**`) — 059 이전과 같다 |
 * | `e2e-desktop` | `npm run e2e` | 1280px — 화면 열림 확인 · 가드 · 기능 흐름 확인(S1~S7) |
 * | `e2e-mobile` | `npm run e2e` | 390px — 화면 열림 확인만(가로 넘침 포함) |
 *
 * e2e 는 **mock(MSW) 위에서만** 돈다(`.env.capture`). 실서버는 공유 데이터라 쓰기 흐름을 돌릴 수 없다.
 * 🔴 **mock 상태는 페이지 메모리에 있다** — `page.goto` 로 새로 불러오면 쓰기 결과가 사라진다.
 * 기능 흐름은 쓰기 뒤 이동을 클릭으로 한다. 테스트마다 새 페이지라 시드는 항상 깨끗하다.
 * 콘솔 에러 · API 실패 검사는 `e2e/support/fixtures.ts` 가 모든 e2e 테스트에 자동으로 붙인다.
 *
 * - `testMatch` 를 `*.pw.ts` 로 둔 이유: vitest 의 기본 include(`*.test.*` / `*.spec.*`)와
 *   겹치지 않게 해서 `npm run test` 가 이 파일들을 집어 실행하는 사고를 막는다.
 * - 포트 5174: 개발자가 띄워둔 dev 서버(5173)와 충돌하지 않도록 분리.
 * - 캡쳐 조건은 `docs/ui-current/README.md` 에 기록된 값과 일치해야 한다.
 */
export default defineConfig({
  testDir: './e2e',

  // 순차 실행. 병렬이면 같은 dev 서버에 부하가 몰려 렌더가 흔들린다(캡쳐) · MSW 응답이 밀린다(e2e).
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5174',
    // PC 기준 1280px (CLAUDE.md B4 반응형 — 모바일 전용 UI 없음)
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    /**
     * 🔴 **애니메이션을 멈춘다 — 없으면 baseline 이 찍을 때마다 달라진다.**
     * `AppEmpty` 의 `bounce-anim` 이 **무한 반복**이라 빈 상태가 있는 화면(403·404·
     * 배치관리 등)은 캡쳐 시점에 따라 픽셀이 바뀐다. 그러면 "무엇이 진짜 바뀌었는지"
     * 비교할 수 없다(027 재촬영에서 실제로 겪었다 — 같은 코드로 두 번 찍었는데
     * 403·404 가 달랐다). 프로젝트 CSS 에 이미 `prefers-reduced-motion` 규칙이 있어
     * 그것을 켜기만 하면 된다(`index.css:345`).
     */
    reducedMotion: 'reduce',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    deviceScaleFactor: 1,
  },

  projects: [
    { name: 'capture', testMatch: 'capture.pw.ts' },
    { name: 'e2e-desktop', testMatch: ['open-*.pw.ts', 'guards.pw.ts', 'flow-*.pw.ts'] },
    // 390px — 053 이 정한 좁은 폭 점검 기준
    { name: 'e2e-mobile', testMatch: 'open-*.pw.ts', use: { viewport: { width: 390, height: 844 } } },
  ],

  webServer: {
    // `--mode capture` → `.env.capture` 적용(MSW 켜짐 · API base 비움). 이유는 그 파일 주석 참조.
    command: 'npm run dev -- --mode capture --port 5174 --strictPort',
    url: 'http://localhost:5174',
    // 기존 서버를 재사용하면 `.env.local`로 떠 있을 수 있어 MSW가 동작하지 않는다.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
