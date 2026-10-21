import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetNoticeStore } from '@/mocks/handlers/notices'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import NoticeDetailPage from '../NoticeDetailPage'

/**
 * `/notice/:noticeSeq` 공지 상세 — `spec 026` US2 에서 **서버 상세 + 2열 골격**으로 바꿨다.
 *
 * 🔴 이전 테스트는 mock 배열의 문자열 id 로 찾았다 — 서버 키(`noticeSeq`)로 전부 대체한다.
 * 시드(`mocks/handlers/notices.ts`): 4 = 이미지 2 + 파일 2 · 2 = 첨부 없음 · 5 = 고정.
 */

const DETAIL_PATH = '/api/v1/Notice/W/sign/DetailNotice'

const renderAt = (noticeSeq: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/notice/${noticeSeq}`]}>
        <Routes>
          <Route path="/notice" element={<div>LIST_ROUTE</div>} />
          <Route path="/notice/:noticeSeq" element={<NoticeDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const captureDetailCalls = () => {
  const calls: string[] = []
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname === DETAIL_PATH) calls.push(request.url)
  })
  return calls
}

beforeEach(() => {
  resetNoticeStore()
  clearTokens()
  setAccessToken(makeAccessToken())
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('NoticeDetailPage — 정상', () => {
  it('제목·작성자/작성일시 부제·본문을 그린다', async () => {
    renderAt('4')

    expect(
      await screen.findByRole('heading', { name: '6월 정기 순찰 점검 안내' })
    ).toBeInTheDocument()
    expect(screen.getByText('이현장 · 2026-05-28 10:30')).toBeInTheDocument()
    expect(screen.getByText(/6월 1일부터 정기 순찰 점검이 시행됩니다/)).toBeInTheDocument()
    // 🔴 기본정보 카드는 없다 — 부제·핀·첨부 카드 제목이 같은 말을 이미 한다
    expect(screen.queryByText('기본정보')).not.toBeInTheDocument()
    expect(screen.getByText('이미지 2')).toBeInTheDocument()
    expect(screen.getByText('첨부파일 2')).toBeInTheDocument()
  })

  it('브레드크럼으로 목록에 돌아간다', async () => {
    renderAt('4')

    const crumb = await screen.findByRole('navigation', { name: '현재 위치' })
    expect(within(crumb).getByRole('link', { name: '공지사항' })).toHaveAttribute('href', '/notice')
  })

  it('첨부파일을 링크로 나열한다', async () => {
    renderAt('4')

    const link = await screen.findByRole('link', { name: /6월_순찰점검_안내\.pdf/ })
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: /점검표_양식\.xlsx/ })).toBeInTheDocument()
  })

  it('🔴 이미지가 실패하면 첨부마다 폴백으로 바뀐다 (B-40)', async () => {
    renderAt('4')

    const images = await screen.findAllByRole('img')
    expect(images).toHaveLength(2)
    fireEvent.error(images[0])

    expect(await screen.findByText('이미지를 불러올 수 없습니다')).toBeInTheDocument()
    // 🔴 나머지 한 장은 그대로다 — 실패 상태는 이미지마다 따로 든다
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('🔴 이미지·파일이 없으면 그 영역 자체가 없다', async () => {
    renderAt('2')

    await screen.findByRole('heading', { name: '야간 순찰 강화 공지' })
    expect(screen.queryByText(/^이미지 \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/^첨부파일 \d/)).not.toBeInTheDocument()
  })

  it('고정 공지는 제목 옆에 핀 아이콘을 단다', async () => {
    renderAt('5')

    await screen.findByRole('heading', { name: '사업장 출입 보안 수칙' })
    expect(screen.getByLabelText('고정 공지')).toBeInTheDocument()
  })

  it('고정이 아니면 핀이 없다', async () => {
    renderAt('4')

    await screen.findByRole('heading', { name: '6월 정기 순찰 점검 안내' })
    expect(screen.queryByLabelText('고정 공지')).not.toBeInTheDocument()
  })

  it('수정 모달이 서버 값으로 채워진다', async () => {
    const user = userEvent.setup()
    renderAt('4')

    await user.click(await screen.findByRole('button', { name: '수정' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByDisplayValue('6월 정기 순찰 점검 안내')).toBeInTheDocument()
    // 기존 첨부 4개가 이름으로 나온다(미리보기 없음 — B-40)
    expect(within(dialog).getByText('점검_구역_안내.jpg')).toBeInTheDocument()
    expect(within(dialog).getByText('점검표_양식.xlsx')).toBeInTheDocument()
  })

  it('수정을 저장하면 모달이 닫히고 상세가 새 값으로 갱신된다 (spec 040 US2)', async () => {
    const user = userEvent.setup()
    renderAt('4')

    await user.click(await screen.findByRole('button', { name: '수정' }))
    const dialog = await screen.findByRole('dialog')
    const title = within(dialog).getByDisplayValue('6월 정기 순찰 점검 안내')
    await user.clear(title)
    await user.type(title, '바뀐 제목')
    await user.click(within(dialog).getByRole('button', { name: '점검_구역_안내.jpg 삭제' }))
    await user.click(within(dialog).getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('heading', { name: '바뀐 제목' })).toBeInTheDocument()
    expect(screen.getByText('이미지 1')).toBeInTheDocument()
  })

  it('삭제를 확인하면 목록으로 돌아간다 (mock)', async () => {
    const user = userEvent.setup()
    renderAt('4')

    await user.click(await screen.findByRole('button', { name: '삭제' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: /삭제|확인/ }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
  })
})

describe('NoticeDetailPage — 상태 분기', () => {
  it('🔴 주소가 숫자가 아니면 요청 없이 즉시 오류 — 스켈레톤이 남지 않는다', () => {
    const calls = captureDetailCalls()
    renderAt('abc')

    expect(screen.getByText('주소가 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /공지사항 목록으로/ })).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('🔴 조회 실패는 "삭제되었다" 고 단정하지 않고 다시 시도·목록으로를 준다', async () => {
    server.use(http.get(DETAIL_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderAt('4')

    expect(await screen.findByText('공지를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /공지사항 목록으로/ })).toBeInTheDocument()
    expect(screen.queryByText(/삭제/)).not.toBeInTheDocument()
  })

  it('없는 공지도 같은 실패 화면이다', async () => {
    renderAt('999')

    await waitFor(() => expect(screen.getByText('공지를 불러오지 못했습니다')).toBeInTheDocument())
  })
})
