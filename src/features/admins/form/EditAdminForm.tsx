import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { editWorkerSchema, toPhoneDigits, type EditWorkerFormData } from '@/features/workers/form/schema'
import { formatPhone } from '@/features/workers/lib/userFormat'
import { useUpdateAdmin } from '../hooks/useAdminAccountMutations'
import type { AdminListItem } from '../types/admin'

/**
 * 관리자 정보 수정 (`spec 056` T1002) — **이름 · 연락처만** 보낸다(`UpdateAdmin` 은 생략한 필드를 유지한다 — 실측).
 *
 * 규칙은 근무자 정보 수정과 같다(`editWorkerSchema`). 담당 그룹은 상세 모달에서, 비밀번호는 다른 버튼에서 바꾼다.
 * 🔴 성공해야 닫힌다 — 실패 토스트는 전역 `MutationCache`.
 */
const EditAdminForm = ({ admin, onSuccess }: { admin: AdminListItem; onSuccess: () => void }) => {
  const mutation = useUpdateAdmin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditWorkerFormData>({
    resolver: zodResolver(editWorkerSchema),
    // 🔴 서버는 하이픈 없이 준다 — 스키마가 `010-0000-0000` 이라 변환하지 않으면 열자마자 검증 에러(041 승계)
    defaultValues: { name: admin.userName, phone: formatPhone(admin.phone) },
  })

  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutation.mutate(
          { userSeq: admin.userSeq, name: data.name, phone: toPhoneDigits(data.phone) },
          { onSuccess }
        )
      )}
      className="space-y-4"
    >
      <AppInput label="이름" required placeholder="홍길동" error={errors.name?.message} {...register('name')} />
      <AppInput label="연락처" required placeholder="010-0000-0000" error={errors.phone?.message} {...register('phone')} />
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        저장
      </AppButton>
    </form>
  )
}

export default EditAdminForm
