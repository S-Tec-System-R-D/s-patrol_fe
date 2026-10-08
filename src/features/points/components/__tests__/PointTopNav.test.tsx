import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PointTopNav from '../PointTopNav'

/**
 * `spec 027` Phase 1 — 추가 버튼이 **아이콘 + 라벨**이 됐다(사용자 결정 2026-10-08).
 *
 * 🔴 **여기서 고정하는 것은 `aria-label` 이다.** 라벨은 `xl` 미만에서
 * `hidden xl:inline` 으로 숨는데, 그러면 버튼에 **접근 가능한 이름이 남지 않는다.**
 * `aria-label` 이 그 자리를 메운다 — 지우면 좁은 폭에서 "이름 없는 버튼" 이 되고,
 * 넓은 폭에서는 멀쩡해 보여서 **조용히 회귀한다.**
 *
 * ⚠️ jsdom 은 Tailwind 를 적용하지 않으므로 **숨김 자체는 검증할 수 없다**(라벨 텍스트가
 * 항상 DOM 에 있다). 숨김은 브라우저 확인(T326) 몫이고, 여기서는 **이름이 유지되는지**만
 * 본다.
 */
const renderNav = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <PointTopNav />
    </QueryClientProvider>
  )
}

describe('PointTopNav — 추가 버튼', () => {
  it('🔴 접근 가능한 이름이 "지점 생성"이다 — 라벨이 숨는 폭에서도 유지돼야 한다', () => {
    renderNav()
    expect(screen.getByRole('button', { name: '지점 생성' })).toBeInTheDocument()
  })

  it('라벨 텍스트를 함께 그린다 (넓은 폭에서 노출)', () => {
    renderNav()
    expect(screen.getByText('지점 생성')).toBeInTheDocument()
  })

  it('검색 input 이 있다', () => {
    renderNav()
    expect(screen.getByPlaceholderText('지점 이름 검색')).toBeInTheDocument()
  })
})
