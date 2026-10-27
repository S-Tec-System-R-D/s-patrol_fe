import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { GroupListNode, GroupListSite } from '@/features/groups/types/group'
import SiteForm from '../SiteForm'
import { NO_PARENT, toAddSiteRequest } from '../schema'

/** 사업장 입력 (`spec 044` T796 · `spec 051` T934) — 제출 바디 · 409 유지는 `LocationsPage.test` 가 MSW 로 본다 */

const site = (siteSeq: number, siteName: string, children: GroupListSite[] = []): GroupListSite => ({
  siteSeq,
  siteName,
  siteGroupSeq: 0,
  siteGroupName: '',
  address: null,
  tel: null,
  healthCheckYn: false,
  userCount: 0,
  count: children.length,
  parentSiteSeq: null,
  children: children.map((child) => ({ ...child, parentSiteSeq: siteSeq })),
})

const group = (
  groupSeq: number,
  groupName: string,
  layer: number,
  sites: GroupListSite[],
  children: GroupListNode[] = []
): GroupListNode => ({ groupSeq, groupName, parentGroupSeq: null, layer, depth: 0, count: 0, sites, children })

// 회사 ─ 수도권본부(2) ─ 강동지사(3: 그랜드타워 › 별관, 센트럴) · 강서지사(5: 없음)
//      └ 부산본부(4) ─ 해운대지사(6: 마린시티)
const ROOT = group(1, '에스텍시스템', 0, [], [
  group(2, '수도권본부', 1, [], [
    group(3, '강동지사', 2, [site(10, '그랜드타워', [site(11, '그랜드타워 별관')]), site(12, '센트럴플라자')]),
    group(5, '강서지사', 2, []),
  ]),
  group(4, '부산본부', 1, [], [group(6, '해운대지사', 2, [site(13, '마린시티')])]),
])

const renderForm = (props: Partial<Parameters<typeof SiteForm>[0]> = {}) => {
  const onSubmit = vi.fn()
  render(
    <SiteForm
      root={ROOT}
      submitLabel="등록"
      pending={false}
      onSubmit={onSubmit}
      onCancel={() => undefined}
      {...props}
    />
  )
  return onSubmit
}

const combobox = (name: string) => screen.getByRole('combobox', { name })
const optionTexts = () => screen.getAllByRole('option').map((option) => option.textContent)
const pick = async (name: string, option: string) => {
  await userEvent.click(combobox(name))
  await userEvent.click(screen.getByRole('option', { name: option }))
}

