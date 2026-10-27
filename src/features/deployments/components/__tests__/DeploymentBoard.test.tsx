import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetDeploymentStore } from '@/mocks/handlers/deployments'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import DeploymentBoard from '../DeploymentBoard'

/**
 * 배치 요청 · 복귀 요청 · 전입 · 전출 — **탭 4개 + 표 1개** (`spec 039` T649g → `spec 042` T717·T721).
 *
 * 🔴 화면 결과와 함께 **서버로 나간 요청**을 본다 — 활성 탭의 쿼리만 나가는지, 이력이 전입/전출 엔드포인트로
 * 갈리는지. 시드(사업장 7): 배치 요청 = 최범수 · 배수진 / 복귀 요청 = 장도윤(7 → 강서) /
 * 전출 = 장도윤(배치중) · 박지우(복귀완료) / 전입 = 오준혁(배치중) · 한지민(복귀완료).
 */

const BASE = '/api/v1/Assignment/W/sign'
const LIST_PATH = `${BASE}/GetAssignmentList`
const RETURN_LIST_PATH = `${BASE}/GetAssignmentReturnList`
const IN_HISTORY_PATH = `${BASE}/GetAssignmentInHistory`
const OUT_HISTORY_PATH = `${BASE}/GetAssignmentOutHistory`
const COUNT_PATH = `${BASE}/GetAssignmentCount`
const APPROVE_PATH = `${BASE}/AssignmentApprove`

const LocationDisplay = () => {
  const location = useLocation()
  return <div data-testid="location-search">{location.search}</div>
}

const renderBoard = (initialEntry = '/deployments') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <DeploymentBoard />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const search = () => screen.getByTestId('location-search').textContent ?? ''
const inTable = () => within(screen.getByRole('table'))

/**
 * 🔴 **표(`xl` 이상) 안에서만 찾는다**(`spec 055`) — jsdom 은 미디어쿼리가 없어 `xl` 미만 카드도 함께 그려져
 * 같은 이름 · 버튼이 두 벌이다.
 */
const tableEl = () => screen.queryByRole('table')
const findInTable = (text: string, _?: unknown, options?: { timeout?: number }) =>
  waitFor(() => within(screen.getByRole('table')).getByText(text), options)
const getInTable = (text: string) => within(screen.getByRole('table')).getByText(text)
const queryInTable = (text: string) => {
  const table = tableEl()
  return table ? within(table).queryByText(text) : null
}
const findButtonInTable = (name: string) =>
  waitFor(() => within(screen.getByRole('table')).getByRole('button', { name }))

/** 목록 API 호출 경로를 모은다 */
const capturePaths = () => {
  const paths: string[] = []
  server.events.on('request:start', ({ request }) => {
    const { pathname } = new URL(request.url)
    if ([LIST_PATH, IN_HISTORY_PATH, OUT_HISTORY_PATH].includes(pathname)) paths.push(pathname)
  })
  return paths
}

/** 요청 배열 n 건을 돌려주는 핸들러 — 클라이언트 페이징 확인용 */
const manyRequests = (count: number) =>
  http.get(LIST_PATH, () =>
    HttpResponse.json({
      message: '',
      code: 200,
      data: Array.from({ length: count }, (_, i) => ({
        assignmentSeq: 900 + i,
        fromSiteSeq: 21,
        fromSiteName: '해운대 마린시티',
        toSiteSeq: 7,
        toSiteName: '강동 테크노타워',
        startDt: '2026-06-01T00:00:00',
        plannedEndDt: null,
        reason: '지원',
        createDt: '2026-05-01T09:00:00',
        userSeq: 900 + i,
        userName: `근무자${i + 1}`,
      })),
    })
  )

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
  resetDeploymentStore()
})

afterEach(() => {
  server.events.removeAllListeners()
})

