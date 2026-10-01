import type { AppSelectOption } from '@/components/app/AppSelect'
import { patrolResultBadge } from '@/features/patrol-zones/components/ZoneColumn'
import type {
  PatrolResultType,
  ZonePatrolType,
} from '@/pages/service/patrol/zones/PatrolZonesPage'

/**
 * 코스 순찰이력 필터의 선택지.
 *
 * - 결과 라벨은 `patrolResultBadge`를 단일 출처로 삼는다 — 뱃지와 필터에 라벨을 두 번 쓰지 않도록.
 * - 코스는 목 데이터에서 유도한다(별도 목록 API 없음, spec §2).
 */

/**
 * "전체"의 값. Radix Select는 `SelectItem`에 빈 문자열을 허용하지 않아
 * (빈 문자열은 선택 해제용으로 예약) 센티넬 값을 쓴다.
 * URL에는 쓰지 않는다 — 화면 경계에서 `undefined`로 바꿔 키를 지운다.
 */
export const ALL_VALUE = 'ALL'

const allOption: AppSelectOption = { value: ALL_VALUE, label: '전체' }

export const isCourseResult = (value: string): value is PatrolResultType =>
  Object.hasOwn(patrolResultBadge, value)

export const courseOptions = (rows: ZonePatrolType[]): AppSelectOption[] => [
  allOption,
  ...[...new Set(rows.map((row) => row.name))].map((name) => ({ value: name, label: name })),
]

export const courseResultOptions: AppSelectOption[] = [
  allOption,
  ...Object.entries(patrolResultBadge).map(([value, { label }]) => ({ value, label })),
]
