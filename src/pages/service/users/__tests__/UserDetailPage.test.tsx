import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { setSite } from '@/lib/auth/site'
import { clearTokens, setAccessToken } from '@/lib/auth/tokens'
import { resetUserStore } from '@/mocks/handlers/users'
import { server } from '@/mocks/server'
import { makeAccessToken } from '@/test/jwt'
import { fetchUserDetail } from '@/features/workers/api/getUserDetail'
import { fetchUserList } from '@/features/workers/api/getUserList'
import { removeUser } from '@/features/workers/api/removeUser'
import UserDetailPage from '../UserDetailPage'

/**
 * `/users/:userSeq` 근무자 상세 — `spec 038` US2 에서 **신설**했다(전에는 우측 패널).
 * 시드(`mocks/handlers/users.ts`): 101 김민준(근무 중) · 102 이서연(근무 종료).
 */

const DETAIL_PATH = '/api/v1/User/W/sign/UserDetail'

const renderAt = (userSeq: string, search = '') => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/users/${userSeq}${search}`]}>
        <Routes>
          <Route path="/users" element={<div>LIST_ROUTE</div>} />
          <Route path="/users/:userSeq" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** 🔄 `spec 079` — 정보 수정 · 비밀번호 변경 · 삭제는 머리 `⋯` 메뉴 안이다 */
const pickMenu = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: '근무자 메뉴' }))
  await user.click(await screen.findByRole('menuitem', { name }))
}

const captureDetailCalls = () => {
  const calls: URL[] = []
  server.events.on('request:start', ({ request }) => {
    const target = new URL(request.url)
    if (target.pathname === DETAIL_PATH) calls.push(target)
  })
  return calls
}

beforeEach(() => {
  resetUserStore()
  clearTokens()
  setAccessToken(makeAccessToken())
  setSite(7, '강동 테크노타워')
})

afterEach(() => {
  clearTokens()
  server.events.removeAllListeners()
})

describe('UserDetailPage — 정상', () => {
  it('머리(이름 · 근무 상태 · 소속 사업장)와 기본정보(사번 · 권한 · 연락처 · 소속) —🔴 근무 상태 행은 없다 (spec 079)', async () => {
    renderAt('101')

    expect(await screen.findByRole('heading', { name: '김민준' })).toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
    expect(screen.getByText('240101')).toBeInTheDocument()
    // 권한 행 — 상세 응답 `codeName` 그대로(D12)
    expect(screen.getByText('현장 근무자')).toBeInTheDocument()
    // 머리 + 기본정보 소속 사업장
    expect(screen.getAllByText('강동 테크노타워')).toHaveLength(2)
    // 🔴 머리 뱃지와 같은 말이라 카드 행을 뺐다
    expect(screen.getAllByText('근무 중')).toHaveLength(1)
    expect(screen.queryByText('근무 상태')).not.toBeInTheDocument()
  })

  it('🔴 머리에 부제가 없다 — 값은 카드에만 있다 (같은 말을 두 번 하지 않는다)', async () => {
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(screen.queryByText(/240101 ·/)).not.toBeInTheDocument()
    expect(screen.getAllByText('240101')).toHaveLength(1)
  })

  it('🔴 상세는 서버 이름 userId 로 요청한다 (B-12)', async () => {
    const calls = captureDetailCalls()
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(calls[0].searchParams.get('userId')).toBe('101')
    expect(calls[0].searchParams.get('userSeq')).toBeNull()
  })

  it('🔴 연락처는 하이픈 형식으로 보인다 — 서버는 하이픈 없이 준다', async () => {
    renderAt('101')

    expect(await screen.findByText('010-2345-6789')).toBeInTheDocument()
  })

  it('🔴 등록일 행이 없다 — 상세 응답에 없고 요청하지 않는다(OQ-8 종료) · 권한 행은 있다(D12)', async () => {
    renderAt('101')

    await screen.findByRole('heading', { name: '김민준' })
    expect(screen.getByText('권한')).toBeInTheDocument()
    expect(screen.queryByText('등록일')).not.toBeInTheDocument()
    expect(screen.queryByText(/배치 변경 이력/)).not.toBeInTheDocument()
  })

  it('근무 종료를 그린다', async () => {
    renderAt('102')

    await screen.findByRole('heading', { name: '이서연' })
    expect(screen.getByText('근무 종료')).toBeInTheDocument()
  })

  it('수정 모달이 서버 값으로 채워진다', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await pickMenu(user, '정보 수정')

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByDisplayValue('김민준')).toBeInTheDocument()
    expect(within(dialog).getByDisplayValue('010-2345-6789')).toBeInTheDocument()
  })

  it('정보 수정을 저장하면 모달이 닫히고 상세가 새 값으로 갱신된다 (spec 041 US2)', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await pickMenu(user, '정보 수정')
    const dialog = await screen.findByRole('dialog')
    const name = within(dialog).getByDisplayValue('김민준')
    await user.clear(name)
    await user.type(name, '김민준2')
    await user.click(within(dialog).getByRole('button', { name: '저장' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByRole('heading', { name: '김민준2' })).toBeInTheDocument()
  })

  it('삭제를 확인하면 서버에서 지우고 목록으로 돌아간다 (spec 041 US4)', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await pickMenu(user, '근무자 삭제')
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('LIST_ROUTE')).toBeInTheDocument()
    await expect(fetchUserDetail(101)).rejects.toBeTruthy()
    const { items } = await fetchUserList({ siteId: 7, pageNumber: 1, pageSize: 100 })
    expect(items.map((u) => u.userSeq)).not.toContain(101)
  })

  it('이미 지워진 근무자면 상세에 머물고 실패 화면으로 바뀐다', async () => {
    const user = userEvent.setup()
    renderAt('101')
    await screen.findByRole('heading', { name: '김민준' })
    // 다른 관리자가 먼저 지웠다
    await removeUser(101)

    await pickMenu(user, '근무자 삭제')
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: '삭제' }))

    expect(await screen.findByText(/불러오지 못했습니다/)).toBeInTheDocument()
    expect(screen.queryByText('LIST_ROUTE')).not.toBeInTheDocument()
  })

  it('🔴 본인 계정은 삭제 메뉴가 잠긴다', async () => {
    setAccessToken(makeAccessToken({ userSeq: '109' }))
    const user = userEvent.setup()
    renderAt('109')

    await screen.findByRole('heading', { name: '홍관리' })
    await user.click(screen.getByRole('button', { name: '근무자 메뉴' }))
    expect(await screen.findByRole('menuitem', { name: '근무자 삭제' })).toHaveAttribute('aria-disabled', 'true')
  })

  it('비밀번호 변경은 정보 수정과 다른 모달이다 — loginPw 만 보내고 닫힌다 (spec 041 US3)', async () => {
    const sent: [string, string][] = []
    server.use(
      http.post('/api/v1/User/W/sign/UpdateUser', async ({ request }) => {
        const form = await request.clone().formData()
        for (const [key, value] of form.entries()) sent.push([key, String(value)])
        return undefined
      })
    )
    const user = userEvent.setup()
    renderAt('101')

    await pickMenu(user, '비밀번호 변경')
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' })
    expect(within(dialog).queryByDisplayValue('김민준')).not.toBeInTheDocument()

    await user.type(within(dialog).getByPlaceholderText('8자리 이상, 영문·숫자·특수문자 포함'), 'Newpw12!')
    await user.type(within(dialog).getByPlaceholderText('한 번 더 입력해주세요'), 'Newpw12?')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))
    expect(await within(dialog).findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()

    const confirm = within(dialog).getByPlaceholderText('한 번 더 입력해주세요')
    await user.clear(confirm)
    await user.type(confirm, 'Newpw12!')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(sent).toEqual([
      ['userSeq', '101'],
      ['loginPw', 'Newpw12!'],
    ])
  })

  it('비밀번호는 로그인과 같은 규칙이다', async () => {
    const user = userEvent.setup()
    renderAt('101')

    await pickMenu(user, '비밀번호 변경')
    const dialog = await screen.findByRole('dialog', { name: '비밀번호 변경' })
    await user.type(within(dialog).getByPlaceholderText('8자리 이상, 영문·숫자·특수문자 포함'), '12')
    await user.click(within(dialog).getByRole('button', { name: '변경' }))

    expect(await within(dialog).findByText('8자리 이상 입력해주세요.')).toBeInTheDocument()
  })
})

describe('UserDetailPage — 순찰 기록(회차 단위, spec 079)', () => {
  /**
   * 시드(`mocks/handlers/workerRuns.ts`): 104 박지우의 최근 14일 회차 8건 + 동명이인(110 박지우) 1건.
   * 요약은 시안과 같다 — 순찰 8회 · 지점 인증 86% (31/36) · 미인증 4회 · 특이사항 2회 · 시간초과 3회.
   */
  const HISTORY_PATH = '/api/v1/History/W/sign/GetCourseHistory'
  const runButtons = () => screen.findAllByRole('button', { name: /^\d{2}:\d{2} –/ })
  const findRun = async (time: string) => (await screen.findAllByRole('button', { name: new RegExp(`^${time} –`) }))[0]
  const ymd = (ago: number) => {
    const date = new Date()
    date.setDate(date.getDate() - ago)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  it('🔴 선택 사업장 + 이름 + 14일로 코스 이력을 조회한다 — 서버에 userSeq 필터가 없다 (D4)', async () => {
    const calls: URL[] = []
    server.events.on('request:start', ({ request }) => {
      const target = new URL(request.url)
      if (target.pathname === HISTORY_PATH) calls.push(target)
    })
    renderAt('104')

    await screen.findByText('순찰 기록')
    await runButtons()
    const query = calls[calls.length - 1].searchParams
    expect(query.get('siteSeq')).toBe('7')
    expect(query.get('userName')).toBe('박지우')
    expect(query.get('fromDt')).toBe(ymd(13))
    expect(query.get('toDt')).toBe(ymd(0))
  })

  it('🔴 동명이인(110) 회차는 userSeq 로 걸러 나오지 않는다', async () => {
    renderAt('104')

    const rows = await runButtons()
    expect(rows).toHaveLength(8)
    // 동명이인 회차는 2일 전 10:00 시작이다
    expect(screen.queryByRole('button', { name: /^10:00 –/ })).not.toBeInTheDocument()
  })

  it('요약 5칸 — 시안과 같은 수', async () => {
    renderAt('104')

    await runButtons()
    expect(screen.getByText('8회')).toBeInTheDocument()
    expect(screen.getByText('86%')).toBeInTheDocument()
    expect(screen.getByText('31/36')).toBeInTheDocument()
    // 🔄 D11 — 회차 미인증 n회 → 미인증 지점 수(36 - 31)
    expect(screen.getByText('미인증 지점').nextSibling).toHaveTextContent(/^5$/)
    expect(screen.getByText('2회')).toBeInTheDocument()
    expect(screen.getByText('3회')).toBeInTheDocument()
    // 🔴 D2 — 시안의 `누락` 은 쓰지 않는다
    expect(screen.queryByText(/누락/)).not.toBeInTheDocument()
  })

  it('🔴 날짜 머리에 회차 수를 적지 않는다 (D1)', async () => {
    renderAt('104')

    await runButtons()
    const heads = screen.getAllByRole('heading', { level: 4 })
    expect(heads.length).toBe(6)
    heads.forEach((head) => expect(head.textContent).toMatch(/^\d{2}\.\d{2} \(.\)$/))
    expect(screen.getByText('오늘')).toBeInTheDocument()
    // 🔴 D5 — 날짜 머리에 예외 수도 적지 않는다(회차 줄과 겹친다)
    heads.forEach((head) => expect(head.parentElement).not.toHaveTextContent(/미인증|시간초과/))
  })

  it('접힌 줄은 교대 · 시간초과만 — 미인증 · 특이사항은 펼쳐야 보인다', async () => {
    renderAt('104')

    const row = await findRun('14:28')
    expect(row).toHaveTextContent('지하 주차장 코스')
    expect(row).toHaveTextContent('인증 3/4')
    expect(row).toHaveTextContent('시간초과')
    expect(row).not.toHaveTextContent('미인증')
    expect(screen.getAllByRole('button', { name: /교대/ })).toHaveLength(2)
  })

  it('펼치면 지점별 시각 · 미인증 · 메모 · 사진 수와 순찰 상세 링크', async () => {
    const user = userEvent.setup()
    renderAt('104')

    const run = await findRun('14:28')
    await user.click(run)
    expect(await screen.findByText('램프 차단기 작동 불량, 시설팀 전달', {})).toBeInTheDocument()
    // 요약 칸 · 범례도 `미인증`(D10)이라 펼친 패널 안에서만 찾는다
    const panel = within(document.getElementById(run.getAttribute('aria-controls') ?? '') as HTMLElement)
    expect(panel.getByText('사진 2')).toBeInTheDocument()
    expect(panel.getByText('미인증 1')).toBeInTheDocument()
    expect(panel.getByText('특이사항 1')).toBeInTheDocument()
    // 3번 지점은 중간에 빠졌다 — 시각이 있어도 미인증(D8)
    expect(panel.getByText('미인증')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /순찰 이력 상세 보기/ })).toHaveAttribute('href', '/patrol/zones/7901')
  })

  it('🔴 교대받은 회차 — 교대 지점 앞 구분선 한 곳만(D6) · 상대 몫 지점에 이름', async () => {
    const user = userEvent.setup()
    renderAt('104')

    await user.click(await findRun('09:37'))
    expect(await screen.findAllByText('이서연에게서 교대받음', {})).toHaveLength(1)
    expect(screen.queryByText(/번부터/)).not.toBeInTheDocument()
    expect(screen.getAllByText('이서연')).toHaveLength(2)
  })

  it('🔴 고른 날짜는 URL(?day=)에 있다 — 그 날 회차만 · 전체 보기로 푼다', async () => {
    const user = userEvent.setup()
    renderAt('104', `?day=${ymd(3)}`)

    const rows = await runButtons()
    expect(rows).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: '전체 보기' }))
    expect(await screen.findAllByRole('button', { name: /^\d{2}:\d{2} –/ })).toHaveLength(8)
  })

  it('전체 기록은 코스 순찰이력으로 — 이름 · 같은 14일을 건다', async () => {
    renderAt('104')

    await runButtons()
    const href = screen.getByRole('link', { name: /전체 기록/ }).getAttribute('href') ?? ''
    expect(href.startsWith('/patrol/zones?')).toBe(true)
    const query = new URLSearchParams(href.split('?')[1])
    expect(query.get('user')).toBe('박지우')
    expect(query.get('from')).toBe(ymd(13))
    expect(query.get('to')).toBe(ymd(0))
  })

  it('🔴 기록 조회 실패는 "기록 없음" 이 아니다 — 상세 본문은 그대로 있다', async () => {
    server.use(http.get(HISTORY_PATH, () => HttpResponse.json({ message: 'x' }, { status: 500 })))
    renderAt('104')

    expect(await screen.findByText('순찰 기록을 불러오지 못했습니다', {})).toBeInTheDocument()
    expect(screen.queryByText('순찰 기록이 없습니다')).not.toBeInTheDocument()
    expect(screen.getByText('기본정보')).toBeInTheDocument()
  })

  it('기록이 없으면 빈 상태', async () => {
    server.use(
      http.get(HISTORY_PATH, () =>
        HttpResponse.json({
          message: '',
          code: 200,
          data: { items: [], page: 1, pageSize: 100, totalCount: 0 },
        })
      )
    )
    renderAt('104')

    expect(await screen.findByText('순찰 기록이 없습니다', {})).toBeInTheDocument()
  })
})

describe('UserDetailPage — 상태 분기', () => {
  it('🔴 주소가 숫자가 아니면 요청 없이 즉시 오류 — 스켈레톤이 남지 않는다', () => {
    const calls = captureDetailCalls()
    renderAt('abc')

    expect(screen.getByText('주소가 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '다시 시도' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /근무자 목록으로/ })).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })

  it('🔴 403(현장관리자, B-41)은 조회 실패 — 다시 시도·목록으로를 준다', async () => {
    server.use(http.get(DETAIL_PATH, () => new HttpResponse(null, { status: 403 })))
    renderAt('101')

    expect(await screen.findByText('근무자를 불러오지 못했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /근무자 목록으로/ })).toBeInTheDocument()
  })

  it('없는 근무자도 같은 실패 화면이다', async () => {
    renderAt('999')

    expect(await screen.findByText('근무자를 불러오지 못했습니다')).toBeInTheDocument()
  })
})
