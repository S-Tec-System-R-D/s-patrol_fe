import z from 'zod'

import type { AddSiteRequest } from '../types/site'

/**
 * 사업장 추가 · 정보 수정 (`spec 044` T793).
 *
 * - 주소 필수는 **목업 규칙**이다 — 서버는 비워도 받는다(실측 2026-10-23).
 * - 연락처는 형식 검사를 하지 않는다 — 서버도 하지 않고 실데이터에 `'333'` · `'string'` 이 있다.
 * - `groupSeq` 는 `AppSelect` 값이라 문자열로 들고, 요청을 만들 때 숫자로 바꾼다.
 */
export const siteSchema = z.object({
  siteName: z.string().trim().min(1, '사업장명을 입력해주세요.'),
  groupSeq: z.string().min(1, '소속 그룹을 선택해주세요.'),
  address: z.string().trim().min(1, '주소를 입력해주세요.'),
  tel: z.string().trim(),
})

export type SiteFormData = z.infer<typeof siteSchema>

/** 🔴 빈 연락처는 **보내지 않는다**(생략 = `null` 저장). 헬스체크 · `exceptionTime` 도 싣지 않는다(B-52 — US4 에서 켠다) */
export const toAddSiteRequest = (data: SiteFormData): AddSiteRequest => ({
  groupSeq: Number(data.groupSeq),
  siteName: data.siteName,
  address: data.address,
  ...(data.tel ? { tel: data.tel } : {}),
})
