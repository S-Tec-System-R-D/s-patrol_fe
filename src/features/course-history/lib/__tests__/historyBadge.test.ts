import { describe, expect, it } from 'vitest'

import { courseResultBadge, overtimeBadge, pointCheckBadge } from '../historyBadge'

/**
 * 결과 뱃지 매핑 (`spec 036` T491·T501).
 *
 * 🔴 **이 테스트가 036 의 핵심 설계를 고정한다** — 두 응답의 `status` 범위가 다르고,
 * 시간초과는 독립 축이며, 미완료는 두 종류다.
 */

describe('courseResultBadge — 코스 사전(0·1·2)', () => {
  it('0=진행중 / 1=완료 / 2=미완료 를 매핑한다', () => {
    expect(courseResultBadge(0)).toEqual({ variant: 'point', label: '진행중' })
    expect(courseResultBadge(1)).toEqual({ variant: 'success', label: '완료' })
    expect(courseResultBadge(2)).toEqual({ variant: 'danger', label: '미완료' })
  })

  it('🔴 사전에 없는 값은 빈 칸이 아니라 "알 수 없음" 이다', () => {
    // 값이 없는 것과 모르는 것은 다르다 — 빈 칸이면 데이터 누락처럼 보인다
    expect(courseResultBadge(9)).toEqual({ variant: 'muted', label: '알 수 없음' })
  })

  it('🔴 지점 사전의 2(순찰제외)를 코스 사전으로 읽지 않는다', () => {
    // 값이 겹치는데 뜻이 다르다 — 코스 2 는 미완료다(B-7)
    expect(courseResultBadge(2).label).toBe('미완료')
    expect(courseResultBadge(2).label).not.toBe('순찰제외')
  })
})

describe('pointCheckBadge — 지점 사전(0~4)', () => {
  it('0=대기중 / 1=진행중 / 2=순찰제외', () => {
    expect(pointCheckBadge(0, null, false)).toEqual({ variant: 'muted', label: '대기중' })
    expect(pointCheckBadge(1, null, false)).toEqual({ variant: 'point', label: '진행중' })
    expect(pointCheckBadge(2, null, false)).toEqual({ variant: 'warning', label: '순찰제외' })
  })

  it('🔴 미완료(3)는 checkDt 로 두 종류로 갈린다', () => {
    // 실측 124건이 79(무방문) / 45(방문)로 갈린다 — 관리자가 할 일이 다르다
    expect(pointCheckBadge(3, null, false).label).toBe('미인증')
    expect(pointCheckBadge(3, '2026-10-12T10:41:07', false).label).toBe('미완료')
  })

  it('🔴 완료(4)는 hasMemo 로 이상없음 ↔ 순찰기록이 갈린다', () => {
    // 서버 status 에 이 구분이 없다 — 조합으로 유도한다
    expect(pointCheckBadge(4, '2026-10-12T10:41:07', false)).toEqual({
      variant: 'success',
      label: '이상없음',
    })
    expect(pointCheckBadge(4, '2026-10-12T10:41:07', true)).toEqual({
      variant: 'point',
      label: '순찰기록',
    })
  })

  it('사전에 없는 값은 "알 수 없음"', () => {
    expect(pointCheckBadge(7, null, false).label).toBe('알 수 없음')
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
    const result = pointCheckBadge(4, '2026-08-24T12:59:45', true)
    const overtime = overtimeBadge(true)
    expect(result.label).toBe('순찰기록')
    expect(overtime?.label).toBe('시간초과')
  })
})
