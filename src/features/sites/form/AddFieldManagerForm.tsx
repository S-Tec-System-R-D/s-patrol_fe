import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { addUser } from '@/features/workers/api/addUser'
import { addWorkerFormSchema, toPhoneDigits, type AddWorkerFormData } from '@/features/workers/form/schema'
import { USER_ROLE } from '@/features/workers/lib/userRole'
import { userKeys } from '@/features/workers/queryKeys'
import { notify } from '@/lib/notify'

/**
 * 현장관리자 추가 폼 (`spec 081`) — 본사 사업장 상세에서 그 사업장의 현장관리자 계정을 만든다.
 *
 * 🔴 **현장 근무자 추가(`AddWorkerForm`)와 같은 API · 같은 검증**이다(`AddUser`) — 다른 것은 둘뿐이다:
 * 사업장을 **고른 사업장이 아니라 보고 있는 사업장**으로 보내고, 권한을 `현장 관리자`(6)로 보낸다.
 * 본사 토큰으로 만든 계정이 현장 사이트에 로그인되는 것까지 실측했다(2026-11-17, `api-spec.md` §5-1-B).
 * 🔴 실패 토스트는 전역 `MutationCache.onError` 몫 — 사번 중복은 서버 문구(`이미 사용중인 아이디입니다.`)가 그대로 보인다.
 */

interface AddFieldManagerFormProps {
  siteSeq: number
  siteName: string
  onSuccess?: () => void
}

const AddFieldManagerForm = ({ siteSeq, siteName, onSuccess }: AddFieldManagerFormProps) => {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddWorkerFormData>({
    resolver: zodResolver(addWorkerFormSchema),
    defaultValues: { name: '', loginId: '', phone: '', loginPw: '', loginPwConfirm: '' },
  })

  const mutation = useMutation({
    mutationFn: addUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists })
      notify.success('현장관리자를 추가했습니다.')
      onSuccess?.()
    },
  })

  const onSubmit = (data: AddWorkerFormData) =>
    mutation.mutate({
      siteSeq,
      codeSeq: USER_ROLE.FIELD_MANAGER,
      loginId: data.loginId,
      loginPw: data.loginPw,
      name: data.name,
      phone: toPhoneDigits(data.phone),
    })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 칸 순서 · 문구는 근무자 추가 · 관리자 추가와 같다(`spec 055`) */}
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <AppInput
        label="사번"
        required
        placeholder="로그인에 쓰는 사번(8자리 이하)"
        error={errors.loginId?.message}
        {...register('loginId')}
      />
      <AppInput
        label="초기 비밀번호"
        required
        variant="password"
        placeholder="8자리 이상, 영문·숫자·특수문자 포함"
        error={errors.loginPw?.message}
        {...register('loginPw')}
      />
      <AppInput
        label="비밀번호 확인"
        required
        variant="password"
        placeholder="비밀번호를 한 번 더 입력해주세요"
        error={errors.loginPwConfirm?.message}
        {...register('loginPwConfirm')}
      />
      <AppInput label="소속 사업장" value={siteName} disabled readOnly />
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        등록
      </AppButton>
    </form>
  )
}

export default AddFieldManagerForm
