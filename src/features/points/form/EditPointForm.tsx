import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { type FormDataType, pointSchema } from './schema'
import AppInput from '@/components/app/AppInput'
import Button from '@/components/Button'
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
    defaultValues: {
      name: '',
      description: '',
      authenticationMethod: 'QR',
      nfcTagId: '',
    },
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
      <Button size="full" type="submit">
        저장
      </Button>
    </form>
  )
}

export default EditPointForm
