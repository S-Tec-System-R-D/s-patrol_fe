import { format, subDays } from 'date-fns'

import type { CheckDetailRow, CourseHistoryRow, HandOverRow } from '@/features/course-history/types'

/**
 * 근무자 상세(`spec 079`)용 **박지우(104)의 회차** — 시안 `개선안/근무자` 의 데이터를 옮겼다.
 *
 * 🔴 **`userName` 을 건 조회에만 섞는다.** 다른 화면(코스 이력 목록 · 대시보드 최근 종료)의 시드 건수를
 * 바꾸지 않으려는 것이다 — 그 화면들의 테스트가 건수를 센다.
 *
 * 🔴 동명이인(110 박지우) 회차를 하나 둔다 — 서버 `userName` 은 부분 일치라 함께 온다. 화면이
 * `userList` 의 `userSeq` 로 걸러야 한다(D4).
 */

const ME = { userSeq: 104, userName: '박지우' }
const SAME_NAME = { userSeq: 110, userName: '박지우' }
const SEO = { userSeq: 102, userName: '이서연' }
const KIM = { userSeq: 101, userName: '김민준' }

type Who = { userSeq: number; userName: string }

const COURSES = {
  a: {
    courseSeq: 31,
    courseName: '지하 주차장 코스',
    points: [
      ['B1 출입구', 9],
      ['B1 램프', 9],
      ['B2 기계실', 10],
      ['B2 비상계단', 9],
    ],
  },
  b: {
    courseSeq: 32,
    courseName: '본관 외곽 코스',
    points: [
      ['정문', 10],
      ['주차 차단기', 9],
      ['후문', 10],
      ['쓰레기 집하장', 9],
      ['옥상 출입문', 10],
    ],
  },
} as const

interface RunSpec {
  historySeq: number
  ago: number
  start: string // 'HH:mm'
  course: keyof typeof COURSES
  /** 지점별 인증(1) / 미완료(0) */
  checks: number[]
  minutes: number
  overtime?: boolean
  memos?: Record<number, [string, number]>
  /** `at` = 교대가 일어난 지점(0부터) · `in` = 내가 받음 / `out` = 내가 넘김 */
  handover?: { at: number; other: Who; dir: 'in' | 'out' }
  by?: Who
}

const SPECS: RunSpec[] = [
  { historySeq: 7901, ago: 0, start: '14:28', course: 'a', checks: [1, 1, 0, 1], minutes: 12, overtime: true, memos: { 1: ['램프 차단기 작동 불량, 시설팀 전달', 2] } },
  { historySeq: 7902, ago: 0, start: '09:28', course: 'a', checks: [1, 1, 1, 0], minutes: 9 },
  { historySeq: 7903, ago: 3, start: '09:37', course: 'b', checks: [1, 1, 1, 1, 1], minutes: 18, handover: { at: 2, other: SEO, dir: 'in' } },
  { historySeq: 7904, ago: 6, start: '09:46', course: 'b', checks: [1, 1, 1, 1, 1], minutes: 22, overtime: true, memos: { 3: ['집하장 문 잠김 해제 상태, 잠금 조치', 1] } },
  { historySeq: 7905, ago: 9, start: '14:55', course: 'a', checks: [1, 1, 1, 1], minutes: 8 },
  { historySeq: 7906, ago: 9, start: '09:55', course: 'b', checks: [1, 1, 1, 0, 1], minutes: 19, handover: { at: 2, other: KIM, dir: 'out' } },
  { historySeq: 7907, ago: 12, start: '09:04', course: 'a', checks: [1, 0, 0, 1], minutes: 7 },
  { historySeq: 7908, ago: 13, start: '09:13', course: 'b', checks: [1, 1, 1, 1, 1], minutes: 23, overtime: true },
  // 동명이인 — 화면에 나오면 안 된다
  { historySeq: 7909, ago: 2, start: '10:00', course: 'a', checks: [1, 1, 1, 1], minutes: 9, by: SAME_NAME },
]

