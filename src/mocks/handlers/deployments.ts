import { http, HttpResponse } from 'msw'

import type {
  AssignmentApproveRequest,
  AssignmentCount,
  AssignmentHistoryBase,
  AssignmentRequestRow,
  AssignmentStatusCode,
} from '@/features/deployments/types/deployment'

/**
 * MSW 배치관리 핸들러 (`spec 039` T632 → `spec 042` T707 실측 API 로 교체) — 🔴 **상태를 보유한다.**
 *
 * 경로·행 모양·오류 문구는 `api-spec.md` §5-1-B "배치 10종" 실측 그대로다.
 *
 * 🔴 **배치 1건 = 레코드 1개**다(서버와 같다) — 요청 목록 · 복귀 요청 목록 · 전입/전출 이력 · 근무자별 이력 ·
 * 요약을 **전부 이 배열에서 계산한다.** 따로 들고 있으면 승인 한 번에 어긋난다.
 * - `pending` → 목적지 사업장의 **배치 요청**
 * - `approved` → 이력(전입·전출·근무자별). `returnPending` 이면 원소속 사업장의 **복귀 요청**
 * - `rejected` → 어디에도 안 나온다(실측)
 *
 * 🔴 **상태는 날짜로 계산한다**(서버와 같은 규칙으로 본다): 복귀 승인 = 복귀완료 · 시작 전 = 배치예정 · 그 외 배치중.
 * ⚠️ 시드 날짜는 흔들리지 않게 골랐다 — 배치중/복귀완료 시드는 과거 날짜다.
 *
 * 🔴 **요약은 복귀 안 한 배치를 센다**(배치예정 포함 — 실측). 지금 그 자리에 있는 인원이 아니다.
 *
 * 🔴 **시드를 근무자 mock(038)과 맞췄다** — 오준혁은 "강서 소속으로 배치 온 사람" 이라 **전입**이다.
 */

const BASE = '/api/v1/Assignment/W/sign'
const GET_LIST_PATH = `${BASE}/GetAssignmentList`
const GET_RETURN_LIST_PATH = `${BASE}/GetAssignmentReturnList`
const APPROVE_PATH = `${BASE}/AssignmentApprove`
const RETURN_APPROVE_PATH = `${BASE}/AssignmentReturnApprove`
const GET_IN_HISTORY_PATH = `${BASE}/GetAssignmentInHistory`
const GET_OUT_HISTORY_PATH = `${BASE}/GetAssignmentOutHistory`
const GET_USER_HISTORY_PATH = `${BASE}/GetAssignmentHistory`
const GET_COUNT_PATH = `${BASE}/GetAssignmentCount`
/** 🔴 서버 공통 상한 — 다른 목록 API 와 같다고 가정 */
const MAX_PAGE_SIZE = 100

const SITE_SEQ = 7
const SITE_NAME = '강동 테크노타워'

interface StoredAssignment {
  assignmentSeq: number
  userSeq: number
  userName: string
  fromSiteSeq: number
  fromSiteName: string
  toSiteSeq: number
  toSiteName: string
  startDt: string
  plannedEndDt: string | null
  reason: string
  createDt: string
  state: 'pending' | 'approved' | 'rejected'
  /** 승인된 배치에 복귀 요청이 대기 중인가 */
  returnPending: boolean
  completeYn: boolean
  completeDt: string | null
}

