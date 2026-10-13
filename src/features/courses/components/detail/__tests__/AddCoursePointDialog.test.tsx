import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import AddCoursePointDialog from '../AddCoursePointDialog'
import { server } from '@/mocks/server'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * 편성 지점 고르기 (`spec 023` Phase 4, T366 — OQ-023-C).
 *
 * 🔴 `GetClassificationPoint` 는 **페이징이 없어 전량** 내려온다 → 검색이 필수다. 그리고
 * **응답이 배열이다**(`PagedData` 아님) — 그 차이를 훅·api 가 흡수하는지 여기서도 한 번
 * 더 걸린다(잘못 읽으면 "후보 0건" 으로 조용히 빈다).
 */

const GET_CLASSIFICATION_POINT_PATH = '/api/v1/Course/W/sign/GetClassificationPoint'

const renderDialog = (assignedPointSeqs: number[] = [], onAdd = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AddCoursePointDialog
          open
          onOpenChange={vi.fn()}
          assignedPointSeqs={assignedPointSeqs}
          onAdd={onAdd}
        />
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { onAdd }
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('AddCoursePointDialog — 후보 목록', () => {
  it('사업장의 지점 후보를 보여준다 — 🔴 배열 응답을 그대로 읽는다', async () => {
    renderDialog()

    expect((await screen.findAllByRole('checkbox')).length).toBeGreaterThan(0)
  })

  it('🔴 이미 편성된 지점은 후보에서 빠진다 — 서버는 중복을 허용하지만 화면에서 막는다', async () => {
    // 실측(2026-10-12): 같은 `pointSeq` 를 한 코스에 두 번 넣는 것이 **통과한다**.
    // 서버가 막지 않으니 화면이 막는다 — 같은 지점을 두 번 도는 코스는 실수다
    server.use(
      http.get(GET_CLASSIFICATION_POINT_PATH, () =>
        HttpResponse.json({
          message: '요청이 정상 처리되었습니다.',
          code: 200,
          data: [
            { pointSeq: 1, pointName: '정문 입구', memo: null, authMethod: 9, authMethodName: 'QR' },
            { pointSeq: 2, pointName: '주차장', memo: null, authMethod: 10, authMethodName: 'NFC' },
            { pointSeq: 3, pointName: '옥상', memo: null, authMethod: 9, authMethodName: 'QR' },
          ],
        })
      )
    )
    renderDialog([1])

    expect(await screen.findByRole('checkbox', { name: /주차장/ })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: /정문 입구/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('🔴 후보가 전부 편성돼 있으면 "검색 결과 없음" 과 다른 문구를 준다', async () => {
    server.use(
      http.get(GET_CLASSIFICATION_POINT_PATH, () =>
        HttpResponse.json({
          message: '요청이 정상 처리되었습니다.',
          code: 200,
          data: [
            { pointSeq: 1, pointName: '정문 입구', memo: null, authMethod: 9, authMethodName: 'QR' },
          ],
        })
      )
    )
    renderDialog([1])

    expect(await screen.findByText(/모든 지점이 이미 편성되어 있습니다/)).toBeInTheDocument()
  })

  it('검색으로 좁힌다 — 서버에 검색 파라미터가 없어 클라이언트에서 한다', async () => {
    const user = userEvent.setup()
    renderDialog()

    await screen.findAllByRole('checkbox')
    await user.type(screen.getByPlaceholderText('지점 이름 검색'), '있을 수 없는 이름')

    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })
})

describe('AddCoursePointDialog — 0건 세 가지를 구분한다', () => {
  it('🔴 사업장에 지점이 아예 없으면 지점 관리로 보낸다', async () => {
    server.use(
      http.get(GET_CLASSIFICATION_POINT_PATH, () =>
        HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: [], code: 200 })
      )
    )
    renderDialog()

    expect(await screen.findByText(/사업장에 등록된 지점이 없습니다/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '순찰지점' })).toHaveAttribute('href', '/points')
  })

  it('🔴 조회 실패를 "후보 없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(GET_CLASSIFICATION_POINT_PATH, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: null, code: 400 }, { status: 400 })
      )
    )
    renderDialog()

    expect(await screen.findByText(/불러오지 못했습니다/)).toBeInTheDocument()
  })
})

describe('AddCoursePointDialog — 선택', () => {
  it('아무것도 고르지 않으면 추가가 꺼져 있다', async () => {
    renderDialog()

    await screen.findAllByRole('checkbox')
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled()
  })

  it('여러 개를 한 번에 담는다 — 하나씩 모달을 여닫게 하지 않는다', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderDialog()

    const candidates = await screen.findAllByRole('checkbox')
    await user.click(candidates[0])
    await user.click(candidates[1])
    await user.click(screen.getByRole('button', { name: /2개 추가/ }))

    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0][0]).toHaveLength(2)
  })

  it('🔴 취소하면 담지 않는다', async () => {
    const user = userEvent.setup()
    const { onAdd } = renderDialog()

    const candidates = await screen.findAllByRole('checkbox')
    await user.click(candidates[0])
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onAdd).not.toHaveBeenCalled()
  })
})

/**
 * `spec 028` — 필터 칩 · 순번 · 선택 유지 (T403).
 *
 * 🔴 여기서 걸리는 것은 **화면상으로는 그럴듯한** 종류의 버그다: 순번이 응답 순서로
 * 매겨지거나, 칩을 바꾸는 순간 고른 것이 조용히 사라지거나, 칩 건수가 검색어에 흔들리는 것.
 */

