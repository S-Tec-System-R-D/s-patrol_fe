import { isValidCoord } from '@/features/courses/lib/courseCoords'
import type { CourseDetailPoint } from '@/features/courses/types'
import { POINT_HISTORY_STATUS, type CheckDetailRow } from '@/features/course-history/types'

/**
 * 코스 순찰 상세 — **지도에 찍을 핀** (`spec 036` T516).
 *
 * 🔴 **지도보다 먼저 만든다**(032 Phase 1 선례). 지도를 먼저 붙이면 "핀이 안 보이는 이유"
 * 가 좌표인지 타일 키인지 **데이터가 안 온 것인지** 구분할 수 없다.
 *
 * ## 좌표가 두 군데서 온다
 *
 * 원시 지점(지점관리)이 자기 경·위도를 갖고, 코스는 그 지점들을 편성한 것이다. 근무자가
 * 순찰 중 인증하면 **인증한 위치**가 순찰이력에 따로 쌓인다 — 원시 좌표를 **덮지 않는다.**
 * 그래서 회차가 끝나면 쓸 수 있는 좌표가 두 벌이다.
 *
 * | 행 | 좌표 출처 | `source` |
 * |---|---|---|
 * | 인증 좌표 있음 | `CheckDetailRow.gpsLat/gpsLng` — **인증 시점 위치** | `'check'` |
 * | 인증 좌표 없음 | `CourseDetailPoint.gpsLat/gpsLng` — **지점 등록 좌표** | `'point'` |
 * | 둘 다 없거나 범위 밖 | — (핀을 만들지 않고 `missing` 으로 센다) | — |
 *
 * 🔴 **실측상 대부분이 등록 좌표 폴백이다.** 166행 전수에서 인증 좌표를 가진 행은 **34행
 * (20%)** 뿐이다 — `status 3 미완료`(124건)는 좌표가 **전부 `null`** 이고 `0`·`1` 도 그렇다
 * (`api-spec.md` §4). 폴백이 예외가 아니라 **주경로**다.
 *
 * ## 🔴 조인 키는 `pointSeq` 다 (`orderNo` 가 아니다)
 *
 * 등록 좌표는 **원시 지점에 붙어 있다** — 그러니 지점의 정체(`pointSeq`)로 찾는다.
 * `orderNo` 는 "이 코스에서 몇 번째냐" 일 뿐 지점의 정체가 아니다. 두 가지가 겹쳐 깨진다:
 *
 * 1. **서버가 `orderNo` 를 정규화하지 않는다** — 둘 다 `1` 로 보내도 그대로 저장된다
 *    (실측, `api-spec.md` §5-1-B). 그러면 조인 대상이 둘로 갈린다.
 * 2. 🔴 **`GetCourseDetail` 은 "현재 편성" 이고 회차는 과거다.** `UpdateCourse` 가 편성을
 *    **전량 교체**하므로(B-25), 순찰이 돈 뒤 재배치하면 `orderNo 3` 이 **다른 지점**이 된다.
 *
 * ⚠️ **틀린 조인은 조용하다** — 실재하는 좌표에 핀이 멀쩡히 찍히고 그게 그냥 다른 지점이다.
 * 에러도, 빈 상태도 없다. 023 이 "인증률에 색을 입히지 않는다" 고 판단한 자리와 같은 종류다.
 *
 * ✅ 반대로 `pointSeq` 가 중복돼도(같은 지점을 한 코스에 두 번 편성 — 서버가 허용한다)
 * **같은 지점이니 등록 좌표가 같다.** 충돌해도 답이 하나로 수렴한다.
 *
 * ## 🔴 핀 번호는 `orderNo` 다 (배열 위치가 아니다)
 *
 * **같은 페이지의 인증 내역 표(T513)가 `orderNo` 를 그대로 순서 컬럼에 쓴다.** 지도가 배열
 * 위치로 다시 매기면 **표의 3번과 지도의 3번이 다른 지점**이 된다 — T518 이 경계하는 바로
 * 그 사고다. 032(`courseCoords.ts`)가 배열 위치를 쓴 것은 그 화면에 **나란히 놓인 번호가
 * 없었기** 때문이고, 여기선 전제가 다르다.
 *
 * 덕분에 "빠진 지점도 번호를 차지한다"(T518)가 **자동으로 성립한다** — 좌표 없는 행은 핀이
 * 안 생기고, 남은 핀은 자기 `orderNo` 를 그대로 갖는다.
 *
 * ## 🔴 핀 색은 `status` 가 정한다 — 좌표 출처와 **독립이다**
 *
 * `status 4 완료` 인데 `authMethod`·좌표·순찰자가 **전부 `null` 인 행이 3건** 실재한다
 * (OQ-16, `historySeq 13` 의 `detailSeq 24·25·26`). 좌표 출처로 색을 정하면 이 행들이
 * **등록 좌표 폴백 → 회색 → "미인증"** 으로 읽힌다. 완료인데 그렇게 보이면 거짓이다.
 * 그래서 `checked`(색)와 `source`(출처)를 **따로 둔다.**
 *
 * ## 재사용
 *
 * 🔴 **범위 검사를 새로 만들지 않는다** — `courses/lib/courseCoords.ts` 의 `isValidCoord`
 * 를 쓴다. B-33(서버에 `gpsLat: 123` 이 저장돼 있다)은 **지점 좌표 자체의 결함**이라 이
 * 화면에도 똑같이 걸린다. 복제하면 한쪽만 고쳐진다.
 */

