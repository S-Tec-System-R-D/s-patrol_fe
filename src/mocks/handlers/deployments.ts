import { http, HttpResponse } from 'msw'

import type {
  ApproveDeploymentRequest,
  DeploymentHistoryRow,
  DeploymentHistoryStatusCode,
  DeploymentRequestRow,
  DeploymentSummary,
  RejectDeploymentRequest,
  UpdateDeploymentEndDateRequest,
} from '@/features/deployments/types/deployment'

/**
 * MSW 배치관리 핸들러 (`spec 039` T632 · T656) — 🔴 **상태를 보유한다.**
 *
 * **실서버에 배치 API 가 없다** — 경로·필드·코드값은 전부 **가정 계약**(`types/deployment.ts`)이다.
 * 백엔드가 구현하면 WF-1-0 으로 실측해 이 파일과 타입 파일만 고친다.
 *
 * 🔴 **승인·거부·복귀일 지정이 실제로 상태를 바꾼다**(023 `courses.ts` 처럼 store + reset). 🔴 **요약과
 * 이력 상태는 store 에서 계산한다** — 따로 들고 있으면 요청·이력과 어긋난다.
 *
 * 🔴 **상태는 날짜로 계산한다**(T656, 가정 — 서버가 계산해 준다고 본다): 시작 전 = 배치예정 · 종료일이
 * **지나면** 복귀완료(종료일 당일은 아직 배치중) · 그 사이(종료 미정 포함) = 배치중.
 * ⚠️ 시드 날짜는 **흔들리지 않게** 골랐다 — 배치중/복귀완료 시드는 과거 날짜, 시작 전으로 남아야 하는 것은
 * 요청(승인 전)에만 둔다. 테스트가 실제 시계로 돌아도 결과가 같다.
 *
 * 🔴 **시드를 근무자 mock(038)과 맞췄다** — 오준혁은 "강서 소속으로 배치 온 사람" 이라 **전입**이다.
 *
 * ⚠️ **가정**(요청서 · OQ-039-A~D):
 * - 이미 처리됐거나 없는 요청 → **400 + 래퍼 `"이미 처리된 요청입니다."`**
 * - 거부 사유 공백 → 400 + 래퍼
 * - 승인 → 이력 1건(기간 = 요청의 시작일·종료일)
 * - 복귀일 지정: 시작일보다 앞서면 400 · 이미 복귀완료면 400
 */

const BASE = '/api/v1/Deployment/W/sign'
const GET_SUMMARY_PATH = `${BASE}/GetDeploymentSummary`
const GET_REQUEST_LIST_PATH = `${BASE}/GetDeploymentRequestList`
const GET_HISTORY_PATH = `${BASE}/GetDeploymentHistory`
const APPROVE_PATH = `${BASE}/ApproveDeploymentRequest`
const REJECT_PATH = `${BASE}/RejectDeploymentRequest`
const UPDATE_END_DATE_PATH = `${BASE}/UpdateDeploymentEndDate`
/** 🔴 서버 공통 상한 — 다른 목록 API 와 같다고 가정 */
const MAX_PAGE_SIZE = 100

const SITE_SEQ = 7
const SITE_NAME = '강동 테크노타워'

const requestSeeds: DeploymentRequestRow[] = [
  {
    requestSeq: 501,
    userSeq: 201,
    userName: '최범수',
    fromSiteSeq: 21,
    fromSiteName: '해운대 마린시티',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    // 종료일 있는 **앞으로의** 배치 — 승인하면 배치예정이 된다(⚠️ 2026-11-02 이후 실행하면 배치중이 된다 —
    // 테스트는 이 사람의 **상태**를 단언하지 않는다)
    startDt: '2026-11-02T00:00:00',
    endDt: '2026-12-31T00:00:00',
    reason: '야간 인력 부족 지원',
    requestDt: '2026-05-30T10:20:00',
  },
  {
    requestSeq: 502,
    userSeq: 202,
    userName: '배수진',
    fromSiteSeq: 22,
    fromSiteName: '송도 비즈니스타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    // 🔴 종료일 미정 — 승인 뒤 관리자가 복귀일을 지정해야 하는 경우
    startDt: '2026-06-03T00:00:00',
    endDt: null,
    reason: '휴가 대체',
    requestDt: '2026-05-28T15:05:00',
  },
]

