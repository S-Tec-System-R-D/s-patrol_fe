import type { SiteOption, UserSiteSelectData } from '@/features/auth/types/site'

/**
 * `UserSiteSelect` 응답 → 선택 가능한 사업장 목록.
 *
 * 흡수하는 것은 **서버 내부 불일치 2가지**다(`CLAUDE.md` B4의 어댑터 허용 범위):
 * ① 루트와 `children`의 필드명이 다르다(`siteSeq` ↔ `childSiteSeq`)
 * ② 사이트별로 응답 형태가 다르다(본사 `AdminSiteSelect`는 별도 어댑터 — Phase 5)
 *
 * 🔴 **루트는 버린다.** 루트(`data.siteSeq`)는 소속 지사·상위 조직이고 선택 대상이
 * 아니다(`api-spec.md` §2-2). 테스트 데이터의 루트(`siteSeq 6`)에도 지점 7건·코스 6건이
 * 붙어 있어 포함시키고 싶어지지만, 규칙은 `children` 만이다.
 */
export const toSiteOptions = (data: UserSiteSelectData | null | undefined): SiteOption[] => {
  // 응답이 비었거나 `children`이 배열이 아닌 경우를 "0개"로 수렴시킨다. throw하지 않는다 —
  // 019가 통신 계층에서 에러를 정규화했으므로 여기서 형태를 다시 분기하지 않는다.
  // 0개일 때 서버가 빈 배열을 주는지 에러를 주는지는 미실측이다(`spec 021` OQ-021-A).
  if (!data || !Array.isArray(data.children)) return []

  return data.children.map((child) => ({
    siteSeq: child.childSiteSeq,
    siteName: child.childSiteName,
  }))
}
