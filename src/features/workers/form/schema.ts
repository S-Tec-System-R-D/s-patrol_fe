import z from 'zod'

import { loginSchema } from '@/features/auth/form/schema'

const phoneRegex = /^010-\d{4}-\d{4}$/

const workerBaseSchema = z.object({
  name: z.string().min(2, '두 글자 이상 입력해주세요.'),
  phone: z.string().regex(phoneRegex, '010-0000-0000 형식으로 입력해주세요.'),
})

/**
 * 근무자 추가 (`spec 041` T686) — 필드명은 swagger 그대로(`loginId`·`loginPw`).
 *
 * 🔴 **사번·비밀번호 규칙은 로그인 스키마를 그대로 쓴다.** 서버는 아무것도 검사하지 않아(B-45 —
 * 비밀번호 `12` 도 저장된다) 여기서 막지 않으면 **만들 수는 있는데 로그인 화면이 거부하는 계정**이 생긴다.
 */
export const addWorkerSchema = workerBaseSchema.extend({
  loginId: loginSchema.shape.loginId,
  loginPw: loginSchema.shape.loginPw,
})

export const editWorkerSchema = workerBaseSchema

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>
export type EditWorkerFormData = z.infer<typeof editWorkerSchema>

/** `010-1234-5678` → `01012345678` — 🔴 서버는 보낸 그대로 저장한다(B-45). 기존 데이터는 숫자만이다 */
export const toPhoneDigits = (phone: string): string => phone.replace(/-/g, '')

/**
 * 비밀번호 변경 (`spec 041` US3) — 관리자가 **새 값을 지정**한다(사용자 결정 2026-10-21, OQ-038-C).
 * 규칙은 로그인과 같다 — 서버는 `12` 도 받는다(B-45). 확인 칸은 서버로 보내지 않는다.
 */
export const passwordSchema = z
  .object({
    loginPw: loginSchema.shape.loginPw,
    confirm: z.string().min(1, '한 번 더 입력해주세요.'),
  })
  .refine((data) => data.loginPw === data.confirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirm'],
  })

export type PasswordFormData = z.infer<typeof passwordSchema>
