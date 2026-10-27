import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { getSiteName, getSiteSeq } from '@/lib/auth/site'
import { notify } from '@/lib/notify'

import { addUser } from '../api/addUser'
import { USER_ROLE } from '../lib/userRole'
import { userKeys } from '../queryKeys'
import { addWorkerFormSchema, toPhoneDigits, type AddWorkerFormData } from './schema'

/**
 * 근무자 추가 폼 (`spec 041` US1).
 *
 * 🔴 **실패 토스트를 여기서 띄우지 않는다** — 전역 `MutationCache.onError` 가 띄운다. 사번 중복은 서버가
 * `"이미 사용중인 아이디입니다."` 를 주므로 그대로 보인다.
 * 🔴 **성공해야 닫는다**(`onSuccess`) — 먼저 닫으면 실패했을 때 입력이 사라진다(`AddPointForm` 규약).
 * 추가 후에는 **목록에 머문다** — 서버가 새 `userSeq` 를 주지 않는다.
 */
const AddWorkerForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient()
  /**
   * 🔴 **선택한 사업장**이 소속이다(`spec 038`). 전에는 `useMe().locationName` 이었는데 JWT 클레임에
   * **없어서** 항상 빈칸이었다(020).
   */
  const siteSeq = getSiteSeq()
  const siteName = getSiteName()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddWorkerFormData>({
    resolver: zodResolver(addWorkerFormSchema),
    defaultValues: {
      name: '',
      loginId: '',
      phone: '',
      loginPw: '',
      loginPwConfirm: '',
    },
  })

  const mutation = useMutation({
    mutationFn: addUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.lists })
      notify.success('근무자를 추가했습니다.')
      reset()
      onSuccess?.()
    },
  })

  const onSubmit = (data: AddWorkerFormData) => {
    if (siteSeq === null) return
    mutation.mutate({
      siteSeq,
      // 🔴 **근무자 고정**(사용자 결정 2026-10-21). 빼면 서버가 500 이다(B-44)
      codeSeq: USER_ROLE.WORKER,
      loginId: data.loginId,
      loginPw: data.loginPw,
      name: data.name,
      phone: toPhoneDigits(data.phone),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 칸 순서 · 문구는 관리자 추가(`AddAdminForm`)와 같다(`spec 055`) */}
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
      <AppInput label="소속 사업장" value={siteName ?? ''} disabled readOnly />
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        등록
      </AppButton>
    </form>
  )
}

export default AddWorkerForm
