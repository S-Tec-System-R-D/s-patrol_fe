import { render, screen } from '@testing-library/react'
import { ActivityIcon } from 'lucide-react'
import { describe, expect, it } from 'vitest'

import AppKpiCard from '../AppKpiCard'

/**
 * 요약 칸 (`spec 031` T457).
 *
 * 🔴 **여기서 고정하는 것은 "없는 것을 그리지 않는다" 는 규칙이다.** 바·단위·보조 줄은
 * 전부 **선택**이고, 특히 **`0%` 바를 그리면 "0점" 으로 읽힌다** — 비율을 만들 수 없는
 * 상태(분모 0·이력 없음)와 진짜 0% 는 다른 사실이다.
 */

const bar = () => document.querySelector('[role="presentation"]')

describe('AppKpiCard — 선택 요소', () => {
  it('값만 주면 단위·바·보조 줄이 없다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="30일 순찰 수행" value={7} />)

    expect(screen.getByText('30일 순찰 수행')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(bar()).toBeNull()
  })

  it('단위·보조 줄을 주면 함께 그린다', () => {
    render(
      <AppKpiCard
        icon={ActivityIcon}
        label="2주 인증"
        value={7}
        unit="회"
        hint="최근 14일 기준"
      />
    )

    expect(screen.getByText('회')).toBeInTheDocument()
    expect(screen.getByText('최근 14일 기준')).toBeInTheDocument()
  })
})

describe('AppKpiCard — 바', () => {
  it('ratio 를 주면 바를 그리고 너비가 비율을 따른다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="61.9%" bar={{ kind: 'ratio', value: 0.619 }} />)

    const track = bar()
    expect(track).not.toBeNull()
    expect((track?.firstElementChild as HTMLElement).style.width).toBe('61.9%')
  })

  it('🔴 ratio 가 null 이면 바가 없다 — 0% 바는 "0점" 으로 읽힌다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="—" bar={null} />)

    expect(bar()).toBeNull()
  })

  it('🔴 바는 **중립색**이다 — 인증률에 색을 못 쓰는 이유가 바에도 적용된다 (spec 023)', () => {
    render(<AppKpiCard icon={ActivityIcon} label="지점 인증률" value="61.9%" bar={{ kind: 'ratio', value: 0.619 }} />)

    const fill = bar()?.firstElementChild as HTMLElement
    expect(fill.className).toContain('bg-muted-foreground/40')
    expect(fill.className).not.toMatch(/bg-(danger|warning|success|point)/)
  })

  it('범위를 벗어난 비율은 0~100% 로 자른다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="과속" value="150%" bar={{ kind: 'ratio', value: 1.5 }} />)

    expect((bar()?.firstElementChild as HTMLElement).style.width).toBe('100%')
  })
})

describe('AppKpiCard — 톤과 값 크기', () => {
  it('🔴 기본 톤은 중립이다 — 칸마다 색을 바꾸면 네 칸이 서로 경쟁한다', () => {
    const { container } = render(<AppKpiCard icon={ActivityIcon} label="소속 코스" value={1} />)

    const chip = container.querySelector('.size-8')
    expect(chip?.className).toContain('bg-muted')
    expect(chip?.className).not.toMatch(/bg-(warning|danger)-bg/)
  })

  it('🔴 아이콘은 **제목 줄 왼쪽**에 붙는다 — 우상단에 떨어지면 가운데가 비어 헐거워 보인다', () => {
    // 색이 아니라 **위치**로 푼 결정이다(사용자 결정 2026-10-14)
    const { container } = render(<AppKpiCard icon={ActivityIcon} label="소속 코스" value={1} />)

    const header = container.querySelector('.size-8')?.parentElement as HTMLElement
    expect(header.className).not.toContain('justify-between')
    // 아이콘이 라벨보다 **앞**에 온다
    expect(header.firstElementChild).toBe(container.querySelector('.size-8'))
  })

  it('warning 톤은 아이콘 칩에만 걸린다', () => {
    const { container } = render(
      <AppKpiCard icon={ActivityIcon} label="미인증 지점" value={8} unit="건" tone="warning" />
    )

    expect(container.querySelector('.size-8')?.className).toContain('bg-warning-bg')
  })

  it('🔴 숫자가 아닌 값은 한 단계 작게 — 날짜가 숫자 자리에 오면 줄바꿈된다', () => {
    render(
      <AppKpiCard icon={ActivityIcon} label="최근 순찰" value="10.13 09:07" compactValue />
    )

    expect(screen.getByText('10.13 09:07').className).toContain('text-panel-title')
    expect(screen.getByText('10.13 09:07').className).not.toContain('text-xl')
  })
})

