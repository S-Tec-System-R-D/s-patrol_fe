import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { notify } from '@/lib/notify'

import { updateUser } from '../api/updateUser'
import { formatPhone } from '../lib/userFormat'
import { userKeys } from '../queryKeys'
import type { UserDetail } from '../types/user'
import { editWorkerSchema, toPhoneDigits, type EditWorkerFormData } from './schema'

interface EditWorkerFormProps {
  /** 🔴 서버 상세(`UserDetail`)의 이름을 그대로 받는다(`spec 038` T616) */
  user: Pick<UserDetail, 'userSeq' | 'userName' | 'phone' | 'siteName'>
  /** 🔴 성공해야 부르는 닫기 — 먼저 닫으면 실패했을 때 입력이 사라진다(`AddPointForm` 규약) */
  onSuccess?: () => void
}

/**
 * 근무자 정보 수정 (`spec 041` US2) — **이름·연락처만** 보낸다.
 *
 * 비밀번호는 같은 API(`UpdateUser.loginPw`)지만 **다른 버튼·모달**이다(사용자 결정 2026-10-21) — 여기서
 * `loginPw` 를 보내지 않는다. 실패 토스트는 전역 `MutationCache` 가 띄운다.
 */
const EditWorkerForm = ({ user, onSuccess }: EditWorkerFormProps) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditWorkerFormData>({
    resolver: zodResolver(editWorkerSchema),
    defaultValues: {
      name: user.userName,
      // 🔴 서버는 하이픈 없이 준다 — 스키마가 `010-0000-0000` 이라 변환하지 않으면 열자마자 검증 에러
      phone: formatPhone(user.phone),
    },
  })

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: async (_, { userSeq }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: userKeys.lists }),
        queryClient.invalidateQueries({ queryKey: userKeys.detail(userSeq) }),
      ])
      notify.success('근무자 정보를 수정했습니다.')
      onSuccess?.()
    },
    // 🔴 다른 관리자가 지운 근무자면 400 이다 — 상세를 다시 읽어 지금 상태(404 실패 화면)를 보여 준다
    onError: (_, { userSeq }) =>
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userSeq) }),
  })

  const onSubmit = (data: EditWorkerFormData) => {
    mutation.mutate({
      userSeq: user.userSeq,
      name: data.name,
      // 🔴 숫자만 — 서버는 보낸 그대로 저장한다(B-45)
      phone: toPhoneDigits(data.phone),
    })
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
      <AppInput label="소속 사업장" value={user.siteName ?? ''} disabled readOnly />
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        저장
      </AppButton>
    </form>
  )
}

export default EditWorkerForm
