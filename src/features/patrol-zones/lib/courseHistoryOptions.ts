import { ALL_VALUE } from '@/lib/listQuery'
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

/** ✅ **공용으로 올렸다**(`spec 036` T493) — 소비처를 위해 re-export 로 둔다 */
export { ALL_VALUE }

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
