import AppButton from '@/components/app/AppButton'
import { MapPinIcon, TriangleAlertIcon } from 'lucide-react'

import type { PointRow } from '../types'
import PointListCard from './PointListCard'

/**
 * 지점 목록.
 *
 * 🔴 **조회 실패와 0건을 구분해 보여준다.** 둘 다 "아무것도 없음"으로 그리면 장애를
 * 데이터 없음으로 오해하고, 사용자는 지점을 새로 만들려 한다(`spec 022` §4).
 * 022 전까지는 0건 처리조차 없었다(mock 15건을 무조건 `map`).
 */
interface PointListProps {
  items: PointRow[]
  selectedSeq: number | null
  onSelectPoint: (pointSeq: number) => void
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  onRetry?: () => void
}

const PointList = ({
  items,
  selectedSeq,
  onSelectPoint,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: PointListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* 행 높이(약 44px)를 유지해 로딩→목록 전환에서 레이아웃이 튀지 않게 한다 */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="not-last:border-b border-border/50 px-3.5 py-[11px]">
            <div className="h-[22px] animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <TriangleAlertIcon size={20} className="text-danger-foreground" strokeWidth={1.5} />
        <p className="text-caption text-muted-foreground">
          {errorMessage ?? '지점 목록을 불러오지 못했습니다.'}
        </p>
        {onRetry && (
          <AppButton variant="sub" onClick={onRetry}>
            다시 시도
          </AppButton>
        )}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <MapPinIcon size={20} className="text-muted-foreground" strokeWidth={1.5} />
        <p className="text-caption text-muted-foreground">등록된 지점이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((point, i) => (
        <PointListCard
          key={point.pointSeq}
          point={point}
          idx={i + 1}
          selected={point.pointSeq === selectedSeq}
          onClick={onSelectPoint}
        />
      ))}
    </div>
  )
}

export default PointList
