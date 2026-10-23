import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import ServiceLayout from '../../ServiceLayout'

/**
 * 현장 레일 — `ServiceLayout` 으로 렌더한다(`spec 043` T743). 배치 대기 뱃지 숫자는 레이아웃이 세서 레일에 넘긴다.
 */

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

const renderRail = (initialPath: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ServiceLayout />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RailSidebar (현장)', () => {
  it('5개 메뉴 아이콘 flat 렌더(순찰이력·코스/지점·근무자·배치관리·공지사항)', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('순찰이력')).toBeInTheDocument()
    expect(screen.getByLabelText('코스/지점')).toBeInTheDocument()
    expect(screen.getByLabelText('근무자')).toBeInTheDocument()
    expect(screen.getByLabelText('배치관리')).toBeInTheDocument()
    expect(screen.getByLabelText('공지사항')).toBeInTheDocument()
  })

  it('현재 경로(/zones)에 해당하는 메뉴가 활성 상태(bg-rail-2)', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('코스/지점')).toHaveClass('bg-rail-2')
    expect(screen.getByLabelText('근무자')).not.toHaveClass('bg-rail-2')
  })

  it('🔴 배치관리 뱃지는 요약 쿼리의 대기 건수다 (spec 039 — store 직접 읽기 제거)', async () => {
    renderRail('/zones')

    expect(await within(screen.getByLabelText('배치관리')).findByText('2')).toBeInTheDocument()
  })

  it('요약 조회가 실패하면 뱃지를 그리지 않는다 — 숫자를 지어내지 않는다', async () => {
    server.use(
      http.get('/api/v1/Assignment/W/sign/GetAssignmentCount', () =>
        HttpResponse.json({ message: 'x' }, { status: 500 })
      )
    )
    renderRail('/zones')

    // 실패가 반영될 시간을 준 뒤에도 숫자가 없다
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(within(screen.getByLabelText('배치관리')).queryByText(/\d/)).not.toBeInTheDocument()
  })

  it('현장 레일에는 사이트 태그가 없다', () => {
    renderRail('/zones')
    expect(screen.queryByText('ADMIN')).not.toBeInTheDocument()
  })

  it('프로필 아바타 트리거 렌더', () => {
    renderRail('/zones')
    expect(screen.getByLabelText('프로필 메뉴 열기')).toBeInTheDocument()
  })
})
