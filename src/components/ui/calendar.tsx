import * as React from "react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

/**
 * react-day-picker v10 래퍼.
 * 기본 스타일시트(`react-day-picker/style.css`)를 불러오지 않고 classNames를 전부 덮어쓴다.
 * 따라서 레이아웃(nav 위치 등)도 여기서 책임진다.
 */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-fit", className)}
      classNames={{
        root: "relative",
        months: "flex flex-col gap-3",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium text-foreground",
        nav: "absolute inset-x-0 top-0 flex h-8 items-center justify-between",
        button_previous:
          "grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
        button_next:
          "grid size-7 place-items-center rounded-md border border-border transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40",
        chevron: "size-4 fill-current",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "grid size-8 place-items-center text-xs font-normal text-muted-foreground",
        week: "flex w-full",
        day: "size-8 p-0 text-center text-sm",
        day_button:
          "grid size-8 place-items-center rounded-md transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        /**
          * 🔴 **범위 배경을 `accent` 에서 `point-bg` 로 바꿨다**(사용자 확인 2026-10-16).
          * `accent` 는 본문 글자색과 명도가 비슷해 **선택한 기간이 구분되지 않았다** —
          * 양 끝은 `selected`(`bg-primary`)로 진하게 칠해지는데 **사이 날짜가 사라져
          * 보여서** "어디부터 어디까지" 를 읽을 수 없었다.
          * 시맨틱은 `point`(강조·선택) 트리오를 쓴다 — `design-system.md` §1-1.
          */
        range_start: "rounded-l-md bg-point-bg",
        /**
          * 🔴 **`!` 가 필요하다**(사용자 확인 2026-10-16 — 색을 바꿨는데도 글자가 흰색이었다).
          * react-day-picker 는 범위의 **사이 날짜에도 `selected` 를 함께 붙인다.** 그래서
          * 위 `selected` 의 `[&>button]:text-primary-foreground`(흰색)와 여기가 **같은
          * 특이도로 충돌**하고, 어느 쪽이 이기는지는 Tailwind 가 CSS 를 찍는 순서에 달려
          * 있어 **흰 글자 + 하늘색 배경**이 됐다(글자가 사라져 보인다).
          * `!` 로 못 박는다 — Tailwind v4 는 **접미사** 형태다.
          */
        range_middle:
          "bg-point-bg [&>button]:bg-transparent! [&>button]:text-point-foreground! [&>button]:hover:bg-point/20",
        range_end: "rounded-r-md bg-point-bg",
        today: "[&>button]:ring-1 [&>button]:ring-border",
        outside: "text-muted-foreground/50",
        disabled: "pointer-events-none opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
