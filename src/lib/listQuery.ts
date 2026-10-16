/**
 * 목록 화면의 URL 쿼리 공용 규약 (`spec 036` T493 에서 승격).
 *
 * 🔴 **네 번째 사본이 생기려 해서 올렸다.** `features/courses/lib/courseListParams.ts` ·
 * `features/points/lib/pointListParams.ts` · `features/patrol-zones/lib/courseHistoryOptions.ts`
 * 에 같은 선언이 있었고, `spec 027` 이 **"세 번째 소비처가 생기면 검토"** 로, `spec 023`
 * T373 이 **"함께 판단한다"** 로 적어 둔 바로 그 시점이다(023 에서는 결론이 나지 않았다).
 *
 * ⚠️ **파라미터 변환 함수는 올리지 않는다.** 도메인마다 필터 집합이 달라
 * (`authMethod` / `switchYn`·`courseStatus` / `eventType`·`userName`) 공용화하면 prop 이
 * 아니라 **키 이름 매핑표**를 넘기게 된다 — 그건 변환 함수를 한 번 더 쓰는 것과 같다(A6).
 * 올리는 것은 **세 도메인이 글자까지 같은 것**뿐이다.
 */

/**
 * "전체" 센티넬.
 *
 * 🔴 **URL 에도 서버 파라미터에도 남기지 않는다** — "전체" 는 값이 아니라 **필터 해제**다.
 * 화면 경계에서 `undefined` 로 바꿔 키 자체를 지운다(018 규약, 027 이 테스트로 고정).
 *
 * ⚠️ 빈 문자열을 쓸 수 없어서 센티넬이 필요하다 — radix `Select` 는 `SelectItem` 의 빈
 * 문자열을 **선택 해제용으로 예약**해 두었다.
 */
export const ALL_VALUE = 'ALL'
