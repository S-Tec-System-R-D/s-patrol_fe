import { http, HttpResponse } from 'msw'

import type { GroupNode, SiteNode } from '@/features/auth/types/site'
import type {
  AddGroupRequest,
  GroupAdminRow,
  GroupListNode,
  GroupListSite,
  UpdateGroupRequest,
} from '@/features/groups/types/group'
import type { ExceptionTime, SiteDetail, UpdateSiteRequest } from '@/features/sites/types/site'

/**
 * MSW 관리그룹 · 사업장 핸들러 (`spec 043` T740 · `spec 044` T785) — 🔴 **상태를 보유한다.**
 *
 * 경로 · 응답 모양 · 오류 문구는 `api-spec.md` §5-1-B "관리그룹 3종" · "사업장 3종" · §5-2(실측 2026-10-22 · 23) 그대로다.
 * 시드 트리 · 사업장 · 관리자 · 할당도 **실서버 값**이다(목업 이름을 실데이터로 착각한 일이 있어 실측값을 쓴다).
 *
 * 🔴 **그룹과 사업장을 각각 평면 배열 하나로 들고, 응답 3종을 매번 만든다**(한 출처 — 사용자 결정 2026-10-23):
 * `AdminSiteSelect`(043 트리) · `GetGroupList`(044 목록) · `GetSiteDetail`. 그래서 그룹을 지우면 목록에서도 사라지고,
 * 사업장을 추가하면 좌측 패널 개수도 바뀐다.
 *
 * 서버 동작 흉내(실측):
 * - 그룹 추가: 깊이 제한 없음(B-49 ①) · 🔴 `parentGroupSeq` 생략 시 200 + 트리에 안 보이는 그룹(B-49 ②)
 * - 그룹 수정: 🔴 `userSeq` 생략 = 할당 비우기(B-50) · 없는 `userSeq` 500 · 자기 하위로 이동 400
 * - 그룹 삭제: 🔴 자손 그룹 + 사업장 연쇄(B-51)
 * - 사업장 추가: 🔴 `exceptionTime` 버림(B-52) · 헬스체크 꺼짐이면 헬스체크 값도 버림 · 그룹 단계 검사 없음
 * - 사업장 수정: 🔴 생략·`null` 유지 · `""` 지움 · 예외시간 통째 교체 · 하위 사업장 그룹 변경 400 · 이동 시 하위 동반
 * - 사업장 삭제: 🔴 하위 사업장 연쇄(B-54)
 * - 헬스체크 필수값 누락: 🔴 **(D) 문자열 body**
 */

const BASE = '/api/v1/Group/W/sign'
const SITE_BASE = '/api/v1/Site/W/sign'
const ADMIN_SITE_SELECT_PATH = '/api/v1/Login/W/sign/AdminSiteSelect'
const ROOT_GROUP_SEQ = 1

interface StoredGroup {
  groupSeq: number
  groupName: string
  parentGroupSeq: number | null
}

/** 사업장 1곳 — 상세 필드 전부 + 위치(`groupSeq` · `parentSiteSeq`) */
interface StoredSite extends SiteDetail {
  groupSeq: number
  parentSiteSeq: number | null
}

const seedGroups: StoredGroup[] = [
  { groupSeq: 1, groupName: '에스텍시스템', parentGroupSeq: null },
  { groupSeq: 2, groupName: '테스트사업장(수정)', parentGroupSeq: 1 },
  { groupSeq: 3, groupName: '강동지사', parentGroupSeq: 2 },
  { groupSeq: 4, groupName: 'test', parentGroupSeq: 1 },
  { groupSeq: 6, groupName: '테스트그룹', parentGroupSeq: 1 },
]

/** 헬스체크를 한 번도 설정하지 않은 사업장의 값(최소 생성과 같다 — 실측) */
const NO_HEALTH_CHECK = {
  healthCheckYn: false,
  healthCheckInterval: 0,
  healthCheckTimeout: 0,
  healthCheckRetry: null,
  healthCheckStartTime: null,
  healthCheckEndTime: null,
} as const

const exception = (detailSeq: number, start: string, end: string): ExceptionTime => ({
  detailSeq,
  exceptionStartTime: start,
  exceptionEndTime: end,
})

