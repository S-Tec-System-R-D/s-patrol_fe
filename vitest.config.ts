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
  },
})
