import { useQuery } from '@tanstack/react-query'

import { fetchCourseHistoryDetail } from '../api/getCourseHistoryDetail'
import { fetchCourseHistoryCheckDetails } from '../api/getCourseHistoryCheckDetails'
import { courseHistoryKeys } from '../queryKeys'

/**
 * 코스 순찰 상세 — 회차 정보 + 지점 인증 내역 (`spec 036` T497).
 *
 * 🔴 **계획은 "4호출을 묶는다" 였는데 2호출로 줄였다**(2026-10-16 구현 판단). 나머지 둘은
 * 여기서 부르지 않는다:
 *
 * | 호출 | 어디서 | 왜 여기가 아닌가 |
 * |---|---|---|
 * | `GetCourseDetail`(지도의 미인증 핀 좌표) | **페이지가 `useCourseDetail`(courses) 재사용** | 🔴 여기서 부르면 `course-history → courses` **역방향 의존**이 생긴다. T488 에서 `elapsed.ts` 까지 옮겨 **코스 관리 → 이력** 한 방향으로 정리한 것을 되돌리게 된다. 페이지(`pages/`)는 양쪽을 import 해도 정상이다 |
 * | 코스 평균(`GetCourseHistory?courseSeq&eventType=1`) | **`useCourseAverage`(별 훅)** | 🔴 **상세와 생애가 다르다.** 평균은 회차가 바뀌어도 같은 코스면 그대로라 캐시가 공유돼야 하는데, 상세 훅에 묶으면 `historySeq` 마다 다시 받는다 |
 *
 * ⚠️ **기존 훅을 다시 만들지 않는다**(A6) — `useCourseDetail` 은 022·027·023 이 쓰던
 * 것이고 캐시도 공유된다(같은 코스를 관리 화면에서 이미 봤다면 요청이 아예 안 나간다).
 */

const NO_HISTORY = -1

export const useCourseHistoryDetail = (historySeq: number | null) =>
  useQuery({
    queryKey: courseHistoryKeys.detail(historySeq ?? NO_HISTORY),
    queryFn: () => fetchCourseHistoryDetail(historySeq as number),
    enabled: historySeq !== null,
  })

/**
 * 지점 인증 내역.
 *
 * 🔴 **요청 1회로 네 자리를 채운다** — 인증 내역 표 · 지도의 인증 핀 · KPI 3종 · 메모.
 * 그래서 상세와 **별 쿼리로 둔다**: 응답이 다르고(배열 직접) 크기도 다르며, 한쪽만 다시
 * 받아야 할 때가 있다.
 */
export const useCourseHistoryCheckDetails = (historySeq: number | null) =>
  useQuery({
    queryKey: courseHistoryKeys.checkDetails(historySeq ?? NO_HISTORY),
    queryFn: () => fetchCourseHistoryCheckDetails(historySeq as number),
    enabled: historySeq !== null,
  })
