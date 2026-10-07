import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import PointsPage from '../PointsPage'
import { server } from '@/mocks/server'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/points` 실 API(MSW) 전환 검증 — `spec 022` Phase 3.
 *
 * 🔴 `siteSeq` 는 URL 이 아니라 **선택 결과**(localStorage)에서 온다(spec 021).
 * 그래서 토큰 + `setSite` 를 심어야 조회가 나간다. MSW 핸들러는 `siteSeq` 로 지점을
 * 갈라 두었으므로(7: 10건 / 8: 5건) 사업장이 실제로 구분되는지도 함께 드러난다.
 */

const GET_POINT_LIST_PATH = '/api/v1/Point/W/sign/GetPointList'

const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/points']}>
        <PointsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 좌측 목록의 행 버튼들. 상세 패널의 수정/삭제 버튼과 섞이지 않게 이름으로 고른다 */
const listRows = () =>
  screen.getAllByRole('button').filter((button) => /\d/.test(button.textContent ?? ''))

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('PointsPage — 목록 조회', () => {
  it('선택한 사업장의 지점 목록을 서버에서 받아 렌더한다', async () => {
    renderPage()

    // 구 mock 의 첫 지점이 서버 스키마(pointName)로 내려온다
    expect(await screen.findByText('정문 입구')).toBeInTheDocument()
  })

  it('다른 사업장을 선택하면 그 사업장의 지점만 보인다', async () => {
    setSite(8, '강동 그랜드타워')
    renderPage()

    // siteSeq 8 은 pointSeq 11~15 (핸들러의 SITE_OF)
    expect(await screen.findByText('외벽 남측')).toBeInTheDocument()
    expect(screen.queryByText('정문 입구')).not.toBeInTheDocument()
  })

  it('첫 진입 시 첫 행이 자동 선택되고 상세가 채워진다', async () => {
    renderPage()

    await waitFor(() => expect(listRows().length).toBeGreaterThan(0))
    // 상세 카드 헤더가 첫 지점 이름으로 채워진다(목록 + 상세 = 2곳에 등장)
    await waitFor(() => expect(screen.getAllByText('정문 입구').length).toBeGreaterThan(1))
  })

  it('행을 선택하면 그 지점의 상세를 따로 조회한다', async () => {
    const user = userEvent.setup()
    renderPage()

    const row = await screen.findByText('로비 1층')
    await user.click(row)

    // 상세에만 있는 값(TAG ID)이 나타난다 — 목록 응답에는 nfcTagId 가 있지만 TAG ID 행은 상세 전용
    expect(await screen.findByText('04A1B2C3D4E5F6')).toBeInTheDocument()
  })

  it('상세에는 목록에 없는 소속 코스가 표시된다', async () => {
    renderPage()

    // pointSeq 1 은 핸들러에서 'A동 순찰코스' 에 속한다
    expect(await screen.findByText('A동 순찰코스')).toBeInTheDocument()
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

    expect(await screen.findByText('다시 시도')).toBeInTheDocument()
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

  it('상세 조회가 실패해도 목록은 유지된다', async () => {
    server.use(
      http.get('/api/v1/Point/W/sign/DetailPoint', () =>
        HttpResponse.json({ message: '상세를 불러올 수 없습니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    renderPage()

    expect(await screen.findByText('지점 정보를 불러오지 못했습니다')).toBeInTheDocument()
    // 목록은 그대로 있어야 다른 지점으로 이동할 수 있다
    const list = await waitFor(() => {
      const rows = listRows()
      expect(rows.length).toBeGreaterThan(0)
      return rows
    })
    expect(within(list[0]).getByText('정문 입구')).toBeInTheDocument()
  })
})
