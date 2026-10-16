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
export const cardBadge = 'px-1.5 py-0.5 text-[10.5px] leading-4'

export const badgeVariants = cva(
  'inline-flex w-fit items-center rounded-sm px-2 py-1 text-badge font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        success: 'bg-success-bg text-success-foreground',
        point: 'bg-point-bg text-point-foreground',
        warning: 'bg-warning-bg text-warning-foreground',
        danger: 'bg-danger-bg text-danger-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  }
)
