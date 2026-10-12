import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import EditCourseForm from '../EditCourseForm'
import { server } from '@/mocks/server'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'
import type { CourseDetail, UpdateCourseRequest } from '../../types'

/**
 * 코스 기본정보 수정 (`spec 023` Phase 4, T362).
 *
 * 🔴🔴 **여기서 막는 사고는 "코스명만 고쳤는데 지점이 전부 사라지는 것" 이다.**
 * `UpdateCourse` 의 `points` 는 **전체 교체**라(B-25) 바디에서 빼면 편성이 삭제되고
 * **200 이 온다.** 그래서 "이름을 바꾸는 요청에 지점 2개가 전량 실려 나가는지" 를
 * 본다 — 이상하게 보이는 단정이 맞는 단정이다.
 */

const UPDATE_COURSE_PATH = '/api/v1/Course/W/sign/UpdateCourse'

const course: CourseDetail = {
  courseSeq: 12,
  courseName: 'A동 순찰코스',
  memo: '야간 2회',
  useYn: true,
  switchYn: false,
  totalMin: 45,
  points: [
    {
      coursePointSeq: 101,
      pointSeq: 1,
      pointName: '정문 입구',
      authMethod: 9,
      orderNo: 1,
      useYn: true,
      courseMin: 10,
    },
    {
      coursePointSeq: 102,
      pointSeq: 2,
      pointName: '주차장',
      authMethod: 10,
      orderNo: 2,
      useYn: false,
      courseMin: 35,
    },
  ],
}

const renderForm = (onSuccess = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <EditCourseForm course={course} onSuccess={onSuccess} />
    </QueryClientProvider>
  )
  return { onSuccess }
}

const captureBody = () => {
  const captured: UpdateCourseRequest[] = []
  server.use(
    http.put(UPDATE_COURSE_PATH, async ({ request }) => {
      captured.push((await request.json()) as UpdateCourseRequest)
      return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
    })
  )
  return captured
}

const save = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: '저장' }))

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('EditCourseForm — 기존 값에서 시작한다', () => {
  it('🔴 상세 응답을 defaultValues 로 넣는다 — 빈 값에서 시작하면 한 필드만 고쳐도 나머지가 덮인다', () => {
    renderForm()

    expect(screen.getByPlaceholderText('코스명을 입력해주세요')).toHaveValue('A동 순찰코스')
    expect(screen.getByPlaceholderText('설명을 입력해주세요')).toHaveValue('야간 2회')
  })
})

describe('EditCourseForm — 🔴 전량 전송 (B-25)', () => {
  it('🔴 코스명만 바꿔도 points 가 **전량** 나간다 — 빼면 편성이 전부 삭제된다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.clear(screen.getByPlaceholderText('코스명을 입력해주세요'))
    await user.type(screen.getByPlaceholderText('코스명을 입력해주세요'), 'A동 순찰코스(개편)')
    await save(user)

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].courseName).toBe('A동 순찰코스(개편)')
    expect(captured[0].points).toHaveLength(2)
    expect(captured[0].points.map((point) => point.coursePointSeq)).toEqual([101, 102])
  })

  it('🔴 courseSeq 가 반드시 들어간다 — 누락 시 401 → 인터셉터가 토큰 만료로 오해한다 (B-28)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await save(user)

    await waitFor(() => expect(captured[0]?.courseSeq).toBe(12))
    expect(captured[0].siteSeq).toBe(7)
  })

  it('🔴 orderNo 를 보존한다 — 이 모달은 순서를 건드리지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await save(user)

    await waitFor(() => expect(captured[0]?.points.map((point) => point.orderNo)).toEqual([1, 2]))
  })

  it('🔴 설명을 비우면 null 이 나간다 — 코스는 실제로 비워진다 (지점과 반대, 규칙 6)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderForm()

    await user.clear(screen.getByPlaceholderText('설명을 입력해주세요'))
    await save(user)

    await waitFor(() => expect(captured[0]?.memo).toBeNull())
  })

  it('🔴 활성화·교대 허용을 이 모달에서 바꾸지 않는다 — 각자 토글이 있다', () => {
    renderForm()

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})

describe('EditCourseForm — 성공·실패', () => {
  it('성공하면 onSuccess 가 불린다', async () => {
    const user = userEvent.setup()
    // ⚠️ 기본 핸들러는 **없는 courseSeq(12)에 400** 을 준다(실측 동작). 성공 경로를 보려면
    // 수집 핸들러를 끼운다 — mock 저장소에 12번 코스를 심는 것보다 의도가 분명하다
    captureBody()
    const { onSuccess } = renderForm()

    await save(user)

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })

  it('🔴 실패하면 닫지 않고 입력값을 유지한다', async () => {
    const user = userEvent.setup()
    server.use(
      http.put(UPDATE_COURSE_PATH, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })
      )
    )
    const { onSuccess } = renderForm()

    await user.clear(screen.getByPlaceholderText('코스명을 입력해주세요'))
    await user.type(screen.getByPlaceholderText('코스명을 입력해주세요'), '바꾼 이름')
    await save(user)

    await waitFor(() =>
      expect(screen.getByPlaceholderText('코스명을 입력해주세요')).toHaveValue('바꾼 이름')
    )
    expect(onSuccess).not.toHaveBeenCalled()
  })
})
