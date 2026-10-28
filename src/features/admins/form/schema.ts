import z from 'zod'

import { addWorkerSchema, toPhoneDigits } from '@/features/workers/form/schema'
import type { AddAdminRequest } from '../types/admin'

/**
 * 관리자 추가 (`spec 045` T842 → `spec 056` T1001 — `AddAdmin`).
 *
 * 이름 · 사번 · 연락처 · 초기 비밀번호는 **근무자 추가와 같은 규칙**이다 — 로그인 ID 가 사번이고 로그인 화면 규칙을 따라야
 * "만들 수는 있는데 로그인 화면이 거부하는 계정" 이 생기지 않는다(041 판단). 서버는 검사하지 않는다(B-45 · B-60).
 * - 🔴 **매니저는 담당 그룹이 필수**(사용자 결정 2026-10-23) — 마스터는 담당 그룹 칸이 없다.
 * - 비밀번호 확인 칸(사용자 요청 2026-10-23) — 문구는 근무자 비밀번호 변경(`passwordSchema`)과 같다. 서버로 보내지 않는다.
 */
export const addAdminSchema = (requireGroups: boolean) =>
  addWorkerSchema
    .extend({
      loginPwConfirm: z.string().min(1, '한 번 더 입력해주세요.'),
      groupSeqs: z.array(z.number()),
    })
    .refine((data) => data.loginPw === data.loginPwConfirm, {
      message: '비밀번호가 일치하지 않습니다.',
      path: ['loginPwConfirm'],
    })
    .refine((data) => !requireGroups || data.groupSeqs.length > 0, {
      message: '담당 그룹을 하나 이상 선택해주세요.',
      path: ['groupSeqs'],
    })

export type AddAdminFormData = z.infer<ReturnType<typeof addAdminSchema>>

/** 🔴 매니저만 `groupSeq` 를 싣는다(마스터는 전체 담당 — 키 없음) · 연락처는 숫자만(B-45) · 확인 칸은 보내지 않는다 */
export const toAddAdminRequest = (data: AddAdminFormData, codeSeq: number, withGroups: boolean): AddAdminRequest => ({
  codeSeq,
  loginId: data.loginId,
  loginPw: data.loginPw,
  name: data.name,
  phone: toPhoneDigits(data.phone),
  ...(withGroups ? { groupSeq: data.groupSeqs } : {}),
})
