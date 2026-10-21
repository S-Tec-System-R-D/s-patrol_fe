import { http, HttpResponse } from 'msw'

import type { NoticeAttach, NoticeDetail, NoticeRow } from '@/features/notice/types/notice'

/**
 * MSW 공지사항 핸들러 (`spec 026` T574).
 *
 * 시드는 mock 시절 `features/notice/mocks/noticeData.ts` 를 **서버 형태로 옮긴 것**이다
 * (index.ts 머리말 — 버리지 않는다). 원본은 화면 전환 뒤 T589 에서 지웠다.
 *
 * 🔴 **화면이 갈리는 경우를 전부 심는다**: 이미지+파일 / 파일만 / 첨부 없음 / 고정.
 * 정상 행만 두면 "카드가 없을 때" 분기가 dev·캡쳐에서 영영 안 보인다.
 *
 * 🔴 **첨부 URL 은 열리지 않는 주소다** — 실서버도 지금 404 다(B-40). mock 이 이미지를
 * 띄워 주면 폴백이 dev 에서 한 번도 보이지 않는다.
 *
 * ✅ **실측으로 맞췄다**(2026-10-20, T590 — `api-spec.md` §23):
 * - `keyword` 는 **제목 + 본문** 부분일치. 🔴 **작성자는 아니다**(OQ-026-A)
 * - 정렬은 **고정 먼저**, 그 안에서 `createDt` 내림차순 — 필터를 걸어도 같다(OQ-026-B)
 * - 기간은 **`createDt` 날짜 기준, 양 끝 포함**. `from > to` 는 에러 없이 0건(OQ-026-C) *
 * ✅ **쓰기 3종(`spec 040` T664)도 실측으로 맞췄다**(2026-10-21 — `api-spec.md` §5-1-B 공지 3종):
 * - 성공은 `data: true`, 🔴 **ID 를 주지 않는다** · 제목 누락은 **400 ProblemDetails**
 * - 수정은 부분 갱신, `''` 는 무시 · 첨부는 `attachList[i]` — 추가는 **항목당 1파일 + `isRemove=false`**
 * - 이미지/파일 분리는 **확장자** 기준 · 없는 ID 는 400 래퍼
 * - 🔴 **상태를 가진다** — 쓰기가 목록·상세를 바꾼다. 테스트는 `beforeEach` 에서 `resetNoticeStore()`
 */

const GET_NOTICE_LIST_PATH = '/api/v1/Notice/W/sign/GetNoticeList'
const GET_NOTICE_DETAIL_PATH = '/api/v1/Notice/W/sign/DetailNotice'
const ADD_NOTICE_PATH = '/api/v1/Notice/W/sign/AddNotice'
const UPSERT_NOTICE_PATH = '/api/v1/Notice/W/sign/UpsertNotice'
const DELETE_NOTICE_PATH = '/api/v1/Notice/W/sign/DeleteNotice'
/** 서버가 `imageList` 로 보내는 확장자(실측 2026-10-21). 나머지 허용 형식은 `fileList` */
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']
/** 🔴 서버 상한(실측 2026-10-14). 넘기면 400 — mock 이 관대하면 그만큼 결함이 숨는다 */
const MAX_PAGE_SIZE = 100
const ATTACH_BASE = 'http://mock.invalid/UploadedFiles/notices/202605'

const attach = (attachSeq: number, attachName: string): NoticeAttach => {
  const dot = attachName.lastIndexOf('.')
  return {
    attachSeq,
    attachPath: `${ATTACH_BASE}/${attachSeq}${attachName.slice(dot)}`,
    attachName,
    attachExt: attachName.slice(dot),
  }
}

type MockNotice = NoticeDetail & { siteSeq: number }

