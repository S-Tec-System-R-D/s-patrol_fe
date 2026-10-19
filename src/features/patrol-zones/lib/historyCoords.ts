import { isValidCoord } from '@/features/courses/lib/courseCoords'
import type { CourseDetailPoint } from '@/features/courses/types'
import { POINT_HISTORY_STATUS, type CheckDetailRow } from '@/features/course-history/types'

/**
 * 코스 순찰 상세 — **지도에 찍을 핀** (`spec 036` T516).
 *
 * 🔴 **지도보다 먼저 만든다**(032 Phase 1 선례). 지도를 먼저 붙이면 "핀이 안 보이는 이유"
 * 가 좌표인지 타일 키인지 **데이터가 안 온 것인지** 구분할 수 없다.
 *
 * ## 🔴 이 지도가 보여주는 것 — **코스 구성 + 인증 현황**
 *
 * 사용자 결정 2026-10-19. **"실제로 이동한 경로" 를 재는 화면이 아니다.** 보고 싶은 것은
 * *"이 코스가 이렇게 구성돼 있고, 1·2·4 는 인증했고 3 은 미인증이구나"* 하나다.
 *
 * 그래서 좌표의 우선순위가 **등록 좌표 → 인증 좌표** 다(처음엔 반대로 만들었다가 뒤집었다):
 *
 * | 행 | 좌표 출처 | `source` |
 * |---|---|---|
 * | 지점에 등록 좌표가 있다 | `CourseDetailPoint.gpsLat/gpsLng` — **지점이 있는 자리** | `'point'` |
 * | 등록 좌표가 없거나 범위 밖 | `CheckDetailRow.gpsLat/gpsLng` — **인증한 위치** | `'check'` |
 * | 둘 다 없음 | — (핀을 만들지 않고 `missing` 으로 센다) | — |
 *
 * 🔴 **인증 좌표를 먼저 쓰면 코스 모양이 틀어진다.** 인증 좌표는 근무자가 **인증 버튼을
 * 누른 위치**라 지점에서 몇 m 어긋나 있다. 1번만 인증 위치에 서고 2·3번은 등록 위치에
 * 서면 **같은 코스가 회차마다 다른 모양**으로 보인다 — 구성을 보려는 화면에서 그건 잡음이다.
 * 지점은 고정된 자리에 있고, 지도는 그 자리들의 배치를 보여준다.
 *
 * ⚠️ 인증 좌표는 **버리지 않고 폴백으로 남긴다** — 등록 좌표가 없는 지점이 실재하므로
 * (실측 코스 7개에서 15/18) 그 경우에도 핀을 잃지 않는다. 그때는 `source: 'check'` 라
 * 호출부가 **"인증 위치" 임을 라벨에 적는다**(지점 자리가 아니라는 뜻이다).
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
 * ## 🔴 핀은 3종이다 — `status` 가 정하고 좌표 출처와 **독립이다**
 *
 * 사용자 결정 2026-10-19. 관리자가 **해야 할 일이 세 가지로 갈린다**:
 *
 * | `kind` | 조건 | 뜻 | 시맨틱 | 형태 |
 * |---|---|---|---|---|
 * | `checked` | `status 4` | 인증이 찍혔다 | `success` | 채움 |
 * | `incomplete` | `status 3` + `checkDt` 있음 | **갔는데 인증이 안 됐다** | `warning` | 채움 |
 * | `norecord` | 나머지 | 아무 기록이 없다 | `muted` | **빈 원** |
 *
 * 🔴 **`미완료` 를 한 종으로 묶지 않는다** — 실측 124건이 **79 / 45** 로 갈린다. 앞은 아예
 * 가지 않은 것이고 뒤는 순찰자·시각이 남았는데 인증만 안 된 것이다. 전자는 **순찰 누락**,
 * 후자는 **태그·단말 문제**일 수 있다 — 한 색으로 묶으면 관리자가 둘을 구분할 수 없다.
 *
 * 🔴 **빨강(`danger`)을 쓰지 않는다.** 표의 결과 뱃지가 미완료 2종에 `danger` 를 쓰지만
 * 지도는 다르다 — ① `status 0 대기중`·`1 진행중` 이 `norecord` 로 들어오는데(진행 중인 회차)
 * **아직 안 간 지점을 빨갛게 칠하면 없는 문제를 만든다** ② 심각도 판정은 **표가 한다**(뱃지
 * 최대 3개 병기). 지도의 일은 "어디가 비었나" 지 "누가 잘못했나" 가 아니다.
 * 023 의 "인증률에 색을 입히지 않는다" 와 같은 자리다.
 *
 * 🔴 **색만으로 전하지 않는다**(034 선례). `norecord` 는 **빈 원**이라 색각과 무관하게
 * 갈리고, 호출부가 `aria-label`·툴팁에 라벨을 적는다. 채움 여부가 곧 "기록이 있나" 다.
 *
 * ⚠️ **`kind` 는 좌표 출처(`source`)와 독립이다.** `status 4 완료` 인데 `authMethod`·좌표·
 * 순찰자가 **전부 `null` 인 행이 3건** 실재한다(OQ-16, `historySeq 13` 의 `detailSeq 24·25·26`).
 * 출처로 색을 정하면 이 행들이 **폴백 → 회색 → "미인증"** 으로 읽힌다 — 완료인데 그렇게
 * 보이면 거짓이다.
 *
 * ## 재사용
 *
 * 🔴 **범위 검사를 새로 만들지 않는다** — `courses/lib/courseCoords.ts` 의 `isValidCoord`
 * 를 쓴다. B-33(서버에 `gpsLat: 123` 이 저장돼 있다)은 **지점 좌표 자체의 결함**이라 이
 * 화면에도 똑같이 걸린다. 복제하면 한쪽만 고쳐진다.
 */

