import type { CourseDetailPoint, UpdateCoursePointRequest } from '../types'

/**
 * 지점 편성 **초안**(draft)과 순서 계산 (`spec 023` Phase 4, T367).
 *
 * 🔴 **순서 계산을 컴포넌트에서 빼냈다.** 드래그·추가·제거는 전부 "배열을 어떻게 바꾸는가"
 * 이고, `dnd-kit` 은 **jsdom 에서 실제 드래그를 흉내낼 수 없다**(레이아웃 측정이 전부 0
 * 이라 센서가 움직이지 않는다). 순서 로직이 컴포넌트 안에 있으면 **테스트할 길이 없다** —
 * 그래서 순수 함수로 꺼내 단위 테스트로 고정하고, 실제 드래그 동작은 브라우저 확인
 * (T377)에서 본다.
 */

/**
 * 편집 중인 편성 행 1건.
 *
 * 🔴 **`key` 가 따로 있는 이유**: `dnd-kit` 의 `SortableContext` 는 안정적인 id 를
 * 요구하는데, **새로 추가한 행은 `coursePointSeq` 가 없다**(서버가 저장할 때 부여한다).
 * `pointSeq` 로 대신할 수도 없다 — 🔴 **같은 지점을 한 코스에 두 번 넣을 수 있다**
 * (실측 2026-10-12: 서버가 받아들이고 각각 다른 `coursePointSeq` 를 준다). id 가 겹치면
 * 드래그가 엉뚱한 행을 집는다.
 */
export interface CoursePointDraft {
  /** 드래그 id. 기존 행은 `cp-{coursePointSeq}`, 새 행은 `new-{n}` */
  key: string
  /** 기존 편성 행의 식별자. 🔴 새 행은 `null` — 보내면 서버가 새로 부여한다 */
  coursePointSeq: number | null
  pointSeq: number
  pointName: string
  authMethod: number
  /**
   * 🔴 표시 전용. **항상 `true` 다** — 서버가 지점의 실제 사용여부를 따라오지 않는다
   * (실측 2026-10-13). 코스에서 바꿀 값이 아니므로 요청 DTO 에 없는 것도 정상이다
   * (B-29 철회). 자세한 사정은 `CoursePointList` 상단 주석.
   */
  useYn: boolean
  courseMin: number
}

/** 상세 응답 → 초안. **`orderNo` 순으로 세운다** — 응답 순서를 믿지 않는다 */
export const toDrafts = (points: CourseDetailPoint[]): CoursePointDraft[] =>
  [...points]
    .sort((a, b) => a.orderNo - b.orderNo)
    .map((point) => ({
      key: `cp-${point.coursePointSeq}`,
      coursePointSeq: point.coursePointSeq,
      pointSeq: point.pointSeq,
      pointName: point.pointName,
      authMethod: point.authMethod,
      useYn: point.useYn,
      courseMin: point.courseMin,
    }))

/** 새로 추가하는 행의 `key`. 추가·제거를 반복해도 겹치지 않게 **누적 번호**를 쓴다 */
export const newDraftKey = (serial: number): string => `new-${serial}`

/**
 * 드래그 결과 반영 — `activeKey` 행을 `overKey` 행의 자리로 옮긴다.
 *
 * 둘 중 하나라도 없거나 같으면 **원본을 그대로** 돌려준다(새 배열을 만들지 않는다) —
 * 호출부가 참조 비교로 "바뀐 것 없음" 을 알 수 있다.
 */
export const moveDraft = (
  drafts: CoursePointDraft[],
  activeKey: string,
  overKey: string
): CoursePointDraft[] => {
  if (activeKey === overKey) return drafts
  const from = drafts.findIndex((draft) => draft.key === activeKey)
  const to = drafts.findIndex((draft) => draft.key === overKey)
  if (from < 0 || to < 0) return drafts

  const next = [...drafts]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * 초안 → `UpdateCourse.points`.
 *
 * 🔴🔴 **`orderNo` 를 배열 순서대로 1..N 으로 다시 매긴다.** 제거한 행의 번호를 비워 두면
 * (예: 1·3·4) 순서의 의미가 "배열 순서" 와 "번호" 두 가지로 갈린다. 🔴 서버는 **중복
 * `orderNo` 도 그대로 저장하고 고쳐 주지 않는다**(실측 2026-10-12: 둘 다 `orderNo: 1` 로
 * 저장됐다) — 재부여는 **우리 책임**이다. 빠뜨리면 다음 조회에서 순서가 무너진다.
 *
 * 🔴 **`memo` 는 항상 `null`** — 쓰기 전용이라 보존할 방법이 없다(B-30,
 * `lib/updateCourseBody.ts` 주석 참조). 구간 메모 UI 를 만들지 않는 이유다.
 */
export const toOrderedPoints = (drafts: CoursePointDraft[]): UpdateCoursePointRequest[] =>
  drafts.map((draft, index) => ({
    pointSeq: draft.pointSeq,
    coursePointSeq: draft.coursePointSeq,
    orderNo: index + 1, // 🔴 1..N 재부여
    memo: null,
    courseMin: draft.courseMin,
  }))

/**
 * 초안이 서버 상태와 **다른가**.
 *
 * 저장 버튼을 켜고 끄는 데 쓴다 — 바뀐 것이 없는데 저장을 누르면 전량 전송이 한 번 더
 * 나가고, `coursePointSeq` 가 보존되더라도 **의미 없는 쓰기**다.
 */
export const isDirty = (drafts: CoursePointDraft[], points: CourseDetailPoint[]): boolean => {
  const base = toDrafts(points)
  if (base.length !== drafts.length) return true
  return drafts.some(
    (draft, index) =>
      draft.key !== base[index].key || draft.courseMin !== base[index].courseMin
  )
}
