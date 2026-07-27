import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { useMe } from '@/features/auth/hooks/useMe'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { addWorkerSchema, type AddWorkerFormData } from './schema'

const AddWorkerForm = () => {
  const { data: me } = useMe()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddWorkerFormData>({
    resolver: zodResolver(addWorkerSchema),
    defaultValues: {
      name: '',
      phone: '',
      initialPassword: '',
    },
  })

  const onSubmit = (data: AddWorkerFormData) => {
    console.log('============FORM============')
    console.log(data)
    reset()
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
      <AppInput
        label="초기비밀번호"
        required
        variant="password"
        placeholder="8자리 이상 입력해주세요"
        error={errors.initialPassword?.message}
        {...register('initialPassword')}
      />
      <AppButton size="full" type="submit">
        등록
      </AppButton>
    </form>
  )
}

export default AddWorkerForm
