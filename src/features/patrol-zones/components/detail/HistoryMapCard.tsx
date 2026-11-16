import { useEffect, useRef } from 'react'
import { MapPinOffIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { AUTH_METHOD } from '@/features/course-history/types'
import { cn } from '@/lib/utils'

import type { HistoryPin, HistoryPinKind } from '../../lib/historyCoords'

/**
 * 회차 상세 — **코스 경로 지도** (`spec 036` T517 → 🔄 `spec 077` 시안 `개선안/순찰이력`).
 *
 * 🔴 **`CourseMapCard`(032)를 복제했다 — 공용화하지 않았다**(036 판단 그대로 — 갈리는 것이
 * 핀 종류 · 라벨 · 선택 연동이라 prop 이 늘면 잘못된 조합이 타입을 통과한다).
 * ✅ 순수 함수는 공유한다 — 범위 검사는 `courseCoords.isValidCoord` 하나다.
 *
 * 🔄 **077 에서 바뀐 것**
 * - 오른쪽 열로 옮겼다(타임라인이 왼쪽 넓은 칸). 제목 `코스 경로`.
 * - **핀 4종** — 타임라인 뱃지 · 대시보드 단계와 같은 말(인증 · 미인증 · 다음 · 대기, `spec 079` D8).
 *   🔴 `danger` 를 쓰지 않는다 — 미인증은 대시보드처럼 `warning`(주황)이다.
 * - **행 ↔ 핀 서로 강조**: 핀을 누르면 `onSelect`, 고른 핀은 테두리 고리 + 지도가 그 핀으로 옮긴다.
 *   🔴 고를 때마다 지도를 다시 만들지 않는다 — 마커만 아이콘을 바꾼다(타일이 깜빡이지 않게).
 * - 좌표 없는 지점은 **수가 아니라 이름으로** 지도 밑에 적는다(시안).
 *
 * 🔴 **타일 주소는 env 로 받는다**(`VITE_MAP_TILE_URL`). 🔴🔴 OSM 공식 타일은 개발 · 테스트 한정(032 DoD #12).
 */

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined

/** 핀 1개뿐일 때의 줌. `fitBounds` 는 점 하나에 쓸 수 없다 */
const SINGLE_PIN_ZOOM = 17

/** 핀 모양 — 🔴 **색과 채움이 함께 바뀐다**(034 선례: 색만으로 전하지 않는다) */
const PIN_STYLE: Record<HistoryPinKind, { className: string; label: string }> = {
  checked: { className: 'bg-success text-white', label: '인증' },
  // 대시보드 단계와 같은 말 · 같은 주황 — 미완료(3)는 시각 유무와 상관없이 미인증 하나(D8)
  incomplete: { className: 'bg-warning text-white', label: '미인증' },
  next: { className: 'border-2 border-point bg-card text-point', label: '다음' },
  waiting: {
    className: 'border border-dashed border-muted-foreground bg-card text-muted-foreground',
    label: '대기',
  },
}

const formatTime = (value: string): string => value.slice(11, 16)

const authLabel = (authMethod: number | null): string | null =>
  authMethod === AUTH_METHOD.QR ? 'QR' : authMethod === AUTH_METHOD.NFC ? 'NFC' : null

const pinLabel = (pin: HistoryPin): string => {
  const parts = [
    pin.checkedAt === null ? null : formatTime(pin.checkedAt),
    authLabel(pin.authMethod),
    /* 🔴 **폴백한 핀만 그 사실을 적는다** — `'check'` 는 등록 좌표가 없어 **인증한 위치**로 찍은 것이다 */
    pin.source === 'check' ? '인증 위치(지점 좌표 없음)' : null,
  ].filter((part): part is string => part !== null)

  const head = `${pin.order}. ${pin.name} — ${PIN_STYLE[pin.kind].label}`
  return parts.length === 0 ? head : `${head} · ${parts.join(' · ')}`
}

const pinIcon = (pin: HistoryPin, selected: boolean) =>
  L.divIcon({
    className: '',
    /* 🔴 순번 = `orderNo`(타임라인과 같은 번호) · `aria-label` — 색이 유일한 전달 수단이 되면 안 된다 */
    html: `<span role="img" aria-label="${pinLabel(pin)}" class="grid size-6 place-items-center rounded-full text-[11px] font-bold shadow transition-transform ${PIN_STYLE[pin.kind].className} ${selected ? 'scale-125 ring-4 ring-point/40' : ''}">${pin.order}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

interface HistoryMapCardProps {
  pins: HistoryPin[]
  missing: number
  missingPoints?: { order: number; name: string }[]
  /** 타임라인에서 고른 행(`detailSeq`) — 그 핀을 강조하고 지도를 옮긴다 */
  selected?: number | null
  onSelect?: (detailSeq: number) => void
}

const HistoryMapCard = ({ pins, missing, missingPoints = [], selected = null, onSelect }: HistoryMapCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef(new Map<number, { marker: L.Marker; pin: HistoryPin }>())
  // 🔴 핀 클릭 콜백은 ref 로 — 지도를 다시 만들지 않고 최신 콜백을 부른다
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !TILE_URL || pins.length === 0) return

    // 🔴 스크롤 줌을 끈다 — 페이지를 내리다 지도 위를 지나면 의도치 않게 확대된다
    const map = L.map(container, { scrollWheelZoom: false, attributionControl: true })
    mapRef.current = map

    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION ?? '' }).addTo(map)

    /* 🔴 경로선 = 전체 핀을 **편성 순서**로 잇는 점선(036 — 실제 동선이 아니라 코스 구성이다) */
    const latLngs = pins.map((pin) => [pin.lat, pin.lng] as [number, number])
    if (latLngs.length > 1) {
      L.polyline(latLngs, { color: 'var(--color-point)', weight: 3, opacity: 0.8, dashArray: '6 6' }).addTo(map)
    }

    const markers = markersRef.current
    markers.clear()
    pins.forEach((pin) => {
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin, false), title: pinLabel(pin) })
        .addTo(map)
        .bindTooltip(pinLabel(pin), { direction: 'top', offset: [0, -12] })
      marker.on('click', () => onSelectRef.current?.(pin.detailSeq))
      markers.set(pin.detailSeq, { marker, pin })
    })

    if (latLngs.length === 1) map.setView(latLngs[0], SINGLE_PIN_ZOOM)
    else map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32] })

    // 🔴 **정리한다.** 없으면 라우트를 오갈 때마다 인스턴스가 쌓이고 리스너가 샌다
    return () => {
      markers.clear()
      mapRef.current = null
      map.remove()
    }
  }, [pins])

  /* 고른 핀만 아이콘을 바꾼다 · 지도는 그 핀으로 옮긴다(줌은 그대로) */
  useEffect(() => {
    markersRef.current.forEach(({ marker, pin }, detailSeq) => {
      marker.setIcon(pinIcon(pin, detailSeq === selected))
      marker.setZIndexOffset(detailSeq === selected ? 1000 : 0)
    })
    const hit = selected === null ? undefined : markersRef.current.get(selected)
    if (hit && mapRef.current) mapRef.current.panTo(hit.marker.getLatLng())
  }, [selected, pins])

  /* 🔴 **설정이 없으면 지도를 그리지 않는다** — 키 · URL 없이도 나머지 화면이 멀쩡히 개발돼야 한다 */
  if (!TILE_URL) {
    return (
      <Shell missing={missing} missingPoints={missingPoints}>
        <Notice title="지도 설정이 없습니다" description="VITE_MAP_TILE_URL 이 설정되지 않았습니다." />
      </Shell>
    )
  }

  if (pins.length === 0) {
    /* 🔴 **좌표 0개는 장애가 아니라 사실이다** — 실패 문구를 쓰지 않는다 */
    return (
      <Shell missing={missing} missingPoints={missingPoints}>
        <Notice title="표시할 좌표가 없습니다" description="지점에 좌표가 등록되면 지도에 표시됩니다." />
      </Shell>
    )
  }

  return (
    <Shell missing={missing} missingPoints={missingPoints}>
      {/* 🔴 높이를 고정한다 — 지도는 자기 크기를 모른다(부모가 0이면 타일이 안 뜬다) */}
      <div ref={containerRef} className="h-[360px] w-full rounded-sm" />
      <Legend />
    </Shell>
  )
}

const Legend = () => (
  <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
    {(Object.keys(PIN_STYLE) as HistoryPinKind[]).map((kind) => (
      <li key={kind} className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <span aria-hidden className={cn('size-3.5 rounded-full', PIN_STYLE[kind].className)} />
        {PIN_STYLE[kind].label}
      </li>
    ))}
  </ul>
)

const Shell = ({
  missing = 0,
  missingPoints = [],
  children,
}: {
  missing?: number
  missingPoints?: { order: number; name: string }[]
  children: React.ReactNode
}) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-panel-title font-semibold">코스 경로</span>
      <span className="text-caption text-muted-foreground">행 · 핀을 누르면 서로 표시</span>
    </div>
    {children}
    {missing > 0 && (
      /* 🔴 **좌표 없는 지점을 이름으로 적는다**(시안). 조용히 빼면 어느 지점이 빠졌는지 알 수 없다.
         🔴 남은 핀의 번호는 그대로다 — 같은 지점을 타임라인과 다른 번호로 부르지 않는다 */
      <p className="flex items-start gap-1 text-caption text-muted-foreground">
        <MapPinOffIcon size={13} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        <span>
          좌표 없음 {missing}개
          {missingPoints.length > 0 &&
            ` — ${missingPoints.map((point) => `${point.order}. ${point.name}`).join(', ')}`}
        </span>
      </p>
    )}
  </div>
)

const Notice = ({ title, description }: { title: string; description: string }) => (
  <div className="flex h-[160px] flex-col items-center justify-center gap-1 rounded-sm bg-muted/40 text-center">
    <p className="text-body font-medium text-foreground">{title}</p>
    <p className="text-caption text-muted-foreground">{description}</p>
  </div>
)

export default HistoryMapCard
