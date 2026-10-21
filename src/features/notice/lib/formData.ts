import type { UpsertNoticeRequest } from '../types/notice'

/**
 * multipart 요청 본문 조립 (`spec 040` T661 — 프로젝트의 첫 multipart 쓰기).
 *
 * - 원시값은 문자열로 넣는다(`boolean` → `'true'`/`'false'` — ASP.NET 바인더가 읽는 형태).
 * - 같은 키의 파일은 **반복 append** 한다(`file`, `file`, …).
 * - 🔴 호출부는 `Content-Type` 을 **직접 넣지 않는다** — 브라우저/axios 가 boundary 를 붙인다.
 *   직접 `multipart/form-data` 를 넣으면 boundary 가 빠져 서버가 본문을 읽지 못한다.
 */
export const toFormData = (
  fields: Record<string, string | number | boolean>,
  files: Record<string, File[]> = {}
): FormData => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value))
  for (const [key, list] of Object.entries(files)) {
    for (const file of list) form.append(key, file)
  }
  return form
}

/**
 * `UpsertNotice` 본문 — 화면용 두 배열을 서버의 `attachList[i]` 로 펼친다.
 *
 * 실측(2026-10-21, `api-spec.md` §5-1-B) 규칙:
 * - 삭제: `attachList[i].attachSeq` + `attachList[i].isRemove=true`
 * - 추가: `attachList[i].files` **1개** + `attachList[i].isRemove=false` — 🔴 한 항목에 2개를 넣으면 1개만 붙고,
 *   `isRemove` 를 빼면 무시된다. 최상위 `file` 은 200 인데 **조용히 버려진다**(B-43)
 * - 삭제를 먼저, 추가는 그다음 인덱스부터(한 요청에 섞어도 된다)
 */
export const toUpsertNoticeFormData = ({
  noticeSeq,
  title,
  description,
  isPin,
  removeAttachSeqs,
  newFiles,
}: UpsertNoticeRequest): FormData => {
  const form = toFormData({ noticeSeq, title, description, isPin })
  removeAttachSeqs.forEach((attachSeq, i) => {
    form.append(`attachList[${i}].attachSeq`, String(attachSeq))
    form.append(`attachList[${i}].isRemove`, 'true')
  })
  newFiles.forEach((file, j) => {
    const i = removeAttachSeqs.length + j
    form.append(`attachList[${i}].files`, file)
    form.append(`attachList[${i}].isRemove`, 'false')
  })
  return form
}
