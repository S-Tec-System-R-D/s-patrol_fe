import { http, HttpResponse } from 'msw'

import type { UserDetail, UserRow } from '@/features/workers/types/user'
import { findMockAdminDetail } from './groups'

/**
 * MSW 근무자 핸들러 (`spec 038` T604).
 *
 * 시드는 mock 시절 `features/workers/mocks/workerData.ts`(목업 8명)를 **서버 형태로 옮긴 것**이다
 * (index.ts 머리말 — 버리지 않는다). 원본은 화면 전환 뒤 T618 에서 지웠다.
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
 * ✅ **실측으로 맞췄다**(2026-10-21, T619 — `api-spec.md` §8·9):
 * - `searchKey` 는 **이름 + 사번** 부분일치. 🔴 연락처는 아니다(OQ-038-A)
 * - 🔴 **원소속 = 배치 온 사람의 소속지**(OQ-038-B): `originSiteSeq` 가 있는 사람은 **그 사업장
 *   소속으로 이 사업장에 배치된 사람**이다 — 이 사업장 목록에 나오고 소속지 목록에는 **안 나온다**.
 *   상세의 `siteSeq`·`siteName` 은 **소속지**를 준다
 * - 없는 `userId` 는 **404** + 래퍼(`code: 404`)
 * - ⚠️ 정렬은 `createDt` 내림차순으로 둔다(실측 순서와 다르지 않았다 — 별도 확인은 안 했다)
 *
 * ✅ **쓰기 3종(`spec 041` T684)도 실측으로 맞췄다**(2026-10-21 — `api-spec.md` §5-1-B 근무자 3종):
 * - 성공은 `data: true`, 🔴 ID 를 주지 않는다 · `codeSeq` 누락은 **500**(B-44) · 사번 누락은 400 ProblemDetails
 * - 사번 중복은 400 래퍼 `"이미 사용중인 아이디입니다."` · 없는 ID 수정·삭제는 400 래퍼
 * - 수정은 부분 갱신, `''` 는 무시 · 삭제 후 상세는 404
 * - 🔴 **입력 형식은 검사하지 않는다**(B-45) — mock 도 막지 않는다. 막는 것은 폼이다
 * - 🔴 **상태를 가진다** — 테스트는 `beforeEach` 에서 `resetUserStore()`
 */

const GET_USER_LIST_PATH = '/api/v1/User/W/sign/UserList'
const GET_USER_DETAIL_PATH = '/api/v1/User/W/sign/UserDetail'
const ADD_USER_PATH = '/api/v1/User/W/sign/AddUser'
const UPDATE_USER_PATH = '/api/v1/User/W/sign/UpdateUser'
const REMOVE_USER_PATH = '/api/v1/User/W/sign/RemoveUser'
/** 🔴 서버 상한(실측 2026-10-14). 넘기면 400 */
const MAX_PAGE_SIZE = 100

const SITE_SEQ = 7
const SITE_NAME = '강동 테크노타워'

type MockUser = UserRow &
  Pick<UserDetail, 'phone' | 'siteSeq' | 'siteName'> & {
    /** 쓰기 mock 이 바꾼다 — 응답에는 내리지 않는다 */
    loginPw?: string
    /** 이 사람이 **목록에 나오는** 사업장. 배치된 사람은 소속지(`siteSeq`)와 다르다(실측) */
    listedSiteSeq: number
  }

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
  listedSiteSeq: SITE_SEQ,
  ...over,
})

