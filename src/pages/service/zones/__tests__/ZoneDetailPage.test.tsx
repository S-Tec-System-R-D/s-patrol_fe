import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import ZoneDetailPage from '../ZoneDetailPage'
import { server } from '@/mocks/server'
import { resetCourseStore } from '@/mocks/handlers/courses'
import type { UpdateCourseRequest } from '@/features/courses/types'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { setSite } from '@/lib/auth/site'
import { makeAccessToken } from '@/test/jwt'

/**
 * `/zones/:courseSeq` — Phase 2 의 **최소 골격**에 대한 테스트.
 *
 * Phase 2 는 **라우트가 성립하는가**를 고정했다: URL 로 직접 들어와도 상세가 뜨고
 * (= 새로고침에 살아남고), 없는 코스가 **`/404` 가 아니라 안내**로 끝난다.
 * Phase 3 에서 **조회 섹션 3개**(다이어그램·지점 순서·기본정보)가 더해졌다 — 섹션 자체는
 * 각 컴포넌트 테스트가 보고, 여기서는 **페이지가 그것들을 실제 응답으로 조립하는지**만 본다.
 * 변경계는 Phase 4 다.
 * 🔄 `spec 074`(2026-11-12 · 11-13 검토) — 기본정보 `수정` · 머리 `⋯` 삭제 · 편성 편집 모달 · 순찰 경로 카드 · 기본정보 글자만 · 시간대별 · 근무자별 ·
 * 기록 10건 + 회차 상세 모달. 토글 확인 모달 · 이상 이력은 걷었다.
 */

const DELETE_COURSE_PATH = '/api/v1/Course/W/sign/DeleteCourse'
const UPDATE_COURSE_PATH = '/api/v1/Course/W/sign/UpdateCourse'

const renderPage = (initialEntry: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/zones/:courseSeq" element={<ZoneDetailPage />} />
          <Route path="/zones" element={<div>LIST_ROUTE</div>} />
          <Route path="/404" element={<div>NOT_FOUND_PAGE</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 카드 제목으로 그 카드 DOM 을 집는다 — 버튼이 **어느 카드 안**인지 보려면 필요하다 */
const cardOf = (title: string): HTMLElement => {
  const card = screen.getByText(title).closest('.rounded-lg')
  if (card === null) throw new Error(`카드를 찾지 못했다: ${title}`)
  return card as HTMLElement
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

/** `⋯` 메뉴 → 삭제 → 확인 창 */
const openDelete = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: '코스 메뉴' }))
  await user.click(await screen.findByRole('menuitem', { name: '삭제' }))
}

describe('ZoneDetailPage', () => {
  it('🔴 URL 로 직접 들어가도 상세가 뜬다 — 새로고침에 살아남는다', async () => {
    renderPage('/zones/1')

    expect(await screen.findByText('A동 순찰코스')).toBeInTheDocument()
  })

  it('설명(memo)을 보여준다', async () => {
    renderPage('/zones/1')

    expect(await screen.findByText(/A동 1층~지하 주차장 순찰/)).toBeInTheDocument()
  })

  it('목록으로 돌아갈 수단이 있다 — 브레드크럼 첫 조각이 링크다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByRole('link', { name: '코스/지점' })).toHaveAttribute('href', '/zones')
  })

  it('🔴 없는 courseSeq 는 안내 + 목록 복귀 수단으로 끝난다 — /404 로 보내지 않는다', async () => {
    renderPage('/zones/9999')

    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('NOT_FOUND_PAGE')).not.toBeInTheDocument()
    // 🔴 **안내와 같은 자리에** 복귀 수단이 있어야 한다. 전에는 브레드크럼 링크
    // (`코스/지점`)만 보고 통과시켰는데, 브라우저에서는 그것이 빠져나갈 길로 읽히지
    // 않았다(확인 2026-10-12) — 단정을 안내 블록 안으로 좁힌다
    expect(screen.getByRole('link', { name: '코스 목록으로' })).toHaveAttribute('href', '/zones')
  })

  it('🔴 조회 중에 "코스를 찾을 수 없습니다" 를 보여주지 않는다 (Phase 6 T375)', async () => {
    // 🔴 목록의 "데이터가 없습니다" 와 **같은 종류의 결함이고, 더 나쁘다** — 상세의 빈
    // 상태는 "삭제되었거나 접근할 수 없는 코스입니다" 라고 단정한다. 조회 중에 그것이
    // 뜨면 사용자는 **방금 지운 줄 알고** 목록으로 돌아가거나 다시 만든다
    server.use(
      http.get('/api/v1/Course/W/sign/GetCourseDetail', async () => {
        await new Promise((resolve) => setTimeout(resolve, 300))
        return HttpResponse.json({ message: '', data: null, code: 200 })
      })
    )

    renderPage('/zones/1')

    expect(screen.queryByText('코스를 찾을 수 없습니다')).not.toBeInTheDocument()
    expect(screen.getByText('코스 정보를 불러오는 중')).toBeInTheDocument()

    // 응답이 와서 **정말 없을 때에만** 안내로 바뀐다
    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
  })

  it('🔴 숫자가 아닌 세그먼트는 조회를 시도하지 않고 안내로 끝난다', async () => {
    renderPage('/zones/abc')

    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText(/주소가 올바르지 않습니다/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '코스 목록으로' })).toBeInTheDocument()
  })

  it('🔴 머리에는 `⋯` 만 — `수정` 은 기본정보 카드, 편성 편집은 순찰 경로 카드 (spec 074)', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(within(cardOf('순찰 경로')).getByRole('button', { name: '지점 편성 편집' })).toBeInTheDocument()
    expect(within(cardOf('기본정보')).getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '수정' })).toHaveLength(1)
    // 삭제는 `⋯` 메뉴 안 — 화면에 바로 보이지 않는다
    expect(screen.queryByRole('button', { name: '삭제' })).toBeNull()
    expect(screen.getByRole('button', { name: '코스 메뉴' })).toBeInTheDocument()
  })

  it('기본정보 `수정` 이 코스 수정 모달을 연다 — 교대 허용 · 코스 사용 스위치가 있다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '수정' }))

    expect(await screen.findByText('코스 수정')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '교대 허용' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: '코스 사용' })).toBeInTheDocument()
  })

  it('🔴 제목 줄에 규모 요약 뱃지가 있다 (A단) — 두 카드에 흩어진 값을 한 번에 읽는다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    // mock 코스 1: 지점 3개 · 총 45분
    expect(screen.getByText('지점 3개 · 기준 45분')).toBeInTheDocument()
  })

  it('지점 0개 코스도 요약 뱃지를 그대로 적는다 — 경고로 바꾸지 않는다 (규칙 12)', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(screen.getByText(/지점 0개/)).toBeInTheDocument()
  })
})

