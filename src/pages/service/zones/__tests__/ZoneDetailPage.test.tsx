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

beforeEach(() => {
  resetCourseStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
})

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

  it('🔴 숫자가 아닌 세그먼트는 조회를 시도하지 않고 안내로 끝난다', async () => {
    renderPage('/zones/abc')

    expect(await screen.findByText('코스를 찾을 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText(/주소가 올바르지 않습니다/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '코스 목록으로' })).toBeInTheDocument()
  })

  it('🔴 수정·삭제 수단이 헤더에 있다 — 본문 아래 풋터가 아니다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('🔴 변경 수단 셋이 **헤더 한 줄**에 모여 있다 (A단) — 편성 편집이 카드 밖으로 나왔다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(screen.getByRole('button', { name: '편성 편집' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('🔴 편집 중에는 헤더의 편성 편집이 사라진다 — 편집 모드에 자기 저장·취소가 있다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '편성 편집' }))

    expect(screen.queryByRole('button', { name: '편성 편집' })).not.toBeInTheDocument()
  })

  it('🔴 제목 줄에 규모 요약 뱃지가 있다 (A단) — 두 카드에 흩어진 값을 한 번에 읽는다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    // mock 코스 1: 지점 3개 · 총 45분
    expect(screen.getByText('지점 3개 · 45분')).toBeInTheDocument()
  })

  it('지점 0개 코스도 요약 뱃지를 그대로 적는다 — 경고로 바꾸지 않는다 (규칙 12)', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(screen.getByText(/지점 0개/)).toBeInTheDocument()
  })
})

describe('ZoneDetailPage — 조회 섹션 조립 (Phase 3)', () => {
  it('🔴 다이어그램·지점 순서·기본정보가 한 응답에서 함께 그려진다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    // 지점 순서 카드 + 기본정보 카드
    expect(screen.getByText('지점 순서')).toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(screen.getByText('총 3개')).toBeInTheDocument()
    // 다이어그램 노드와 순서 목록이 같은 지점을 그린다 — 이름이 두 번 나온다
    expect(screen.getAllByText('정문 입구')).toHaveLength(2)
  })

  it('🔴 지점 0개 코스는 빈 상태 2개로 그려진다 — 경고·자동 조치가 없다 (규칙 12)', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(screen.getByText('지점이 없습니다')).toBeInTheDocument()
    expect(screen.getByText('편성된 지점이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('준비 중')).not.toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '삭제' }))

    await waitFor(() => expect(params[0]).toBe('1'))
    expect(params[1]).toBeNull()
  })

  it('🔴 삭제 성공 → 목록으로 돌아간다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '삭제' }))
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
    await user.click(screen.getByRole('button', { name: '삭제' }))
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
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(called).toBe(0)
  })

  it('🔴 토글은 확인 모달을 거친다 — 스위치만 눌러서는 저장되지 않는다', async () => {
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
    await user.click(screen.getByLabelText('사용'))

    expect(await screen.findByText('코스를 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(captured).toHaveLength(0)
  })

  it('🔴 토글 저장에도 points 가 전량 나간다 — 빼면 지점이 전부 사라진다 (B-25)', async () => {
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
    await user.click(screen.getByLabelText('사용'))
    await user.click(await screen.findByRole('button', { name: '비활성화' }))

    await waitFor(() => expect(captured).toHaveLength(1))
    expect(captured[0]).toMatchObject({ courseSeq: 1, siteSeq: 7, useYn: false, totalMin: null })
    // mock 코스 1 은 지점 3개다 — 하나도 빠지지 않는다
    expect(captured[0].points).toHaveLength(3)
  })

  it('🔴 토글 모달을 취소하면 아무 요청도 나가지 않는다', async () => {
    const user = userEvent.setup()
    let called = 0
    server.use(
      http.put(UPDATE_COURSE_PATH, () => {
        called += 1
        return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })
      })
    )
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByLabelText('허용'))
    await user.click(await screen.findByRole('button', { name: '취소' }))

    expect(called).toBe(0)
  })

  it('🔴 교대 허용과 코스 활성화가 **다른 문구**로 묻는다 (규칙 11)', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByLabelText('허용'))

    expect(await screen.findByText('교대 허용을 끄시겠습니까?')).toBeInTheDocument()
    expect(screen.queryByText(/코스 목록에서 숨겨져/)).not.toBeInTheDocument()
  })

  it('편성 편집으로 들어가고 취소로 돌아온다', async () => {
    const user = userEvent.setup()
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    await user.click(screen.getByRole('button', { name: '편성 편집' }))

    expect(screen.getByText('지점 순서 편집')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.getByText('지점 순서')).toBeInTheDocument()
  })
})

