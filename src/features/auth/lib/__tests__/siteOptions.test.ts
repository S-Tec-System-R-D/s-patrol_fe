import { describe, expect, it } from 'vitest'
import { toSiteOptions } from '../siteOptions'
import type { UserSiteSelectData } from '@/features/auth/types/site'

/**
 * `UserSiteSelect` 응답 → 선택 가능 목록. 실측 응답 구조(`api-spec.md` §5-2)와
 * 선택 규칙(§2-2)을 고정한다.
 *
 * 🔴🔴 **루트 포함으로 설계가 뒤집혔다**(사용자 결정 2026-10-19). 이 테스트가 그 결정을
 * 고정한다 — 루트를 다시 빼면 **현장관리자가 실데이터에 닿지 못한다**(루트 `siteSeq 6` 에
 * 코스이력 48건, children 7·8 은 0건, 실측 2026-10-19).
 */

/** 실측 형태 — 루트 `테스트 사업장2`(6) 아래 사업장 2개(`333333` 계정, 2026-10-19 실측) */
const measured: UserSiteSelectData = {
  siteSeq: 6,
  siteName: '테스트 사업장2',
  children: [
    { childSiteSeq: 7, childSiteName: '테스트 사업장2-1', parentSeq: 6 },
    { childSiteSeq: 8, childSiteName: '테스트 사업장2-2', parentSeq: 6 },
  ],
}

describe('toSiteOptions', () => {
  it('🔴 루트를 첫 선택지로 두고 children 을 뒤에 잇는다', () => {
    expect(toSiteOptions(measured)).toEqual([
      { siteSeq: 6, siteName: '테스트 사업장2' },
      { siteSeq: 7, siteName: '테스트 사업장2-1' },
      { siteSeq: 8, siteName: '테스트 사업장2-2' },
    ])
  })

  it('children 의 childSiteSeq 가 siteSeq 로 정규화된다 — 필드명 불일치를 흡수한다', () => {
    const result = toSiteOptions(measured)

    // 서버는 루트에 `siteSeq`, children 에 `childSiteSeq` 를 쓴다(B4 어댑터 허용 범위)
    expect(result.every((option) => typeof option.siteSeq === 'number')).toBe(true)
    expect(result.map((option) => option.siteSeq)).toEqual([6, 7, 8])
  })

  /**
   * 🔴 **루트를 빼면 실데이터에 닿을 수 없다.** 전에는 "루트는 결과에 포함되지 않는다" 를
   * 단정했는데, 그 규칙이 틀렸음이 실측으로 드러나 뒤집었다(2026-10-19).
   */
  it('🔴 루트 siteSeq 가 결과에 포함된다', () => {
    expect(toSiteOptions(measured).map((option) => option.siteSeq)).toContain(6)
  })

  it('children 이 비어도 루트 1개가 남는다 — 자동 진입 대상이다', () => {
    const rootOnly: UserSiteSelectData = { ...measured, children: [] }

    expect(toSiteOptions(rootOnly)).toEqual([{ siteSeq: 6, siteName: '테스트 사업장2' }])
  })

  it('children 이 1개면 루트와 합쳐 2개 — 선택 화면이 뜬다', () => {
    const single: UserSiteSelectData = { ...measured, children: [measured.children[0]] }

    expect(toSiteOptions(single)).toHaveLength(2)
  })

  /**
   * ✅ **OQ-021-A 해소** — "0개 응답이 미실측" 이던 항목은 루트 포함으로 **응답 형태상
   * 0개가 불가능**해졌다. 여기 남은 것은 **비정상 응답 방어선**이다(019 패턴):
   * throw 하지 않고 빈 배열로 수렴시킨다.
   */
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['data 가 빈 객체', {}],
    ['siteSeq 누락 + children 누락', { siteName: '테스트 사업장2' }],
    ['siteSeq 가 null', { siteSeq: null, siteName: '테스트 사업장2', children: [] }],
    ['siteSeq 가 문자열', { siteSeq: '6', siteName: '테스트 사업장2', children: [] }],
  ])('비정상 입력(%s)은 throw 없이 빈 배열', (_label, input) => {
    expect(() => toSiteOptions(input as UserSiteSelectData | null | undefined)).not.toThrow()
    expect(toSiteOptions(input as UserSiteSelectData | null | undefined)).toEqual([])
  })

  it('🔴 children 이 배열이 아니어도 루트는 살린다 — 고를 수 있는 것을 버리지 않는다', () => {
    const broken = { siteSeq: 6, siteName: '테스트 사업장2', children: 'nope' }

    expect(toSiteOptions(broken as unknown as UserSiteSelectData)).toEqual([
      { siteSeq: 6, siteName: '테스트 사업장2' },
    ])
  })
})
