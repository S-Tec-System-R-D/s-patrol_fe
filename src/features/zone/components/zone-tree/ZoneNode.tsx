import { useState } from 'react'
import type { ZoneType } from '../../types'

//FIXME: 드롭다운, 단일 중 선택
export const ZoneNode = ({
  selected,
  zone,
  onSelect,
}: {
  selected: ZoneType | null
  zone: ZoneType
  onSelect: (zone: ZoneType) => void
}) => {
  const [show, setShow] = useState<boolean>(false)

  return (
    <div className="">
      {/* 트리거 */}
      <button
        className={`flex items-center justify-between w-full px-4 py-2 rounded-sm hover:bg-sidebar-accent cursor-pointer
          ${selected === zone ? 'bg-sidebar-accent' : ''}
          `}
        onClick={() => {
          setShow(!show)
          onSelect(zone)
        }}
      >
        <div className="flex items-center gap-2">
          {/* FIXME: 드롭다운 시 주석 해제 */}
          {/* <ChevronDownIcon
            className={`duration-150 ${show ? 'rotate-180' : 'rotate-0 '}`}
            size={16}
            strokeWidth={1}
          /> */}
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              zone.isActive ? 'bg-point' : 'border border-muted-foreground/40'
            }`}
          />
          <span className="text-body font-medium">{zone.title}</span>
        </div>

        <div
          className={`
        text-badge font-medium flex items-center justify-center w-6 h-6 aspect-square rounded-sm
        ${selected === zone ? 'bg-point-bg text-point-foreground' : 'bg-muted text-muted-foreground'}
          `}
        >
          {zone.points.length}
        </div>
      </button>
      {/* FIXME: 드롭다운 시 주석 해제 */}
      {/* {show && (
        <div className="flex flex-col gap-2 pb-2">
          {zone.points.map((p, i) => (
            <PointNode key={`pointnode` + i} point={p} />
          ))}
        </div>
      )} */}
    </div>
  )
}
