import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import CourseToggleDialog from '../CourseToggleDialog'

/**
 * 토글 확인 모달 (`spec 023` Phase 4, T364).
 *
 * 🔴 **고정하는 것은 "문구가 네 경우 다르다" 는 것이다**(사용자 결정, 규칙 11). 둘을 같은
 * 문구로 두면 모달이 **읽지 않고 누르는 관문**이 되어, 경고가 없는 것과 같아진다.
 *
 * ✅ **OQ-023-F 해소(2026-10-12)**: 코스는 **근무자가 앱에서 직접 고른다**(배정이 아니다).
 * 그래서 비활성화의 효과는 **"코스 목록에서 숨겨져 고를 수 없다"** 다. 처음 문구
 * ("배정되지 않습니다")는 **틀린 경고**였고, 여기에 문구를 고정해 둔 덕에 고칠 자리가
 * 한 곳으로 드러났다 — 그 값을 확인한 셈이다.
 */

const renderDialog = (
  kind: 'useYn' | 'switchYn',
  nextValue: boolean,
  onConfirm = vi.fn()
) => {
  render(
    <CourseToggleDialog
      kind={kind}
      nextValue={nextValue}
      open
      onOpenChange={vi.fn()}
      onConfirm={onConfirm}
    />
  )
  return { onConfirm }
}

describe('CourseToggleDialog — 코스 활성화', () => {
  it('🔴 끄는 경우에만 영향 범위를 말한다 (OQ-023-F)', () => {
    renderDialog('useYn', false)

    expect(screen.getByText('코스를 비활성화하시겠습니까?')).toBeInTheDocument()
    expect(
      screen.getByText(/코스 목록에서 숨겨져, 더 이상 이 코스로 순찰을 시작할 수 없습니다/)
    ).toBeInTheDocument()
    // 🔴 "배정" 은 틀린 말이다 — 근무자가 직접 고른다
    expect(screen.queryByText(/배정/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '비활성화' })).toBeInTheDocument()
  })

  it('켜는 경우는 다른 문구다 — 경고가 아니다', () => {
    renderDialog('useYn', true)

    expect(screen.getByText('코스를 활성화하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText(/코스 목록에 다시 노출됩니다/)).toBeInTheDocument()
    expect(screen.queryByText(/숨겨져/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '활성화' })).toBeInTheDocument()
  })
})

describe('CourseToggleDialog — 교대 허용', () => {
  it('🔴 담백한 확인이다 — 코스 활성화와 **다른 문구**를 쓴다', () => {
    renderDialog('switchYn', true)

    expect(screen.getByText('교대를 허용하시겠습니까?')).toBeInTheDocument()
    expect(screen.getByText('변경하면 코스 설정에 바로 저장됩니다.')).toBeInTheDocument()
  })

  it('🔴 효과를 설명하지 않는다 — 업무 확인 없이 그럴듯한 문장을 쓰지 않는다 (A1)', () => {
    renderDialog('switchYn', true)

    expect(screen.queryByText(/근무자/)).not.toBeInTheDocument()
    expect(screen.queryByText(/나눠/)).not.toBeInTheDocument()
  })

  it('끄는 경우도 문구가 갈린다', () => {
    renderDialog('switchYn', false)

    expect(screen.getByText('교대 허용을 끄시겠습니까?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '끄기' })).toBeInTheDocument()
  })
})

describe('CourseToggleDialog — 확인·취소', () => {
  it('확인을 누르면 onConfirm 이 불린다', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderDialog('useYn', false)

    await user.click(screen.getByRole('button', { name: '비활성화' }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('🔴 취소하면 아무 일도 일어나지 않는다 — 요청이 나가지 않는다', async () => {
    const user = userEvent.setup()
    const { onConfirm } = renderDialog('useYn', false)

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onConfirm).not.toHaveBeenCalled()
  })
})
