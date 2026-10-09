import { SmartphoneIcon, ToggleLeftIcon } from 'lucide-react'

import AppFilterPopover from '@/components/app/AppFilterPopover'

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
 */

/** 🔴 `authMethod` 는 **정수**다(9=QR / 10=NFC, `api-spec.md` §4). URL 에도 그 값을 쓴다 */
const AUTH_METHOD_OPTIONS = [
  { value: '9', label: 'QR' },
  { value: '10', label: 'NFC' },
]

const USE_YN_OPTIONS = [
  { value: 'true', label: '사용' },
  { value: 'false', label: '미사용' },
]

interface PointFiltersProps {
  authMethod?: string
  useYn?: string
  onChange: (next: { authMethod?: string; useYn?: string }) => void
}

const PointFilters = ({ authMethod, useYn, onChange }: PointFiltersProps) => (
  <div className="flex items-center gap-2">
    <AppFilterPopover
      label="인증수단"
      icon={SmartphoneIcon}
      options={AUTH_METHOD_OPTIONS}
      value={authMethod}
      onChange={(next) => onChange({ authMethod: next })}
    />
    <AppFilterPopover
      label="사용여부"
      icon={ToggleLeftIcon}
      options={USE_YN_OPTIONS}
      value={useYn}
      onChange={(next) => onChange({ useYn: next })}
    />
  </div>
)

export default PointFilters
