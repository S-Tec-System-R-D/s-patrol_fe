import { MutationCache, QueryClient } from '@tanstack/react-query'
import { notify } from '@/lib/notify'

/**
 * 전역 QueryClient.
 * - 기본 옵션은 잠정안 (spec.md §3, Open Question 참조).
 * - 모든 mutation 실패는 `notify.error`로 자동 토스트.
 *   화면별 우회가 필요해지면 `meta: { suppressErrorToast: true }` 같은 확장을 검토.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
  mutationCache: new MutationCache({
    onError: (err) => notify.error((err as Error).message),
  }),
})
