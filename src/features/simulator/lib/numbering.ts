/**
 * 이어 붙이는 번호 계산 (`spec 082` — 일괄 추가).
 * 이미 있는 것 다음 번호부터 만든다.
 */

/** 숫자로만 된 아이디 중 가장 큰 것 + 1. 없으면 `fallback` */
export const nextLoginId = (loginIds: string[], fallback: string): string => {
  const numeric = loginIds.filter((id) => /^\d+$/.test(id))
  if (numeric.length === 0) return fallback
  const longest = Math.max(...numeric.map((id) => id.length))
  const max = Math.max(...numeric.map(Number))
  return String(max + 1).padStart(longest, '0')
}

/** `start` 부터 `count` 개 — 자릿수(앞의 0)를 지킨다 */
export const loginIdRange = (start: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => String(Number(start) + index).padStart(start.length, '0'))

/**
 * `{접두어}{번호}` 꼴 이름에서 가장 큰 번호 + 1. 접두어와 번호 사이 공백은 있어도 없어도 된다
 * (`근무자3` · `시뮬 지점 3`). 뒤에 다른 글자가 붙은 것(`시뮬 지점 3 (NFC)`)도 센다.
 */
export const nextNameIndex = (names: string[], prefix: string): number => {
  const escaped = prefix.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^${escaped}\\s*(\\d+)`)
  const used = names
    .map((name) => pattern.exec(name.trim())?.[1])
    .filter((value): value is string => value !== undefined)
    .map(Number)
  return used.length === 0 ? 1 : Math.max(...used) + 1
}
