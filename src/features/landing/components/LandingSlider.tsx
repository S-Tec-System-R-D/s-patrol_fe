import { useEffect, useState, type FocusEvent } from 'react'
import { ArrowLeftIcon, ArrowRightIcon, PauseIcon, PlayIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LANDING_SLIDES } from '../slides'

const AUTOPLAY_MS = 5_000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)

/**
 * 랜딩 오른쪽 소개 슬라이드(`spec 062`). 목업(`docs/ui-mock/login-landing-mock.webp`)의 어두운 패널 —
 * 아래 왼쪽 점 표시 · 문구, 아래 오른쪽 ← →.
 *
 * 🔴 **자동재생은 멈출 수 있어야 한다**(WCAG 2.2.2 — 5초 넘게 움직이는 내용).
 * - 일시정지 버튼 · 마우스를 올리거나 포커스가 들어오면 멈춤.
 * - `prefers-reduced-motion` 이면 **멈춘 채로 시작**한다(재생 버튼으로 켤 수 있다).
 * - 자동으로 넘어가는 동안은 `aria-live="off"` — 5초마다 읽어 주면 로그인 입력을 방해한다(WAI carousel 패턴).
 *
 * 현재 장만 그리고 `key` 로 바꿔 끼워 페이드인한다 — 4장 · 텍스트뿐이라 겹쳐 두고 전환할 이유가 없다.
 */
export const LandingSlider = () => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const count = LANDING_SLIDES.length
  const playing = !paused && !hovered && !focused
  const slide = LANDING_SLIDES[index]
  const Icon = slide.icon

  const go = (next: number) => setIndex((next + count) % count)

  // `index` 를 의존성에 둬서 손으로 넘기면 5초를 다시 센다
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [playing, index, count])

  // 안쪽 버튼끼리 옮겨 다닐 때도 blur 가 오므로, 포커스가 패널 밖으로 나갈 때만 푼다
  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false)
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="서비스 소개"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      className="relative h-full flex flex-col overflow-hidden rounded-xl bg-rail p-10 text-white"
    >
      {/* 장식 — 목업의 그래픽 자리. 캡쳐가 오면 이 자리를 바꾼다(OQ-062-B) */}
      <div aria-hidden className="flex-1 grid place-items-center">
        <div
          key={index}
          className="grid size-40 place-items-center rounded-[32px] bg-rail-2 text-point animate-in fade-in-0 duration-500 motion-reduce:animate-none"
        >
          <Icon size={72} strokeWidth={1.25} />
        </div>
      </div>

      <div aria-live={playing ? 'off' : 'polite'}>
        <div
          key={index}
          role="group"
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${count}`}
          className="space-y-2 animate-in fade-in-0 duration-500 motion-reduce:animate-none"
        >
          <h2 className="text-xl font-semibold">{slide.title}</h2>
          <p className="text-sm text-white/70">{slide.description}</p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {LANDING_SLIDES.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`${i + 1}번째 소개: ${s.title}`}
              aria-current={i === index || undefined}
              onClick={() => go(i)}
              className="grid size-6 place-items-center cursor-pointer"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/30'
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-white/80">
          <button
            type="button"
            aria-label={paused ? '자동 넘김 재생' : '자동 넘김 일시정지'}
            onClick={() => setPaused((p) => !p)}
            className="grid size-9 place-items-center rounded-md hover:bg-white/10 hover:text-white cursor-pointer"
          >
            {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
          </button>
          <button
            type="button"
            aria-label="이전 소개"
            onClick={() => go(index - 1)}
            className="grid size-9 place-items-center rounded-md hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <ArrowLeftIcon size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="다음 소개"
            onClick={() => go(index + 1)}
            className="grid size-9 place-items-center rounded-md hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <ArrowRightIcon size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  )
}
