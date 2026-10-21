import { describe, expect, it } from 'vitest'

import { toUpsertNoticeFormData } from '../formData'

const file = (name: string) => new File(['x'], name)

/** FormData 를 [키, 값] 목록으로 — 파일은 이름으로 비교한다 */
const entries = (form: FormData) =>
  [...form.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : value.name])

describe('toUpsertNoticeFormData', () => {
  const base = { noticeSeq: 5, title: 't', description: 'd', isPin: true }

  it('삭제를 먼저, 추가는 이어지는 인덱스에 항목당 1파일 + isRemove=false', () => {
    const form = toUpsertNoticeFormData({
      ...base,
      removeAttachSeqs: [41, 43],
      newFiles: [file('n1.png'), file('n2.pdf')],
    })
    expect(entries(form)).toEqual([
      ['noticeSeq', '5'],
      ['title', 't'],
      ['description', 'd'],
      ['isPin', 'true'],
      ['attachList[0].attachSeq', '41'],
      ['attachList[0].isRemove', 'true'],
      ['attachList[1].attachSeq', '43'],
      ['attachList[1].isRemove', 'true'],
      ['attachList[2].files', 'n1.png'],
      ['attachList[2].isRemove', 'false'],
      ['attachList[3].files', 'n2.pdf'],
      ['attachList[3].isRemove', 'false'],
    ])
  })

  it('첨부 변경이 없으면 attachList 를 보내지 않는다', () => {
    const form = toUpsertNoticeFormData({ ...base, removeAttachSeqs: [], newFiles: [] })
    expect([...form.keys()]).toEqual(['noticeSeq', 'title', 'description', 'isPin'])
  })

  it('최상위 file 키를 쓰지 않는다(서버가 조용히 버린다 — B-43)', () => {
    const form = toUpsertNoticeFormData({ ...base, removeAttachSeqs: [], newFiles: [file('a.png')] })
    expect(form.has('file')).toBe(false)
  })
})
