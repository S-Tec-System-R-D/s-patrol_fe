import { describe, expect, it } from 'vitest'

import { toFormData } from '../formData'

/** FormData 를 [키, 값] 목록으로 — 파일은 이름으로 비교한다 */
const entries = (form: FormData) =>
  [...form.entries()].map(([key, value]) => [key, typeof value === 'string' ? value : value.name])

describe('toFormData', () => {
  it('원시값을 문자열로 넣는다 — boolean 은 true/false', () => {
    const form = toFormData({ siteSeq: 7, title: '제목', isPin: false })
    expect(entries(form)).toEqual([
      ['siteSeq', '7'],
      ['title', '제목'],
      ['isPin', 'false'],
    ])
  })

  it('같은 키의 파일을 반복 append 한다', () => {
    const form = toFormData({}, { file: [new File(['x'], 'a.png'), new File(['x'], 'b.pdf')] })
    expect(entries(form)).toEqual([
      ['file', 'a.png'],
      ['file', 'b.pdf'],
    ])
  })

  it('undefined 필드는 넣지 않는다 — 부분 갱신에서 "안 보냄"', () => {
    const form = toFormData({ userSeq: 1, name: undefined, loginPw: 'x' })
    expect([...form.keys()]).toEqual(['userSeq', 'loginPw'])
  })
})
