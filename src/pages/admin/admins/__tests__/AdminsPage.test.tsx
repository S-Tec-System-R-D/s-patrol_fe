import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import AdminsPage from '../AdminsPage'

/**
 * `/admin/admins` 관리자 목록 · 상세 모달 · 담당 그룹 (`spec 045` T825 · T828 · T830 · T835).
 *
 * 시드(`groups.ts` — 실서버 관리자 5명 · 할당):
 * 1 시스템관리자(2) · 3 김용우(3) · 4 이현성(3) · 6 테스트(4) · 12 test(3)
 * 할당 g1[1] · g2[3, 4] · g4[3, 12] · g6[1, 3, 4] · g8[3, 12]
 * 트리 1 에스텍시스템 ─ 2 테스트사업장(수정)[3 강동지사 · 7] · 4 test[8] · 6 테스트그룹[9] · 10 본사 직할[11]
 */

const GROUP_ADMIN_PATH = '/api/v1/Group/W/sign/GetGroupAdminList'
const UPDATE_GROUP_PATH = '/api/v1/Group/W/sign/UpdateGroup'

const loginAs = (jwtRole: string, userSeq = '1') =>
  setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: jwtRole, userSeq }))

const renderPage = (initialEntry = '/admin/admins') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/admins" element={<AdminsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const table = () => within(screen.getByRole('table'))
/** 본문 행 → [이름, 권한, 담당 그룹] */
const rowTexts = () =>
  table()
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))
const names = () => rowTexts().map(([name]) => name)

const totalLine = (count: number) =>
  screen.findByText((_, element) => element?.tagName === 'P' && element.textContent === `총 ${count}명`)

/** 변경계 요청 기록 — `{ method, path, groupSeq?, body? }` */
interface Recorded {
  method: string
  path: string
  groupSeq: string | null
  body?: { groupSeq: number; userSeq: number[] }
}
const record = () => {
  const requests: Recorded[] = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    const entry: Recorded = { method: request.method, path: url.pathname, groupSeq: url.searchParams.get('groupSeq') }
    requests.push(entry)
    if (request.method === 'PUT') void request.clone().json().then((body) => (entry.body = body))
  })
  return requests
}

/** 🔴 이름 칸을 누른다 — 시스템관리자는 이름과 권한 뱃지 글자가 같다 */
const openAdmin = async (name: string) => {
  await screen.findByRole('table')
  await userEvent.click(table().getAllByText(name)[0])
  return screen.findByRole('dialog', { name })
}

beforeEach(() => {
  clearTokens()
  loginAs('SystemManager')
  resetGroupStore()
  resetUserStore()
})

afterEach(() => server.events.removeAllListeners())

