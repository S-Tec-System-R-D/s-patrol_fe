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

/**
 * jsdom ↔ MSW multipart 공백 (040).
 * jsdom 의 `FormData`·`File` 로 만든 본문은 MSW(undici `Request`)로 넘어가며 **파일 이름·내용이 사라진다**
 * (`filename="blob"`, 내용 `undefined`). 핸들러가 첨부를 확장자로 나누지 못해 쓰기 테스트가 거짓으로 깨진다.
 * 실제 브라우저에는 없는 환경 공백이라 **Node 기본 구현으로 바꿔 끼운다** — `FormData` 는 `node:` 모듈로
 * 꺼낼 수 없어(앱 tsconfig 에 Node 타입도 없다) Node 의 `Response` 가 파싱한 결과에서 생성자를 얻는다.
 */
const MULTIPART_PROBE = '--b\r\nContent-Disposition: form-data; name="f"; filename="a"\r\n\r\nx\r\n--b--\r\n'
const nodeForm = await new Response(MULTIPART_PROBE, {
  headers: { 'Content-Type': 'multipart/form-data; boundary=b' },
}).formData()
globalThis.FormData = nodeForm.constructor as typeof FormData
globalThis.File = (nodeForm.get('f') as File).constructor as typeof File
