import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MS_ROLE_CLAIM } from '@/features/auth/types/claims'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { addGroup } from '@/features/groups/api/addGroup'
import { resetGroupStore } from '@/mocks/handlers/groups'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'

import { GroupEditTrigger } from '../GroupEditTrigger'

/**
 * 관리그룹 편집 (`spec 043` T758). 시드 = 실서버 트리:
 * 1 에스텍시스템(루트) ─ 2 테스트사업장(수정) ─ 3 강동지사(지사, 사업장 4) / 4 test / 6 테스트그룹.
 * 사업장은 지사에만 있다 — 회사·본부 사업장은 `본부할당 사업장` 지사(7 · 8 · 9 · 11, 10 = 본사 직할 본부)로 옮긴 mock 시드.
 */

const ADD_PATH = '/api/v1/Group/W/sign/AddGroup'

beforeEach(() => {
  clearTokens()
  setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'SystemManager' }))
  resetGroupStore()
})

afterEach(() => server.events.removeAllListeners())

const LocationProbe = () => <div data-testid="search">{useLocation().search}</div>

const renderTrigger = (initialPath = '/admin/locations') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <GroupEditTrigger />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const openEditor = async (initialPath?: string) => {
  renderTrigger(initialPath)
  await userEvent.click(screen.getByRole('button', { name: '관리그룹 편집' }))
  const list = await screen.findByRole('list', { name: '관리그룹 목록' })
  await within(list).findByText('강동지사')
  return list
}

const rowOf = (list: HTMLElement, name: string) =>
  within(list).getByText(name).closest('li') as HTMLElement

