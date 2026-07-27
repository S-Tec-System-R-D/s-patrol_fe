import z from 'zod'

export const noticeFormSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '본문을 입력해주세요.'),
  sendAppPush: z.boolean(),
})

export type NoticeFormData = z.infer<typeof noticeFormSchema>
