import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { getSiteSeq } from '@/lib/auth/site'

import { updateCourse } from '../api/updateCourse'
import { toUpdateCourseBody } from '../lib/updateCourseBody'
import { courseKeys } from '../queryKeys'
import type { CourseDetail } from '../types'
import { courseSchema, type CourseFormDataType } from './schema'

/**
 * 코스 기본정보 수정 폼 (`spec 023` Phase 4, T362).
 *
 * 🔴🔴 **코스명만 고치는 저장에도 `points` 가 전량 나간다.** `UpdateCourse` 의 `points`
 * 는 **전체 교체**라 생략·빈 배열·일부 전송이 **모두 나머지를 삭제**하고 **200 이 온다**
 * (B-25). 그래서 바디를 손으로 만들지 않고 `toUpdateCourseBody()` 를 쓴다 — 기본값이
 * "현재 편성 전량" 이다. 🔴 **직접 `{ courseName, memo }` 만 담아 보내면 그 순간 코스의
 * 지점이 전부 사라진다.**
 *
 * 🔴 **`memo: null` 이 반영된다**(규칙 6 — 지점도 B-15 해소 2026-10-28 뒤로 같다). 즉 설명을 지우는 것이
 * 실제로 동작하므로, 빈 입력을 "변경 없음" 으로 바꿔치기하면 **사용자 의도를 거스른다.**
 *
 * 🔴 **`courseSeq` 를 모달이 열릴 때 값으로 고정한다**(022 `EditPointForm` 선례). 상세
 * 페이지는 한 코스만 보여 주지만, 그렇다고 `course` prop 이 안 바뀐다는 보장은 없다
 * (재조회·무효화). 고정하지 않으면 저장이 엉뚱한 코스에 적용될 수 있다.
 */
const EditCourseForm = ({
  course,
  onSuccess,
}: {
  course: CourseDetail
  onSuccess?: () => void
}) => {
  const queryClient = useQueryClient()
  // 🔴 상세 응답에 `siteSeq` 가 없다(OQ-9) — 021 저장값으로 보충한다
  const siteSeq = getSiteSeq()

  // 🔴 모달이 열린 시점의 코스. 아래 `defaultValues` 도 같은 시점에 한 번만 읽힌다
  const [opened] = useState(course)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormDataType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: opened.courseName,
      description: opened.memo ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: updateCourse,
    onSuccess: async () => {
      // 🔴 목록과 상세를 **둘 다** 무효화한다 — 상세는 루트가 `'course'` 로 달라
      // `lists` 접두사에 걸리지 않는다(`queryKeys.ts` 규약 4)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.lists }),
        queryClient.invalidateQueries({ queryKey: courseKeys.detail(opened.courseSeq) }),
      ])
      onSuccess?.()
    },
  })

  const onSubmit = (data: CourseFormDataType) => {
    if (siteSeq === null) return
    mutation.mutate(
      // 🔴 `points` 를 넘기지 않는다 = **현재 편성 전량**이 실린다(B-25)
      toUpdateCourseBody(opened, siteSeq, {
        courseName: data.name,
        // 🔴 빈 입력은 `null` 로 보낸다 — 코스는 실제로 비워진다(규칙 6)
        memo: data.description.trim() || null,
      })
    )
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

      {/* 🔴 이 모달에서 **지점 편성·활성화·교대 허용을 다루지 않는다** — 각자 상세에
          자리가 있다. 같은 값을 두 곳에서 고치게 하면 어느 쪽이 최신인지 알 수 없다 */}

      {siteSeq === null && (
        <p className="text-xs text-danger">사업장이 선택되지 않아 저장할 수 없습니다.</p>
      )}
      <AppButton size="full" type="submit" disabled={mutation.isPending || siteSeq === null}>
        {mutation.isPending ? '저장 중…' : '저장'}
      </AppButton>
    </form>
  )
}

export default EditCourseForm
