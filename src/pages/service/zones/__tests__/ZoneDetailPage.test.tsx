import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ZoneDetailPage from '../ZoneDetailPage'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/zones/:courseSeq` — Phase 2 의 **최소 골격**에 대한 테스트.
 *
 * 여기서 고정하는 것은 **라우트가 실제로 성립하는가** 다: URL 로 직접 들어와도 상세가
 * 뜨고(= 새로고침에 살아남고), 없는 코스가 **`/404` 가 아니라 안내**로 끝난다.
 * 다이어그램·지점 카드·변경계는 Phase 3·4 에서 이 파일에 쌓인다.
 */

const renderPage = (initialEntry: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/zones/:courseSeq" element={<ZoneDetailPage />} />
          <Route path="/404" element={<div>NOT_FOUND_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('ZoneDetailPage', () => {
  it('🔴 URL 로 직접 들어가도 상세가 뜬다 — 새로고침에 살아남는다', async () => {
    renderPage('/zones/1')

    expect(await screen.findByText('A동 순찰코스')).toBeInTheDocument()
  })

  it('설명(memo)을 보여준다', async () => {
    renderPage('/zones/1')

    expect(await screen.findByText(/A동 1층~지하 주차장 순찰/)).toBeInTheDocument()
  })

  it('목록으로 돌아갈 수단이 있다 — 브레드크럼 첫 조각이 링크다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByRole('link', { name: '코스/지점' })).toHaveAttribute('href', '/zones')
  })

  it('🔴 없는 courseSeq 는 안내 + 목록 복귀 수단으로 끝난다 — /404 로 보내지 않는다', async () => {
    renderPage('/zones/9999')

    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('NOT_FOUND_PAGE')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '코스/지점' })).toBeInTheDocument()
  })

  it('🔴 숫자가 아닌 세그먼트는 조회를 시도하지 않고 안내로 끝난다', async () => {
    renderPage('/zones/abc')

    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText(/주소가 올바르지 않습니다/)).toBeInTheDocument()
  })

  it('🔴 변경계 버튼을 아직 두지 않는다 — Phase 4 몫이다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})
