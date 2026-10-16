import { ChevronRightIcon, MapPinIcon, MessageSquareTextIcon, RouteIcon, UserIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as CARD_BADGE } from '@/components/app/AppBadge.variants'
import { courseResultBadge, overtimeBadge } from '@/features/course-history/lib/historyBadge'
import { formatElapsed } from '@/features/course-history/lib/elapsed'
import type { CourseHistoryRow } from '@/features/course-history/types'

/**
 * 코스 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 036` T503-E — 목업 "반응형카드" 반영).
 *
 * 🔴 **`spec 034` 의 카드 골격을 그대로 쓴다**: `타일 + [이름 + 작은 뱃지] + 지표 줄 + 꺾쇠`.
 * 목업 2종 중 **1안**(이름 + 사람·지표)을 기준으로 삼았다 — 2안(좌측 시각축 + 지점 점
 * 다이어그램)은 **데이터로 받칠 수 없다**: 지점별 상태는 `CheckDetails(historySeq)` 에만
 * 있어 목록에서 그리려면 **행마다 추가 요청**이고, 개수만으로 점을 찍으면 **점 위치가
 * 순서를 암시**하는데 어느 지점이 빠졌는지는 모른다 — 그리면 거짓말이 된다(023 의
 * "인증률에 색을 입히지 않는다" 와 같은 자리). 2안의 `순찰제외` 뱃지도 **지점 사전**이라
 * 코스 카드에 올 수 없다(B-7).
 *
 * 🔴 **아바타가 아니라 아이콘 타일이 축이다**(목업에서 바꾼 것). 목업은 순찰자 아바타를
 * 앞에 뒀는데, **순찰자가 없는 이력이 실측 35%** 라 아바타를 축으로 쓰면 **3건 중 1건은
 * 축이 사라진다.** 034 가 타일을 둔 이유(눈이 따라갈 축)가 여기서 더 세다.
 *
 * 🔴 **타일은 한 색이다** — 결과는 뱃지가 말한다. 타일까지 색을 바꾸면 같은 정보가 두 번이다
 * (034 가 코스 카드에서 내린 결론과 같다).
 *
 * 🔴 **진행 막대를 넣지 않는다**(테이블에는 있다) — 좁은 폭에는 **고르는 데 쓰는 값만**
 * 남긴다(`spec 030` §3 규칙 5). 비율은 `1/3` 이 이미 말하고 막대는 폭만 먹는다.
 *
 * ⚠️ **셸(테두리·배경·클릭)은 `AppTable` 이 그린다.** 여기는 내용만 반환한다.
 */

/** `'2026-05-01T09:00:00'` → `'2026-05-01 09:00'` */
const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16)

/**
 * 🔴 **순찰자 없는 이력이 35%** 다 — 빈 칸으로 두면 데이터 누락처럼 보인다.
 * 교대로 2명 이상이 오면 **숨기지 않는다**(실측 6건).
 */
const runnerLabel = (userList: CourseHistoryRow['userList']): string => {
  if (userList.length === 0) return '순찰자 미지정'
  const [first, ...rest] = userList
  return rest.length === 0 ? first.userName : `${first.userName} 외 ${rest.length}명`
}

const ZoneHistoryCard = (row: CourseHistoryRow) => {
  const result = courseResultBadge(row.status)
  const overtime = overtimeBadge(row.overtimeYn)

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-point-bg text-point">
        <RouteIcon size={20} strokeWidth={1.75} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* 이름은 **한 줄 말줄임**, 뱃지는 밀리지 않는다 */}
          <span className="truncate text-body font-semibold text-foreground">
            {row.courseName}
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <AppBadge variant={result.variant} className={CARD_BADGE}>
              {result.label}
            </AppBadge>
            {/* 🔴 좁은 폭에서도 **2개 병기**를 유지한다 — 접으면 테이블과 다른 정보를 준다 */}
            {overtime && (
              <AppBadge variant={overtime.variant} className={CARD_BADGE}>
                {overtime.label}
              </AppBadge>
            )}
            {row.hasMemo && (
              <MessageSquareTextIcon
                size={13}
                className="text-warning-foreground"
                aria-label="특이사항 있음"
              />
            )}
          </span>
        </div>

        {/* 지표 줄 — 034 와 같은 어휘(아이콘 + 값, 구분선).
            ⚠️ 넘치면 **줄바꿈**한다 — 이력은 값이 네 개라 360px 에서 한 줄에 안 들어갈 수
            있고, 넘쳐서 잘리는 것보다 한 줄 더 쓰는 쪽이 낫다 */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
          {/* 🔴 **날짜를 자르지 않는다** — 이력 목록은 여러 날에 걸쳐 있어 "언제" 가 가장
              중요한 선택 기준이다. 시:분만 두면 다른 날 회차와 구분되지 않는다 */}
          <span className="tabular-nums">{formatDateTime(row.startDt)}</span>
          <span aria-hidden className="text-border">
            │
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserIcon size={13} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate">{runnerLabel(row.userList)}</span>
          </span>
          <span aria-hidden className="text-border">
            │
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={13} strokeWidth={1.75} />
            <span className="tabular-nums">
              {row.checkedCount}/{row.pointCount} 인증
            </span>
          </span>
          <span aria-hidden className="text-border">
            │
          </span>
          {/* 🔴 `'02:17:40'` 처럼 **시 단위가 온다** — 분으로 가정하면 2시간이 2분이 된다 */}
          <span className="tabular-nums">{formatElapsed(row.actualElapsedTime)}</span>
        </div>
      </div>

      {/* 🔴 "들어갈 수 있다" 를 말한다. 카드 전체가 버튼이지만(030) 좁은 폭에서는
       **눌리는 것인지**가 테두리만으로는 전달되지 않는다 */}
      <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
    </div>
  )
}

export default ZoneHistoryCard
