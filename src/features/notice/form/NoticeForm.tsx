import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppInput from '@/components/app/AppInput'
import { getSiteSeq } from '@/lib/auth/site'
import { notify } from '@/lib/notify'

import { addNotice } from '../api/addNotice'
import { noticeKeys } from '../queryKeys'
import type { NoticeDetail } from '../types/notice'
import NoticeAttachInput from './NoticeAttachInput'
import { noticeFormSchema, type NoticeFormData } from './schema'

interface NoticeFormProps {
  /** 수정 시 기본값. 🔴 서버 상세(`NoticeDetail`)의 이름을 그대로 받는다(`spec 026` T587) */
  notice?: Pick<NoticeDetail, 'title' | 'description' | 'isPin'>
  /** 🔴 성공해야 부르는 닫기 — 먼저 닫으면 실패했을 때 입력이 사라진다(`AddPointForm` 규약) */
  onSuccess?: () => void
}

/**
 * 공지 작성·수정 폼 (`spec 040`).
 *
 * 🔴 **실패 토스트를 여기서 띄우지 않는다** — 전역 `MutationCache.onError` 가 띄운다(중복 금지).
 * 작성 성공 후에는 **목록에 머문다** — 서버가 새 `noticeSeq` 를 주지 않는다(§5-1-B).
 * ⚠️ 수정 제출은 Phase 3(T671)에서 연결한다.
 */
const NoticeForm = ({ notice, onSuccess }: NoticeFormProps) => {
  const queryClient = useQueryClient()
  const siteSeq = getSiteSeq()
  const [files, setFiles] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: notice?.title ?? '',
      description: notice?.description ?? '',
      // 작성은 해제로 연다(사용자 결정 2026-10-21) — 고정은 일부러 고르는 것이다
      isPin: notice?.isPin ?? false,
    },
  })

  const addMutation = useMutation({
    mutationFn: addNotice,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: noticeKeys.lists })
      notify.success('공지를 등록했습니다.')
      reset()
      setFiles([])
      onSuccess?.()
    },
  })

  const onSubmit = (data: NoticeFormData) => {
    if (notice) return // T671
    if (siteSeq === null) return
    addMutation.mutate({ siteSeq, ...data, file: files })
  }

  const isPending = addMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AppInput
        label="제목"
        required
        placeholder="공지 제목을 입력해주세요"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="flex w-full flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          본문
          <span className="ml-1 text-danger">*</span>
        </label>
        <textarea
          rows={6}
          placeholder="공지 내용을 입력해주세요"
          className="w-full resize-none rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-point focus:outline-none focus:ring-2 focus:ring-point/20"
          {...register('description')}
        />
        {errors.description?.message && (
          <p className="text-xs text-danger">{errors.description.message}</p>
        )}
      </div>

      <AppCheckbox label="상단 고정" {...register('isPin')} />

      {!notice && <NoticeAttachInput files={files} onChange={setFiles} disabled={isPending} />}

      <AppButton size="full" type="submit" disabled={isPending}>
        {notice ? '저장' : '등록'}
      </AppButton>
    </form>
  )
}

export default NoticeForm
