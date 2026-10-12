import type { CourseListParams } from './types'

/**
 * 순찰코스 react-query 키.
 *
 * 🔴 **`data-model.md` §8 규약을 그대로 따른다**(022 가 세운 첫 규약, `features/points/
 * queryKeys.ts` 와 같은 모양). 코스가 **두 번째 소비처**다 — 모양을 바꾸면 규약이
 * "지점만의 관례" 로 내려앉는다.
 *
 * **규약**
 * 1. 도메인 루트는 문자열 리터럴 1개 — 목록 `'courses'`, 상세 `'course'`.
 * 2. 🔴 **스코프 값(`siteSeq`)을 반드시 포함한다.** 빠지면 사업장을 전환했을 때 같은 키에
 *    다른 사업장 데이터가 캐시돼 **이전 사업장 코스가 그대로 보인다.** `siteSeq` 는
 *    URL 에 노출하지 않으므로(`spec 021` DoD #13) 키가 유일한 구분자다.
 * 3. 필터·페이지 파라미터는 **객체 1개로** 마지막에 둔다.
 * 4. 변경 성공 시 `courseKeys.lists` 로 목록 전체를, 수정은 `courseKeys.detail(courseSeq)`
 *    를 **함께** 무효화한다.
 */

export const courseKeys = {
  /**
   * 목록 쿼리 전체의 접두사. 무효화 단위다.
   *
   * ⚠️ 이름이 `all` 이 아니라 `lists` 인 이유: 상세는 루트가 `'course'` 로 달라 이
   * 접두사에 **걸리지 않는다**. `all` 로 두면 "전부 무효화된다" 고 오해한다(022 승계).
   */
  lists: ['courses'] as const,

  /**
   * 목록 쿼리 키. `CourseListParams` 를 통째로 받아 `siteSeq` 누락을 **타입으로 막는다**.
   */
  list: (params: CourseListParams) => ['courses', params.siteSeq, params] as const,

  /** 상세 쿼리 키. 수정·편성 후 이 키만 따로 무효화한다 */
  detail: (courseSeq: number) => ['course', courseSeq] as const,

  /**
   * 편성 후보 지점 키.
   *
   * 루트를 **따로 둔다** — 코스를 수정해도 사업장의 지점 후보는 바뀌지 않으므로
   * `lists`·`detail` 무효화에 딸려 들어가면 안 된다(불필요한 재조회). 반대로 지점을
   * 추가·삭제하면 후보가 바뀌는데, 그 무효화는 **지점 쪽 변경계가 할 일**이다.
   */
  classificationPoints: (siteSeq: number) => ['course-point-candidates', siteSeq] as const,

  /**
   * 코스 순찰이력 키 (B단).
   *
   * 🔴 **루트를 따로 둔다**(`'course-history'`). 코스를 수정해도 **과거 순찰 기록은
   * 바뀌지 않는다** — `detail` 무효화에 딸려 들어가면 기록을 매번 다시 받는다.
   * ⚠️ 반대로 **편성을 바꿔도 지난 이력의 `pointCount` 는 그대로**다(그때의 편성이다).
   *
   * 🔴 규약 2: 스코프(`siteSeq`)와 **기간까지** 키에 들어간다 — 기간이 키에 없으면
   * 30일 조회와 다른 기간 조회가 **같은 캐시를 덮어쓴다**.
   */
  history: (siteSeq: number, courseSeq: number, range: { fromDt: string; toDt: string }) =>
    ['course-history', siteSeq, { courseSeq, ...range }] as const,

  /** 미인증 건수 키 — 같은 이유로 루트를 분리한다 */
  uncheckedCount: (siteSeq: number, courseSeq: number, range: { fromDt: string; toDt: string }) =>
    ['course-unchecked-count', siteSeq, { courseSeq, ...range }] as const,
}
