import z from 'zod'

import type { AddSiteRequest, UpdateSiteRequest } from '../types/site'

/** 모 사업장 "없음"(최상위) — 🔴 `AppSelect`(radix) 는 빈 문자열 값을 못 쓴다 */
export const NO_PARENT = 'none'

/**
 * 사업장 추가 · 정보 수정 (`spec 044` T793 · `spec 051` T931).
 *
 * - 주소 필수는 **목업 규칙**이다 — 서버는 비워도 받는다(실측 2026-10-23).
 * - 연락처는 형식 검사를 하지 않는다 — 서버도 하지 않고 실데이터에 `'333'` · `'string'` 이 있다.
 * - `groupSeq`(지사) · `parentSiteSeq` 는 `AppSelect` 값이라 문자열로 들고, 요청을 만들 때 숫자로 바꾼다.
 *   본부는 지사 선택지를 거르는 화면 상태라 여기 없다(`SiteForm`).
 */
export const siteSchema = z.object({
  siteName: z.string().trim().min(1, '사업장명을 입력해주세요.'),
  groupSeq: z.string().min(1, '지사를 선택해주세요.'),
  parentSiteSeq: z.string(),
  address: z.string().trim().min(1, '주소를 입력해주세요.'),
  tel: z.string().trim(),
})

export type SiteFormData = z.infer<typeof siteSchema>

/**
 * 🔴 빈 연락처 · 모 사업장 "없음" 은 **보내지 않는다**(생략 = `null` 저장 · 최상위).
 * 헬스체크 · `exceptionTime` 도 싣지 않는다(B-52 — US4 에서 켠다).
 */
export const toAddSiteRequest = (data: SiteFormData): AddSiteRequest => ({
  groupSeq: Number(data.groupSeq),
  siteName: data.siteName,
  address: data.address,
  ...(data.tel ? { tel: data.tel } : {}),
  ...(data.parentSiteSeq !== NO_PARENT ? { parentSiteSeq: Number(data.parentSiteSeq) } : {}),
})

/**
 * 정보 수정 바디 — 🔴 **연락처는 늘 싣는다**: 지웠으면 `""` 라야 지워진다(생략·`null` 은 유지, 실측).
 * 🔴 하위 사업장은 `groupSeq` 를 싣지 않는다 — 바꿀 수 없다(서버 400). 모 사업장은 DTO 에 없다.
 */
export const toUpdateSiteRequest = (siteSeq: number, data: SiteFormData, canMove: boolean): UpdateSiteRequest => ({
  siteSeq,
  siteName: data.siteName,
  address: data.address,
  tel: data.tel,
  ...(canMove ? { groupSeq: Number(data.groupSeq) } : {}),
})
