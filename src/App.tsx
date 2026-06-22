// TODO(002 시작 시 제거): 001-api-foundation T011/T012 검증용 임시 데모.
// - T011 [US1]: useQuery 결과가 wrapper 없이 unwrap된 페이로드 형태인지 확인
// - T012 [US2]: 실패 mutation 시 전역 Toaster에 notify.error 자동 표출 확인
// 현재 라우터에 App 마운트가 없으므로, 검증 시 임시로 main.tsx에서 직접 렌더링하거나
// 라우터 임시 라우트로 붙여 확인할 것 (002에서 MSW 도입과 함께 정리).

import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/axios'

interface DemoPayload {
  hello: string
}

function ApiFoundationDemo() {
  // T011: useQuery — 정상 응답이 도달했을 때 wrapper(`{ code, message, data }`)가 아닌
  // 페이로드(`DemoPayload`) 그대로 전달되는지 확인. 인터셉터에서 자동 unwrap.
  const query = useQuery({
    queryKey: ['api-foundation-demo'],
    queryFn: async () => {
      const res = await api.get<DemoPayload>('/demo/ok')
      return res.data
    },
    enabled: false,
  })

  // T012: useMutation — 실패 시 화면 코드 없이 전역 toast가 자동 노출되는지 확인
  // (queryClient.ts의 MutationCache.onError 가 notify.error 호출).
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<DemoPayload>('/demo/fail', {})
      return res.data
    },
  })

  return (
    <div className="p-4 space-y-2">
      <h1 className="font-bold">001-api-foundation demo</h1>
      <button type="button" onClick={() => query.refetch()}>
        T011: useQuery refetch
      </button>
      <pre>{JSON.stringify(query.data ?? null, null, 2)}</pre>
      <button type="button" onClick={() => mutation.mutate()}>
        T012: mutation 실패 → toast
      </button>
    </div>
  )
}

export default ApiFoundationDemo
