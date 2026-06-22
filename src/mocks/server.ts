import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/**
 * MSW node server — 테스트(vitest) 환경 전용.
 * `src/test/setup.ts`에서 lifecycle(listen/resetHandlers/close) 등록.
 */
export const server = setupServer(...handlers)
