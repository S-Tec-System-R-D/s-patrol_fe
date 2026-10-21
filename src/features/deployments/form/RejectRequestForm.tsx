import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import { useRejectDeployment } from '../hooks/useRejectDeployment'
import type { RequestKind } from '../types/deployment'
import { rejectRequestSchema, type RejectRequestFormData } from './schema'

interface RejectRequestFormProps {
  /** 배치 · 복귀 — 폼은 같고 API 만 다르다(T659) */
  kind?: RequestKind
  requestSeq: number
  userName: string
  siteSeq: number
  onSuccess: () => void
}

/**
 * 배치 요청 거부 사유 (`spec 039` T645).
 *
 * 🔴 **성공해야 닫는다**(029 규약) — `onSuccess` 는 서버가 받아들인 뒤에만 부른다. 실패하면 모달과
 * 입력이 그대로 남고, 사유는 전역 토스트가 알린다.
 * 🔴 처리 중에는 제출 버튼을 막는다(연타 방지).
 */
const RejectRequestForm = ({
  kind = 'deploy',
  requestSeq,
  userName,
  siteSeq,
  onSuccess,
}: RejectRequestFormProps) => {
  const rejection = useRejectDeployment(siteSeq, kind)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectRequestFormData>({
    resolver: zodResolver(rejectRequestSchema),
  })

  const onSubmit = (data: RejectRequestFormData) => {
    rejection.mutate({ requestSeq, userName, rejectReason: data.reason }, { onSuccess })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="reject-reason" className="text-sm font-medium text-foreground">
          거부 사유
          <span className="ml-1 text-danger">*</span>
        </label>
        <textarea
          id="reject-reason"
          rows={3}
          placeholder="거부 사유를 입력해주세요 (근무자 앱에 노출됩니다)"
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-point focus:ring-2 focus:ring-point/20"
          {...register('reason')}
        />
        {errors.reason && <p className="text-xs text-danger">{errors.reason.message}</p>}
      </div>
      <AppButton variant="destructive" size="full" type="submit" disabled={rejection.isPending}>
        거부
      </AppButton>
    </form>
  )
}

export default RejectRequestForm
