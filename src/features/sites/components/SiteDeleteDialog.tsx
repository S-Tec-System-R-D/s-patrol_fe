import { Trash2Icon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import AppButton from '@/components/app/AppButton'

/**
 * 사업장 삭제 확인 (`spec 044` T802).
 *
 * 🔴 **하위 사업장 · 지점이 함께 지워진다**(실측, B-54). 코스 · 근무자에 무슨 일이 생기는지는 미실측이라
 * "삭제됩니다" 라고 단정하지 않고 **"영향이 있습니다"** 로 묶는다. 0 인 항목은 뺀다.
 * 비밀번호 재확인은 하지 않는다 — 검증할 API 가 없다(spec 결정).
 */

export interface DeleteImpact {
  childSites: number
  courses: number
  points: number
  users: number
}

const deleteSiteMessage = (siteName: string, impact: DeleteImpact): string => {
  const parts = [
    impact.childSites > 0 && `하위 사업장 ${impact.childSites}개`,
    impact.courses > 0 && `순찰 코스 ${impact.courses}개`,
    impact.points > 0 && `지점 ${impact.points}개`,
    impact.users > 0 && `근무자 ${impact.users}명`,
  ].filter(Boolean)
  const effect = parts.length > 0 ? ` ${parts.join(' · ')} 정보에 영향이 있습니다.` : ''
  return `'${siteName}' 사업장을 삭제합니다.${effect} 삭제된 데이터는 복구할 수 없습니다.`
}

interface SiteDeleteDialogProps {
  siteName: string
  impact: DeleteImpact
  pending: boolean
  onConfirm: () => void
}

const SiteDeleteDialog = ({ siteName, impact, pending, onConfirm }: SiteDeleteDialogProps) => (
  <AppAlertDialog
    size="sm"
    icon={Trash2Icon}
    variant="destructive"
    title="사업장 삭제"
    description={deleteSiteMessage(siteName, impact)}
    actionLabel="삭제"
    onAction={onConfirm}
  >
    {/* 처리 중에도 잠근다 — 확인 창은 즉시 닫힌다(`UserDetailPage` 승계) */}
    <AppButton icon={Trash2Icon} variant="destructive" className="flex-auto whitespace-nowrap bg-card" disabled={pending}>
      삭제
    </AppButton>
  </AppAlertDialog>
)

export default SiteDeleteDialog
