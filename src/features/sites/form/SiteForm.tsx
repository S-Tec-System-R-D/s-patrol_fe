import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import { AppFormField } from '@/components/app/AppFormField'
import AppInput from '@/components/app/AppInput'
import AppSelect from '@/components/app/AppSelect'
import type { GroupListNode } from '@/features/groups/types/group'

import { branchOptions, hqOf, hqOptions, parentSiteOptions } from '../lib/siteList'
import { NO_PARENT, siteSchema, type SiteFormData } from './schema'

/**
 * 사업장 입력 (`spec 044` T794 · `spec 051` T932) — 추가 · 정보 수정 겸용(목업 `SiteFormModal`).
 *
 * - 🔴 **필드 · 검증만** 한다. 제출(`useAddSite` · `useUpdateSiteInfo`)과 모달은 호출부 몫이다(`GroupNameForm` 규약).
 * - 🔴 **닫는 것은 호출부가 성공한 뒤에** — 같은 이름 409 는 전역 토스트가 서버 문구를 띄우고 입력값은 남는다(043 규약).
 * - 소속은 **본부 → 지사 → 모 사업장** 순으로 고른다(`spec 051`). 🔴 위 칸을 바꾸면 아래 칸을 비운다 —
 *   다른 지사의 모 사업장이 남으면 서버 400 이다. 선택지는 받은 트리(`GetGroupList`)에서 만든다.
 * - 트리에 본부가 없으면(루트가 지사인 계정) 본부 칸을 숨기고 지사를 바로 고른다.
 * - 목업의 계약 기간은 **없다** — 사업장 개념에 없다(사용자 결정 2026-10-23).
 * - 수정 모드(T801 · T935): 하위 사업장은 그룹을 바꿀 수 없어(서버 400) `groupDisabled` · 이유와 이동 영향은 `groupHint`.
 *   모 사업장은 서버가 바꾸지 못해 `parentLocked` 로 읽기 전용(`parentName` 없음 = 최상위).
 */

const EMPTY_VALUES: SiteFormData = { siteName: '', groupSeq: '', parentSiteSeq: NO_PARENT, address: '', tel: '' }
const NO_PARENT_LABEL = '없음 (최상위 사업장)'

interface SiteFormProps {
  root: GroupListNode
  defaultValues?: Partial<SiteFormData>
  groupDisabled?: boolean
  groupHint?: string
  parentLocked?: boolean
  parentName?: string
  submitLabel: string
  pending: boolean
  onSubmit: (data: SiteFormData) => void
  onCancel: () => void
}

const SiteForm = ({
  root,
  defaultValues,
  groupDisabled,
  groupHint,
  parentLocked,
  parentName,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: SiteFormProps) => {
  const hqs = hqOptions(root)
  const hasHq = hqs.length > 0
  const allBranches = branchOptions(root, null)
  const noBranch = allBranches.length === 0

  // 🔴 기본 지사가 지사가 아니면(실서버의 회사·본부 소속) 비운다 — 다시 골라야 저장된다(`spec 051` §3)
  const initialGroupSeq = allBranches.some((branch) => String(branch.groupSeq) === defaultValues?.groupSeq)
    ? (defaultValues?.groupSeq ?? '')
    : ''
  const initialHq = initialGroupSeq ? hqOf(root, Number(initialGroupSeq)) : hqs.length === 1 ? hqs[0].groupSeq : null
  const [hqSeq, setHqSeq] = useState(initialHq === null ? '' : String(initialHq))

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: { ...EMPTY_VALUES, ...defaultValues, groupSeq: initialGroupSeq },
  })
  const groupSeq = useWatch({ control, name: 'groupSeq' })

  const branches = hasHq ? (hqSeq ? branchOptions(root, Number(hqSeq)) : []) : allBranches
  const parents = groupSeq ? parentSiteOptions(root, Number(groupSeq)) : []

  const branchHint = noBranch
    ? '지사가 없습니다. 관리그룹 편집에서 지사를 먼저 추가해주세요.'
    : hqSeq && branches.length === 0
      ? '이 본부에 지사가 없습니다.'
      : groupHint
  const parentHint = parentLocked
    ? '모 사업장은 바꿀 수 없습니다.'
    : groupSeq && parents.length === 0
      ? '이 지사에 사업장이 없습니다.'
      : '추가 후에는 바꿀 수 없습니다.'
  const parentSelectOptions = parentLocked
    ? [{ value: NO_PARENT, label: parentName ?? NO_PARENT_LABEL }]
    : [
        { value: NO_PARENT, label: NO_PARENT_LABEL },
        ...parents.map((site) => ({ value: String(site.siteSeq), label: site.siteName })),
      ]

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
      <div className={hasHq ? 'grid grid-cols-2 gap-3' : undefined}>
        {hasHq && (
          <AppFormField label="본부" required>
            <AppSelect
              aria-label="본부"
              placeholder="본부를 선택해주세요"
              options={hqs.map((hq) => ({ value: String(hq.groupSeq), label: hq.label }))}
              value={hqSeq || undefined}
              onChange={(value) => {
                setHqSeq(value)
                setValue('groupSeq', '')
                setValue('parentSiteSeq', NO_PARENT)
              }}
              disabled={noBranch || groupDisabled}
              className="w-full"
            />
          </AppFormField>
        )}
        <AppFormField label="지사" required error={errors.groupSeq?.message} hint={branchHint}>
          <Controller
            control={control}
            name="groupSeq"
            render={({ field }) => (
              <AppSelect
                aria-label="지사"
                placeholder="지사를 선택해주세요"
                options={branches.map((branch) => ({ value: String(branch.groupSeq), label: branch.label }))}
                value={field.value || undefined}
                onChange={(value) => {
                  field.onChange(value)
                  setValue('parentSiteSeq', NO_PARENT)
                }}
                disabled={noBranch || groupDisabled || branches.length === 0}
                className="w-full"
              />
            )}
          />
        </AppFormField>
      </div>
      <AppFormField label="모 사업장" hint={parentHint}>
        <Controller
          control={control}
          name="parentSiteSeq"
          render={({ field }) => (
            <AppSelect
              aria-label="모 사업장"
              options={parentSelectOptions}
              value={field.value}
              onChange={field.onChange}
              disabled={parentLocked || parents.length === 0}
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
