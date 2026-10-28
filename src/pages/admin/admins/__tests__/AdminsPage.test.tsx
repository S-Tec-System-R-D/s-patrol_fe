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
 * `/admin/admins` 관리자 목록 · 상세 · 계정 관리 · 담당 그룹 (`spec 045` → `spec 056` T1006 — 관리자 API 6종).
 *
 * 시드(`groups.ts` — 실서버 관리자 5명):
 * 1 시스템관리자(2, 화면에 없음) · 3 김용우(3) · 4 이현성(3) · 12 test(3) — 마스터는 전체 담당 · 6 테스트(4) = 강동지사(g3)
 * 트리 1 에스텍시스템 ─ 2 테스트사업장(수정)[3 강동지사 · 7] · 4 test[8] · 6 테스트그룹[9] · 10 본사 직할[11]
 */

const ADMIN_BASE = '/api/v1/AdminUser/W/sign'

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
/** 본문 행 → [이름, 권한, 연락처, 담당 그룹] */
const rowTexts = () =>
  table()
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent))
const names = () => rowTexts().map(([name]) => name)

const totalLine = (count: number) =>
  screen.findByText((_, element) => element?.tagName === 'P' && element.textContent === `총 ${count}명`)

/** 요청 기록 — 경로 마지막 조각 · 쿼리 · 바디 */
interface Recorded {
  method: string
  name: string
  search: string
  body?: Record<string, unknown>
}
const record = () => {
  const requests: Recorded[] = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    const entry: Recorded = { method: request.method, name: url.pathname.split('/').pop() ?? '', search: url.search }
    requests.push(entry)
    if (request.method === 'PUT' || request.method === 'POST') {
      void request.clone().json().then((body) => (entry.body = body))
    }
  })
  return requests
}
const changes = (requests: Recorded[]) => requests.filter((r) => r.method !== 'GET')

/** 상세 모달 제목 — 이름은 프로필 머리에 있다(045 후속 T845 시안 A) */
const DETAIL_TITLE = '관리자 상세'

/** 이름 칸을 누른다 */
const openAdmin = async (name: string) => {
  await screen.findByRole('table')
  await userEvent.click(table().getAllByText(name)[0])
  return screen.findByRole('dialog', { name: DETAIL_TITLE })
}

/** 라벨로 찾는다 — `AppInput` 라벨 연결(999 US3, OQ-F 해소) */
const VALID_ADMIN: Record<string, string> = {
  이름: '홍길동',
  연락처: '010-1234-5678',
  사번: '9904501',
  '초기 비밀번호': 'Wf0test12!',
  '비밀번호 확인': 'Wf0test12!',
}
const fillAdminForm = async (form: ReturnType<typeof within>) => {
  for (const [label, value] of Object.entries(VALID_ADMIN)) {
    await userEvent.type(form.getByLabelText(new RegExp(`^${label}`)), value)
  }
}

