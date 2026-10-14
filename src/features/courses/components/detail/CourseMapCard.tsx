import { useEffect, useRef } from 'react'
import { MapPinOffIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { CoursePin } from '../../lib/courseCoords'

/**
 * 코스 **순찰 동선 지도** (`spec 032` — `spec 023` 이 D단으로 남긴 자리).
 *
 * 🔴 **Leaflet 을 직접 다룬다**(`react-leaflet` 없음). 쓰는 API 는 **지도 생성·타일·마커·
 * 폴리라인·fitBounds** 다섯뿐이고, 래퍼를 쓰면 **React 19 호환을 하나 더** 떠안는다.
 * 대신 **정리(`map.remove()`)를 명시**한다 — 안 하면 라우트를 오갈 때마다 지도 인스턴스가
 * 쌓이고 이벤트 리스너가 샌다.
 *
 * 🔴 **타일 주소는 env 로 받는다**(`VITE_MAP_TILE_URL`) — 이 컴포넌트는 **공급자를 모른다**.
 * 개발은 OSM(키 불필요)으로 확인하고, 운영은 V-World 로 바꾼다. 🔴🔴 **OSM 공식 타일은
 * 개발·테스트 한정**이라 운영 배포 전 반드시 전환해야 한다(`spec.md` DoD #12).
 *
 * 🔴 **좌표가 범위 밖이거나 없는 지점은 여기 오지 않는다** — `lib/courseCoords.ts` 가
 * 걸러낸다(B-33: 서버에 `gpsLat: 123` 이 실재한다).
 */

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined

/** 지점 1개뿐일 때의 줌. `fitBounds` 는 점 하나에 쓸 수 없다 */
const SINGLE_PIN_ZOOM = 17

interface CourseMapCardProps {
  pins: CoursePin[]
  /** 좌표가 없거나 범위 밖이라 빠진 지점 수. 🔴 0 이 아니면 **그 사실을 적는다** */
  missing: number
}

const CourseMapCard = ({ pins, missing }: CourseMapCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !TILE_URL || pins.length === 0) return

    const map = L.map(container, {
      // 🔴 스크롤 줌을 끈다 — 페이지를 내리다 지도 위를 지나면 **의도치 않게 확대**된다.
      //    확대·축소는 좌상단 버튼으로 한다
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      // 🔴 출처 표기는 **지도 제공자의 이용 조건**이다 — 지우지 않는다
      attribution: TILE_ATTRIBUTION ?? '',
    }).addTo(map)

    const latLngs = pins.map((pin) => [pin.lat, pin.lng] as [number, number])

    // 🔴 **경로선은 점선**이다 — 좌표가 빠진 지점이 있으면 그 구간을 건너뛴 직선이라
    //    실제 동선과 다르다. 점선으로 "추정" 임을 보인다
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: 'var(--color-point)',
        weight: 3,
        opacity: 0.8,
        dashArray: '6 6',
      }).addTo(map)
    }

    pins.forEach((pin) => {
      L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: '',
          // 🔴 **순번을 쓴다** — 지도의 값어치는 "어디" 와 "어느 순서로" 가 함께 보일 때다
          html: `<span class="grid size-6 place-items-center rounded-full bg-point text-[11px] font-bold text-white shadow">${pin.order}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        title: pin.name,
      })
        .addTo(map)
        .bindTooltip(`${pin.order}. ${pin.name}`, { direction: 'top', offset: [0, -12] })
    })

    if (latLngs.length === 1) {
      map.setView(latLngs[0], SINGLE_PIN_ZOOM)
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32] })
    }

    // 🔴 **정리한다.** 없으면 라우트를 오갈 때마다 인스턴스가 쌓인다
    return () => {
      map.remove()
    }
  }, [pins])

  /* 🔴 **설정이 없으면 지도를 그리지 않는다** — 키·URL 없이도 나머지 화면이 멀쩡히
     개발돼야 한다(팀원·CI) */
  if (!TILE_URL) {
    return (
      <Shell>
        <Notice title="지도 설정이 없습니다" description="VITE_MAP_TILE_URL 이 설정되지 않았습니다." />
      </Shell>
    )
  }

  if (pins.length === 0) {
    // 호출부가 이 경우 다이어그램으로 되돌아가므로 보통 여기 오지 않는다 — 방어선이다
    return (
      <Shell>
        <Notice
          title="표시할 좌표가 없습니다"
          description="지점에 좌표가 등록되면 순찰 동선이 지도에 표시됩니다."
        />
      </Shell>
    )
  }

  return (
    <Shell missing={missing}>
      {/* 🔴 높이를 고정한다 — 지도는 자기 크기를 모른다(부모가 0이면 타일이 안 뜬다) */}
      <div ref={containerRef} className="h-[320px] w-full rounded-sm" />
    </Shell>
  )
}

/** 카드 셸 + 머리말. 🔴 **빠진 지점 수를 머리에 적는다**(조용히 빼지 않는다) */
const Shell = ({ missing = 0, children }: { missing?: number; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-panel-title font-semibold">순찰 동선</span>
      {missing > 0 && (
        /* 🔴 **"좌표 없음 N개" 를 명시한다.** 조용히 빼면 핀이 빠진 지도가 되고
           어느 지점이 빠졌는지 알 수 없다(`spec 032` §3 규칙 1) */
        <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
          <MapPinOffIcon size={13} strokeWidth={1.75} />
          좌표 없음 {missing}개
        </span>
      )}
    </div>
    {children}
  </div>
)

const Notice = ({ title, description }: { title: string; description: string }) => (
  <div className="flex h-[160px] flex-col items-center justify-center gap-1 rounded-sm bg-muted/40 text-center">
    <p className="text-body font-medium text-foreground">{title}</p>
    <p className="text-caption text-muted-foreground">{description}</p>
  </div>
)

export default CourseMapCard
