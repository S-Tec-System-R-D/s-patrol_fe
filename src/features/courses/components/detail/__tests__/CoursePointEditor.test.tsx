import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CoursePointEditor from '../CoursePointEditor'
import { server } from '@/mocks/server'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'
import type { CourseDetail, UpdateCourseRequest } from '../../../types'

/**
 * 지점 편성 편집 모드 (`spec 023` Phase 4, T367·T368).
 *
 * ⚠️ **드래그 자체는 여기서 시험하지 않는다.** `dnd-kit` 은 `getBoundingClientRect` 로
 * 레이아웃을 측정하는데 jsdom 에서는 전부 0 이라 센서가 움직이지 않는다. 순서 계산은
 * `lib/coursePointOrder.ts` 의 순수 함수로 꺼내 단위 테스트가 전담하고(1..N 재부여 포함),
 * 실제 드래그 동작은 브라우저 확인(T377) 몫이다. 여기서는 **추가·제거·구간시간·저장
 * 바디·실패 복구**를 본다.
 */

const UPDATE_COURSE_PATH = '/api/v1/Course/W/sign/UpdateCourse'

const course: CourseDetail = {
  courseSeq: 12,
  courseName: 'A동 순찰코스',
  memo: null,
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

const renderEditor = (onClose = vi.fn(), detail: CourseDetail = course) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CoursePointEditor course={detail} onClose={onClose} />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { onClose }
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

const failOnSave = () =>
  server.use(
    http.put(UPDATE_COURSE_PATH, () =>
      HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })
    )
  )

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('CoursePointEditor — 화면', () => {
  it('현재 편성을 orderNo 순으로 그린다', () => {
    renderEditor()

    const rows = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(rows[0]).toContain('정문 입구')
    expect(rows[1]).toContain('주차장')
  })

  it('드래그 핸들·구간시간·제거 수단이 행마다 있다', () => {
    renderEditor()

    expect(screen.getByRole('button', { name: '정문 입구 순서 변경' })).toBeInTheDocument()
    expect(screen.getByLabelText('정문 입구 구간시간(분)')).toHaveValue(10)
    expect(screen.getByRole('button', { name: '정문 입구 편성 제거' })).toBeInTheDocument()
  })

  it('🔴 지점별 활성 토글이 없다 — 코스에서 바꿀 값이 아니다 (B-29 철회)', () => {
    renderEditor()

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument() // 표시는 한다
  })

  it('🔴 구간 메모 입력이 없다 — 쓰기 전용이라 다시 읽을 수 없다 (B-30)', () => {
    renderEditor()

    expect(screen.queryByPlaceholderText(/메모/)).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('🔴 바뀐 것이 없으면 저장이 꺼져 있다 — 의미 없는 전량 전송을 막는다', () => {
    renderEditor()

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled()
  })
})

describe('CoursePointEditor — 제거·구간시간', () => {
  it('🔴 제거 후 저장하면 남은 지점만 전량 나가고 orderNo 가 1..N 이다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].points).toEqual([
      { pointSeq: 2, coursePointSeq: 102, orderNo: 1, memo: null, courseMin: 35 },
    ])
  })

  it('구간시간을 고쳐 저장하면 그 값이 나간다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    const input = screen.getByLabelText('정문 입구 구간시간(분)')
    await user.clear(input)
    await user.type(input, '25')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured[0]?.points[0].courseMin).toBe(25))
  })

  it('🔴 지점을 모두 제거해도 경고·차단이 없다 — 자동 조치를 하지 않는다 (규칙 12)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '주차장 편성 제거' }))

    expect(screen.getByText(/편성된 지점이 없습니다/)).toBeInTheDocument()
    expect(screen.queryByText(/비활성/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(captured[0]?.points).toEqual([]))
  })
})

