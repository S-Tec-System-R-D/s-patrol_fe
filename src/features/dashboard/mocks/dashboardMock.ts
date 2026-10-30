import { format, subDays } from 'date-fns'

import type {
  ActiveCourse,
  RecentIssueRow,
  DashboardKpi,
  DashboardNoticeRow,
} from '../types'

/**
 * 대시보드 **고정 데이터** — `spec 067`(API 없음, UI 만).
 *
 * 🔴 **시각은 오늘 날짜로 만든다.** 파일에 날짜를 박으면 다음 날 "오늘" 이 틀어진다.
 * 🔴 **링크 키는 mock 서버에 있는 값이다** — 눌렀을 때 빈 화면이 나오지 않게:
 * `historySeq` 101~103 · 107(`handlers/history.ts`), `detailSeq` = `pointSeq × 1000`(오늘 미완료 행,
 * `handlers/points.ts` `buildHistory`), `noticeSeq` 3~5(`handlers/notices.ts`).
 * ⚠️ 상세 화면은 mock 서버 값을 그리므로 이름 · 시각이 여기와 다를 수 있다.
 */

const todayAt = (time: string): string => `${format(new Date(), 'yyyy-MM-dd')}T${time}:00`

/** n일 전 — 최근 미완료 · 시간초과는 오늘만이 아니다 */
const daysAgoAt = (days: number, time: string): string =>
  `${format(subDays(new Date(), days), 'yyyy-MM-dd')}T${time}:00`

const points = (names: string[], checked: number[]) =>
  names.map((pointName, index) => ({
    orderNo: index + 1,
    pointName,
    checked: checked[index] === 1,
  }))

export const dashboardKpiMock: DashboardKpi = {
  completedToday: 12,
  incompleteToday: 1,
  overtimeToday: 2,
  pendingDeployments: 2,
}

export const activeCoursesMock: ActiveCourse[] = [
  {
    historySeq: 107,
    courseName: 'A코스',
    userName: '홍길동',
    swapped: false,
    startDt: todayAt('09:00'),
    elapsedMin: 18,
    standardMin: 30,
    points: points(['정문', '로비', '2층', '3층', '기계실', '옥상'], [1, 1, 1, 1, 0, 0]),
  },
  {
    historySeq: 101,
    courseName: 'B코스',
    userName: '김철수',
    swapped: true,
    startDt: todayAt('08:55'),
    elapsedMin: 23,
    standardMin: 40,
    points: points(['주차장', '후문', '창고', '전기실', '옥상'], [1, 1, 0, 1, 0]),
  },
  {
    historySeq: 102,
    courseName: '야간코스',
    userName: '이영희',
    swapped: false,
    startDt: todayAt('09:16'),
    elapsedMin: 2,
    standardMin: 25,
    points: points(['1층', '2층', '3층', '4층'], [0, 0, 0, 0]),
  },
  {
    historySeq: 103,
    courseName: 'C코스',
    userName: '박민수',
    swapped: false,
    startDt: todayAt('08:20'),
    elapsedMin: 58,
    standardMin: 45,
    points: points(
      [
        '정문',
        '로비',
        '1층 복도',
        '2층 복도',
        '3층 복도',
        '4층 복도',
        '5층 복도',
        '옥상',
        '비상계단',
        '기계실',
        '주차장 B1',
        '후문',
      ],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0]
    ),
  },
]

export const recentIssuesMock: RecentIssueRow[] = [
  {
    detailSeq: 1000,
    checkDt: todayAt('09:12'),
    pointName: '3층',
    courseName: 'A코스',
    userName: '홍길동',
    status: 3,
    overtimeYn: false,
    hasMemo: true,
  },
  {
    detailSeq: 2000,
    checkDt: todayAt('08:47'),
    pointName: '창고',
    courseName: 'B코스',
    userName: '김철수',
    status: 4,
    overtimeYn: true,
    hasMemo: false,
  },
  {
    detailSeq: 4000,
    checkDt: todayAt('08:41'),
    pointName: '옥상',
    courseName: 'C코스',
    userName: '박민수',
    status: 3,
    overtimeYn: true,
    hasMemo: true,
  },
  {
    detailSeq: 5000,
    checkDt: daysAgoAt(1, '22:05'),
    pointName: '지하 주차장 B1',
    courseName: '미배정 코스',
    userName: '김근무',
    status: 4,
    overtimeYn: true,
    hasMemo: false,
  },
  {
    detailSeq: 7000,
    checkDt: daysAgoAt(2, '07:52'),
    pointName: '후문',
    courseName: 'B코스',
    userName: '최근무',
    status: 3,
    overtimeYn: false,
    hasMemo: true,
  },
]

export const dashboardNoticesMock: DashboardNoticeRow[] = [
  { noticeSeq: 5, title: '사업장 출입 보안 수칙', createDt: '2026-04-15T09:00:00', isPin: true },
  { noticeSeq: 4, title: '6월 정기 순찰 점검 안내', createDt: '2026-05-28T10:30:00', isPin: false },
  { noticeSeq: 3, title: '5월 순찰 교육 일정 안내', createDt: '2026-05-20T14:00:00', isPin: false },
]
