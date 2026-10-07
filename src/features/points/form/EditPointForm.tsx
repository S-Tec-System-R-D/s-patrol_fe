import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppInput from '@/components/app/AppInput'
import { Switch } from '@/components/ui/switch'

import { updatePoint } from '../api/updatePoint'
import { toAuthMethodCode, toAuthMethodLabel } from '../lib/authMethod'
import { pointKeys } from '../queryKeys'
import type { PointDetail } from '../types'
import AuthMethodSelector from './fields/AuthMethodSelector'
import { pointSchema, type FormDataType } from './schema'

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

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormDataType>({
    resolver: zodResolver(pointSchema),
    defaultValues: {
      name: point.name,
      description: point.memo ?? '',
      // 미실측 코드(9·10 외)면 `undefined` 로 둬 **아무것도 선택되지 않은 상태**로 연다.
      // 임의로 'QR' 을 채우면 저장 시 사용자가 고르지 않은 인증수단으로 바뀐다(A1).
      authenticationMethod: toAuthMethodLabel(point.authMethod) ?? undefined,
      nfcTagId: point.nfcTagId ?? '',
      useYn: point.useYn,
    },
  })

  const authenticationMethod = useWatch({ control, name: 'authenticationMethod' })
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

  const onSubmit = (data: FormDataType) => {
    mutation.mutate({
      pointSeq,
      name: data.name,
      memo: data.description.trim() || null,
      authMethod: toAuthMethodCode(data.authenticationMethod),
      nfcTagId: data.authenticationMethod === 'NFC' ? data.nfcTagId : null,
      useYn: data.useYn,
      // QR 재발급은 022 범위 외(OQ-022-D). 생략하지 않고 명시적으로 false 를 보낸다 —
      // swagger 가 nullable 이 아니라 생략 시 서버 기본값이 미실측이다.
      reissueQrYn: false,
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
        {/* 인증수단 */}
        <AuthMethodSelector
          required
          value={authenticationMethod}
          onChange={(v) => {
            if (v === 'QR') setValue('nfcTagId', '')
            setValue('authenticationMethod', v, { shouldValidate: true })
          }}
          error={errors.authenticationMethod?.message}
        />
      </div>
      {authenticationMethod === 'NFC' && (
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
