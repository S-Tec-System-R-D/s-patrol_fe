import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AddCourseForm from '../AddCourseForm'
import { server } from '@/mocks/server'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { clearSite, setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * 코스 생성 (`spec 023` Phase 4, T361).
 *
 * 🔴 **가장 중요한 단정은 "`points` 키가 바디에 없다" 는 것이다.** `AddCourse` 는
 * `points` 를 **무시**하면서 **200 + `data: true`** 를 준다(실측 B-27) — 즉 보내면
 * 성공으로 보이면서 **지점 없는 코스**가 만들어진다. 이 테스트가 깨지는 날은 누가
 * 생성 모달에 지점 선택을 붙인 날이고, 그때 사용자는 조용히 반쪽 결과를 받는다.
 */

const ADD_COURSE_PATH = '/api/v1/Course/W/sign/AddCourse'

const renderForm = (onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <AddCourseForm onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return { onSuccess }
}

/** 전송 바디를 수집하는 핸들러를 끼운다(022·023 선례) */
const captureBody = () => {
  const captured: Record<string, unknown>[] = []
  server.use(
    http.post(ADD_COURSE_PATH, async ({ request }) => {
      captured.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
    })
  )
  return captured
}

const fill = async (user: ReturnType<typeof userEvent.setup>, name: string, memo?: string) => {
  await user.type(screen.getByPlaceholderText('코스명을 입력해주세요'), name)
  if (memo) await user.type(screen.getByPlaceholderText('설명을 입력해주세요'), memo)
  await user.click(screen.getByRole('button', { name: '생성' }))
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

describe('AddCourseForm — 전송 바디', () => {
  it('🔴 points 키가 **없다** — 보내도 무시되고 200 이 와서 조용히 반쪽이 된다 (B-27)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).not.toHaveProperty('points')
  })

  it('siteSeq 는 사업장 선택값에서 온다 (OQ-9)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() => expect(captured[0]?.siteSeq).toBe(7))
  })

  it('🔴 totalMin 은 null 로 나간다 — 서버가 구간시간 합으로 채운다 (B-31)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() => expect(captured[0]).toHaveProperty('totalMin', null))
  })

  it('설명이 비면 null 로 보낸다 — 빈 문자열과 구분할 이유가 없다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() => expect(captured[0]?.memo).toBeNull())
  })

  it('새 코스는 활성·교대 미허용으로 시작한다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, 'C동 순찰코스', '설명')

    await waitFor(() => expect(captured[0]).toMatchObject({ useYn: true, switchYn: false }))
  })
})

describe('AddCourseForm — 검증·안내', () => {
  it('코스명이 짧으면 제출되지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await fill(user, '가')

    expect(await screen.findByText('두 글자 이상 입력해주세요.')).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })

  it('🔴 "지점은 어디서 넣는가" 를 모달 안에서 알려 준다 — 닫은 뒤에 묻게 하지 않는다', () => {
    renderForm()

    expect(screen.getByText(/코스 상세/)).toBeInTheDocument()
  })

  it('🔴 지점 선택 수단이 없다 — 보내도 무시되기 때문이다 (B-27)', () => {
    renderForm()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/지점 추가/)).not.toBeInTheDocument()
  })

  it('🔴 "총 소요시간" 입력란이 없다 — 파생 값이다 (B-31)', () => {
    renderForm()

    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
  })

  it('성공하면 onSuccess 가 불린다 — 닫기는 부모가 한다', async () => {
    const user = userEvent.setup()
    const { onSuccess } = renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('🔴 실패하면 닫지 않는다 — 입력값이 사라지면 다시 타이핑해야 한다', async () => {
    const user = userEvent.setup()
    server.use(
      http.post(ADD_COURSE_PATH, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })
      )
    )
    const { onSuccess } = renderForm()

    await fill(user, 'C동 순찰코스')

    await waitFor(() =>
      expect(screen.getByPlaceholderText('코스명을 입력해주세요')).toHaveValue('C동 순찰코스')
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('🔴 사업장이 없으면 제출할 수 없다 — siteSeq 없이 보내면 엉뚱한 곳에 들어간다', async () => {
    clearSite()
    renderForm()

    expect(screen.getByRole('button', { name: '생성' })).toBeDisabled()
    expect(screen.getByText(/사업장이 선택되지 않아/)).toBeInTheDocument()
  })
})