/** 실서버 사업장 11곳(`GetSiteDetail` 실측 2026-10-23) */
const seedSites: StoredSite[] = [
  {
    siteSeq: 1, siteName: '강남우체국', groupSeq: 1, parentSiteSeq: null,
    tel: '333', address: '서울시 강남구 개포로619', ...NO_HEALTH_CHECK,
    exceptionTime: [], userCount: 0, courseCount: 0, pointCount: 0,
  },
  {
    siteSeq: 2, siteName: '테스트사업장', groupSeq: 2, parentSiteSeq: null,
    tel: null, address: null, ...NO_HEALTH_CHECK,
    exceptionTime: [exception(1, '14:00:00', '14:10:00')], userCount: 1, courseCount: 3, pointCount: 4,
  },
  {
    siteSeq: 3, siteName: '테테테(수정)1', groupSeq: 3, parentSiteSeq: null,
    tel: '0123125165', address: '서울시',
    healthCheckYn: true, healthCheckInterval: 30, healthCheckTimeout: 1, healthCheckRetry: 0,
    healthCheckStartTime: '08:16:39', healthCheckEndTime: '23:16:41',
    exceptionTime: [], userCount: 0, courseCount: 13, pointCount: 15,
  },
  {
    siteSeq: 4, siteName: '수정사업장테테', groupSeq: 3, parentSiteSeq: 3,
    tel: '12312451', address: '(수정)경기도용인시',
    healthCheckYn: true, healthCheckInterval: 30, healthCheckTimeout: 2, healthCheckRetry: 5,
    healthCheckStartTime: '11:10:00', healthCheckEndTime: '16:00:00',
    exceptionTime: [exception(2, '12:30:00', '12:40:00')], userCount: 1, courseCount: 0, pointCount: 0,
  },
  {
    siteSeq: 9, siteName: '강동지사_추가사업장', groupSeq: 3, parentSiteSeq: null,
    tel: '02-1234-5677', address: '경기도~~', ...NO_HEALTH_CHECK,
    exceptionTime: [], userCount: 0, courseCount: 0, pointCount: 0,
  },
  {
    siteSeq: 11, siteName: '지가사업장', groupSeq: 3, parentSiteSeq: null,
    tel: '123123123', address: '지가2',
    healthCheckYn: false, healthCheckInterval: 1, healthCheckTimeout: 10, healthCheckRetry: 0,
    healthCheckStartTime: '09:00:31', healthCheckEndTime: '17:00:00',
    exceptionTime: [], userCount: 4, courseCount: 2, pointCount: 5,
  },
  {
    siteSeq: 5, siteName: '테스트 사업장', groupSeq: 4, parentSiteSeq: null,
    tel: '0212345678', address: '개포로 619',
    healthCheckYn: false, healthCheckInterval: 1, healthCheckTimeout: 10, healthCheckRetry: 2,
    healthCheckStartTime: '09:00:00', healthCheckEndTime: '09:30:00',
    exceptionTime: [exception(3, '17:00:00', '17:33:00')], userCount: 0, courseCount: 0, pointCount: 0,
  },
  {
    siteSeq: 6, siteName: '테스트 사업장2', groupSeq: 4, parentSiteSeq: null,
    tel: '0212345678', address: '개포로 619',
    healthCheckYn: false, healthCheckInterval: 60, healthCheckTimeout: 20, healthCheckRetry: 2,
    healthCheckStartTime: '08:00:00', healthCheckEndTime: '00:00:00',
    exceptionTime: [exception(4, '17:00:00', '17:33:00'), exception(5, '00:00:00', '08:59:00')],
    userCount: 5, courseCount: 7, pointCount: 16,
  },
  {
    siteSeq: 7, siteName: '테스트 사업장2-1', groupSeq: 4, parentSiteSeq: 6,
    tel: '0212345678', address: '개포로 123',
    healthCheckYn: false, healthCheckInterval: 1, healthCheckTimeout: 10, healthCheckRetry: 2,
    healthCheckStartTime: '09:00:00', healthCheckEndTime: '09:30:00',
    exceptionTime: [], userCount: 0, courseCount: 8, pointCount: 7,
  },
  {
    siteSeq: 8, siteName: '테스트 사업장2-2', groupSeq: 4, parentSiteSeq: 6,
    tel: '0212345678', address: '개포로45677',
    healthCheckYn: false, healthCheckInterval: 1, healthCheckTimeout: 10, healthCheckRetry: 2,
    healthCheckStartTime: '09:00:00', healthCheckEndTime: '09:30:00',
    exceptionTime: [], userCount: 0, courseCount: 0, pointCount: 0,
  },
  {
    siteSeq: 12, siteName: '수정사업장됨', groupSeq: 6, parentSiteSeq: null,
    tel: 'string', address: '테스트주소',
    healthCheckYn: true, healthCheckInterval: 33, healthCheckTimeout: 22, healthCheckRetry: 2,
    healthCheckStartTime: '11:00:00', healthCheckEndTime: '11:20:00',
    exceptionTime: [], userCount: 0, courseCount: 0, pointCount: 0,
  },
]

