import { http, HttpResponse } from 'msw'

import type { NoticeAttach, NoticeDetail, NoticeRow } from '@/features/notice/types/notice'

/**
 * MSW 공지사항 핸들러 (`spec 026` T574).
 *
 * 시드는 구 `features/notice/mocks/noticeData.ts` 를 **서버 형태로 옮긴 것**이다(index.ts
 * 머리말 — 버리지 않는다). 구 파일은 화면 전환 뒤 T589 에서 지운다.
 *
 * 🔴 **화면이 갈리는 경우를 전부 심는다**: 이미지+파일 / 파일만 / 첨부 없음 / 고정.
 * 정상 행만 두면 "카드가 없을 때" 분기가 dev·캡쳐에서 영영 안 보인다.
 *
 * 🔴 **첨부 URL 은 열리지 않는 주소다** — 실서버도 지금 404 다(B-40). mock 이 이미지를
 * 띄워 주면 폴백이 dev 에서 한 번도 보이지 않는다.
 *
 * ⚠️ **가정 2개**(T590 에서 실측으로 교정한다):
 * - `keyword` 는 **제목 부분일치**(OQ-026-A)
 * - 기간은 **`createDt` 기준**(OQ-026-C)
 * - 정렬은 `createDt` 내림차순만 — 고정 공지를 **위로 올리지 않는다**(OQ-026-B, 서버 동작 미확인)
 */

const GET_NOTICE_LIST_PATH = '/api/v1/Notice/W/sign/GetNoticeList'
const GET_NOTICE_DETAIL_PATH = '/api/v1/Notice/W/sign/DetailNotice'
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
    const filtered = seeds
      .filter((item) => item.siteSeq === siteSeq)
      .filter((item) => (keyword === null ? true : item.title.includes(keyword)))
      .filter((item) => inRange(item.createDt, query.get('fromDt'), query.get('toDt')))
      .sort((a, b) => b.createDt.localeCompare(a.createDt))
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
    const found = seeds.find((item) => item.noticeSeq === noticeSeq)
    // 🔴 없는 공지는 빈 데이터가 아니라 **비즈니스 오류**(에러 형태 A)로 둔다 — 이력 상세와
    //    같은 가정이다. ⚠️ 공지의 실제 응답은 미실측(T590 에서 함께 본다)
    if (!found) {
      return HttpResponse.json(
        { message: '해당 공지사항을 찾을 수 없습니다.', data: null, code: 400 },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      message: '요청이 정상 처리되었습니다.',
      code: 200,
      data: toNoticeDetail(found),
    })
  }),
]