const seeds: MockNotice[] = [
  {
    siteSeq: 7,
    noticeSeq: 5,
    title: '사업장 출입 보안 수칙',
    description:
      '사업장 출입 시 반드시 출입증을 패용해 주시기 바랍니다.\n\n분실 시 상황실로 즉시 신고해 주세요.',
    userSeq: 101,
    userName: '이현장',
    isPin: true,
    createDt: '2026-04-15T09:00:00',
    imageList: [],
    fileList: [],
  },
  {
    siteSeq: 7,
    noticeSeq: 4,
    title: '6월 정기 순찰 점검 안내',
    description:
      '6월 1일부터 정기 순찰 점검이 시행됩니다.\n\n각 구역 담당 근무자께서는 순찰 코스의 NFC 태그 및 QR 인증 지점이 정상 동작하는지 사전에 확인 부탁드립니다.\n\n이상이 있는 지점은 상황실로 즉시 보고해 주시기 바랍니다.',
    userSeq: 101,
    userName: '이현장',
    isPin: false,
    createDt: '2026-05-28T10:30:00',
    imageList: [attach(41, '점검_구역_안내.jpg'), attach(42, 'NFC_태그_위치.png')],
    fileList: [attach(43, '6월_순찰점검_안내.pdf'), attach(44, '점검표_양식.xlsx')],
  },
  {
    siteSeq: 7,
    noticeSeq: 3,
    title: '5월 순찰 교육 일정 안내',
    description:
      '5월 순찰 근무자 대상 안전 교육 일정을 안내드립니다.\n\n교육 일시: 2026-05-25 14:00\n장소: 지하 1층 교육장\n\n대상자는 사전 등록 부탁드립니다.',
    userSeq: 101,
    userName: '이현장',
    isPin: false,
    createDt: '2026-05-20T14:00:00',
    imageList: [],
    fileList: [attach(31, '5월_교육_일정표.pdf')],
  },
  {
    siteSeq: 7,
    noticeSeq: 2,
    title: '야간 순찰 강화 공지',
    description:
      '최근 야간 시간대 외부인 출입 관련 민원이 접수되어, 22시~06시 순찰을 평소보다 강화합니다.\n\n해당 시간대 근무자께서는 외곽 지점 확인을 빠짐없이 진행해 주시기 바랍니다.',
    userSeq: 102,
    userName: '김관리',
    isPin: false,
    createDt: '2026-05-10T18:20:00',
    imageList: [],
    fileList: [],
  },
  {
    siteSeq: 7,
    noticeSeq: 1,
    title: '시스템 점검 안내',
    description:
      '순찰 앱 시스템 점검이 예정되어 있어 안내드립니다.\n\n점검 일시: 2026-05-02 02:00 ~ 04:00\n점검 시간 동안 앱 접속이 일시 제한될 수 있습니다.',
    userSeq: 101,
    userName: '이현장',
    isPin: false,
    createDt: '2026-04-30T11:00:00',
    imageList: [],
    fileList: [attach(11, '점검_안내문.pdf')],
  },
]

const cloneSeeds = (): MockNotice[] =>
  seeds.map((item) => ({ ...item, imageList: [...item.imageList], fileList: [...item.fileList] }))

/** 모듈 스코프 저장소 — 쓰기 3종이 이 배열을 직접 고친다 */
let store: MockNotice[] = cloneSeeds()
let lastAttachSeq = 1000

/**
 * 저장소를 초기 상태로 되돌린다 — 🔴 테스트 격리용(`resetCourseStore` 선례). `server.resetHandlers()` 는
 * 이 배열을 건드리지 않는다.
 */
export const resetNoticeStore = (): void => {
  store = cloneSeeds()
  lastAttachSeq = 1000
}

const ok = () => HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data: true, code: 200 })

/** 🔴 비즈니스 실패 문구는 전부 이것 하나다(B-17) */
const badRequest = () =>
  HttpResponse.json({ message: '잘못된 요청입니다.', data: false, code: 400 }, { status: 400 })

/** 유효성 실패는 **ProblemDetails**(에러 형태 B — `message` 가 없다) */
const problem = (field: string) =>
  HttpResponse.json(
    {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: { [field]: [`The ${field} field is required.`] },
      traceId: '00-mock-00',
    },
    { status: 400 }
  )

/**
 * 🔴 `instanceof File` 을 쓰지 않는다 — 테스트(jsdom)에서는 요청 본문을 다시 읽은 File 이 **다른 realm**
 * 이라 `instanceof` 가 거짓이 되어 첨부가 조용히 빠진다. 문자열이 아니면 파일이다(FormData 값은 둘뿐).
 */
const isFile = (value: FormDataEntryValue | null): value is File =>
  value !== null && typeof value !== 'string'

/** 확장자로 이미지/파일 배열에 나눠 넣는다 */
const pushAttach = (item: MockNotice, file: File) => {
  lastAttachSeq += 1
  const added = attach(lastAttachSeq, file.name)
  if (IMAGE_EXTS.includes(added.attachExt.toLowerCase())) item.imageList.push(added)
  else item.fileList.push(added)
}

/** `'2026-10-21T09:30:00'` — 타임존 없는 ISO(서버 형식) */
const nowDt = () => new Date().toISOString().slice(0, 19)

const toNoticeRow = (item: MockNotice): NoticeRow => ({
  noticeSeq: item.noticeSeq,
  title: item.title,
  description: item.description,
  userSeq: item.userSeq,
  userName: item.userName,
  isPin: item.isPin,
  createDt: item.createDt,
  attachCount: item.imageList.length + item.fileList.length,
})