/** 본사 관리자 전원(`codeSeq` 2 시스템관리자 · 3 관리자 · 4 매니저) — 실측 */
const ADMINS: Omit<GroupAdminRow, 'isInclude'>[] = [
  { userSeq: 1, codeSeq: 2, codeName: '시스템관리자', userName: '시스템관리자' },
  { userSeq: 3, codeSeq: 3, codeName: '관리자', userName: '김용우' },
  { userSeq: 4, codeSeq: 3, codeName: '관리자', userName: '이현성' },
  { userSeq: 6, codeSeq: 4, codeName: '매니저', userName: '테스트' },
  { userSeq: 12, codeSeq: 3, codeName: '관리자', userName: 'test' },
]

/** 그룹별 할당 — 🔴 한 사람이 여러 그룹에 있다(user 3 = g2 · g4 · g6, 실측) */
const seedAssignments: Record<number, number[]> = { 1: [1], 2: [3, 4], 4: [3, 12], 6: [1, 3, 4] }

let groups: StoredGroup[] = []
let sites: StoredSite[] = []
let assignments = new Map<number, number[]>()
/** 실서버 identity 를 흉내 — 시드 최대 seq 다음부터 */
let nextGroupSeq = 7
let nextSiteSeq = 13
let nextDetailSeq = 6

/**
 * 시드로 되돌린다.
 * 🔴 **테스트 격리에 필요하다** — `server.resetHandlers()` 는 이 상태를 건드리지 않는다.
 */
export const resetGroupStore = (): void => {
  groups = seedGroups.map((group) => ({ ...group }))
  sites = seedSites.map((site) => ({ ...site, exceptionTime: site.exceptionTime.map((row) => ({ ...row })) }))
  assignments = new Map(Object.entries(seedAssignments).map(([seq, users]) => [Number(seq), [...users]]))
  nextGroupSeq = 7
  nextSiteSeq = 13
  nextDetailSeq = 6
}
resetGroupStore()

// ── 응답 만들기 ─────────────────────────────────────────

const childGroups = (groupSeq: number) => groups.filter((group) => group.parentGroupSeq === groupSeq)
const topSites = (groupSeq: number) =>
  sites.filter((site) => site.groupSeq === groupSeq && site.parentSiteSeq === null)
const childSites = (siteSeq: number) => sites.filter((site) => site.parentSiteSeq === siteSeq)

const toSiteNode = (site: StoredSite): SiteNode => ({
  siteSeq: site.siteSeq,
  siteName: site.siteName,
  parentSiteSeq: site.parentSiteSeq,
  children: childSites(site.siteSeq).map(toSiteNode),
})

const toNode = (group: StoredGroup, depth: number): GroupNode => ({
  groupSeq: group.groupSeq,
  groupName: group.groupName,
  parentGroupSeq: group.parentGroupSeq,
  layer: depth,
  depth,
  sites: topSites(group.groupSeq).map(toSiteNode),
  children: childGroups(group.groupSeq).map((child) => toNode(child, depth + 1)),
})

const findRoot = (): StoredGroup => {
  const root = groups.find((group) => group.groupSeq === ROOT_GROUP_SEQ)
  if (!root) throw new Error('MSW groups: 루트 그룹이 없다')
  return root
}