describe('GroupEditDialog', () => {
  it('🔴 구조 — 회사 머리 줄(+ 본부 추가 · 변경/삭제 없음) · 본부 카드 · 지사 행(사업장 N개) · 지사 아래로는 추가 없음', async () => {
    await addGroup({ parentGroupSeq: 1, groupName: '빈본부', userSeq: [] })
    const list = await openEditor()

    // 회사는 목록 밖 머리 줄
    expect(within(list).queryByText('에스텍시스템')).not.toBeInTheDocument()
    expect(screen.getByText('에스텍시스템')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '에스텍시스템 하위 그룹 추가' })).toHaveTextContent('본부 추가')
    expect(screen.queryByLabelText('에스텍시스템 이름 변경')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('에스텍시스템 삭제')).not.toBeInTheDocument()

    // 본부 카드: 단계 이름 · 지사 추가 · 개수 없음
    const hq = rowOf(list, '테스트사업장(수정)')
    expect(within(hq).getByText('본부')).toBeInTheDocument()
    expect(within(hq).getAllByTestId('hq-icon')).toHaveLength(1)
    expect(within(hq).getByRole('button', { name: '테스트사업장(수정) 하위 그룹 추가' })).toHaveTextContent(
      '지사 추가'
    )

    // 지사 행: 개수 "N개" · 추가 없음
    const branch = within(hq).getByText('강동지사').closest('li') as HTMLElement
    expect(within(branch).getByText('지사')).toBeInTheDocument()
    expect(within(branch).getByText('사업장 4개')).toBeInTheDocument()
    expect(within(branch).getByTestId('branch-dot')).toBeInTheDocument()
    expect(screen.queryByLabelText('강동지사 하위 그룹 추가')).not.toBeInTheDocument()

    // 지사 없는 본부
    expect(within(rowOf(list, '빈본부')).getByText('지사가 없습니다')).toBeInTheDocument()
    expect(screen.queryByText(/관리자 \d/)).not.toBeInTheDocument()
  })

  it('하위 추가 → 바디(parentGroupSeq · userSeq: []) → 목록에 나타나고 작은 모달이 닫힌다', async () => {
    const bodies: unknown[] = []
    server.events.on('request:start', async ({ request }) => {
      if (new URL(request.url).pathname === ADD_PATH) bodies.push(await request.clone().json())
    })
    const list = await openEditor()

    await userEvent.click(within(list).getByLabelText('테스트그룹 하위 그룹 추가'))
    expect(screen.getByText("'테스트그룹' 아래에 지사 그룹을 만듭니다.")).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('그룹명'), '  신규지사  {Enter}')

    expect(await within(list).findByText('신규지사')).toBeInTheDocument()
    expect(bodies).toEqual([{ parentGroupSeq: 6, groupName: '신규지사', userSeq: [] }])
    expect(screen.queryByLabelText('그룹명')).not.toBeInTheDocument()
  })

  it('공백만 입력하면 제출 버튼이 비활성', async () => {
    const list = await openEditor()
    await userEvent.click(within(list).getByLabelText('테스트그룹 하위 그룹 추가'))
    await userEvent.type(screen.getByLabelText('그룹명'), '   ')
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled()
  })

  it('🔴 같은 이름(409) → 작은 모달이 남고 입력값이 유지된다', async () => {
    const list = await openEditor()
    await userEvent.click(within(list).getByLabelText('테스트사업장(수정) 하위 그룹 추가'))
    await userEvent.type(screen.getByLabelText('그룹명'), '강동지사')
    await userEvent.click(screen.getByRole('button', { name: '추가' }))

    await waitFor(() => expect(screen.getByRole('button', { name: '추가' })).toBeEnabled())
    expect(screen.getByLabelText('그룹명')).toHaveValue('강동지사')
  })

  it('이름 변경 → 현재 이름이 채워져 있고 저장하면 목록에 반영', async () => {
    const list = await openEditor()
    await userEvent.click(within(list).getByLabelText('test 이름 변경'))
    const input = screen.getByLabelText('그룹명')
    expect(input).toHaveValue('test')

    await userEvent.clear(input)
    await userEvent.type(input, '부산본부{Enter}')
    expect(await within(list).findByText('부산본부')).toBeInTheDocument()
  })

  it('🔴 삭제 확인에 하위 그룹·사업장 수 → 삭제 후 자손까지 사라지고 선택 중이었으면 ?group 을 걷는다', async () => {
    const list = await openEditor('/admin/locations?group=3')
    await userEvent.click(within(list).getByLabelText('테스트사업장(수정) 삭제'))

    const alert = await screen.findByRole('alertdialog')
    // 🔴 대상은 질문형 제목이, 영향은 설명이 말한다(046 #16)
    expect(within(alert).getByText("'테스트사업장(수정)' 본부그룹을 삭제하시겠습니까?")).toBeInTheDocument()
    expect(
      within(alert).getByText('하위 그룹 2개와 소속 사업장 5개도 함께 삭제됩니다. 삭제된 데이터는 복구할 수 없습니다.')
    ).toBeInTheDocument()
    await userEvent.click(within(alert).getByRole('button', { name: '삭제' }))

    // 삭제 → 무효화 → 재조회 두 번을 거친다. 전체 스위트 부하에서 기본 1초를 넘긴 적이 있다
    await waitFor(
      () => expect(within(list).queryByText('테스트사업장(수정)')).not.toBeInTheDocument(),
      { timeout: 3000 }
    )
    expect(within(list).queryByText('강동지사')).not.toBeInTheDocument()
    // 🔴 `?group` 정리는 호출부 `onSuccess` 라 훅의 `onSettled`(재조회) **다음**에 돈다 — 목록이 바뀐 직후엔 아직일 수 있다
    await waitFor(() => expect(screen.getByTestId('search')).toBeEmptyDOMElement())
  })

  it('하위·사업장이 없으면 연쇄 문장을 생략', async () => {
    const list = await openEditor()
    await userEvent.click(within(list).getByLabelText('테스트그룹 하위 그룹 추가'))
    await userEvent.type(screen.getByLabelText('그룹명'), '빈그룹{Enter}')
    await userEvent.click(await within(list).findByLabelText('빈그룹 삭제'))

    const alert = await screen.findByRole('alertdialog')
    expect(within(alert).getByText("'빈그룹' 지사그룹을 삭제하시겠습니까?")).toBeInTheDocument()
    expect(within(alert).getByText('삭제된 데이터는 복구할 수 없습니다.')).toBeInTheDocument()
  })
})

describe('GroupEditTrigger 권한', () => {
  it('Master 에게도 보인다', () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'Master' }))
    renderTrigger()
    expect(screen.getByRole('button', { name: '관리그룹 편집' })).toBeInTheDocument()
  })

  it('🔴 허용 목록 밖(현장관리자 — Manager 문자열은 미실측이라 매핑 자체가 없다)이면 그리지 않는다', () => {
    setAccessToken(makeAccessToken({ [MS_ROLE_CLAIM]: 'FieldManager' }))
    renderTrigger()
    expect(screen.queryByRole('button', { name: '관리그룹 편집' })).not.toBeInTheDocument()
  })
})
