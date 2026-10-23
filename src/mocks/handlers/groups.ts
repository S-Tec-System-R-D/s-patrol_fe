import { http, HttpResponse } from 'msw'

import type { GroupNode, SiteNode } from '@/features/auth/types/site'
import type { AddGroupRequest, GroupAdminRow, UpdateGroupRequest } from '@/features/groups/types/group'

/**
 * MSW 관리그룹 핸들러 (`spec 043` T740) — 🔴 **상태를 보유한다.**
 *
 * 경로 · 응답 모양 · 오류 문구는 `api-spec.md` §5-1-B "관리그룹 3종"(실측 2026-10-22) 그대로다.
 * 시드 트리 · 관리자 · 할당도 **실서버 값**이다(실측 2026-10-22 — 목업 이름을 실데이터로 착각한 일이 있어 실측값을 쓴다).
 *
 * 🔴 **그룹은 평면 배열로 들고 트리는 매번 만든다** — `AdminSiteSelect` 가 트리를 주므로 추가·이름변경·삭제가
 * 곧바로 트리에 보인다. 사업장은 그룹에 붙은 `SiteNode` 트리째 들고 있다(그룹을 지우면 같이 사라진다 — B-51).
 *
 * 서버 동작 흉내(실측):
 * - 추가: 깊이 제한 없음(B-49 ①) · 🔴 `parentGroupSeq` 생략 시 200 + 트리에 안 보이는 그룹(B-49 ②)
 * - 수정: 🔴 `userSeq` 생략 = 할당 비우기(B-50) · 없는 `userSeq` 500 · 자기 하위로 이동 400
 * - 삭제: 🔴 자손 그룹 + 사업장 연쇄(B-51)
 */

const BASE = '/api/v1/Group/W/sign'
const ADMIN_SITE_SELECT_PATH = '/api/v1/Login/W/sign/AdminSiteSelect'
const ROOT_GROUP_SEQ = 1

interface StoredGroup {
  groupSeq: number
  groupName: string
  parentGroupSeq: number | null
  sites: SiteNode[]
}

const site = (siteSeq: number, siteName: string, children: SiteNode[] = []): SiteNode => ({
  siteSeq,
  siteName,
  parentSiteSeq: null,
  children: children.map((child) => ({ ...child, parentSiteSeq: siteSeq })),
})

