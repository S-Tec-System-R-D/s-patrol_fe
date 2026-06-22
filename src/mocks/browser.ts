import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * MSW 브라우저 worker.
 * - `main.tsx`에서 `VITE_USE_MSW === 'true'`일 때만 동적 import해 `worker.start()` 호출.
 * - 별도 mockServiceWorker.js 파일이 public/에 필요(msw init으로 생성).
 */
export const worker = setupWorker(...handlers)
