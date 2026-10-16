import type { AppSelectOption } from '@/components/app/AppSelect'
import { courseResultBadge } from '@/features/course-history/lib/historyBadge'
import { COURSE_HISTORY_STATUS } from '@/features/course-history/types'
import type { CourseRow } from '@/features/courses/types'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 코스 순찰이력 필터의 선택지 (`spec 036` T505).
 *
 * 🔴 **`lib/courseHistoryOptions.ts` 를 대체한다.** 이전 판은 코스 목록을 **mock 배열에서
 * 유도**했고(`courseOptions(rows)`) 결과 라벨을 mock 뱃지 맵에서 가져왔다 — 둘 다 서버
 * 전환으로 성립하지 않는다.
 *
 * 🔴 **결과 라벨은 `historyBadge` 를 단일 출처로 삼는다** — 뱃지와 필터에 같은 문구를 두 번
 * 쓰면 한쪽만 고쳐진다(018 이 세운 규약을 승계).
 */

const allOption: AppSelectOption = { value: ALL_VALUE, label: '전체' }

/**
 * 코스 선택지 — **서버 목록**에서 만든다.
 *
 * 🔴 **값은 `courseSeq`(문자열화)다.** 이전 판은 **코스명**을 값으로 썼는데, 서버 필터는
 * `courseSeq` 를 받고 이름은 중복될 수 있다(실측에 같은 이름 코스가 있다).
 *
 * ⚠️ **옵션은 최대 100개다** — `pageSize` 상한이 100 이라 한 번에 그만큼만 받는다
 * (`OQ-036-F`). 사업장 코스가 100개를 넘으면 뒤가 잘린다.
 */
export const courseFilterOptions = (courses: CourseRow[]): AppSelectOption[] => [
  allOption,
  ...courses.map((course) => ({
    value: String(course.courseSeq),
    label: course.courseName,
  })),
]

/**
 * 결과 선택지 — **코스 사전**(`eventType`: 0 진행중 / 1 완료 / 2 미완료).
 *
 * ⚠️ **`시간초과` 는 여기 없다.** `overtimeYn` 은 `status` 와 독립 축이고 **서버에 그
 * 필터가 없다**(B-34 에서 요청을 철회했다 — 거를 화면이 없었다). 목록에는 뱃지로 **보이지만**
 * 거를 수는 없다. 거르고 싶어지면 그때 요청한다.
 */
export const resultFilterOptions: AppSelectOption[] = [
  allOption,
  ...[
    COURSE_HISTORY_STATUS.IN_PROGRESS,
    COURSE_HISTORY_STATUS.COMPLETED,
    COURSE_HISTORY_STATUS.INCOMPLETE,
  ].map((status) => ({
    value: String(status),
    label: courseResultBadge(status).label,
  })),
]