describe('ZoneDetailPage — 조회 섹션 조립 (Phase 3)', () => {
  it('🔴 순찰 경로 · 기본정보가 한 응답에서 함께 그려진다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByText('순찰 경로')).toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: '지점 순서' })).getAllByRole('listitem')).toHaveLength(3)
  })

  it('🔴 좌표가 있으면 경로 카드 안에 **지도** · 빠진 지점 수를 적는다 (spec 032)', async () => {
    // mock 코스 1 은 지점 3개 중 2개에 좌표가 있다
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByText('좌표 없음 1개')).toBeInTheDocument()
  })

  it('🔴 좌표가 하나도 없으면 **다이어그램으로 되돌아간다** — 경로 표현이 사라지지 않는다', async () => {
    // mock 코스 2 의 유일한 지점(`pointSeq 3`)은 좌표가 없다
    renderPage('/zones/2')

    await screen.findByText('B동 순찰코스')
    expect(screen.queryByText(/좌표 없음/)).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: '지점 순서' })).toBeInTheDocument()
  })

  it('🔴 지점 0개 코스는 빈 상태로 그려진다 — 경고·자동 조치가 없다 (규칙 12)', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(screen.getByText('편성된 지점이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
  })

  it('기본정보는 글자만 — 교대 · 상태', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    const info = cardOf('기본정보')
    expect(within(info).queryByRole('switch')).toBeNull()
    expect(info).toHaveTextContent('교대허용')
    expect(info).toHaveTextContent('상태사용')
  })

  it('🔴 설명이 한 번만 나온다 — 제목 아래와 기본정보에 중복해 넣지 않는다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getAllByText(/A동 1층~지하 주차장 순찰/)).toHaveLength(1)
  })
})

