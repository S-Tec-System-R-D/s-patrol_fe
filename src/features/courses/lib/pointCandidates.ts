import { toAuthMethodLabel } from '@/features/points/lib/authMethod'
import type { AuthMethod } from '@/types/enum'

import type { ClassificationPoint } from '../types'

/**
 * 코스 편성 **후보 고르기** 순수 함수 (`spec 028` Phase 1).
 *
 * 🔴 **로직을 모달에서 빼냈다**(023 `coursePointOrder.ts` 와 같은 이유). 선택 순서·순번·
 * 필터 조합은 **눈으로 보기 어려운 종류의 버그**다 — 모달 안에 두면 렌더 없이는 테스트할
 * 수 없고, 틀려도 화면은 그럴듯하게 그려진다.
 *
 * ⚠️ **여기서 거르는 것은 서버가 거를 수단을 주지 않기 때문이다.** 목록 화면의
 * "클라이언트 필터 0건" 규칙과 반대로 보이지만 성격이 다르다 — `GetClassificationPoint`
 * 에는 검색·필터 파라미터가 **없고** 페이징도 없어 사업장 지점이 전량 내려온다.
 */

/** 필터 칩 값. `'QR' | 'NFC'` 는 Enum SSOT(`types/enum.ts`)를 그대로 쓴다 */
export type CandidateFilter = 'ALL' | AuthMethod

/**
 * 후보 거르기 — **편성 제외 → 인증수단 → 이름** 순.
 *
 * 🔴 **이미 편성된 지점을 뺀다.** 서버는 같은 지점의 중복 편성을 **막지 않는다**
 * (실측 2026-10-12: 각각 다른 `coursePointSeq` 를 준다). 화면이 막는 규칙이다.
 *
 * ⚠️ **미사용 지점은 애초에 내려오지 않는다** — 서버가 후보에서 제외한다(실측
 * 2026-10-13). 여기서 다시 거르지 않는다.
 */
export const filterCandidates = (
  all: ClassificationPoint[],
  assignedPointSeqs: number[],
  filter: CandidateFilter,
  keyword: string
): ClassificationPoint[] => {
  const needle = keyword.trim().toLowerCase()

  return all.filter((point) => {
    if (assignedPointSeqs.includes(point.pointSeq)) return false
    if (filter !== 'ALL' && toAuthMethodLabel(point.authMethod) !== filter) return false
    if (needle && !point.pointName.toLowerCase().includes(needle)) return false
    return true
  })
}

/**
 * 칩에 붙는 건수.
 *
 * 🔴 **검색어를 반영하지 않는다**(사용자 결정 2026-10-13). 입력할 때마다 `QR 8 → 3 → 1`
 * 로 흔들리면 칩이 "얼마나 있나" 가 아니라 "지금 몇 개 보이나" 가 되어, **필터를 고르기
 * 전에 참고할 값이 사라진다.** 목업도 검색어가 들어간 상태에서 `전체 12 / QR 8 / NFC 4`
 * 를 유지하고 결과 건수는 아래에 따로 적는다.
 *
 * @param assignable **편성 제외까지만** 적용한 목록
 */
export const candidateCounts = (assignable: ClassificationPoint[]) => {
  let qr = 0
  let nfc = 0

  for (const point of assignable) {
    const label = toAuthMethodLabel(point.authMethod)
    if (label === 'QR') qr += 1
    else if (label === 'NFC') nfc += 1
    // 미실측 코드(9·10 외)는 어느 칩에도 세지 않는다 — 추측 분류를 만들지 않는다(A1)
  }

  return { all: assignable.length, qr, nfc }
}

/** 하이라이트 조각. `hit` 인 구간만 강조해 그린다 */
export interface KeywordChunk {
  text: string
  hit: boolean
}

/**
 * 검색어 하이라이트용 분할. **대소문자를 무시**하되 원문 표기는 그대로 돌려준다.
 * 빈 키워드면 통째로 한 조각(`hit: false`)이다.
 */
export const splitByKeyword = (text: string, keyword: string): KeywordChunk[] => {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return [{ text, hit: false }]

  const haystack = text.toLowerCase()
  const chunks: KeywordChunk[] = []
  let cursor = 0

  for (;;) {
    const found = haystack.indexOf(needle, cursor)
    if (found === -1) break
    if (found > cursor) chunks.push({ text: text.slice(cursor, found), hit: false })
    chunks.push({ text: text.slice(found, found + needle.length), hit: true })
    cursor = found + needle.length
  }

  if (cursor < text.length) chunks.push({ text: text.slice(cursor), hit: false })
  return chunks
}

/**
 * 선택 토글.
 *
 * 🔴 **순서가 곧 순번이다** — 추가는 **끝에**, 해제는 제거하고 나머지 순서를 유지한다.
 * 중간 것을 해제하면 뒤 번호가 당겨지는 동작이 여기서 나온다.
 */
export const toggleSelection = (
  selected: ClassificationPoint[],
  point: ClassificationPoint
): ClassificationPoint[] =>
  selected.some((item) => item.pointSeq === point.pointSeq)
    ? selected.filter((item) => item.pointSeq !== point.pointSeq)
    : [...selected, point]

/**
 * 행에 표시할 순번 = **기존 편성 수 + 선택 순서**.
 *
 * ⚠️ **표시 전용이다.** 실제 `orderNo` 는 저장 시 `coursePointOrder.ts` 가 초안 배열
 * 기준으로 1..N 을 다시 매긴다 — 담은 뒤 드래그로 옮길 수 있으므로 여기 숫자는 "지금
 * 담으면 몇 번째" 라는 뜻이다.
 */
export const orderNoOf = (assignedCount: number, index: number): number =>
  assignedCount + index + 1
