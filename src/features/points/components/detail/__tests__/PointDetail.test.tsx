import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import PointDetail from '../PointDetail'
import { server } from '@/mocks/server'
import { resetPointStore } from '@/mocks/handlers/points'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'
import type { PointDetail as PointDetailData } from '../../../types'

/**
 * 상세 카드의 수정·삭제 연결 — `spec 022` Phase 5.
 *
 * 🔴 **삭제 거부가 목록을 건드리지 않는지**가 핵심이다. 거부는 실 서버 동작이 **미실측**인
 * 가정이지만(OQ-022-B), 거부가 왔을 때 선택이 풀리거나 목록이 비면 사용자는 삭제되지
 * 않은 지점을 잃은 것처럼 본다. MSW 는 코스에 편성된 지점(`pointSeq` 1~3)을 거부한다.
 */

const DELETE_POINT_PATH = '/api/v1/Point/W/sign/DeletePoint'
const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'

const detail = (overrides: Partial<PointDetailData> = {}): PointDetailData => ({
  pointSeq: 1,
  name: '정문 입구',
  memo: '정문 CCTV 앞',
  authMethod: 9,
  authMethodName: 'QR',
  qrCode: 'STSP1:7:1:1760000000:mockSignature',
  nfcTagId: null,
  gpsLat: null,
  gpsLng: null,
  useYn: true,
  lastPatrolDt: '2026-10-02T09:11:00',
  lastPatrolUserSeq: 101,
  lastPatrolUserName: '김근무',
  courseList: [{ courseSeq: 1, courseName: 'A동 순찰코스' }],
  ...overrides,
})

const renderDetail = (point = detail(), onDeleted = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <PointDetail point={point} onDeleted={onDeleted} />
    </QueryClientProvider>
  )
  return { onDeleted, queryClient }
}

/** 삭제 버튼 → 확인 모달 → 확인 */
const confirmDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '삭제' }))
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

describe('PointDetail — 삭제', () => {
  it('코스에 편성되지 않은 지점은 삭제되고 선택이 해제된다', async () => {
    const user = userEvent.setup()
    // pointSeq 4 는 핸들러의 `COURSES_OF` 가 코스를 주지 않는다
    const { onDeleted } = renderDetail(detail({ pointSeq: 4, name: '비상구 A', courseList: [] }))

    await confirmDelete(user)

    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
  })

  it('🔴 거부되면 선택을 해제하지 않는다 — 삭제되지 않은 지점을 잃은 것처럼 보인다', async () => {
    const user = userEvent.setup()
    const { onDeleted } = renderDetail()

    await confirmDelete(user)

    // 거부 응답이 돌아올 시간을 준 뒤에도 선택은 그대로다
    await waitFor(() => expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled())
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('🔴 거부 사유를 상세 카드에 직접 그리지 않는다 — 전역 토스트와 중복된다', async () => {
    const user = userEvent.setup()
    renderDetail()

    await confirmDelete(user)

    await waitFor(() => expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled())
    expect(screen.queryByText(/삭제할 수 없습니다/)).not.toBeInTheDocument()
  })

  it('목록 무효화는 성공했을 때만 일어난다', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderDetail()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

    await confirmDelete(user)

    await waitFor(() => expect(screen.getByRole('button', { name: '삭제' })).toBeEnabled())
    expect(invalidate).not.toHaveBeenCalled()
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
    const { onDeleted } = renderDetail()

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(requested).toBe(false)
    expect(onDeleted).not.toHaveBeenCalled()
  })
})

describe('PointDetail — 027 레이아웃 결정', () => {
  it('🔴 "이름" 행이 없다 — 헤더 제목과 같은 값이라 페이지에서 두 번 보인다', () => {
    renderDetail()

    // 제목은 하나만 — DetailRow 로 또 그리지 않는다
    expect(screen.getAllByText('정문 입구')).toHaveLength(1)
    expect(screen.queryByText('이름')).not.toBeInTheDocument()
  })

  it('🔴 사용여부는 행이 아니라 헤더 뱃지다', () => {
    renderDetail()

    expect(screen.getByText('사용')).toBeInTheDocument()
    expect(screen.queryByText('사용여부')).not.toBeInTheDocument()
  })

  it('미사용 지점은 미사용 뱃지', () => {
    renderDetail(detail({ useYn: false }))

    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 생성일 행이 없다 — 서버에 createdAt 이 없다(OQ-022-I, 실측 확인)', () => {
    renderDetail()

    expect(screen.queryByText('생성일')).not.toBeInTheDocument()
    // 대신 서버가 주는 최근 순찰을 보여준다
    expect(screen.getByText('최근 순찰')).toBeInTheDocument()
  })
})

describe('PointDetail — 수정 모달', () => {
  it('수정 모달은 상세 값이 채워진 폼으로 열린다', async () => {
    const user = userEvent.setup()
    renderDetail()

    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구')
  })

  it('저장이 성공하면 모달이 닫힌다', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch(UPDATE_POINT_PATH, () =>
        HttpResponse.json({ message: '요청을 정상 처리하였습니다.', data: null, code: 200 })
      )
    )
    renderDetail()

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
    renderDetail()

    await user.click(screen.getByRole('button', { name: '수정' }))
    const name = await screen.findByPlaceholderText('지점명을 입력해주세요')
    await user.clear(name)
    await user.type(name, '정문 입구(수정)')
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(screen.getByPlaceholderText('지점명을 입력해주세요')).toHaveValue('정문 입구(수정)')
  })
})
