import { CalendarIcon, ChevronRightIcon, IdCardIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as CARD_BADGE } from '@/components/app/AppBadge.variants'
import { workLabel } from '../lib/userFormat'
import { roleBadgeVariant } from '../lib/userRole'
import type { UserRow } from '../types/user'
import WorkerAvatar from './WorkerAvatar'

/**
 * 근무자 목록의 **좁은 폭(`xl` 미만) 카드** (`spec 038` T608).
 *
 * 🔴 **OQ-030-A 종결** — `/users` 는 우측 400px 패널 때문에 카드 대상에서 빠졌었다(030). 패널이
 * 상세 페이지로 가면서 카드가 들어갈 폭이 생겼다.
 *
 * 034 골격(`타일 + 이름 줄 + 지표 줄 + 꺾쇠`). 타일 자리에 **아바타**를 둔다 — 사람 목록이라
 * 아이콘 타일보다 이니셜이 식별에 낫다. ⚠️ 카드는 `AppTable` 이 `button` 으로 감싸므로 안에
 * 버튼을 두지 않는다(`patterns.md` §14).
 */

const formatDate = (value: string): string => value.slice(0, 10)

const WorkerCard = (row: UserRow) => (
  <div className="flex items-center gap-3">
    <WorkerAvatar id={String(row.userSeq)} name={row.userName} className="size-11" />

    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-body font-semibold text-foreground">{row.userName}</span>
        <AppBadge variant={roleBadgeVariant(row.codeSeq)} className={CARD_BADGE}>
          {row.codeName}
        </AppBadge>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <IdCardIcon size={13} strokeWidth={1.75} className="shrink-0" />
          {row.loginId}
        </span>
        <span aria-hidden className="text-border">
          │
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              row.workYn ? 'bg-success' : 'bg-muted-foreground'
            }`}
          />
          {workLabel(row.workYn)}
        </span>
        <span aria-hidden className="text-border">
          │
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <CalendarIcon size={13} strokeWidth={1.75} className="shrink-0" />
          {formatDate(row.createDt)}
        </span>
      </div>
    </div>

    <ChevronRightIcon size={16} className="shrink-0 text-muted-foreground/60" />
  </div>
)

export default WorkerCard