/**
 * 🔴 **구성을 보여주는 바 3종** (`spec 031` 확장, 목업 수정안).
 *
 * 전월 대비 같은 **외부 비교** 대신 **이미 받아 둔 응답 안의 분포**를 쓴다 — 그래서
 * 서버 요청이 늘지 않는다. 여기서 고정하는 것은 **"없으면 그리지 않는다"** 와
 * **"색을 쓰는 곳과 안 쓰는 곳의 구분"** 이다.
 */
describe('AppKpiCard — 분할 바(segments)', () => {
  it('조각 비율대로 너비를 나눈다 — 합이 분모다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="30일 순찰 수행"
        value={7}
        unit="회"
        bar={{
          kind: 'segments',
          parts: [
            { label: '완료', value: 5, tone: 'done' },
            { label: '진행', value: 1, tone: 'progress' },
            { label: '미완료', value: 1, tone: 'fail' },
          ],
        }}
      />
    )

    const parts = container.querySelectorAll('[role="presentation"] > div')
    expect(parts).toHaveLength(3)
    expect((parts[0] as HTMLElement).style.width).toBe(`${(5 / 7) * 100}%`)
  })

  it('🔴 값이 0 인 조각은 그리지 않는다 — 1px 짜리 색 띠가 "있는 것" 처럼 보인다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="30일 순찰 수행"
        value={5}
        bar={{
          kind: 'segments',
          parts: [
            { label: '완료', value: 5, tone: 'done' },
            { label: '미완료', value: 0, tone: 'fail' },
          ],
        }}
      />
    )

    expect(container.querySelectorAll('[role="presentation"] > div')).toHaveLength(1)
  })

  it('🔴 합이 0 이면 바 자체가 없다 — 빈 트랙은 "0점" 으로 읽힌다', () => {
    render(
      <AppKpiCard
        icon={ActivityIcon}
        label="30일 순찰 수행"
        value={0}
        bar={{ kind: 'segments', parts: [{ label: '완료', value: 0 }] }}
      />
    )

    expect(bar()).toBeNull()
  })

  it('🔴 완료/미완료에는 색을 쓴다 — **서버가 센 상태값**이라 근거가 있다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="30일 순찰 수행"
        value={6}
        bar={{
          kind: 'segments',
          parts: [
            { label: '완료', value: 5, tone: 'done' },
            { label: '미완료', value: 1, tone: 'fail' },
          ],
        }}
      />
    )

    const parts = container.querySelectorAll('[role="presentation"] > div')
    expect((parts[0] as HTMLElement).className).toContain('bg-success')
    expect((parts[1] as HTMLElement).className).toContain('bg-danger')
  })
})

describe('AppKpiCard — 범위 바(range)', () => {
  it('최소~최대 안에서 현재 위치를 찍는다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="평균 소요시간"
        value="50분"
        bar={{ kind: 'range', min: 42, max: 58, value: 50 }}
      />
    )

    const handle = container.querySelector('[role="presentation"] > span') as HTMLElement
    expect(handle.style.left).toBe('50%')
  })

  it('🔴 최단 = 최장이면 가운데 둔다 — 0 으로 나누지 않는다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="평균 소요시간"
        value="42분"
        bar={{ kind: 'range', min: 42, max: 42, value: 42 }}
      />
    )

    expect((container.querySelector('[role="presentation"] > span') as HTMLElement).style.left).toBe(
      '50%'
    )
  })
})