describe('DeploymentBoard — 탭', () => {
  it('🔴 기본 탭은 배치 요청이고 대기 건수를 붙인다 · 이력은 조회하지 않는다', async () => {
    const paths = capturePaths()
    renderBoard()

    await screen.findByRole('table')
    expect(screen.getByRole('tab', { name: /배치 요청/ })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tab', { name: /배치 요청/ })).getByText('2')).toBeInTheDocument()
    expect(inTable().getByText('최범수')).toBeInTheDocument()
    expect(paths.every((path) => path === LIST_PATH)).toBe(true)
  })

  it('🔴 탭 순서는 배치 요청 · 복귀 요청 · 전입 이력 · 전출 이력이다', async () => {
    renderBoard()

    await screen.findByRole('table')
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent?.replace(/\d+$/, ''))).toEqual([
      '배치 요청',
      '복귀 요청',
      '전입 이력',
      '전출 이력',
    ])
  })

  it('"전출 이력" 탭 → ?tab=out + 전출 엔드포인트 · 오준혁(전입)은 없다', async () => {
    const paths = capturePaths()
    const user = userEvent.setup()
    renderBoard()
    await screen.findByRole('table')

    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))

    await waitFor(() => expect(search()).toContain('tab=out'))
    expect(await findInTable('장도윤')).toBeInTheDocument()
    expect(queryInTable('오준혁')).not.toBeInTheDocument()
    expect(paths[paths.length - 1]).toBe(OUT_HISTORY_PATH)
  })

  it('"전입 이력" 탭 → 전입 엔드포인트', async () => {
    const paths = capturePaths()
    const user = userEvent.setup()
    renderBoard()
    await screen.findByRole('table')

    await user.click(screen.getByRole('tab', { name: /전입 이력/ }))

    expect(await findInTable('오준혁')).toBeInTheDocument()
    expect(paths[paths.length - 1]).toBe(IN_HISTORY_PATH)
  })

  it('🔴 탭을 바꾸면 페이지를 지운다 — 다른 탭의 같은 페이지는 비어 있을 수 있다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=out&page=3')

    await user.click(await screen.findByRole('tab', { name: /전입 이력/ }))

    await waitFor(() => expect(search()).toContain('tab=in'))
    expect(search()).not.toContain('page=')
  })

  it('요청 표 — 근무자 · 배치 기간(미정) · 요청일 · 승인/반려', async () => {
    renderBoard()

    await screen.findByRole('table')
    expect(inTable().getByText('배치 기간')).toBeInTheDocument()
    expect(inTable().getByText('2026-06-03 ~ 미정')).toBeInTheDocument()
    expect(inTable().getByText('2026-11-02 ~ 2026-12-31')).toBeInTheDocument()
    expect(inTable().getByText('요청일')).toBeInTheDocument()
    expect(inTable().getByRole('button', { name: '최범수 승인' })).toBeInTheDocument()
    expect(inTable().getByRole('button', { name: '최범수 반려' })).toBeInTheDocument()
  })
})