const seedGroups: StoredGroup[] = [
  { groupSeq: 1, groupName: '에스텍시스템', parentGroupSeq: null, sites: [site(1, '강남우체국')] },
  { groupSeq: 2, groupName: '테스트사업장(수정)', parentGroupSeq: 1, sites: [site(2, '테스트사업장')] },
  {
    groupSeq: 3,
    groupName: '강동지사',
    parentGroupSeq: 2,
    sites: [
      site(3, '테테테(수정)1', [site(4, '수정사업장테테')]),
      site(9, '강동지사_추가사업장'),
      site(11, '지가사업장'),
    ],
  },
  {
    groupSeq: 4,
    groupName: 'test',
    parentGroupSeq: 1,
    sites: [
      site(5, '테스트 사업장'),
      site(6, '테스트 사업장2', [site(7, '테스트 사업장2-1'), site(8, '테스트 사업장2-2')]),
    ],
  },
  { groupSeq: 6, groupName: '테스트그룹', parentGroupSeq: 1, sites: [site(12, '수정사업장됨')] },
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
let assignments = new Map<number, number[]>()
/** 실서버 identity 를 흉내 — 시드 최대 seq(6) 다음부터 */
let nextGroupSeq = 7

/**
 * 시드로 되돌린다.
 * 🔴 **테스트 격리에 필요하다** — `server.resetHandlers()` 는 이 상태를 건드리지 않는다.
 */
export const resetGroupStore = (): void => {
  groups = seedGroups.map((group) => ({ ...group }))
  assignments = new Map(Object.entries(seedAssignments).map(([seq, users]) => [Number(seq), [...users]]))
  nextGroupSeq = 7
}
resetGroupStore()

const toNode = (group: StoredGroup, depth: number): GroupNode => ({
  groupSeq: group.groupSeq,
  groupName: group.groupName,
  parentGroupSeq: group.parentGroupSeq,
  layer: depth,
  depth,
  sites: group.sites,
  children: groups
    .filter((child) => child.parentGroupSeq === group.groupSeq)
    .map((child) => toNode(child, depth + 1)),
})

/** 🔴 루트(1)에서 닿는 그룹만 트리에 나온다 — 부모 없이 만든 그룹은 안 보인다(B-49 ②) */
const buildTree = (): GroupNode => {
  const root = groups.find((group) => group.groupSeq === ROOT_GROUP_SEQ)
  if (!root) throw new Error('MSW groups: 루트 그룹이 없다')
  return toNode(root, 0)
}

const descendantSeqs = (groupSeq: number): number[] =>
  groups
    .filter((group) => group.parentGroupSeq === groupSeq)
    .flatMap((child) => [child.groupSeq, ...descendantSeqs(child.groupSeq)])

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const businessError = (message: string, status = 400) =>
  HttpResponse.json({ message, data: false, code: status }, { status })

/** 그룹명 빈 값 — ASP.NET ProblemDetails(실측) */
const groupNameRequired = () =>
  HttpResponse.json(
    {
      errors: { groupName: ['The groupName field is required.'] },
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
    },
    { status: 400 }
  )

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

const DUPLICATE_NAME = '동일한 위치에 같은 이름의 관리그룹이 이미 존재합니다.'
const NOT_FOUND = '관리그룹이 존재하지 않습니다.'

const hasSiblingNamed = (parentGroupSeq: number | null, groupName: string, exceptSeq?: number) =>
  groups.some(
    (group) =>
      group.parentGroupSeq === parentGroupSeq &&
      group.groupName === groupName &&
      group.groupSeq !== exceptSeq
  )

export const groupHandlers = [
  http.get(ADMIN_SITE_SELECT_PATH, () => ok(buildTree())),

  // 🔴 실서버는 500 이다(B-1, 재확인 2026-10-22) — 화면은 쓰지 않는다
  http.get(`${BASE}/GetGroupList`, () => serverError()),

  // 🔴 없는 `groupSeq` 에도 200(전원 false) — 실측
  http.get(`${BASE}/GetGroupAdminList`, ({ request }) => {
    const groupSeq = Number(new URL(request.url).searchParams.get('groupSeq'))
    const included = assignments.get(groupSeq) ?? []
    return ok(ADMINS.map((admin) => ({ ...admin, isInclude: included.includes(admin.userSeq) })))
  }),

  http.post(`${BASE}/AddGroup`, async ({ request }) => {
    const body = (await request.json()) as Partial<AddGroupRequest>
    const groupName = body.groupName ?? ''
    if (groupName === '') return groupNameRequired()

    const parentGroupSeq = body.parentGroupSeq ?? null
    if (parentGroupSeq !== null && !groups.some((group) => group.groupSeq === parentGroupSeq)) {
      return businessError('부모 관리그룹이 존재하지 않습니다.')
    }
    if (hasSiblingNamed(parentGroupSeq, groupName)) return businessError(DUPLICATE_NAME, 409)

    const groupSeq = nextGroupSeq++
    groups.push({ groupSeq, groupName, parentGroupSeq, sites: [] })
    assignments.set(groupSeq, [...(body.userSeq ?? [])])
    return ok(true)
  }),

  http.put(`${BASE}/UpdateGroup`, async ({ request }) => {
    const body = (await request.json()) as Partial<UpdateGroupRequest>
    const target = groups.find((group) => group.groupSeq === body.groupSeq)
    if (!target) return businessError(NOT_FOUND)

    const groupName = body.groupName ?? ''
    if (groupName === '') return groupNameRequired()

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
    removed.forEach((seq) => assignments.delete(seq))
    return ok(true)
  }),
]
