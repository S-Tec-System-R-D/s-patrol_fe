import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import z from 'zod'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'

/**
 * 그룹명 입력 (`spec 043` T755) — 하위 추가 · 이름 변경 겸용.
 *
 * - 앞뒤 공백을 지운 뒤 빈 값이면 제출하지 않는다(서버 ProblemDetails 400 이전에 막는다).
 * - 🔴 **닫는 것은 호출부가 성공한 뒤에** 한다 — 같은 이름 409 는 전역 토스트가 서버 문구를 띄우고
 *   입력값은 그대로 남는다(사용자 결정 2026-10-22). 길이 상한은 미실측이라 두지 않는다.
 */

const groupNameSchema = z.object({
  groupName: z.string().trim().min(1, '그룹명을 입력해주세요.'),
})

type GroupNameFormData = z.infer<typeof groupNameSchema>

interface GroupNameFormProps {
  defaultName?: string
  placeholder?: string
  submitLabel: string
  pending: boolean
  onSubmit: (groupName: string) => void
  onCancel: () => void
}

const GroupNameForm = ({
  defaultName = '',
  placeholder,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: GroupNameFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GroupNameFormData>({
    resolver: zodResolver(groupNameSchema),
    defaultValues: { groupName: defaultName },
  })
  // `watch()` 는 React Compiler 비호환 경고가 난다 — `AddPointForm` 처럼 `useWatch`
  const empty = useWatch({ control, name: 'groupName' }).trim() === ''

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data.groupName))} className="space-y-4">
      <AppInput
        label="그룹명"
        // `AppInput` 의 label 은 입력과 연결돼 있지 않다 — 이름으로 찾을 수 있게 직접 단다
        aria-label="그룹명"
        autoFocus
        placeholder={placeholder}
        error={errors.groupName?.message}
        {...register('groupName')}
      />
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton type="submit" disabled={empty || pending}>
          {submitLabel}
        </AppButton>
      </div>
    </form>
  )
}

export default GroupNameForm