/** 🔴 루트(1)에서 닿는 그룹만 트리에 나온다 — 부모 없이 만든 그룹은 안 보인다(B-49 ②) */
const buildTree = (): GroupNode => toNode(findRoot(), 0)

const descendantSeqs = (groupSeq: number): number[] =>
  childGroups(groupSeq).flatMap((child) => [child.groupSeq, ...descendantSeqs(child.groupSeq)])

const descendantSiteSeqs = (siteSeq: number): number[] =>
  childSites(siteSeq).flatMap((child) => [child.siteSeq, ...descendantSiteSeqs(child.siteSeq)])

const toListSite = (site: StoredSite, groupName: string): GroupListSite => {
  const children = childSites(site.siteSeq)
  return {
    siteSeq: site.siteSeq,
    siteName: site.siteName,
    siteGroupSeq: site.groupSeq,
    siteGroupName: groupName,
    address: site.address,
    tel: site.tel,
    healthCheckYn: false, // 🔴 실서버는 항상 false(B-55)
    userCount: site.userCount,
    count: children.length,
    parentSiteSeq: site.parentSiteSeq,
    children: children.map((child) => toListSite(child, groupName)),
  }
}

const toListNode = (group: StoredGroup, layer: number): GroupListNode => {
  const covered = [group.groupSeq, ...descendantSeqs(group.groupSeq)]
  return {
    groupSeq: group.groupSeq,
    groupName: group.groupName,
    parentGroupSeq: group.parentGroupSeq,
    layer,
    // 🔴 실서버는 G6 만 layer 1 · depth 0 이다(B-55) — 화면이 depth 를 쓰지 않는지 드러나게 흉내 낸다
    depth: group.groupSeq === 6 ? 0 : layer,
    count: sites.filter((site) => covered.includes(site.groupSeq)).length,
    sites: topSites(group.groupSeq).map((site) => toListSite(site, group.groupName)),
    children: childGroups(group.groupSeq).map((child) => toListNode(child, layer + 1)),
  }
}

const toDetail = (site: StoredSite): SiteDetail => ({
  siteSeq: site.siteSeq,
  siteName: site.siteName,
  tel: site.tel,
  address: site.address,
  healthCheckYn: site.healthCheckYn,
  healthCheckInterval: site.healthCheckInterval,
  healthCheckTimeout: site.healthCheckTimeout,
  healthCheckRetry: site.healthCheckRetry,
  healthCheckStartTime: site.healthCheckStartTime,
  healthCheckEndTime: site.healthCheckEndTime,
  exceptionTime: site.exceptionTime.map((row) => ({ ...row })),
  userCount: site.userCount,
  courseCount: site.courseCount,
  pointCount: site.pointCount,
})

// ── 응답 형태 ───────────────────────────────────────────

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const businessError = (message: string, status = 400) =>
  HttpResponse.json({ message, data: false, code: status }, { status })

/** 필드 빈 값 — ASP.NET ProblemDetails(실측) */
const fieldRequired = (field: string) =>
  HttpResponse.json(
    {
      errors: { [field]: [`The ${field} field is required.`] },
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
    },
    { status: 400 }
  )

/** 🔴 (D) body 전체가 문구 하나 — 헬스체크 필수값 누락(실측 2026-10-23) */
const textError = (message: string) => HttpResponse.json(message, { status: 400 })

const serverError = () =>
  HttpResponse.json(
    {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
      title: 'An error occurred while processing your request.',
      status: 500,
      detail: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
    },
    { status: 500 }
  )

// ── 관리그룹 ────────────────────────────────────────────

const DUPLICATE_NAME = '동일한 위치에 같은 이름의 관리그룹이 이미 존재합니다.'
const NOT_FOUND = '관리그룹이 존재하지 않습니다.'

const hasSiblingNamed = (parentGroupSeq: number | null, groupName: string, exceptSeq?: number) =>
  groups.some(
    (group) =>
      group.parentGroupSeq === parentGroupSeq &&
      group.groupName === groupName &&
      group.groupSeq !== exceptSeq
  )

// ── 사업장 ──────────────────────────────────────────────

