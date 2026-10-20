import { useEffect, useRef } from 'react'
import { CrosshairIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { isValidCoord } from '@/features/courses/lib/courseCoords'
import { AUTH_METHOD, type PointHistoryDetail } from '@/features/course-history/types'

/**
 * 지점 인증 상세 — **인증 위치 지도**, 핀 1개 (`spec 037`, 사용자 요청 2026-10-20).
 *
 * 🔴 **`HistoryMapCard`(036)를 재사용하지 않았다.** 그쪽은 **코스 상세 전용**이다 —
 * 제목이 `코스 구성 · 인증 현황` 고정이고, **범례 3종**을 항상 그리고, 핀에 **편성 순번**을
 * 찍고, `좌표 없음 N개` 를 머리에 적는다. 1핀 화면에 맞추려면 `title`·`legend`·`order`·
 * `missing` 을 prop 으로 받아야 하는데, 그건 036 이 032 를 복제하며 **명시적으로 거부한**
 * "prop 7개짜리 지도" 바로 그 길이다(030 T449 · 023 DoD #17 과 같은 판단).
 *
 * ⚠️ **그래서 이것이 프로젝트의 세 번째 leaflet 셸이다**(032 `CourseMapCard` · 036
 * `HistoryMapCard` · 037 이것). 🔴 **세 벌이 공유하는 것은 "지도 기계장치" 뿐이다** —
 * `map` 생성 · 타일 레이어 · `scrollWheelZoom: false` · `map.remove()` 정리 · 단일 핀 줌 ·
 * env 가드. 갈리는 것은 전부 **의미**다(제목·핀 종류·범례·라벨·선). 수요가 3곳이 됐으므로
 * **기계장치만 뽑는 것**(`useLeafletMap` 류)이 이제 실제 후보다 — 다만 032·036 을 함께
 * 건드리는 일이라 **브라우저 확인 전에는 하지 않는다**(OQ-037-F 로 남긴다).
 *
 * 🔴 **좌표가 "인증 시점 위치" 라는 것을 화면이 말한다.** 지점이 등록된 자리가 아니라
 * **근무자가 인증을 찍은 위치**다(`PointHistoryDetail.gpsLat/gpsLng`). 실측상 **완료(4) 행만
 * 값이 있고 미완료(3) 45건은 전부 `null`** 이라, 미완료 인증에서는 **카드를 그리지 않는다**
 * (036 의 "좌표 0개면 지도 비표시" 규칙 승계 — 빈 회색 박스는 자리만 차지한다).
 *
 * 🔴 **거리·오차를 판정하지 않는다.** 좌표는 **앱이 인증 시점에 채우는 값**이고 범위 밖
 * 값이 실재한다(B-33: `gpsLat: 123`). `spec 035` 가 P3 로 전달해 둔 상태다 — 등록 좌표와
 * 비교해 "몇 m 벗어났다" 를 적으면 **검증되지 않은 값으로 사람을 판단**하게 된다
 * (023 의 "인증률에 색을 입히지 않는다" 와 같은 자리).
 *
 * 🔴 **타일 주소는 env 로 받는다**(`VITE_MAP_TILE_URL`) — 이 컴포넌트는 공급자를 모른다.
 */

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined

/** 핀 1개뿐이라 `fitBounds` 를 쓸 수 없다 — 036 과 같은 줌 값을 쓴다 */
const SINGLE_PIN_ZOOM = 17

/** 🔴 인증수단 코드를 라벨로. `null` 이면 **아예 적지 않는다**(추측하지 않는다) */
const authLabel = (authMethod: number | null): string | null =>
  authMethod === AUTH_METHOD.QR ? 'QR' : authMethod === AUTH_METHOD.NFC ? 'NFC' : null

interface PointLocationMapCardProps {
  detail: PointHistoryDetail
}

const PointLocationMapCard = ({ detail }: PointLocationMapCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  /* 🔴 **범위 검사를 공유한다** — 순수 함수는 세 지도가 같은 것을 쓴다(B-33 방어) */
  const hasCoord = isValidCoord(detail.gpsLat, detail.gpsLng)
  const lat = detail.gpsLat
  const lng = detail.gpsLng

  const label = [
    detail.pointName,
    detail.checkDt.slice(11, 16),
    authLabel(detail.authMethod),
  ]
    .filter((part): part is string => part !== null)
    .join(' · ')

  useEffect(() => {
    const container = containerRef.current
    if (!container || !TILE_URL || !hasCoord || lat === null || lng === null) return

    const map = L.map(container, {
      // 🔴 스크롤 줌을 끈다 — 페이지를 내리다 지도 위를 지나면 의도치 않게 확대된다
      scrollWheelZoom: false,
      attributionControl: true,
    })

    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      // 🔴 출처 표기는 지도 제공자의 이용 조건이다 — 지우지 않는다
      attribution: TILE_ATTRIBUTION ?? '',
    }).addTo(map)

    L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        /* 🔴 **순번을 찍지 않는다** — 코스 내 순서를 모른다(`historySeq` 가 없다, US4).
           숫자를 찍으면 "1번째 지점" 으로 읽힌다. 🔴 `aria-label` 로 이름을 준다 —
           색·위치가 유일한 전달 수단이 되면 안 된다(034 선례) */
        html: `<span role="img" aria-label="${label}" class="grid size-6 place-items-center rounded-full bg-success text-white shadow"><span class="size-2 rounded-full bg-white"></span></span>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      title: label,
    })
      .addTo(map)
      .bindTooltip(label, { direction: 'top', offset: [0, -12] })

    map.setView([lat, lng], SINGLE_PIN_ZOOM)

    // 🔴 **정리한다.** 없으면 라우트를 오갈 때마다 인스턴스가 쌓이고 리스너가 샌다
    return () => {
      map.remove()
    }
  }, [hasCoord, lat, lng, label])

  /**
   * 🔴 **좌표가 없으면 카드를 아예 그리지 않는다.**
   *
   * 미완료 인증은 좌표가 **구조적으로 없다**(실측 45/45 `null`) — "표시할 좌표가 없습니다"
   * 박스를 띄우면 **매번 뜨는 안내**가 되고, 그건 알려 주는 것이 아니라 자리만 먹는다.
   * ⚠️ 036 은 코스에 좌표 없는 지점이 **섞여 있을 수 있어** 빈 상태를 띄웠다(그 수를 적어야
   * 했다). 여기는 1건이라 있거나 없거나다.
   */
  if (!TILE_URL || !hasCoord) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* 🔴 제목이 **무엇의 좌표인지** 말한다 — "지점 위치" 라고 쓰면 지점이 등록된 자리로
            읽히는데, 이 값은 **인증을 찍은 위치**다 */}
        <span className="text-panel-title font-semibold">인증 위치</span>
        {/* 🔴 아이콘을 **`MapPinOff` 에서 바꿨다**(캡쳐에서 발견 2026-10-20) — 그건 "위치
            없음" 을 뜻하는 아이콘이라, 좌표가 **있어서 그린 지도** 옆에 붙으니 뜻이 반대였다 */}
        <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
          <CrosshairIcon size={13} aria-hidden />
          인증 시점 좌표
        </span>
      </div>
      {/* 🔴 높이를 고정한다 — 지도는 자기 크기를 모른다(부모가 0이면 타일이 안 뜬다) */}
      <div ref={containerRef} className="h-[220px] w-full rounded-sm" />
    </div>
  )
}

export default PointLocationMapCard
