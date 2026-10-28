import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { passwordSchema, type PasswordFormData } from '@/features/workers/form/schema'
import { useResetAdminPassword } from '../hooks/useAdminAccountMutations'

/**
 * 관리자 비밀번호 변경 (`spec 056` T1002) — `ResetAdminPassword`. 규칙 · 문구는 근무자 비밀번호 변경(041)과 같다.
 * 확인 칸은 보내지 않는다. 🔴 성공해야 닫힌다.
 */
const AdminPasswordForm = ({ userSeq, onSuccess }: { userSeq: number; onSuccess: () => void }) => {
  const mutation = useResetAdminPassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { loginPw: '', confirm: '' },
  })

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate({ userSeq, loginPw: data.loginPw }, { onSuccess }))}
      className="space-y-4"
    >
      <AppInput
        label="새 비밀번호"
        required
        variant="password"
        placeholder="8자리 이상, 영문·숫자·특수문자 포함"
        error={errors.loginPw?.message}
        {...register('loginPw')}
      />
      <AppInput
        label="새 비밀번호 확인"
        required
        variant="password"
        placeholder="한 번 더 입력해주세요"
        error={errors.confirm?.message}
        {...register('confirm')}
      />
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        변경
      </AppButton>
    </form>
  )
}

export default AdminPasswordForm
