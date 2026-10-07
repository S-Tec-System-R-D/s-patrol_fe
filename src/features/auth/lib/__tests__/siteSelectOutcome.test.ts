import { describe, expect, it } from 'vitest'
import { NO_SITE_MESSAGE, resolveSiteSelectOutcome } from '../siteSelectOutcome'
import type { SiteOption } from '@/features/auth/types/site'

/**
 * 0/1/N 분기. `api-spec.md` §2-2의 확정 규칙을 화면 없이 고정한다.
 */

const siteA: SiteOption = { siteSeq: 7, siteName: '강동 테크노타워' }
const siteB: SiteOption = { siteSeq: 8, siteName: '강동 그랜드타워' }

describe('resolveSiteSelectOutcome', () => {
  it('0개면 none — 안내 문구를 담는다', () => {
    expect(resolveSiteSelectOutcome([])).toEqual({
      kind: 'none',
      message: NO_SITE_MESSAGE,
    })
  })

  /**
   * 🔴 1개는 선택 UI를 스킵하지만 **사업장 값을 담아 돌려준다.**
   * "자동 진입"을 "저장 없이 이동"으로 구현하면 `siteSeq` 없이 홈에 들어가고, 그 조회는
   * 403이 아니라 `200` + 빈 목록으로 돌아와(`api-spec.md:211`) 조용히 틀린 화면이 된다.
   * 이 테스트가 호출부에 저장할 값이 반드시 전달됨을 보장한다(`spec 021` §3 규칙 10).
   */
  it('1개면 auto — 선택 UI를 건너뛰되 저장할 사업장을 담는다', () => {
    expect(resolveSiteSelectOutcome([siteA])).toEqual({ kind: 'auto', site: siteA })
  })

  it('2개면 choose — 목록을 그대로 넘긴다', () => {
    expect(resolveSiteSelectOutcome([siteA, siteB])).toEqual({
      kind: 'choose',
      options: [siteA, siteB],
    })
  })

  it('3개 이상도 choose다 — 상한을 두지 않는다', () => {
    const many: SiteOption[] = [siteA, siteB, { siteSeq: 9, siteName: '강동 스퀘어' }]
    const outcome = resolveSiteSelectOutcome(many)

    expect(outcome.kind).toBe('choose')
    expect(outcome).toEqual({ kind: 'choose', options: many })
  })

  it('auto와 choose만 사업장 값을 가진다 — none은 이동 대상이 없다', () => {
    const outcome = resolveSiteSelectOutcome([])

    expect(outcome).not.toHaveProperty('site')
    expect(outcome).not.toHaveProperty('options')
  })
})
