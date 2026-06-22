import AppInput from '@/components/app/AppInput'
import Button from '@/components/Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'

const pointSchema = z.object({
  timeLimit: z.number().min(1, '1분 이상 입력해주세요.'),
})

type FormDataType = z.infer<typeof pointSchema>

const EditPointForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      timeLimit: 1,
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
        label="순찰시간 (분)"
        placeholder="10분"
        error={errors.timeLimit?.message}
        {...register('timeLimit')}
      />
      <Button size="full" type="submit">
        저장
      </Button>
    </form>
  )
}

export default EditPointForm
