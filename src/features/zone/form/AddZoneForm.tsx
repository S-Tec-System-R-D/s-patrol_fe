import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useEffect } from 'react'
import AppButton from '@/components/app/AppButton'
import { zoneSchema, type FormDataType } from './schema'
import AppInput from '@/components/app/AppInput'

const AddZoneForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: '',
    },
  })

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  const onSubmit = (data: FormDataType) => {
    console.log('============FORM============')
    console.log(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AppInput
        label="구역명"
        required
        placeholder="구역명을 입력해주세요"
        error={errors.name?.message}
        {...register('name')}
      />
      <AppButton size="full" type="submit">
        생성
      </AppButton>
    </form>
  )
}

export default AddZoneForm
