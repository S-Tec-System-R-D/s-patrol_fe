import type { CourseDetailPoint } from '../types'

/**
 * 코스 편성 지점 → **지도에 찍을 수 있는 좌표** (`spec 032` D단).
 *
 * 🔴 **지도보다 먼저 만든다.** 지도를 먼저 붙이면 "안 보이는 이유" 가 좌표 때문인지
 * 타일 때문인지 키 때문인지 **구분할 수 없다**. 여기서 걸러낸 결과만 지도에 넘긴다.
 *
 * 🔴🔴 **범위 검사는 우리 몫이다**(B-33). 서버에 **`gpsLat: 123`** 이 저장돼 있다
 * (사업장 3, 실측 2026-10-12) — 위도는 -90~90, 경도는 -180~180 이다. 그대로 넘기면
 * **핀이 엉뚱한 곳으로 날아가고** `fitBounds` 가 지구 반대편까지 벌어져 **지도가
 * 쓸모없어진다.** `AddPoint`/`UpdatePoint` 가 범위를 보지 않으므로 앞으로도 들어올 수 있다.
 *
 * ⚠️ **`null` 과 범위 밖을 같이 센다.** 화면에는 "좌표 없음 N개" 하나로 적는다 —
 * 사용자가 할 수 있는 일이 같기 때문이다(지점 좌표를 고쳐야 한다).
 */

/** 지도에 찍을 지점 하나 */
export interface CoursePin {
  /**
   * 🔴 **편성 순번 — 배열 위치다**(`orderNo` 가 아니다). 서버가 중복 `orderNo` 를
   * 그대로 저장하므로(실측 2026-10-12) 그 값을 믿으면 같은 번호가 두 번 찍힌다.
   */
  order: number
  name: string
  lat: number
  lng: number
}

export interface CourseCoords {
  /** 지도에 찍을 수 있는 지점. **편성 순서대로** */
  pins: CoursePin[]
  /** 좌표가 없거나 **범위 밖**이라 뺀 지점 수. 🔴 0 이 아니면 화면이 그 사실을 적는다 */
  missing: number
}

/** 위도 -90~90 · 경도 -180~180. `null`·`NaN`·무한대는 전부 탈락 */
const isValidCoord = (lat: number | null, lng: number | null): lat is number =>
  lat !== null &&
  lng !== null &&
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180

/**
 * @param points `GetCourseDetail.points[]` — **이미 받아 둔 응답**이다(조회가 늘지 않는다)
 */
export const usableCoords = (points: CourseDetailPoint[]): CourseCoords => {
  // 🔴 응답 순서를 믿지 않고 `orderNo` 로 세운다(`coursePointOrder.ts` 와 같은 규칙).
  //    그 뒤의 **배열 위치**가 화면에 찍히는 번호다
  const ordered = [...points].sort((a, b) => a.orderNo - b.orderNo)

  const pins: CoursePin[] = []
  let missing = 0

  ordered.forEach((point, index) => {
    if (!isValidCoord(point.gpsLat, point.gpsLng)) {
      missing += 1
      return
    }
    pins.push({
      // 🔴 **빠진 지점도 번호를 차지한다** — 3번이 좌표가 없다고 4번이 3번이 되면
      //    지점 순서 카드와 번호가 어긋나 **같은 지점을 다른 번호로 부르게 된다**
      order: index + 1,
      name: point.pointName,
      lat: point.gpsLat as number,
      lng: point.gpsLng as number,
    })
  })

  return { pins, missing }
}
