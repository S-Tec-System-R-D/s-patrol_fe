import { defineConfig } from '@playwright/test'

/**
 * UI baseline 캡쳐 전용 playwright 설정 (`npm run capture`).
 * 기능 테스트용이 아니다 — 단위·화면 테스트는 vitest가 담당한다.
 *
 * - `testMatch`를 `*.pw.ts`로 둔 이유: vitest의 기본 include(`*.test.*` / `*.spec.*`)와
 *   겹치지 않게 해서 `npm run test`가 이 파일을 집어 실행하는 사고를 막는다.
 * - 포트 5174: 개발자가 띄워둔 dev 서버(5173)와 충돌하지 않도록 분리.
 * - 캡쳐 조건은 `docs/ui-current/README.md`에 기록된 값과 일치해야 한다.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.ts',

  // 캡쳐는 순차 실행. 병렬이면 같은 dev 서버에 부하가 몰려 렌더가 흔들린다.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5174',
    // PC 기준 1280px (CLAUDE.md B4 반응형 — 모바일 전용 UI 없음)
    viewport: { width: 1280, height: 900 },
    colorScheme: 'light',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    deviceScaleFactor: 1,
  },

  webServer: {
    // `--mode capture` → `.env.capture` 적용. 이유는 그 파일 주석 참조.
    command: 'npm run dev -- --mode capture --port 5174 --strictPort',
    url: 'http://localhost:5174',
    // 기존 서버를 재사용하면 `.env.local`로 떠 있을 수 있어 MSW가 동작하지 않는다.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
