import { ChevronRightIcon, ClockIcon, MapPinIcon, RouteIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as CARD_BADGE } from '@/components/app/AppBadge.variants'

import type { CourseRow } from '../types'

/**
 * 코스 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 030` → **`spec 034` 에서 목업 A안**).
 *
 * 🔴 **타일 아이콘이 행의 시작점을 고정한다.** 030 판은 글자부터 시작해 이름 길이에 따라
 * 줄 머리가 들쭉날쭉했다 — 목록이 길어지면 **눈이 따라갈 축이 없다.**
 *
 * 🔴 **코스 타일은 한 색이다.** 지점과 달리 **유형이 갈리지 않으므로**(코스는 코스다)
 * 색으로 구분할 것이 없다. 여기서 색은 **정보가 아니라 축** 역할이다.
 *
 * ⚠️ **"최근 순찰" 줄을 뺐다**(사용자 결정 2026-10-14). 테이블(`xl` 이상)에는 **컬럼으로
 * 남아 있다** — 좁은 폭에서는 **고르는 데 쓰는 값**만 남긴다(`spec 030` §3 규칙 5).
 *
 * ⚠️ **셸(테두리·배경·클릭·미사용 톤다운)은 `AppTable` 이 그린다.** 여기는 내용만 반환한다.
 */

const CourseCard = (course: CourseRow) => (
  <div className="flex items-center gap-3">
    {/* 🔴 미사용이면 타일도 함께 가라앉는다 — 카드 배경만 톤다운되고 타일이 밝으면
     **미사용인데 멀쩡해 보인다**(`tasks.md` 제약 4) */}
    <span
      className={`grid size-11 shrink-0 place-items-center rounded-md ${
        course.useYn ? 'bg-point-bg text-point' : 'bg-muted text-muted-foreground'
      }`}
    >
      <RouteIcon size={20} strokeWidth={1.75} />
    </span>

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        {/* 이름은 **한 줄 말줄임**, 뱃지는 밀리지 않는다 */}
        <span
          className={`truncate text-body font-semibold ${
            course.useYn ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {course.courseName}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {course.useYn ? (
            <AppBadge variant="success" className={CARD_BADGE}>
              사용
            </AppBadge>
          ) : (
            <AppBadge variant="muted" className={CARD_BADGE}>
              미사용
            </AppBadge>
          )}
          {/* 🔴 교대는 **양쪽 다 뱃지**다(테이블과 같은 규칙) — 한쪽만 표시하면 같은
              자리에 뱃지와 빈 칸이 섞여 "누락" 처럼 읽힌다 */}
          <AppBadge variant="muted" className={CARD_BADGE}>
            {course.switchYn ? '교대 허용' : '교대 없음'}
          </AppBadge>
        </span>
      </div>

      {/* 지표 줄 — 아이콘 + 값을 구분선으로 나눈다 */}
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPinIcon size={13} strokeWidth={1.75} />
          {/* 🔴 0개도 그대로 보여준다 — 경고하지 않는다(`spec 023` 규칙 12) */}
          <span className="tabular-nums">지점 {course.pointCount}개</span>
        </span>
        <span aria-hidden className="text-border">
          │
        </span>
        <span className="inline-flex items-center gap-1">
          <ClockIcon size={13} strokeWidth={1.75} />
          <span className="tabular-nums">{course.totalMin}분</span>
        </span>
      </div>
    </div>

    {/* 🔴 "들어갈 수 있다" 를 말한다. 카드 전체가 버튼이지만(030) 좁은 폭에서는
     **눌리는 것인지**가 테두리만으로는 전달되지 않는다 */}
    <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
  </div>
)

export default CourseCard
