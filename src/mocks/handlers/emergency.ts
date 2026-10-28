import { http, HttpResponse } from 'msw'

import type {
  EmergencyAssignRequest,
  EmergencyDay,
  EmergencyTreeMember,
  EmergencyTreeNode,
  EmergencyUser,
} from '@/features/emergency/types/emergency'
import { mockGroupSnapshot } from './groups'
import { mockFieldUsers } from './users'

/**
 * MSW 비상연락망 핸들러 (`spec 057` T1018) — 🔴 **상태를 보유한다.** 경로 · 응답 · 문구는 `api-spec.md` §5-1-C(실측 2026-10-27).
 *
 * 후보 트리는 **그룹 저장소(관리자 · 할당 · 그룹 · 사업장)와 근무자 저장소를 읽어 매번 만든다**(한 출처).
 * 두 저장소가 서로를 import 하므로 이 파일을 따로 둔다 — 비상연락망 상태는 여기만 고친다.
 *
 * 서버 동작 흉내(실측):
 * - `GetEmergency`: 항상 7요일 · 🔴 없는 사업장도 200 + 빈 7요일
 * - `AddEmergency`: 🔴 같은 등록 반복은 200 · 중복 없음 · 소문자 요일도 받는다 · 잘못된 요일 / 없는 사업장 / 없는 사람 400
 * - `DeleteEmergency`: 미등록 400 · `day` 생략 ProblemDetails
 * - 트리: `ROOT`(전체 담당) · `GROUP`(직접 할당 매니저) · `SITE`(소속 현장 사람) · `UNASSIGNED`(할당 없는 매니저가 있을 때만)
 */

const BASE = '/api/v1/Emergency/W/sign'
const DAYS: EmergencyDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const BAD_DAY = '요일이 올바르지 않습니다. (MON, TUE, WED, THU, FRI, SAT, SUN)'

/** 시드 — 사업장 3(강동지사 · 테테테(수정)1): 월 = 매니저 6 · 토 = 마스터 3 */
const seed: Record<number, Partial<Record<EmergencyDay, number[]>>> = { 3: { MON: [6], SAT: [3] } }

let week = new Map<number, Map<EmergencyDay, number[]>>()

/** 🔴 테스트 격리용 — `server.resetHandlers()` 는 이 상태를 건드리지 않는다 */
export const resetEmergencyStore = (): void => {
  week = new Map(
    Object.entries(seed).map(([siteSeq, days]) => [
      Number(siteSeq),
      new Map(
        Object.entries(days).map(([day, users]) => [day as EmergencyDay, [...(users ?? [])]])
      ),
    ])
  )
}
resetEmergencyStore()

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })
const businessError = (message: string) =>
  HttpResponse.json({ message, data: false, code: 400 }, { status: 400 })
const fieldRequired = (field: string) =>
  HttpResponse.json(
    {
      errors: { [field]: [`The ${field} field is required.`] },
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      traceId: '00-mock-emergency-00',
    },
    { status: 400 }
  )

const toDay = (value: string | null | undefined): EmergencyDay | null => {
  const upper = value?.toUpperCase()
  return DAYS.find((day) => day === upper) ?? null
}

/** 관리자 + 현장 사람 — `userSeq` 로 찾는다 */
const findPerson = (userSeq: number): EmergencyUser | null => {
  const admin = mockGroupSnapshot().admins.find((candidate) => candidate.userSeq === userSeq)
  if (admin)
    return {
      userSeq,
      userName: admin.userName,
      phone: admin.phone,
      codeSeq: admin.codeSeq,
      codeName: admin.codeName,
    }
  const field = mockFieldUsers().find((candidate) => candidate.userSeq === userSeq)
  if (field)
    return {
      userSeq,
      userName: field.userName,
      phone: field.phone,
      codeSeq: field.codeSeq,
      codeName: field.codeName,
    }
  return null
}

const NOT_ASSIGNED = {
  assignmentYn: false,
  assignmentType: null,
  assignedSiteSeq: null,
  assignedSiteName: null,
}

