import { useQuery } from '@tanstack/react-query'

import { getAdminDetail } from '../api/getAdminDetail'
import { adminKeys } from '../queryKeys'

/** 관리자 상세 — 상세 모달의 사번(`spec 056` 사용자 요청 2026-10-28). 목록 행에 사번이 없다 */
export const useAdminDetail = (userSeq: number) =>
  useQuery({ queryKey: adminKeys.detail(userSeq), queryFn: () => getAdminDetail(userSeq) })
