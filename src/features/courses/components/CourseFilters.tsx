import { RefreshCwIcon, ToggleLeftIcon } from 'lucide-react'

import AppSelect, { type AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 순찰코스 목록 필터 — 사용여부 · 교대 (`spec 023` Phase 2).
 *
 * 🔴 **전부 서버 파라미터로 나간다.** 클라이언트 필터 함수를 만들지 않는다(spec 규칙 8).
 * ✅ **추측이 아니라 실측 위에서 짠다**(T355, 2026-10-11): `useYn`·`switchYn` 각각 1건으로
 * 좁혀지고 **둘을 함께 주면 AND** 다(`useYn=true&switchYn=false` → 0건).
 *
 * 🔴 **`courseStatus` 필터는 넣지 않았다.** 서버가 파라미터를 받지만 **값 체계를 모른다** —
 * 테스트 DB 에 `0`(대기중)만 있고 1·2·3 으로 호출하면 `totalCount: 0` 이다(OQ-3). 고를
 * 수 있는 값이 하나뿐인 필터는 **아무것도 걸러 주지 않으면서 자리만 차지**하고, 추측한
 * 이름을 넣으면 틀린 선택지를 보여준다(A1). 값 체계가 확인되면 추가한다(OQ-023-B).
 *
 * 🔴 **값은 URL 그대로의 문자열**이다. 서버 타입 변환은 `lib/courseListParams.ts`
 * 한 자리에서만 한다.
 *
 * 트리거는 다른 목록 필터와 같은 `AppSelect`(`spec 065` — 옛 `AppFilterPopover` 에서 통일). `전체` 는
 * 값이 아니라 **해제**다 — 화면 경계에서 `undefined` 로 바꾼다(`ALL_VALUE`, 018 규약).
 */

const USE_YN_OPTIONS: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '사용' },
  { value: 'false', label: '미사용' },
]

const SWITCH_YN_OPTIONS: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '허용' },
  { value: 'false', label: '허용 안 함' },
]

const toFilterValue = (value: string) => (value === ALL_VALUE ? undefined : value)

interface CourseFiltersProps {
  useYn?: string
  switchYn?: string
  onChange: (next: { useYn?: string; switchYn?: string }) => void
}

const CourseFilters = ({ useYn, switchYn, onChange }: CourseFiltersProps) => (
  <div className="flex items-center gap-2">
    <AppSelect
      aria-label="사용여부"
      icon={ToggleLeftIcon}
      options={USE_YN_OPTIONS}
      value={useYn ?? ALL_VALUE}
      onChange={(next) => onChange({ useYn: toFilterValue(next) })}
      active={Boolean(useYn)}
      className="w-auto"
    />
    <AppSelect
      aria-label="교대"
      icon={RefreshCwIcon}
      options={SWITCH_YN_OPTIONS}
      value={switchYn ?? ALL_VALUE}
      onChange={(next) => onChange({ switchYn: toFilterValue(next) })}
      active={Boolean(switchYn)}
      className="w-auto"
    />
  </div>
)

export default CourseFilters
