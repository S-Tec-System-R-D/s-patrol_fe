import { describe, expect, it } from 'vitest'

import { courseResultBadge, overtimeBadge, pointCheckBadge } from '../historyBadge'

/**
 * 결과 뱃지 매핑 (`spec 036` T491·T501).
 *
 * 🔴 **이 테스트가 036 의 핵심 설계를 고정한다** — 두 응답의 `status` 범위가 다르고,
 * 시간초과는 독립 축이며, 미완료는 두 종류다.
 */

describe('courseResultBadge — 코스 사전(0·1·2)', () => {
  it('🔴 0=진행중 / 1 · 2=완료 — 회차는 진행중 · 완료 두 가지다 (spec 079 D11)', () => {
    expect(courseResultBadge(0)).toEqual({ variant: 'point', label: '진행중' })
    expect(courseResultBadge(1)).toEqual({ variant: 'success', label: '완료' })
    // 서버 2(중간 종료)도 순찰은 끝난 것 — 빠진 지점은 지점의 미인증이 말한다
    expect(courseResultBadge(2)).toEqual({ variant: 'success', label: '완료' })
  })

  it('🔴 사전에 없는 값은 빈 칸이 아니라 "알 수 없음" 이다', () => {
    // 값이 없는 것과 모르는 것은 다르다 — 빈 칸이면 데이터 누락처럼 보인다
    expect(courseResultBadge(9)).toEqual({ variant: 'muted', label: '알 수 없음' })
  })

  it('🔴 지점 사전의 2(순찰제외)를 코스 사전으로 읽지 않는다', () => {
    // 값이 겹치는데 뜻이 다르다 — 코스 2 는 (화면) 완료다(B-7 · D11)
    expect(courseResultBadge(2).label).toBe('완료')
    expect(courseResultBadge(2).label).not.toBe('순찰제외')
  })
})

describe('pointCheckBadge — 지점 사전(0~4)', () => {
  it('0=대기중 / 1=진행중 / 2=순찰제외', () => {
    expect(pointCheckBadge(0, false)).toEqual({ variant: 'muted', label: '대기중' })
    expect(pointCheckBadge(1, false)).toEqual({ variant: 'point', label: '진행중' })
    expect(pointCheckBadge(2, false)).toEqual({ variant: 'warning', label: '순찰제외' })
  })

  it('🔴 미완료(3)는 건너뜀 · 종료로 남은 지점 모두 미인증 하나다 (spec 079 D8)', () => {
    // 서버는 둘을 같은 상태로 둔다(백엔드 확인 2026-11-16) — 화면도 한 이름 · 주황
    expect(pointCheckBadge(3, false)).toEqual({ variant: 'warning', label: '미인증' })
  })

  it('🔴 완료(4)는 hasMemo 로 이상없음 ↔ 순찰기록이 갈린다', () => {
    // 서버 status 에 이 구분이 없다 — 조합으로 유도한다
    expect(pointCheckBadge(4, false)).toEqual({
      variant: 'success',
      label: '이상없음',
    })
    expect(pointCheckBadge(4, true)).toEqual({
      variant: 'point',
      label: '순찰기록',
    })
  })

  it('사전에 없는 값은 "알 수 없음"', () => {
    expect(pointCheckBadge(7, false).label).toBe('알 수 없음')
  })
})

describe('overtimeBadge — 🔴 독립 축이라 별 뱃지다', () => {
  it('true 일 때만 뱃지를 만든다', () => {
    expect(overtimeBadge(true)).toEqual({ variant: 'danger', label: '시간초과' })
  })

  it('🔴 null 이면 그리지 않는다 — false 와 다르다', () => {
    // 인증이 찍히지 않은 행은 이 필드가 null 이다. "초과하지 않았다" 가 아니라
    // "판단할 근거가 없다" 다
    expect(overtimeBadge(null)).toBeNull()
    expect(overtimeBadge(undefined)).toBeNull()
    expect(overtimeBadge(false)).toBeNull()
  })

  it('🔴 결과·기록·초과 세 축이 동시에 참인 행을 둘 다 표현한다 (실측 detailSeq 85)', () => {
    // 하나로 접으면 우선순위를 정해야 하고 어느 쪽이든 정보가 사라진다
    const result = pointCheckBadge(4, true)
    const overtime = overtimeBadge(true)
    expect(result.label).toBe('순찰기록')
    expect(overtime?.label).toBe('시간초과')
  })
})
