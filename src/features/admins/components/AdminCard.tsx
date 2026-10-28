import { FolderTreeIcon, PhoneIcon } from 'lucide-react'

import AppBadge from '@/components/app/AppBadge'
import { cardBadge as CARD_BADGE } from '@/components/app/AppBadge.variants'
import type { GroupNode } from '@/features/auth/types/site'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { adminGroupSummary, type AdminRow } from '../lib/adminList'
import { adminRoleLabel, adminRoleVariant } from '../lib/adminRole'

/**
 * 관리자 목록의 **좁은 폭(`xl` 미만) 카드** (`046` T890 → `spec 056`) — 표의 4열(이름 · 권한 · 연락처 · 담당 그룹)을 그대로 옮긴다.
 *
 * 🔴 **꺾쇠가 없다** — 상세가 페이지가 아니라 모달이다(꺾쇠 = 상세 페이지 이동, 사용자 결정 2026-10-26).
 * 아바타도 없다 — 상세 모달과 같다(045).
 */

interface AdminCardProps {
  row: AdminRow
  root: GroupNode
}

const AdminCard = ({ row, root }: AdminCardProps) => {
  const { userName, codeSeq, codeName, phone } = row.admin
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-body font-semibold text-foreground">{userName}</span>
        <AppBadge variant={adminRoleVariant(codeSeq)} className={CARD_BADGE}>
          {adminRoleLabel(codeSeq, codeName)}
        </AppBadge>
      </div>
      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground tabular-nums">
        <PhoneIcon size={13} strokeWidth={1.75} className="shrink-0" />
        {formatPhone(phone)}
      </span>
      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
        <FolderTreeIcon size={13} strokeWidth={1.75} className="shrink-0" />
        {adminGroupSummary(root, row)}
      </span>
    </div>
  )
}

export default AdminCard
