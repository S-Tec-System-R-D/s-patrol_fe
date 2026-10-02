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
