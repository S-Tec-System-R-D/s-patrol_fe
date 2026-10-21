import z from 'zod'

/**
 * 공지 작성·수정 폼 (`spec 040` T665) — 필드명은 swagger 그대로(`description`·`isPin`).
 *
 * - 앱 푸시 체크박스는 없다 — 요청 필드가 없다(B-42, 사용자 결정 2026-10-21)
 * - 🔴 공백만은 거부(트림) — 서버는 `''` 를 "변경 없음" 으로 무시해 수정으로는 비울 수도 없다
 * - 첨부(`File[]`)는 폼 밖 상태로 둔다 — 검증 규칙이 zod 가 아니라 선택 단계(`lib/noticeAttach`)에 있다
 */
export const noticeFormSchema = z.object({
  title: z.string().trim().min(1, '제목을 입력해주세요.'),
  description: z.string().trim().min(1, '본문을 입력해주세요.'),
  isPin: z.boolean(),
})

export type NoticeFormData = z.infer<typeof noticeFormSchema>
