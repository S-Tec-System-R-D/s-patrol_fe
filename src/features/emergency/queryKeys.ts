/**
 * 비상연락망 react-query 키 (`spec 057` T1017).
 * - `week`: `GetEmergency` — 사업장별 7요일
 * - `tree`: `GetEmergencyUserTree` — 파라미터 없음(전사 후보)
 */
export const emergencyKeys = {
  week: (siteSeq: number) => ['emergency-week', siteSeq] as const,
  tree: ['emergency-tree'] as const,
}
