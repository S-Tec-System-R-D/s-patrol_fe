import { describe, expect, it } from 'vitest'

/**
 * vitest 동작 증명용 스모크 테스트.
 * - 환경(jsdom) + 매처(jest-dom) + setup MSW lifecycle이 깨지지 않는지 검증.
 * - 본 spec(004) 외 도메인 테스트는 Phase 1 이후 점진 추가.
 */
describe('vitest smoke', () => {
  it('arithmetic', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom document available', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    expect(el.textContent).toBe('hello')
  })
})
