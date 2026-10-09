import { http, HttpResponse } from 'msw'

import { points as legacyPoints } from '@/features/points/mock/pointData'
import { toAuthMethodCode } from '@/features/points/lib/authMethod'
import type {
  PointDetail,
  PointHistoryRow,
  PointRow,
  UpdatePointRequest,
} from '@/features/points/types'

/**
 * MSW 순찰지점 핸들러 (`spec 022`).
 *
 * 🔴 **조회 전환과 같은 Phase에 들어와야 한다.** `npm run dev`(mock)와
 * `npm run capture`가 **둘 다 MSW 위에서** 돈다(`.env.capture`: `VITE_USE_MSW=true`).
 * 이 파일이 없으면 mock 모드의 `/points`가 통째로 빈 화면이 되고 baseline
 * `현장/points--목록+상세`가 깨진다. `npm run capture`는 `verify`/`test` 밖이라
 * 빼먹으면 다음 캡쳐까지 드러나지 않는다(`tasks.md` 제약 3).
 *
 * 데이터는 **기존 mock(`features/points/mock/pointData.ts`)을 서버 스키마로 변환**해
 * 재사용한다 — `handlers/index.ts`의 004 방침. 구 mock은 `features/zone`이 아직
 * 참조하므로 그대로 남아 있다(`tasks.md` 제약 1).
 *
 * ⚠️ **변경계 3종(POST/PATCH/DELETE)의 성공·실패 응답 형태는 전부 미실측이다**
 * (`api-spec.md` §5-1 의 실측 24종은 모두 조회계). 조회계와 같은 `ApiResponse` 래퍼로
 * 가정했고, 각 핸들러 주석에 그 가정을 적어 뒀다. 실측 후 교정한다.
 */

/** 핸들러 내부 저장 모델. 서버 응답에 없는 필드(`siteSeq`)도 분기용으로 들고 있는다 */
interface MockPoint {
  siteSeq: number
  pointSeq: number
  name: string
  memo: string | null
  authMethod: number
  nfcTagId: string | null
  useYn: boolean
  qrCode: string | null
  gpsLat: number | null
  gpsLng: number | null
  lastPatrolDt: string | null
  lastPatrolUserSeq: number | null
  lastPatrolUserName: string | null
  courseList: { courseSeq: number; courseName: string }[]
}

/**
 * 지점이 어느 사업장에 속하는가.
 *
 * 🔴 사업장을 **실제로 갈라 둔다.** 권한 밖 사업장 조회가 403이 아니라 `200` + 빈 목록인
 * 서버 동작(`api-spec.md:211` B-9)을 mock에서도 재현해야, `spec 021`의 사업장 선택이
 * dev에서 눈에 보이고 "siteSeq 없이 조회 → 정상 응답인 빈 화면" 함정도 드러난다.
 *
 * 실측 계정 `333333`은 7·8 두 곳에 소속돼 있다(`handlers/auth.ts` `DEV_SITES`).
 */
const SITE_OF = (pointSeq: number): number => (pointSeq <= 10 ? 7 : 8)

/**
 * 지점이 쓰이는 코스. `usedCount`의 출처이고, **삭제 거부 케이스**가 여기 걸린다.
 * 구 mock에는 코스 연결 정보가 없어 결정적으로 배분한다(실 데이터 아님).
 */
const COURSES_OF = (pointSeq: number): { courseSeq: number; courseName: string }[] => {
  if (pointSeq === 1 || pointSeq === 2) return [{ courseSeq: 1, courseName: 'A동 순찰코스' }]
  if (pointSeq === 3)
    return [
      { courseSeq: 1, courseName: 'A동 순찰코스' },
      { courseSeq: 2, courseName: 'B동 순찰코스' },
    ]
  return []
}

/**
 * 구 mock → 서버 스키마 변환.
 *
 * 🔴 **생성일(`createdAt`)은 버린다** — 서버 응답에 없다(OQ-022-I). 대신 서버가 주는
 * `lastPatrolDt`·`lastPatrolUserName`을 결정적으로 채운다(일부는 `null` — 미순찰 지점).
 */
