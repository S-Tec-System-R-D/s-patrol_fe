/**
 * 순찰지점 타입.
 *
 * 🔴 **구 mock 타입과 서버 실측 타입이 나란히 존재한다.** `spec 022`가 `/points`만
 * 전환하고 `features/zone`(코스 관리)은 `spec 023` 범위로 남겼기 때문이다.
 *
 * 🔴 **"023에서 제거" 는 틀린 계획이었다 (2026-10-13 정정, T370).** `PointType` 블록은
 * **지울 수 없다** — 바로 아래 ⚠️ 처럼 `mock/pointData.ts` 가 MSW 의 dev 데이터 출처이고,
 * 그 파일이 이 타입을 쓴다. 지우려면 mock 데이터 전체를 들어내야 하는데, 그건 `dev` 모드를
 * 없애는 일이다.
 *
 * 남은 **외부** 참조는 **1곳**뿐이다(2026-10-13 실측):
 *   - `features/patrol-points/types/PatrolPoint.ts:1` (`PointAuthenticationMethod`)
 *
 * 이 1곳도 **지금 끊지 않는다.** 끊는 방법은 `'QR' | 'NFC'` 를 `patrol-points` 에 복제하는
 * 것인데, `/patrol/*` 화면은 **`spec 024`·`025` 가 서버 API 로 전환하면서 mock 타입이 통째로
 * 사라질** 자리다(023이 `features/zone` 을 지운 것과 같은 경로). 지금 복제하면 024에서 다시
 * 지울 코드를 **더하는** 셈이다(A3).
 *
 * ✅ `features/zone/form/AddPointForm.tsx` 는 **023 Phase 2 에서 삭제됐다**(mock 셸 제거).
 * ✅ `features/zone/types/point.ts` 는 **023 Phase 3 에서 삭제됐다**(T357).
 * ⚠️ `mock/pointData.ts` 자체는 남는다 — MSW 핸들러(`handlers/points.ts`·`handlers/courses.ts`)가
 * 서버 스키마로 변환해 쓰는 **dev 데이터 출처**다.
 */

// ─────────────────────────────────────────────
// 구 mock 타입 — **남는다**(위 주석). MSW dev 데이터(`mock/pointData.ts`)의 타입이다
// ─────────────────────────────────────────────

export interface PointType {
  id: string
  title: string
  description: string
  authenticationMethod: PointAuthenticationMethod
  nfcTagId?: string // authenticationMethod === 'NFC' 일 때, 14자리 HEX (데모값)
  createdAt?: Date
}

export type PointAuthenticationMethod = 'QR' | 'NFC'

// ─────────────────────────────────────────────
// 서버 실측 응답 — docs/api-spec.md §5-2 (10·11번 블록)
// 안 쓰는 필드도 실측 그대로 전량 선언한다 (CLAUDE.md B4)
// ─────────────────────────────────────────────

/**
 * `GET /api/v1/Point/W/sign/GetPointList` → `PagedData<PointRow>`
 *
 * 🔴 이름 필드가 **`pointName`** 이다. 상세는 `name` 이고, 둘을 맞추지 않는다
 * (서버 내부 불일치 B-4 / `spec 022` §3 규칙 5). 목록과 상세를 **모두 받는 공용
 * 컴포넌트가 없어서** 통일 뷰 타입을 둘 수요가 없다 — 사용자 확인 2026-10-07.
 */
export interface PointRow {
  pointSeq: number
  pointName: string
  memo: string | null
  authMethod: number // 9=QR / 10=NFC (docs/api-spec.md §4)
  authMethodName: string
  usedCount: number // 이 지점을 쓰는 코스 수
  useYn: boolean
  nfcTagId: string | null
  lastPatrolDt: string | null // ISO 8601, 타임존 없음
}

/**
 * `GET /api/v1/Point/W/sign/DetailPoint?pointSeq=` → `PointDetail`
 *
 * ⚠️ 같은 폴더의 컴포넌트 `components/detail/PointDetail.tsx` 와 이름이 겹친다.
 * 그 파일에서는 `import type { PointDetail as PointDetailData }` 로 받는다.
 * 타입명은 `api-spec.md` 실측 이름을 따른다(`CLAUDE.md` B4 — 응답 기준은 api-spec).
 *
 * 🔴 **생성일(`createdAt`)이 없다.** 현재 상세 카드가 그 행을 mock 값으로 채우고
 * 있는데(`PointDetail.tsx:35`) 서버에 해당 필드가 없다 → `spec 022` OQ-022-I.
 */
export interface PointDetail {
  pointSeq: number
  name: string
  memo: string | null
  authMethod: number
  authMethodName: string
  qrCode: string | null // 'STSP1:{siteSeq}:{pointSeq}:{epoch}:{base64url서명}'
  nfcTagId: string | null
  gpsLat: number | null // double. 미관측 — OQ-022-C
  gpsLng: number | null
  useYn: boolean
  lastPatrolDt: string | null
  lastPatrolUserSeq: number | null
  lastPatrolUserName: string | null
  courseList: { courseSeq: number; courseName: string }[]
}
