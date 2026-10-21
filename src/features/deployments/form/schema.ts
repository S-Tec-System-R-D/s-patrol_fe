import z from 'zod'

export const rejectRequestSchema = z.object({
  // 🔴 공백만은 사유가 아니다 — 트림한 뒤 필수(`spec 039` T645). 서버도 같은 이유로 거부한다(가정)
  reason: z.string().trim().min(1, '거부 사유를 입력해주세요.'),
})

export type RejectRequestFormData = z.infer<typeof rejectRequestSchema>
