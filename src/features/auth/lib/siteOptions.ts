import type { SiteOption, UserSiteSelectData } from '@/features/auth/types/site'

/**
 * `UserSiteSelect` 응답 → 선택 가능한 사업장 목록.
 *
 * 🔴🔴 **루트도 포함한다**(사용자 결정 2026-10-19 — 설계를 뒤집었다).
 *
 * 처음에는 `children` 만 선택지로 뒀다. 루트(`data.siteSeq`)를 "소속 지사·상위 조직" 으로
 * 읽고 선택 대상이 아니라고 본 것인데, **실데이터가 그 전제를 부정한다**: 루트
 * (`siteSeq 6` `테스트 사업장2`)에 **코스이력 48건·지점 14건·코스 7건**이 붙어 있고
 * children(7·8)은 **전부 0건**이다(실측 2026-10-19). 즉 루트를 빼면 현장관리자가
 * **실데이터에 아예 닿을 수 없다** — `api-spec.md` §2-2 가 "그 데이터는 WEB에서 접근
 * 경로가 없다" 고 경고해 둔 것이 그대로 현실이 됐다.
 *
 * 🔴 **루트와 children 을 동일하게 나열한다** — 계층 표시·들여쓰기를 두지 않는다.
 * 선택의 결과는 `siteSeq` 하나이고, 고르는 사람에게 둘은 같은 종류의 값이다.
 * 순서는 **루트 먼저, 그 다음 children**(응답 순서 그대로).
 *
 * 흡수하는 것은 **서버 내부 불일치 2가지**다(`CLAUDE.md` B4의 어댑터 허용 범위):
 * ① 루트와 `children`의 필드명이 다르다(`siteSeq` ↔ `childSiteSeq`)
 * ② 사이트별로 응답 형태가 다르다(본사 `AdminSiteSelect`는 별도 어댑터 — Phase 5)
 */
export const toSiteOptions = (data: UserSiteSelectData | null | undefined): SiteOption[] => {
  // 응답이 비었거나 형태가 깨진 경우를 "0개"로 수렴시킨다. throw하지 않는다 —
  // 019가 통신 계층에서 에러를 정규화했으므로 여기서 형태를 다시 분기하지 않는다.
  if (!data) return []

  const options: SiteOption[] = []

  /* 🔴 **루트가 첫 선택지다.** `siteSeq` 가 정수가 아니면(누락·null·NaN) 건너뛴다 —
     ID는 `number`(int32)이고(`CLAUDE.md` B4) 깨진 값으로 조회를 날리면 403이 아니라
     200 + 빈 목록이 와서 **조용히 틀린 화면**이 된다(`api-spec.md:211`) */
  if (Number.isInteger(data.siteSeq)) {
    options.push({ siteSeq: data.siteSeq, siteName: data.siteName })
  }

  if (Array.isArray(data.children)) {
    data.children.forEach((child) => {
      options.push({ siteSeq: child.childSiteSeq, siteName: child.childSiteName })
    })
  }

  return options
}
