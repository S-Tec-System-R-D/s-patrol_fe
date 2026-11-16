/**
 * 시각 입력 칸(`AppTimeInput`)의 순수 함수 — 24시간 `HH:mm`(`spec 080` D8).
 *
 * 🔴 브라우저 `type="time"` 을 쓰지 않는다 — 시계 창 · `오전/오후` 칸을 디자인할 수 없다(사용자).
 */

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** 입력 중 — 숫자만 4자리까지, 셋째 자리부터 `:` 를 끼운다(`1230` → `12:30`, 붙여넣은 `22:00` 도 그대로) */
export const formatTyping = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/**
 * 칸을 떠날 때 — 짧게 친 값을 `HH:mm` 으로 채운다(`9` → `09:00` · `930` → `09:30` · `14` → `14:00`).
 * 시 · 분이 범위를 넘으면 그대로 둔다 — 검증 문구가 말한다.
 */
export const normalizeTime = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  const filled =
    digits.length === 1
      ? `0${digits}:00`
      : digits.length === 2
        ? `${digits}:00`
        : digits.length === 3
          ? `0${digits[0]}:${digits.slice(1)}`
          : digits.length === 4
            ? `${digits.slice(0, 2)}:${digits.slice(2)}`
            : ''
  return filled
}

export const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'))

/** 분 목록 — 5분 단위 · 지금 값이 5분 단위가 아니면 그 값도 끼운다(고른 값이 목록에 보여야 한다) */
export const minuteOptions = (current: string | null): string[] => {
  const steps = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))
  return current !== null && !steps.includes(current) ? [...steps, current].sort() : steps
}

/** `HH:mm` → [시, 분] · 형식이 아니면 null */
export const splitTime = (value: string): [string, string] | null =>
  TIME_PATTERN.test(value) ? [value.slice(0, 2), value.slice(3)] : null