/** 🔴 `siteSeq` 를 내리지 않는다 — 실 서버 상세 응답에 없다 */
const toNoticeDetail = (item: MockNotice): NoticeDetail => ({
  noticeSeq: item.noticeSeq,
  title: item.title,
  description: item.description,
  userSeq: item.userSeq,
  userName: item.userName,
  isPin: item.isPin,
  createDt: item.createDt,
  imageList: item.imageList,
  fileList: item.fileList,
})

const inRange = (dt: string, fromDt: string | null, toDt: string | null): boolean => {
  const day = dt.slice(0, 10)
  if (fromDt && day < fromDt) return false
  if (toDt && day > toDt) return false
  return true
}

export const noticeHandlers = [
  http.get(GET_NOTICE_LIST_PATH, ({ request }) => {
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

    const siteSeq = Number(query.get('siteSeq'))
    const keyword = query.get('keyword')
    const filtered = store
      .filter((item) => item.siteSeq === siteSeq)
      .filter((item) =>
        keyword === null ? true : item.title.includes(keyword) || item.description.includes(keyword)
      )
      .filter((item) => inRange(item.createDt, query.get('fromDt'), query.get('toDt')))
      .sort((a, b) => Number(b.isPin) - Number(a.isPin) || b.createDt.localeCompare(a.createDt))
      .map(toNoticeRow)

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

  http.get(GET_NOTICE_DETAIL_PATH, ({ request }) => {
    const noticeSeq = Number(new URL(request.url).searchParams.get('noticeSeq'))
    const found = store.find((item) => item.noticeSeq === noticeSeq)
    // 🔴 없는 공지는 빈 데이터가 아니라 **비즈니스 오류**(에러 형태 A) — 실측 400 + 래퍼(T590)
    if (!found) {
      return HttpResponse.json(
        { message: '잘못된 요청입니다.', data: null, code: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      message: '요청이 정상 처리되었습니다.',
      code: 200,
      data: toNoticeDetail(found),
    })
  }),

  http.post(ADD_NOTICE_PATH, async ({ request }) => {
    const form = await request.formData()
    const title = String(form.get('title') ?? '')
    if (!title) return problem('Title')

    const item: MockNotice = {
      siteSeq: Number(form.get('siteSeq')),
      noticeSeq: Math.max(0, ...store.map((n) => n.noticeSeq)) + 1,
      title,
      description: String(form.get('description') ?? ''),
      userSeq: 101,
      userName: '이현장',
      // 🔴 swagger 는 필수지만 서버는 빠져도 통과시킨다(실측) — 없으면 false
      isPin: form.get('isPin') === 'true',
      createDt: nowDt(),
      imageList: [],
      fileList: [],
    }
    for (const file of form.getAll('file')) {
      if (isFile(file)) pushAttach(item, file)
    }
    store.push(item)
    return ok()
  }),

  http.patch(UPSERT_NOTICE_PATH, async ({ request }) => {
    const form = await request.formData()
    const found = store.find((item) => item.noticeSeq === Number(form.get('noticeSeq')))
    if (!found) return badRequest()

    // 🔴 `''` 는 "변경 없음" 으로 무시된다(비울 수 없다 — 실측)
    const title = form.get('title')
    if (typeof title === 'string' && title) found.title = title
    const description = form.get('description')
    if (typeof description === 'string' && description) found.description = description
    const isPin = form.get('isPin')
    if (isPin === 'true' || isPin === 'false') found.isPin = isPin === 'true'

    const indexes = new Set<number>()
    for (const key of form.keys()) {
      const m = /^attachList\[(\d+)\]\./.exec(key)
      if (m) indexes.add(Number(m[1]))
    }
    for (const i of indexes) {
      const isRemove = form.get(`attachList[${i}].isRemove`)
      const attachSeq = form.get(`attachList[${i}].attachSeq`)
      if (attachSeq === '0') return badRequest()
      if (isRemove === 'true') {
        const seq = Number(attachSeq)
        found.imageList = found.imageList.filter((a) => a.attachSeq !== seq)
        found.fileList = found.fileList.filter((a) => a.attachSeq !== seq)
      } else if (isRemove === 'false') {
        // 🔴 한 항목에 여러 파일을 실어도 **1개만** 붙는다(실측)
        const file = form.get(`attachList[${i}].files`)
        if (isFile(file)) pushAttach(found, file)
      }
      // `isRemove` 가 없으면 서버가 그 항목을 무시한다(실측)
    }
    return ok()
  }),

  http.delete(DELETE_NOTICE_PATH, ({ request }) => {
    const noticeSeq = Number(new URL(request.url).searchParams.get('noticeSeq'))
    if (!store.some((item) => item.noticeSeq === noticeSeq)) return badRequest()
    store = store.filter((item) => item.noticeSeq !== noticeSeq)
    return ok()
  }),
]