/**
 * 핀 3종. 🔴 **표의 결과 뱃지(7종)를 그대로 옮기지 않는다** — 지도에서 갈려야 하는 것은
 * "기록이 어떤 종류로 남았나" 세 가지다. 라벨·심각도는 표가 말한다.
 */
export type HistoryPinKind = 'checked' | 'incomplete' | 'norecord'

/** 지도에 찍을 핀 하나 */
export interface HistoryPin {
  /** 🔴 **`orderNo` 다** — 인증 내역 표의 "순서" 컬럼과 같은 번호여야 한다 */
  order: number
  name: string
  lat: number
  lng: number
  /** 🔴 **핀 색·형태 기준.** 좌표 출처와 **무관하다**(OQ-16) */
  kind: HistoryPinKind
  /**
   * 이 좌표가 어디서 왔는지. 🔴 **`'check'` 는 지점 자리가 아니라 인증한 위치**다 —
   * 등록 좌표가 없어 폴백한 경우이므로 호출부가 라벨에 그 사실을 적는다.
   */
  source: 'point' | 'check'
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
  /** 지도에 찍을 핀. **`orderNo` 순서** (인증 내역 표와 같은 정렬 = 코스 편성 순서) */
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

const pinKind = (row: CheckDetailRow): HistoryPinKind => {
  if (row.status === POINT_HISTORY_STATUS.COMPLETED) return 'checked'
  // 🔴 `checkDt` 가 미완료 2종을 가른다 — 값이 있으면 **방문 흔적**이다(실측 45/124).
  //    ⚠️ 그 값을 **인증 시각으로 읽지는 않는다**(OQ-15) — 여기서는 유무만 쓴다
  if (row.status === POINT_HISTORY_STATUS.INCOMPLETE && row.checkDt !== null) return 'incomplete'
  return 'norecord'
}

/**
 * 인증 내역 + 코스 편성 → 지도 핀.
 *
 * @param rows `GetCourseHistoryCheckDetails` — **이미 받아 둔 응답**이다
 * @param coursePoints `GetCourseDetail.points[]` — **등록 좌표의 출처**. 아직 안 왔으면 `[]`
 *   를 넘긴다(그 경우 인증 좌표가 있는 핀만 나와 **코스 모양이 불완전하다**)
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

  // 인증 내역 표(T513)와 **같은 정렬**이어야 번호가 맞는다. 이 순서가 곧 **코스 편성 순서**다
  const ordered = [...rows].sort((a, b) => a.orderNo - b.orderNo)

  const pins: HistoryPin[] = []
  let missing = 0

  ordered.forEach((row) => {
    /* 🔴 **등록 좌표가 1순위다** — 지점이 있는 자리가 코스의 모양이다(사용자 결정).
       인증 좌표는 등록 좌표가 없을 때만 쓰는 폴백이다 */
    const point = registered.get(row.pointSeq) ?? null
    const check = isValidCoord(row.gpsLat, row.gpsLng)
      ? { lat: row.gpsLat, lng: row.gpsLng as number }
      : null
    const coord = point ?? check

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
      // 좌표 출처가 아니라 **상태**로 정한다(OQ-16)
      kind: pinKind(row),
      source: point === null ? 'check' : 'point',
      checkedAt: authenticated ? row.checkDt : null,
      authMethod: authenticated ? row.authMethod : null,
    })
  })

  return { pins, missing }
}
