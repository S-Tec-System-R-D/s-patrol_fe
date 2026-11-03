import AppButton from '@/components/app/AppButton'

import type { AreaState } from '../types'

/**
 * 하단 패널(최근 기록 · 공지)의 조회 중 · 실패 — `spec 068`. 두 패널이 같은 모양이라 하나로 둔다.
 * 🔴 조회 중 · 실패를 "기록이 없습니다" 로 보여주지 않는다.
 */

interface AreaFallbackProps {
  state: Exclude<AreaState, 'ready'>
  /** 실패 문구의 대상 — `{label}을(를) 불러오지 못했습니다` */
  label: string
  onRetry: () => void
}

const AreaFallback = ({ state, label, onRetry }: AreaFallbackProps) =>
  state === 'loading' ? (
    <div className="flex flex-col gap-2 py-1" aria-label="불러오는 중">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-8 animate-pulse rounded-sm bg-muted" />
      ))}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-caption text-muted-foreground">{label}을 불러오지 못했습니다</p>
      <AppButton variant="sub" onClick={onRetry}>
        다시 시도
      </AppButton>
    </div>
  )

export default AreaFallback
