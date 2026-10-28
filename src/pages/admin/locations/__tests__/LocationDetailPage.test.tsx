import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { addSite } from '@/features/sites/api/addSite'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetEmergencyStore } from '@/mocks/handlers/emergency'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import LocationDetailPage from '../LocationDetailPage'

/**
 * `/admin/locations/:id` 사업장 상세 (`spec 044` T803).
 *
 * 시드: 3 테테테(수정)1(강동지사 · 하위 4 · 헬스체크 사용 30분 · 코스 13 · 지점 15)
 * / 6 테스트 사업장2(지사 8 · 하위 7·8 · 코스 7 · 지점 16 · 근무자 5) / 9 강동지사_추가사업장(전부 0).
 * 담당 관리자(`spec 057` — 매니저만): 강동지사(G3) = 매니저 6 테스트 · 지사 8 = 매니저 없음(마스터 할당뿐).
 * 비상연락망 시드: 사업장 3 = 월 테스트(6) · 토 김용우(3). 근무자 MSW: 오준혁(103) = 소속 12 · 사업장 7 에 배치 중.
 */

const UPDATE_PATH = '/api/v1/Site/W/sign/UpdateSite'

const UrlProbe = () => {
  const { pathname, search } = useLocation()
  return <div data-testid="url">{pathname + search}</div>
}

const renderPage = (initialEntry: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <UrlProbe />
        <Routes>
          <Route path="/admin/locations" element={<div>LIST_ROUTE</div>} />
          <Route path="/admin/locations/:id" element={<LocationDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const url = () => screen.getByTestId('url').textContent ?? ''

const captureUpdates = () => {
  const bodies: unknown[] = []
  server.events.on('request:start', async ({ request }) => {
    if (new URL(request.url).pathname === UPDATE_PATH) bodies.push(await request.clone().json())
  })
  return bodies
}

/** 수정 모달을 연다 — 목록 노드를 찾아야 버튼이 열린다 */
const openEdit = async (user: ReturnType<typeof userEvent.setup>) => {
  const button = await screen.findByRole('button', { name: '사업장 수정' })
  await waitFor(() => expect(button).toBeEnabled())
  await user.click(button)
  return within(await screen.findByRole('dialog'))
}

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken())
  resetGroupStore()
  resetUserStore()
  resetEmergencyStore()
})

afterEach(() => server.events.removeAllListeners())

describe('LocationDetailPage — 머리 · 기본정보 · 담당 관리자', () => {
  it('머리(경로 · 이름) · 기본정보 카드 · 헬스체크 뱃지 · 탭 · 운영 중지 · 계약 기간 없음', async () => {
    renderPage('/admin/locations/3')
    expect(await screen.findByRole('heading', { name: '테테테(수정)1' })).toBeInTheDocument()
    expect(await screen.findAllByText('테스트사업장(수정) › 강동지사')).toHaveLength(2) // 머리 경로 + 소속 그룹 행
    expect(screen.getByText('서울시')).toBeInTheDocument()
    expect(screen.getByText('0123125165')).toBeInTheDocument()
    expect(screen.getByText('13개 · 15개')).toBeInTheDocument()
    expect(screen.getByText('1개')).toBeInTheDocument() // 하위 사업장
    expect(screen.getByText('사용 · 30분')).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText(/운영 중지|계약 기간/)).not.toBeInTheDocument()
  })

  it('하위 사업장이 없으면 그 행을 두지 않는다', async () => {
    renderPage('/admin/locations/9')
    await screen.findByText('경기도~~')
    expect(screen.queryByText('하위 사업장')).not.toBeInTheDocument()
  })

  it('🔴 담당 관리자 = GetSiteManagerList 의 매니저만 · [관리자 지정] 없음 · GetGroupAdminList 호출 없음', async () => {
    const called: string[] = []
    server.events.on('request:start', ({ request }) => {
      called.push(new URL(request.url).pathname.split('/').pop() ?? '')
    })
    renderPage('/admin/locations/3')
    const list = await screen.findByRole('list', { name: '담당 관리자' })
    // 마스터(전체 담당)는 응답에 있어도 그리지 않는다
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['테스트매니저'])
    expect(screen.queryByRole('button', { name: '관리자 지정' })).not.toBeInTheDocument()
    expect(called).toContain('GetSiteManagerList')
    expect(called).not.toContain('GetGroupAdminList')
  })

  it('매니저가 없으면 빈 상태 — 마스터만 할당된 지사', async () => {
    renderPage('/admin/locations/6')
    expect(await screen.findByText('지정된 담당 관리자가 없습니다')).toBeInTheDocument()
  })

  it('할당이 없으면 빈 상태', async () => {
    // 강동지사(G3)는 매니저 6 할당이 있다(시드 — `spec 056`) → 할당 없는 지사 G7 의 사업장 2
    renderPage('/admin/locations/2')
    expect(await screen.findByText('지정된 담당 관리자가 없습니다')).toBeInTheDocument()
  })

  it('브레드크럼 → 이 사업장의 지사를 고른 목록(046 #3)', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/6')
    await screen.findByText('지정된 담당 관리자가 없습니다')
    await user.click(within(screen.getByRole('navigation', { name: '현재 위치' })).getByRole('link', { name: '사업장' }))
    expect(url()).toBe('/admin/locations?group=8')
  })
})