describe('ZoneDetailPage — 변경계 조립 (Phase 4)', () => {
  it('🔴 삭제는 courseId 로 나간다 — courseSeq 로 보내면 400 ProblemDetails 다 (B-12)', async () => {
    const user = userEvent.setup()
    const params: (string | null)[] = []
    server.use(
      http.delete(DELETE_COURSE_PATH, ({ request }) => {
        const query = new URL(request.url).searchParams
        params.push(query.get('courseId'), query.get('courseSeq'))
        return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
      })
    )
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await openDelete(user)
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    await waitFor(() => expect(params[0]).toBe('1'))
    expect(params[1]).toBeNull()
  })

  it('🔴 삭제 성공 → 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await openDelete(user)
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
  })

  it('🔴 삭제 실패 → 상세에 머문다. 거부인데 화면이 바뀌면 삭제된 줄 안다', async () => {
    const user = userEvent.setup()
    server.use(
      http.delete(DELETE_COURSE_PATH, () =>
        HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })
      )
    )
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await openDelete(user)
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    await waitFor(() => expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument())
    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
  })

  it('🔴 삭제 확인 전에는 요청이 나가지 않는다 — 취소는 아무 일도 하지 않는다', async () => {
    const user = userEvent.setup()
    let called = 0
    server.use(
      http.delete(DELETE_COURSE_PATH, () => {
        called += 1
        return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
      })
    )
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await openDelete(user)
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(called).toBe(0)
  })

  it('🔴 수정 모달에서 코스 사용을 끄고 저장해도 points 가 전량 나간다 (B-25 · spec 074)', async () => {
    const user = userEvent.setup()
    const captured: UpdateCourseRequest[] = []
    server.use(
      http.put(UPDATE_COURSE_PATH, async ({ request }) => {
        captured.push((await request.json()) as UpdateCourseRequest)
        return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
      })
    )
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '수정' }))
    await user.click(await screen.findByRole('switch', { name: '코스 사용' }))
    // 스위치만으로는 저장되지 않는다
    expect(captured).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toMatchObject({ courseSeq: 1, siteSeq: 7, useYn: false, switchYn: true, totalMin: null })
    expect(captured[0].points).toHaveLength(3)
  })

  it('🔴 편성 편집은 모달이다 — 경로 카드는 그대로 · 취소로 닫힌다 (spec 074)', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '지점 편성 편집' }))

    const dialog = await screen.findByRole('dialog', { name: '지점 순서 편집' })
    expect(screen.getByText('순찰 경로')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '취소' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '지점 순서 편집' })).toBeNull())
  })

  it('🔴 바꾼 내용이 있으면 Esc 로 바로 닫지 않고 버릴지 묻는다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '지점 편성 편집' }))
    const dialog = await screen.findByRole('dialog', { name: '지점 순서 편집' })
    await user.click(within(dialog).getAllByRole('button', { name: / 메뉴$/ })[0])
    await user.click(await screen.findByRole('menuitem', { name: '편성에서 제거' }))
    await user.keyboard('{Escape}')

    expect(await screen.findByText('변경 내용을 버리시겠습니까?')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: '지점 순서 편집' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '버리기' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '지점 순서 편집' })).toBeNull())
  })
})

describe('ZoneDetailPage — 순찰 기록·KPI (B단)', () => {
  it('KPI 3종과 최근 순찰 기록이 상세에 함께 그려진다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(await screen.findByText('마지막 순찰')).toBeInTheDocument()
    expect(screen.getByText('평균 소요시간')).toBeInTheDocument()
    expect(screen.getByText('지점 인증률')).toBeInTheDocument()
    expect(screen.queryByText('미인증 지점')).not.toBeInTheDocument()
    expect(await screen.findByText('최근 순찰 기록')).toBeInTheDocument()
  })

  it('🔴 30일 밖 이력은 오지 않는다 — 기간이 쿼리로 나간다', async () => {
    renderPage('/zones/1')

    // mock 시드의 historySeq 108 은 45일 전이다. 기간이 안 걸리면 7건이 아니라 8건이 온다
    await screen.findByText('최근 순찰 기록')
    expect(await screen.findByText(/최근 30일 · 7건/)).toBeInTheDocument()
  })

  it('🔴 이력이 없는 코스는 빈 상태이고 KPI 가 — 다 — 0 으로 적지 않는다', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    // 기록 표 · 시간대별 · 근무자별이 모두 빈 상태다
    expect((await screen.findAllByText('순찰 기록이 없습니다')).length).toBe(3)
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('시간대별 순찰 · 근무자별 카드가 오른쪽에 그려진다 — 근무자 없는 회차는 따로 (spec 074)', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(await screen.findByText('시간대별 순찰')).toBeInTheDocument()
    const workers = await screen.findByRole('list', { name: '근무자별 순찰' })
    expect(workers).toHaveTextContent('박성민')
    expect(workers).toHaveTextContent('근무자 없음')
  })

  it('🔴 기록 행을 누르면 회차 상세 모달 — 지점별 결과 · 미인증 · 상세 보기 · 이전/다음 (spec 074 · D11)', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    const rows = await screen.findAllByRole('row', { name: /회차 상세/ })
    const target = rows.find((row) => row.textContent?.includes('정우현'))!
    await user.click(target)

    const points = await screen.findByRole('list', { name: '지점별 결과' })
    expect(within(points).getAllByRole('listitem')).toHaveLength(3)
    expect(within(points).getAllByText('미인증').length).toBeGreaterThan(0)
    expect(screen.queryByText(/누락/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '상세 보기' })).toHaveAttribute('href', '/patrol/zones/103')

    const before = screen.getByText(/^\d+ \/ 7/).textContent
    await user.click(screen.getByRole('button', { name: '다음 회차' }))
    await waitFor(() => expect(screen.getByText(/^\d+ \/ 7/).textContent).not.toBe(before))

    // ← 키로 되돌아간다
    await user.keyboard('{ArrowLeft}')
    await waitFor(() => expect(screen.getByText(/^\d+ \/ 7/).textContent).toBe(before))
  })
})