const at = (ago: number, minutesOfDay: number): string => {
  const hh = String(Math.floor(minutesOfDay / 60)).padStart(2, '0')
  const mm = String(minutesOfDay % 60).padStart(2, '0')
  return `${format(subDays(new Date(), ago), 'yyyy-MM-dd')}T${hh}:${mm}:00`
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** 지점 j 를 처리한 사람 */
const ownerOf = (spec: RunSpec, j: number): Who => {
  const me = spec.by ?? ME
  if (!spec.handover) return me
  const before = spec.handover.dir === 'in' ? spec.handover.other : me
  const after = spec.handover.dir === 'in' ? me : spec.handover.other
  return j < spec.handover.at ? before : after
}

const lastChecked = (checks: number[]) => checks.lastIndexOf(1)

const buildChecks = (spec: RunSpec): CheckDetailRow[] => {
  const course = COURSES[spec.course]
  const start = toMinutes(spec.start)
  const step = Math.max(1, Math.floor(spec.minutes / course.points.length))
  return course.points.map(([pointName, authMethod], j) => {
    const done = spec.checks[j] === 1
    // 077 규칙 — 마지막 인증 뒤 남은 지점은 시각 없음(미인증) · 중간에 빠진 지점은 시각 있음 — 화면은 둘 다 미인증(D8)
    const trailing = !done && j > lastChecked(spec.checks)
    const owner = ownerOf(spec, j)
    const memo = spec.memos?.[j]
    return {
      detailSeq: spec.historySeq * 10 + j,
      pointSeq: course.courseSeq * 10 + j,
      pointName,
      status: done ? 4 : 3,
      checkDt: trailing ? null : at(spec.ago, start + j * step),
      authMethod: done ? authMethod : null,
      checkUserSeq: done ? owner.userSeq : null,
      userName: done ? owner.userName : null,
      orderNo: j + 1,
      gpsLat: done ? 37.4936 : null,
      gpsLng: done ? 127.0286 : null,
      overtimeYn: done ? false : null,
      memos: memo
        ? [
            {
              memoSeq: spec.historySeq * 10 + j,
              memo: memo[0],
              attaches: Array.from({ length: memo[1] }, (_, n) => ({
                attachSeq: spec.historySeq * 100 + n,
                // 🔴 실 서버와 같은 모양이고 똑같이 404 다(B-40)
                imagePath: `http://123.2.156.148:5231/UploadedFiles/patrols/202611/${spec.historySeq}-${n}.jpg`,
                fileName: `${spec.historySeq}-${n}.jpg`,
                fileExt: '.jpg',
              })),
            },
          ]
        : [],
    }
  })
}

const buildRow = (spec: RunSpec): CourseHistoryRow => {
  const course = COURSES[spec.course]
  const start = toMinutes(spec.start)
  const checked = spec.checks.filter(Boolean).length
  const complete = checked === spec.checks.length
  // 🔴 `userList` 는 **지점을 처리한 사람만**(api-spec §5-1-D) — 처리 순서대로 중복 없이
  const users: Who[] = []
  spec.checks.forEach((done, j) => {
    const owner = ownerOf(spec, j)
    if (done && !users.some((u) => u.userSeq === owner.userSeq)) users.push(owner)
  })
  return {
    historySeq: spec.historySeq,
    courseSeq: course.courseSeq,
    courseName: course.courseName,
    useYn: true,
    startDt: at(spec.ago, start),
    endDt: at(spec.ago, start + spec.minutes),
    status: complete ? 1 : 2,
    statusName: complete ? '완료' : '미완료',
    overtimeYn: spec.overtime ?? false,
    pointCount: spec.checks.length,
    checkedCount: checked,
    pauseTime: '00:00:00',
    actualElapsedTime: `00:${String(spec.minutes).padStart(2, '0')}:00`,
    hasMemo: spec.memos !== undefined,
    userList: users,
  }
}

const buildHandOvers = (spec: RunSpec): HandOverRow[] => {
  if (!spec.handover) return []
  const me = spec.by ?? ME
  const [from, to] = spec.handover.dir === 'in' ? [spec.handover.other, me] : [me, spec.handover.other]
  return [
    {
      fromUserSeq: from.userSeq,
      fromUserName: from.userName,
      toUserSeq: to.userSeq,
      toUserName: to.userName,
      lastOrderNo: spec.handover.at,
      nextOrderNo: spec.handover.at + 1,
    },
  ]
}

/** `siteSeq` 7 에만 있다 — 다른 사업장으로 바꾸면 기록이 없다(선택 사업장 기준) */
export const WORKER_RUN_SITE = 7

/** 렌더 시점의 오늘 기준으로 만든다 — 모듈 로드 때 고정하면 자정을 넘긴 dev 서버에서 하루 밀린다 */
export const workerRunRows = (): CourseHistoryRow[] => SPECS.map(buildRow)

export const workerRunChecks = (historySeq: number): CheckDetailRow[] | undefined => {
  const spec = SPECS.find((item) => item.historySeq === historySeq)
  return spec ? buildChecks(spec) : undefined
}

export const workerRunHandOvers = (historySeq: number): HandOverRow[] | undefined => {
  const spec = SPECS.find((item) => item.historySeq === historySeq)
  return spec ? buildHandOvers(spec) : undefined
}