describe('AppKpiCard — 점등 바(ticks)', () => {
  it('🔴 안 한 날도 칸을 남긴다 — 빼면 "쉰 날" 이 보이지 않는다', () => {
    const { container } = render(
      <AppKpiCard
        icon={ActivityIcon}
        label="최근 순찰"
        value="10.14 10:14"
        compactValue
        bar={{ kind: 'ticks', days: [true, false, false, true] }}
      />
    )

    const ticks = container.querySelectorAll('[role="presentation"] > span')
    expect(ticks).toHaveLength(4)
    expect((ticks[0] as HTMLElement).className).toContain('bg-success')
    expect((ticks[1] as HTMLElement).className).toContain('bg-muted')
  })
})

describe('AppKpiCard — 뱃지와 양끝 라벨', () => {
  it('뱃지는 값 옆에, 양끝 라벨은 바 아래에', () => {
    render(
      <AppKpiCard
        icon={ActivityIcon}
        label="2주 인증"
        value={7}
        unit="회"
        badge="78%"
        bar={{ kind: 'ratio', value: 0.78 }}
        foot={{ left: '인증 7', right: '대상 순찰 9회' }}
      />
    )

    expect(screen.getByText('78%')).toBeInTheDocument()
    expect(screen.getByText('인증 7')).toBeInTheDocument()
    expect(screen.getByText('대상 순찰 9회')).toBeInTheDocument()
  })

  it('오른쪽 라벨은 선택이다', () => {
    render(
      <AppKpiCard
        icon={ActivityIcon}
        label="소속 코스"
        value={1}
        unit="개"
        foot={{ left: 'A동 순찰코스' }}
      />
    )

    expect(screen.getByText('A동 순찰코스')).toBeInTheDocument()
  })
})

/**
 * 🔴 **대비 보강** (사용자 지적 2026-10-14 — "뱃지가 너무 회색이고 타이틀이 눈에 안 들어온다").
 *
 * 처음 재작성에서 "유치해 보인다" 를 고치려고 색을 걷어냈는데, **너무 걷어냈다.** 유치함의
 * 주범은 **채도 높은 색이 칸마다 경쟁한 것**이지 색 자체가 아니었다.
 */
describe('AppKpiCard — 대비', () => {
  it('🔴 라벨에는 **색을 입히지 않는다** — 4칸이 다시 경쟁한다. 굵기와 명도로 세운다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="30일 순찰 수행" value={7} />)

    const label = screen.getByText('30일 순찰 수행')
    expect(label.className).toContain('font-medium')
    // 색조(point·success·warning·danger)를 쓰지 않는다
    expect(label.className).not.toMatch(/text-(point|success|warning|danger)/)
  })

  it('🔴 뱃지 색은 **값에 따라 바뀌지 않는다**', () => {
    // 값에 따라 색이 바뀌면 화면이 `78%` 를 좋다/나쁘다 **판정**하는 셈인데 그 기준이
    // 없다(`순찰제외` 때문에 분모를 확신할 수 없다 — spec 023)
    const high = render(<AppKpiCard icon={ActivityIcon} label="2주 인증" value={7} badge="98%" />)
    const highClass = screen.getByText('98%').className
    high.unmount()

    render(<AppKpiCard icon={ActivityIcon} label="2주 인증" value={1} badge="12%" />)
    expect(screen.getByText('12%').className).toBe(highClass)
  })

  it('뱃지는 **잉크를 진하게** 해서 회색으로 묻히지 않게 한다', () => {
    render(<AppKpiCard icon={ActivityIcon} label="최근 순찰" value="10.14" badge="9시간 전" />)

    const badge = screen.getByText('9시간 전')
    expect(badge.className).toContain('text-foreground')
    expect(badge.className).toContain('font-semibold')
  })
})
