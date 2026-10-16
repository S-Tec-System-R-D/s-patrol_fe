/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * vitest 설정.
 * - 환경: jsdom (React Testing Library 사용을 위해).
 * - setupFiles: jest-dom 매처 + MSW server lifecycle (`src/test/setup.ts`).
 * - alias `@`는 Vite 본 설정(vite.config.ts)과 일치시킴.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    /**
     * 🔴 **워커 수를 코어 수보다 낮게 고정한다**(`spec 036` Phase 1, 2026-10-16 측정).
     *
     * 기본값은 코어 수(이 머신 16)인데, 그러면 **16개 프로세스가 동시에 jsdom 환경을
     * 구성**하면서 CPU·메모리를 서로 빼앗는다. 파일당 고정비가 크기 때문이다 —
     * 단독 실행 1파일이 **environment 1.4s + setup 0.8s 인데 본문은 0.01s** 다.
     *
     * 실측(86 files / 887 tests):
     * | 워커 | wall-clock | environment 합 | tests 합 | 실패 |
     * |---|---|---|---|---|
     * | 16(기본) | 103.8s | 597s | 352s | 1~5건 |
     * | **6** | **98.4s** | **197s** | **140s** | **0건** |
     *
     * 🔴 **일을 덜 한 것이 아니라 경합 없이 한 것이다** — 합산 시간이 3배 줄었는데
     * wall-clock 은 오히려 조금 빨라졌다. 경합은 테스트 본문의 **실제 경과 시간**을
     * 늘리고, `testTimeout`(5s)은 그 경과 시간을 재므로 **무거운 렌더링 테스트가
     * 코드가 느려서가 아니라 기다리다 타임아웃된다**(`PatrolZonesPage`·`EditCourseForm`
     * 등). `npm run verify` 를 병렬로 돌리면 경합이 한 단 더 올라가 실패가 1건 → 5건이
     * 됐다 — `CLAUDE.md` A4 의 병렬 실행 규칙이 이 설정을 전제로 한다.
     *
     * ⚠️ 코어가 더 적은 머신·CI 에서는 이 값이 상한으로만 작동한다(그 이하로는 안 늘린다).
     */
    maxWorkers: 6,
    /**
     * 테스트는 `.env.local`에 의존하지 않는다.
     * MSW 핸들러가 상대 경로(`/api/...`)로 등록돼 jsdom origin에 매칭되므로,
     * `VITE_API_BASE_URL`이 채워져 있으면 요청이 외부 origin으로 나가 가로채지지 않는다.
     * 따라서 테스트에서는 항상 빈 base URL로 고정한다.
     */
    env: {
      VITE_API_BASE_URL: '',
      VITE_USE_MSW: 'true',
    },
  },
})
