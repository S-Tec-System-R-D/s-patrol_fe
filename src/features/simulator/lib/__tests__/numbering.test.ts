import { describe, expect, it } from 'vitest'
import { loginIdRange, nextLoginId, nextNameIndex } from '../numbering'

describe('nextLoginId', () => {
  it('가장 큰 아이디 다음 번호를 준다', () => {
    expect(nextLoginId(['600101', '600103', '600102'], '600101')).toBe('600104')
  })

  it('아이디가 없으면 기본값을 준다', () => {
    expect(nextLoginId([], '600101')).toBe('600101')
  })

  it('숫자가 아닌 아이디는 건너뛰고 앞의 0 을 지킨다', () => {
    expect(nextLoginId(['admin', '000009'], '600101')).toBe('000010')
  })
})

describe('loginIdRange', () => {
  it('시작 번호부터 개수만큼 만든다', () => {
    expect(loginIdRange('600104', 3)).toEqual(['600104', '600105', '600106'])
  })

  it('앞의 0 을 지킨다', () => {
    expect(loginIdRange('000998', 3)).toEqual(['000998', '000999', '001000'])
  })
})

describe('nextNameIndex', () => {
  it('접두어 뒤 번호 중 가장 큰 것 다음을 준다', () => {
    expect(nextNameIndex(['근무자1', '근무자3', '강영석'], '근무자')).toBe(4)
  })

  it('공백이 있거나 뒤에 다른 글자가 붙어도 센다', () => {
    expect(nextNameIndex(['시뮬 지점 1', '시뮬 지점 4 (NFC)', '정문'], '시뮬 지점')).toBe(5)
  })

  it('해당하는 이름이 없으면 1', () => {
    expect(nextNameIndex(['정문', '후문'], '시뮬 지점')).toBe(1)
  })

  it('접두어의 특수문자를 글자 그대로 본다', () => {
    expect(nextNameIndex(['A(1) 2', 'AX1) 9'], 'A(1)')).toBe(3)
  })
})