const closeDialog = async () => {
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

beforeEach(() => {
  clearTokens()
  loginAs('SystemManager')
  resetGroupStore()
  resetUserStore()
})

afterEach(() => server.events.removeAllListeners())

describe('AdminsPage — 목록 (US1)', () => {
  it('🔴 회사(루트)는 전원 · 시스템관리자 없음 · 연락처 열 · 마스터 담당 전체 · 매니저 경로', async () => {
    renderPage()
    expect(await totalLine(4)).toBeInTheDocument()
    expect(rowTexts()).toEqual([
      ['김용우', '마스터', '010-0000-0003', '전체'],
      ['이현성', '마스터', '010-0000-0004', '전체'],
      ['test', '마스터', '010-1234-5678', '전체'],
      ['테스트', '매니저', '010-0000-0006', '테스트사업장(수정) › 강동지사'],
    ])
    const headers = table().getAllByRole('columnheader').map((th) => th.textContent)
    expect(headers).toEqual(['이름', '권한', '연락처', '담당 그룹'])
  })

  it('🔴 목록 요청은 트리 + GetAdminList 뿐 — 그룹마다 조회 · UserDetail 없음', async () => {
    const requests = record()
    renderPage()
    await totalLine(4)
    const called = requests.map((r) => r.name)
    expect(called).toContain('GetAdminList')
    expect(called).not.toContain('GetGroupAdminList')
    expect(called).not.toContain('UserDetail')
  })

  it('🔴 본부 · 지사는 그 그룹 + 하위에 할당된 매니저만 — 마스터 없음', async () => {
    const { unmount } = renderPage('/admin/admins?group=2')
    expect(await totalLine(1)).toBeInTheDocument()
    expect(names()).toEqual(['테스트'])
    unmount()

    renderPage('/admin/admins?group=4')
    expect(await screen.findByText('이 그룹에 할당된 관리자가 없습니다')).toBeInTheDocument()
  })

  it('트리 수는 명 단위 · 범위와 같은 규칙', async () => {
    renderPage()
    await totalLine(4)
    const item = (name: string) => screen.getAllByRole('treeitem').find((node) => node.textContent?.startsWith(name))
    expect(item('에스텍시스템')?.textContent).toContain('4명')
    expect(item('테스트사업장(수정)')?.textContent).toContain('1명')
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
    expect(await totalLine(4)).toBeInTheDocument()
  })

  it('빈 상태 — 범위 0 이 검색 결과 없음보다 먼저', async () => {
    renderPage('/admin/admins?group=10&q=없는이름')
    expect(await screen.findByText('이 그룹에 할당된 관리자가 없습니다')).toBeInTheDocument()
  })

  it('검색 결과 0', async () => {
    renderPage('/admin/admins?q=없는이름')
    expect(await screen.findByText('검색 결과가 없습니다')).toBeInTheDocument()
  })

  it('조회 실패 — 표 없이 실패 + 다시 시도', async () => {
    server.use(
      http.get(`${ADMIN_BASE}/GetAdminList`, () =>
        HttpResponse.json({ message: '서버 오류', data: null, code: 500 }, { status: 500 })
      )
    )
    renderPage()
    expect(await screen.findByText('관리자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
  })
})

describe('AdminsPage — 상세 모달 (US2)', () => {
  it('🔴 마스터: 이름 · 권한 · 사번(GetAdminDetail) · 연락처 · "전체 그룹" · 할당 조작 없음', async () => {
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    const head = within(dialog.getByRole('region', { name: '기본 정보' }))
    expect(head.getByText('마스터')).toBeInTheDocument()
    expect(await head.findByText('232727')).toBeInTheDocument()
    expect(head.getByText('010-0000-0003')).toBeInTheDocument()

    const groups = within(dialog.getByRole('region', { name: '담당 그룹' }))
    expect(groups.getByText('전체 그룹')).toBeInTheDocument()
    expect(groups.queryByRole('button', { name: '그룹 추가' })).not.toBeInTheDocument()
  })

  it('사번 조회 실패 — 그 칸만 실패 · 다시 시도', async () => {
    server.use(
      http.get(`${ADMIN_BASE}/GetAdminDetail`, () =>
        HttpResponse.json({ message: '관리자 계정이 존재하지 않습니다.', data: null, code: 400 }, { status: 400 })
      )
    )
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    expect(await dialog.findByRole('button', { name: /불러오지 못했습니다/ })).toBeInTheDocument()
    expect(dialog.getByText('010-0000-0003')).toBeInTheDocument()
  })

  it('매니저: 본부 아래 지사 칩', async () => {
    renderPage()
    const dialog = within(await openAdmin('테스트'))
    const branches = within(dialog.getByRole('list', { name: '테스트사업장(수정) 지사' }))
    expect(branches.getByText('강동지사')).toBeInTheDocument()
  })
})

describe('AdminsPage — 계정 관리 권한 (US3 · US4)', () => {
  const actions = (dialog: ReturnType<typeof within>) =>
    ['삭제', '비밀번호', '수정'].filter((name) => dialog.queryByRole('button', { name }))

  it('🔴 시스템관리자 = 마스터 · 매니저 전원', async () => {
    renderPage()
    expect(actions(within(await openAdmin('김용우')))).toEqual(['삭제', '비밀번호', '수정'])
    await closeDialog()
    expect(actions(within(await openAdmin('테스트')))).toEqual(['삭제', '비밀번호', '수정'])
  })

  it('🔴 마스터 = 본인(삭제 없음) + 매니저 · 다른 마스터 없음', async () => {
    loginAs('Master', '3')
    renderPage()
    expect(actions(within(await openAdmin('김용우')))).toEqual(['비밀번호', '수정'])
    await closeDialog()
    expect(actions(within(await openAdmin('테스트')))).toEqual(['삭제', '비밀번호', '수정'])
    await closeDialog()
    expect(actions(within(await openAdmin('이현성')))).toEqual([])
  })

  it('🔴 지사 매니저 = 본인만(삭제 없음) · [관리자 추가] 없음', async () => {
    loginAs('Manager', '6')
    renderPage()
    await totalLine(4)
    expect(screen.queryByRole('button', { name: '관리자 추가' })).not.toBeInTheDocument()
    expect(actions(within(await openAdmin('테스트')))).toEqual(['비밀번호', '수정'])
    await closeDialog()
    expect(actions(within(await openAdmin('김용우')))).toEqual([])
  })
})

describe('AdminsPage — 관리자 추가 (US3)', () => {
  const openAddForm = async () => {
    await userEvent.click(await screen.findByRole('button', { name: '관리자 추가' }))
    return within(await screen.findByRole('dialog', { name: '관리자 추가' }))
  }

  it('필수 · 형식 검증 · 비밀번호 확인 불일치 — 요청 0건', async () => {
    const requests = record()
    renderPage()
    const form = await openAddForm()
    await userEvent.click(form.getByRole('button', { name: '등록' }))
    expect(await form.findByText('사번을 입력해주세요.')).toBeInTheDocument()
    expect(form.getByText('010-0000-0000 형식으로 입력해주세요.')).toBeInTheDocument()

    await fillAdminForm(form)
    const confirm = form.getByLabelText(/^비밀번호 확인/)
    await userEvent.clear(confirm)
    await userEvent.type(confirm, 'Wf0test99!')
    await userEvent.click(form.getByRole('button', { name: '등록' }))
    expect(await form.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(changes(requests)).toEqual([])
  })

  it('🔴 시스템관리자 → 마스터: 바디에 groupSeq 없음 · 연락처 숫자만 · 성공 시 닫히고 목록에 보인다', async () => {
    const requests = record()
    renderPage()
    const form = await openAddForm()
    expect(form.getByText('시스템관리자는 마스터 계정만 생성할 수 있습니다.')).toBeInTheDocument()
    expect(form.queryByRole('list', { name: '그룹 선택' })).not.toBeInTheDocument()
    await fillAdminForm(form)
    await userEvent.click(form.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '관리자 추가' })).not.toBeInTheDocument())
    expect(changes(requests).map((r) => [r.name, r.body])).toEqual([
      ['AddAdmin', { codeSeq: 3, loginId: '9904501', loginPw: 'Wf0test12!', name: '홍길동', phone: '01012345678' }],
    ])
    expect(await totalLine(5)).toBeInTheDocument()
    expect(names()).toContain('홍길동')
  })

  it('🔴 마스터 → 매니저: 담당 그룹 필수 · 바디에 groupSeq', async () => {
    loginAs('Master', '3')
    const requests = record()
    renderPage()
    const form = await openAddForm()
    expect(form.getByText('마스터는 매니저 계정만 생성할 수 있습니다.')).toBeInTheDocument()
    await fillAdminForm(form)
    await userEvent.click(form.getByRole('button', { name: '등록' }))
    expect(await form.findByText('담당 그룹을 하나 이상 선택해주세요.')).toBeInTheDocument()

    await userEvent.click(within(form.getByRole('list', { name: '그룹 선택' })).getByLabelText('강동지사'))
    await userEvent.click(form.getByRole('button', { name: '등록' }))
    await waitFor(() => expect(changes(requests)).toHaveLength(1))
    await waitFor(() => expect(changes(requests)[0].body).toMatchObject({ codeSeq: 4, groupSeq: [3] }))
  })

  it('🔴 중복 사번 — 400 · 모달 유지(토스트는 전역 MutationCache)', async () => {
    const responses: number[] = []
    server.events.on('response:mocked', ({ request, response }) => {
      if (request.url.endsWith('/AddAdmin')) responses.push(response.status)
    })
    renderPage()
    const form = await openAddForm()
    await fillAdminForm(form)
    const loginId = form.getByLabelText(/^사번/)
    await userEvent.clear(loginId)
    await userEvent.type(loginId, '232727')
    await userEvent.click(form.getByRole('button', { name: '등록' }))

    await waitFor(() => expect(responses).toEqual([400]))
    expect(screen.getByRole('dialog', { name: '관리자 추가' })).toBeInTheDocument()
  })
})

describe('AdminsPage — 수정 · 비밀번호 · 삭제 (US4)', () => {
  it('수정: 이름 · 연락처만 보낸다 · 목록에 반영', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    await userEvent.click(dialog.getByRole('button', { name: '수정' }))
    const form = within(await screen.findByRole('dialog', { name: '관리자 수정' }))
    const name = form.getByLabelText(/^이름/)
    await userEvent.clear(name)
    await userEvent.type(name, '김용우2')
    await userEvent.click(form.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '관리자 수정' })).not.toBeInTheDocument())
    expect(changes(requests).map((r) => [r.name, r.body])).toEqual([
      ['UpdateAdmin', { userSeq: 3, name: '김용우2', phone: '01000000003' }],
    ])
    expect(await screen.findAllByText('김용우2')).not.toHaveLength(0)
  })

  it('비밀번호: ResetAdminPassword · 확인 칸은 보내지 않는다', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    await userEvent.click(dialog.getByRole('button', { name: '비밀번호' }))
    const form = within(await screen.findByRole('dialog', { name: '비밀번호 변경' }))
    await userEvent.type(form.getByLabelText(/^새 비밀번호 확인/), 'Wf0test34!')
    await userEvent.type(form.getByLabelText(/^새 비밀번호(?! 확인)/), 'Wf0test34!')
    await userEvent.click(form.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '비밀번호 변경' })).not.toBeInTheDocument())
    expect(changes(requests).map((r) => [r.name, r.body])).toEqual([
      ['ResetAdminPassword', { userSeq: 3, loginPw: 'Wf0test34!' }],
    ])
  })

  it('🔴 삭제: 확인 → DELETE → 상세 닫힘 · 행 사라짐', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('김용우'))
    await userEvent.click(dialog.getByRole('button', { name: '삭제' }))
    const confirm = within(await screen.findByRole('alertdialog'))
    expect(confirm.getByText('김용우 계정을 삭제합니다. 되돌릴 수 없습니다.')).toBeInTheDocument()
    await userEvent.click(confirm.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: DETAIL_TITLE })).not.toBeInTheDocument())
    expect(changes(requests).map((r) => [r.name, r.search])).toEqual([['DeleteAdmin', '?userSeq=3']])
    expect(await totalLine(3)).toBeInTheDocument()
    expect(names()).not.toContain('김용우')
  })
})

