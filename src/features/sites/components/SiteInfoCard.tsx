import { ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { paths } from '@/router/paths'

import type { SiteDetail } from '../types/site'

/**
 * 사업장 기본정보 (`spec 044` T799 → 🔄 **`spec 080`** 시안 `개선안/사업장`).
 *
 * 🔄 080: **소속 그룹 행 삭제**(머리 경로와 겹친다) · 연락처 하이픈 · **하위 사업장 = 이름 + 링크**(D2, 개수 대신).
 * 🔴 하위 사업장은 `GetSiteDetail` 에 없다 — 목록 노드의 **직속 하위**를 받는다. 없으면 행을 두지 않는다.
 * 코스 · 지점 수는 상세가 준다(목록에는 없다).
 */

/** 값 없음 — `design-system.md` §4-5A(999 T869 에서 `—` → `-`) */
const EMPTY = '-'

interface SiteInfoCardProps {
  detail: SiteDetail
  /** 직속 하위 사업장 */
  childSites: { siteSeq: number; siteName: string }[]
}

const SiteInfoCard = ({ detail, childSites }: SiteInfoCardProps) => (
  <AppDetailCard title="기본정보">
    <div className="flex flex-col">
      <AppDetailRow label="주소" value={detail.address || EMPTY} />
      <AppDetailRow label="대표 연락처" value={detail.tel ? formatPhone(detail.tel) : EMPTY} />
      <AppDetailRow label="순찰 코스 · 지점" value={`${detail.courseCount}개 · ${detail.pointCount}개`} />
      {/* 하위가 없으면 행을 두지 않는다 — 대부분의 사업장이 그렇다 */}
      {childSites.length > 0 && (
        <AppDetailRow
          label="하위 사업장"
          value={
            <span className="flex flex-col items-end gap-1">
              {childSites.map((child) => (
                <Link
                  key={child.siteSeq}
                  to={paths.admin.locationDetail(String(child.siteSeq))}
                  className="inline-flex items-center gap-0.5 font-medium text-point-foreground hover:underline"
                >
                  {child.siteName}
                  <ChevronRightIcon size={13} aria-hidden />
                </Link>
              ))}
            </span>
          }
        />
      )}
    </div>
  </AppDetailCard>
)

export default SiteInfoCard
