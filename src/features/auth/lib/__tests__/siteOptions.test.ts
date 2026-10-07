import { describe, expect, it } from 'vitest'
import { toSiteOptions } from '../siteOptions'
import type { UserSiteSelectData } from '@/features/auth/types/site'

/**
 * `UserSiteSelect` 응답 → 선택 가능 목록. 실측 응답 구조(`api-spec.md` §5-2)와
 * 선택 규칙(§2-2)을 고정한다.
 */

/** 실측 형태 — 루트 `siteSeq 6` 아래 사업장 2개(`333333` 계정) */
const measured: UserSiteSelectData = {
  siteSeq: 6,
  siteName: '강동지사',
  children: [
    { childSiteSeq: 7, childSiteName: '강동 테크노타워', parentSeq: 6 },
    { childSiteSeq: 8, childSiteName: '강동 그랜드타워', parentSeq: 6 },
  ],
}

describe('toSiteOptions', () => {
  it('children을 SiteOption으로 정규화한다 — childSiteSeq가 siteSeq가 된다', () => {
    expect(toSiteOptions(measured)).toEqual([
      { siteSeq: 7, siteName: '강동 테크노타워' },
      { siteSeq: 8, siteName: '강동 그랜드타워' },
    ])
  })

  /**
   * 🔴 루트는 소속 지사·상위 조직이고 **선택 대상이 아니다**(`api-spec.md` §2-2).
   * 테스트 데이터의 루트(`siteSeq 6`)에도 지점 7건·코스 6건이 붙어 있어 포함시키고
   * 싶어지지만, 규칙은 `children` 만이다. 이 테스트가 그 경계를 지킨다.
   */
  it('루트 siteSeq는 결과에 포함되지 않는다', () => {
    const result = toSiteOptions(measured)

    expect(result).toHaveLength(2)
    expect(result.map((option) => option.siteSeq)).not.toContain(6)
  })

  it('children이 1개면 1개만 반환한다', () => {
    const single: UserSiteSelectData = { ...measured, children: [measured.children[0]] }

    expect(toSiteOptions(single)).toEqual([{ siteSeq: 7, siteName: '강동 테크노타워' }])
  })

  it('children이 빈 배열이면 빈 배열', () => {
    expect(toSiteOptions({ ...measured, children: [] })).toEqual([])
  })

  /**
   * 0개일 때 서버 응답이 미실측이다(OQ-021-A) — 빈 배열인지 에러인지 모른다.
   * 비정상 형태가 와도 throw하지 않고 "0개"로 수렴시킨다(019 방어 패턴).
   */
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['children 누락', { siteSeq: 6, siteName: '강동지사' }],
    ['children이 배열 아님', { siteSeq: 6, siteName: '강동지사', children: 'nope' }],
  ])('비정상 입력(%s)은 throw 없이 빈 배열', (_label, input) => {
    expect(() => toSiteOptions(input as UserSiteSelectData | null | undefined)).not.toThrow()
    expect(toSiteOptions(input as UserSiteSelectData | null | undefined)).toEqual([])
  })
})
