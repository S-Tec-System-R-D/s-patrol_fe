/**
 * 본사 사업장 react-query 키 (`spec 044` T783).
 *
 * 목록은 `GetGroupList` 라 관리그룹 키(`groupKeys.list`)를 쓴다 — 여기는 상세만.
 * `siteSeq` 는 전역 유일이고 본사 화면은 사업장 선택이 없다 — 키에 다른 값이 필요 없다.
 */
export const siteKeys = {
  detail: (siteSeq: number) => ['site-detail', siteSeq] as const,
}