describe('LocationDetailPage — 정보 수정', () => {
  it('🔴 연락처를 지우면 tel: "" · 최상위는 groupSeq 를 싣는다 → 닫히고 반영', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderPage('/admin/locations/9')
    const dialog = await openEdit(user)

    expect(dialog.getByLabelText('대표 연락처')).toHaveValue('02-1234-5677')
    await user.clear(dialog.getByLabelText('대표 연락처'))
    await user.clear(dialog.getByLabelText('사업장명'))
    await user.type(dialog.getByLabelText('사업장명'), '강동 새이름')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    expect(await screen.findByRole('heading', { name: '강동 새이름' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bodies).toEqual([
      { siteSeq: 9, siteName: '강동 새이름', address: '경기도~~', tel: '', groupSeq: 3 },
    ])
  })

  it('🔴 하위 사업장은 본부 · 지사 · 모 사업장 disabled + 이유 · 바디에 groupSeq 없음', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderPage('/admin/locations/4')
    const dialog = await openEdit(user)

    expect(dialog.getByRole('combobox', { name: '본부' })).toBeDisabled()
    expect(dialog.getByRole('combobox', { name: '지사' })).toBeDisabled()
    expect(dialog.getByRole('combobox', { name: '모 사업장' })).toHaveTextContent('테테테(수정)1')
    expect(dialog.getByRole('combobox', { name: '모 사업장' })).toBeDisabled()
    expect(dialog.getByText('하위 사업장은 관리그룹을 변경할 수 없습니다. 모 사업장을 이동해주세요.')).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty('groupSeq')
  })

  it('하위 사업장이 있으면 함께 이동한다고 알린다', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/3')
    const dialog = await openEdit(user)
    expect(dialog.getByText('하위 사업장 1개도 함께 이동합니다.')).toBeInTheDocument()
  })

  it('최상위 사업장 — 모 사업장 "없음" 읽기 전용 · 다른 본부의 지사로 옮긴다(spec 051)', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    renderPage('/admin/locations/9')
    const dialog = await openEdit(user)

    expect(dialog.getByRole('combobox', { name: '본부' })).toHaveTextContent('테스트사업장(수정)')
    expect(dialog.getByRole('combobox', { name: '지사' })).toHaveTextContent('강동지사')
    expect(dialog.getByRole('combobox', { name: '모 사업장' })).toHaveTextContent('없음 (최상위 사업장)')
    expect(dialog.getByRole('combobox', { name: '모 사업장' })).toBeDisabled()

    await user.click(dialog.getByRole('combobox', { name: '본부' }))
    await user.click(screen.getByRole('option', { name: 'test' }))
    await user.click(dialog.getByRole('combobox', { name: '지사' }))
    await user.click(screen.getByRole('option', { name: '본부할당 사업장' }))
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ groupSeq: 8 })
  })

  it('🔴 지사가 아닌 현재 그룹(실서버 데이터)이면 지사를 다시 골라야 저장된다', async () => {
    const user = userEvent.setup()
    const bodies = captureUpdates()
    await addSite({ groupSeq: 2, siteName: '본부소속', address: '서울' }) // 서버는 단계를 막지 않는다 — seq 13
    renderPage('/admin/locations/13')
    const dialog = await openEdit(user)

    expect(dialog.getByRole('combobox', { name: '지사' })).toHaveTextContent('지사를 선택해주세요')
    await user.click(dialog.getByRole('button', { name: '저장' }))
    expect(await dialog.findByText('지사를 선택해주세요.')).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('🔴 같은 이름(409) → 모달과 입력값이 남는다', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/9')
    const dialog = await openEdit(user)
    await user.clear(dialog.getByLabelText('사업장명'))
    await user.type(dialog.getByLabelText('사업장명'), '지가사업장')
    await user.click(dialog.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(dialog.getByRole('button', { name: '저장' })).toBeEnabled())
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(dialog.getByLabelText('사업장명')).toHaveValue('지가사업장')
  })
})