describe('SiteForm', () => {
  it('필수 3칸이 비면 제출하지 않고 문구를 띄운다 · 공백만은 빈 값', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('사업장명'), '   ')
    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('사업장명을 입력해주세요.')).toBeInTheDocument()
    expect(screen.getByText('지사를 선택해주세요.')).toBeInTheDocument()
    expect(screen.getByText('주소를 입력해주세요.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('🔴 본부 → 지사 → 모 사업장 순으로 열린다 · 모 사업장 후보는 최상위만', async () => {
    const onSubmit = renderForm()
    expect(combobox('지사')).toBeDisabled()
    expect(combobox('모 사업장')).toBeDisabled()
    expect(combobox('모 사업장')).toHaveTextContent('없음 (최상위 사업장)')

    await userEvent.click(combobox('본부'))
    expect(optionTexts()).toEqual(['수도권본부', '부산본부'])
    await userEvent.click(screen.getByRole('option', { name: '수도권본부' }))

    await userEvent.click(combobox('지사'))
    expect(optionTexts()).toEqual(['강동지사', '강서지사'])
    await userEvent.click(screen.getByRole('option', { name: '강동지사' }))

    await userEvent.click(combobox('모 사업장'))
    expect(optionTexts()).toEqual(['없음 (최상위 사업장)', '그랜드타워', '센트럴플라자'])
    await userEvent.click(screen.getByRole('option', { name: '그랜드타워' }))
    expect(screen.getByText('추가 후에는 바꿀 수 없습니다.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('사업장명'), '  새 사업장 ')
    await userEvent.type(screen.getByLabelText('주소'), '서울시 ')
    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({
      siteName: '새 사업장',
      groupSeq: '3',
      parentSiteSeq: '10',
      address: '서울시',
      tel: '',
    })
  })

  it('🔴 위 칸을 바꾸면 아래 칸을 비운다', async () => {
    renderForm({ defaultValues: { groupSeq: '3' } })
    await pick('모 사업장', '센트럴플라자')

    await pick('지사', '강서지사')
    expect(combobox('모 사업장')).toHaveTextContent('없음 (최상위 사업장)')
    expect(combobox('모 사업장')).toBeDisabled()
    expect(screen.getByText('이 지사에 사업장이 없습니다.')).toBeInTheDocument()

    await pick('본부', '부산본부')
    expect(combobox('지사')).toHaveTextContent('지사를 선택해주세요')
  })

  it('기본 지사가 있으면 본부 · 지사가 채워진 채로 열린다', () => {
    renderForm({ defaultValues: { groupSeq: '6' } })
    expect(combobox('본부')).toHaveTextContent('부산본부')
    expect(combobox('지사')).toHaveTextContent('해운대지사')
    expect(combobox('모 사업장')).toBeEnabled()
  })

  it('🔴 기본 그룹이 지사가 아니면 비운다(다시 골라야 저장된다)', () => {
    renderForm({ defaultValues: { groupSeq: '2' } })
    expect(combobox('본부')).toHaveTextContent('본부를 선택해주세요')
    expect(combobox('지사')).toHaveTextContent('지사를 선택해주세요')
  })

  it('루트가 지사인 트리 → 본부 칸 없이 지사를 바로 고른다', () => {
    renderForm({ root: group(3, '강동지사', 2, [site(10, '그랜드타워')]) })
    expect(screen.queryByRole('combobox', { name: '본부' })).not.toBeInTheDocument()
    expect(combobox('지사')).toBeEnabled()
  })

  it('🔴 지사가 0개면 안내하고 제출을 막는다', () => {
    renderForm({ root: group(1, '에스텍시스템', 0, [], [group(2, '수도권본부', 1, [])]) })
    expect(screen.getByText('지사가 없습니다. 관리그룹 편집에서 지사를 먼저 추가해주세요.')).toBeInTheDocument()
    expect(combobox('본부')).toBeDisabled()
    expect(combobox('지사')).toBeDisabled()
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
  })

  it('수정 — 모 사업장은 읽기 전용(이름 / 없음)', () => {
    renderForm({ defaultValues: { groupSeq: '3' }, parentLocked: true, parentName: '그랜드타워' })
    expect(combobox('모 사업장')).toBeDisabled()
    expect(combobox('모 사업장')).toHaveTextContent('그랜드타워')
    expect(screen.getByText('모 사업장은 바꿀 수 없습니다.')).toBeInTheDocument()
  })

  it('처리 중에는 제출 버튼이 비활성 · 계약 기간 칸은 없다', () => {
    renderForm({ pending: true })
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
    expect(screen.queryByText(/계약/)).not.toBeInTheDocument()
  })
})

describe('toAddSiteRequest', () => {
  const base = { siteName: 'A', groupSeq: '3', parentSiteSeq: NO_PARENT, address: '서울', tel: '' }

  it('🔴 빈 연락처 · 모 사업장 없음은 싣지 않는다 · 숫자로 바꾼다', () => {
    expect(toAddSiteRequest(base)).toEqual({ groupSeq: 3, siteName: 'A', address: '서울' })
    expect(toAddSiteRequest({ ...base, tel: '02-1' })).toMatchObject({ tel: '02-1' })
    expect(toAddSiteRequest({ ...base, parentSiteSeq: '10' })).toMatchObject({ parentSiteSeq: 10 })
  })
})
