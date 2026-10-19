import { useEffect, useRef } from 'react'
import { MapPinOffIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { AUTH_METHOD } from '@/features/course-history/types'

import type { HistoryPin, HistoryPinKind } from '../../lib/historyCoords'

/**
 * 코스 순찰 상세 — **인증 위치 지도** (`spec 036` T517·T518).
 *
 * 🔴 **`CourseMapCard`(032)를 복제했다 — 공용화하지 않았다.** 셸·env 분기·정리·`fitBounds`
 * 는 같지만 갈리는 것이 셋이다: ① 핀이 **3종**(색 + 채움/빈 원) ② 라벨에 **시각·인증수단**
 * ③ 경로선이 **실제 인증 순서**다. 공용 컴포넌트로 묶으면 `pinKind`·`tooltipRenderer`·
 * `polylineFilter`·`title` 까지 **prop 7개**가 되고 잘못된 조합이 타입을 통과한다.
 * 030 T449·023 DoD #17 과 같은 판단 — **갈라질 셸은 뽑지 않는다.**
 * ✅ 대신 **순수 함수는 공유한다** — 범위 검사는 `courseCoords.isValidCoord` 하나다.
 *
 * 🔴 **032 와 지도의 뜻이 다르다.** 032 는 "이 코스는 어디를 도는가"(편성)이고, 이쪽은
 * "이 회차에 실제로 무슨 일이 있었나"다. 그래서 제목도 `순찰 동선` 이 아니라 `인증 위치` 다.
 *
 * 🔴 **타일 주소는 env 로 받는다**(`VITE_MAP_TILE_URL`) — 이 컴포넌트는 공급자를 모른다.
 * 🔴🔴 **OSM 공식 타일은 개발·테스트 한정**이라 운영 전 V-World 전환이 필요하다(032 DoD #12).
 */

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL as string | undefined
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined

/** 핀 1개뿐일 때의 줌. `fitBounds` 는 점 하나에 쓸 수 없다 */
const SINGLE_PIN_ZOOM = 17

/**
 * 핀 3종의 모양 — 🔴 **색과 형태가 함께 바뀐다**(034 선례: 색만으로 전하지 않는다).
 *
 * `design-system.md` §1-1 매트릭스 안에서 고른다(새 토큰·새 색을 만들지 않는다):
 * - `checked` → `success`("지점 결과 = 이상없음 / 완료")
 * - `incomplete` → `warning`("주의 상태") — **갔는데 인증이 안 됐다**. 점검할 일이 있다
 * - `norecord` → `muted`("대기중 / 비활성 / 비강조") + **빈 원**
 *
 * 🔴 **`danger` 를 쓰지 않는다.** `norecord` 에는 `status 0 대기중`·`1 진행중` 이 함께
 * 들어온다 — 진행 중인 회차에서 **아직 안 간 지점을 빨갛게 칠하면 없는 문제를 만든다**.
 * 심각도 판정은 **인증 내역 표**가 한다(뱃지 최대 3개 병기). 지도의 일은 위치다.
 * 023 의 "인증률에 색을 입히지 않는다" 와 같은 자리다.
 */
const PIN_STYLE: Record<HistoryPinKind, { className: string; label: string }> = {
  checked: { className: 'bg-success text-white', label: '인증' },
  incomplete: { className: 'bg-warning text-white', label: '미인증(방문 기록 있음)' },
  // 🔴 **빈 원** — 채움 여부가 곧 "기록이 있나" 다. 색각과 무관하게 갈린다
  norecord: {
    className: 'border border-dashed border-muted-foreground bg-card text-muted-foreground',
    label: '기록 없음',
  },
}

/** `'2026-05-01T10:06:00'` → `'10:06'` — 같은 회차라 날짜는 헤더가 이미 말한다 */
const formatTime = (value: string): string => value.slice(11, 16)

/** 🔴 인증수단 코드를 라벨로. `null` 이면 아예 적지 않는다(추측하지 않는다) */
const authLabel = (authMethod: number | null): string | null =>
  authMethod === AUTH_METHOD.QR ? 'QR' : authMethod === AUTH_METHOD.NFC ? 'NFC' : null

/**
 * 핀 라벨 한 줄. ✅ **`checkedAt`·`authMethod` 가 있으면 붙는다**(OQ-15 해소 2026-10-19).
 * 둘은 **따로 움직인다** — 미완료 행은 시각만 있고 수단은 `null` 이다(실측 0/45).
 */
const pinLabel = (pin: HistoryPin): string => {
  const parts = [
    pin.checkedAt === null ? null : formatTime(pin.checkedAt),
    authLabel(pin.authMethod),
    /* 🔴 **폴백한 핀만 그 사실을 적는다.** 기본은 지점 등록 좌표(= 지점이 있는 자리)이고,
       `'check'` 는 등록 좌표가 없어 **인증한 위치**로 대신 찍은 것이다 — 지점 자리가 아니다 */
    pin.source === 'check' ? '인증 위치(지점 좌표 없음)' : null,
  ].filter((part): part is string => part !== null)

  const head = `${pin.order}. ${pin.name} — ${PIN_STYLE[pin.kind].label}`
  return parts.length === 0 ? head : `${head} · ${parts.join(' · ')}`
}

interface HistoryMapCardProps {
  pins: HistoryPin[]
  /** 좌표를 구하지 못해 빠진 지점 수. 🔴 0 이 아니면 **그 사실을 적는다** */
  missing: number
}

const HistoryMapCard = ({ pins, missing }: HistoryMapCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !TILE_URL || pins.length === 0) return

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

    /* 🔴🔴 **경로선은 전체 핀을 편성 순서로 잇는다 — 이 선이 "코스 구성" 이다.**
       사용자 결정 2026-10-19: 이 지도는 **실제로 이동한 경로를 재는 화면이 아니다.**
       처음엔 인증된 핀만 이었는데(실제 동선), 그러면 1·2·4 만 인증한 코스에서 **3번을
       건너뛴 선**이 그려져 "코스가 저렇게 생겼나" 로 읽힌다 — 구성을 보려는 목적과 반대다.
       🔴 색은 032 와 같은 `point` 다 — 두 지도에서 **점선 파랑 = 코스 편성 순서**로 어휘를
       맞춘다. 결과는 **핀 색이 말하고** 선은 배치만 말한다(031: 색이 경쟁하면 안 된다) */
    const latLngs = pins.map((pin) => [pin.lat, pin.lng] as [number, number])

    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: 'var(--color-point)',
        weight: 3,
        opacity: 0.8,
        // 🔴 점선이다 — 좌표가 빠진 지점이 있으면 그 구간을 건너뛴 직선이라 실제와 다르다
        dashArray: '6 6',
      }).addTo(map)
    }

    pins.forEach((pin) => {
      const style = PIN_STYLE[pin.kind]
      const label = pinLabel(pin)

      L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: '',
          /* 🔴 **순번을 쓴다** — 지도의 값어치는 "어디" 와 "어느 순서로" 가 함께 보일 때다.
             🔴 `aria-label` 을 붙인다 — 색이 유일한 전달 수단이 되면 안 된다(034 선례) */
          html: `<span role="img" aria-label="${label}" class="grid size-6 place-items-center rounded-full text-[11px] font-bold shadow ${style.className}">${pin.order}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        title: label,
      })
        .addTo(map)
        .bindTooltip(label, { direction: 'top', offset: [0, -12] })
    })

    if (latLngs.length === 1) {
      map.setView(latLngs[0], SINGLE_PIN_ZOOM)
    } else {
      map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32] })
    }

    // 🔴 **정리한다.** 없으면 라우트를 오갈 때마다 인스턴스가 쌓이고 리스너가 샌다
    return () => {
      map.remove()
    }
  }, [pins])

  /* 🔴 **설정이 없으면 지도를 그리지 않는다** — 키·URL 없이도 나머지 화면이 멀쩡히
     개발돼야 한다(팀원·CI) */
  if (!TILE_URL) {
    return (
      <Shell>
        <Notice
          title="지도 설정이 없습니다"
          description="VITE_MAP_TILE_URL 이 설정되지 않았습니다."
        />
      </Shell>
    )
  }

  if (pins.length === 0) {
    /* 🔴 **좌표 0개는 장애가 아니라 사실이다** — 지점에 좌표가 등록되지 않은 코스가 실재한다
       (실측 7개 코스에서 15/18). 실패 문구를 쓰지 않는다 */
    return (
      <Shell missing={missing}>
        <Notice
          title="표시할 좌표가 없습니다"
          description="지점에 좌표가 등록되면 인증 위치가 지도에 표시됩니다."
        />
      </Shell>
    )
  }

  return (
    <Shell missing={missing}>
      {/* 🔴 높이를 고정한다 — 지도는 자기 크기를 모른다(부모가 0이면 타일이 안 뜬다) */}
      <div ref={containerRef} className="h-[320px] w-full rounded-sm" />
      <Legend />
    </Shell>
  )
}

/**
 * 범례. 🔴 **핀이 3종이면 범례가 있어야 한다** — 032 는 1종이라 없어도 됐다.
 * 색 이름을 적지 않고 **핀 모양을 그대로 보여준다**(색각과 무관하게 짝지어진다).
 */
const Legend = () => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
    {(Object.keys(PIN_STYLE) as HistoryPinKind[]).map((kind) => (
      <li key={kind} className="flex items-center gap-1.5 text-caption text-muted-foreground">
        <span aria-hidden className={`size-4 rounded-full ${PIN_STYLE[kind].className}`} />
        {PIN_STYLE[kind].label}
      </li>
    ))}
  </ul>
)

/** 카드 셸 + 머리말. 🔴 **빠진 지점 수를 머리에 적는다**(조용히 빼지 않는다) */
const Shell = ({ missing = 0, children }: { missing?: number; children: React.ReactNode }) => (
  <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      {/* 🔴 제목이 목적을 말한다 — **구성 + 현황**이다. "순찰 동선"(032)도 "인증 위치"도
          아니다: 앞은 코스 관리의 편성도고, 뒤는 "근무자가 어디서 눌렀나" 로 읽힌다 */}
      <span className="text-panel-title font-semibold">코스 구성 · 인증 현황</span>
      {missing > 0 && (
        /* 🔴 **"좌표 없음 N개" 를 명시한다.** 조용히 빼면 핀이 빠진 지도가 되고 어느 지점이
           빠졌는지 알 수 없다(032 선례). 🔴 **남은 핀의 번호는 그대로다** — 3번이 비었다고
           4번이 3번이 되면 **같은 지점을 인증 내역 표와 다른 번호**로 부른다(T518) */
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

export default HistoryMapCard
