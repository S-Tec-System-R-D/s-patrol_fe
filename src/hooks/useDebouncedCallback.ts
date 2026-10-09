import { useCallback, useEffect, useRef } from 'react'

/**
 * 값이 멈춘 뒤에만 콜백을 부른다.
 *
 * 🔴 **검색 입력에 쓴다.** 없으면 **글자 수만큼 요청이 나간다** — "정문 입구" 5글자면
 * 5번이고, URL 에 쓰는 경우 히스토리도 5개 쌓인다(`spec 022` 규칙 9 / 027 T320).
 *
 * 🔴 **언마운트·재호출 시 예약을 취소한다.** 안 하면 화면을 떠난 뒤 `setParams` 가 불려
 * "사라진 화면의 상태를 바꾸는" 경고가 뜨고, 빠르게 타이핑하면 이전 예약이 겹쳐 발사된다.
 *
 * 최신 `callback` 을 ref 로 들고 있어 **콜백 참조가 바뀌어도 타이머를 다시 걸지 않는다** —
 * 호출부가 `useCallback` 으로 감싸지 않아도 동작이 같다.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delayMs: number
): (...args: A) => void {
  const latest = useRef(callback)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    latest.current = callback
  }, [callback])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )

  return useCallback(
    (...args: A) => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => latest.current(...args), delayMs)
    },
    [delayMs]
  )
}
