import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import PointsPage from '../PointsPage'
import { server } from '@/mocks/server'
import { resetPointStore } from '@/mocks/handlers/points'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/points` 목록 — `spec 027` Phase 1 에서 **전체 폭 테이블로 재작성**했다.
 *
 * 022 판은 마스터-디테일을 전제로 9건이 있었다. 그중 **5건이 사라진 전제**에 걸려 있었다
 * (첫 행 자동 선택 · 우측 상세 패널 · 상세 조회 실패 시 목록 유지). 선택 개념이 URL 로
 * 옮겨가면서 그 책임은 `PointDetailPage` 로 갔다 — 여기서는 **목록만** 본다.
 *
 * 남긴 것: 사업장 스코프 · 빈 목록 · 조회 실패 · `siteSeq` 없으면 조회 안 함.
 * 새로 추가: **행 클릭 → 상세 라우트 이동**.
 */

const GET_POINT_LIST_PATH = '/api/v1/Point/W/sign/GetPointList'

/** 상세 라우트를 더미로 두고 이동 여부를 본문 텍스트로 확인한다 */
const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/points']}>
        <Routes>
          <Route path="/points" element={<PointsPage />} />
          <Route path="/points/:pointSeq" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  resetPointStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('PointsPage — 목록 조회', () => {
  it('선택한 사업장의 지점 목록을 테이블로 렌더한다', async () => {
    renderPage()

    expect(await screen.findByText('정문 입구')).toBeInTheDocument()
    // 전체 폭 테이블이 되면서 생긴 컬럼들
    expect(screen.getByText('소속 코스')).toBeInTheDocument()
    expect(screen.getByText('최근 순찰')).toBeInTheDocument()
    expect(screen.getByText('사용여부')).toBeInTheDocument()
  })

  it('다른 사업장을 선택하면 그 사업장의 지점만 보인다', async () => {
    setSite(8, '강동 그랜드타워')
    renderPage()

    expect(await screen.findByText('외벽 남측')).toBeInTheDocument()
    expect(screen.queryByText('정문 입구')).not.toBeInTheDocument()
  })

  it('🔴 미사용 지점도 목록에 함께 나온다 — 서버가 제외하지 않는다(실측)', async () => {
    renderPage()

    // mock 의 pointSeq 9 는 useYn: false
    expect(await screen.findByText('비상구 B')).toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument()
  })
})

describe('PointsPage — 상세 이동', () => {
  it('🔴 행을 클릭하면 상세 라우트로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('로비 1층'))

    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
  })

  it('좌/우 2단 구조가 남아 있지 않다 — 첫 행이 자동 선택되지 않는다', async () => {
    renderPage()

    await screen.findByText('정문 입구')
    // 022 판은 첫 행을 자동 선택해 우측 패널에 같은 이름이 두 번 떴다.
    expect(screen.getAllByText('정문 입구')).toHaveLength(1)
    expect(screen.queryByText('DETAIL_ROUTE')).not.toBeInTheDocument()
  })
})

describe('PointsPage — 빈 목록 · 실패 · 미선택', () => {
  it('지점이 0건이면 장애가 아니라 빈 목록 안내를 보여준다', async () => {
    // 권한 밖/빈 사업장: 서버는 403 이 아니라 200 + 빈 목록을 준다 (B-9)
    setSite(999, '없는 사업장')
    renderPage()

    expect(await screen.findByText('등록된 지점이 없습니다.')).toBeInTheDocument()
  })

  it('🔴 목록 조회 실패는 빈 목록과 구분해 보여준다', async () => {
    server.use(
      http.get(GET_POINT_LIST_PATH, () =>
        HttpResponse.json({ message: '서버 오류입니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    renderPage()

    expect(await screen.findByText('지점 목록을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
    expect(screen.queryByText('등록된 지점이 없습니다.')).not.toBeInTheDocument()
  })

  it('🔴 사업장이 선택되지 않았으면 조회를 시도하지 않는다', async () => {
    clearTokens() // siteSeq 도 함께 지워진다(spec 021 DoD #9)
    let requested = false
    server.use(
      http.get(GET_POINT_LIST_PATH, () => {
        requested = true
        return HttpResponse.json({ message: '', data: null, code: 200 })
      })
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('코스/지점')).toBeInTheDocument())
    expect(requested).toBe(false)
  })
})
