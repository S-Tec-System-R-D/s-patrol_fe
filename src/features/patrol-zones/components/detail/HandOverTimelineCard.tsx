import { RepeatIcon } from 'lucide-react'

import AppDetailCard from '@/components/app/AppDetailCard'
import { handOverSegments } from '@/features/course-history/lib/handOverSegments'
import type { CheckDetailRow, HandOverRow } from '@/features/course-history/types'

/**
 * 회차의 교대 이력 타임라인 (`spec 070`, 사용자 결정 2026-11-04). 몇 명이 교대할지 몰라 `순찰 정보` 줄이 아니라
 * 그 아래 카드로 둔다. 구조는 HeroUI Timeline 을 참고했다 — 왼쪽 레일(번호 + 선) · 오른쪽 내용. 패키지는 쓰지 않는다.
 *
 * 🔴 **사람과 사건을 나눈다** — 사람 줄은 `이름 · 담당 구간`, 교대는 사람 사이 선 옆에 적는다.
 * 🔴 **교대 시각은 적지 않는다** — 어느 응답에도 없다(실측 2026-11-05). 인증 시각으로 짐작하지 않는다.
 */

interface HandOverTimelineCardProps {
  rows: HandOverRow[]
  checks: CheckDetailRow[]
}

const HandOverTimelineCard = ({ rows, checks }: HandOverTimelineCardProps) => {
  const segments = handOverSegments(rows, checks)

  return (
    <AppDetailCard title="교대 이력">
      <ol aria-label="교대 이력">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1
          return (
            <li key={index} className="flex gap-2.5">
              <div className="flex shrink-0 flex-col items-center">
                <span className="grid size-6 place-items-center rounded-full border border-point/30 bg-point-bg text-label leading-none font-semibold text-point tabular-nums">
                  {index + 1}
                </span>
                {!isLast && <span aria-hidden className="my-1 w-px flex-1 bg-border" />}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-3'}`}>
                <div className="flex min-h-6 items-center justify-between gap-3">
                  <span className="min-w-0 text-body font-medium break-keep text-foreground">{segment.name}</span>
                  <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
                    {segment.range ?? '처리한 지점 없음'}
                  </span>
                </div>
                {!isLast && (
                  <p className="mt-1.5 flex items-center gap-1 text-caption text-muted-foreground tabular-nums">
                    <RepeatIcon size={12} strokeWidth={2} className="shrink-0" />
                    {segment.handOverAfter === null ? '교대' : `${segment.handOverAfter}번 지점 후 교대`}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </AppDetailCard>
  )
}

export default HandOverTimelineCard