const toMockPoint = (legacy: (typeof legacyPoints)[number]): MockPoint => {
  const pointSeq = Number(legacy.id)
  const patrolled = pointSeq % 3 !== 0 // 1/3은 미순찰로 둔다 — null 경로를 화면에서 보려고
  return {
    siteSeq: SITE_OF(pointSeq),
    pointSeq,
    name: legacy.title,
    memo: legacy.description || null,
    authMethod: toAuthMethodCode(legacy.authenticationMethod),
    nfcTagId: legacy.nfcTagId ?? null,
    useYn: pointSeq !== 9, // 미사용 지점 1건 — OQ-022-G 표시 방법을 눈으로 확인하려고
    qrCode:
      legacy.authenticationMethod === 'QR'
        ? `STSP1:${SITE_OF(pointSeq)}:${pointSeq}:1760000000:mockSignature`
        : null,
    gpsLat: null, // 실측 미관측 — OQ-022-C
    gpsLng: null,
    lastPatrolDt: patrolled ? `2026-10-0${(pointSeq % 7) + 1}T09:${10 + pointSeq}:00` : null,
    lastPatrolUserSeq: patrolled ? 100 + pointSeq : null,
    lastPatrolUserName: patrolled ? '김근무' : null,
    courseList: COURSES_OF(pointSeq),
  }
}

/** 모듈 스코프 저장소 — 변경계 3종이 이 배열을 직접 고친다 */
const store: MockPoint[] = legacyPoints.map(toMockPoint)

/**
 * 저장소를 초기 상태로 되돌린다.
 *
 * 🔴 **테스트 격리에 필요하다.** `server.resetHandlers()` 는 핸들러만 되돌리고 이 배열은
 * 건드리지 않으므로, 추가·삭제 테스트가 뒤 테스트의 목록 건수를 바꿔 **순서 의존
 * flaky** 가 된다. 변경계를 다루는 테스트는 `beforeEach` 에서 이것을 부른다.
 */
export const resetPointStore = (): void => {
  store.length = 0
  store.push(...legacyPoints.map(toMockPoint))
}

/**
 * 🔴 **`lastPatrolDt` 는 이력에서 파생한다 — 따로 들고 있으면 어긋난다.**
 *
 * `toMockPoint` 가 심어 둔 고정 날짜(`2026-10-0X`)와 `buildHistory` 가 **오늘 기준**으로
 * 만드는 이력이 서로 달라, 화면에서 통계 "최근 순찰" 과 기록 목록의 최신이 **다른 날짜**로
 * 보였다(027 Phase 3 캡쳐에서 발견). 실 서버는 같은 데이터에서 나오므로 mock 도 한
 * 출처에서 뽑는다 — mock 이 실 서버보다 이상하게 굴면 디버깅이 두 배가 된다.
 */
const lastPatrolOf = (point: MockPoint): Pick<MockPoint, 'lastPatrolDt' | 'lastPatrolUserName' | 'lastPatrolUserSeq'> => {
  const latest = buildHistory(point)[0]
  if (!latest) return { lastPatrolDt: null, lastPatrolUserName: null, lastPatrolUserSeq: null }
  return {
    lastPatrolDt: latest.checkDt,
    lastPatrolUserName: latest.userName,
    lastPatrolUserSeq: latest.userSeq,
  }
}

const toPointRow = (point: MockPoint): PointRow => ({
  pointSeq: point.pointSeq,
  pointName: point.name, // 🔴 목록은 pointName (상세는 name) — B-4 실측
  memo: point.memo,
  authMethod: point.authMethod,
  authMethodName: point.authMethod === 9 ? 'QR' : 'NFC',
  usedCount: point.courseList.length,
  useYn: point.useYn,
  nfcTagId: point.nfcTagId,
  lastPatrolDt: lastPatrolOf(point).lastPatrolDt,
})

const toPointDetail = (point: MockPoint): PointDetail => ({
  pointSeq: point.pointSeq,
  name: point.name,
  memo: point.memo,
  authMethod: point.authMethod,
  authMethodName: point.authMethod === 9 ? 'QR' : 'NFC',
  qrCode: point.qrCode,
  nfcTagId: point.nfcTagId,
  gpsLat: point.gpsLat,
  gpsLng: point.gpsLng,
  useYn: point.useYn,
  ...lastPatrolOf(point),
  courseList: point.courseList,
})

const ok = (data: unknown) =>
  HttpResponse.json({ message: '요청이 정상 처리되었습니다.', data, code: 200 })

