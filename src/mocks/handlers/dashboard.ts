import { format, subDays } from 'date-fns'
import { http, HttpResponse } from 'msw'

import type { PointHistoryRow } from '@/features/course-history/types'
import type { DashboardCourse, TodaySummary } from '@/features/dashboard/types'

/**
 * MSW 대시보드 핸들러 (`spec 068` T1125). 값은 067 고정 데이터(`features/dashboard/mocks`)를 서버 모양으로 옮긴 것이다.
 *
 * 🔴 **어떤 `siteSeq` 로 불러도 같은 값을 준다** — 실서버도 없는 사업장에 200 을 주고(§5-1-D), 사업장별로
 * 나누면 mock 로그인 사업장에 따라 대시보드가 비어 보인다(사용자 결정 2026-11-03).
 * 🔴 **시각은 오늘 날짜로 만든다** — 파일에 날짜를 박으면 다음 날 "오늘" 이 틀어진다.
 * 🔴 **링크 키는 mock 서버에 있는 값이다**: `historySeq` 101~105 · 107(`handlers/history.ts`), 최근 기록
 * `detailSeq` = `pointSeq × 1000`(`handlers/points.ts` `buildHistory` 의 오늘 행). ⚠️ 상세 화면은 그쪽 값을 그린다.
 * 🔴 **화면이 갈리는 경우를 전부 심는다** — 지점 `status` 0·1·3·4 · 교대 · 시간초과 · 멈춤(`pausedYn`) ·
 * 기준 없음(`totalMin 0`) · 미완료이면서 시간초과(두 호출에 겹치는 행).
 */

const GET_TODAY_SUMMARY_PATH = '/api/v1/DashBoard/W/sign/GetTodaySummary'
const GET_DASHBOARD_COURSE_LIST_PATH = '/api/v1/DashBoard/W/sign/GetDashboardCourseList'
const GET_DASHBOARD_POINT_HISTORY_PATH = '/api/v1/DashBoard/W/sign/GetDashboardPointHistory'
/** 🔴 서버 상한 — mock 이 관대하면 그만큼 결함이 숨는다(`handlers/points.ts` 와 같은 판단) */
const MAX_PAGE_SIZE = 100

const ok = (data: unknown) => HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const todayAt = (time: string): string => `${format(new Date(), 'yyyy-MM-dd')}T${time}:00`
const daysAgoAt = (days: number, time: string): string =>
  `${format(subDays(new Date(), days), 'yyyy-MM-dd')}T${time}:00`

const summary: TodaySummary = {
  completedCount: 12,
  incompleteCount: 1,
  overtimeCount: 2,
  pendingAssignmentCount: 2,
  pendingReturnCount: 1,
}

const user = (userSeq: number, userName: string) => ({ userSeq, userName })

/** 지점 사전 그대로 — `4` 완료 · `3` 미완료(건너뜀) · `1` 진행중(다음) · `0` 대기 */
const points = (historySeq: number, names: string[], statuses: number[]) =>
  names.map((pointName, index) => ({
    detailSeq: historySeq * 100 + index + 1,
    pointSeq: historySeq * 10 + index + 1,
    orderNo: index + 1,
    pointName,
    status: statuses[index],
    checkDt: statuses[index] === 4 || statuses[index] === 3 ? todayAt('09:00') : null,
  }))

const courses = (): DashboardCourse[] => [
  {
    historySeq: 107,
    courseSeq: 1,
    courseName: 'A코스',
    startDt: todayAt('09:00'),
    elapsedSec: 18 * 60,
    pausedYn: false,
    totalMin: 30,
    handoverCount: 0,
    users: [user(13, '홍길동')],
    points: points(107, ['정문', '로비', '2층', '3층', '기계실', '옥상'], [4, 4, 4, 4, 1, 0]),
  },
  {
    historySeq: 101,
    courseSeq: 2,
    courseName: 'B코스',
    startDt: todayAt('08:55'),
    elapsedSec: 23 * 60,
    pausedYn: false,
    totalMin: 40,
    handoverCount: 1,
    // 지금 순찰자가 마지막
    users: [user(14, '최근무'), user(15, '김철수')],
    points: points(101, ['주차장', '후문', '창고', '전기실', '옥상'], [4, 4, 3, 4, 1]),
  },
  {
    historySeq: 102,
    courseSeq: 3,
    courseName: '야간코스',
    startDt: todayAt('09:16'),
    elapsedSec: 2 * 60,
    pausedYn: false,
    totalMin: 25,
    handoverCount: 0,
    users: [user(16, '이영희')],
    points: points(102, ['1층', '2층', '3층', '4층'], [1, 0, 0, 0]),
  },
  {
    historySeq: 103,
    courseSeq: 4,
    courseName: 'C코스',
    startDt: todayAt('08:20'),
    elapsedSec: 58 * 60,
    pausedYn: false,
    totalMin: 45,
    handoverCount: 0,
    users: [user(17, '박민수')],
    points: points(
      103,
      ['정문', '로비', '1층 복도', '2층 복도', '3층 복도', '4층 복도', '5층 복도', '옥상', '비상계단', '기계실', '주차장 B1', '후문'],
      [4, 4, 4, 4, 4, 4, 4, 1, 0, 0, 0, 0]
    ),
  },
  {
    // 기준 없음 — 실데이터에 `totalMin 0` 코스가 있다(코스 65)
    historySeq: 104,
    courseSeq: 5,
    courseName: '임시코스',
    startDt: todayAt('09:05'),
    elapsedSec: 12 * 60,
    pausedYn: false,
    totalMin: 0,
    handoverCount: 0,
    users: [user(18, '정순찰')],
    points: points(104, ['정문', '후문', '주차장'], [4, 1, 0]),
  },
  {
    // 교대 요청 중 — 경과가 늘지 않는다
    historySeq: 105,
    courseSeq: 6,
    courseName: 'D코스',
    startDt: todayAt('08:40'),
    elapsedSec: 15 * 60,
    pausedYn: true,
    totalMin: 35,
    handoverCount: 0,
    users: [user(19, '한근무')],
    points: points(105, ['로비', '2층', '3층', '옥상'], [4, 4, 1, 0]),
  },
]

