import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import AppButton from '@/components/app/AppButton'
import AppDialog from '@/components/app/AppDialog'
import AppInput from '@/components/app/AppInput'

import { authSwitchSchema, type AuthSwitchFormData } from '../../form/schema'

/**
 * **QR → NFC 전환** 모달 (`spec 029` T420).
 *
 * 🔴 **왜 모달인가 — 확인만으로는 바꿀 수 없다.** 서버는 `authMethod: 10` 을 `nfcTagId`
 * 없이 받으면 **400**(`"NFC 값을 입력해주세요."`)을 준다(WF-1-0 실측 2026-10-13). 즉
 * "TAG ID 없이 NFC 로 바꾸기" 는 **존재하지 않는 경로**다. 반대 방향(NFC→QR)은 받을 값이
 * 없어 확인 모달로 끝난다 — **전환이 방향에 따라 비대칭인 것은 서버가 그렇게 생겨서다.**
 *
 * 🔴 **성공해야 닫는다.** 실패했는데 닫으면 방금 입력한 14자리를 다시 쳐야 한다. 닫기는
 * 부모가 `onSuccess` 로 제어한다(`EditPointForm` 과 같은 모양).
 *
 * 🔴 **실패 문구를 여기서 만들지 않는다** — 전역 `MutationCache.onError` 가 서버 문구를
 * 그대로 띄운다. 이 엔드포인트는 **사유를 말해 주는 드문 경우**라(B-17 의 예외) 우리가
 * 다시 쓰면 오히려 정보가 준다.
 */
const AuthMethodChangeDialog = ({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (nfcTagId: string) => void
  isPending: boolean
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AuthSwitchFormData>({
    resolver: zodResolver(authSwitchSchema),
    defaultValues: { nfcTagId: '' },
  })

  const close = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title="NFC 인증으로 변경"
      /* 🔴 **기존 QR 이 못 쓰게 된다는 사실을 먼저 말한다.** 현장에 이미 부착된 코드가
         있을 수 있고, 그걸 모른 채 바꾸면 근무자가 현장에서야 알게 된다 */
      description="변경하면 현재 부착된 QR 코드로는 인증할 수 없습니다. 사용할 NFC 태그 ID를 등록해주세요."
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data.nfcTagId))} className="space-y-4">
        <AppInput
          label="NFC TAG ID"
          required
          placeholder="14자리 HEX"
          error={errors.nfcTagId?.message}
          {...register('nfcTagId')}
        />

        <div className="flex justify-end gap-2">
          <AppButton variant="sub" type="button" onClick={close} disabled={isPending}>
            취소
          </AppButton>
          <AppButton type="submit" disabled={isPending}>
            {isPending ? '변경 중…' : 'NFC로 변경'}
          </AppButton>
        </div>
      </form>
    </AppDialog>
  )
}

export default AuthMethodChangeDialog
