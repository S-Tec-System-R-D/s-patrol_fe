import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { isValidCoord } from '@/features/courses/lib/courseCoords'

/**
 * 지점 상세 속성 패널의 **지도** — 등록 좌표 핀 1개 (`spec 076` 시안 개선 B).
 *
 * 🔴 **`PointLocationMapCard`(037)를 쓰지 않는다** — 그쪽은 **인증 시점 좌표** 카드다
 * (제목 `인증 위치` · 초록 핀 · 시각 라벨). 이것은 **지점이 등록된 자리**이고 카드 없이
 * 패널 맨 위에 붙는다. 같은 지도 기계장치를 다시 쓰는 네 번째 셸이다(OQ-037-F 그대로).
 *
 * 🔴 좌표가 없거나 범위 밖(B-33)이면 **빗금 칸**에 그 사실을 적는다 — 패널 머리 자리라
 * 비워 두면 레이아웃이 출렁인다. 타일 주소가 없을 때(테스트 · env 미설정)도 같은 칸이다.
 */

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined

/** 핀 1개 — `fitBounds` 대신 고정 줌(037 과 같은 값) */
const SINGLE_PIN_ZOOM = 17

const PointMiniMap = ({
  lat,
  lng,
  name,
}: {
  lat: number | null
  lng: number | null
  name: string
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hasCoord = isValidCoord(lat, lng)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !TILE_URL || !hasCoord || lat === null || lng === null) return

    // 🔴 스크롤 줌을 끈다 — 페이지를 내리다 지도 위를 지나면 확대된다
    const map = L.map(container, { scrollWheelZoom: false, attributionControl: true })
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION ?? '' }).addTo(map)
    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<span role="img" aria-label="${name} 위치" class="grid size-7 place-items-center rounded-full bg-foreground text-background shadow"><span class="size-2 rounded-full bg-background"></span></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
      title: name,
    }).addTo(map)
    map.setView([lat, lng], SINGLE_PIN_ZOOM)

    return () => {
      map.remove()
    }
  }, [hasCoord, lat, lng, name])

  if (!TILE_URL || !hasCoord) {
    return (
      <div className="grid h-[220px] place-items-center bg-[repeating-linear-gradient(45deg,var(--color-muted)_0_10px,transparent_10px_20px)] text-caption text-muted-foreground">
        {hasCoord ? '지도를 표시할 수 없습니다' : '등록된 좌표가 없습니다'}
      </div>
    )
  }

  // 🔴 높이 고정 — 지도는 자기 크기를 모른다(부모가 0 이면 타일이 안 뜬다)
  return <div ref={containerRef} className="h-[220px] w-full" />
}

export default PointMiniMap