const 후보 = [
  { pointSeq: 1, pointName: '지하 주차장 B구역', memo: null, authMethod: 9, authMethodName: 'QR' },
  { pointSeq: 2, pointName: '옥외 주차장 출입구', memo: null, authMethod: 10, authMethodName: 'NFC' },
  { pointSeq: 3, pointName: '정문 입구', memo: null, authMethod: 9, authMethodName: 'QR' },
]

const 후보응답 = (data = 후보) =>
  server.use(
    http.get(GET_CLASSIFICATION_POINT_PATH, () =>
      HttpResponse.json({ message: '요청이 정상 처리되었습니다.', code: 200, data })
    )
  )

describe('AddCoursePointDialog — 필터 칩 (spec 028)', () => {
  it('칩 3종에 건수가 붙는다', async () => {
    후보응답()
    renderDialog()

    expect(await screen.findByRole('button', { name: '전체 3건' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'QR 2건' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'NFC 1건' })).toBeInTheDocument()
  })

  it('🔴 칩 건수는 **검색어에 흔들리지 않는다** — 고르기 전에 참고할 값이 사라지면 안 된다', async () => {
    const user = userEvent.setup()
    후보응답()
    renderDialog()

    await screen.findAllByRole('checkbox')
    await user.type(screen.getByPlaceholderText('지점 이름 검색'), '정문')

    expect(screen.getByRole('button', { name: 'QR 2건' })).toBeInTheDocument()
    expect(screen.getByText('검색결과 1개')).toBeInTheDocument()
  })

  it('칩과 검색이 **조합**된다', async () => {
    const user = userEvent.setup()
    후보응답()
    renderDialog()

    await user.click(await screen.findByRole('button', { name: 'QR 2건' }))
    await user.type(screen.getByPlaceholderText('지점 이름 검색'), '주차')

    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    // 🔴 `getByText('지하 주차장 B구역')` 도, 이름 전체 일치도 안 된다 — 검색어
    //    하이라이트가 이름을 `<mark>` 로 쪼개고(T390), 접근성 이름은 조각을 이을 때
    //    **경계의 공백을 잃는다**(`지하주차장 B구역`). 영향을 받지 않는 조각으로 건다
    expect(screen.getByRole('checkbox', { name: /B구역/ })).toBeInTheDocument()
  })

  it('🔴 칩 0건은 검색 0건과 **다른 문구**를 준다 — 원인이 칩인데 검색어를 지우러 가게 두지 않는다', async () => {
    const user = userEvent.setup()
    후보응답(후보.filter((point) => point.authMethod === 9))
    renderDialog()

    await user.click(await screen.findByRole('button', { name: 'NFC 0건' }))

    expect(screen.getByText('NFC 인증 지점이 없습니다.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '전체 보기' }))
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })
})

describe('AddCoursePointDialog — 순번과 선택 유지 (spec 028)', () => {
  it('🔴 순번은 **기존 편성 수 + 선택 순서**다', async () => {
    const user = userEvent.setup()
    후보응답()
    renderDialog([99, 98]) // 이미 2개 편성된 코스

    await user.click(await screen.findByRole('checkbox', { name: /정문 입구/ }))
    expect(screen.getByRole('checkbox', { name: /정문 입구/ }).closest('li')).toHaveTextContent('3')

    await user.click(screen.getByRole('checkbox', { name: /지하 주차장/ }))
    expect(screen.getByRole('checkbox', { name: /지하 주차장/ }).closest('li')).toHaveTextContent('4')
  })

  it('🔴 **고른 순서 그대로** 넘긴다 — 후보 응답 순서가 아니다', async () => {
    const user = userEvent.setup()
    후보응답()
    const { onAdd } = renderDialog()

    await user.click(await screen.findByRole('checkbox', { name: /정문 입구/ })) // 응답상 3번째
    await user.click(screen.getByRole('checkbox', { name: /지하 주차장/ })) // 응답상 1번째
    await user.click(screen.getByRole('button', { name: /2개 추가/ }))

    expect(onAdd.mock.calls[0][0].map((point: { pointSeq: number }) => point.pointSeq)).toEqual([3, 1])
  })

  it('🔴 칩을 바꿔 목록에서 사라져도 **선택은 유지된다**', async () => {
    const user = userEvent.setup()
    후보응답()
    renderDialog()

    await user.click(await screen.findByRole('checkbox', { name: /옥외 주차장/ })) // NFC
    await user.click(screen.getByRole('button', { name: 'QR 2건' }))

    // 목록에서는 사라졌지만
    expect(screen.queryByRole('checkbox', { name: /옥외 주차장/ })).not.toBeInTheDocument()
    // 선택 바에 남아 있고, 담을 수 있다
    expect(screen.getByRole('button', { name: /1개 추가/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: '옥외 주차장 출입구 선택 해제' })).toBeInTheDocument()
  })

  it('선택 바에서 개별 해제·모두 해제가 된다', async () => {
    const user = userEvent.setup()
    후보응답()
    renderDialog()

    await user.click(await screen.findByRole('checkbox', { name: /정문 입구/ }))
    await user.click(screen.getByRole('checkbox', { name: /지하 주차장/ }))
    await user.click(screen.getByRole('button', { name: '정문 입구 선택 해제' }))
    expect(screen.getByRole('button', { name: /1개 추가/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '모두 해제' }))
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled()
  })
})