describe('LocationDetailPage — 삭제', () => {
  it('🔴 문구에 하위 · 코스 · 지점 · 근무자 수 → 삭제 후 지사 목록으로', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/6')
    await screen.findByText('지정된 담당 관리자가 없습니다')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    const alert = await screen.findByRole('alertdialog')
    // 🔴 대상은 질문형 제목이, 영향은 설명이 말한다(046 #16)
    expect(within(alert).getByText("'테스트 사업장2' 사업장을 삭제하시겠습니까?")).toBeInTheDocument()
    expect(
      within(alert).getByText(
        '하위 사업장 2개 · 순찰 코스 7개 · 지점 16개 · 근무자 5명 정보에 영향이 있습니다. 삭제된 데이터는 복구할 수 없습니다.'
      )
    ).toBeInTheDocument()
    await user.click(within(alert).getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
    expect(url()).toBe('/admin/locations?group=8')
  })

  it('0 인 항목은 뺀다', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/9')
    await user.click(await screen.findByRole('button', { name: '삭제' }))
    expect(await screen.findByText("'강동지사_추가사업장' 사업장을 삭제하시겠습니까?")).toBeInTheDocument()
    expect(screen.getByText('삭제된 데이터는 복구할 수 없습니다.')).toBeInTheDocument()
  })
})

