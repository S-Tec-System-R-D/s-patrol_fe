import AppButton from '@/components/app/AppButton'
import { notify } from '@/lib/notify'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useDeploymentStore } from '../store/deploymentStore'
import type { DeploymentRequestSummary } from '../types/deployment'
import { rejectRequestSchema, type RejectRequestFormData } from './schema'

interface RejectRequestFormProps {
  request: DeploymentRequestSummary
  onSuccess: () => void
}

const RejectRequestForm = ({ request, onSuccess }: RejectRequestFormProps) => {
  const reject = useDeploymentStore((state) => state.reject)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectRequestFormData>({
    resolver: zodResolver(rejectRequestSchema),
  })

  const onSubmit = (data: RejectRequestFormData) => {
    reject(request.id, data.reason)
    notify.success(`${request.workerName}님의 배치 요청을 거부했습니다.`)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          거부 사유
          <span className="ml-1 text-danger">*</span>
        </label>
        <textarea
          rows={3}
          placeholder="거부 사유를 입력해주세요 (근무자 앱에 노출됩니다)"
          className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-point focus:ring-2 focus:ring-point/20"
          {...register('reason')}
        />
        {errors.reason && <p className="text-xs text-danger">{errors.reason.message}</p>}
      </div>
      <AppButton variant="destructive" size="full" type="submit">
        거부
      </AppButton>
    </form>
  )
}

export default RejectRequestForm