const seeds: StoredAssignment[] = [
  // 배치 요청 — 앞으로의 배치(승인하면 배치예정. ⚠️ 2026-11-02 이후 실행하면 배치중이 된다 —
  // 테스트는 이 사람의 **상태**를 단언하지 않는다)
  {
    assignmentSeq: 501,
    userSeq: 201,
    userName: '최범수',
    fromSiteSeq: 21,
    fromSiteName: '해운대 마린시티',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    startDt: '2026-11-02T00:00:00',
    plannedEndDt: '2026-12-31T00:00:00',
    reason: '야간 인력 부족 지원',
    createDt: '2026-05-30T10:20:00',
    state: 'pending',
    returnPending: false,
    completeYn: false,
    completeDt: null,
  },
  // 배치 요청 — 시작일이 지났고 종료 미정(승인하면 바로 배치중)
  {
    assignmentSeq: 502,
    userSeq: 202,
    userName: '배수진',
    fromSiteSeq: 22,
    fromSiteName: '송도 비즈니스타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    startDt: '2026-06-03T00:00:00',
    plannedEndDt: null,
    reason: '휴가 대체',
    createDt: '2026-05-28T15:05:00',
    state: 'pending',
    returnPending: false,
    completeYn: false,
    completeDt: null,
  },
  // 전출 — 배치중 · 🔴 **복귀 요청 대기**(원소속 = 우리 사업장이 승인한다)
  {
    assignmentSeq: 601,
    userSeq: 110,
    userName: '장도윤',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 12,
    toSiteName: '강서 스퀘어타워',
    startDt: '2026-03-01T00:00:00',
    plannedEndDt: null,
    reason: '인력 지원',
    createDt: '2026-02-20T09:00:00',
    state: 'approved',
    returnPending: true,
    completeYn: false,
    completeDt: null,
  },
  // 전출 — 복귀완료
  {
    assignmentSeq: 602,
    userSeq: 104,
    userName: '박지우',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 14,
    toSiteName: '노원 파크뷰',
    startDt: '2025-12-01T00:00:00',
    plannedEndDt: '2026-01-15T00:00:00',
    reason: '단기 지원',
    createDt: '2025-11-25T14:00:00',
    state: 'approved',
    returnPending: false,
    completeYn: true,
    completeDt: '2026-01-15T18:00:00',
  },
  // 전입 — 배치중 · 🔴 근무자 mock 의 오준혁(`originSiteSeq 12`)과 같은 사람
  {
    assignmentSeq: 603,
    userSeq: 103,
    userName: '오준혁',
    fromSiteSeq: 12,
    fromSiteName: '강서 스퀘어타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    startDt: '2026-01-05T00:00:00',
    plannedEndDt: null,
    reason: '인력 지원',
    createDt: '2026-01-02T11:30:00',
    state: 'approved',
    returnPending: false,
    completeYn: false,
    completeDt: null,
  },
  // 전입 — 복귀완료
  {
    assignmentSeq: 604,
    userSeq: 205,
    userName: '한지민',
    fromSiteSeq: 13,
    fromSiteName: '송파 그린타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    startDt: '2026-02-01T00:00:00',
    plannedEndDt: '2026-04-15T00:00:00',
    reason: '단기 지원',
    createDt: '2026-01-28T10:00:00',
    state: 'approved',
    returnPending: false,
    completeYn: true,
    completeDt: '2026-04-15T17:00:00',
  },
]

let store: StoredAssignment[] = seeds.map((row) => ({ ...row }))

/**
 * 저장소를 초기 상태로 되돌린다.
 *
 * 🔴 **테스트 격리에 필요하다** — `server.resetHandlers()` 는 이 배열을 건드리지 않는다. 상태를 바꾸는
 * 테스트 파일은 `beforeEach` 에서 부른다(`resetCourseStore`·`resetPointStore` 선례).
 */
export const resetDeploymentStore = (): void => {
  store = seeds.map((row) => ({ ...row }))
}

/** 오늘(`yyyy-MM-dd`) — 브라우저(dev·캡쳐)는 `page.clock` 고정 시각을, 테스트는 실제 시계를 탄다 */
const today = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 지금(`yyyy-MM-ddTHH:mm:ss`, 타임존 없음) */
const now = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${today()}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const STATUS_NAME: Record<AssignmentStatusCode, string> = {
  0: '배치예정',
  1: '배치중',
  2: '복귀완료',
}

