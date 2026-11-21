import { cn } from '@/lib/utils'
import { QrCodeIcon, NfcIcon } from 'lucide-react'
import type { PointAuthenticationMethod } from '@/features/points/types'

interface Props {
  value?: PointAuthenticationMethod
  onChange: (value: PointAuthenticationMethod) => void
  error?: string
  required?: boolean
}

const AuthMethodSelector = ({ value, onChange, error, required }: Props) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-[12px] font-medium text-sub-foreground">
        인증수단
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange('QR')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 text-xs font-semibold border p-2 rounded-sm transition-colors cursor-pointer',
            value === 'QR' ? 'border-point bg-point/5 text-point' : 'hover:bg-muted'
          )}
        >
          <QrCodeIcon size={16} />
          QR
        </button>
        <button
          type="button"
          onClick={() => onChange('NFC')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 text-xs font-semibold border p-2 rounded-sm transition-colors cursor-pointer',
            value === 'NFC' ? 'border-point bg-point/5 text-point' : 'hover:bg-muted'
          )}
        >
          <NfcIcon size={16} />
          NFC
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export default AuthMethodSelector