describe('AdminsPage — 목록 (US1)', () => {
  it('회사(루트)는 전원 · 열 3개 · 권한은 codeSeq 라벨 · 담당 그룹 외 N개', async () => {
    renderPage()
    expect(await totalLine(5)).toBeInTheDocument()
    expect(rowTexts()).toEqual([
      ['시스템관리자', '시스템관리자', '에스텍시스템 외 1개'],
      ['김용우', '마스터', '테스트사업장(수정) 외 3개'],
      ['이현성', '마스터', '테스트사업장(수정) 외 1개'],
      ['테스트', '매니저', '—'],
      ['test', '마스터', 'test 외 1개'],
    ])
    const headers = table().getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['이름', '권한', '담당 그룹'])
  })

  it('본부는 자기 + 자손 지사 할당', async () => {
    renderPage('/admin/admins?group=4')
    expect(await totalLine(2)).toBeInTheDocument()
    expect(names()).toEqual(['김용우', 'test'])
  })

  it('이름 검색 · 권한 필터 · 잘못된 role 은 전체', async () => {
    const { unmount } = renderPage('/admin/admins?q=용우')
    expect(await totalLine(1)).toBeInTheDocument()
    unmount()

    const second = renderPage('/admin/admins?role=manager')
    expect(await totalLine(1)).toBeInTheDocument()
    expect(names()).toEqual(['테스트'])
    second.unmount()

    renderPage('/admin/admins?role=system')
    expect(await totalLine(5)).toBeInTheDocument()
  })

  it('빈 상태 — 범위 0 이 검색 결과 없음보다 먼저', async () => {
    renderPage('/admin/admins?group=10&q=없는이름')
    expect(await screen.findByText('이 그룹에 할당된 관리자가 없습니다.')).toBeInTheDocument()
  })

  it('검색 결과 0', async () => {
    renderPage('/admin/admins?q=없는이름')
    expect(await screen.findByText('검색 결과가 없습니다.')).toBeInTheDocument()
  })

  it('🔴 그룹별 조회 하나라도 실패하면 표 없이 실패 + 다시 시도', async () => {
    server.use(
      http.get(GROUP_ADMIN_PATH, ({ request }) =>
        new URL(request.url).searchParams.get('groupSeq') === '8'
          ? HttpResponse.json({ message: '서버 오류', data: null, code: 500 }, { status: 500 })
          : undefined
      )
    )
    renderPage()
    expect(await screen.findByText('관리자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})

describe('AdminsPage — 상세 모달 (US2)', () => {
  it('사번 · 연락처 · 담당 그룹 목록', async () => {
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    expect(await dialog.findByText('232727')).toBeInTheDocument()
    expect(dialog.getByText('010-0000-0003')).toBeInTheDocument()
    const groups = within(dialog.getByRole('region', { name: '담당 그룹' }))
    expect(groups.getByText('테스트사업장(수정)')).toBeInTheDocument()
    expect(groups.getByText('test › 본부할당 사업장')).toBeInTheDocument()
    expect(groups.getByText('테스트그룹')).toBeInTheDocument()
  })

  it('🔴 시스템관리자 = 잠금 안내 + 닫기 · 계정 버튼 없음', async () => {
    renderPage()
    const dialog = within(await openAdmin('시스템관리자'))
    expect(dialog.getByText(/시스템 구축 시 생성된 계정/)).toBeInTheDocument()
    expect(dialog.getByRole('button', { name: '닫기' })).toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })

  it('상세 실패 시 기본 정보만 실패 — 담당 그룹은 그대로', async () => {
    server.use(
      http.get('/api/v1/User/W/sign/UserDetail', () =>
        HttpResponse.json({ message: '사용자를 찾을 수 없습니다.', data: null, code: 404 }, { status: 404 })
      )
    )
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    expect(await dialog.findByText(/정보를 불러오지 못했습니다/)).toBeInTheDocument()
    expect(dialog.getByText('테스트그룹')).toBeInTheDocument()
  })
})

describe('AdminsPage — 계정 관리 자리 (US3)', () => {
  it('🔴 추가 · 수정 · 비밀번호 · 삭제 disabled · 활성화 없음 · User 변경 요청 0건', async () => {
    const requests = record()
    renderPage()
    expect(screen.getByRole('button', { name: '관리자 추가' })).toBeDisabled()

    const dialog = within(await openAdmin('김용우'))
    for (const name of ['삭제', '비밀번호', '수정']) {
      expect(dialog.getByRole('button', { name })).toBeDisabled()
    }
    expect(dialog.queryByRole('button', { name: /활성화/ })).not.toBeInTheDocument()
    expect(requests.filter((r) => r.path.startsWith('/api/v1/User/') && r.method !== 'GET')).toEqual([])
  })
})

describe('AdminsPage — 담당 그룹 (US4)', () => {
  it('🔴 추가: 선택지에 회사 · 이미 맡은 그룹 없음 · 그룹마다 읽기 → PUT(현재 ∪ 대상) · 트리 순서', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('테스트'))
    await userEvent.click(dialog.getByRole('button', { name: '그룹 추가' }))

    const picker = within(await screen.findByRole('dialog', { name: '담당 그룹 추가' }))
    expect(picker.queryByText('에스텍시스템')).not.toBeInTheDocument()
    // 선택 순서와 반대로 눌러도 트리 순서(3 → 4)로 보낸다
    await userEvent.click(picker.getByLabelText('test'))
    await userEvent.click(picker.getByLabelText('강동지사'))
    await userEvent.click(picker.getByRole('button', { name: '추가 (2)' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '담당 그룹 추가' })).not.toBeInTheDocument())
    const puts = requests.filter((r) => r.path === UPDATE_GROUP_PATH)
    expect(puts.map((r) => r.body?.groupSeq)).toEqual([3, 4])
    expect(puts.map((r) => r.body?.userSeq)).toEqual([[6], [3, 12, 6]])
    // 🔴 각 PUT 바로 앞에 그 그룹의 현재 할당 읽기(B-50)
    const sequence = requests
      .filter((r) => r.method === 'PUT' || r.groupSeq === '3' || r.groupSeq === '4')
      .map((r) => (r.method === 'PUT' ? 'PUT' : `GET${r.groupSeq}`))
    expect(sequence.join(' ')).toContain('GET3 PUT GET4 PUT')

    const groups = within(within(await screen.findByRole('dialog', { name: '테스트' })).getByRole('region', { name: '담당 그룹' }))
    expect(await groups.findByText('테스트사업장(수정) › 강동지사')).toBeInTheDocument()
    expect(groups.getByText('test')).toBeInTheDocument()
  })

  it('🔴 해제: PUT(현재 − 대상) · 회사 행엔 해제 없음', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('시스템관리자'))
    expect(dialog.queryByRole('button', { name: '에스텍시스템 해제' })).not.toBeInTheDocument()

    await userEvent.click(dialog.getByRole('button', { name: '테스트그룹 해제' }))
    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.body)).toBe(true))
    const put = requests.find((r) => r.method === 'PUT')
    expect(put?.body).toMatchObject({ groupSeq: 6, userSeq: [3, 4] })
    await waitFor(() => expect(dialog.queryByText('테스트그룹')).not.toBeInTheDocument())
  })

  it('MANAGER 에게는 그룹 추가 · 해제가 없다', async () => {
    loginAs('Manager', '6')
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    expect(dialog.queryByRole('button', { name: '그룹 추가' })).not.toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: /해제$/ })).not.toBeInTheDocument()
  })

  it('🔴 Master 가 자기 자신을 해제하면 확인을 받는다', async () => {
    loginAs('Master', '3')
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    await userEvent.click(dialog.getByRole('button', { name: 'test 해제' }))

    const confirm = within(await screen.findByRole('alertdialog'))
    expect(confirm.getByText(/더 이상 관리할 수 없습니다/)).toBeInTheDocument()
    expect(requests.some((r) => r.method === 'PUT')).toBe(false)

    await userEvent.click(confirm.getByRole('button', { name: '해제' }))
    await waitFor(() => expect(requests.find((r) => r.method === 'PUT')?.body).toMatchObject({ groupSeq: 4, userSeq: [12] }))
  })
})