describe('DeploymentBoard — 요청 탭 클라이언트 페이징 (T716)', () => {
  it('🔴 배열을 10건씩 잘라 보이고 ?page 로 넘긴다', async () => {
    server.use(manyRequests(12))
    const user = userEvent.setup()
    renderBoard()

    await findInTable('근무자1')
    expect(inTable().getAllByRole('row')).toHaveLength(11) // 헤더 + 10
    expect(queryInTable('근무자11')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2페이지' }))

    await waitFor(() => expect(search()).toContain('page=2'))
    expect(await findInTable('근무자11')).toBeInTheDocument()
    expect(inTable().getAllByRole('row')).toHaveLength(3) // 헤더 + 2
  })

  it('🔴 현재 페이지가 비면 이전 페이지로 돌아간다', async () => {
    renderBoard('/deployments?page=2')

    expect(await findInTable('최범수', undefined, { timeout: 3000 })).toBeInTheDocument()
    expect(search()).not.toContain('page=')
  })
})

describe('DeploymentBoard — 복귀 요청 (T713)', () => {
  it('🔴 탭 뱃지는 요약의 pendingReturnCount 다 — 배치 요청 탭에서도 보이고 복귀 목록은 부르지 않는다', async () => {
    const paths: string[] = []
    server.events.on('request:start', ({ request }) => {
      paths.push(new URL(request.url).pathname)
    })
    renderBoard()

    await screen.findByRole('table')
    expect(
      await within(screen.getByRole('tab', { name: /복귀 요청/ })).findByText('1')
    ).toBeInTheDocument()
    expect(paths).not.toContain(RETURN_LIST_PATH)
  })

  it('🔴 복귀 경로를 뒤집어 그린다 — 배치지(강서) → 우리 사업장 · 복귀일 칸은 없다', async () => {
    const paths: string[] = []
    server.events.on('request:start', ({ request }) => {
      paths.push(new URL(request.url).pathname)
    })
    renderBoard('/deployments?tab=returns')

    expect(await findInTable('장도윤')).toBeInTheDocument()
    const routeCell = inTable().getByText('강서 스퀘어타워').parentElement as HTMLElement
    // 도착(굵게) = 우리 사업장
    expect(routeCell.lastElementChild).toHaveTextContent('강동 테크노타워')
    expect(routeCell.firstElementChild).toHaveTextContent('강서 스퀘어타워')
    expect(inTable().getByText('복귀 경로')).toBeInTheDocument()
    expect(inTable().queryByText('복귀일')).not.toBeInTheDocument()
    expect(inTable().getByRole('button', { name: '장도윤 반려' })).toBeInTheDocument()
    expect(paths).toContain(RETURN_LIST_PATH)
    // 복귀 요청 탭에는 이력 검색이 없다
    expect(screen.queryByLabelText('이름 검색')).not.toBeInTheDocument()
  })

  it('🔴 복귀 요청을 승인하면 행이 사라지고 전출 이력이 복귀완료가 된다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=returns')

    await user.click(await findButtonInTable('장도윤 승인'))
    expect(await screen.findByText('대기 중인 복귀 요청이 없습니다')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))
    await findInTable('장도윤')
    expect(inTable().getAllByText('복귀완료')).toHaveLength(2)
  })
})

describe('DeploymentBoard — 이력 (T721)', () => {
  it('🔴 이력 표 — 사유 칸이 없고 경로 한쪽은 선택 사업장 · 상태는 서버 이름', async () => {
    renderBoard('/deployments?tab=out')

    await findInTable('장도윤')
    expect(inTable().queryByText('사유')).not.toBeInTheDocument()
    expect(inTable().getByText('기간')).toBeInTheDocument()
    expect(inTable().getByText('배치중')).toBeInTheDocument()
    expect(inTable().getByText('복귀완료')).toBeInTheDocument()
    expect(inTable().getByText('2026-03-01 ~ 미정')).toBeInTheDocument()
    expect(inTable().getByText('2025-12-01 ~ 2026-01-15')).toBeInTheDocument()
    // 전출 = 우리 사업장 → 행의 toSiteName
    const routeCell = inTable().getByText('노원 파크뷰').parentElement as HTMLElement
    expect(routeCell.firstElementChild).toHaveTextContent('강동 테크노타워')
  })

  it('🔴 상태 필터를 고르면 ?status 와 서버 status 코드로 나가고 첫 페이지로 간다 (042 후속)', async () => {
    const statuses: (string | null)[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === IN_HISTORY_PATH) statuses.push(target.searchParams.get('status'))
    })
    const user = userEvent.setup()
    renderBoard('/deployments?tab=in&page=2')

    await user.click(await screen.findByRole('combobox', { name: '상태' }))
    await user.click(await screen.findByRole('option', { name: '복귀완료' }))

    await waitFor(() => expect(search()).toContain('status=returned'))
    expect(search()).not.toContain('page=2')
    expect(await findInTable('한지민')).toBeInTheDocument()
    expect(queryInTable('오준혁')).not.toBeInTheDocument()
    expect(statuses[statuses.length - 1]).toBe('2')
  })

  it('🔴 상태 필터 — 초기화로 지우고, 탭을 바꿔도 지운다 · 모르는 값은 전체', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=in&status=active')

    expect(await findInTable('오준혁')).toBeInTheDocument()
    expect(queryInTable('한지민')).not.toBeInTheDocument()
    await user.click(screen.getByLabelText('필터 초기화'))
    await waitFor(() => expect(search()).not.toContain('status='))
    expect(await findInTable('한지민')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: '상태' }))
    await user.click(await screen.findByRole('option', { name: '배치중' }))
    await waitFor(() => expect(search()).toContain('status=active'))
    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))
    await waitFor(() => expect(search()).toContain('tab=out'))
    expect(search()).not.toContain('status=')
  })

  it('깨진 ?status 는 전체로 본다 — 서버에 보내지 않는다', async () => {
    renderBoard('/deployments?tab=in&status=bogus')

    expect(await findInTable('오준혁')).toBeInTheDocument()
    expect(getInTable('한지민')).toBeInTheDocument()
  })

  it('🔴 입력하면 디바운스 뒤 ?q 와 서버 userName 으로 나가고 첫 페이지로 간다', async () => {
    const names: (string | null)[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === IN_HISTORY_PATH) names.push(target.searchParams.get('userName'))
    })
    const user = userEvent.setup()
    renderBoard('/deployments?tab=in&page=2')

    await user.type(await screen.findByLabelText('이름 검색'), '오준')

    await waitFor(() => expect(search()).toContain('q=%EC%98%A4%EC%A4%80'))
    expect(search()).not.toContain('page=2')
    await waitFor(() => expect(names[names.length - 1]).toBe('오준'))
    expect(await findInTable('오준혁')).toBeInTheDocument()
    expect(queryInTable('한지민')).not.toBeInTheDocument()
  })

  it('🔴 검색 0건은 "조건에 맞는 이력이 없습니다" · 초기화 · 탭을 바꾸면 검색어도 지운다', async () => {
    const user = userEvent.setup()
    renderBoard('/deployments?tab=in&q=없는사람')

    expect(await screen.findByText('조건에 맞는 이력이 없습니다')).toBeInTheDocument()
    await user.click(screen.getByLabelText('필터 초기화'))
    await waitFor(() => expect(search()).not.toContain('q='))
    expect(screen.getByLabelText('이름 검색')).toHaveValue('')

    await user.type(screen.getByLabelText('이름 검색'), '오')
    await waitFor(() => expect(search()).toContain('q='))
    await user.click(screen.getByRole('tab', { name: /전출 이력/ }))
    await waitFor(() => expect(search()).toContain('tab=out'))
    expect(search()).not.toContain('q=')
  })

  it('요청 탭에는 필터 줄이 없다', async () => {
    renderBoard()

    await screen.findByRole('table')
    expect(screen.queryByRole('group', { name: '목록 필터' })).not.toBeInTheDocument()
  })
})

