import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WorkerAvatar from '../WorkerAvatar'

describe('WorkerAvatar', () => {
  it('이름 앞 2글자를 이니셜로 렌더', () => {
    render(<WorkerAvatar id="w-01" name="김민준" />)
    expect(screen.getByText('김민')).toBeInTheDocument()
  })

  it('동일 id는 항상 동일 팔레트 색상 클래스를 렌더(해시 결정성)', () => {
    const { unmount } = render(<WorkerAvatar id="w-03" name="오준혁" />)
    const firstClassName = screen.getByText('오준').className
    unmount()

    render(<WorkerAvatar id="w-03" name="오준혁" />)
    const secondClassName = screen.getByText('오준').className

    expect(firstClassName).toBe(secondClassName)
  })

  it('다른 id는 서로 다른 팔레트 색상 클래스를 렌더할 수 있음', () => {
    render(<WorkerAvatar id="w-01" name="김민준" />)
    render(<WorkerAvatar id="w-02" name="이서연" />)
    const classNames = screen.getAllByText(/김민|이서/).map((el) => el.className)
    expect(classNames[0]).not.toBe(classNames[1])
  })
})
