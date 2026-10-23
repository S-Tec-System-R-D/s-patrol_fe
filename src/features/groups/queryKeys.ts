/**
 * 관리그룹 react-query 키 (`spec 043` T739).
 *
 * 트리는 토큰의 사용자 기준으로 서버가 정한다(파라미터 없음) — 키에 넣을 것이 없다.
 * - `tree`: `AdminSiteSelect` — 좌측 관리그룹 패널 · 편집 모달
 * - `list`: `GetGroupList` — 사업장 목록(`spec 044`)
 * - `admins`: `GetGroupAdminList` — 그룹별 관리자 할당(`spec 044` 사업장 상세 담당 관리자 탭)
 */
export const groupKeys = {
  tree: ['group-tree'] as const,
  list: ['group-list'] as const,
  admins: (groupSeq: number) => ['group-admins', groupSeq] as const,
  /** 모든 그룹의 할당 — 관리자 담당 그룹 변경(`spec 045`)이 무효화한다 */
  adminsAll: ['group-admins'] as const,
}
