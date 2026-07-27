import z from 'zod'

const phoneRegex = /^010-\d{4}-\d{4}$/

const workerBaseSchema = z.object({
  name: z.string().min(2, '두 글자 이상 입력해주세요.'),
  phone: z.string().regex(phoneRegex, '010-0000-0000 형식으로 입력해주세요.'),
})

export const addWorkerSchema = workerBaseSchema.extend({
  initialPassword: z.string().min(8, '8자리 이상 입력해주세요.'),
})

export const editWorkerSchema = workerBaseSchema

export type AddWorkerFormData = z.infer<typeof addWorkerSchema>
export type EditWorkerFormData = z.infer<typeof editWorkerSchema>
