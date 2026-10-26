import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { GroupListSite } from '@/features/groups/types/group'
import type { SiteRow } from '../../lib/siteList'
import SiteCard from '../SiteCard'

/** 사업장 목록 카드 (`046` T891) */

const site = (over: Partial<GroupListSite> = {}): GroupListSite => ({
  siteSeq: 10,
  siteName: '강동 그랜드타워',
  siteGroupSeq: 3,
  siteGroupName: '강동지사',
  address: '서울 강동구 천호대로 1',
  tel: null,
  healthCheckYn: false,
  userCount: 0,
  count: 0,
  parentSiteSeq: null,
  children: [],
  ...over,
})

const row = (over: Partial<SiteRow> = {}): SiteRow => ({
  site: site(),
  depth: 0,
  groupPath: '서울본부 › 강동지사',
  ...over,
})

describe('SiteCard', () => {
  it('이름 · 소속 그룹 · 주소를 보인다', () => {
    render(<>{SiteCard(row())}</>)

    expect(screen.getByText('강동 그랜드타워')).toBeInTheDocument()
    expect(screen.getByText('서울본부 › 강동지사')).toBeInTheDocument()
    expect(screen.getByText('서울 강동구 천호대로 1')).toBeInTheDocument()
  })

  it('🔴 하위 사업장은 └ 를 붙인다 — 최상위는 붙이지 않는다', () => {
    const { unmount } = render(<>{SiteCard(row())}</>)
    expect(screen.queryByText('└')).not.toBeInTheDocument()
    unmount()

    render(<>{SiteCard(row({ depth: 1, site: site({ siteName: '그랜드타워 B동', parentSiteSeq: 10 }) }))}</>)
    expect(screen.getByText('└')).toBeInTheDocument()
  })

  it('주소가 없으면 주소 줄을 두지 않는다', () => {
    const { container } = render(<>{SiteCard(row({ site: site({ address: null }) }))}</>)

    expect(container.querySelector('.lucide-map-pin')).toBeNull()
  })
})
