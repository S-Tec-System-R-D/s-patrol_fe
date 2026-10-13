import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { Switch } from '@/components/ui/switch'

import { updatePoint } from '../api/updatePoint'
import { toAuthMethodLabel } from '../lib/authMethod'
import { pointKeys } from '../queryKeys'
import type { PointDetail } from '../types'
import { makeEditPointSchema, type EditFormDataType } from './schema'

/**
 * 지점 수정 폼 (`spec 022` Phase 5).
 *
 * 🔴 **022 전까지 수정 폼인데 빈 값에서 시작했다.** 이제 상세 응답을 `defaultValues` 로
 * 주입한다 — 사용자가 기존 값을 다시 타이핑할 필요가 없고, 한 필드만 고쳐도 나머지가
 * 빈 값으로 덮이는 사고가 사라진다(§3 규칙 12).
 *
 * 🔴 **`pointSeq` 를 모달이 열릴 때의 값으로 고정한다**(§4). 모달은 열려 있고 뒤쪽 목록은
 * 클릭 가능해서, 수정 중 다른 지점을 선택하면 `point` prop 이 바뀐다. 고정하지 않으면
 * **저장이 엉뚱한 지점에 적용된다.** `useState` 초기값은 첫 렌더에서만 읽히므로 이것이
 * 고정 장치다 — 모달은 닫힐 때 언마운트되므로 다음 열림에는 새 값이 들어온다.
 *
 * 🔴 **실패 토스트를 여기서 띄우지 않는다** — `queryClient.ts:18-20` 의 전역
 * `MutationCache.onError` 가 이미 띄운다(규칙 3). **성공해야 닫는다** — 닫기는
 * 부모(`PointDetail`)가 `onSuccess` 로 제어한다(`AddPointForm` 과 같은 모양).
 */
const EditPointForm = ({ point, onSuccess }: { point: PointDetail; onSuccess?: () => void }) => {
  const queryClient = useQueryClient()

  // 🔴 모달이 열린 시점의 지점. 아래 `defaultValues` 도 같은 시점에 한 번만 읽힌다.
  const [pointSeq] = useState(point.pointSeq)

  /**
   * 🔴 **수단은 폼 값이 아니라 서버값이다**(`spec 029` T416). 전환은 상세 카드의
   * 스위치가 하고, 이 폼은 **지금 수단에 맞는 필드만** 보여준다. 모달이 열린 시점으로
   * 고정한다 — 뒤에서 수단이 바뀌어도 열려 있는 폼의 모양이 도중에 변하지 않게.
   */
  const [isNfc] = useState(() => toAuthMethodLabel(point.authMethod) === 'NFC')

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditFormDataType>({
    resolver: zodResolver(makeEditPointSchema(isNfc)),
    defaultValues: {
      name: point.name,
      description: point.memo ?? '',
      nfcTagId: point.nfcTagId ?? '',
      useYn: point.useYn,
    },
  })

  const useYn = useWatch({ control, name: 'useYn' })

  const mutation = useMutation({
    mutationFn: updatePoint,
    onSuccess: async () => {
      // 🔴 목록과 상세를 **둘 다** 무효화한다 — 상세는 루트가 'point' 로 달라
      // `lists` 접두사에 걸리지 않는다(`queryKeys.ts` 규약 4).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pointKeys.lists }),
        queryClient.invalidateQueries({ queryKey: pointKeys.detail(pointSeq) }),
      ])
      onSuccess?.()
    },
  })

  const onSubmit = (data: EditFormDataType) => {
    mutation.mutate({
      pointSeq,
      name: data.name,
      memo: data.description.trim() || null,
      /**
       * 🔴 **`authMethod` 를 보내지 않는다**(`spec 029` T415). 전환은 상세 카드의
       * 스위치가 전담하고, `UpdatePoint` 는 진짜 부분 갱신이라 생략하면 유지된다(실측).
       * ⚠️ 보내면 **TAG ID 를 함께 실어야 하는 요청**이 되어(NFC 지점이면 400) 이름만
       * 고치려던 저장이 실패한다 — 보강 실측 2026-10-13 이 그 경계를 확인했다.
       */
      // 🔴 TAG ID 는 **NFC 지점일 때만** 보낸다. QR 지점에 남아 있는 값은 어차피 지울
      // 수 없고(B-15) 화면에도 없다 — 폼이 그것을 되돌려 보낼 이유가 없다
      nfcTagId: isNfc ? data.nfcTagId : undefined,
      useYn: data.useYn,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <AppInput
          label="이름"
          required
          placeholder="지점명을 입력해주세요"
          error={errors.name?.message}
          {...register('name')}
        />
        <AppInput
          label="설명"
          placeholder="설명을 입력해주세요"
          // 022에서 수정: `errors.name` 을 보고 있었다(추가 폼과 같은 복붙).
          error={errors.description?.message}
          {...register('description')}
        />
        {/* 🔴 **인증수단 선택이 없다**(`spec 029` T415, 사용자 결정 2026-10-13).
            전환은 상세의 **자격증명 카드 스위치** 한 곳에서만 한다 — 수단이 두 곳이면
            그중 폼 쪽은 **TAG ID 를 비워도 저장되는 것처럼** 보인다.
            ⚠️ TAG ID 필드는 남는다. 수단 변경이 아니라 **태그 교체**(분실·파손) 때문이고,
            그래서 **NFC 지점일 때만** 뜬다 */}
      </div>
      {isNfc && (
        <AppInput
          label="NFC TAG ID"
          placeholder="14자리 HEX"
          // 022에서 수정: 여기도 `errors.name` 이었다 — HEX 검증 메시지가 보이지 않았다.
          error={errors.nfcTagId?.message}
          {...register('nfcTagId')}
        />
      )}
      <div className="flex items-center justify-between rounded-sm border border-border px-3 py-2">
        <label htmlFor="edit-point-useYn" className="text-sm font-medium text-foreground">
          지점사용
        </label>
        <Switch
          id="edit-point-useYn"
          checked={useYn}
          onCheckedChange={(checked) => setValue('useYn', checked)}
        />
      </div>
      <AppButton size="full" type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '저장 중…' : '저장'}
      </AppButton>
    </form>
  )
}

export default EditPointForm
