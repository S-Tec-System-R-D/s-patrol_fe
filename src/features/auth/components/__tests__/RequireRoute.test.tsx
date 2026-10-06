import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { setAccessToken, clearTokens } from '@/lib/auth/tokens'
import { server } from '@/mocks/server'
import { RequireRoute } from '../RequireRoute'
import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { makeAccessToken } from '@/test/jwt'

// 020: 권한의 출처가 JWT role 클레임이다. 토큰을 심어 권한을 만든다.
const ADMIN_TOKEN = makeAccessToken({
  userName: 'admin',
  [MS_ROLE_CLAIM]: 'SystemManager',
})
const FIELD_TOKEN = makeAccessToken({ [MS_ROLE_CLAIM]: 'FieldManager' })

const renderWithRouter = (initialPath: string, ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/*" element={ui} />
          <Route path="/403" element={<div>FORBIDDEN_PAGE</div>} />
          <Route path="/login" element={<div>LOGIN_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RequireRoute', () => {
  beforeEach(() => {
    clearTokens()
    server.resetHandlers()
  })

  it('role 일치 시 children 렌더', async () => {
    setAccessToken(ADMIN_TOKEN)

    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('PROTECTED')).toBeInTheDocument())
  })

  it('role 불일치 시 /403으로 리다이렉트', async () => {
    setAccessToken(FIELD_TOKEN)

    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('FORBIDDEN_PAGE')).toBeInTheDocument())
    expect(screen.queryByText('PROTECTED')).not.toBeInTheDocument()
  })

  // 020: useMe 실패 = 토큰이 없거나 디코딩 불가. 네트워크 401이 아니다.
  it('미인증(토큰 없음) 시 /login으로 리다이렉트', async () => {
    renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    await waitFor(() => expect(screen.getByText('LOGIN_PAGE')).toBeInTheDocument())
  })

  // 019까지는 "응답 지연 → 로딩 상태"를 검증했으나, 020에서 useMe가 동기가 되어
  // isLoading이 항상 false다. 로딩 상태 자체가 사라졌으므로 남은 계약인
  // "data를 특정할 수 없으면 children을 렌더하지 않는다"를 손상된 토큰으로 고정한다.
  it('사용자를 특정할 수 없으면 children 렌더 안 함', () => {
    setAccessToken('not-a-jwt')

    const { container } = renderWithRouter(
      '/admin/anything',
      <RequireRoute roles={['SYSTEM', 'MASTER', 'MANAGER']}>
        <div>PROTECTED</div>
      </RequireRoute>
    )

    expect(container.textContent).not.toContain('PROTECTED')
    expect(container.textContent).not.toContain('FORBIDDEN_PAGE')
  })
})
