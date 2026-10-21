import { InfoIcon } from 'lucide-react'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatPhone, workLabel } from '../../lib/userFormat'
import type { UserDetail } from '../../types/user'

/**
 * 근무자 기본정보 (`spec 038` T613).
 *
 * 🔴 **권한·등록일 행이 없다** — 상세 응답에 `codeSeq`·`codeName`·`createDt` 가 **없다**(OQ-8).
 * 빈 행을 두면 "값이 비어 있다" 로 읽히고, 목록에서 넘겨받으면 주소로 바로 들어올 때 사라진다.
 * 백엔드에 요청했다(B-41).
 *
 * 🔴 **배치 변경 이력이 없다** — 백엔드 미개발(`api-spec.md` §6-5). 구 패널의 가짜 이력을 옮기지
 * 않았다 → 배치관리 spec 으로 이월.
 */
const UserInfoCard = ({ user }: { user: UserDetail }) => (
  <AppDetailCard icon={InfoIcon} title="기본정보">
    <div className="flex flex-col">
      <AppDetailRow label="사번" value={user.loginId} />
      <AppDetailRow label="연락처" value={formatPhone(user.phone)} />
      <AppDetailRow label="소속 사업장" value={user.siteName} />
      <AppDetailRow label="근무 상태" value={workLabel(user.workYn)} />
    </div>
  </AppDetailCard>
)

export default UserInfoCard
