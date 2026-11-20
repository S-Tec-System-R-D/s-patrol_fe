import { cva } from 'class-variance-authority'

/**
 * 좁은 폭 **카드 안의 뱃지** 크기 (`spec 034` → `spec 036` 에서 공용 승격).
 *
 * 카드 뱃지는 기본보다 **한 단계 작다**(사용자 지적 2026-10-14). 기본 `AppBadge`
 * (11px·px-2)는 이름과 크기가 비슷해 **이름과 뱃지가 서로 다툰다** — 카드에서 주인공은
 * 이름이고 뱃지는 곁들이는 상태다(`spec 028` 편성 모달에서 같은 판단).
 *
 * 🔴🔴 **`text-label`(폰트 크기 토큰)을 쓰면 안 된다.** `AppBadge` 는
 * `cn(badgeVariants(...), className)` 으로 병합하는데, **`tailwind-merge` 가 `text-label`
 * 을 글자색으로 분류해** variant 의 색(`text-success-foreground` 등)을 **지워 버린다** —
 * 뱃지 글자가 전부 검정이 된다(2026-10-14 실제로 겪었다). 임의값 `text-[10.5px]` 은
 * **폰트 크기로 인식**되어 색과 충돌하지 않는다.
 *
 * 🔴 **네 번째 사본이 생기려 해서 올렸다** — `CourseCard`·`PointCard` 가 같은 상수를
 * 각자 선언했고 `AddCoursePointDialog` 는 문자열을 그대로 적었다. 위 함정 설명이
 * **사본마다 복제돼 있었다** — 그게 제일 위험하다(한쪽만 고쳐지면 나머지가 틀린 설명이 된다).
 */
export const cardBadge = 'text-[11px] leading-4'

export const badgeVariants = cva(
  // 🔄 `spec 083`: 색 바탕 알약 → **아이콘 + 글자**. 색은 아이콘에만 준다(`badgeIconClass`) — 빨강만 글자도 빨강
  'inline-flex w-fit items-center gap-1 text-[12px] whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'text-foreground',
        point: 'text-foreground',
        // 주황을 쓰지 않는다(`spec 083`) — 아이콘 없이 글자만. 쓰는 곳(특이사항 · 순찰제외 · 배치예정)은 084 에서 옮긴다
        warning: 'text-sub-foreground',
        danger: 'font-medium text-danger',
        muted: 'text-foreground',
        // 회차 `미완료` · 지점 `미인증`(`spec 079` D13)
        neutral: 'text-foreground',
        // 아직 차례가 아님(지점 `대기중`) — 미완료(했어야 하는데 안 함)와 아이콘으로 구분한다
        pending: 'text-foreground',
        // 상태가 아닌 **분류 · 설정 값**(권한 · 인증수단 · 교대) — 아이콘 없이 글자만
        plain: 'text-sub-foreground',
        // 분류 값 가운데 눈에 띄어야 하는 것(현장 관리자 · 마스터) — 옅은 회색 칩
        chip: 'rounded-[5px] bg-muted px-1.5 py-0.5 font-medium text-foreground',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  }
)

/** 종류별 아이콘 색 — 글자는 본문색이고 색은 아이콘이 진다 */
export const badgeIconClass: Record<string, string> = {
  success: 'text-success',
  point: 'text-point',
  danger: 'text-danger',
  muted: 'text-muted-foreground',
  neutral: 'text-muted-foreground',
  pending: 'text-muted-foreground',
}
