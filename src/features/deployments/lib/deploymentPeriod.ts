/**
 * 배치 기간 표기 (`spec 039` T656) — 요청 표와 이력 표가 같은 규칙을 쓴다.
 *
 * `'2026-06-03T00:00:00'` ~ `null` → `'2026-06-03 ~ 미정'`.
 * 🔴 종료일이 없으면 **`미정`** 이다 — `현재` 가 아니다. 근무자가 입력하지 않았을 뿐 아직 끝나지 않은 것과
 * 같은 뜻이 아니다(관리자가 복귀일을 지정해야 하는 상태, 배치 로직 4).
 */
export const formatPeriod = (startDt: string, endDt: string | null): string =>
  `${startDt.slice(0, 10)} ~ ${endDt ? endDt.slice(0, 10) : '미정'}`
