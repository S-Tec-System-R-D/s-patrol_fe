import { useEffect, useRef } from 'react'
import { MapPinOffIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { isValidCoord } from '@/features/courses/lib/courseCoords'
import { AUTH_METHOD, POINT_HISTORY_STATUS, type PointHistoryDetail } from '@/features/course-history/types'

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
 * 값이 있고 미완료(3) 45건은 전부 `null`** 이다. 왼쪽 본문 카드는 좌표가 없으면 그리지 않고,
 * 🔄 오른쪽 단은 **자리를 두고 `인증 시점 좌표가 없습니다` 를 적는다**(`spec 078` D5 —
 * 지도가 통째로 사라지면 "어디 갔나" 가 된다).
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
  /**
   * 🔄 `spec 078` — 특이사항이 있으면 지도는 **오른쪽 인증 정보 패널 맨 위**로 간다(시안). 그때는 카드 틀 ·
   * 제목 없이 지도와 좌표 한 줄만 그린다(패널이 틀을 갖는다)
   */
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

  if (!TILE_URL) return null

  /* 🔄 `spec 078` D5 — 오른쪽 패널은 좌표가 없어도 지도 자리를 둔다. 왼쪽 본문은 페이지가 좌표 있을 때만 쓴다.
     D7 — 미인증(서버 3)은 찍지 않아 위치가 없는 게 맞다 / 완료인데 없으면 값이 빠진 것 — 문구를 나눈다 */
  if (!hasCoord) {
    const notChecked = detail.status !== POINT_HISTORY_STATUS.COMPLETED
    return (
      <section className="flex flex-col gap-2.5">
        <h2 className="text-panel-title font-semibold">인증 위치</h2>
        <div className="flex h-[260px] w-full flex-col items-center justify-center gap-2 rounded-[10px] border border-border bg-muted/50 text-muted-foreground">
          <MapPinOffIcon size={20} aria-hidden />
          <span className="text-caption">
            {notChecked ? '인증하지 않아 위치가 없습니다' : '인증 시점 좌표가 없습니다'}
          </span>
        </div>
      </section>
    )
  }

  /* 🔄 `spec 084`(목업 `13`): 오른쪽 단의 한 영역 — 제목 옆에 좌표(전에는 지도 위에 얹은 글자였다) */
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-panel-title font-semibold">인증 위치</h2>
        <span className="text-caption text-muted-foreground tabular-nums">
          인증 시점 좌표 · {lat?.toFixed(4)}, {lng?.toFixed(4)}
        </span>
      </div>
      <div ref={containerRef} className="h-[260px] w-full overflow-hidden rounded-[10px] border border-border" />
    </section>
  )
}

export default PointLocationMapCard
