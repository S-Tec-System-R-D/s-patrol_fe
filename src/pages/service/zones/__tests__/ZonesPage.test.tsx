import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ZonesPage from '../ZonesPage'
import { server } from '@/mocks/server'
import { resetCourseStore } from '@/mocks/handlers/courses'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/zones` 목록 — `spec 023` Phase 2 에서 **전체 폭 테이블로 재작성**했다.
 *
 * 011 판은 좌측 트리 + 우측 상세의 mock 셸이었고 **테스트가 없었다**(`tasks.md` 제약 3).
 * 즉 여기가 이 화면의 **첫 테스트**다. 027 의 `PointsPage.test.tsx` 와 같은 관심사를
 * 본다 — 사업장 스코프 · 행 클릭 이동 · 빈 목록 ≠ 실패 ≠ 로딩 · 서버 파라미터.
 */

const GET_COURSE_LIST_PATH = '/api/v1/Course/W/sign/GetCourseList'

/** 현재 URL 을 화면에 흘려 테스트가 읽게 한다 */
const UrlProbe = () => {
  const { search } = useLocation()
  return <div data-testid="url">{search}</div>
}

const renderPage = (initialEntry = '/zones') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/zones" element={<ZonesPage />} />
          <Route path="/zones/:courseSeq" element={<div>DETAIL_ROUTE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

describe('ZonesPage — 목록 조회', () => {
  it('선택한 사업장의 코스 목록을 테이블로 렌더한다', async () => {
    renderPage()

    expect(await screen.findByText('A동 순찰코스')).toBeInTheDocument()
    expect(screen.getByText('지점 수')).toBeInTheDocument()
    expect(screen.getByText('총 소요시간')).toBeInTheDocument()
    expect(screen.getByText('최근 순찰')).toBeInTheDocument()
  })

  it('다른 사업장을 선택하면 그 사업장의 코스만 보인다', async () => {
    setSite(8, '다른 사업장')
    renderPage()

    expect(await screen.findByText('외벽 순회 코스')).toBeInTheDocument()
    expect(screen.queryByText('A동 순찰코스')).not.toBeInTheDocument()
  })

  it('🔴 좌/우 2단 mock 셸이 남아 있지 않다 — 트리와 "지점 순서·편집" 카드가 없다', async () => {
    renderPage()

    await screen.findByText('A동 순찰코스')
    expect(screen.queryByText('코스 목록')).not.toBeInTheDocument()
    expect(screen.queryByText('지점 순서 · 편집')).not.toBeInTheDocument()
    expect(screen.queryByText('DETAIL_ROUTE')).not.toBeInTheDocument()
  })

  it('🔴 미사용 코스도 목록에 함께 나온다 — 서버가 제외하지 않는다', async () => {
    renderPage()

    expect(await screen.findByText('구 주차장 코스(미사용)')).toBeInTheDocument()
    expect(screen.getByText('미사용')).toBeInTheDocument()
  })

  it('🔴 지점 0개 코스도 그대로 나온다 — 자동 조치·경고가 없다 (규칙 12)', async () => {
    renderPage()

    expect(await screen.findByText('옥상 점검 코스')).toBeInTheDocument()
  })

  it('🔴 생성 모달은 명칭·설명만 묻는다 — 지점을 묻지 않는다 (B-27)', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: /코스 생성/ }))

    // 🔴 `AddCourse` 가 `points` 를 무시하므로(200 인데 pointCount: 0) 모달에서 지점을
    // 묻지 않는다. 대신 "어디서 편성하는가" 를 모달 안에서 알려 준다
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('코스명을 입력해주세요')).toBeInTheDocument()
    expect(screen.getByText(/코스 상세/)).toBeInTheDocument()
    expect(screen.queryByText(/지점 추가/)).not.toBeInTheDocument()
  })
})

describe('ZonesPage — 상세 이동', () => {
  it('🔴 행을 클릭하면 상세 라우트로 이동한다', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(await screen.findByText('B동 순찰코스'))

    expect(await screen.findByText('DETAIL_ROUTE')).toBeInTheDocument()
  })
})

describe('ZonesPage — 빈 목록 · 실패 · 미선택', () => {
  it('코스가 0건이면 장애가 아니라 빈 목록 안내를 보여준다', async () => {
    // 권한 밖/빈 사업장: 서버는 403 이 아니라 200 + 빈 목록을 준다 (B-9)
    setSite(999, '없는 사업장')
    renderPage()

    expect(await screen.findByText('등록된 코스가 없습니다.')).toBeInTheDocument()
  })

  it('🔴 목록 조회 실패는 빈 목록과 구분해 보여준다', async () => {
    server.use(
      http.get(GET_COURSE_LIST_PATH, () =>
        HttpResponse.json({ message: '서버 오류입니다.', data: null, code: 500 }, { status: 500 })
      )
    )
    renderPage()

    expect(await screen.findByText('코스 목록을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
    expect(screen.queryByText('등록된 코스가 없습니다.')).not.toBeInTheDocument()
  })

  it('🔴 사업장이 선택되지 않았으면 조회를 시도하지 않는다', async () => {
    clearTokens() // siteSeq 도 함께 지워진다(spec 021 DoD #9)
    let requested = false
    server.use(
      http.get(GET_COURSE_LIST_PATH, () => {
        requested = true
        return HttpResponse.json({ message: '', data: null, code: 200 })
      })
    )

    renderPage()

    await waitFor(() => expect(screen.getByText('코스/지점')).toBeInTheDocument())
    expect(requested).toBe(false)
  })

  it('🔴 조회 중에 "데이터가 없습니다"를 보여주지 않는다', async () => {
    server.use(
      http.get(GET_COURSE_LIST_PATH, async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json({
          message: '',
          data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
          code: 200,
        })
      })
    )
    renderPage()

    // 로딩 중 — 코스가 없다고 믿고 새로 만들게 하면 안 된다(027 T324 교훈)
    expect(screen.queryByText('데이터가 없습니다')).not.toBeInTheDocument()
    expect(screen.queryByText('등록된 코스가 없습니다.')).not.toBeInTheDocument()

    expect(await screen.findByText('등록된 코스가 없습니다.')).toBeInTheDocument()
  })
})

/**
 * 검색·필터·페이지.
 *
 * 🔴 **클라이언트 필터 함수가 0건**이다. 전부 서버 파라미터로 나가고, 여기서 그것을
 * **요청 가로채기로** 확인한다 — 화면 결과만 보면 "서버가 걸렀는지 우리가 걸렀는지" 알 수
 * 없다(027 교훈).
 */
describe('ZonesPage — 검색·필터·페이지', () => {
  /** 서버로 나간 쿼리를 모은다 */
  const captureQuery = () => {
    const seen: URLSearchParams[] = []
    server.use(
      http.get(GET_COURSE_LIST_PATH, ({ request }) => {
        seen.push(new URL(request.url).searchParams)
        return HttpResponse.json({
          message: '',
          data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
          code: 200,
        })
      })
    )
    return seen
  }

  it('🔴 URL 의 필터가 서버 파라미터로 나간다', async () => {
    const seen = captureQuery()
    renderPage('/zones?useYn=false&switchYn=true&search=A동&status=0')

    await waitFor(() => expect(seen.length).toBeGreaterThan(0))
    const last = seen.at(-1)!
    expect(last.get('useYn')).toBe('false')
    expect(last.get('switchYn')).toBe('true')
    expect(last.get('searchKey')).toBe('A동')
    // 🔴 URL 키는 status, 서버 파라미터는 courseStatus 다
    expect(last.get('courseStatus')).toBe('0')
    expect(last.get('status')).toBeNull()
  })

  it('필터를 고르면 URL 에 보존된다', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: /교대/ }))
    await user.click(await screen.findByRole('option', { name: '허용' }))

    await waitFor(() => expect(url()).toContain('switchYn=true'))
  })

  it('🔴 "전체" 는 URL 에 남지 않는다 — 센티넬을 서버로 보내지 않는다', async () => {
    const user = userEvent.setup()
    renderPage('/zones?switchYn=true')

    await user.click(screen.getByRole('button', { name: /교대/ }))
    await user.click(await screen.findByRole('option', { name: '전체' }))

    await waitFor(() => expect(url()).not.toContain('switchYn'))
  })

  it('🔴 필터를 바꾸면 첫 페이지로 돌아간다 — 3페이지에서 걸면 빈 화면이 된다', async () => {
    const user = userEvent.setup()
    renderPage('/zones?page=3')

    await user.click(await screen.findByRole('button', { name: /사용여부/ }))
    await user.click(await screen.findByRole('option', { name: '미사용' }))

    await waitFor(() => expect(url()).toContain('useYn=false'))
    expect(url()).not.toContain('page=3')
  })

  it('🔴 필터 0건과 "등록된 코스 없음" 을 다르게 그린다', async () => {
    renderPage('/zones?search=존재하지않는코스명')

    expect(await screen.findByText('조건에 맞는 코스가 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('등록된 코스가 없습니다.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument()
  })

  it('필터 초기화를 누르면 쿼리가 비워진다', async () => {
    const user = userEvent.setup()
    renderPage('/zones?search=존재하지않는코스명&switchYn=true')

    await user.click(await screen.findByRole('button', { name: '필터 초기화' }))

    await waitFor(() => expect(url()).toBe(''))
  })

  it('검색어를 입력하면 디바운스 뒤에 URL·요청에 반영된다', async () => {
    const user = userEvent.setup()
    const seen = captureQuery()
    renderPage()

    await user.type(screen.getByPlaceholderText('코스 이름 검색'), 'B동')

    await waitFor(() => expect(url()).toContain('search=B%EB%8F%99'))
    await waitFor(() => expect(seen.at(-1)!.get('searchKey')).toBe('B동'))
  })

  it('페이지 번호가 URL 에 보존되고 서버로 나간다', async () => {
    const seen = captureQuery()
    renderPage('/zones?page=2')

    await waitFor(() => expect(seen.length).toBeGreaterThan(0))
    expect(seen.at(-1)!.get('pageNumber')).toBe('2')
  })
})