/**
 * 변경계 성공 응답 — **실측(2026-10-08)**: `data` 가 `true`(boolean) 다.
 *
 * 🔴 **생성된 `pointSeq` 를 주지 않는다.** `AddPoint` 도 `data: true` 뿐이므로
 * `api/addPoint.ts` 가 반환을 `void` 로 둔 판단이 맞았다 — 성공 후 목록을 무효화해
 * 다시 읽는 것이 유일한 길이다.
 */
const mutationOk = () => ok(true)

/**
 * 실측 비즈니스 오류 형태 — `ApiResponse` 래퍼 + 4xx (`api-spec.md` §3-(A)).
 *
 * 실측(2026-10-08): 없는 `pointSeq` 로 `UpdatePoint`·`DeletePoint`·`DetailPoint` 를
 * 호출하면 **400 + `{"message":"잘못된 요청입니다.","data":false,"code":400}`** 가 온다
 * (`DetailPoint` 는 `data: null`). 문구가 구체적이지 않아 호출부가 사유를 구분할 수 없다.
 */
const businessError = (message: string, status = 400) =>
  HttpResponse.json({ message, data: null, code: status }, { status })

/** 실측 문구 — 서버는 "없는 ID" 를 이 한 문장으로만 알린다 */
const NOT_FOUND_MESSAGE = '잘못된 요청입니다.'

/**
 * `UpdatePoint` 의 문자열 필드 반영 규칙 — **실측 동작 재현**(2026-10-08).
 *
 * 서버는 `undefined`·`null`·`''` 를 전부 "변경하지 않음" 으로 보고, 내용이 있는 문자열만
 * 반영한다(공백만 있는 문자열은 trim 되어 결과적으로 빈 값이 된다). 즉 **빈 값으로
 * 되돌릴 수단이 공백 문자뿐**이고, 이것은 서버 버그에 가깝다(B-15).
 */
const patchText = (current: string | null, next: string | null | undefined): string | null => {
  if (next === undefined || next === null || next === '') return current
  const trimmed = next.trim()
  return trimmed === '' ? null : trimmed
}

const GET_POINT_LIST_PATH = '/api/v1/Point/W/sign/GetPointList'
const DETAIL_POINT_PATH = '/api/v1/Point/W/sign/DetailPoint'
const ADD_POINT_PATH = '/api/v1/Point/W/sign/AddPoint'
const UPDATE_POINT_PATH = '/api/v1/Point/W/sign/UpdatePoint'
const DELETE_POINT_PATH = '/api/v1/Point/W/sign/DeletePoint'
/** 🔴 `Point/*` 가 아니라 `History/*` 다 — 지점 상세에서 쓰지만 소유 도메인은 이력이다 */
const GET_POINT_HISTORY_PATH = '/api/v1/History/W/sign/GetPointHistory'

/**
 * 지점별 순찰이력 생성 — **결정적**(랜덤 금지). 테스트가 흔들리면 안 된다.
 *
 * 🔴 기준일을 `new Date()` 로 잡는다. 화면의 "최근 30일" 집계가 **오늘** 기준이라
 * 고정 날짜로 만들면 시간이 지나면서 전부 기간 밖이 되어 0건이 된다.
 */
const buildHistory = (point: MockPoint): PointHistoryRow[] => {
  // 3의 배수 지점은 미순찰 — `toMockPoint` 의 `lastPatrolDt: null` 과 맞춘다
  if (point.pointSeq % 3 === 0) return []

  const courses = point.courseList.length > 0 ? point.courseList : [{ courseSeq: 0, courseName: '미배정 코스' }]
  const today = new Date()
  const rows: PointHistoryRow[] = []

  // 최근 30일 중 3일마다 1건, 그중 일부는 하루 2건 — 버킷 합산을 눈으로 보려고
  for (let ago = 0; ago < 30; ago += 3) {
    const day = new Date(today)
    day.setDate(day.getDate() - ago)
    const ymd = day.toISOString().slice(0, 10)
    const perDay = ago % 9 === 0 ? 2 : 1

    for (let n = 0; n < perDay; n += 1) {
      const course = courses[(ago + n) % courses.length]
      rows.push({
        detailSeq: point.pointSeq * 1000 + ago * 10 + n,
        courseSeq: course.courseSeq,
        courseName: course.courseName,
        pointSeq: point.pointSeq,
        pointName: point.name,
        // 지점마다 분을 흔든다 — 전부 같은 시각이면 목록의 '최근 순찰' 이 한 값으로 보인다
        checkDt: `${ymd}T${String(8 + n * 5 + (point.pointSeq % 3)).padStart(2, '0')}:${String((7 * point.pointSeq + ago * 3) % 60).padStart(2, '0')}:00`,
        userSeq: 100 + point.pointSeq,
        userName: n === 0 ? '김근무' : '박순찰',
        authMethod: point.authMethod,
        authMethodName: point.authMethod === 9 ? 'QR' : 'NFC',
        status: ago % 12 === 0 ? 3 : 4, // 가끔 미완료를 섞는다
        statusName: ago % 12 === 0 ? '미완료' : '완료',
        overTimeYn: ago % 15 === 0,
        hasMemo: ago % 6 === 0,
        pauseTime: '00:00:00',
      })
    }
  }

  // 최근 → 과거 순 (서버 기본 정렬 가정)
  return rows
}

