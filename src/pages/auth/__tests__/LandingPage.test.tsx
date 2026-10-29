import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { clearTokens, getAccessToken } from '@/lib/auth/tokens'
import { getSiteSeq } from '@/lib/auth/site'
import LandingPage from '../LandingPage'

/**
 * 랜딩(`/`, `spec 062`) — 로그인 처리는 `/login` 과 같은 `LoginPanel` 이다. 여기서는 **랜딩 자리에서도
 * 끝까지 이어지는지**만 본다(분기 전체는 `LoginPage.test.tsx`). mock dev 계정(`mocks/handlers/auth.ts`)을 쓴다.
 */

const renderLanding = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/zones" element={<div>SERVICE_HOME</div>} />
        <Route path="/admin/locations" element={<div>ADMIN_HOME</div>} />
      </Routes>
    </MemoryRouter>
  )

const login = async (loginId: string) => {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('사번을 입력해주세요'), loginId)
  await user.type(screen.getByPlaceholderText('비밀번호를 입력해주세요'), 'abcd123!')
  await user.click(screen.getByRole('button', { name: '로그인' }))
  return user
}

beforeEach(() => clearTokens())

describe('LandingPage', () => {
  it('로그인 폼 + 소개 슬라이드가 한 화면에 있다 · 본사 로그인 링크는 없다', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1, name: 'S-Patrol' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '서비스 소개' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /본사/ })).not.toBeInTheDocument()
  })

  it('현장관리자(복수 소속) — 사업장 선택 단계를 거쳐 현장 홈 · 슬라이드는 그대로', async () => {
    renderLanding()
    const user = await login('333333')

    await user.click(await screen.findByRole('button', { name: '테스트 사업장2-1' }))
    expect(screen.queryByRole('region', { name: '서비스 소개' })).not.toBeInTheDocument()
    expect(await screen.findByText('SERVICE_HOME')).toBeInTheDocument()
    expect(getSiteSeq()).toBe(7)
  })

  it('사업장 선택 단계에서도 오른쪽 슬라이드는 남는다', async () => {
    renderLanding()
    await login('333333')

    expect(await screen.findByRole('heading', { name: '사업장 선택' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '서비스 소개' })).toBeInTheDocument()
  })

  it('본사 계정은 본사 홈으로 간다(/login 과 같다)', async () => {
    renderLanding()
    await login('000000')
    expect(await screen.findByText('ADMIN_HOME')).toBeInTheDocument()
  })

  it('근무자는 차단 안내 · 토큰 저장 안 함', async () => {
    renderLanding()
    await login('222222')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(getAccessToken()).toBeNull()
  })
})
