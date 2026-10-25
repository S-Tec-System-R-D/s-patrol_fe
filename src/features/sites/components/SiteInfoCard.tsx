import { InfoIcon } from 'lucide-react'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'

import type { SiteDetail } from '../types/site'

/**
 * 사업장 기본정보 (`spec 044` T799) — 근무자 · 지점 상세와 같은 좌측 카드(사용자 결정 2026-10-23, 목업 KPI형 대신).
 *
 * 🔴 소속 그룹 · 하위 사업장은 `GetSiteDetail` 에 없다 — 목록 노드에서 찾아 받는다(못 찾으면 `—`).
 * 코스 · 지점 수는 상세가 준다(목록에는 없다). 목업의 운영 상태 · 계약 기간은 없다(사용자 결정 2026-10-23).
 */

/** 값 없음 — `design-system.md` §4-5A(999 T869 에서 `—` → `-`) */
const EMPTY = '-'

interface SiteInfoCardProps {
  detail: SiteDetail
  groupPath: string | null
  childCount: number
}

const SiteInfoCard = ({ detail, groupPath, childCount }: SiteInfoCardProps) => (
  <AppDetailCard icon={InfoIcon} title="기본정보">
    <div className="flex flex-col">
      <AppDetailRow label="소속 그룹" value={groupPath || EMPTY} />
      <AppDetailRow label="주소" value={detail.address || EMPTY} />
      <AppDetailRow label="대표 연락처" value={detail.tel || EMPTY} />
      <AppDetailRow label="순찰 코스 · 지점" value={`${detail.courseCount}개 · ${detail.pointCount}개`} />
      {/* 하위가 없으면 행을 두지 않는다 — 대부분의 사업장이 그렇다 */}
      {childCount > 0 && <AppDetailRow label="하위 사업장" value={`${childCount}개`} />}
    </div>
  </AppDetailCard>
)

export default SiteInfoCard