/** 새 `pointSeq` — 저장소 최대값 + 1. 삭제 후 재사용되지 않게 한다 */
const nextPointSeq = (): number =>
  store.reduce((max, point) => Math.max(max, point.pointSeq), 0) + 1

export const pointHandlers = [
  /**
   * 목록. 🔴 **필터·페이징을 실제로 구현한다** — 전량 반환으로 때우면 Phase 6의
   * "서버 파라미터로 나간다"는 검증 기준을 세울 수 없다.
   */
  http.get(GET_POINT_LIST_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const siteSeq = Number(query.get('siteSeq'))
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)

    // 실측: pageNumber=0 은 400 (`api-spec.md` §1-5)
    if (pageNumber < 1) {
      return businessError('페이지 번호는 1 이상이어야 합니다.')
    }

    const searchKey = query.get('searchKey')?.trim() ?? ''
    const authMethod = query.get('authMethod')
    const useYn = query.get('useYn')

    // 🔴 권한 밖 사업장이어도 403이 아니라 빈 목록이다 (B-9)
    const filtered = store
      .filter((point) => point.siteSeq === siteSeq)
      .filter((point) => (searchKey ? point.name.includes(searchKey) : true))
      .filter((point) => (authMethod ? point.authMethod === Number(authMethod) : true))
      .filter((point) => (useYn ? point.useYn === (useYn === 'true') : true))

    // 실측: pageNumber 초과는 에러가 아니라 빈 items + 요청값 그대로 에코
    const start = (pageNumber - 1) * pageSize
    const items = filtered.slice(start, start + pageSize).map(toPointRow)

    return ok({
      items,
      page: pageNumber,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    })
  }),

  /**
   * 상세. 없는 `pointSeq` 의 실 서버 응답은 **미실측**이라, 비즈니스 오류(A 래퍼)로
   * 가정했다. 실측 후 교정한다 — 추측을 프론트 분기에 굳히지 않았으므로(019의
   * `ApiError` 정규화가 형태를 흡수한다) 여기 가정이 바뀌어도 화면은 그대로다.
   */
  http.get(DETAIL_POINT_PATH, ({ request }) => {
    const pointSeq = Number(new URL(request.url).searchParams.get('pointSeq'))
    const found = store.find((point) => point.pointSeq === pointSeq)
    if (!found) return businessError(NOT_FOUND_MESSAGE)
    return ok(toPointDetail(found))
  }),

  /**
   * 추가. 🔴 **저장소에 실제로 넣는다** — 목록을 무효화해 재조회하면 보여야
   * "추가 → 목록 반영" 을 눈으로·테스트로 확인할 수 있다.
   *
   * ✅ **실측 완료(2026-10-08).** HTTP **200** + `{"message":...,"data":true,"code":200}`.
   * 래퍼가 맞고(OQ-022-J 해당 없음) 실패는 4xx/5xx 로 온다(OQ-022-A 해당 없음).
   * 🔴 **생성된 `pointSeq` 를 주지 않는다** — `data` 는 `true` 뿐이다.
   * 🔴 **`qrCode` 는 서버가 자동 생성**한다: `STSP1:{siteSeq}:{pointSeq}:{unix}:{서명}`.
   *   우리는 보내지 않는다. 아래 생성 로직의 형식은 실측과 같다.
   * 🔴 **`gpsLat`/`gpsLng` 는 보내지 않으면 `null` 로 남는다**(실측). 기존 지점에 좌표가
   *   있는 것은 다른 경로로 들어간 값이다 — OQ-022-C.
   */
  http.post(ADD_POINT_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<MockPoint> | null
    if (!body?.name || typeof body.siteSeq !== 'number') {
      // 유효성 오류의 실 응답은 ProblemDetails(B-3)지만, 프론트가 세 형태를 019에서
      // 정규화하므로 여기서는 비즈니스 오류로 가정해도 화면 경로가 같다.
      return businessError('필수 값이 누락되었습니다.')
    }

    const pointSeq = nextPointSeq()
    const authMethod = body.authMethod ?? 9
    store.push({
      siteSeq: body.siteSeq,
      pointSeq,
      name: body.name,
      memo: body.memo ?? null,
      authMethod,
      nfcTagId: body.nfcTagId ?? null,
      useYn: body.useYn ?? true,
      qrCode:
        authMethod === 9 ? `STSP1:${body.siteSeq}:${pointSeq}:1760000000:mockSignature` : null,
      gpsLat: null,
      gpsLng: null,
      lastPatrolDt: null, // 새 지점은 순찰 기록이 없다
      lastPatrolUserSeq: null,
      lastPatrolUserName: null,
      courseList: [], // 코스 편성은 코스 관리(spec 023)에서 한다
    })

    return mutationOk()
  }),

  /**
   * 수정. 🔴 **`PATCH` 다**(`api/updatePoint.ts` — swagger 실측).
   *
   * ✅ **실측 완료(2026-10-08).** 성공은 200 + `data: true`. 그리고 **진짜 부분 갱신이다** —
   * 생략한 필드는 기존 값이 **유지**된다(`pointSeq` + `name` 만 보내 확인).
   *
   * 🔴🔴 **그런데 "값 비우기" 가 불가능하다.** 서버는 `null` 과 `''`(빈 문자열)을 **"값 없음
   * = 변경하지 않음"** 으로 해석해 **무시**한다. 실측 결과:
   * - `memo: null` → 무시(기존 값 유지) / `memo: ''` → 무시 / `memo: ' '`(공백 1칸) → **지워짐**
   * - `nfcTagId` 는 `null`·`''`·`' '` **전부 무시** — 한 번 설정되면 지울 방법이 없었다
   *
   * 영향: ① 사용자가 **설명을 비워도 지워지지 않는다** ② NFC → QR 로 바꿔도 `nfcTagId` 가
   * 남아 **인증수단과 어긋난 데이터**가 된다(화면에는 안 보인다 — `PointDetail` 이
   * `method === 'NFC' && point.nfcTagId` 로 막는다). **백엔드 수정 요청 대상**(B-15).
   * mock 은 **실측 동작을 그대로 재현**한다 — 서버보다 관대하게 만들면 우리 화면에서는
   * 지워지는데 실 서버에서는 안 지워지는 불일치가 숨는다.
   *
   * `reissueQrYn` 은 받아도 **쓰지 않는다** — QR 재발급은 범위 외(OQ-022-D)이고 프론트는
   * `false` 고정으로 보낸다. 🔴 **인증수단을 바꿔도 서버는 `qrCode` 를 지우지 않는다**(실측:
   * QR → NFC 전환 후에도 `qrCode` 유지). mock 도 유지한다.
   */
  http.patch(UPDATE_POINT_PATH, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Partial<UpdatePointRequest> | null
    if (typeof body?.pointSeq !== 'number' || !body.name) {
      return businessError('필수 값이 누락되었습니다.')
    }

    const index = store.findIndex((point) => point.pointSeq === body.pointSeq)
    if (index < 0) return businessError(NOT_FOUND_MESSAGE)

    const current = store[index]
    store[index] = {
      ...current,
      name: body.name,
      // 🔴 실측 동작: `null`·`''` 은 "변경하지 않음". 공백만 있는 문자열은 지움(trim 후 저장)
      memo: patchText(current.memo, body.memo),
      authMethod: body.authMethod ?? current.authMethod,
      nfcTagId: patchText(current.nfcTagId, body.nfcTagId),
      useYn: body.useYn ?? current.useYn,
      // 인증수단을 바꿔도 서버는 qrCode 를 건드리지 않는다(실측)
      qrCode: current.qrCode,
    }

    return mutationOk()
  }),

  /**
   * 삭제.
   *
   * ✅ **성공 응답만 실측됐다(2026-10-08)**: 200 + `data: true`. 없는 `pointSeq` 는
   * **400 + 래퍼**(`"잘못된 요청입니다."`). 삭제 후 그 지점의 `DetailPoint` 도 400 이 된다.
   *
   * 🔴 **거부 케이스는 여전히 가정이다.** `usedCount > 0`(코스에 편성된) 지점의 삭제를
   * 서버가 거부하는지는 **확인하지 않았다** — Phase 8 의 쓰기 범위를 "생성한 지점만" 으로
   * 합의했고(2026-10-08), 새로 만든 지점은 코스에 편성돼 있지 않아 이 경로를 밟을 수
   * 없었다. 거부되지 않는다면 실 지점이 삭제되므로 기존 지점으로 시험하지 않았다.
   * **확정은 코스 편성 API(`spec 023`) 이후.** 그때까지 이 분기는 UI 경로 확보용으로 남긴다.
   *
   * ⚠️ 실측에서 거부가 **없다면** 이 분기를 지운다. 거부 사유 문구·상태코드도 추측이므로
   * 프론트가 문구에 의존하지 않게 해야 한다(019 `ApiError` 정규화가 형태를 흡수한다).
   *
   * 거부 지점: `COURSES_OF` 가 코스를 주는 1·2·3번. `pointSeq=3` 은 2개 코스에 걸려 있다.
   */
  http.delete(DELETE_POINT_PATH, ({ request }) => {
    const pointSeq = Number(new URL(request.url).searchParams.get('pointSeq'))
    const index = store.findIndex((point) => point.pointSeq === pointSeq)
    if (index < 0) return businessError(NOT_FOUND_MESSAGE)

    const target = store[index]
    if (target.courseList.length > 0) {
      const courseNames = target.courseList.map((course) => course.courseName).join(', ')
      return businessError(`순찰코스(${courseNames})에 편성된 지점은 삭제할 수 없습니다.`)
    }

    store.splice(index, 1)
    return mutationOk()
  }),

  /**
   * 지점 순찰이력 — 지점 상세의 "순찰 인증 기록" 섹션(`spec 027` Phase 3).
   *
   * 🔴 **지점마다 다른 기록을 준다.** 전부 같게 주면 화면에서 **"기록 없음" 경로를 한
   * 번도 볼 수 없다.** 022 가 mock 에 미사용 지점·미순찰 지점을 심어 둔 것과 같은 이유다.
   * - `pointSeq % 3 === 0` → **0건**(미순찰 — `toMockPoint` 의 `lastPatrolDt: null` 과 일치)
   * - 그 외 → 최근 30일에 흩뿌린 기록. 하루 2건인 날을 섞어 **버킷 합산**을 눈으로 본다
   *
   * ⚠️ 응답 형태는 실측(`api-spec.md` §5-2 19번 `PointHistoryRow`)이다. `fromDt`/`toDt`
   * 는 **실제로 거른다** — 전량 반환으로 때우면 집계 기간 경계를 화면에서 확인할 수 없다.
   */
  http.get(GET_POINT_HISTORY_PATH, ({ request }) => {
    const query = new URL(request.url).searchParams
    const pointSeq = Number(query.get('pointSeq'))
    const pageNumber = Number(query.get('pageNumber') ?? 1)
    const pageSize = Number(query.get('pageSize') ?? 20)

    if (pageNumber < 1) {
      return businessError('페이지 번호는 1 이상이어야 합니다.')
    }

    const point = store.find((item) => item.pointSeq === pointSeq)
    const rows = point ? buildHistory(point) : []

    const from = query.get('fromDt')
    const to = query.get('toDt')
    const filtered = rows.filter((row) => {
      const day = row.checkDt.slice(0, 10)
      if (from && day < from) return false
      if (to && day > to) return false
      return true
    })

    const start = (pageNumber - 1) * pageSize
    return ok({
      items: filtered.slice(start, start + pageSize),
      page: pageNumber,
      pageSize,
      totalCount: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    })
  }),
]
