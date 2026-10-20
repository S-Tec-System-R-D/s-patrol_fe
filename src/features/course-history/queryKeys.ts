import type { CourseHistoryParams, PointHistoryParams } from './types'

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
   * 목록 쿼리 전체의 접두사. 무효화 단위다.
   *
   * ⚠️ 이름이 `all` 이 아니라 `lists` 인 이유: 상세는 루트가 `'course-history-detail'` 로
   * 달라 이 접두사에 **걸리지 않는다**. `all` 로 두면 "전부 무효화된다" 고 오해한다
   * (022→023 승계).
   */
  lists: ['course-history-list'] as const,

  /**
   * 목록 쿼리 키 (`spec 036` T495). `CourseHistoryParams` 를 통째로 받아 `siteSeq` 누락을
   * **타입으로 막는다**.
   */
  list: (params: CourseHistoryParams) =>
    ['course-history-list', params.siteSeq, params] as const,

  /** 회차 상세 키. 🔴 스코프가 `historySeq` 라 `siteSeq` 가 필요 없다 — 회차는 전역 유일하다 */
  detail: (historySeq: number) => ['course-history-detail', historySeq] as const,

  /**
   * 지점 인증 내역 키.
   *
   * 🔴 **루트를 상세와 분리한다.** 한 요청으로 네 자리를 채우지만(표·지도·KPI·메모)
   * 상세와 **응답이 다르고 크기도 다르다** — 같은 키에 묶으면 한쪽만 다시 받을 수 없다.
   */
  checkDetails: (historySeq: number) => ['course-history-check-details', historySeq] as const,

  /**
   * 코스 평균 소요시간 키 (`spec 036` T498).
   *
   * 🔴 **기간이 키에 없다** — 평균은 **전 기간 완료 건** 기준이다(기간을 좁히면 평균이
   * 화면마다 달라져 "이 코스의 평균" 이라고 부를 수 없다). 대신 `eventType` 을 키에 넣어
   * 완료만 센 것임을 드러낸다.
   */
  courseAverage: (siteSeq: number, courseSeq: number) =>
    ['course-history-average', siteSeq, { courseSeq, eventType: 1 }] as const,

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

/**
 * 지점 순찰이력 키 (`spec 037` T532).
 *
 * 🔴 **`courseHistoryKeys` 와 루트를 분리한다.** 같은 `History/*` 도메인이지만 **응답이
 * 다르고 무효화 단위도 다르다** — 한 접두사에 묶으면 코스 목록을 다시 받을 때 지점 목록도
 * 함께 버려진다.
 *
 * 규약은 `courseHistoryKeys` 와 같다(`data-model.md` §8): 루트 문자열 1개 · **`siteSeq`
 * 포함** · 필터는 객체 1개로 마지막.
 */
export const pointHistoryKeys = {
  /** 목록 쿼리 전체의 접두사. ⚠️ 상세는 루트가 달라 **여기에 걸리지 않는다** */
  lists: ['point-history-list'] as const,

  /**
   * 목록 쿼리 키. `PointHistoryParams` 를 통째로 받아 **`siteSeq` 누락을 타입으로 막는다.**
   *
   * 🔴 `siteSeq` 가 키에 없으면 사업장을 전환했을 때 같은 키에 다른 사업장 데이터가 캐시돼
   * **이전 사업장 이력이 그대로 보인다** — `siteSeq` 는 URL 에 노출하지 않으므로(`spec 021`
   * DoD #13) 키가 유일한 구분자다.
   *
   * ⚠️ 지점 상세(027)가 쓰는 `pointSeq` 조회도 **같은 엔드포인트**다 — `params` 에
   * `pointSeq` 가 들어가 키가 갈리므로 두 화면의 캐시가 섞이지 않는다.
   */
  list: (params: PointHistoryParams) => ['point-history-list', params.siteSeq, params] as const,

  /**
   * 인증 1건 상세 키.
   *
   * 🔴 **스코프가 `detailSeq` 라 `siteSeq` 가 필요 없다** — 인증 1건은 전역 유일하다
   * (코스 쪽 `detail(historySeq)` 와 같은 판단).
   */
  detail: (detailSeq: number) => ['point-history-detail', detailSeq] as const,
}
