/**
 * 배치 기간 표기 (`spec 039` T656) — 요청 표 · 이력 표 · 근무자 상세가 같은 규칙을 쓴다.
 *
 * `'2026-06-03T00:00:00'` ~ `null` → `'2026-06-03 ~ 미정'`.
 * 🔴 종료일이 없으면 **`미정`** 이다 — `현재` 가 아니다. 근무자가 종료일을 입력하지 않았을 뿐이다.
 * ⚠️ 복귀 승인 시각(`completeDt`)은 쓰지 않는다 — 지금 값은 테스트 값이다(`spec 042` OQ-042-E).
 */
export const formatPeriod = (startDt: string, endDt: string | null): string =>
  `${startDt.slice(0, 10)} ~ ${endDt ? endDt.slice(0, 10) : '미정'}`
