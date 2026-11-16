import { zodResolver } from '@hookform/resolvers/zod'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppIconButton from '@/components/app/AppIconButton'
import AppInput from '@/components/app/AppInput'
import AppTimeInput from '@/components/app/AppTimeInput'

import { healthCheckSchema, type HealthCheckFormData } from './healthCheckSchema'

/**
 * 헬스체크 설정 입력 (`spec 044` T807) — 목업 `HealthModal`.
 *
 * - 🔴 **필드 · 검증만** 한다. 제출(`useUpdateHealthCheck`)과 모달은 호출부 몫이다(`SiteForm` 규약).
 * - 🔴 **닫는 것은 호출부가 성공한 뒤에** — 서버 검증 실패(래퍼 · (D) 문자열)는 전역 토스트가 띄우고 입력값은 남는다.
 * - 타임아웃 단위는 **회**(사용자 확인 2026-11-17, OQ-044-B 해소) — 라벨 `타임아웃(회)`.
 * - 🔄 `spec 080` D8 — 시각 칸 4개(사용 시작 · 종료 · 예외 시작 · 종료)는 `AppTimeInput`(24시간 `HH:mm` · 키보드 + 시 · 분
 *   두 열 선택 창). 예외 1행 = 시작 칸 `~` 종료 칸 + 삭제 — 시작 · 종료는 **칸을 나눈다**(한 칸으로 묶은 D6 는 되돌렸다, 사용자).
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
        <Controller
          control={control}
          name="startTime"
          render={({ field }) => (
            <AppTimeInput label="사용 시작" aria-label="사용 시작" required error={errors.startTime?.message} {...field} />
          )}
        />
        <Controller
          control={control}
          name="endTime"
          render={({ field }) => (
            <AppTimeInput label="사용 종료" aria-label="사용 종료" required error={errors.endTime?.message} {...field} />
          )}
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
          label="타임아웃(회)"
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
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">예외 시간</span>
          <span className="text-caption text-muted-foreground">이 시간에는 확인하지 않습니다</span>
        </div>
        {exceptions.fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            {/* `AppTimeInput` 은 `w-full` 이라 한 줄에 둘을 두면 넘친다 — 칸마다 남은 폭을 나눠 갖게 감싼다 */}
            <div className="min-w-0 flex-1">
              <Controller
                control={control}
                name={`exceptions.${index}.start`}
                render={({ field: input }) => (
                  <AppTimeInput
                    aria-label={`예외 ${index + 1} 시작`}
                    error={errors.exceptions?.[index]?.start?.message}
                    {...input}
                  />
                )}
              />
            </div>
            <span className="pt-2 text-muted-foreground">~</span>
            <div className="min-w-0 flex-1">
              <Controller
                control={control}
                name={`exceptions.${index}.end`}
                render={({ field: input }) => (
                  <AppTimeInput
                    aria-label={`예외 ${index + 1} 종료`}
                    error={errors.exceptions?.[index]?.end?.message}
                    {...input}
                  />
                )}
              />
            </div>
            <AppIconButton
              type="button"
              icon={Trash2Icon}
              aria-label={`예외 ${index + 1} 삭제`}
              onClick={() => exceptions.remove(index)}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => exceptions.append({ start: '', end: '' })}
          className="flex items-center justify-center gap-1 rounded-sm border border-dashed border-border py-2 text-caption font-medium text-muted-foreground hover:border-point/50 hover:text-point-foreground"
        >
          <PlusIcon className="size-3.5" aria-hidden />
          예외 시간 추가
        </button>
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
