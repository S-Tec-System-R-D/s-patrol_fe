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
      /**
       * 🔴 **미실측 코드(9·10 외)는 미선택으로 연다**(A1). 추측 라벨을 만들지 않는다 —
       * 저장하려면 사용자가 골라야 하고, 스키마가 "인증수단을 선택해주세요." 로 막는다.
       */
      authenticationMethod: toAuthMethodLabel(point.authMethod) ?? undefined,
      /**
       * 🔴 **QR 지점에 남아 있는 값도 그대로 채운다**(사용자 결정 2026-10-15). NFC 로
       * 되돌릴 때 같은 태그를 다시 쓰는 경우가 많고, QR 상태에서는 입력란 자체가 뜨지
       * 않으므로 화면에 노출되지도 않는다.
       */
      nfcTagId: point.nfcTagId ?? '',
      useYn: point.useYn,
    },
  })

  const useYn = useWatch({ control, name: 'useYn' })
  /** 🔴 **표시 기준이 서버값에서 폼 값으로 바뀌었다** — 수단을 이 폼에서 고르기 때문이다 */
  const authenticationMethod = useWatch({ control, name: 'authenticationMethod' })

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
      /**
       * 🔴 **`authMethod` 를 항상 보낸다**(재측정 2026-10-15). 서버는 이 값이 **함께 와야**
       * `nfcTagId` 를 처리하고, 없으면 **무시하면서 200** 을 준다 — 029 의 "보내지 않는다"
       * 규칙 때문에 **TAG ID 수정이 저장되지 않고 성공으로 보였다.**
       *
       * ⚠️ 과거 400 을 맞았던 것은 **`authMethod: 10` 을 TAG ID 없이** 보낸 경우다.
       * 아래처럼 **NFC 면 TAG ID 를 항상 동봉**하므로 그 경계에 걸리지 않는다(실측:
       * 수단+태그 → 200 / 수단만 → 400 / QR 은 태그 없이 200).
       */
      authMethod: toAuthMethodCode(data.authenticationMethod),
      // 🔴 TAG ID 는 **NFC 일 때만** 보낸다. QR 로 보내 봐야 서버가 남은 값을 지우지
      // 못하고(지울 수단이 아예 없다 — 백엔드 요청 P1), 보낸 쪽만 지운 줄 안다
      nfcTagId: data.authenticationMethod === 'NFC' ? data.nfcTagId : undefined,
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
        {/* 🔴 **인증수단 선택을 되돌렸다**(사용자 결정 2026-10-15). 029 에서 뺀 이유는
            "수단이 두 곳이면 폼 쪽이 TAG ID 를 비워도 저장되는 것처럼 보인다" 였는데,
            서버가 **`authMethod` 없이는 `nfcTagId` 를 처리하지 않는다**는 사실이 드러나
            수단을 함께 보내는 것이 전제가 됐다.
            ⚠️ **상세 카드의 전환 스위치와 중복이다** — 둘 다 두고 나중에 한쪽을 뺀다 */}
        <AuthMethodSelector
          required
          value={authenticationMethod}
          onChange={(v) => setValue('authenticationMethod', v, { shouldValidate: true })}
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
