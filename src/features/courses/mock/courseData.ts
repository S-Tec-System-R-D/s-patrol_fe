/**
 * 코스 mock 시드 (`spec 023` T348).
 *
 * MSW 핸들러(`src/mocks/handlers/courses.ts`)가 이 배열을 저장소 초기값으로 쓴다.
 *
 * 🔴 **정상 코스만 두지 않는다.** 전부 "지점 있고 사용 중이고 순찰 기록 있는" 코스면
 * ① 지점 0개 빈 상태 ② 미사용 행 톤다운 ③ "순찰 기록 없음" 을 **화면에서 한 번도 볼 수
 * 없다.** 022 가 mock 에 미사용 지점·미순찰 지점을 심어 둔 것과 같은 이유다.
 *
 * 🔴 **지점 핸들러와 어긋나지 않게 맞췄다.** `handlers/points.ts` 의 `COURSES_OF` 가
 * "지점 1·2 → 코스 1 / 지점 3 → 코스 1·2" 로 고정돼 있어, 여기서 다른 편성을 주면
 * 지점 목록의 `usedCount` 와 코스의 `pointCount` 가 **서로 다른 말을 한다.** 그래서
 * 편성이 있는 코스는 1·2 둘뿐이고 나머지는 지점 0개다.
 * ⚠️ 편성 편집(`spec 023` T367)이 들어오면 둘을 **한 출처에서 뽑도록** 바꿔야 한다 —
 * 그때까지는 이 주석이 유일한 안전장치다.
 *
 * 사업장 배분은 지점과 같은 규칙이다(지점 1~10 → 사업장 7 / 11~15 → 8).
 */

/** 핸들러 내부 저장 모델의 편성 지점 1건 */
export interface MockCoursePoint {
  coursePointSeq: number
  pointSeq: number
  orderNo: number
  memo: string | null
  courseMin: number
  /** 🔴 응답에는 있지만 `UpdateCourse` 로는 바꿀 수 없다(B-29) */
  useYn: boolean
}

/** 핸들러 내부 저장 모델. 서버 응답에 없는 `siteSeq` 도 분기용으로 들고 있는다 */
export interface MockCourse {
  siteSeq: number
  courseSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number
  /** `CourseRow` 전용. 상세 응답에는 없다 */
  courseStatusCode: number
  /** 🔴 이력이 없으면 `history` 자체가 `null` 이다 */
  hasHistory: boolean
  points: MockCoursePoint[]
}

export const courseSeeds: MockCourse[] = [
  {
    siteSeq: 7,
    courseSeq: 1,
    courseName: 'A동 순찰코스',
    memo: 'A동 1층~지하 주차장 순찰. 야간 2회.',
    useYn: true,
    switchYn: true,
    totalMin: 45,
    courseStatusCode: 0,
    hasHistory: true,
    points: [
      { coursePointSeq: 101, pointSeq: 1, orderNo: 1, memo: '정문 확인', courseMin: 10, useYn: true },
      { coursePointSeq: 102, pointSeq: 2, orderNo: 2, memo: null, courseMin: 15, useYn: true },
      { coursePointSeq: 103, pointSeq: 3, orderNo: 3, memo: null, courseMin: 20, useYn: false },
    ],
  },
  {
    siteSeq: 7,
    courseSeq: 2,
    courseName: 'B동 순찰코스',
    memo: null, // 설명 없는 코스 — 상세의 null 처리를 눈으로 본다
    useYn: true,
    switchYn: false,
    totalMin: 20,
    courseStatusCode: 0,
    hasHistory: true,
    points: [
      { coursePointSeq: 201, pointSeq: 3, orderNo: 1, memo: null, courseMin: 20, useYn: true },
    ],
  },
  {
    // 🔴 지점 0개 — 상세의 빈 상태("준비 중" 아님)와 목록의 `지점 0개` 를 보려고
    siteSeq: 7,
    courseSeq: 3,
    courseName: '옥상 점검 코스',
    memo: '지점 편성 전. 의도적으로 비워 둔 코스다.',
    useYn: true,
    switchYn: false,
    totalMin: 0,
    courseStatusCode: 0,
    hasHistory: false,
    points: [],
  },
  {
    // 🔴 미사용 코스 — 목록 행 톤다운을 보려고. 🔴 지점이 0개인데 **비활성은 별개 이유**다
    siteSeq: 7,
    courseSeq: 4,
    courseName: '구 주차장 코스(미사용)',
    memo: '주차장 공사로 중단.',
    useYn: false,
    switchYn: false,
    totalMin: 30,
    courseStatusCode: 0,
    hasHistory: true,
    points: [],
  },
  {
    // 🔴 순찰 기록 없음 — `history: null` 경로
    siteSeq: 8,
    courseSeq: 5,
    courseName: '외벽 순회 코스',
    memo: '신규 등록. 아직 순찰 전.',
    useYn: true,
    switchYn: true,
    totalMin: 25,
    courseStatusCode: 0,
    hasHistory: false,
    points: [],
  },
]
