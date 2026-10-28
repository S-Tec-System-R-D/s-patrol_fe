/**
 * 관리자 react-query 키 (`spec 056` T993).
 * - `list`: `GetAdminList` — 토큰 기준이라 파라미터가 없다
 * - `detail`: `GetAdminDetail` — 상세 모달의 사번. 🔴 할당 변경 직전 읽기는 캐시를 거치지 않는다(바로 호출)
 */
export const adminKeys = {
  list: ['admin-list'] as const,
  detail: (userSeq: number) => ['admin-detail', userSeq] as const,
  detailAll: ['admin-detail'] as const,
}
