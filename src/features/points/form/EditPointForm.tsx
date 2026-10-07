import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { pointFormDefaults, type FormDataType, pointSchema } from './schema'
import AppInput from '@/components/app/AppInput'
import AppButton from '@/components/app/AppButton'
import AuthMethodSelector from './fields/AuthMethodSelector'

const EditPointForm = () => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(pointSchema),
    // ⚠️ 022 Phase 4에서 `useYn` 이 스키마 required 가 되어 기본값을 공용 상수로 바꿨다.
    // 🔴 **아직 기존 값으로 초기화되지 않는다** — 수정 폼인데 빈 값에서 시작한다.
    // 상세 응답 주입과 실 전송(PATCH)은 Phase 5(T266)에서 한다.
    defaultValues: pointFormDefaults,
  })

  const authenticationMethod = useWatch({ control, name: 'authenticationMethod' })

  const onSubmit = (data: FormDataType) => {
    console.log('============FORM============')
    console.log(data)
    reset()
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
          error={errors.name?.message}
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
          error={errors.name?.message}
          {...register('nfcTagId')}
        />
      )}
      <AppButton size="full" type="submit">
        저장
      </AppButton>
    </form>
  )
}

export default EditPointForm