describe('ZoneDetailPage — 순찰 기록·KPI (B단)', () => {
  it('KPI 4종과 최근 순찰 기록이 상세에 함께 그려진다', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(await screen.findByText('30일 순찰 수행')).toBeInTheDocument()
    expect(screen.getByText('평균 소요시간')).toBeInTheDocument()
    expect(screen.getByText('지점 인증률')).toBeInTheDocument()
    expect(screen.getByText('미인증 지점')).toBeInTheDocument()
    expect(await screen.findByText('최근 순찰 기록')).toBeInTheDocument()
  })

  it('🔴 30일 밖 이력은 오지 않는다 — 기간이 쿼리로 나간다', async () => {
    renderPage('/zones/1')

    // mock 시드의 historySeq 108 은 45일 전이다. 기간이 안 걸리면 7건이 아니라 8건이 온다
    await screen.findByText('최근 순찰 기록')
    expect(await screen.findByText(/최근 30일 · 7건/)).toBeInTheDocument()
  })

  it('🔴 미인증 건수를 서버가 센 대로 보여준다 — 화면이 다시 세지 않는다', async () => {
    renderPage('/zones/1')

    // 🔴 **건수를 하드코딩하지 않는다.** mock 의 지점이력은 `coursesOfPoint` 에서 파생되고
    // (단일 출처, 제약 7) 편성을 바꾸면 따라 변한다 — 숫자를 박으면 편성 시드를 건드릴
    // 때마다 이 테스트가 깨진다. 여기서 고정하는 것은 **"— 가 아니라 숫자가 온다"** 다
    const label = await screen.findByText('미인증 지점')
    const card = label.parentElement as HTMLElement
    await waitFor(() => expect(within(card).getByText(/^\d+$/)).toBeInTheDocument())
    expect(within(card).getByText('건')).toBeInTheDocument()
  })

  it('🔴 이력이 없는 코스는 빈 상태이고 KPI 가 — 다 — 0 으로 적지 않는다', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(await screen.findByText('순찰 기록이 없습니다')).toBeInTheDocument()
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('이상 이력 카드가 우측 열에 쌓인다 (C단)', async () => {
    renderPage('/zones/1')

    await screen.findByText('A동 순찰코스')
    expect(await screen.findByText('미인증 · 이상 이력')).toBeInTheDocument()
  })

  it('🔴 이상 이력은 요청을 더 하지 않는다 — 기록·미인증 응답에서 모은다', async () => {
    renderPage('/zones/1')

    // mock 시드: 코스 1 에 미완료 2건 + 초과 1건 + 미인증 지점 이력
    await screen.findByText('미인증 · 이상 이력')
    expect(await screen.findByText('소요시간 초과')).toBeInTheDocument()
    expect(screen.getAllByText('순찰 미완료').length).toBeGreaterThan(0)
  })

  it('🔴 이상이 없는 코스는 "이상이 없습니다" 다 — 빈 상태가 아니다', async () => {
    renderPage('/zones/3')

    await screen.findByText('옥상 점검 코스')
    expect(await screen.findByText(/이상이 없습니다/)).toBeInTheDocument()
  })
})
