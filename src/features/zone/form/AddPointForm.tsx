// 기존 추가되지않은 지점 조회 및 선택

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import z from 'zod'

import Button from '@/components/Button'

import type { ZonePointType } from '../types'
import { points } from '@/features/points/mock/pointData'
import AuthenticationBadge from '../components/point-card/AuthenticationBadge'
import { MapPinIcon } from 'lucide-react'
import AppInput from '@/components/app/AppInput'

const addPointSchema = z.object({
  points: z.array(z.string()).min(1, '최소 1개 이상 선택해주세요.'),
})

type FormDataType = z.infer<typeof addPointSchema>

interface AddPointFormProps {
  currentPoints: ZonePointType[]
}

const AddPointForm = ({ currentPoints }: AddPointFormProps) => {
  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<FormDataType>({
    resolver: zodResolver(addPointSchema),
    defaultValues: {
      points: [],
    },
  })

  useEffect(() => {
    return () => {
      reset()
    }
  }, [reset])

  const selectedPoints = useWatch({ control, name: 'points' }) ?? []

  const togglePoint = (id: string) => {
    console.log('동작')
    //해제
    if (selectedPoints.includes(id)) {
      setValue(
        'points',
        selectedPoints.filter((v) => v !== id),
        {
          shouldValidate: true,
        }
      )
    }
    //선택
    else {
      setValue('points', [...selectedPoints, id])
    }
  }

  const onSubmit = (data: FormDataType) => {
    console.log('============FORM============')
    console.log(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1 min-h-0">
      <AppInput variant="search" placeholder="지점명" />
      <div className="flex-1 overflow-auto flex flex-col gap-2 pb-1">
        {points
          .filter((v) => currentPoints.some((c) => c.id !== v.id))
          .map((v, i) => {
            const isSelected = selectedPoints.includes(v.id)
            return (
              <div
                key={'points' + i}
                className={`
                  flex justify-between items-center
                  border rounded-sm p-3 
                ${isSelected ? ' border-point bg-point/5 hover:bg-point/5' : ''}
                cursor-pointer hover:bg-muted`}
                onClick={() => togglePoint(v.id)}
              >
                <div className="flex items-center gap-3">
                  <MapPinIcon
                    className={`${isSelected ? 'text-point' : ' text-muted-foreground'}`}
                    size={16}
                  />
                  <div className="flex flex-col gap-1 ">
                    <span className="text-xs font-bold">{v.title}</span>
                    <span className="text-xs text-muted-foreground">{v.description}</span>
                  </div>
                </div>

                <AuthenticationBadge method={v.authenticationMethod} />
              </div>
            )
          })}
      </div>
      {errors.points && <p className="text-xs text-danger">{errors.points.message}</p>}
      <Button size="full" type="submit">
        추가
      </Button>
    </form>
  )
}

export default AddPointForm
