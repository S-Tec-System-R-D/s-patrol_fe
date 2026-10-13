import { useState } from 'react'
import { NfcIcon, QrCodeIcon, RefreshCwIcon } from 'lucide-react'

import AppAlertDialog from '@/components/AppAlertDialog'
import { cn } from '@/lib/utils'

import { useChangeAuthMethod } from '../../hooks/useChangeAuthMethod'
import { toAuthMethodLabel } from '../../lib/authMethod'
import AuthMethodChangeDialog from './AuthMethodChangeDialog'

/**
 * 인증수단 **전환 스위치** (`spec 029` T418~T423).
 *
 * 027 은 조회 화면에서 선택되지 않은 값을 보여 주면 **"바꿀 수 있는 것" 으로 오해**된다며
 * 2칸 세그먼트를 버렸다. 029 에서 **되살린다** — 이제 **정말로 바꿀 수 있기 때문이다**
 * (사용자 결정 2026-10-13). 오해였던 것이 사실이 됐으므로 판단이 뒤집힌 것이 맞다.
 *
 * 🔴🔴 **방향이 비대칭이다 — 서버가 그렇게 생겼다**(WF-1-0 실측):
 * - `NFC → QR` : 확인 모달 한 번
 * - `QR → NFC` : **TAG ID 입력 모달**(없이 보내면 400)
 *
 * 🔴 **옵티미스틱이 아니다.** 스위치는 `point.authMethod`(서버값)만 따른다 — 누른 즉시
 * 바뀌게 하면 **TAG ID 입력을 취소했을 때 화면과 서버가 어긋난 채 남는다.** 재조회가
 * 끝나기 전까지 이전 수단에 머무는 것이 **정상 동작**이다(코스 토글과 같은 규약).
 */

const OPTIONS = [
  { value: 'QR' as const, icon: QrCodeIcon, hint: '출력 후 현장 부착' },
  { value: 'NFC' as const, icon: NfcIcon, hint: '태그 ID 등록 필요' },
]

const PointCredentialSwitch = ({
  pointSeq,
  authMethod,
}: {
  pointSeq: number
  authMethod: number
}) => {
  const current = toAuthMethodLabel(authMethod)
  const change = useChangeAuthMethod(pointSeq)

  const [toQrOpen, setToQrOpen] = useState(false)
  const [toNfcOpen, setToNfcOpen] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ value, icon: Icon, hint }) => {
          const active = current === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              // 🔴 현재 수단을 다시 눌러도 아무 일이 없다 — 같은 값으로 요청을 보내지 않는다
              disabled={active || change.isPending}
              onClick={() => (value === 'QR' ? setToQrOpen(true) : setToNfcOpen(true))}
              className={cn(
                'flex items-start gap-2 rounded-sm border p-3 text-left transition-colors',
                active
                  ? 'border-point bg-point/5 text-point'
                  : 'border-border text-muted-foreground hover:bg-muted/60',
                change.isPending && 'opacity-60'
              )}
            >
              <Icon size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="text-body font-semibold">{value}</span>
                {/* 🔴 선택된 쪽은 **현재 상태**를, 아닌 쪽은 **바꾸면 필요한 것**을 말한다 */}
                <span className="text-caption text-muted-foreground">
                  {active ? '현재 사용 중' : hint}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* NFC → QR : 받을 값이 없어 확인만 한다.
          🔴 **TAG ID 가 서버에 남는다는 말은 하지 않는다**(B-15) — 화면에 없는 값이고,
          사용자가 할 수 있는 일도 없다. 알려 줄 것은 **태그가 더는 통하지 않는다**는 사실이다 */}
      <AppAlertDialog
        open={toQrOpen}
        onOpenChange={setToQrOpen}
        size="sm"
        icon={RefreshCwIcon}
        title="QR 인증으로 변경하시겠습니까?"
        description="변경하면 등록된 NFC 태그로는 인증할 수 없습니다. QR 코드를 출력해 현장에 부착해주세요."
        actionLabel="변경"
        onAction={() => change.mutate({ to: 'QR' })}
      />

      {/* QR → NFC : TAG ID 를 받아야만 보낼 수 있다 */}
      <AuthMethodChangeDialog
        open={toNfcOpen}
        onOpenChange={setToNfcOpen}
        isPending={change.isPending}
        onSubmit={(nfcTagId) =>
          change.mutate(
            { to: 'NFC', nfcTagId },
            // 🔴 **성공해야 닫는다** — 실패하면 입력한 14자리가 남아 있어야 한다
            { onSuccess: () => setToNfcOpen(false) }
          )
        }
      />
    </div>
  )
}

export default PointCredentialSwitch