describe('LocationDetailPage — 없음 · 주소 오류', () => {
  it('🔴 없는 사업장 → 불러오지 못함(조회 중에는 뜨지 않는다)', async () => {
    renderPage('/admin/locations/999')
    expect(screen.getByLabelText('사업장 불러오는 중')).toBeInTheDocument()
    expect(screen.queryByText('사업장을 불러오지 못했습니다')).not.toBeInTheDocument()
    expect(await screen.findByText('사업장을 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })

  it('숫자가 아닌 주소 → 요청 없이 안내 · 다시 시도 없음', () => {
    renderPage('/admin/locations/abc')
    expect(screen.getByText('주소가 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
  })
})

describe('LocationDetailPage — 비상연락망 (spec 057)', () => {
  const EMERGENCY = '/api/v1/Emergency/W/sign'
  const week = () => within(screen.getByRole('table', { name: '요일별 담당자' }))
  const dayCell = (label: string) => within(week().getByRole('rowheader', { name: label }).closest('tr') as HTMLElement)

  const recordEmergency = () => {
    const calls: { name: string; search: string; body?: unknown }[] = []
    server.events.on('request:start', ({ request }) => {
      const parsed = new URL(request.url)
      if (!parsed.pathname.startsWith(EMERGENCY) || request.method === 'GET') return
      const entry: { name: string; search: string; body?: unknown } = {
        name: parsed.pathname.split('/').pop() ?? '',
        search: parsed.search,
      }
      calls.push(entry)
      if (request.method === 'POST') void request.clone().json().then((body) => (entry.body = body))
    })
    return calls
  }

  const openAdd = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(await screen.findByRole('button', { name: `${label}요일 담당자 추가` }))
    const dialog = within(await screen.findByRole('dialog', { name: `${label}요일 담당자 추가` }))
    await dialog.findByRole('list', { name: '담당자 후보' })
    return dialog
  }

  it('7요일 · 칩(이름 · 권한 · 연락처) · 담당자 N명(중복 제거) · 예시 안내 · 담당자 풀 없음', async () => {
    renderPage('/admin/locations/3')
    await screen.findByRole('table', { name: '요일별 담당자' })
    expect(week().getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['월', '화', '수', '목', '금', '토', '일'])
    expect(dayCell('월').getByText('테스트')).toBeInTheDocument()
    expect(dayCell('월').getByText('010-0000-0006')).toBeInTheDocument()
    expect(dayCell('토').getByText('마스터')).toBeInTheDocument()
    expect(screen.getByText('담당자 2명')).toBeInTheDocument()
    expect(screen.queryByText(/예시 화면/)).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '담당자 풀' })).not.toBeInTheDocument()
  })

  it('🔴 추가 모달: 시스템관리자 없음 · 이미 등록 잠금 · 배치 중 뱃지 · 검색', async () => {
    const user = userEvent.setup()
    renderPage('/admin/locations/3')
    const dialog = await openAdd(user, '월')
    expect(dialog.queryByLabelText('시스템관리자')).not.toBeInTheDocument()
    expect(dialog.getByLabelText('테스트')).toBeChecked()
    expect(dialog.getByLabelText('테스트')).toBeDisabled()
    expect(dialog.getByText('배치 중 · 테스트 사업장2-1')).toBeInTheDocument()

    await user.type(dialog.getByLabelText('담당자 검색'), '오준')
    const people = within(dialog.getByRole('list', { name: '담당자 후보' })).getAllByRole('checkbox')
    expect(people).toHaveLength(1)
  })

  it('🔴 여러 명 추가 = 고른 사람마다 AddEmergency 차례로 · 닫히고 칩이 보인다', async () => {
    const user = userEvent.setup()
    const calls = recordEmergency()
    renderPage('/admin/locations/3')
    const dialog = await openAdd(user, '화')
    await user.click(dialog.getByLabelText('김용우'))
    await user.click(dialog.getByLabelText('이현성'))
    await user.click(dialog.getByRole('button', { name: '추가 (2)' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(calls.map((call) => [call.name, call.body])).toEqual([
      ['AddEmergency', { siteSeq: 3, userSeq: 3, day: 'TUE' }],
      ['AddEmergency', { siteSeq: 3, userSeq: 4, day: 'TUE' }],
    ])
    expect(await dayCell('화').findByText('이현성')).toBeInTheDocument()
    expect(dayCell('화').getByText('김용우')).toBeInTheDocument()
  })

  it('🔴 첫 실패에서 멈춘다 · 모달 유지', async () => {
    const user = userEvent.setup()
    const calls = recordEmergency()
    server.use(
      http.post(`${EMERGENCY}/AddEmergency`, () =>
        HttpResponse.json({ message: '담당자가 존재하지 않습니다.', data: false, code: 400 }, { status: 400 })
      )
    )
    renderPage('/admin/locations/3')
    const dialog = await openAdd(user, '화')
    await user.click(dialog.getByLabelText('김용우'))
    await user.click(dialog.getByLabelText('이현성'))
    await user.click(dialog.getByRole('button', { name: '추가 (2)' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(screen.getByRole('dialog', { name: '화요일 담당자 추가' })).toBeInTheDocument()
  })

  it('칩 해제 = DeleteEmergency(siteSeq · userSeq · day) · 칩 사라짐', async () => {
    const user = userEvent.setup()
    const calls = recordEmergency()
    renderPage('/admin/locations/3')
    await user.click(await screen.findByRole('button', { name: '월요일 테스트 해제' }))

    await waitFor(() => expect(dayCell('월').queryByText('테스트')).not.toBeInTheDocument())
    expect(calls).toEqual([{ name: 'DeleteEmergency', search: '?siteSeq=3&userSeq=6&day=MON' }])
    expect(screen.getByText('담당자 1명')).toBeInTheDocument()
  })
})
