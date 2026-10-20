import { http, HttpResponse } from 'msw'

import type { UserDetail, UserRow } from '@/features/workers/types/user'

/**
 * MSW 근무자 핸들러 (`spec 038` T604).
 *
 * 시드는 mock 시절 `features/workers/mocks/workerData.ts`(목업 8명)를 **서버 형태로 옮긴 것**이다
 * (index.ts 머리말 — 버리지 않는다). 원본은 화면 전환 뒤 T618 에서 지운다.
 *
 * 🔴 **화면이 갈리는 경우를 전부 심는다**: 관리자 행(`codeSeq 6`) · 근무 종료 행 · 파견 행
 * (`originSiteSeq` 有). 실서버 사업장 6 에 실제로 있는 모양이다(재실측 2026-10-21).
 *
 * 🔴 **현장관리자에게 403 을 흉내 내지 않는다** — mock 은 화면을 만들고 보는 수단이라 403 을
 * 기본으로 두면 dev·캡쳐에서 화면이 영영 안 보인다. 403 분기는 **테스트가 `server.use` 로** 본다.
 *
 * 🔴 **파라미터는 서버 이름**이다 — `siteId`(≠ `siteSeq`) · 상세 `userId`(≠ `userSeq`)(B-12).
 * mock 이 우리 이름을 받아 주면 그 불일치를 코드가 영원히 모른다.
 *
 * ⚠️ **가정**(T619 에서 실측으로 교정한다):
 * - `searchKey` 는 **이름 부분일치**(OQ-038-A)
 * - 정렬은 `createDt` 내림차순
 * - 없는 `userId` 는 400 + 래퍼(026 공지 상세 실측과 같은 형태로 둔다)
 */

const GET_USER_LIST_PATH = '/api/v1/User/W/sign/UserList'
const GET_USER_DETAIL_PATH = '/api/v1/User/W/sign/UserDetail'
/** 🔴 서버 상한(실측 2026-10-14). 넘기면 400 */
const MAX_PAGE_SIZE = 100

const SITE_SEQ = 7
const SITE_NAME = '강동 테크노타워'

type MockUser = UserRow & Pick<UserDetail, 'phone' | 'siteSeq' | 'siteName'>

const worker = (
  userSeq: number,
  userName: string,
  phone: string,
  workYn: boolean,
  createDt: string,
  over: Partial<MockUser> = {}
): MockUser => ({
  userSeq,
  userName,
  loginId: String(240000 + userSeq),
  codeSeq: 7,
  codeName: '현장 근무자',
  // 실측: 소속 그대로인 사람은 Seq null + 이름 = 현재 사업장명
  originSiteSeq: null,
  originSiteName: SITE_NAME,
  workYn,
  createDt,
  phone,
  siteSeq: SITE_SEQ,
  siteName: SITE_NAME,
  ...over,
})

const seeds: MockUser[] = [
  worker(101, '김민준', '01023456789', true, '2025-09-12T09:00:00'),
  worker(102, '이서연', '01034567890', false, '2025-09-20T09:00:00'),
  // 🔴 파견 행 — 실측 1행과 같은 모양(Seq 有 + 다른 사업장명). 의미는 OQ-038-B
  worker(103, '오준혁', '01045678901', true, '2026-01-05T09:00:00', {
    originSiteSeq: 12,
    originSiteName: '강서 스퀘어타워',
  }),
  worker(104, '박지우', '01056789012', true, '2025-11-02T09:00:00'),
  worker(105, '정하은', '01067890123', false, '2025-08-15T09:00:00'),
  worker(106, '강도현', '01078901234', true, '2025-12-10T09:00:00'),
  worker(107, '윤서아', '01089012345', true, '2026-02-18T09:00:00'),
  worker(108, '임태양', '01090123456', false, '2025-10-01T09:00:00'),
  // 🔴 관리자 행 — `UserList` 는 권한 구분 없이 사업장 사람을 준다(실측)
  worker(109, '홍관리', '01011112222', true, '2025-07-01T09:00:00', {
    codeSeq: 6,
    codeName: '현장 관리자',
  }),
]

const toUserRow = (item: MockUser): UserRow => ({
  userSeq: item.userSeq,
  userName: item.userName,
  loginId: item.loginId,
  codeSeq: item.codeSeq,
  codeName: item.codeName,
  originSiteSeq: item.originSiteSeq,
  originSiteName: item.originSiteName,
  workYn: item.workYn,
  createDt: item.createDt,
})

/** 🔴 실서버 상세 응답에는 `codeSeq`·`codeName`·`createDt` 가 **없다**(OQ-8) — 내리지 않는다 */
const toUserDetail = (item: MockUser): UserDetail => ({
  userSeq: item.userSeq,
  loginId: item.loginId,
  userName: item.userName,
  phone: item.phone,
  siteSeq: item.siteSeq,
  siteName: item.siteName,
  workYn: item.workYn,
  deviceType: '0',
  fcmToken: false,
  voipToken: false,
  imagePath: null,
  imageName: null,
  imageExt: null,
})

export const userHandlers = [
  http.get(GET_USER_LIST_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    // 🔴 서버와 같은 순서로 막는다 — 상한 초과는 필터링 전에 400 이다(실측)
    if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return HttpResponse.json(
        { message: '페이지 사이즈는 1~100 사이여야 합니다.', data: null, code: 400 },
        { status: 400 }
      )
    }

    const siteId = Number(query.get('siteId'))
    const searchKey = query.get('searchKey')
    const codeSeq = query.get('codeSeq')
    const workYn = query.get('workYn')
    const filtered = seeds
      .filter((item) => item.siteSeq === siteId)
      .filter((item) => (searchKey === null ? true : item.userName.includes(searchKey)))
      .filter((item) => (codeSeq === null ? true : item.codeSeq === Number(codeSeq)))
      .filter((item) => (workYn === null ? true : String(item.workYn) === workYn))
      .sort((a, b) => b.createDt.localeCompare(a.createDt))
      .map(toUserRow)

    const start = (pageNumber - 1) * pageSize
    return HttpResponse.json({
      message: '요청이 정상 처리되었습니다.',
      code: 200,
      data: {
        items: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
        page: pageNumber,
        pageSize,
      },
    })
  }),

  http.get(GET_USER_DETAIL_PATH, ({ request }) => {
    const userId = Number(new URL(request.url).searchParams.get('userId'))
    const found = seeds.find((item) => item.userSeq === userId)
    if (!found) {
      return HttpResponse.json(
        { message: '잘못된 요청입니다.', data: null, code: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      message: '요청이 정상 처리되었습니다.',
      code: 200,
      data: toUserDetail(found),
    })
  }),
]
