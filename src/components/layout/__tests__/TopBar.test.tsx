import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TopBar } from '../TopBar'

/**
 * 본문 카드 맨 위의 지금 위치(`spec 083`). 상세 화면이 각자 그리던 `코스/지점 › 코스 상세` 를 여기로 모았다 —
 * 화면 테스트에 있던 "목록으로 돌아갈 수단" 확인도 이리로 옮겼다.
 */

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TopBar />
    </MemoryRouter>
  )

const crumb = () => within(screen.getByRole('navigation', { name: '현재 위치' }))

describe('TopBar', () => {
  it.each([
    ['/zones/1', '코스/지점', '/zones', '코스 상세'],
    ['/points/1', '코스/지점', '/points', '지점 상세'],
    ['/users/3', '근무자', '/users', '근무자 상세'],
    ['/notice/4', '공지사항', '/notice', '공지 상세'],
    ['/patrol/zones/12', '순찰이력', '/patrol/zones', '순찰 상세'],
    ['/patrol/points/34', '순찰이력', '/patrol/points', '지점 인증 상세'],
  ])('상세 %s — 부모 조각 `%s` 이 목록(%s) 링크이고 지금 위치는 `%s`', (path, parent, to, label) => {
    renderAt(path)
    expect(crumb().getByRole('link', { name: parent })).toHaveAttribute('href', to)
    expect(crumb().getByText(label)).toHaveAttribute('aria-current', 'page')
  })

  it('🔴 없는 번호의 상세에서도 목록으로 돌아갈 링크가 있다 — 주소로만 정한다(막다른 길이 되지 않는다)', () => {
    renderAt('/points/999999')
    expect(crumb().getByRole('link', { name: '코스/지점' })).toHaveAttribute('href', '/points')
  })

  it.each([
    ['/dashboard', '대시보드'],
    ['/zones', '코스/지점'],
    ['/points', '코스/지점'],
    ['/users', '근무자'],
    ['/deployments', '배치관리'],
    ['/notice', '공지사항'],
    ['/admin/locations', '사업장'],
    ['/admin/admins', '관리자'],
  ])('목록 %s — 부모 없이 `%s` 만', (path, label) => {
    renderAt(path)
    expect(crumb().getByText(label)).toHaveAttribute('aria-current', 'page')
    expect(crumb().queryByRole('link')).not.toBeInTheDocument()
  })

  it('순찰이력 두 탭은 부모 `순찰이력` 아래에 탭 이름을 적는다', () => {
    renderAt('/patrol/points')
    expect(crumb().getByRole('link', { name: '순찰이력' })).toHaveAttribute('href', '/patrol/zones')
    expect(crumb().getByText('지점 순찰이력')).toBeInTheDocument()
  })

  it('본사 사업장 상세는 부모 조각이 없다 — 그 화면이 자기 경로 표시를 그린다(085 에서 옮긴다)', () => {
    renderAt('/admin/locations/3')
    expect(crumb().getByText('사업장')).toBeInTheDocument()
    expect(crumb().queryByRole('link')).not.toBeInTheDocument()
  })

  it('맞는 주소가 없으면 글자 없이 띠만 그린다', () => {
    renderAt('/nowhere')
    expect(screen.queryByRole('navigation', { name: '현재 위치' })).not.toBeInTheDocument()
  })

  it('오른쪽 자리에 넘긴 것을 그린다', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <TopBar right={<span>실시간</span>} />
      </MemoryRouter>
    )
    expect(screen.getByText('실시간')).toBeInTheDocument()
  })
})
