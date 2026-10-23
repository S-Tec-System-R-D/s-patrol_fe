/**
 * 관리그룹 react-query 키 (`spec 043` T739).
 *
 * 트리는 토큰의 사용자 기준으로 서버가 정한다(파라미터 없음) — 키에 넣을 것이 없다.
 * - `tree`: `AdminSiteSelect` — 좌측 관리그룹 패널 · 편집 모달
 * - `list`: `GetGroupList` — 사업장 목록(`spec 044`)
 */
export const groupKeys = {
  tree: ['group-tree'] as const,
  list: ['group-list'] as const,
}
