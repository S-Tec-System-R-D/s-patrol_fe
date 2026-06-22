import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'

/**
 * vitest 전역 setup.
 * - @testing-library/jest-dom 매처 등록(`toBeInTheDocument` 등).
 * - MSW server lifecycle:
 *   - beforeAll: listen
 *   - afterEach: resetHandlers (테스트 격리)
 *   - afterAll: close
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
