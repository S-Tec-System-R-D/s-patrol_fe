import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { Switch } from '@/components/ui/switch'
import { getSiteSeq } from '@/lib/auth/site'

import { addPoint } from '../api/addPoint'
import { toAuthMethodCode } from '../lib/authMethod'
import { pointKeys } from '../queryKeys'
import AuthMethodSelector from './fields/AuthMethodSelector'
import { pointFormDefaults, pointSchema, type FormDataType } from './schema'

/**
 * 지점 추가 폼 — **프로젝트의 첫 서버 상태 변경 폼**이다(`spec 022` Phase 4).
 *
 * 🔴 **실패 토스트를 여기서 띄우지 않는다.** `lib/queryClient.ts:18-20` 의
 * `MutationCache.onError` 가 모든 mutation 실패를 전역 `notify.error` 로 이미 띄운다.
 * 여기서 또 띄우면 토스트가 2개 뜬다(`spec 022` §3 규칙 3).
 *
 * 🔴 **성공해야 닫는다.** 닫기는 부모(`PointTopNav`)가 `onSuccess` 로 제어한다 —
 * 먼저 닫으면 실패했을 때 사용자가 입력한 값이 사라진다(§4).
 */
const AddPointForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient()
  // 🔴 `siteSeq` 는 선택 결과에서 온다(spec 021). `AddPointDto` 가 요구하는 값이다.
  const siteSeq = getSiteSeq()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(pointSchema),
    defaultValues: pointFormDefaults,
  })

  const authenticationMethod = useWatch({ control, name: 'authenticationMethod' })
  const useYn = useWatch({ control, name: 'useYn' })

  const mutation = useMutation({
    mutationFn: addPoint,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: pointKeys.lists })
      reset()
      onSuccess?.()
    },
  })

  const onSubmit = (data: FormDataType) => {
    if (siteSeq === null) return
    mutation.mutate({
      siteSeq,
      name: data.name,
      // 서버는 nullable 이고 빈 문자열과 null 을 구분할 이유가 없다
      memo: data.description.trim() || null,
      authMethod: toAuthMethodCode(data.authenticationMethod),
      nfcTagId: data.authenticationMethod === 'NFC' ? data.nfcTagId : null,
      useYn: data.useYn,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <AppInput
          label="이름"
          required
          placeholder="지점명을 입력해주세요"
          error={errors.name?.message}
          {...register('name')}
        />
        <AppInput
          label="설명"
          placeholder="설명을 입력해주세요"
          // 022에서 수정: `errors.name` 을 보고 있었다(복붙). 설명 오류가 뜰 자리가 없었다.
          error={errors.description?.message}
          {...register('description')}
        />
        {/* 인증수단 */}
        <AuthMethodSelector
          required
          value={authenticationMethod}
          onChange={(v) => {
            if (v === 'QR') setValue('nfcTagId', '')
            setValue('authenticationMethod', v, { shouldValidate: true })
          }}
          error={errors.authenticationMethod?.message}
        />
      </div>
      {authenticationMethod === 'NFC' && (
        <AppInput
          label="NFC TAG ID"
          placeholder="14자리 HEX"
          // 022에서 수정: 여기도 `errors.name` 이었다 — 14자리 HEX 검증 메시지가 보이지 않았다.
          error={errors.nfcTagId?.message}
          {...register('nfcTagId')}
        />
      )}
      {/* 지점사용 — `AddPointDto` 의 required. 022에서 신설 */}
      <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
        <label htmlFor="add-point-useYn" className="text-sm font-medium text-foreground">
          지점사용
        </label>
        <Switch
          id="add-point-useYn"
          checked={useYn}
          onCheckedChange={(checked) => setValue('useYn', checked)}
        />
      </div>
      {siteSeq === null && (
        <p className="text-xs text-danger">사업장이 선택되지 않아 지점을 추가할 수 없습니다.</p>
      )}
      <AppButton size="full" type="submit" disabled={mutation.isPending || siteSeq === null}>
        {mutation.isPending ? '생성 중…' : '생성'}
      </AppButton>
    </form>
  )
}

export default AddPointForm