type StoredHistory = Omit<DeploymentHistoryRow, 'status' | 'statusName'>

const historySeeds: StoredHistory[] = [
  // 전출 — 배치중(종료 미정)
  {
    historySeq: 601,
    userSeq: 110,
    userName: '장도윤',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 12,
    toSiteName: '강서 스퀘어타워',
    reason: '인력 지원',
    startDt: '2026-03-01T00:00:00',
    endDt: null,
  },
  // 전출 — 복귀완료
  {
    historySeq: 602,
    userSeq: 104,
    userName: '박지우',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 14,
    toSiteName: '노원 파크뷰',
    reason: '단기 지원',
    startDt: '2025-12-01T00:00:00',
    endDt: '2026-01-15T00:00:00',
  },
  // 전입 — 배치중(종료 미정) · 🔴 근무자 mock 의 오준혁(`originSiteSeq 12`)과 같은 사람
  {
    historySeq: 603,
    userSeq: 103,
    userName: '오준혁',
    fromSiteSeq: 12,
    fromSiteName: '강서 스퀘어타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '인력 지원',
    startDt: '2026-01-05T00:00:00',
    endDt: null,
  },
  // 전입 — 복귀완료
  {
    historySeq: 604,
    userSeq: 205,
    userName: '한지민',
    fromSiteSeq: 13,
    fromSiteName: '송파 그린타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '단기 지원',
    startDt: '2026-02-01T00:00:00',
    endDt: '2026-04-15T00:00:00',
  },
]

let requests: DeploymentRequestRow[] = requestSeeds.map((row) => ({ ...row }))
let history: StoredHistory[] = historySeeds.map((row) => ({ ...row }))

/**
 * 저장소를 초기 상태로 되돌린다.
 *
 * 🔴 **테스트 격리에 필요하다** — `server.resetHandlers()` 는 이 배열을 건드리지 않는다. 상태를 바꾸는
 * 테스트 파일은 `beforeEach` 에서 부른다(`resetCourseStore`·`resetPointStore` 선례).
 */
export const resetDeploymentStore = (): void => {
  requests = requestSeeds.map((row) => ({ ...row }))
  history = historySeeds.map((row) => ({ ...row }))
}

/** 오늘(`yyyy-MM-dd`) — 브라우저(dev·캡쳐)는 `page.clock` 고정 시각을, 테스트는 실제 시계를 탄다 */
const today = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const STATUS_NAME: Record<DeploymentHistoryStatusCode, string> = {
  0: '배치중',
  1: '복귀완료',
  2: '배치예정',
}

/** 🔴 날짜로 상태를 정한다 — 종료일 **당일**은 아직 배치중이다(그날까지 근무한다) */
const statusOf = (row: StoredHistory): DeploymentHistoryStatusCode => {
  const now = today()
  if (row.startDt.slice(0, 10) > now) return 2
  if (row.endDt !== null && row.endDt.slice(0, 10) < now) return 1
  return 0
}

const withStatus = (row: StoredHistory): DeploymentHistoryRow => {
  const status = statusOf(row)
  return { ...row, status, statusName: STATUS_NAME[status] }
}

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const businessError = (message: string) =>
  HttpResponse.json({ message, data: false, code: 400 }, { status: 400 })

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
    totalCount: items.length,
    page: pageNumber,
    pageSize,
  })
}

/** 🔴 인원은 **배치중만** 센다 — 예정·복귀완료는 지금 그 자리에 없다 */
const summaryOf = (siteSeq: number): DeploymentSummary => {
  const active = history.map(withStatus).filter((row) => row.status === 0)
  return {
    outCount: active.filter((row) => row.fromSiteSeq === siteSeq).length,
    inCount: active.filter((row) => row.toSiteSeq === siteSeq).length,
    pendingCount: requests.filter((row) => row.toSiteSeq === siteSeq).length,
  }
}

