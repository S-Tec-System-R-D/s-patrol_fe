import { ChevronRightIcon, MapPinIcon, MessageSquareTextIcon, RouteIcon, UserIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as CARD_BADGE } from '@/components/app/AppBadge.variants'
import { overtimeBadge, pointCheckBadge } from '@/features/course-history/lib/historyBadge'
import type { PointHistoryRow } from '@/features/course-history/types'

/**
 * 지점 이력의 **좁은 폭(`xl` 미만) 카드** (`spec 037` T542).
 *
 * 🔴 **`spec 034` 의 카드 골격으로 맞췄다**: `타일 + [이름 + 작은 뱃지] + 지표 줄 + 꺾쇠`.
 * 036 이 코스 카드에서 확정한 것과 **같은 어휘**다 — 이력 2화면이 나란히 쓰이는데 골격이
 * 다르면 탭을 옮길 때마다 눈이 다시 적응해야 한다(**OQ-034-A 지점 쪽 종결**).
 *
 * 🔴 **팩토리가 아니라 그냥 컴포넌트다.** 이전 판은 `onRecordClick` 을 받는 팩토리였고
 * 카드 안에 **기록 모달 버튼**이 있었다 — 037 에서 상세가 **페이지**가 되면서 그 버튼이
 * 사라졌다. ⚠️ 이 화면은 이제 `onRowClick` 이 있어 `AppTable` 이 카드를 **`button`** 으로
 * 그린다. 🔴 **그래서 카드 안에 버튼을 둘 수 없다**(중첩 금지, `patterns.md` §14) — 기록은
 * 아이콘이라 문제가 없다.
 *
 * 🔴 **타일은 한 색이다** — 결과는 뱃지가 말한다. 타일까지 색을 바꾸면 같은 정보가 두 번이다.
 *
 * ⚠️ **셸(테두리·배경·클릭)은 `AppTable` 이 그린다.** 여기는 내용만 반환한다.
 */

/** `'2026-05-01T09:07:00'` → `'2026-05-01 09:07'` */
const formatDateTime = (value: string): string => value.replace('T', ' ').slice(0, 16)

const PointHistoryCard = (row: PointHistoryRow) => {
  const result = pointCheckBadge(row.status, row.checkDt, row.hasMemo)
  const overtime = overtimeBadge(row.overTimeYn)
  // 🔴 미완료 행은 인증이 없어 `''` 다 — "모른다" 가 아니라 **없었다**는 뜻이라 뱃지를 뺀다
  const hasAuth = row.authMethod !== null && row.authMethodName !== ''

  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-point-bg text-point">
        <MapPinIcon size={20} strokeWidth={1.75} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* 이름은 **한 줄 말줄임**, 뱃지는 밀리지 않는다 */}
          <span className="truncate text-body font-semibold text-foreground">{row.pointName}</span>
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
                aria-label="순찰 기록 있음"
              />
            )}
          </span>
        </div>

        {/* 지표 줄 — 034·036 과 같은 어휘(값 + 구분선).
            ⚠️ 넘치면 **줄바꿈**한다 — 잘리는 것보다 한 줄 더 쓰는 쪽이 낫다 */}
        <div className="card-meta text-caption text-muted-foreground">
          {/* 🔴 **날짜를 자르지 않는다** — 여러 날에 걸친 목록이라 "언제" 가 가장 중요한
              선택 기준이다. 🔴 미완료 행도 **시각을 보여준다**(OQ-15 해소) */}
          <span className="tabular-nums">{formatDateTime(row.checkDt)}</span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <RouteIcon size={13} strokeWidth={1.75} className="shrink-0" />
            <span className="truncate">{row.courseName}</span>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <UserIcon size={13} strokeWidth={1.75} className="shrink-0" />
            {/* ⚠️ 완료인데 순찰자가 null 인 행이 실재한다(OQ-16) */}
            <span className="truncate">{row.userName ?? '-'}</span>
          </span>
          {hasAuth && (
            <span>{row.authMethodName}</span>
          )}
        </div>
      </div>

      {/* 🔴 "들어갈 수 있다" 를 말한다 — 카드 전체가 버튼이지만 좁은 폭에서는 테두리만으로
          눌리는 것인지가 전달되지 않는다(030·036 승계) */}
      <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
    </div>
  )
}

export default PointHistoryCard