const buildTree = (): EmergencyTreeNode[] => {
  const { groups, sites, admins } = mockGroupSnapshot()
  const fields = mockFieldUsers()
  const siteName = (siteSeq: number) =>
    sites.find((site) => site.siteSeq === siteSeq)?.siteName ?? null

  const adminMember = (admin: (typeof admins)[number]): EmergencyTreeMember => ({
    userSeq: admin.userSeq,
    userName: admin.userName,
    phone: admin.phone,
    codeSeq: admin.codeSeq,
    codeName: admin.codeName,
    ...NOT_ASSIGNED,
  })

  // 🔴 배치 중 = 목록에 나오는 사업장이 소속지와 다르다(근무자 MSW 규칙)
  const fieldMember = (field: (typeof fields)[number]): EmergencyTreeMember => {
    const assigned = field.listedSiteSeq !== field.siteSeq
    return {
      userSeq: field.userSeq,
      userName: field.userName,
      phone: field.phone,
      codeSeq: field.codeSeq,
      codeName: field.codeName,
      assignmentYn: assigned,
      assignmentType: null,
      assignedSiteSeq: assigned ? field.listedSiteSeq : null,
      assignedSiteName: assigned ? siteName(field.listedSiteSeq) : null,
    }
  }

  const siteNode = (site: (typeof sites)[number]): EmergencyTreeNode => ({
    nodeType: 'SITE',
    nodeSeq: site.siteSeq,
    name: site.siteName,
    members: fields.filter((field) => field.siteSeq === site.siteSeq).map(fieldMember),
    children: sites.filter((child) => child.parentSiteSeq === site.siteSeq).map(siteNode),
  })

  const groupNode = (group: (typeof groups)[number]): EmergencyTreeNode => ({
    nodeType: 'GROUP',
    nodeSeq: group.groupSeq,
    name: group.groupName,
    members: admins
      .filter((admin) => !admin.allGroupYn && admin.groupSeqs.includes(group.groupSeq))
      .map(adminMember),
    children: [
      ...groups.filter((child) => child.parentGroupSeq === group.groupSeq).map(groupNode),
      ...sites
        .filter((site) => site.groupSeq === group.groupSeq && site.parentSiteSeq === null)
        .map(siteNode),
    ],
  })

  const root = groups.find((group) => group.parentGroupSeq === null)
  const unassigned = admins.filter((admin) => !admin.allGroupYn && admin.groupSeqs.length === 0)
  return [
    {
      nodeType: 'ROOT',
      nodeSeq: null,
      name: '전체 관리자',
      members: admins.filter((admin) => admin.allGroupYn).map(adminMember),
      children: [],
    },
    ...(root ? [groupNode(root)] : []),
    // 실측에서 이름은 확인하지 못했다(목록 순서도) — mock 표기
    ...(unassigned.length > 0
      ? [
          {
            nodeType: 'UNASSIGNED' as const,
            nodeSeq: null,
            name: '미지정',
            members: unassigned.map(adminMember),
            children: [],
          },
        ]
      : []),
  ]
}

const siteExists = (siteSeq: number) =>
  mockGroupSnapshot().sites.some((site) => site.siteSeq === siteSeq)

export const emergencyHandlers = [
  http.get(`${BASE}/GetEmergency`, ({ request }) => {
    const siteSeq = Number(new URL(request.url).searchParams.get('siteSeq'))
    const days = week.get(siteSeq)
    return ok(
      DAYS.map((day) => ({
        day,
        users: (days?.get(day) ?? []).flatMap((userSeq) => findPerson(userSeq) ?? []),
      }))
    )
  }),

  http.get(`${BASE}/GetEmergencyUserTree`, () => ok(buildTree())),

  http.post(`${BASE}/AddEmergency`, async ({ request }) => {
    const body = (await request.json()) as Partial<Record<keyof EmergencyAssignRequest, unknown>>
    if (!body.day) return fieldRequired('day')
    const day = toDay(String(body.day))
    if (!day) return businessError(BAD_DAY)
    const siteSeq = Number(body.siteSeq)
    if (!siteExists(siteSeq)) return businessError('사업장이 존재하지 않습니다.')
    const userSeq = Number(body.userSeq)
    if (!findPerson(userSeq)) return businessError('담당자가 존재하지 않습니다.')

    const days = week.get(siteSeq) ?? new Map<EmergencyDay, number[]>()
    week.set(siteSeq, days)
    const users = days.get(day) ?? []
    if (!users.includes(userSeq)) days.set(day, [...users, userSeq])
    return ok(true)
  }),

  http.delete(`${BASE}/DeleteEmergency`, ({ request }) => {
    const query = new URL(request.url).searchParams
    if (!query.get('day')) return fieldRequired('day')
    const day = toDay(query.get('day'))
    if (!day) return businessError(BAD_DAY)
    const siteSeq = Number(query.get('siteSeq'))
    const userSeq = Number(query.get('userSeq'))
    const users = week.get(siteSeq)?.get(day) ?? []
    if (!users.includes(userSeq)) return businessError('등록된 비상연락망 담당자가 아닙니다.')
    week.get(siteSeq)?.set(
      day,
      users.filter((seq) => seq !== userSeq)
    )
    return ok(true)
  }),
]
