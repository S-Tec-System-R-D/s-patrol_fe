import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import AppBadge from '@/components/app/AppBadge'
import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import type { GroupNode } from '@/features/auth/types/site'
import GroupPicker from '../components/GroupPicker'
import { useAddAdmin } from '../hooks/useAdminAccountMutations'
import { groupChoices } from '../lib/adminList'
import { ADMIN_CODE, adminRoleLabel, adminRoleVariant } from '../lib/adminRole'
import { addAdminSchema, toAddAdminRequest, type AddAdminFormData } from './schema'

/**
 * 관리자 추가 폼 (`spec 045` T843 → `spec 056` T1001) — 목업 `ManagerFormModal`(추가 모드).
 *
 * - [등록] = `AddAdmin`. 🔴 성공해야 닫힌다 — 실패(중복 사번 등)면 입력을 둔 채 모달 유지(토스트는 전역).
 * - 만들 권한은 **로그인 권한으로 고정**이다(`creatableAdminCode`) — 고르는 칸이 없다.
 * - 🔴 **매니저만 담당 그룹을 고른다**(필수) · 마스터는 칸 자체가 없다(사용자 결정 2026-10-23).
 *   고르기는 `GroupPicker`(검색 · 칩 · 본부 = 지사 전부 · 지사 = 한 본부 안 — 후속 결정).
 * - 목업의 "소속 그룹" 은 없다 — 서버에 개념이 없고 담당 그룹으로 합쳤다(045 결정).
 * - 🔴 **입력 칸만 스크롤하고 버튼 줄은 아래에 고정**한다 — `AppDialog` 는 80vh 에서 넘치는 부분을 자른다. 매니저 폼은
 *   담당 그룹 목록 때문에 그보다 길어 [등록] 이 잘렸다(사용자 지적 2026-10-23).
 */

interface AddAdminFormProps {
  /** 만들 권한 — `ADMIN_CODE.MASTER` 또는 `ADMIN_CODE.MANAGER` */
  codeSeq: number
  /** 내 권한 라벨 — 안내 문구용 */
  myRoleLabel: string
  root: GroupNode
  /** 취소 · 성공 시 닫기 */
  onDone: () => void
}

const AddAdminForm = ({ codeSeq, myRoleLabel, root, onDone }: AddAdminFormProps) => {
  const withGroups = codeSeq === ADMIN_CODE.MANAGER
  const roleLabel = adminRoleLabel(codeSeq, '')
  const mutation = useAddAdmin()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddAdminFormData>({
    resolver: zodResolver(addAdminSchema(withGroups)),
    defaultValues: { name: '', loginId: '', phone: '', loginPw: '', loginPwConfirm: '', groupSeqs: [] },
  })

  return (
    <form
      onSubmit={handleSubmit((data) =>
        mutation.mutate(toAddAdminRequest(data, codeSeq, withGroups), { onSuccess: onDone })
      )}
      className="flex min-h-0 flex-1 flex-col gap-4"
    >
      {/* 🔴 포커스 링 · 마지막 칸 아래 테두리가 스크롤 끝에서 잘리지 않게 사방 1칸 여유(사용자 지적 2026-10-23) */}
      <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto p-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <AppInput label="이름" required placeholder="홍길동" error={errors.name?.message} {...register('name')} />
          <AppInput
            label="연락처"
            required
            placeholder="010-0000-0000"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <AppInput
          label="사번"
          required
          placeholder="로그인에 쓰는 사번(8자리 이하)"
          error={errors.loginId?.message}
          {...register('loginId')}
        />
        <AppInput
          label="초기 비밀번호"
          required
          variant="password"
          placeholder="8자리 이상, 영문·숫자·특수문자 포함"
          error={errors.loginPw?.message}
          {...register('loginPw')}
        />
        <AppInput
          label="비밀번호 확인"
          required
          variant="password"
          placeholder="비밀번호를 한 번 더 입력해주세요"
          error={errors.loginPwConfirm?.message}
          {...register('loginPwConfirm')}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">권한</span>
          <div className="flex items-center gap-2">
            <AppBadge variant={adminRoleVariant(codeSeq)}>{roleLabel}</AppBadge>
            <span className="text-caption text-muted-foreground">
              {myRoleLabel}는 {roleLabel} 계정만 생성할 수 있습니다.
            </span>
          </div>
        </div>
        {withGroups && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              담당 그룹 <span className="text-destructive">*</span>
            </span>
            <Controller
              control={control}
              name="groupSeqs"
              render={({ field }) => (
                <GroupPicker
                  root={root}
                  options={groupChoices(root)}
                  selected={field.value}
                  onChange={field.onChange}
                  error={errors.groupSeqs?.message}
                />
              )}
            />
          </div>
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onDone}>
          취소
        </AppButton>
        <AppButton type="submit" disabled={mutation.isPending}>
          등록
        </AppButton>
      </div>
    </form>
  )
}

export default AddAdminForm