const SITE_DUPLICATE_NAME = '동일한 위치에 같은 이름의 사업장이 이미 존재합니다.'
const SITE_NOT_FOUND = '사업장이 존재하지 않습니다.'
const BAD_REQUEST = '잘못된 요청입니다.'

const hasSiteNamed = (groupSeq: number, siteName: string, exceptSeq?: number) =>
  sites.some((site) => site.groupSeq === groupSeq && site.siteName === siteName && site.siteSeq !== exceptSeq)

/** `'HH:mm'` 도 받는다 — 서버는 `'HH:mm:00'` 으로 저장한다(실측) */
const normalizeTime = (time: string): string => (/^\d{2}:\d{2}$/.test(time) ? `${time}:00` : time)

type HealthValues = Pick<
  SiteDetail,
  | 'healthCheckInterval'
  | 'healthCheckTimeout'
  | 'healthCheckRetry'
  | 'healthCheckStartTime'
  | 'healthCheckEndTime'
>

/** 값 검사 — 래퍼(실측 문구) */
const healthValueError = (values: HealthValues) => {
  if (values.healthCheckInterval <= 0) return businessError('생체확인 간격을 정확히 입력해주세요.')
  if (values.healthCheckTimeout <= 0) return businessError('생체확인 타임아웃을 정확히 입력해주세요.')
  if (values.healthCheckStartTime !== null && values.healthCheckStartTime === values.healthCheckEndTime) {
    return businessError('생체확인 시작시간과 종료시간이 같을 수 없습니다.')
  }
  return null
}

/** 필수 검사 — 🔴 (D) 문자열(실측 문구 · 순서) */
const healthRequiredError = (body: { [K in keyof HealthValues]?: HealthValues[K] | undefined }) => {
  if (body.healthCheckInterval == null) return textError('간격은 필수입니다.')
  if (body.healthCheckTimeout == null) return textError('타임아웃은 필수입니다.')
  if (body.healthCheckRetry == null) return textError('몇번 재알람 할건지는 필수입니다.')
  if (body.healthCheckStartTime == null) return textError('시작시간은 필수입니다.')
  if (body.healthCheckEndTime == null) return textError('종료시간은 필수입니다.')
  return null
}

interface AddSiteBody extends Partial<UpdateSiteRequest> {
  parentSiteSeq?: number | null
}

