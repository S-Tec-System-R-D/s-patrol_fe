import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import { AppFormField } from '@/components/app/AppFormField'
import AppInput from '@/components/app/AppInput'
import AppSelect from '@/components/app/AppSelect'

import type { GroupOption } from '../lib/siteList'
import { siteSchema, type SiteFormData } from './schema'

/**
 * 사업장 입력 (`spec 044` T794) — 추가 · 정보 수정 겸용(목업 `SiteFormModal`).
 *
 * - 🔴 **필드 · 검증만** 한다. 제출(`useAddSite` · `useUpdateSiteInfo`)과 모달은 호출부 몫이다(`GroupNameForm` 규약).
 * - 🔴 **닫는 것은 호출부가 성공한 뒤에** — 같은 이름 409 는 전역 토스트가 서버 문구를 띄우고 입력값은 남는다(043 규약).
 * - 소속 그룹 선택지는 호출부가 준다(`groupOptions` — 지사만). 0개면 안내하고 제출을 막는다.
 * - 목업의 계약 기간은 **없다** — 사업장 개념에 없다(사용자 결정 2026-10-23).
 * - 수정 모드(T801): 하위 사업장은 그룹을 바꿀 수 없어(서버 400) `groupDisabled` · 이유와 이동 영향은 `groupHint`.
 */

const EMPTY_VALUES: SiteFormData = { siteName: '', groupSeq: '', address: '', tel: '' }

interface SiteFormProps {
  options: GroupOption[]
  defaultValues?: Partial<SiteFormData>
  groupDisabled?: boolean
  groupHint?: string
  submitLabel: string
  pending: boolean
  onSubmit: (data: SiteFormData) => void
  onCancel: () => void
}

const SiteForm = ({
  options,
  defaultValues,
  groupDisabled,
  groupHint,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: SiteFormProps) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues },
  })
  const noBranch = options.length === 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* `AppInput` 의 label 은 입력과 연결돼 있지 않다 — 이름으로 찾을 수 있게 직접 단다(`GroupNameForm` 승계) */}
      <AppInput
        label="사업장명"
        aria-label="사업장명"
        required
        autoFocus
        placeholder="사업장명을 입력해주세요"
        error={errors.siteName?.message}
        {...register('siteName')}
      />
      <AppFormField
        label="소속 그룹"
        required
        error={errors.groupSeq?.message}
        hint={noBranch ? '지사가 없습니다. 관리그룹 편집에서 지사를 먼저 추가해주세요.' : groupHint}
      >
        <Controller
          control={control}
          name="groupSeq"
          render={({ field }) => (
            <AppSelect
              aria-label="소속 그룹"
              placeholder="지사를 선택해주세요"
              options={options.map((option) => ({ value: String(option.groupSeq), label: option.label }))}
              value={field.value || undefined}
              onChange={field.onChange}
              disabled={noBranch || groupDisabled}
              className="w-full"
            />
          )}
        />
      </AppFormField>
      <AppInput
        label="주소"
        aria-label="주소"
        required
        placeholder="주소를 입력해주세요"
        error={errors.address?.message}
        {...register('address')}
      />
      <AppInput label="대표 연락처" aria-label="대표 연락처" placeholder="02-0000-0000" {...register('tel')} />
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="sub" onClick={onCancel}>
          취소
        </AppButton>
        <AppButton type="submit" disabled={noBranch || pending}>
          {submitLabel}
        </AppButton>
      </div>
    </form>
  )
}

export default SiteForm
