/**
 * 라우트 단위 fallback (react-router v7 `errorElement`).
 * 콘텐츠 톤은 docs/design-system.md §4 따름.
 * 풀 디자인된 401/403/404 화면은 Phase 1에서 통일.
 */
export const PageErrorFallback = () => (
  <div className="flex flex-col items-center justify-center gap-2 p-8 text-sm text-text-secondary">
    <p className="text-base text-text-primary">문제가 발생했습니다</p>
    <p>잠시 후 다시 시도해주세요.</p>
  </div>
)
