/**
 * 순찰지점 요청 DTO + 목록 조회 파라미터.
 *
 * 출처: `docs/swagger-api.json` (`AddPointDto` / `UpdatePointDto`) — **요청 DTO의 SSOT**.
 * 접미사는 `CLAUDE.md` B4의 `{Action}*Request` 를 따른다.
 *
 * 🔴 `UpdatePoint` 는 **PATCH** 다(`PUT` 아님 — swagger 실측).
 *    `roadmap.md` §7-1 의 "POST/PUT/DELETE" 표기는 오기이며 `spec 022` 에서 교정한다.
 */

/**
 * `POST /api/v1/Point/W/sign/AddPoint`
 *
 * swagger required: `authMethod` · `useYn`.
 * `siteSeq` 는 `getSiteSeq()`(spec 021)에서 읽어 넣는다 — **021 값의 첫 변경계 소비처**다.
 *
 * `gpsLat`/`gpsLng` 는 **보내지 않는다**: GPS 값이 미관측이고 GPS 인증수단 코드도
 * 확인되지 않았다(OQ-022-C). 추측으로 UI·전송을 만들지 않는다(A1).
 * `qrCode` 도 보내지 않는다 — 서버가 발급하는 값이다(QR 영역은 `spec 022` 범위 외).
 */
export interface AddPointRequest {
  siteSeq: number
  name: string
  memo: string | null
  authMethod: number // 9=QR / 10=NFC
  nfcTagId: string | null
  useYn: boolean
}

/**
 * `PATCH /api/v1/Point/W/sign/UpdatePoint`
 *
 * swagger required: `pointSeq`.
 * `reissueQrYn` 은 **`false` 고정** — QR 재발급은 `spec 022` 범위 외(OQ-022-D).
 * 필드를 빼지 않고 명시적으로 `false` 를 보내는 쪽을 택했다: swagger 에 nullable 이
 * 아니라 `boolean` 으로 선언돼 있어 생략 시 서버 기본값이 무엇인지 미실측이다.
 */
export interface UpdatePointRequest {
  pointSeq: number
  name: string
  memo: string | null
  authMethod: number
  nfcTagId: string | null
  useYn: boolean
  reissueQrYn: boolean
}

/**
 * `GET /api/v1/Point/W/sign/GetPointList` 쿼리 파라미터.
 *
 * `siteSeq` 는 **required**. 나머지는 선택이며, 값이 없으면 **키를 보내지 않는다**
 * ("전체" 를 뜻하는 특수값을 만들지 않는다 — `spec 022` §3 규칙 8).
 *
 * 🔴 `pageNumber` 는 **1-based** 다(`api-spec.md` §1-5). `AppPagination` 의
 *    `pageIndex` 는 0-based 이므로 변환은 `lib/pointListParams.ts` 한 곳에서만 한다.
 */
export interface PointListParams {
  siteSeq: number
  authMethod?: number
  useYn?: boolean
  searchKey?: string
  pageNumber: number
  pageSize: number
}
