import { toast } from 'sonner'

/**
 * 표준 사용자 알림 헬퍼.
 * - sonner의 `toast`를 얇게 감싸 success/error/info/warning 4종으로 통일.
 * - mutation 전역 에러 toast(`queryClient.ts`)도 `notify.error`를 호출.
 * - 메시지 톤은 docs/design-system.md 콘텐츠 톤 따름.
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
}
