import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { notify } from '@/lib/notify'

import { updateUser } from '../api/updateUser'
import { userKeys } from '../queryKeys'
import { passwordSchema, type PasswordFormData } from './schema'

/**
 * 근무자 비밀번호 변경 (`spec 041` US3).
 *
 * 정보 수정과 **같은 API**(`UpdateUser`)지만 **다른 버튼·모달**이다(사용자 결정 2026-10-21) — `loginPw` 만
 * 보낸다. 서버는 즉시 반영한다(옛 비밀번호는 바로 거부된다 — 실측). 화면 값이 바뀌지 않아 무효화하지 않는다.
 */
const PasswordForm = ({ userSeq, onSuccess }: { userSeq: number; onSuccess?: () => void }) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { loginPw: '', confirm: '' },
  })

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      notify.success('비밀번호를 변경했습니다.')
      onSuccess?.()
    },
    // 🔴 다른 관리자가 지운 근무자면 400 이다 — 상세를 다시 읽어 지금 상태를 보여 준다
    onError: () => queryClient.invalidateQueries({ queryKey: userKeys.detail(userSeq) }),
  })

  const onSubmit = (data: PasswordFormData) => {
    mutation.mutate({ userSeq, loginPw: data.loginPw })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

export default PasswordForm
