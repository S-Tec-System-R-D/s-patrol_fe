import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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

/** 머리 `⋯` → `삭제` (076 — 코스 상세와 같은 메뉴) */
const openDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: '지점 메뉴' }))
  await user.click(await screen.findByRole('menuitem', { name: '삭제' }))
}

/** 메뉴 → 확인 모달 → 삭제(060 — 확인 버튼은 액션 이름 그대로) */
const confirmDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await openDelete(user)
  await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '삭제' }))
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

  it('속성 패널에 소속 코스 · 인증수단 행을 그린다 (076)', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    expect(screen.getByText('소속 코스')).toBeInTheDocument()
    expect(screen.getByText('인증수단')).toBeInTheDocument()
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
    /**
     * 🔴 **거부를 핸들러로 직접 만든다.** 022 에서는 "코스에 편성된 지점은 mock 이
     * 거부한다" 에 기댔는데, 실측(2026-10-10) 결과 **서버는 거부하지 않아**
     * 그 가정을 걷어냈다(OQ-10). 거부 **처리**는 다른 비즈니스 오류에서 여전히
     * 유효하므로, 데이터가 아니라 **응답을 스텁해** 그 경로만 고정한다.
     */
    server.use(
      http.delete(DELETE_POINT_PATH, () =>
        HttpResponse.json(
          { message: '삭제할 수 없습니다.', data: false, code: 400 },
          { status: 400 }
        )
      )
    )
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await confirmDelete(user)

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
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

    await openDelete(user)
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(requested).toBe(false)
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
  })
})

describe('PointDetailPage — 수정 모달', () => {
  const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

  it('🔴 머리에는 `⋯`(삭제)만 — 수정은 속성 패널의 기본정보 제목 줄 (076 · 029)', async () => {
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    expect(screen.getByRole('button', { name: '지점 메뉴' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '기본정보 수정' })).toBeInTheDocument()
  })

  it('수정 모달은 상세 값이 채워진 폼으로 열린다', async () => {
    const user = userEvent.setup()
    renderAt('/points/1')
    await screen.findByRole('heading', { name: '정문 입구' })

    await user.click(screen.getByRole('button', { name: '기본정보 수정' }))

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

    await user.click(screen.getByRole('button', { name: '기본정보 수정' }))
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

    await user.click(screen.getByRole('button', { name: '기본정보 수정' }))
    const name = await screen.findByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(screen.getByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구(수정)')
  })
})

/** 🔄 `spec 076` — 인증 기록(요약 3칸 · 14일 쌓은 막대 · 날짜별 묶음) */
describe('PointDetailPage — 인증 기록 (076)', () => {
  it('요약 3칸(인증 · 미인증 · 최근 순찰)과 날짜별 묶음을 그린다', async () => {
    renderAt('/points/1')

    expect(await screen.findByText('인증 기록')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('region', { name: /기록$/ }).length).toBeGreaterThan(0))
    expect(screen.getAllByText('미인증').length).toBeGreaterThan(0)
    expect(screen.getByText('최근 순찰')).toBeInTheDocument()
    expect(screen.getByText('최근 14일 전체 · 막대를 누르면 해당 일자만 표시')).toBeInTheDocument()
  })

  it('🔴 행은 지점 인증 상세로 간다 — 회차 번호(historySeq)가 없어 회차 모달은 못 연다 (D1)', async () => {
    renderAt('/points/1')

    const groups = await screen.findAllByRole('region', { name: /기록$/ })
    const link = within(groups[0]).getAllByRole('link')[0]
    expect(link.getAttribute('href')).toMatch(/^\/patrol\/points\/\d+$/)
  })

  it('🔴 기록이 0건이면 빈 상태다 — placeholder 가 아니다', async () => {
    // mock: pointSeq % 3 === 0 은 미순찰
    renderAt('/points/3')

    expect(await screen.findByText('순찰 기록이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('🔴 변경 이력 · 같은 사업장의 다른 지점 · QR/NFC 전환 카드는 없다', async () => {
    renderAt('/points/1')

    await screen.findByRole('heading', { name: '정문 입구' })
    expect(screen.queryByText('변경 이력')).not.toBeInTheDocument()
    expect(screen.queryByText('같은 사업장의 다른 지점')).not.toBeInTheDocument()
    expect(screen.queryByText('출력 후 현장 부착')).not.toBeInTheDocument()
    // 지점 1은 QR — 내려받기만(029 보안)
    expect(screen.getByRole('button', { name: /QR 코드 내려받기/ })).toBeInTheDocument()
  })

  it('🔴 행 상태는 순찰이력 화면과 같은 뱃지다 — 날짜 줄에 미완료 수를 따로 적지 않는다', async () => {
    renderAt('/points/1')

    const groups = await screen.findAllByRole('region', { name: /기록$/ })
    const labels = groups.flatMap((group) =>
      within(group).queryAllByText(/^(순찰기록|미인증|순찰제외|진행중|대기중)$/)
    )
    expect(labels.length).toBeGreaterThan(0)
    // 🔴 정상 인증은 뱃지가 없다 — 줄마다 반복되면 뱃지가 의미를 잃는다(2026-11-13)
    expect(screen.queryByText('이상없음')).not.toBeInTheDocument()
    expect(screen.queryByText(/^누락/)).not.toBeInTheDocument()
  })
})
