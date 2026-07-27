import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppInput from '@/components/app/AppInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { Notice } from '../types/notice'
import { noticeFormSchema, type NoticeFormData } from './schema'

interface NoticeFormProps {
  notice?: Notice
}

const NoticeForm = ({ notice }: NoticeFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoticeFormData>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: notice?.title ?? '',
      content: notice?.content ?? '',
      sendAppPush: notice?.appPushSent ?? true,
    },
  })

  const onSubmit = (data: NoticeFormData) => {
    console.log('============FORM============')
    console.log(data)
  }

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
          {...register('content')}
        />
        {errors.content?.message && <p className="text-xs text-danger">{errors.content.message}</p>}
      </div>

      <AppCheckbox label="저장 시 앱 푸시 발송" {...register('sendAppPush')} />

      <AppButton size="full" type="submit">
        {notice ? '저장' : '등록'}
      </AppButton>
    </form>
  )
}

export default NoticeForm
