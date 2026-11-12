import { format } from 'date-fns'
import { http, HttpResponse } from 'msw'

import type { DashboardCourse, TodaySummary } from '@/features/dashboard/types'

/**
 * MSW 대시보드 핸들러 (`spec 068` T1125). 값은 067 고정 데이터(`features/dashboard/mocks`)를 서버 모양으로 옮긴 것이다.
 *
 * 🔴 **어떤 `siteSeq` 로 불러도 같은 값을 준다** — 실서버도 없는 사업장에 200 을 주고(§5-1-D), 사업장별로
 * 나누면 mock 로그인 사업장에 따라 대시보드가 비어 보인다(사용자 결정 2026-11-03).
 * 🔴 **시각은 오늘 날짜로 만든다** — 파일에 날짜를 박으면 다음 날 "오늘" 이 틀어진다.
 * 🔴 **링크 키는 mock 서버에 있는 값이다**: `historySeq` 101~105 · 107(`handlers/history.ts`). ⚠️ 상세 화면은 그쪽 값을 그린다.
 * 최근 기록은 `GetCourseHistory`(`handlers/history.ts` 오늘 행)에서 고른다(`spec 073`).
 * 🔴 **화면이 갈리는 경우를 전부 심는다** — 지점 `status` 0·1·3·4 · 교대 · 시간초과 · 멈춤(`pausedYn`) ·
 * 기준 없음(`totalMin 0`).
 */

const GET_TODAY_SUMMARY_PATH = '/api/v1/DashBoard/W/sign/GetTodaySummary'
const GET_DASHBOARD_COURSE_LIST_PATH = '/api/v1/DashBoard/W/sign/GetDashboardCourseList'

const ok = (data: unknown) => HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

const todayAt = (time: string): string => `${format(new Date(), 'yyyy-MM-dd')}T${time}:00`

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
]