export const deploymentHandlers = [
  http.get(GET_SUMMARY_PATH, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    return ok(summaryOf(siteSeq))
  }),

  http.get(GET_REQUEST_LIST_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const sizeError = pageSizeError(pageSize)
    if (sizeError) return sizeError

    const siteSeq = Number(query.get('siteSeq'))
    const rows = requests
      .filter((row) => row.toSiteSeq === siteSeq)
      .sort((a, b) => b.requestDt.localeCompare(a.requestDt))
    return paged(rows, pageNumber, pageSize)
  }),

  http.get(GET_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    const sizeError = pageSizeError(pageSize)
    if (sizeError) return sizeError

    const siteSeq = Number(query.get('siteSeq'))
    const direction = Number(query.get('direction'))
    // 0 배치중 / 1 복귀완료 / 2 배치예정 — 없으면 전체(가정)
    const status = query.get('status')
    // 근무자 이름 부분 일치(가정 · T658)
    const userName = query.get('userName')
    const rows = history
      .filter((row) => (direction === 1 ? row.toSiteSeq === siteSeq : row.fromSiteSeq === siteSeq))
      .map(withStatus)
      .filter((row) => (status === null ? true : row.status === Number(status)))
      .filter((row) => (userName === null ? true : row.userName.includes(userName)))
      .sort((a, b) => b.startDt.localeCompare(a.startDt))
    return paged(rows, pageNumber, pageSize)
  }),

  http.post(APPROVE_PATH, async ({ request }) => {
    const body = (await request.json()) as ApproveDeploymentRequest
    const target = requests.find((row) => row.requestSeq === body.requestSeq)
    if (!target) return businessError('이미 처리된 요청입니다.')

    requests = requests.filter((row) => row.requestSeq !== target.requestSeq)
    // 기간은 요청의 시작일·종료일 그대로(로직 3)
    history = [
      {
        historySeq: Math.max(0, ...history.map((row) => row.historySeq)) + 1,
        userSeq: target.userSeq,
        userName: target.userName,
        fromSiteSeq: target.fromSiteSeq,
        fromSiteName: target.fromSiteName,
        toSiteSeq: target.toSiteSeq,
        toSiteName: target.toSiteName,
        reason: target.reason,
        startDt: target.startDt,
        endDt: target.endDt,
      },
      ...history,
    ]
    return ok(true)
  }),

  http.post(REJECT_PATH, async ({ request }) => {
    const body = (await request.json()) as RejectDeploymentRequest
    if (!body.rejectReason?.trim()) return businessError('거부 사유를 입력해주세요.')
    const target = requests.find((row) => row.requestSeq === body.requestSeq)
    if (!target) return businessError('이미 처리된 요청입니다.')

    // 🔴 거부는 이력을 만들지 않는다 — 이력은 승인된 배치만(014 결정)
    requests = requests.filter((row) => row.requestSeq !== target.requestSeq)
    return ok(true)
  }),

  http.post(UPDATE_END_DATE_PATH, async ({ request }) => {
    const body = (await request.json()) as UpdateDeploymentEndDateRequest
    const target = history.find((row) => row.historySeq === body.historySeq)
    if (!target) return businessError('배치 이력을 찾을 수 없습니다.')
    if (statusOf(target) === 1) return businessError('이미 복귀한 배치입니다.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.endDt ?? '')) return businessError('복귀일을 입력해주세요.')
    if (body.endDt < target.startDt.slice(0, 10)) {
      return businessError('복귀일은 배치 시작일 이후여야 합니다.')
    }

    history = history.map((row) =>
      row.historySeq === target.historySeq ? { ...row, endDt: `${body.endDt}T00:00:00` } : row
    )
    return ok(true)
  }),
]
