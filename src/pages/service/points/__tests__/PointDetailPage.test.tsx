import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import PointDetailPage from '../PointDetailPage'
import { server } from '@/mocks/server'
import { resetPointStore } from '@/mocks/handlers/points'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/points/:pointSeq` — `spec 027` Phase 1·2 에서 **라우트로 분리된 상세**.
 *
 * 🔴 **여기서 고정하는 두 가지**
 * 1. **삭제 성공 → 목록 복귀 / 실패 → 머문다**(spec 규칙 13). 거부인데 화면이 바뀌면
 *    사용자는 **삭제된 것으로 오해한다.** 022 에서는 "선택 해제" 였고 027 에서 "이동"
 *    으로 바뀌었다 — 잘못하면 거부에도 목록으로 튕긴다.
 * 2. **없는 `pointSeq` 는 `/404` 가 아니다**(spec §4). 서버는 400 + 래퍼를 주는데
 *    이는 "경로가 없다" 가 아니라 **삭제됐거나 다른 사업장**이라는 뜻이다.
 *    목록으로 돌아갈 수단과 함께 안내한다.
 */

const DELETE_POINT_PATH = '/api/v1/Point/W/sign/DeletePoint'

const renderAt = (path: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/points" element={<div>LIST_ROUTE</div>} />
          <Route path="/points/:pointSeq" element={<PointDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 삭제 버튼 → 확인 모달 → 확인 */
const confirmDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: '삭제' }))
  await user.click(await screen.findByRole('button', { name: '확인' }))
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

describe('PointDetailPage — 진입', () => {
  it('🔴 URL 로 직접 들어가도 상세가 뜬다 — 새로고침에서 날아가지 않는다', async () => {
    renderAt('/points/1')

    expect(await screen.findByText('정문 입구')).toBeInTheDocument()
  })

  it('목록으로 돌아가는 링크가 있다', async () => {
    renderAt('/points/1')

    await screen.findByText('정문 입구')
    expect(screen.getByRole('link', { name: '목록으로' })).toBeInTheDocument()
  })

  it('소속 코스·인증수단 섹션을 그린다', async () => {
    renderAt('/points/1')

    expect(await screen.findByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('인증 수단')).toBeInTheDocument()
  })

  it('미사용 지점은 헤더에 미사용 뱃지를 단다', async () => {
    // mock 의 pointSeq 9 는 useYn: false
    renderAt('/points/9')

    expect(await screen.findByText('비상구 B')).toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument()
  })
})

describe('PointDetailPage — 찾을 수 없는 지점', () => {
  it('🔴 없는 pointSeq 는 안내 + 목록 복귀 수단으로 처리한다 (/404 아님)', async () => {
    renderAt('/points/999999')

    expect(await screen.findByText('지점을 찾을 수 없습니다')).toBeInTheDocument()
    // 🔴 목록으로 돌아갈 수단이 남아 있어야 한다 — 막다른 길이 되면 안 된다
    expect(screen.getByRole('link', { name: '목록으로' })).toBeInTheDocument()
  })

  it('🔴 숫자가 아닌 경로는 조회조차 하지 않는다', async () => {
    let requested = false
    server.use(
      http.get('/api/v1/Point/W/sign/DetailPoint', () => {
        requested = true
        return HttpResponse.json({ message: '', data: null, code: 200 })
      })
    )

    renderAt('/points/abc')

    expect(await screen.findByText('지점을 찾을 수 없습니다')).toBeInTheDocument()
    expect(requested).toBe(false)
  })
})

describe('PointDetailPage — 삭제 후 이동', () => {
  it('삭제에 성공하면 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    // pointSeq 4 는 코스에 편성돼 있지 않아 삭제가 허용된다
    renderAt('/points/4')
    await screen.findByText('지하 주차장 B1')

    await confirmDelete(user)

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
  })

  it('🔴 삭제가 거부되면 상세에 머문다 — 화면이 바뀌면 삭제된 것으로 오해한다', async () => {
    const user = userEvent.setup()
    // pointSeq 1 은 코스에 편성돼 있어 mock 이 거부한다
    renderAt('/points/1')
    await screen.findByText('정문 입구')

    await confirmDelete(user)

    await waitFor(() => expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled())
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
    expect(screen.getByText('정문 입구')).toBeInTheDocument()
  })

  it('확인하지 않고 취소하면 요청이 나가지 않는다', async () => {
    const user = userEvent.setup()
    let requested = false
    server.use(
      http.delete(DELETE_POINT_PATH, () => {
        requested = true
        return HttpResponse.json({ message: '', data: null, code: 200 })
      })
    )
    renderAt('/points/4')
    await screen.findByText('지하 주차장 B1')

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(requested).toBe(false)
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
  })
})
