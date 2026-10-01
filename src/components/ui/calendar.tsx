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
        range_start: "rounded-l-md bg-accent",
        range_middle:
          "bg-accent [&>button]:bg-transparent [&>button]:text-accent-foreground [&>button]:hover:bg-muted",
        range_end: "rounded-r-md bg-accent",
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
