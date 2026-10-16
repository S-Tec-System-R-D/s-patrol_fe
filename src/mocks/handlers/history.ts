import { http, HttpResponse } from 'msw'

import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * MSW 순찰이력 핸들러 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **실 서버의 사업장 7·8 에는 이력이 0건이다**(실측 2026-10-12 — 46건은 사업장 6 에
 * 있고, 현장관리자 `333333` 의 소속은 7·8 이다). 즉 `npm run dev:real` 로는 이 화면을
 * **볼 수 없다.** mock 이 유일한 확인 수단이므로 **실측에서 나온 예외를 전부 심는다.**
 *
 * 🔴🔴 **정상 행만 두면 B단의 설계 근거가 화면에서 사라진다.** 아래 네 가지는 실 서버에서
 * 실제로 관측된 것이고(`api-spec.md` "좌표·순찰 이력 데이터 유무"), 목업 그림에는
 * 하나도 없다:
 * 1. `userList: []` — **근무자 없는 이력**
 * 2. `status: 1 완료` 인데 `checkedCount: 0` — **완료 ≠ 전 지점 인증**
 * 3. `actualElapsedTime: "02:17:40"` — **시 단위**
 * 4. `overtimeYn: true` / `hasMemo: true`
 *
 * 🔴 **`GetPointHistory` 는 여기 없다.** 같은 엔드포인트를 `handlers/points.ts` 가 이미
 * 소유하고 있다(지점 상세의 순찰 로그). 실 서버에는 하나뿐이므로 mock 도 하나여야 한다 —
 * B단에서 여기에 두 번째를 선언했다가 **앞의 것만 동작해 조용히 0건**이 왔다. 코스
 * 상세가 쓰는 `courseSeq`·`status` 필터는 그쪽 핸들러를 **확장**해 넣었다.
 *
 * ⚠️ **기간 필터를 실제로 구현한다.** 전량 반환으로 때우면 `fromDt`/`toDt` 가 쿼리로
 * 나가는지 검증할 수 없다.
 */

const GET_COURSE_HISTORY_PATH = '/api/v1/History/W/sign/GetCourseHistory'

interface MockHistory extends CourseHistoryRow {
  siteSeq: number
}

/** 오늘 기준 n일 전 — 시드를 고정 날짜로 박으면 30일 창을 벗어나 화면에서 사라진다 */
const daysAgo = (days: number, time: string): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return `${date.toISOString().slice(0, 10)}T${time}`
}

const row = (
  overrides: Partial<MockHistory> & Pick<MockHistory, 'historySeq' | 'courseSeq'>
): MockHistory => ({
  siteSeq: 7,
  courseName: 'A동 순찰코스',
  useYn: true,
  startDt: daysAgo(1, '02:40:00'),
  endDt: daysAgo(1, '03:24:00'),
  status: 1,
  statusName: '완료',
  overtimeYn: false,
  pointCount: 3,
  checkedCount: 3,
  pauseTime: '00:00:00',
  actualElapsedTime: '00:44:00',
  hasMemo: false,
  userList: [{ userSeq: 21, userName: '박성민' }],
  ...overrides,
})

/**
 * 코스 1(A동 순찰코스)에 몰아 둔다 — 한 코스에서 네 가지 예외를 **한 화면에** 보려면
 * 흩어 두면 안 된다. 코스 2 는 **기록 1건**, 코스 3·4 는 **0건**(빈 상태 확인용)이다.
 */
const seeds: MockHistory[] = [
  row({ historySeq: 101, courseSeq: 1 }),
  row({
    historySeq: 102,
    courseSeq: 1,
    startDt: daysAgo(2, '23:05:00'),
    endDt: daysAgo(2, '23:51:00'),
    actualElapsedTime: '00:46:00',
  }),
  // 🔴 미인증 1건 — 완료가 아니다
  row({
    historySeq: 103,
    courseSeq: 1,
    startDt: daysAgo(3, '02:38:00'),
    endDt: daysAgo(3, '03:16:00'),
    status: 2,
    statusName: '미완료',
    checkedCount: 2,
    actualElapsedTime: '00:38:00',
    hasMemo: true,
    userList: [{ userSeq: 22, userName: '정우현' }],
  }),
  // 🔴 시 단위 소요 + 초과 — '02:17:40' 을 분으로 읽으면 2분이 된다
  row({
    historySeq: 104,
    courseSeq: 1,
    startDt: daysAgo(5, '10:40:59'),
    endDt: daysAgo(5, '12:58:39'),
    overtimeYn: true,
    actualElapsedTime: '02:17:40',
    hasMemo: true,
    userList: [{ userSeq: 23, userName: '김현수' }],
  }),
  // 🔴 완료인데 인증 0건 — 상태와 인증률이 독립이라는 실측 사례
  row({
    historySeq: 105,
    courseSeq: 1,
    startDt: daysAgo(8, '02:51:00'),
    endDt: daysAgo(8, '03:43:00'),
    checkedCount: 0,
    actualElapsedTime: '00:52:00',
  }),
  // 🔴 근무자 없는 이력 — 아바타·이름을 항상 그릴 수 없다
  row({
    historySeq: 106,
    courseSeq: 1,
    startDt: daysAgo(11, '23:00:00'),
    endDt: daysAgo(11, '23:43:00'),
    status: 2,
    statusName: '미완료',
    checkedCount: 1,
    actualElapsedTime: '00:12:00',
    userList: [],
  }),
  // 🔴 진행 중(`endDt: null`) — `eventType=0` 이 거르는 상태다
  row({
    historySeq: 107,
    courseSeq: 1,
    startDt: daysAgo(0, '09:10:00'),
    endDt: null,
    status: 0,
    statusName: '진행중',
    checkedCount: 1,
    actualElapsedTime: '00:21:00',
  }),
  // 30일 **밖** — 기간 필터가 실제로 거르는지 확인용(화면에 보이면 필터가 안 걸린 것이다)
  row({
    historySeq: 108,
    courseSeq: 1,
    startDt: daysAgo(45, '01:00:00'),
    endDt: daysAgo(45, '01:40:00'),
  }),
  row({
    historySeq: 120,
    courseSeq: 2,
    courseName: 'B동 순찰코스',
    pointCount: 1,
    checkedCount: 1,
    actualElapsedTime: '00:12:00',
  }),
]

