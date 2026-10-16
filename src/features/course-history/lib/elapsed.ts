/**
 * `'HH:mm:ss'` 문자열 ↔ 분 (`spec 023` 코스 상세 B단).
 *
 * 🔴 **시 단위가 온다.** 실측(2026-10-12)에서 `actualElapsedTime: "02:17:40"` 을 받았다 —
 * "분" 으로 가정해 앞 두 자리만 읽으면 **2분**으로 읽힌다. 그래서 세 토막을 모두 센다.
 *
 * ⚠️ **`pauseTime` 은 응답마다 타입이 다르다**(B-5): 목록은 `'HH:mm:ss'` 문자열인데
 * 상세는 `number` 다. 이 함수는 **문자열 쪽**만 다룬다 — 상세를 쓰게 되면 그쪽은 숫자라
 * 변환이 필요 없고, 같은 함수에 두 타입을 받게 만들면 **어느 쪽인지 호출부에서 사라진다.**
 */

/** `'HH:mm:ss'` → 초. 형태가 아니면 `null`(0 을 돌려주면 "0초 걸린 순찰" 과 섞인다) */
export const toSeconds = (value: string | null | undefined): number | null => {
  if (!value) return null
  const parts = value.split(':')
  if (parts.length !== 3) return null

  const nums = parts.map(Number)
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null

  const [hours, minutes, seconds] = nums
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * 초 → 사람이 읽는 소요시간. 🔴 **한 시간을 넘으면 `시간`을 쓴다** — `137분` 보다
 * `2시간 17분` 이 빠르게 읽힌다. 1분 미만은 `1분 미만`(`0분` 은 오류처럼 보인다).
 */
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null) return '-'
  if (seconds < 60) return '1분 미만'

  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}분`
  return minutes === 0 ? `${hours}시간` : `${hours}시간 ${minutes}분`
}

/** `'HH:mm:ss'` → 표시 문자열. 값이 없거나 깨졌으면 `—` */
export const formatElapsed = (value: string | null | undefined): string =>
  formatDuration(toSeconds(value))
