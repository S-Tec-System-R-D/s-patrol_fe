import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'

/**
 * vitest 전역 setup.
 * - @testing-library/jest-dom 매처 등록(`toBeInTheDocument` 등).
 * - MSW server lifecycle:
 *   - beforeAll: listen
 *   - afterEach: resetHandlers (테스트 격리)
 *   - afterAll: close
 */
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

/**
 * jsdom 미구현 API stub (017).
 * radix `Select`는 Pointer Capture API와 `scrollIntoView`를 호출하는데 jsdom엔 둘 다 없어
 * 열기/선택 시 TypeError로 죽는다. 라이브러리 환경 제약이라 컴포넌트 쪽에서는 피할 수 없다.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

/**
 * jsdom 미구현 API stub (022).
 * radix `Switch`는 thumb 크기 측정에 `ResizeObserver`를 쓰는데 jsdom엔 없어
 * 렌더 즉시 `ReferenceError`로 죽는다. 017의 `Select` stub과 같은 환경 공백이다.
 * 측정값이 필요한 단언은 없으므로 no-op으로 충분하다.
 */
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
