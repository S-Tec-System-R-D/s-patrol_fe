/**
 * multipart 요청 본문 조립 (`spec 040` 신설 → `spec 041` 에서 공용으로 옮겼다 — 공지·근무자).
 *
 * - 원시값은 문자열로 넣는다(`boolean` → `'true'`/`'false'` — ASP.NET 바인더가 읽는 형태).
 * - 같은 키의 파일은 **반복 append** 한다(`file`, `file`, …).
 * - 🔴 호출부는 `Content-Type` 을 **직접 넣지 않는다** — 브라우저/axios 가 boundary 를 붙인다.
 *   직접 `multipart/form-data` 를 넣으면 boundary 가 빠져 서버가 본문을 읽지 못한다.
 * - `undefined` 필드는 **넣지 않는다** — 부분 갱신 API(`UpdateUser`)에서 "안 보냄" 과 같다.
 */
export const toFormData = (
  fields: Record<string, string | number | boolean | undefined>,
  files: Record<string, File[]> = {}
): FormData => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.append(key, String(value))
  }
  for (const [key, list] of Object.entries(files)) {
    for (const file of list) form.append(key, file)
  }
  return form
}