describe('AdminsPage — 담당 그룹 (US5)', () => {
  const openAssign = async (name: string) => {
    const dialog = within(await openAdmin(name))
    await userEvent.click(dialog.getByRole('button', { name: '그룹 추가' }))
    return within(await screen.findByRole('dialog', { name: '담당 그룹 추가' }))
  }

  it('🔴 추가: 다시 읽기 → UpdateAdmin 1번(현재 ∪ 고른 것) · 회사 없음 · 맡은 지사의 본부만 고를 수 있다', async () => {
    const requests = record()
    renderPage()
    const picker = await openAssign('테스트')
    expect(picker.queryByText('에스텍시스템')).not.toBeInTheDocument()
    // 강동지사를 맡고 있어 다른 본부는 막힌다(045 규칙 — 지사를 고르면 다른 본부 불가)
    expect(picker.getByLabelText('test')).toBeDisabled()
    await userEvent.click(picker.getByLabelText('테스트사업장(수정)'))
    await userEvent.click(picker.getByRole('button', { name: '추가 (1)' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: '담당 그룹 추가' })).not.toBeInTheDocument())
    // 🔴 PUT 바로 앞이 다시 읽기다(모달을 열 때의 사번 조회와는 별개)
    const sequence = requests.filter((r) => r.name === 'GetAdminDetail' || r.name === 'UpdateAdmin')
    const put = sequence.findIndex((r) => r.name === 'UpdateAdmin')
    expect(sequence.filter((r) => r.name === 'UpdateAdmin')).toHaveLength(1)
    expect(sequence[put - 1].name).toBe('GetAdminDetail')
    await waitFor(() => expect(sequence[put].body).toEqual({ userSeq: 6, groupSeq: [3, 2] }))

    const groups = within(
      within(await screen.findByRole('dialog', { name: DETAIL_TITLE })).getByRole('region', { name: '담당 그룹' })
    )
    await waitFor(() => expect(groups.getAllByText('본부 전체')).toHaveLength(1))
  })

  it('🔴 마지막 담당 그룹은 해제할 수 없다 · 둘이면 해제된다', async () => {
    const requests = record()
    renderPage()
    const dialog = within(await openAdmin('테스트'))
    expect(dialog.getByRole('button', { name: '강동지사 해제' })).toBeDisabled()

    await userEvent.click(dialog.getByRole('button', { name: '그룹 추가' }))
    const picker = within(await screen.findByRole('dialog', { name: '담당 그룹 추가' }))
    await userEvent.click(picker.getByLabelText('테스트사업장(수정)'))
    await userEvent.click(picker.getByRole('button', { name: '추가 (1)' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '담당 그룹 추가' })).not.toBeInTheDocument())

    // 본부가 맡겨지면 지사 할당은 본부 줄에 포함된다 — 본부 줄의 해제가 열린다
    const detail = within(screen.getByRole('dialog', { name: DETAIL_TITLE }))
    const removeHq = await detail.findByRole('button', { name: '테스트사업장(수정) 해제' })
    await waitFor(() => expect(removeHq).toBeEnabled())
    await userEvent.click(removeHq)

    await waitFor(() =>
      expect(requests.filter((r) => r.name === 'UpdateAdmin').at(-1)?.body).toEqual({ userSeq: 6, groupSeq: [3] })
    )
  })

  it('MANAGER 에게는 그룹 추가 · 해제가 없다', async () => {
    loginAs('Manager', '6')
    renderPage()
    const dialog = within(await openAdmin('테스트'))
    expect(dialog.queryByRole('button', { name: '그룹 추가' })).not.toBeInTheDocument()
    expect(dialog.queryByRole('button', { name: /해제$/ })).not.toBeInTheDocument()
  })
})