describe('DeploymentBoard — 상태', () => {
  it('🔴 승인하면 전입 이력이 1건 늘어난다', async () => {
    await fetch(APPROVE_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentSeq: 501, approved: true }),
    })
    renderBoard('/deployments?tab=in')

    expect(await findInTable('최범수')).toBeInTheDocument()
    expect(inTable().getAllByRole('row')).toHaveLength(4) // 헤더 + 3
  })

  it('🔴 조회 실패를 "없음" 으로 보여주지 않는다', async () => {
    server.use(
      http.get(OUT_HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 }))
    )
    renderBoard('/deployments?tab=out')

    expect(await screen.findByText('배치 이력을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByText('전출 이력이 없습니다')).not.toBeInTheDocument()
  })

  it('요청이 0건이면 탭 건수를 그리지 않고 빈 상태다', async () => {
    server.use(
      http.get(LIST_PATH, () => HttpResponse.json({ message: '', code: 200, data: [] })),
      http.get(COUNT_PATH, () =>
        HttpResponse.json({
          message: '',
          code: 200,
          data: { outCount: 1, inCount: 1, pendingCount: 0, pendingReturnCount: 0 },
        })
      )
    )
    renderBoard()

    expect(await screen.findByText('대기 중인 배치 요청이 없습니다')).toBeInTheDocument()
    expect(
      within(screen.getByRole('tab', { name: /배치 요청/ })).queryByText('0')
    ).not.toBeInTheDocument()
  })

  it('🔴 요약 조회가 실패하면 탭 뱃지를 그리지 않는다', async () => {
    server.use(http.get(COUNT_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderBoard()

    await screen.findByRole('table')
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(
      within(screen.getByRole('tab', { name: /복귀 요청/ })).queryByText(/\d/)
    ).not.toBeInTheDocument()
  })
})
