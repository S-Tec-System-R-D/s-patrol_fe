import { toFormData } from '@/lib/formData'

import type { UpsertNoticeRequest } from '../types/notice'

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
