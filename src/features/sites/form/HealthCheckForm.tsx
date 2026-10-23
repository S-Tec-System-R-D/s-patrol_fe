import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'

import { healthCheckSchema, type HealthCheckFormData } from './healthCheckSchema'

/**
 * 헬스체크 설정 입력 (`spec 044` T807) — 목업 `HealthModal`.
 *
 * - 🔴 **필드 · 검증만** 한다. 제출(`useUpdateHealthCheck`)과 모달은 호출부 몫이다(`SiteForm` 규약).
 * - 🔴 **닫는 것은 호출부가 성공한 뒤에** — 서버 검증 실패(래퍼 · (D) 문자열)는 전역 토스트가 띄우고 입력값은 남는다.
 * - 타임아웃 단위는 미확인(OQ-044-B) — 라벨에 단위를 쓰지 않는다.
 */

interface HealthCheckFormProps {
  defaultValues: HealthCheckFormData
  pending: boolean
  onSubmit: (data: HealthCheckFormData) => void
  onCancel: () => void
}

const HealthCheckForm = ({ defaultValues, pending, onSubmit, onCancel }: HealthCheckFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HealthCheckFormData>({
    resolver: zodResolver(healthCheckSchema),
    defaultValues,
  })
  const exceptions = useFieldArray({ control, name: 'exceptions' })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* `AppInput` 의 label 은 입력과 연결돼 있지 않다 — 이름으로 찾을 수 있게 직접 단다(`SiteForm` 승계) */}
      <div className="grid grid-cols-2 gap-3">
        <AppInput
          label="사용 시작"
          aria-label="사용 시작"
          type="time"
          required
          error={errors.startTime?.message}
          {...register('startTime')}
        />
        <AppInput
          label="사용 종료"
          aria-label="사용 종료"
          type="time"
          required
          error={errors.endTime?.message}
          {...register('endTime')}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <AppInput
          label="체크 주기(분)"
          aria-label="체크 주기"
          inputMode="numeric"
          required
          error={errors.interval?.message}
          {...register('interval')}
        />
        <AppInput
          label="타임아웃"
          aria-label="타임아웃"
          inputMode="numeric"
          required
          error={errors.timeout?.message}
          {...register('timeout')}
        />
        <AppInput
          label="반복 횟수"
          aria-label="반복 횟수"
          inputMode="numeric"
          required
          error={errors.retry?.message}
          {...register('retry')}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">예외 시간</span>
        {exceptions.fields.length === 0 && (
          <p className="text-caption text-muted-foreground">예외 시간이 없습니다.</p>
        )}
        {exceptions.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <AppInput
              aria-label={`예외 ${index + 1} 시작`}
              type="time"
              error={errors.exceptions?.[index]?.start?.message}
              {...register(`exceptions.${index}.start`)}
            />
            <span className="pt-2 text-muted-foreground">~</span>
            <AppInput
              aria-label={`예외 ${index + 1} 종료`}
              type="time"
              error={errors.exceptions?.[index]?.end?.message}
              {...register(`exceptions.${index}.end`)}
            />
            <AppIconButton
              type="button"
              icon={Trash2Icon}
              aria-label={`예외 ${index + 1} 삭제`}
              onClick={() => exceptions.remove(index)}
            />
          </div>
        ))}
        <AppButton
          type="button"
          variant="sub"
          icon={PlusIcon}
          iconSize={14}
          className="w-fit"
          onClick={() => exceptions.append({ start: '', end: '' })}
        >
          예외 시간 추가
        </AppButton>
      </div>

      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton type="submit" disabled={pending}>
          저장
        </AppButton>
      </div>
    </form>
  )
}

export default HealthCheckForm
