import { cn } from '@/lib/utils'
import { QrCodeIcon, NfcIcon } from 'lucide-react'
import type { PointAuthenticationMethod } from '@/features/points/types'

interface Props {
  value: PointAuthenticationMethod
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
