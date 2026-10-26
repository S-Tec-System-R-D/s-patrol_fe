import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { GroupNode } from '@/features/auth/types/site'
import AdminCard from '../AdminCard'

/** 관리자 목록 카드 (`046` T891). 카드는 표의 3열을 줄인 것이지 값을 바꾼 것이 아니다 */

const group = (groupSeq: number, name: string, parent: number | null, layer: number, children: GroupNode[] = []): GroupNode => ({
  groupSeq,
  groupName: name,
  parentGroupSeq: parent,
  layer,
  depth: layer,
  sites: [],
  children,
})

const branch = group(3, '지사A1', 2, 2)
const hqA = group(2, '본부A', 1, 1, [branch])
const root = group(1, '회사', null, 0, [hqA])

const admin = { userSeq: 3, codeSeq: 3, codeName: '관리자', userName: '김용우', isInclude: true }

describe('AdminCard', () => {
  it('이름 · 권한 · 담당 그룹 요약을 보인다', () => {
    render(<AdminCard row={{ admin, groups: [hqA, branch] }} root={root} />)

    expect(screen.getByText('김용우')).toBeInTheDocument()
    expect(screen.getByText('마스터')).toBeInTheDocument()
    expect(screen.getByText('본부A 외 1개')).toBeInTheDocument()
  })

  it('담당 그룹이 없으면 -', () => {
    render(<AdminCard row={{ admin, groups: [] }} root={root} />)

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('🔴 꺾쇠가 없다 — 상세가 모달이다', () => {
    const { container } = render(<AdminCard row={{ admin, groups: [] }} root={root} />)

    expect(container.querySelector('.lucide-chevron-right')).toBeNull()
  })
})
