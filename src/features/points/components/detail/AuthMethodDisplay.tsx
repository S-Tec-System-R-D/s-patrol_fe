import { cn } from '@/lib/utils'
import { QrCodeIcon, NfcIcon } from 'lucide-react'
import type { PointAuthenticationMethod } from '@/features/points/types'

interface Props {
  /**
   * `null` 이면 양쪽 모두 비강조로 그린다.
   *
   * 서버 `authMethod` 가 미실측 코드(9·10 외)일 때 `toAuthMethodLabel` 이 `null` 을
   * 주므로 그것을 그대로 받을 수 있게 넓혔다 — 추측으로 한쪽을 강조하지 않는다(A1).
   * 🔴 **정수를 받게 바꾸지는 않는다**(`spec 022` tasks 제약 2) — 변환은 호출부에서 한다.
   */
  value: PointAuthenticationMethod | null
}

// 지점 상세 카드용 읽기전용 인증수단 세그먼트 표시. AuthMethodSelector(폼 필드)와 스타일은 동일하되 클릭 불가.
const AuthMethodDisplay = ({ value }: Props) => {
  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          'flex-1 flex items-center justify-center gap-2 text-xs font-semibold border p-2 rounded-sm',
          value === 'QR' ? 'border-point bg-point/5 text-point' : 'text-muted-foreground'
        )}
      >
        <QrCodeIcon size={16} />
        QR
      </div>
      <div
        className={cn(
          'flex-1 flex items-center justify-center gap-2 text-xs font-semibold border p-2 rounded-sm',
          value === 'NFC' ? 'border-point bg-point/5 text-point' : 'text-muted-foreground'
        )}
      >
        <NfcIcon size={16} />
        NFC
      </div>
    </div>
  )
}

export default AuthMethodDisplay
