/**
 * 순찰이력 react-query 키.
 *
 * 🔴 **`data-model.md` §8 규약을 그대로 따른다**(022 가 지점에서 세우고 023 이 코스에서
 * 따른 것. 이력이 **세 번째 소비처**다 — 모양을 바꾸면 규약이 관례로 내려앉는다).
 *
 * **규약**
 * 1. 도메인 루트는 문자열 리터럴 1개.
 * 2. 🔴 **스코프 값(`siteSeq`)을 반드시 포함한다.** 빠지면 사업장을 전환했을 때 같은 키에
 *    다른 사업장 데이터가 캐시돼 **이전 사업장 이력이 그대로 보인다.** `siteSeq` 는 URL 에
 *    노출하지 않으므로(`spec 021` DoD #13) 키가 유일한 구분자다.
 * 3. 필터·페이지 파라미터는 **객체 1개로** 마지막에 둔다.
 *
 * 🔴 **코스 관리(`courseKeys`)와 루트를 분리한다.** 코스를 수정해도 **과거 순찰 기록은
 * 바뀌지 않는다** — `courseKeys.detail` 무효화에 딸려 들어가면 기록을 매번 다시 받는다.
 * ⚠️ 반대로 **편성을 바꿔도 지난 이력의 `pointCount` 는 그대로**다(그때의 편성이다).
 *
 * 🔴 **이력에는 무효화가 거의 없다.** `History/*` 는 **GET 8종뿐**이고 쓰기 엔드포인트가
 * 하나도 없다(swagger 전수, `spec 036`) — 프론트가 이력을 바꿀 방법이 없으므로 변경 후
 * 무효화 규약(규약 4)이 **성립하지 않는다**.
 */
export const courseHistoryKeys = {
  /**
   * 코스 상세의 30일 집계용 (`spec 023` B단).
   *
   * 🔴 규약 2 확장: 스코프와 **기간까지** 키에 들어간다 — 기간이 키에 없으면 30일 조회와
   * 다른 기간 조회가 **같은 캐시를 덮어쓴다**.
   */
  history: (siteSeq: number, courseSeq: number, range: { fromDt: string; toDt: string }) =>
    ['course-history', siteSeq, { courseSeq, ...range }] as const,

  /** 미인증 건수 — 같은 이유로 루트를 분리한다 (`spec 023` B·C단) */
  uncheckedCount: (siteSeq: number, courseSeq: number, range: { fromDt: string; toDt: string }) =>
    ['course-unchecked-count', siteSeq, { courseSeq, ...range }] as const,
}
