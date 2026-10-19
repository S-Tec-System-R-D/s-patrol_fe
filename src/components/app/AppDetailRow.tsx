import type { ReactNode } from 'react'

/**
 * 상세 정보 1행. **배치가 두 갈래**다 (`spec 023` Phase 5, T373에서 통합).
 *
 * | variant | 배치 | 쓰는 곳 |
 * |---|---|---|
 * | `between` (기본) | 라벨 ↔ 값 양끝 정렬, 값은 굵게·`tabular-nums` | **좁은 곳** — 사이드 패널·모달·요약 카드 |
 * | `fixed` | 라벨 고정폭(6rem) 왼쪽 + 값 바로 옆 | **넓은 곳** — 전체 폭 상세 페이지 |
 *
 * 🔴 **`between` 을 전체 폭 페이지에서 쓰면 안 된다.** 027이 실제 렌더로 확인했다 —
 * 라벨과 값 사이가 580px(2단)~940px(1단)까지 벌어져 **눈이 따라가지 못한다**. 라벨을
 * 고정폭으로 왼쪽에 붙이면 폭이 아무리 넓어져도 **거리가 일정**하다(페이지 최대 폭을
 * 제한하지 않고도 해결된다).
 *
 * 🔴 **합친 이유**: `features/points/DetailRow`(027)와 `features/courses/CourseInfo`
 * 안의 `InfoRow`(023)가 **클래스 문자열까지 같은** 행을 각자 들고 있었다. 세 번째가
 * 나오기 전에 합친다 — 027이 "괜찮으면 통합" 으로 남겨 둔 판단이다(사용자 결정 2026-10-08).
 */

interface AppDetailRowProps {
  label: string
  /** `ReactNode` 다 — 인증수단처럼 뱃지를 넣는 행이 있다 */
  value: ReactNode
  variant?: 'between' | 'fixed'
}

const AppDetailRow = ({ label, value, variant = 'between' }: AppDetailRowProps) => {
  if (variant === 'fixed') {
    /* ⚠️ **`last:border-0`** (사용자 결정 2026-10-19) — 마지막 행은 선을 그리지 않는다.
       코스·지점 상세 모두 **마지막 행이 컨테이너의 마지막 자식**이라(뒤에 아무것도 없다)
       선이 받칠 것 없이 떠 있었다. `between` 과 같은 규칙이 됐다 */
    return (
      <div className="flex items-start gap-4 border-b py-2 last:border-0">
        <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
        <span className="min-w-0 flex-1 break-words">{value}</span>
      </div>
    )
  }

  /* 🔴 **`border-b` 를 둔다**(사용자 결정 2026-10-19). 전에는 `fixed` 에만 있어서
     **구분선 유무가 variant 마다 갈려 있었다** — 배치가 다른 것은 폭 때문에 근거가
     있지만(위 표), 구분선 유무는 근거가 없는 차이였다. 이제 **두 variant 가 같은 규칙**이다:
     행 사이에 선, **마지막 행은 선 없음**(`last:border-0`).
     ⚠️ 이력(8행)·근무자(5행)·공지(2행) 세 화면이 함께 바뀐다. 이력만 예외로 두면
     variant 나 prop 이 또 늘어난다(A6). */
  return (
    <div className="flex items-center justify-between gap-4 border-b py-1.5 text-sm last:border-0">
      <span className="text-body text-muted-foreground">{label}</span>
      <span className="text-body font-bold text-foreground tabular-nums">{value}</span>
    </div>
  )
}

export default AppDetailRow