const statusOf = (row: StoredAssignment): AssignmentStatusCode => {
  if (row.completeYn) return 2
  if (row.startDt.slice(0, 10) > today()) return 0
  return 1
}

const historyBase = (row: StoredAssignment): AssignmentHistoryBase => {
  const status = statusOf(row)
  return {
    assignmentSeq: row.assignmentSeq,
    startDt: row.startDt,
    endDt: row.plannedEndDt,
    completeYn: row.completeYn,
    completeDt: row.completeDt,
    status,
    statusName: STATUS_NAME[status],
  }
}

const toRequestRow = (row: StoredAssignment): AssignmentRequestRow => ({
  assignmentSeq: row.assignmentSeq,
  fromSiteSeq: row.fromSiteSeq,
  fromSiteName: row.fromSiteName,
  toSiteSeq: row.toSiteSeq,
  toSiteName: row.toSiteName,
  startDt: row.startDt,
  plannedEndDt: row.plannedEndDt,
  reason: row.reason,
  createDt: row.createDt,
  userSeq: row.userSeq,
  userName: row.userName,
})

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const businessError = (message: string, status = 400) =>
  HttpResponse.json({ message, data: false, code: status }, { status })

const pageSizeError = (pageSize: number) =>
  !Number.isFinite(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE
    ? HttpResponse.json(
        { message: '페이지 사이즈는 1~100 사이여야 합니다.', data: null, code: 400 },
        { status: 400 }
      )
    : null

const paged = <T>(items: T[], pageNumber: number, pageSize: number) => {
  const start = (pageNumber - 1) * pageSize
  return ok({
    items: items.slice(start, start + pageSize),
    page: pageNumber,
    pageSize,
    totalCount: items.length,
    totalPages: Math.ceil(items.length / pageSize),
  })
}

const pageOf = (query: URLSearchParams) => ({
  pageNumber: Number(query.get('pageNumber') ?? 1),
  pageSize: Number(query.get('pageSize') ?? 20),
})

/** 이력 공통 — 승인된 배치 · 이름 부분 일치 · 최신순(`assignmentSeq` 내림차순, 실측) */
const approvedRows = (
  match: (row: StoredAssignment) => boolean,
  userName: string | null,
  status: number | null
) =>
  store
    .filter((row) => row.state === 'approved' && match(row))
    .filter((row) => (userName === null ? true : row.userName.includes(userName)))
    .filter((row) => (status === null ? true : statusOf(row) === status))
    .sort((a, b) => b.assignmentSeq - a.assignmentSeq)

/** `?status` — 빈 값은 전체, 0~2 밖은 400(실측 문구) */
const statusOfQuery = (query: URLSearchParams): number | null | Response => {
  const raw = query.get('status')
  if (raw === null || raw === '') return null
  const status = Number(raw)
  if (!Number.isInteger(status) || status < 0 || status > 2) {
    return HttpResponse.json(
      { message: '상태값은 0~2 사이여야 합니다.', data: null, code: 400 },
      { status: 400 }
    )
  }
  return status
}

const countOf = (siteSeq: number): AssignmentCount => {
  const open = store.filter((row) => row.state === 'approved' && !row.completeYn)
  return {
    outCount: open.filter((row) => row.fromSiteSeq === siteSeq).length,
    inCount: open.filter((row) => row.toSiteSeq === siteSeq).length,
    pendingCount: store.filter((row) => row.state === 'pending' && row.toSiteSeq === siteSeq)
      .length,
    pendingReturnCount: store.filter(
      (row) => row.state === 'approved' && row.returnPending && row.fromSiteSeq === siteSeq
    ).length,
  }
}

export const deploymentHandlers = [
  http.get(GET_COUNT_PATH, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    return ok(countOf(siteSeq))
  }),

  http.get(GET_LIST_PATH, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    return ok(
      store
        .filter((row) => row.state === 'pending' && row.toSiteSeq === siteSeq)
        .sort((a, b) => b.createDt.localeCompare(a.createDt))
        .map(toRequestRow)
    )
  }),

  // 🔴 원소속(= 출발)이 이 사업장인 배치의 복귀 요청 — 행은 원래 배치 방향 그대로다(실측)
  http.get(GET_RETURN_LIST_PATH, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    return ok(
      store
        .filter(
          (row) => row.state === 'approved' && row.returnPending && row.fromSiteSeq === siteSeq
        )
        .sort((a, b) => b.createDt.localeCompare(a.createDt))
        .map(toRequestRow)
    )
  }),

  http.get(GET_IN_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const { pageNumber, pageSize } = pageOf(query)
    const sizeError = pageSizeError(pageSize)
    if (sizeError) return sizeError

    const status = statusOfQuery(query)
    if (status instanceof Response) return status

    const siteSeq = Number(query.get('siteSeq'))
    const rows = approvedRows(
      (row) => row.toSiteSeq === siteSeq,
      query.get('userName'),
      status
    ).map(
      (row) => ({ ...historyBase(row), userName: row.userName, fromSiteName: row.fromSiteName })
    )
    return paged(rows, pageNumber, pageSize)
  }),

  http.get(GET_OUT_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const { pageNumber, pageSize } = pageOf(query)
    const sizeError = pageSizeError(pageSize)
    if (sizeError) return sizeError

    const status = statusOfQuery(query)
    if (status instanceof Response) return status

    const siteSeq = Number(query.get('siteSeq'))
    const rows = approvedRows(
      (row) => row.fromSiteSeq === siteSeq,
      query.get('userName'),
      status
    ).map(
      (row) => ({ ...historyBase(row), userName: row.userName, toSiteName: row.toSiteName })
    )
    return paged(rows, pageNumber, pageSize)
  }),

  http.get(GET_USER_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const { pageNumber, pageSize } = pageOf(query)
    const sizeError = pageSizeError(pageSize)
    if (sizeError) return sizeError

    const status = statusOfQuery(query)
    if (status instanceof Response) return status

    const userSeq = Number(query.get('userSeq'))
    const rows = approvedRows((row) => row.userSeq === userSeq, null, status).map((row) => ({
      ...historyBase(row),
      siteSeq: row.toSiteSeq,
      siteName: row.toSiteName,
    }))
    return paged(rows, pageNumber, pageSize)
  }),

  http.put(APPROVE_PATH, async ({ request }) => {
    const body = (await request.json()) as Partial<AssignmentApproveRequest>
    if (body.assignmentSeq === undefined) return businessError('배치 정보를 확인할 수 없습니다.')
    const target = store.find((row) => row.assignmentSeq === body.assignmentSeq)
    if (!target) return businessError('배치 정보를 찾을 수 없습니다.', 404)
    if (target.state !== 'pending') return businessError('이미 승인 또는 반려 처리된 배치입니다.')

    // 🔴 `approved` 를 빼면 반려다(실측 B-48 — bool 기본값)
    target.state = body.approved === true ? 'approved' : 'rejected'
    return ok(true)
  }),

  http.put(RETURN_APPROVE_PATH, async ({ request }) => {
    const body = (await request.json()) as Partial<AssignmentApproveRequest>
    const target = store.find((row) => row.assignmentSeq === body.assignmentSeq)
    // 🔴 없는 ID 도 404 가 아니라 이 400 이다(실측)
    if (!target || !target.returnPending) {
      return businessError('이미 처리되었거나 존재하지 않는 복귀 요청입니다.')
    }

    target.returnPending = false
    // 승인 → 복귀완료. 반려 → 배치는 그대로(근무자는 다시 복귀 요청할 수 있다). `endDt` 는 바뀌지 않는다
    if (body.approved === true) {
      target.completeYn = true
      target.completeDt = now()
    }
    return ok(true)
  }),
]