const seeds: MockUser[] = [
  worker(101, '김민준', '01023456789', true, '2025-09-12T09:00:00'),
  worker(102, '이서연', '01034567890', false, '2025-09-20T09:00:00'),
  // 🔴 파견 행 — 실측 1행과 같은 모양(Seq 有 + 다른 사업장명). 의미는 OQ-038-B
  worker(103, '오준혁', '01045678901', true, '2026-01-05T09:00:00', {
    originSiteSeq: 12,
    originSiteName: '강서 스퀘어타워',
    // 🔴 상세는 **소속지**를 준다(실측) — 목록에는 이 사업장(7)에 나온다
    siteSeq: 12,
    siteName: '강서 스퀘어타워',
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

const cloneSeeds = (): MockUser[] => seeds.map((item) => ({ ...item }))

/** 모듈 스코프 저장소 — 쓰기 3종이 이 배열을 직접 고친다 */
let store: MockUser[] = cloneSeeds()

/**
 * 비상연락망 후보 트리(`emergency.ts`)가 읽는 현장 사람 — 🔴 읽기 전용 스냅숏(`spec 057` T1018).
 * `siteSeq` = 소속지 · `listedSiteSeq` 가 다르면 배치 중이다.
 */
export const mockFieldUsers = () =>
  store.map(({ userSeq, userName, phone, codeSeq, codeName, siteSeq, siteName, listedSiteSeq }) => ({
    userSeq,
    userName,
    phone,
    codeSeq,
    codeName,
    siteSeq,
    siteName,
    listedSiteSeq,
  }))

/** 저장소를 초기 상태로 — 🔴 테스트 격리용(`resetCourseStore` 선례) */
export const resetUserStore = (): void => {
  store = cloneSeeds()
}

/** 🔴 실서버 시각 형식 — 타임존 없는 ISO */
const nowDt = () => new Date().toISOString().slice(0, 19)

const ok = () => HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })

const badRequest = (message = '잘못된 요청입니다.') =>
  HttpResponse.json({ message, data: false, code: 400 }, { status: 400 })

/** 문자열 필드 — 없거나 `''` 면 null(서버는 `''` 를 "변경 없음" 으로 본다) */
const text = (form: FormData, key: string): string | null => {
  const value = form.get(key)
  return typeof value === 'string' && value !== '' ? value : null
}

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

/** 🔴 실서버 상세 응답에는 `codeSeq`·`createDt` 가 **없다**(OQ-8) — 내리지 않는다. `codeName` 은 생겼다(2026-10-21) */
const toUserDetail = (item: MockUser): UserDetail => ({
  userSeq: item.userSeq,
  loginId: item.loginId,
  userName: item.userName,
  phone: item.phone,
  siteSeq: item.siteSeq,
  siteName: item.siteName,
  workYn: item.workYn,
  deviceType: '0',
  codeName: item.codeName,
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
    const filtered = store
      .filter((item) => item.listedSiteSeq === siteId)
      .filter((item) =>
        searchKey === null
          ? true
          : item.userName.includes(searchKey) || item.loginId.includes(searchKey)
      )
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
    const found = store.find((item) => item.userSeq === userId)
    // 본사 관리자는 그룹 핸들러가 들고 있다(`spec 045` T819 — 한 출처)
    const admin = found ? null : findMockAdminDetail(userId)
    if (admin) {
      return HttpResponse.json({ message: '요청이 정상 처리되었습니다.', code: 200, data: admin })
    }
    if (!found) {
      return HttpResponse.json(
        { message: '사용자를 찾을 수 없습니다.', data: null, code: 404 },
        { status: 404 }
      )
    }
    return HttpResponse.json({
      message: '요청이 정상 처리되었습니다.',
      code: 200,
      data: toUserDetail(found),
    })
  }),

  http.post(ADD_USER_PATH, async ({ request }) => {
    const form = await request.formData()
    const loginId = text(form, 'loginId')
    if (!loginId) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
          title: 'One or more validation errors occurred.',
          status: 400,
          errors: { loginId: ['The loginId field is required.'] },
          traceId: '00-mock-00',
        },
        { status: 400 }
      )
    }
    // 🔴 `codeSeq` 를 빼면 **500** 이다 — swagger 는 선택이라 적혀 있다(B-44)
    const codeSeq = Number(text(form, 'codeSeq'))
    if (!codeSeq) {
      return HttpResponse.json(
        {
          type: 'https://tools.ietf.org/html/rfc9110#section-15.6.1',
          title: 'An error occurred while processing your request.',
          status: 500,
          detail: '서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.',
          traceId: '00-mock-00',
        },
        { status: 500 }
      )
    }
    if (store.some((item) => item.loginId === loginId)) return badRequest('이미 사용중인 아이디입니다.')

    const siteSeq = Number(text(form, 'siteSeq'))
    store.push({
      userSeq: Math.max(0, ...store.map((item) => item.userSeq)) + 1,
      userName: text(form, 'name') ?? '',
      loginId,
      loginPw: text(form, 'loginPw') ?? '',
      codeSeq,
      codeName: codeSeq === 6 ? '현장 관리자' : '현장 근무자',
      originSiteSeq: null,
      originSiteName: SITE_NAME,
      workYn: false,
      createDt: nowDt(),
      // 🔴 보낸 그대로 저장한다 — 서버가 정규화하지 않는다(B-45)
      phone: text(form, 'phone') ?? '',
      siteSeq,
      siteName: SITE_NAME,
      listedSiteSeq: siteSeq,
    })
    return ok()
  }),

  // 🔴 `PATCH` 가 아니라 `POST` 다(실측)
  http.post(UPDATE_USER_PATH, async ({ request }) => {
    const form = await request.formData()
    const found = store.find((item) => item.userSeq === Number(form.get('userSeq')))
    if (!found) return badRequest()
    // `''` 는 무시된다 — 비울 수 없다(실측)
    found.userName = text(form, 'name') ?? found.userName
    found.phone = text(form, 'phone') ?? found.phone
    found.loginPw = text(form, 'loginPw') ?? found.loginPw
    return ok()
  }),

  http.delete(REMOVE_USER_PATH, ({ request }) => {
    const userSeq = Number(new URL(request.url).searchParams.get('userSeq'))
    if (!store.some((item) => item.userSeq === userSeq)) return badRequest()
    store = store.filter((item) => item.userSeq !== userSeq)
    return ok()
  }),
]
