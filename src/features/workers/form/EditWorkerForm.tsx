import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { useMe } from '@/features/auth/hooks/useMe'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { Worker } from '../types/worker'
import { editWorkerSchema, type EditWorkerFormData } from './schema'

interface EditWorkerFormProps {
  worker: Worker
}

const EditWorkerForm = ({ worker }: EditWorkerFormProps) => {
  const { data: me } = useMe()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditWorkerFormData>({
    resolver: zodResolver(editWorkerSchema),
    defaultValues: {
      name: worker.name,
      phone: worker.phone,
    },
  })

  const onSubmit = (data: EditWorkerFormData) => {
    console.log('============FORM============')
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AppInput
        label="이름"
        required
        placeholder="이름을 입력해주세요"
        error={errors.name?.message}
        {...register('name')}
      />
      <AppInput
        label="연락처"
        required
        placeholder="010-0000-0000"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <AppInput label="소속 사업장" value={me?.locationName ?? ''} disabled readOnly />
      <AppButton size="full" type="submit">
        저장
      </AppButton>
    </form>
  )
}

export default EditWorkerForm
