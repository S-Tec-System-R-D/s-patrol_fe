import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatPhone } from '../../lib/userFormat'
import { roleDisplayName } from '../../lib/userRole'
import type { UserDetail } from '../../types/user'

/**
 * 근무자 기본정보 (`spec 038` T613).
 *
 * 🔄 **권한 행**(2026-11-17, `spec 079` D12) — 상세 응답 `codeName` 을 그대로 적는다. `codeSeq`·`createDt` 는
 * 상세에 없지만 **요청하지 않는다**(사용자 결정 — 권한명만 보이면 된다 · 등록일 행은 두지 않는다, OQ-8 종료).
 *
 * 🔴 **배치 변경 이력이 없다** — 백엔드 미개발(`api-spec.md` §6-5). 구 패널의 가짜 이력을 옮기지
 * 않았다 → 배치관리 spec 으로 이월.
 */
const UserInfoCard = ({ user }: { user: UserDetail }) => (
  <AppDetailCard title="기본정보">
    <div className="flex flex-col">
      <AppDetailRow label="사번" value={user.loginId} />
      <AppDetailRow label="권한" value={roleDisplayName(user.codeName)} />
      <AppDetailRow label="연락처" value={formatPhone(user.phone)} />
      <AppDetailRow label="소속 사업장" value={user.siteName} />
      {/* 🔄 `spec 079`: `근무 상태` 행을 뺐다 — 머리 뱃지와 같은 말이다 */}
    </div>
  </AppDetailCard>
)

export default UserInfoCard
