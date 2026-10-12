import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { getSiteSeq } from '@/lib/auth/site'

import { addCourse } from '../api/addCourse'
import { courseKeys } from '../queryKeys'
import { courseFormDefaults, courseSchema, type CourseFormDataType } from './schema'

/**
 * 코스 생성 폼 (`spec 023` Phase 4, T361).
 *
 * 🔴🔴 **지점을 묻지 않는다.** `AddCourse` 는 `points` 를 **무시**하고 `pointCount: 0`
 * 으로 만들면서 **200 + `data: true`** 를 준다(실측 B-27) — 모달에서 지점을 고르게 하면
 * 사용자는 성공 토스트를 보고 나가는데 **코스에는 지점이 없다.** 그래서 ① 묻지 않고
 * ② 타입(`AddCourseRequest`)에 `points` 필드가 **아예 없다.** 편성은 생성 후 상세에서
 * `UpdateCourse` 로 한다.
 *
 * 🔴 **생성 후 상세로 보내지 않는다.** `AddCourse` 응답이 `data: true` 뿐이라 **새
 * `courseSeq` 를 모른다**(실측). 이름으로 찾아 이동하면 **동명 코스에서 엉뚱한 코스**로
 * 간다 — 목록을 무효화해 다시 읽는 것이 유일하게 정직한 처리다(`spec 023` §4).
 * 그래서 성공 후 안내가 "목록에서 코스를 열어 지점을 편성하세요" 가 된다.
 *
 * 🔴 **실패 토스트를 여기서 띄우지 않는다** — `lib/queryClient.ts` 의 전역
 * `MutationCache.onError` 가 이미 띄운다(지점 폼과 같은 규약).
 * 🔴 **성공해야 닫는다** — 닫기는 부모(`CourseTopNav`)가 `onSuccess` 로 제어한다.
 */
const AddCourseForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient()
  // 🔴 `siteSeq` 는 상세 응답이 아니라 사업장 선택 결과에서 온다(spec 021, OQ-9)
  const siteSeq = getSiteSeq()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseFormDataType>({
    resolver: zodResolver(courseSchema),
    defaultValues: courseFormDefaults,
  })

  const mutation = useMutation({
    mutationFn: addCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseKeys.lists })
      reset()
      onSuccess?.()
    },
  })

  const onSubmit = (data: CourseFormDataType) => {
    if (siteSeq === null) return
    mutation.mutate({
      siteSeq,
      courseName: data.name,
      // 빈 문자열과 null 을 구분할 이유가 없다 — 서버가 nullable 이다
      memo: data.description.trim() || null,
      // 🔴 새 코스는 **활성·교대 미허용**으로 시작한다. 폼에 토글을 두지 않는 대신
      // 기본값을 여기 한 자리에 적어 둔다(바꾸는 것은 상세의 확인 모달 몫)
      useYn: true,
      switchYn: false,
      // 🔴 `null` 이면 서버가 구간시간 합으로 채운다(B-31). 지점이 0개이므로 0 이 된다
      totalMin: null,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <AppInput
        label="코스명"
        required
        placeholder="코스명을 입력해주세요"
        error={errors.name?.message}
        {...register('name')}
      />
      <AppInput
        label="설명"
        placeholder="설명을 입력해주세요"
        error={errors.description?.message}
        {...register('description')}
      />

      {/* 🔴 "지점은 어디서 넣느냐" 는 질문이 반드시 생긴다 — 모달을 닫은 뒤가 아니라
          **닫기 전에** 답해 둔다. 서버 제약(B-27)을 사용자 언어로 옮긴 한 문장이다 */}
      <p className="rounded-sm bg-muted/50 px-3 py-2 text-caption text-muted-foreground">
        지점 편성과 순서는 코스를 만든 뒤 <strong className="font-medium">코스 상세</strong>
        에서 설정합니다.
      </p>

      {siteSeq === null && (
        <p className="text-xs text-danger">사업장이 선택되지 않아 코스를 추가할 수 없습니다.</p>
      )}
      <AppButton size="full" type="submit" disabled={mutation.isPending || siteSeq === null}>
        {mutation.isPending ? '생성 중…' : '생성'}
      </AppButton>
    </form>
  )
}

export default AddCourseForm