describe('CoursePointEditor — 저장 바디', () => {
  it('🔴 courseSeq·siteSeq 가 들어가고 totalMin 은 null 이다 (B-28·B-31)', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toMatchObject({ courseSeq: 12, siteSeq: 7, totalMin: null })
  })

  it('🔴 기본정보를 함께 보낸다 — 편성만 보내면 이름·설명이 비워진다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: '주차장 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured[0]?.courseName).toBe('A동 순찰코스'))
    expect(captured[0]).toMatchObject({ useYn: true, switchYn: false })
  })

  it('🔴 저장 중에는 저장·취소가 잠긴다 — 연타가 전량 전송을 중복으로 만들지 않게 (T375)', async () => {
    // 🔴 `UpdateCourse` 는 **전량 교체**(B-25)다. 두 번 나가면 두 번째 요청이 첫 번째의
    // 결과를 모르는 상태로 같은 바디를 또 밀어 넣는다 — 지점 추가·제거가 섞인 저장에서
    // 무엇이 남을지 보장할 수 없다
    const user = userEvent.setup()
    const requests: number[] = []
    server.use(
      http.put(UPDATE_COURSE_PATH, async () => {
        requests.push(1)
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json({ message: '', data: true, code: 200 })
      })
    )
    renderEditor()

    await user.click(screen.getByRole('button', { name: '주차장 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    // 요청이 떠 있는 동안에는 글자부터 바뀌고 두 버튼이 모두 꺼진다
    const saving = screen.getByRole('button', { name: '저장 중…' })
    expect(saving).toBeDisabled()
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()

    await waitFor(() => expect(requests).toHaveLength(1))
  })

  it('성공하면 편집 모드를 닫는다', async () => {
    const user = userEvent.setup()
    captureBody()
    const { onClose } = renderEditor()

    await user.click(screen.getByRole('button', { name: '주차장 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

describe('CoursePointEditor — 🔴 실패 복구 (T368)', () => {
  it('🔴 저장이 실패하면 초안을 버리지 않고 "저장되지 않았다" 를 화면에 남긴다', async () => {
    const user = userEvent.setup()
    failOnSave()
    const { onClose } = renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    // 🔴 전량 전송이라 **부분 반영이 없다** — 서버는 저장 직전 그대로다
    expect(await screen.findByText(/저장되지 않았습니다/)).toBeInTheDocument()
    // 초안 유지: 제거한 행이 되살아나지 않는다
    expect(screen.queryByText('정문 입구')).not.toBeInTheDocument()
    // 🔴 편집 모드에 머문다 — 닫히면 사용자가 "저장됐다" 고 오해한다
    expect(onClose).not.toHaveBeenCalled()
  })

  it('🔴 취소가 원복이다 — 초안을 버리고 서버 순서로 돌아간다', async () => {
    const user = userEvent.setup()
    const { onClose } = renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('🔴 취소는 아무 요청도 보내지 않는다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: '정문 입구 편성 제거' }))
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(captured).toHaveLength(0)
  })
})

describe('CoursePointEditor — 지점 추가', () => {
  it('🔴 이미 편성된 지점은 후보에 없다 — 서버는 중복을 허용하지만 화면에서 막는다', async () => {
    const user = userEvent.setup()
    renderEditor()

    await user.click(screen.getByRole('button', { name: /지점 추가/ }))

    // mock 후보는 사업장 7 의 지점 전량이다. 편성된 1·2(정문 입구·주차장)는 빠진다
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('checkbox', { name: /정문 입구/ })).not.toBeInTheDocument()
    )
  })

  it('🔴 추가한 지점은 맨 뒤에 붙고 coursePointSeq 가 null 로 나간다', async () => {
    const user = userEvent.setup()
    const captured = captureBody()
    renderEditor()

    await user.click(screen.getByRole('button', { name: /지점 추가/ }))
    const candidates = await screen.findAllByRole('checkbox')
    await user.click(candidates[0])
    await user.click(screen.getByRole('button', { name: /1개 추가/ }))
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0].points).toHaveLength(3)
    expect(captured[0].points[2]).toMatchObject({ coursePointSeq: null, orderNo: 3, courseMin: 0 })
  })
})
