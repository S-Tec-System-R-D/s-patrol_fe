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

    expect(await screen.findByRole('heading', { name: '정문 입구' })).toBeInTheDocument()
  })

  it('🔴 브레드크럼이 "어느 화면인가", 제목이 "어느 지점인가" 를 답한다', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    // 브레드크럼 — 첫 조각이 목록 링크를 겸한다
    expect(screen.getByRole('link', { name: '코스/지점' })).toBeInTheDocument()
    expect(screen.getByText('지점 상세')).toBeInTheDocument()
    // 제목 = 지점명
    expect(screen.getByRole('heading', { name: '정문 입구' })).toBeInTheDocument()
  })

  it('제목 옆에 사용 뱃지가 있다', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    expect(screen.getByText('사용')).toBeInTheDocument()
  })

  it('소속 코스·인증수단 섹션을 그린다', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    // '소속 코스' 는 통계 칸과 섹션 제목 두 곳에 나온다
    expect(screen.getAllByText('소속 코스').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('인증 수단')).toBeInTheDocument()
    // 코스명은 소속 코스·순찰 기록 두 곳에 나온다
    expect(screen.getAllByText('A동 순찰코스').length).toBeGreaterThan(0)
  })

  it('미사용 지점은 헤더에 미사용 뱃지를 단다', async () => {
    // mock 의 pointSeq 9 는 useYn: false
    renderAt('/points/9')

    expect(await screen.findByRole('heading', { name: '비상구 B' })).toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument()
  })
})

describe('PointDetailPage — 찾을 수 없는 지점', () => {
  it('🔴 없는 pointSeq 는 안내 + 목록 복귀 수단으로 처리한다 (/404 아님)', async () => {
    renderAt('/points/999999')

    expect(await screen.findByText('지점을 찾을 수 없습니다')).toBeInTheDocument()
    // 🔴 목록으로 돌아갈 수단이 남아 있어야 한다 — 막다른 길이 되면 안 된다
    expect(screen.getByRole('link', { name: '코스/지점' })).toBeInTheDocument()
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
    await screen.findByRole('heading', { name: '지하 주차장 B1' })

    await confirmDelete(user)

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
  })

  it('🔴 삭제가 거부되면 상세에 머문다 — 화면이 바뀌면 삭제된 것으로 오해한다', async () => {
    const user = userEvent.setup()
    // pointSeq 1 은 코스에 편성돼 있어 mock 이 거부한다
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await confirmDelete(user)

    await waitFor(() => expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled())
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '정문 입구' })).toBeInTheDocument()
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
    await screen.findByRole('heading', { name: '지하 주차장 B1' })

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(requested).toBe(false)
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
  })
})

describe('PointDetailPage — 수정 모달', () => {
  const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

  it('수정 모달은 상세 값이 채워진 폼으로 열린다', async () => {
    const user = userEvent.setup()
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구')
  })

  it('저장이 성공하면 모달이 닫힌다', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(UPDATE_POINT_PATH, () =>
        HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
      )
    )
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await user.click(screen.getByRole('button', { name: '수정' }))
    await user.click(await screen.findByRole('button', { name: '저장' }))

    await waitFor(() =>
      expect(screen.queryByPlaceholderText('지점명을 입력해주세요')).not.toBeInTheDocument()
    )
  })

  it('🔴 저장이 실패하면 모달이 열린 채 남는다 — 입력값이 사라지면 안 된다', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(UPDATE_POINT_PATH, () =>
        HttpResponse.json({ message: '서버 오류입니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await user.click(screen.getByRole('button', { name: '수정' }))
    const name = await screen.findByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(screen.getByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구(수정)')
  })
})

/** 🔴 `spec 027` Phase 3 — 목업 8섹션 중 6개 구현 / 2개 placeholder */
describe('PointDetailPage — 상세 확장(Phase 3)', () => {
  it('통계 3칸을 그린다 — QR 발행 칸은 없다(B-23)', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    expect(screen.getByText('30일 인증')).toBeInTheDocument()
    // '최근 순찰'·'소속 코스' 는 기본정보 행·섹션 제목과도 겹친다
    expect(screen.getAllByText('최근 순찰').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('소속 코스').length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText('QR 발행')).not.toBeInTheDocument()
  })

  it('순찰 인증 기록 섹션에 이력이 들어온다', async () => {
    renderAt('/points/1')

    expect(await screen.findByText('순찰 인증 기록')).toBeInTheDocument()
    // mock 은 3의 배수가 아닌 지점에 기록을 준다
    await waitFor(() =>
      expect(screen.queryByText('순찰 기록이 없습니다')).not.toBeInTheDocument()
    )
  })

  it('🔴 기록이 0건이면 빈 상태다 — placeholder 가 아니다', async () => {
    // mock: pointSeq % 3 === 0 은 미순찰
    renderAt('/points/3')

    expect(await screen.findByText('순찰 기록이 없습니다')).toBeInTheDocument()
    // 기능은 있고 데이터가 없는 것이므로 "준비 중" 이 아니다
    const pendings = screen.getAllByText('준비 중')
    expect(pendings.length).toBeGreaterThan(0) // 다른 섹션의 placeholder 는 있다
  })

  it('🔴 변경 이력·QR 섹션이 placeholder 로 남아 있다 — 지우지 않았다(OQ-027-E)', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    expect(screen.getByText('변경 이력')).toBeInTheDocument()
    expect(screen.getByText('QR 코드')).toBeInTheDocument()
    // 막힌 이유가 적혀 있어야 한다 — 이유 없는 "준비 중" 은 언제 풀리는지 알 수 없다
    expect(screen.getByText(/변경 이력 API가 필요합니다/)).toBeInTheDocument()
    expect(screen.getByText(/발행 메타가 없고/)).toBeInTheDocument()
  })

  it('같은 사업장의 다른 지점을 보여주고 현재 지점을 표시한다', async () => {
    renderAt('/points/1')

    expect(await screen.findByText('같은 사업장의 다른 지점')).toBeInTheDocument()
    expect(screen.getByText('현재')).toBeInTheDocument()
    // 다른 지점은 링크다
    expect(screen.getByRole('link', { name: /로비 1층/ })).toBeInTheDocument()
  })
})
