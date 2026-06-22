import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router/index.tsx'
import { queryClient } from '@/lib/queryClient'

/**
 * MSW worker는 `VITE_USE_MSW === 'true'`일 때만 가동.
 * 동적 import로 prod 번들에 포함되지 않게 함.
 */
async function enableMockingIfNeeded() {
  if (import.meta.env.VITE_USE_MSW !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMockingIfNeeded().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </StrictMode>
  )
})
