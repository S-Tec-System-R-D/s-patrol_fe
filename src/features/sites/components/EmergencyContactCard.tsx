import { PhoneIcon } from 'lucide-react'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppEmpty from '@/components/app/AppEmpty'

/**
 * 비상연락망 자리 (`spec 044` T808).
 *
 * 🔴 **API 가 없다**(B-57). 목업의 요일 7행 · 담당자 풀은 그리지 않는다 — disabled 표를 지금 만들면 API 가 생겼을 때
 * 거의 다시 만들어야 한다. 제목 · 설명 · 안내만 둔다(사용자 승인 2026-10-23 — 결과를 보고 조정).
 */
const EmergencyContactCard = () => (
  <AppDetailCard icon={PhoneIcon} title="비상연락망">
    <p className="text-caption text-muted-foreground">
      헬스체크 이상 감지 시 요일별로 지정된 담당자에게 알림이 발송됩니다.
    </p>
    <AppEmpty icon={PhoneIcon} title="비상연락망은 아직 지원되지 않습니다" />
  </AppDetailCard>
)

export default EmergencyContactCard