/** 지도에 찍을 핀 하나 */
export interface HistoryPin {
  /** 🔴 **`orderNo` 다** — 인증 내역 표의 "순서" 컬럼과 같은 번호여야 한다 */
  order: number
  name: string
  lat: number
  lng: number
  /**
   * 🔴 **핀 색 기준.** `status 4 완료` 만 참이다 — 좌표 출처와 **무관하다**(OQ-16).
   * 거짓이면 회색 핀.
   */
  checked: boolean
  /** 이 좌표가 어디서 왔는지. 🔴 `'point'` 는 **인증 위치가 아니라 지점 등록 위치**다 */
  source: 'check' | 'point'
  /**
   * 라벨에 쓸 인증 시각. 🔴 **인증이 실제로 찍힌 행만** 값을 갖는다(OQ-15) —
   * 미완료 행의 `checkDt` 는 코스 `endDt` 와 같은 것이 12건·다른 것이 33건이라 **의미가
   * 확정되지 않았다.** 그대로 보여주면 **인증한 것처럼 보인다.**
   */
  checkedAt: string | null
  /** 라벨에 쓸 인증수단. 인증이 찍히지 않은 행은 `null` */
  authMethod: number | null
}

export interface HistoryCoords {
  /** 지도에 찍을 핀. **`orderNo` 순서** (인증 내역 표와 같은 정렬) */
  pins: HistoryPin[]
  /**
   * 좌표를 구하지 못해 뺀 지점 수. 🔴 0 이 아니면 **화면이 그 사실을 적는다** —
   * 조용히 빼면 핀이 빠진 지도가 되고 어느 지점이 빠졌는지 알 수 없다.
   *
   * 두 가지가 함께 세어진다(사용자가 할 수 있는 일이 같다 — 지점 좌표를 등록·수정한다):
   * ① 지점에 좌표가 애초에 없다(실측 코스 7개에서 **15/18**) ② 회차 당시엔 있었으나
   * **현재 편성에서 빠졌다**(그래서 `GetCourseDetail` 에 없다).
   */
  missing: number
}

/**
 * 인증 내역 + 코스 편성 → 지도 핀.
 *
 * @param rows `GetCourseHistoryCheckDetails` — **이미 받아 둔 응답**이다
 * @param coursePoints `GetCourseDetail.points[]` — 등록 좌표 폴백용. 아직 안 왔으면 `[]`
 *   를 넘긴다(그 경우 인증 좌표가 있는 핀만 나온다)
 */
export const historyPins = (
  rows: CheckDetailRow[],
  coursePoints: CourseDetailPoint[]
): HistoryCoords => {
  // 🔴 **`pointSeq` → 등록 좌표.** 유효한 좌표만 담는다 — 담아 두고 나중에 거르면
  //    호출부마다 검사를 되풀이한다
  const registered = new Map<number, { lat: number; lng: number }>()
  coursePoints.forEach((point) => {
    if (!isValidCoord(point.gpsLat, point.gpsLng)) return
    // 같은 `pointSeq` 가 두 번 와도 **같은 지점이라 좌표가 같다** — 덮어써도 무해하다
    registered.set(point.pointSeq, { lat: point.gpsLat, lng: point.gpsLng as number })
  })

  // 인증 내역 표(T513)와 **같은 정렬**이어야 번호가 맞는다
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)

  const pins: HistoryPin[] = []
  let missing = 0

  ordered.forEach((row) => {
    // 🔴 **인증 좌표가 범위 밖이면 등록 좌표로 내려간다**(B-33) — 버리지 않는다.
    //    지점이 어디인지는 여전히 알 수 있고, 그걸 아는 것이 지도의 값어치다
    const checkCoord = isValidCoord(row.gpsLat, row.gpsLng)
      ? { lat: row.gpsLat, lng: row.gpsLng as number }
      : null
    const coord = checkCoord ?? registered.get(row.pointSeq) ?? null

    if (coord === null) {
      missing += 1
      return
    }

    /* 🔴 **인증이 찍힌 행만** 시각·수단을 라벨에 올린다(OQ-15 — 표와 같은 규칙) */
    const authenticated = row.authMethod !== null && row.checkDt !== null

    pins.push({
      order: row.orderNo,
      name: row.pointName,
      lat: coord.lat,
      lng: coord.lng,
      // 좌표 출처가 아니라 **상태**로 색을 정한다(OQ-16)
      checked: row.status === POINT_HISTORY_STATUS.COMPLETED,
      source: checkCoord === null ? 'point' : 'check',
      checkedAt: authenticated ? row.checkDt : null,
      authMethod: authenticated ? row.authMethod : null,
    })
  })

  return { pins, missing }
}
