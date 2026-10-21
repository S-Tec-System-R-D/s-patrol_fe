import { http, HttpResponse } from 'msw'

import type {
  ApproveDeploymentRequest,
  DeploymentHistoryRow,
  DeploymentRequestRow,
  DeploymentSummary,
  RejectDeploymentRequest,
} from '@/features/deployments/types/deployment'

/**
 * MSW 배치관리 핸들러 (`spec 039` T632) — 🔴 **상태를 보유한다.**
 *
 * **실서버에 배치 API 가 없다** — 경로·필드·코드값은 전부 **가정 계약**(`types/deployment.ts`)이다.
 * 백엔드가 구현하면 WF-1-0 으로 실측해 이 파일과 타입 파일만 고친다.
 *
 * 🔴 **승인·거부가 실제로 상태를 바꾼다**(023 `courses.ts` 처럼 store + reset) — 승인하면 요청이 사라지고
 * 이력이 생기며 요약 숫자가 바뀐다. 화면이 "무효화 후 다시 받으면 숫자가 맞는지" 를 dev·테스트에서 볼 수
 * 있어야 한다. 🔴 **요약은 store 에서 계산한다** — 따로 들고 있으면 요청·이력과 어긋난다.
 *
 * 🔴 **시드를 근무자 mock(038)과 맞췄다** — 014 시드는 오준혁을 "강동 → 강서 배치 나감" 으로 뒀는데,
 * 근무자 mock 은 그를 "강서 소속으로 배치 온 사람"(`originSiteSeq 12`)으로 둔다(038 실측: 원소속 =
 * 배치 온 사람의 소속지). 두 화면이 같은 사람을 반대로 말하지 않게 **전입**으로 바꿨다.
 *
 * ⚠️ **가정**(요청서 · OQ-039-A~D):
 * - 이미 처리됐거나 없는 요청 → **400 + 래퍼 `"이미 처리된 요청입니다."`**
 * - 거부 사유 공백 → 400 + 래퍼
 * - 승인 즉시 이동(OQ-039-D) — 배치(0)는 이력 1건 생성, 복귀(1)는 그 사람의 진행 중 이력을 닫는다
 */

const BASE = '/api/v1/Deployment/W/sign'
const GET_SUMMARY_PATH = `${BASE}/GetDeploymentSummary`
const GET_REQUEST_LIST_PATH = `${BASE}/GetDeploymentRequestList`
const GET_HISTORY_PATH = `${BASE}/GetDeploymentHistory`
const APPROVE_PATH = `${BASE}/ApproveDeploymentRequest`
const REJECT_PATH = `${BASE}/RejectDeploymentRequest`
/** 🔴 서버 공통 상한 — 다른 목록 API 와 같다고 가정 */
const MAX_PAGE_SIZE = 100

const SITE_SEQ = 7
const SITE_NAME = '강동 테크노타워'

const requestSeeds: DeploymentRequestRow[] = [
  {
    requestSeq: 501,
    userSeq: 201,
    userName: '최범수',
    requestType: 0,
    requestTypeName: '배치',
    fromSiteSeq: 21,
    fromSiteName: '해운대 마린시티',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '야간 인력 부족 지원',
    requestDt: '2026-05-30T10:20:00',
  },
  {
    requestSeq: 502,
    userSeq: 202,
    userName: '배수진',
    requestType: 0,
    requestTypeName: '배치',
    fromSiteSeq: 22,
    fromSiteName: '송도 비즈니스타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '휴가 대체',
    requestDt: '2026-05-28T15:05:00',
  },
]

