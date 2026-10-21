import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { getSiteName } from '@/lib/auth/site'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { addWorkerSchema, type AddWorkerFormData } from './schema'

const AddWorkerForm = () => {
  /**
   * 🔴 **선택한 사업장**이 소속이다(`spec 038`). 전에는 `useMe().locationName` 이었는데 JWT 클레임에
   * **없어서** 항상 빈칸이었다(020).
   */
  const siteName = getSiteName()
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
      <AppInput label="소속 사업장" value={siteName ?? ''} disabled readOnly />
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
