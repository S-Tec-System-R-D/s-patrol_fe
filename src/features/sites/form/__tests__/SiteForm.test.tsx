import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import SiteForm from '../SiteForm'
import { toAddSiteRequest } from '../schema'

/** 사업장 입력 (`spec 044` T796) — 제출 바디 · 409 유지는 `LocationsPage.test` 가 MSW 로 본다 */

const OPTIONS = [
  { groupSeq: 3, label: '테스트사업장(수정) › 강동지사' },
  { groupSeq: 8, label: 'test › 본부할당 사업장' },
]

const renderForm = (props: Partial<Parameters<typeof SiteForm>[0]> = {}) => {
  const onSubmit = vi.fn()
  render(
    <SiteForm
      options={OPTIONS}
      submitLabel="등록"
      pending={false}
      onSubmit={onSubmit}
      onCancel={() => undefined}
      {...props}
    />
  )
  return onSubmit
}

describe('SiteForm', () => {
  it('필수 3칸이 비면 제출하지 않고 문구를 띄운다 · 공백만은 빈 값', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('사업장명'), '   ')
    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(await screen.findByText('사업장명을 입력해주세요.')).toBeInTheDocument()
    expect(screen.getByText('소속 그룹을 선택해주세요.')).toBeInTheDocument()
    expect(screen.getByText('주소를 입력해주세요.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('선택지는 받은 것만 · 고르고 제출하면 앞뒤 공백을 지운 값', async () => {
    const onSubmit = renderForm()
    await userEvent.type(screen.getByLabelText('사업장명'), '  새 사업장 ')
    await userEvent.click(screen.getByRole('combobox', { name: '소속 그룹' }))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(OPTIONS.map((o) => o.label))
    await userEvent.click(screen.getByRole('option', { name: 'test › 본부할당 사업장' }))
    await userEvent.type(screen.getByLabelText('주소'), '서울시 ')
    await userEvent.click(screen.getByRole('button', { name: '등록' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0][0]).toEqual({ siteName: '새 사업장', groupSeq: '8', address: '서울시', tel: '' })
  })

  it('기본 그룹이 있으면 선택된 채로 열린다', () => {
    renderForm({ defaultValues: { groupSeq: '3' } })
    expect(screen.getByRole('combobox', { name: '소속 그룹' })).toHaveTextContent('테스트사업장(수정) › 강동지사')
  })

  it('🔴 지사가 0개면 안내하고 제출을 막는다', () => {
    renderForm({ options: [] })
    expect(screen.getByText('지사가 없습니다. 관리그룹 편집에서 지사를 먼저 추가해주세요.')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '소속 그룹' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
  })

  it('처리 중에는 제출 버튼이 비활성 · 계약 기간 칸은 없다', () => {
    renderForm({ pending: true })
    expect(screen.getByRole('button', { name: '등록' })).toBeDisabled()
    expect(screen.queryByText(/계약/)).not.toBeInTheDocument()
  })
})

describe('toAddSiteRequest', () => {
  it('🔴 빈 연락처는 싣지 않는다 · groupSeq 는 숫자', () => {
    expect(toAddSiteRequest({ siteName: 'A', groupSeq: '3', address: '서울', tel: '' })).toEqual({
      groupSeq: 3,
      siteName: 'A',
      address: '서울',
    })
    expect(toAddSiteRequest({ siteName: 'A', groupSeq: '3', address: '서울', tel: '02-1' })).toMatchObject({
      tel: '02-1',
    })
  })
})
