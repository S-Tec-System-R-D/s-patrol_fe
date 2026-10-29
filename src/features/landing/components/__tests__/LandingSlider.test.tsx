import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LANDING_SLIDES } from '../../slides'
import { LandingSlider } from '../LandingSlider'

/**
 * 랜딩 소개 슬라이드(`spec 062`) — 5초 자동 넘김 · ← → · 점 표시 · 일시정지 · hover/포커스 멈춤 · reduced-motion.
 * 클릭은 `fireEvent` — 가짜 시계에서 userEvent 는 지연을 기다리다 멈춘다.
 */

const [first, second, , last] = LANDING_SLIDES
const title = () => screen.getByRole('heading', { level: 2 }).textContent

const mockReducedMotion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce, media: query }))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('LandingSlider', () => {
  it('5초마다 다음 장 · 마지막 다음은 처음', () => {
    vi.useFakeTimers()
    render(<LandingSlider />)
    expect(title()).toBe(first.title)

    act(() => vi.advanceTimersByTime(5_000))
    expect(title()).toBe(second.title)

    // 다음 타이머는 다시 그린 뒤에 잡힌다 — 한 번에 15초를 돌리면 한 장만 넘어간다
    for (let i = 0; i < 3; i++) act(() => vi.advanceTimersByTime(5_000))
    expect(title()).toBe(first.title)
  })

  it('← → · 점 표시로 넘긴다 — 처음에서 ← 는 마지막', () => {
    render(<LandingSlider />)
    fireEvent.click(screen.getByRole('button', { name: '이전 소개' }))
    expect(title()).toBe(last.title)

    fireEvent.click(screen.getByRole('button', { name: '다음 소개' }))
    expect(title()).toBe(first.title)

    fireEvent.click(screen.getByRole('button', { name: `2번째 소개: ${second.title}` }))
    expect(title()).toBe(second.title)
    expect(screen.getByRole('button', { name: `2번째 소개: ${second.title}` })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('🔴 일시정지 버튼 — 멈추고, 다시 누르면 재생', () => {
    vi.useFakeTimers()
    render(<LandingSlider />)

    fireEvent.click(screen.getByRole('button', { name: '자동 넘김 일시정지' }))
    // 버튼을 눌러 포커스가 들어와 있으면 포커스 멈춤과 구분이 안 된다 — 패널 밖으로 뺀다
    fireEvent.blur(screen.getByRole('button', { name: '자동 넘김 재생' }))
    act(() => vi.advanceTimersByTime(10_000))
    expect(title()).toBe(first.title)

    fireEvent.click(screen.getByRole('button', { name: '자동 넘김 재생' }))
    fireEvent.blur(screen.getByRole('button', { name: '자동 넘김 일시정지' }))
    act(() => vi.advanceTimersByTime(5_000))
    expect(title()).toBe(second.title)
  })

  it('마우스를 올리면 멈추고 내리면 다시 돈다', () => {
    vi.useFakeTimers()
    render(<LandingSlider />)
    const region = screen.getByRole('region', { name: '서비스 소개' })

    fireEvent.mouseEnter(region)
    act(() => vi.advanceTimersByTime(10_000))
    expect(title()).toBe(first.title)

    fireEvent.mouseLeave(region)
    act(() => vi.advanceTimersByTime(5_000))
    expect(title()).toBe(second.title)
  })

  it('포커스가 패널 안에 있으면 멈춘다', () => {
    vi.useFakeTimers()
    render(<LandingSlider />)

    fireEvent.focus(screen.getByRole('button', { name: '다음 소개' }))
    act(() => vi.advanceTimersByTime(10_000))
    expect(title()).toBe(first.title)
  })

  it('🔴 prefers-reduced-motion 이면 멈춘 채 시작한다(재생 버튼이 보인다)', () => {
    mockReducedMotion(true)
    vi.useFakeTimers()
    render(<LandingSlider />)

    expect(screen.getByRole('button', { name: '자동 넘김 재생' })).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(10_000))
    expect(title()).toBe(first.title)
  })
})
