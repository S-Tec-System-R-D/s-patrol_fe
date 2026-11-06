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
    return (
      <div className="flex items-start gap-4 py-2">
        <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
        <span className="min-w-0 flex-1 break-words">{value}</span>
      </div>
    )
  }

  /* 🔴 **행 사이 구분선을 두지 않는다**(사용자 결정 2026-11-06 — 10-19 의 "선 있음" 을 뒤집었다).
     라벨과 값의 정렬 · 행 간격만으로 줄이 읽히고, 선이 많으면 카드가 표처럼 무거워진다.
     🔴 **`py-3` 다**(사용자 결정 2026-10-26, `spec 050`) — `py-1.5` 는 행 사이 12px 라
     브라우저에서 빽빽했다(`py-2.5` 도 거쳐 봤다). 같은 이유로 between 을 쓰는 카드가 함께 넓어진다(코스·지점 기본정보 포함 7곳) */
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      {/* 라벨은 줄지 않는다 — 긴 값이 오면 값 쪽이 접힌다 */}
      <span className="shrink-0 text-body text-muted-foreground">{label}</span>
      {/* 🔴 **긴 값은 칸 안에서 오른쪽 정렬로 접는다**(`spec 050`) — 코스·지점 `설명` 처럼
          자유 입력 값이 들어오면서 생긴 규칙. `min-w-0` 이 없으면 긴 단어가 칸을 밀어낸다 */}
      <span className="min-w-0 break-words text-right text-body font-bold text-foreground tabular-nums">
        {value}
      </span>
    </div>
  )
}

export default AppDetailRow
