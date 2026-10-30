import { SmartphoneIcon, ToggleLeftIcon } from 'lucide-react'

import AppSelect, { type AppSelectOption } from '@/components/app/AppSelect'
import { ALL_VALUE } from '@/lib/listQuery'

/**
 * 순찰지점 목록 필터 — 인증수단 · 사용여부 (`spec 027` Phase 4, 022 US5 이월).
 *
 * 🔴 **전부 서버 파라미터로 나간다.** 클라이언트 필터 함수를 만들지 않는다
 * (`spec 022` 규칙 8). 018 이 `filterCourseHistory.ts` 로 그 길을 갔다가 확정 폐기했다.
 *
 * ✅ **추측이 아니라 실측 위에서 짠다** — Phase 8 R2 에서 서버가 실제로 거르는 것을
 * 확인했다: `authMethod=9`→4건 / `=10`→11건 / `useYn=false`→0건.
 *
 * 🔴 **값은 URL 그대로의 문자열**이다. 서버 타입(정수·불리언) 변환은
 * `lib/pointListParams.ts` 한 자리에서만 한다 — 여기서 바꾸면 변환이 두 군데가 된다.
 *
 * 트리거는 다른 목록 필터와 같은 `AppSelect`(`spec 065` — 옛 `AppFilterPopover` 에서 통일). `전체` 는
 * 값이 아니라 **해제**다 — 화면 경계에서 `undefined` 로 바꾼다(`ALL_VALUE`, 018 규약).
 */

/** 🔴 `authMethod` 는 **정수**다(9=QR / 10=NFC, `api-spec.md` §4). URL 에도 그 값을 쓴다 */
const AUTH_METHOD_OPTIONS: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: '9', label: 'QR' },
  { value: '10', label: 'NFC' },
]

const USE_YN_OPTIONS: AppSelectOption[] = [
  { value: ALL_VALUE, label: '전체' },
  { value: 'true', label: '사용' },
  { value: 'false', label: '미사용' },
]

const toFilterValue = (value: string) => (value === ALL_VALUE ? undefined : value)

interface PointFiltersProps {
  authMethod?: string
  useYn?: string
  onChange: (next: { authMethod?: string; useYn?: string }) => void
}

const PointFilters = ({ authMethod, useYn, onChange }: PointFiltersProps) => (
  <div className="flex items-center gap-2">
    <AppSelect
      aria-label="인증수단"
      icon={SmartphoneIcon}
      options={AUTH_METHOD_OPTIONS}
      value={authMethod ?? ALL_VALUE}
      onChange={(next) => onChange({ authMethod: toFilterValue(next) })}
      active={Boolean(authMethod)}
      className="w-auto"
    />
    <AppSelect
      aria-label="사용여부"
      icon={ToggleLeftIcon}
      options={USE_YN_OPTIONS}
      value={useYn ?? ALL_VALUE}
      onChange={(next) => onChange({ useYn: toFilterValue(next) })}
      active={Boolean(useYn)}
      className="w-auto"
    />
  </div>
)

export default PointFilters
