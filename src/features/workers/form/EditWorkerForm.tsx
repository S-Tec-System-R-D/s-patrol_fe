import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { formatPhone } from '../lib/userFormat'
import type { UserDetail } from '../types/user'
import { editWorkerSchema, type EditWorkerFormData } from './schema'

interface EditWorkerFormProps {
  /** 🔴 서버 상세(`UserDetail`)의 이름을 그대로 받는다(`spec 038` T616) */
  user: Pick<UserDetail, 'userName' | 'phone' | 'siteName'>
}

const EditWorkerForm = ({ user }: EditWorkerFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditWorkerFormData>({
    resolver: zodResolver(editWorkerSchema),
    defaultValues: {
      // ⚠️ 스키마 필드명(`name`·`phone`)은 그대로 둔다 — 요청 DTO 는 변경계 spec 에서 맞춘다
      name: user.userName,
      // 🔴 서버는 하이픈 없이 준다 — 스키마가 `010-0000-0000` 이라 변환하지 않으면 열자마자 검증 에러
      phone: formatPhone(user.phone),
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
      <AppInput label="소속 사업장" value={user.siteName} disabled readOnly />
      <AppButton size="full" type="submit">
        저장
      </AppButton>
    </form>
  )
}

export default EditWorkerForm