export const groupHandlers = [
  http.get(ADMIN_SITE_SELECT_PATH, () => ok(buildTree())),

  // ✅ 2026-10-23 수정(B-1) — 파라미터를 무시하고 전체 트리를 준다
  http.get(`${BASE}/GetGroupList`, () => ok(toListNode(findRoot(), 0))),

  // 🔴 없는 `groupSeq` 에도 200(전원 false) — 실측
  http.get(`${BASE}/GetGroupAdminList`, ({ request }) => {
    const groupSeq = Number(new URL(request.url).searchParams.get('groupSeq'))
    const included = assignments.get(groupSeq) ?? []
    return ok(ADMINS.map((admin) => ({ ...admin, isInclude: included.includes(admin.userSeq) })))
  }),

  http.post(`${BASE}/AddGroup`, async ({ request }) => {
    const body = (await request.json()) as Partial<AddGroupRequest>
    const groupName = body.groupName ?? ''
    if (groupName === '') return fieldRequired('groupName')

    const parentGroupSeq = body.parentGroupSeq ?? null
    if (parentGroupSeq !== null && !groups.some((group) => group.groupSeq === parentGroupSeq)) {
      return businessError('부모 관리그룹이 존재하지 않습니다.')
    }
    if (hasSiblingNamed(parentGroupSeq, groupName)) return businessError(DUPLICATE_NAME, 409)

    const groupSeq = nextGroupSeq++
    groups.push({ groupSeq, groupName, parentGroupSeq })
    assignments.set(groupSeq, [...(body.userSeq ?? [])])
    return ok(true)
  }),

  http.put(`${BASE}/UpdateGroup`, async ({ request }) => {
    const body = (await request.json()) as Partial<UpdateGroupRequest>
    const target = groups.find((group) => group.groupSeq === body.groupSeq)
    if (!target) return businessError(NOT_FOUND)

    const groupName = body.groupName ?? ''
    if (groupName === '') return fieldRequired('groupName')

    const parentGroupSeq = body.parentGroupSeq ?? null
    if (parentGroupSeq !== null && descendantSeqs(target.groupSeq).includes(parentGroupSeq)) {
      return businessError('하위 관리그룹으로는 이동할 수 없습니다.')
    }
    if (hasSiblingNamed(parentGroupSeq, groupName, target.groupSeq)) {
      return businessError(DUPLICATE_NAME, 409)
    }

    const userSeq = body.userSeq ?? [] // 🔴 생략 = 비우기(B-50)
    if (userSeq.some((seq) => !ADMINS.some((admin) => admin.userSeq === seq))) return serverError()

    target.groupName = groupName
    target.parentGroupSeq = parentGroupSeq
    assignments.set(target.groupSeq, [...userSeq])
    return ok(true)
  }),

  http.delete(`${BASE}/DeleteGroup`, ({ request }) => {
    const groupSeq = Number(new URL(request.url).searchParams.get('groupSeq'))
    if (!groups.some((group) => group.groupSeq === groupSeq)) return businessError(NOT_FOUND)

    // 🔴 자손 그룹과 그 사업장까지 함께(B-51)
    const removed = new Set([groupSeq, ...descendantSeqs(groupSeq)])
    groups = groups.filter((group) => !removed.has(group.groupSeq))
    sites = sites.filter((site) => !removed.has(site.groupSeq))
    removed.forEach((seq) => assignments.delete(seq))
    return ok(true)
  }),

  // 🔴 없는(지워진) 사업장은 400 래퍼 + `data: null` — 실측
  http.get(`${SITE_BASE}/GetSiteDetail`, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    const site = sites.find((candidate) => candidate.siteSeq === siteSeq)
    if (!site) return HttpResponse.json({ message: BAD_REQUEST, data: null, code: 400 }, { status: 400 })
    return ok(toDetail(site))
  }),

  http.post(`${SITE_BASE}/AddSite`, async ({ request }) => {
    const body = (await request.json()) as AddSiteBody
    const siteName = body.siteName ?? ''
    if (siteName === '') return fieldRequired('siteName')
    if (body.groupSeq == null) return businessError(BAD_REQUEST)
    const groupSeq = body.groupSeq
    if (!groups.some((group) => group.groupSeq === groupSeq)) return businessError(NOT_FOUND)

    const parentSiteSeq = body.parentSiteSeq ?? null
    if (
      parentSiteSeq !== null &&
      !sites.some((site) => site.siteSeq === parentSiteSeq && site.groupSeq === groupSeq)
    ) {
      return businessError('모 사업장이 존재하지 않거나 같은 관리그룹에 속해있지 않습니다.')
    }

    // 헬스체크를 켜고 보내면 필수(문자열) → 값(래퍼) 순서로 본다 — 실측
    const healthOn = body.healthCheckYn === true
    if (healthOn) {
      const required = healthRequiredError(body)
      if (required) return required
    }
    const health: HealthValues & { healthCheckYn: boolean } = healthOn
      ? {
          healthCheckYn: true,
          healthCheckInterval: body.healthCheckInterval as number,
          healthCheckTimeout: body.healthCheckTimeout as number,
          healthCheckRetry: body.healthCheckRetry as number,
          healthCheckStartTime: normalizeTime(body.healthCheckStartTime as string),
          healthCheckEndTime: normalizeTime(body.healthCheckEndTime as string),
        }
      : { ...NO_HEALTH_CHECK } // 🔴 꺼짐이면 보낸 헬스체크 값을 버린다 — 실측
    if (healthOn) {
      const invalid = healthValueError(health)
      if (invalid) return invalid
    }
    if (hasSiteNamed(groupSeq, siteName)) return businessError(SITE_DUPLICATE_NAME, 409)

    sites.push({
      siteSeq: nextSiteSeq++,
      siteName,
      groupSeq,
      parentSiteSeq,
      tel: body.tel || null,
      address: body.address || null,
      ...health,
      exceptionTime: [], // 🔴 보내도 버린다(B-52)
      userCount: 0,
      courseCount: 0,
      pointCount: 0,
    })
    return ok(true)
  }),

  http.put(`${SITE_BASE}/UpdateSite`, async ({ request }) => {
    const body = (await request.json()) as Partial<UpdateSiteRequest>
    const target = sites.find((site) => site.siteSeq === body.siteSeq)
    if (!target) return businessError(SITE_NOT_FOUND)
    if (body.siteName === '') return businessError('사업장명을 입력해주세요.')

    const groupSeq = body.groupSeq ?? target.groupSeq
    if (groupSeq !== target.groupSeq) {
      if (!groups.some((group) => group.groupSeq === groupSeq)) return businessError(NOT_FOUND)
      if (target.parentSiteSeq !== null) {
        return businessError('하위 사업장은 관리그룹을 변경할 수 없습니다. 모 사업장을 이동해주세요.')
      }
    }
    const siteName = body.siteName ?? target.siteName
    if (hasSiteNamed(groupSeq, siteName, target.siteSeq)) return businessError(SITE_DUPLICATE_NAME, 409)

    // 🔴 예외시간 — 보낸 목록으로 통째 교체. 없는 `detailSeq` 면 아무것도 바꾸지 않는다
    if (
      body.exceptionTime?.some(
        (row) => row.detailSeq !== 0 && !target.exceptionTime.some((old) => old.detailSeq === row.detailSeq)
      )
    ) {
      return businessError('예외시간 정보가 존재하지 않습니다.')
    }

    // 🔴 생략·null = 유지
    const merged: HealthValues & { healthCheckYn: boolean } = {
      healthCheckYn: body.healthCheckYn ?? target.healthCheckYn,
      healthCheckInterval: body.healthCheckInterval ?? target.healthCheckInterval,
      healthCheckTimeout: body.healthCheckTimeout ?? target.healthCheckTimeout,
      healthCheckRetry: body.healthCheckRetry ?? target.healthCheckRetry,
      healthCheckStartTime:
        body.healthCheckStartTime == null ? target.healthCheckStartTime : normalizeTime(body.healthCheckStartTime),
      healthCheckEndTime:
        body.healthCheckEndTime == null ? target.healthCheckEndTime : normalizeTime(body.healthCheckEndTime),
    }
    // 저장된 값까지 합쳐 검사한다 — 값 없는 사업장에 `healthCheckYn: true` 만 보내면 간격 래퍼(실측).
    // ⚠️ 합친 뒤에도 null 이 남는 경우(재시도·시각)의 실서버 응답은 미실측 — 필수 문자열로 흉내 낸다
    if (merged.healthCheckYn) {
      const invalid = healthValueError(merged) ?? healthRequiredError(merged)
      if (invalid) return invalid
    }

    target.siteName = siteName
    // 🔴 그룹 이동은 하위 사업장도 함께 — 실측
    if (groupSeq !== target.groupSeq) {
      const moved = new Set([target.siteSeq, ...descendantSiteSeqs(target.siteSeq)])
      sites.forEach((site) => {
        if (moved.has(site.siteSeq)) site.groupSeq = groupSeq
      })
    }
    // 🔴 `""` 는 지우기
    if (body.tel != null) target.tel = body.tel === '' ? null : body.tel
    if (body.address != null) target.address = body.address === '' ? null : body.address
    Object.assign(target, merged)
    if (body.exceptionTime) {
      target.exceptionTime = body.exceptionTime.map((row) => ({
        detailSeq: row.detailSeq === 0 ? nextDetailSeq++ : row.detailSeq,
        exceptionStartTime: normalizeTime(row.exceptionStartTime),
        exceptionEndTime: normalizeTime(row.exceptionEndTime),
      }))
    }
    return ok(true)
  }),

  http.delete(`${SITE_BASE}/DeleteSite`, ({ request }) => {
    const param = new URL(request.url).searchParams.get('siteSeq')
    if (param === null) return businessError(BAD_REQUEST)
    const siteSeq = Number(param)
    if (!sites.some((site) => site.siteSeq === siteSeq)) return businessError(SITE_NOT_FOUND)

    // 🔴 하위 사업장까지 함께(B-54)
    const removed = new Set([siteSeq, ...descendantSiteSeqs(siteSeq)])
    sites = sites.filter((site) => !removed.has(site.siteSeq))
    return ok(true)
  }),
]
