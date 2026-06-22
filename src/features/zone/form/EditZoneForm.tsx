import { useForm } from 'react-hook-form'
import { type FormDataType, zoneSchema } from './schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import Button from '@/components/Button'
import AppInput from '@/components/app/AppInput'

const EditZoneForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: '', // 값 설정
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
      <Button size="full" type="submit">
        수정
      </Button>
    </form>
  )
}

export default EditZoneForm
