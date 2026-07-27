import z from 'zod'

export const rejectRequestSchema = z.object({
  reason: z.string().min(1, '거부 사유를 입력해주세요.'),
})

export type RejectRequestFormData = z.infer<typeof rejectRequestSchema>