const historySeeds: DeploymentHistoryRow[] = [
  // 전출 — 배치 중(나간 인원 1)
  {
    historySeq: 601,
    userSeq: 110,
    userName: '장도윤',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 12,
    toSiteName: '강서 스퀘어타워',
    reason: '인력 지원',
    startDt: '2026-03-01T09:00:00',
    endDt: null,
  },
  // 전출 — 복귀 완료
  {
    historySeq: 602,
    userSeq: 104,
    userName: '박지우',
    fromSiteSeq: SITE_SEQ,
    fromSiteName: SITE_NAME,
    toSiteSeq: 14,
    toSiteName: '노원 파크뷰',
    reason: '단기 지원',
    startDt: '2025-12-01T09:00:00',
    endDt: '2026-01-15T18:00:00',
  },
  // 전입 — 배치 중(온 인원 1) · 🔴 근무자 mock 의 오준혁(`originSiteSeq 12`)과 같은 사람
  {
    historySeq: 603,
    userSeq: 103,
    userName: '오준혁',
    fromSiteSeq: 12,
    fromSiteName: '강서 스퀘어타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '인력 지원',
    startDt: '2026-01-05T09:00:00',
    endDt: null,
  },
  // 전입 — 복귀 완료
  {
    historySeq: 604,
    userSeq: 205,
    userName: '한지민',
    fromSiteSeq: 13,
    fromSiteName: '송파 그린타워',
    toSiteSeq: SITE_SEQ,
    toSiteName: SITE_NAME,
    reason: '단기 지원',
    startDt: '2026-02-01T09:00:00',
    endDt: '2026-04-15T18:00:00',
  },
]

let requests: DeploymentRequestRow[] = requestSeeds.map((row) => ({ ...row }))
let history: DeploymentHistoryRow[] = historySeeds.map((row) => ({ ...row }))

/**
 * 저장소를 초기 상태로 되돌린다.
 *
 * 🔴 **테스트 격리에 필요하다** — `server.resetHandlers()` 는 이 배열을 건드리지 않는다. 승인·거부를
 * 다루는 테스트 파일은 `beforeEach` 에서 부른다(`resetCourseStore`·`resetPointStore` 선례).
 */
export const resetDeploymentStore = (): void => {
  requests = requestSeeds.map((row) => ({ ...row }))
  history = historySeeds.map((row) => ({ ...row }))
}

/** 서버처럼 타임존 없는 ISO(`'2026-10-21T09:00:00'`) */
const nowIso = (): string => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`
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

const summaryOf = (siteSeq: number): DeploymentSummary => ({
  outCount: history.filter((row) => row.fromSiteSeq === siteSeq && row.endDt === null).length,
  inCount: history.filter((row) => row.toSiteSeq === siteSeq && row.endDt === null).length,
  pendingCount: requests.filter((row) => row.toSiteSeq === siteSeq).length,
})

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
    const rows = history
      .filter((row) => (direction === 1 ? row.toSiteSeq === siteSeq : row.fromSiteSeq === siteSeq))
      .sort((a, b) => b.startDt.localeCompare(a.startDt))
    return paged(rows, pageNumber, pageSize)
  }),

  http.post(APPROVE_PATH, async ({ request }) => {
    const body = (await request.json()) as ApproveDeploymentRequest
    const target = requests.find((row) => row.requestSeq === body.requestSeq)
    if (!target) return businessError('이미 처리된 요청입니다.')

    requests = requests.filter((row) => row.requestSeq !== target.requestSeq)
    const now = nowIso()
    if (target.requestType === 1) {
      // 복귀 — 그 사람의 진행 중 이력을 닫는다(가정)
      history = history.map((row) =>
        row.userSeq === target.userSeq && row.endDt === null ? { ...row, endDt: now } : row
      )
    } else {
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
          startDt: now,
          endDt: null,
        },
        ...history,
      ]
    }
    return ok(true)
  }),

  http.post(REJECT_PATH, async ({ request }) => {
    const body = (await request.json()) as RejectDeploymentRequest
    if (!body.rejectReason?.trim()) return businessError('거부 사유를 입력해주세요.')
    const target = requests.find((row) => row.requestSeq === body.requestSeq)
    if (!target) return businessError('이미 처리된 요청입니다.')

    // 🔴 거부는 이력을 만들지 않는다 — 이력은 실제 이동만(014 결정)
    requests = requests.filter((row) => row.requestSeq !== target.requestSeq)
    return ok(true)
  }),
]
