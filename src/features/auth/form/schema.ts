import z from 'zod'

/**
 * 로그인 폼 스키마. 현장(`/login`)·본사(`/admin/login`) 공용.
 *
 * 필드명은 서버 요청 DTO(`LoginDto` — `docs/swagger-api.json`)와 동일하게 둬서
 * 폼 ↔ 요청 변환 레이어를 만들지 않는다.
 */

/** 사번 상한. screens.md는 "6자리"지만 자릿수가 늘 수 있어 여유를 둔다(결정 2026-10-06). */
const LOGIN_ID_MAX = 8

export const loginSchema = z.object({
  // 길이만 검증한다. 숫자 전용 제한은 명세에 없어 넣지 않는다 — 실측 계정이 숫자라는 것은
  // 사번 체계가 숫자 전용이라는 근거가 아니다.
  loginId: z
    .string()
    .min(1, '사번을 입력해주세요.')
    .max(LOGIN_ID_MAX, `${LOGIN_ID_MAX}자리 이하로 입력해주세요.`),

  // "8자리"는 최소 길이로 읽는다(결정 2026-10-06). 상한을 두면 더 긴 비밀번호를 쓰는
  // 기존 사용자가 로그인 자체를 못 하게 된다.
  loginPw: z
    .string()
    .min(8, '8자리 이상 입력해주세요.')
    .regex(/[A-Za-z]/, '영문을 1자 이상 포함해주세요.')
    .regex(/[0-9]/, '숫자를 1자 이상 포함해주세요.')
    .regex(/[^A-Za-z0-9]/, '특수문자를 1자 이상 포함해주세요.'),
})

export type LoginFormData = z.infer<typeof loginSchema>
