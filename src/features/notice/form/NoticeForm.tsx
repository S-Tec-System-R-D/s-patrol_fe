import AppButton from '@/components/app/AppButton'
import AppCheckbox from '@/components/app/AppCheckbox'
import AppInput from '@/components/app/AppInput'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { NoticeDetail } from '../types/notice'
import { noticeFormSchema, type NoticeFormData } from './schema'

interface NoticeFormProps {
  /** 수정 시 기본값. 🔴 서버 상세(`NoticeDetail`)의 이름을 그대로 받는다(`spec 026` T587) */
  notice?: Pick<NoticeDetail, 'title' | 'description'>
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
      // ⚠️ 스키마 필드명 `content` 는 그대로 둔다 — 요청 DTO 는 변경계 전환 spec 에서 swagger 기준으로 맞춘다
      content: notice?.description ?? '',
      // 🔴 항상 켠 채로 연다 — 지난 발송 여부는 조회 응답에 없다(작성 시점 옵션)
      sendAppPush: true,
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
