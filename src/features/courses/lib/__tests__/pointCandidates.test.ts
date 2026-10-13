import { describe, expect, it } from 'vitest'

import {
  candidateCounts,
  filterCandidates,
  orderNoOf,
  splitByKeyword,
  toggleSelection,
} from '../pointCandidates'
import type { ClassificationPoint } from '../../types'

/**
 * 편성 후보 고르기 순수 함수 (`spec 028` T402).
 *
 * 🔴 **여기서 고정하는 것은 "눈으로 보기 어려운" 규칙들이다** — 선택 순서가 순번이
 * 된다는 것, 칩 건수가 검색어에 흔들리지 않는다는 것, 중간을 해제하면 뒤 번호가
 * 당겨진다는 것. 전부 화면상으로는 그럴듯하게 그려지므로 테스트가 아니면 못 잡는다.
 */

const point = (pointSeq: number, pointName: string, authMethod: number): ClassificationPoint => ({
  pointSeq,
  pointName,
  memo: null,
  authMethod,
  authMethodName: authMethod === 9 ? 'QR' : 'NFC',
})

const 지하주차장 = point(1, '지하 주차장 B구역', 9)
const 옥외주차장 = point(2, '옥외 주차장 출입구', 10)
const 정문 = point(3, '정문 입구', 9)
const 미실측 = point(4, 'GPS 지점', 99)

const all = [지하주차장, 옥외주차장, 정문, 미실측]

describe('filterCandidates', () => {
  it('이미 편성된 지점을 뺀다 — 서버는 중복을 막지 않으므로 화면이 막는다', () => {
    expect(filterCandidates(all, [1, 3], 'ALL', '')).toEqual([옥외주차장, 미실측])
  })

  it('인증수단으로 거른다', () => {
    expect(filterCandidates(all, [], 'QR', '')).toEqual([지하주차장, 정문])
    expect(filterCandidates(all, [], 'NFC', '')).toEqual([옥외주차장])
  })

  it('🔴 미실측 코드(9·10 외)는 QR·NFC 어느 쪽에도 들어가지 않는다 — 추측 분류를 만들지 않는다', () => {
    expect(filterCandidates(all, [], 'QR', '')).not.toContain(미실측)
    expect(filterCandidates(all, [], 'NFC', '')).not.toContain(미실측)
    expect(filterCandidates(all, [], 'ALL', '')).toContain(미실측)
  })

  it('🔴 칩과 검색어가 **조합**된다 — 둘 다 걸린 것만 남는다', () => {
    expect(filterCandidates(all, [], 'QR', '주차')).toEqual([지하주차장])
  })

  it('검색어 앞뒤 공백을 무시하고, 대소문자를 가리지 않는다', () => {
    expect(filterCandidates(all, [], 'ALL', '  gps  ')).toEqual([미실측])
  })
})

describe('candidateCounts', () => {
  it('🔴 **검색어를 반영하지 않는다** — 입력할 때마다 흔들리면 고르기 전에 참고할 값이 사라진다', () => {
    // 호출부가 넘기는 것은 "편성 제외까지만" 적용한 목록이다
    const assignable = filterCandidates(all, [], 'ALL', '')
    expect(candidateCounts(assignable)).toEqual({ all: 4, qr: 2, nfc: 1 })
  })

  it('편성 제외는 반영한다 — 고를 수 없는 것을 세지 않는다', () => {
    const assignable = filterCandidates(all, [1, 2], 'ALL', '')
    expect(candidateCounts(assignable)).toEqual({ all: 2, qr: 1, nfc: 0 })
  })
})

describe('splitByKeyword', () => {
  it('빈 키워드면 통째로 한 조각이다', () => {
    expect(splitByKeyword('정문 입구', '  ')).toEqual([{ text: '정문 입구', hit: false }])
  })

  it('일치 구간만 hit 으로 나눈다 — 여러 번 나와도 전부', () => {
    expect(splitByKeyword('주차장 옆 주차장', '주차장')).toEqual([
      { text: '주차장', hit: true },
      { text: ' 옆 ', hit: false },
      { text: '주차장', hit: true },
    ])
  })

  it('대소문자를 무시하되 **원문 표기를 그대로** 돌려준다', () => {
    expect(splitByKeyword('GPS 지점', 'gps')).toEqual([
      { text: 'GPS', hit: true },
      { text: ' 지점', hit: false },
    ])
  })
})

describe('toggleSelection', () => {
  it('🔴 추가는 **끝에** 붙는다 — 선택 순서가 곧 편성 순서다', () => {
    const selected = toggleSelection(toggleSelection([], 정문), 지하주차장)
    expect(selected.map((item) => item.pointSeq)).toEqual([3, 1])
  })

  it('해제는 그것만 빼고 나머지 순서를 유지한다', () => {
    const selected = [정문, 지하주차장, 옥외주차장]
    expect(toggleSelection(selected, 지하주차장).map((item) => item.pointSeq)).toEqual([3, 2])
  })
})

describe('orderNoOf', () => {
  it('기존 편성 3개 + 선택 순서 → 4, 5, 6', () => {
    expect([0, 1, 2].map((index) => orderNoOf(3, index))).toEqual([4, 5, 6])
  })

  it('🔴 중간을 해제하면 뒤 번호가 당겨진다 — 번호는 배열 위치에서 나온다', () => {
    const selected = toggleSelection([정문, 지하주차장, 옥외주차장], 지하주차장)
    expect(selected.map((_, index) => orderNoOf(3, index))).toEqual([4, 5])
  })
})