const historyRow = (
  row: Pick<PointHistoryRow, 'detailSeq' | 'checkDt' | 'pointName' | 'courseName' | 'userName' | 'status' | 'overTimeYn' | 'hasMemo'>
): PointHistoryRow => ({
  courseSeq: 1,
  pointSeq: Math.floor(row.detailSeq / 1000),
  userSeq: 100,
  authMethod: row.status === 4 ? 1 : null,
  authMethodName: row.status === 4 ? 'QR' : '',
  statusName: row.status === 4 ? '완료' : '미완료',
  pauseTime: '00:00:00',
  ...row,
})

const historyRows = (): PointHistoryRow[] => [
  historyRow({ detailSeq: 1000, checkDt: todayAt('09:12'), pointName: '3층', courseName: 'A코스', userName: '홍길동', status: 3, overTimeYn: false, hasMemo: true }),
  historyRow({ detailSeq: 2000, checkDt: todayAt('08:47'), pointName: '창고', courseName: 'B코스', userName: '김철수', status: 4, overTimeYn: true, hasMemo: false }),
  // 미완료 + 시간초과 — 두 호출에 다 나온다(화면은 하나로 합친다)
  historyRow({ detailSeq: 4000, checkDt: todayAt('08:41'), pointName: '옥상', courseName: 'C코스', userName: '박민수', status: 3, overTimeYn: true, hasMemo: true }),
  historyRow({ detailSeq: 5000, checkDt: daysAgoAt(1, '22:05'), pointName: '지하 주차장 B1', courseName: '미배정 코스', userName: '김근무', status: 4, overTimeYn: true, hasMemo: false }),
  historyRow({ detailSeq: 7000, checkDt: daysAgoAt(2, '07:52'), pointName: '후문', courseName: 'B코스', userName: '최근무', status: 3, overTimeYn: false, hasMemo: true }),
  historyRow({ detailSeq: 8000, checkDt: daysAgoAt(3, '15:20'), pointName: '정문', courseName: 'A코스', userName: '홍길동', status: 3, overTimeYn: false, hasMemo: false }),
]

/**
 * 실시간 알림(SSE) — `spec 069` T1144. 🔴 **연결만 흉내 낸다**(사용자 결정 2026-11-03): `retry` + `connected`
 * 를 보내고 스트림을 열어 둔다. 이벤트는 보내지 않는다 — 처리는 단위 테스트, 실제 흐름은 실서버 + 앱 순찰로 본다.
 * 경로는 SSE 서버(`VITE_SSE_BASE_URL`)의 것 — mock 에선 비워 같은 출처로 온다.
 */
const SSE_SUBSCRIBE_PATH = '/api/v1/Sse/subscribe'

const sseConnected = () =>
  new HttpResponse(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('retry: 10000\n\nevent: connected\ndata: mock-connection\n\n'))
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
  )

export const dashboardHandlers = [
  http.get(SSE_SUBSCRIBE_PATH, sseConnected),

  http.get(GET_TODAY_SUMMARY_PATH, () => ok(summary)),

  http.get(GET_DASHBOARD_COURSE_LIST_PATH, () => ok(courses())),

  http.get(GET_DASHBOARD_POINT_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)
    if (!Number.isFinite(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      return HttpResponse.json(
        { message: '페이지 사이즈는 1~100 사이여야 합니다.', data: null, code: 400 },
        { status: 400 }
      )
    }

    const status = query.get('status')
    const overTimeYn = query.get('overTimeYn')
    // 둘을 함께 주면 AND(실측)
    const filtered = historyRows()
      .filter((row) => (status === null ? true : row.status === Number(status)))
      .filter((row) => (overTimeYn === null ? true : row.overTimeYn === (overTimeYn === 'true')))
      .sort((a, b) => b.checkDt.localeCompare(a.checkDt))

    const start = (pageNumber - 1) * pageSize
    return ok({
      items: filtered.slice(start, start + pageSize),
      page: pageNumber,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    })
  }),
]