/**
 * 🔴 **`siteSeq` 를 응답에서 뺀다.** 저장 모델에는 분기용으로 들고 있지만 **실 응답에는
 * 없다**(실측). 그대로 흘리면 mock 에서만 있는 필드에 화면이 기대게 된다.
 */
const toCourseHistoryRow = (item: MockHistory): CourseHistoryRow => ({
  historySeq: item.historySeq,
  courseSeq: item.courseSeq,
  courseName: item.courseName,
  useYn: item.useYn,
  startDt: item.startDt,
  endDt: item.endDt,
  status: item.status,
  statusName: item.statusName,
  overtimeYn: item.overtimeYn,
  pointCount: item.pointCount,
  checkedCount: item.checkedCount,
  pauseTime: item.pauseTime,
  actualElapsedTime: item.actualElapsedTime,
  hasMemo: item.hasMemo,
  userList: item.userList,
})

/** `yyyy-MM-dd` 구간 필터. 🔴 `toDt` 는 **그 날을 포함**한다(실측) */
const inRange = (dt: string, fromDt: string | null, toDt: string | null): boolean => {
  const day = dt.slice(0, 10)
  if (fromDt && day < fromDt) return false
  if (toDt && day > toDt) return false
  return true
}

/**
 * 🔴 **서버 `pageSize` 상한은 100 이다**(실측 2026-10-14). 넘기면 **400** +
 * `"페이지 사이즈는 1~100 사이여야 합니다."` 가 온다.
 *
 * 🔴 **이 검증이 없어서 결함을 놓쳤다.** `usePointHistory` 가 `pageSize=200` 을 보내
 * **실서버에서는 조회가 통째로 실패**하고 화면에 "순찰 기록이 없습니다" 가 떴는데,
 * mock 이 200 을 받아줘 **dev 에서는 멀쩡해 보였다.** mock 이 서버보다 관대하면
 * 그 차이만큼 결함이 숨는다(022 의 "mock 이 더 엄격해도 거짓" 과 같은 종류의 교훈).
 */
export const MAX_PAGE_SIZE = 100

const paged = <T>(items: T[], query: URLSearchParams) => {
  const pageNumber = Number(query.get('pageNumber') ?? 1)
  const pageSize = Number(query.get('pageSize') ?? 20)
  const start = (pageNumber - 1) * pageSize
  return {
    message: '요청이 정상 처리되었습니다.',
    code: 200,
    data: {
      items: items.slice(start, start + pageSize),
      totalCount: items.length,
      page: pageNumber,
      pageSize,
    },
  }
}

/** 상한 초과면 서버와 같은 400 + 래퍼를 돌려준다 */
const pageSizeError = (query: URLSearchParams) => {
  const pageSize = Number(query.get('pageSize') ?? 20)
  if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return HttpResponse.json(
      { message: '페이지 사이즈는 1~100 사이여야 합니다.', data: null, code: 400 },
      { status: 400 }
    )
  }
  return null
}

export const historyHandlers = [
  http.get(GET_COURSE_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    // 🔴 서버와 같은 순서로 막는다 — 상한 초과는 필터링 전에 400 이다(실측)
    const sizeError = pageSizeError(query)
    if (sizeError) return sizeError

    const siteSeq = Number(query.get('siteSeq'))
    const courseSeq = query.get('courseSeq')
    const eventType = query.get('eventType')

    const filtered = seeds
      .filter((item) => item.siteSeq === siteSeq)
      .filter((item) => (courseSeq === null ? true : item.courseSeq === Number(courseSeq)))
      // `eventType` 은 **코스 상태 필터**다(OQ-5 해소)
      .filter((item) => (eventType === null ? true : item.status === Number(eventType)))
      .filter((item) => inRange(item.startDt, query.get('fromDt'), query.get('toDt')))
      .sort((a, b) => b.startDt.localeCompare(a.startDt))
      .map(toCourseHistoryRow)

    return HttpResponse.json(paged(filtered, query))
  }),
]
