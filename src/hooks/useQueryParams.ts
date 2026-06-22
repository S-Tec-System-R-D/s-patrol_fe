import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

/**
 * URL 쿼리스트링 표준 접근 훅.
 * - 검색·필터·정렬 상태는 URL에 저장(CLAUDE.md B4 / patterns.md §6).
 * - 본 spec(004)은 **read/update primitive**만. zod 파싱·디폴트 채움 등 고급 기능은
 *   화면 spec(Phase 3 `/patrol/zones` 첫 사용처)에서 도입.
 *
 * 사용:
 * ```tsx
 * const [params, setParams] = useQueryParams<'from' | 'to' | 'result'>()
 * const from = params.from
 * setParams({ from: '2026-06-01' })           // merge
 * setParams({ from: undefined })              // 키 제거(빈 문자열도 동일)
 * setParams({ from: '2026-06-01' }, { replace: true })  // 히스토리 교체
 * ```
 */

type ParamsRecord<K extends string> = Partial<Record<K, string | undefined>>

interface SetOptions {
  replace?: boolean
}

export function useQueryParams<K extends string = string>(): readonly [
  ParamsRecord<K>,
  (next: ParamsRecord<K>, options?: SetOptions) => void,
] {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo<ParamsRecord<K>>(() => {
    const obj: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      obj[key] = value
    })
    return obj as ParamsRecord<K>
  }, [searchParams])

  const setParams = useCallback(
    (next: ParamsRecord<K>, options?: SetOptions) => {
      const merged = new URLSearchParams(searchParams)
      // Object.entries의 lib 시그니처가 Partial<Record<K, ...>> 일 때
      // value를 `{} | null`로 추론하는 케이스가 있어 명시적으로 캐스트한다.
      const pairs = Object.entries(next) as Array<[string, string | undefined]>
      for (const [key, value] of pairs) {
        if (value === undefined || value === '') {
          merged.delete(key)
        } else {
          merged.set(key, value)
        }
      }
      setSearchParams(merged, { replace: options?.replace })
    },
    [searchParams, setSearchParams]
  )

  return [params, setParams] as const
}
