# API 실측 스펙 (api-spec.md)

> **이 문서의 지위**: 백엔드 **실제 응답을 호출로 실측**한 결과. `docs/swagger-api.json` 에는 응답 스키마가 하나도 없으므로(44개 전부 `200 OK` / content 없음), **응답 형태에 관해서는 이 문서가 SSOT**다.
> 요청 DTO는 swagger가 SSOT, 응답 DTO는 이 문서가 SSOT.
>
> | 항목 | 값 |
> |---|---|
> | 수집일 | 2026-10-01 |
> | baseURL | `http://123.2.156.148:5231` (테스트 서버) |
> | swagger 정합 | 저장본 `docs/swagger-api.json` ≡ 라이브 `/swagger/v1/swagger.json` **완전 동일** 확인 |
> | 계정 | `333333` (FieldManager, siteSeq=6) / `000000` (SystemManager) |
> | 범위 | **GET 23개 전수 + 로그인/리프레시**. 변경계(POST/PUT/PATCH/DELETE 19개)는 **미검증** |
> | 개인정보 | 전화번호 등은 마스킹. 토큰 값은 기록하지 않음 |

---

## 1. 공통 규약 (실측 확정)

### 1-1. 경로

```
/api/v1/{Domain}/W/{sign/}{ActionName}
```

- `W` = Web 전용
- `sign` = 인증 필요. **`sign` 없는 엔드포인트는 `POST /api/v1/Login/W/Login` 단 하나**
- REST 아님 — path parameter 없음. 전부 query string 또는 body
- 도메인: `Login` `Group` `Site` `User` `Point` `Course` `History` `Notice`

### 1-2. 인증

- `Authorization: Bearer {accessToken}`
- **accessToken 수명 10800초 (3시간)** — `exp - nbf` 실측
- 로그인 응답 `data` 에는 **토큰 2개뿐**. 사용자 정보는 **JWT 클레임 디코딩**으로 획득

```ts
/** accessToken JWT payload (실측) */
interface AccessTokenClaims {
  userSeq: number
  loginId: string
  userName: string
  uuid: string                  // 하이픈 없는 32자 hex
  roleDisplay: string           // '현장관리자' | '시스템관리자' | ... (한글 표시명)
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string
                                // 'FieldManager' | 'SystemManager' | ...
  nbf: number
  exp: number
  iss: 'https://stsp.s-tec.co.kr'
  aud: 'https://stsp.s-tec.co.kr'
}
```

### 1-3. 토큰 재발급 — `POST /api/v1/Login/W/sign/RefreshToken`

- 요청: `{ refreshToken: string }` + `Authorization` 헤더 **둘 다 필요**
- 응답: `data: { accessToken, refreshToken }`
- **refreshToken은 회전하지 않는다** — 재발급 후에도 기존 refreshToken 값 그대로 반환되고, 계속 재사용 가능(실측)
- 실패 시: `HTTP 401` + `{ message: '세션이 만료되었거나 유효하지 않습니다.', data: null, code: 401 }`

> 같은 초 안에 연속 호출하면 claims가 동일해 **accessToken 문자열이 그대로** 나온다(초 단위 `nbf`/`exp`). 정상 동작이며 버그 아님.

### 1-4. 응답 래퍼

```ts
interface ApiResponse<T> {
  message: string
  data: T
  code: number
}
```

필드명·순서 모두 기존 `data-model.md §2-1` 과 일치. **단 `code` 의 의미가 다르다 → §2 참조.**

`message` 문자열은 **엔드포인트마다 미세하게 다르다**:

- `'요청이 정상 처리되었습니다.'` (대부분)
- `'요청이 정상 처리되었습니다'` (마침표 없음 — `GetClassificationPoint`)
- `'요청을 정상 처리하였습니다.'` (`RefreshToken`)

→ **`message` 문자열로 성공/실패를 분기하면 안 된다.**

### 1-5. 페이지네이션 (실측 확정)

```ts
interface PagedData<T> {
  items: T[]
  page: number        // ← 요청 파라미터는 pageNumber, 응답 필드는 page (이름 다름)
  pageSize: number
  totalCount: number
  totalPages: number
}
```

- 요청: `pageNumber` (**1-based**, default 1) / `pageSize` (default 20)
- `pageNumber=0` → `HTTP 400` + `{ message: '페이지 번호는 1 이상이어야 합니다.', code: 400 }`
- `pageNumber` 초과 → `HTTP 200` + `items: []` (에러 아님). `page` 는 요청값 그대로 에코
- **목록이 아닌데도 배열만 반환하는 엔드포인트가 있다**(`PagedData` 아님) → §5-1 의 `data 형태` 열 참조

---

## 2. 로그인 결과 해석 — `code` 사전 · 사업장 선택

### 2-0. 🔴 `code` 는 HTTP status code가 아니다

`data-model.md` 가 당초 *"`code` 는 HTTP status code를 그대로 담는다. 성공: `code: 200`"* 으로 확정해뒀으나 **실측과 다르다**(해당 문서는 교정 완료).

| 상황 | HTTP | `code` |
|---|---|---|
| 일반 조회 성공 | 200 | **200** |
| 로그인 성공 — `000000` (SystemManager) | 200 | **101** |
| 로그인 성공 — `333333` (FieldManager) | 200 | **201** |
| RefreshToken 성공 | 200 | **201** |
| 비즈니스 오류 (없는 ID, 로그인 실패) | 400 | 400 |
| 세션 만료 | 401 | 401 |

### 2-1. 로그인 성공 `code` 사전 (확정)

백엔드 확인 완료. **로그인 성공 `code` 는 사이트 구분 + 권한 단계를 함께 나타낸다.**

| `code` | 사이트 | 권한 |
|---|---|---|
| `101` | 본사 (`/admin/*`) | 시스템관리자 |
| `102` | 본사 (`/admin/*`) | Master |
| `103` | 본사 (`/admin/*`) | Manager |
| `201` | 현장 (`/*`) | 현장관리자 |
| `202` | 현장 (`/*`) | **근무자** — ⚠️ WEB 접근 불가 대상 |

- **`1xx` = 본사 / `2xx` = 현장** → 로그인 직후 랜딩 사이트 분기의 1차 판단 근거
- 끝자리 = 권한 단계 → 메뉴·액션 가시성 제어 근거
- 실측 확인: `000000` → `101`, `333333` → `201`
- ✅ **권한 판단의 SSOT = JWT `role` 클레임** (결정 2026-10-02). `code` 는 **로그인 직후 1회성 라우팅 힌트**로만 쓰고 **저장하지 않는다.**
  - 사유: 가드는 새로고침·딥링크 진입에서도 동작해야 하는데 그 시점엔 로그인 응답이 없다. `code` 를 쓰려면 별도 저장이 필요하고 토큰과 어긋날 여지가 생긴다. JWT는 토큰 자체가 출처라 불일치가 불가능하다.
  - 역할 분담: **`code`** → 로그인 직후 사이트 분기(`/` vs `/admin`) + 근무자(`202`) 차단 / **`role`** → 라우트 가드·메뉴 노출·액션 권한
- 🔴 **`202`(근무자)는 로그인이 성공해도 WEB에 들여보내면 안 된다.** 근무자는 APP 전용(`CLAUDE.md` B1)인데 서버는 토큰을 발급한다. **차단은 프론트 책임** — 로그인 직후 `code === 202`면 토큰을 저장하지 않고 안내 후 중단한다(`spec 020`)
- ⚠️ JWT 의 `role`(`FieldManager`/`SystemManager`) 문자열과 `code` 의 **이중 판단 근거**가 생긴다. 어느 쪽을 가드의 SSOT로 쓸지 결정 필요 → OQ-1

### 2-2. 사업장 선택 규칙 (확정)

조직 구조상 **현장관리자·근무자는 사업장에만 소속된다. 그룹에는 소속되지 않는다.**
본사 관리자는 그룹(예: 서울본부, 그 하위 강동지사)에 소속된다.

| 계정 | 조회 API | 선택 대상 | 분기 |
|---|---|---|---|
| **현장** | `UserSiteSelect` | 응답의 **`children` 만** | 0개 → 예외 상태 / **1개 → 자동 진입**(선택 화면 스킵) / 2개 이상 → 선택 화면 |
| **본사** | `AdminSiteSelect` | 트리의 사업장 노드 | 단일·복수 무관 **항상 선택 화면** |

**`UserSiteSelect` 응답 구조 해석** — 루트는 **선택 대상이 아니다.**

```
루트 (siteSeq 6)          ← 소속 지사·상위 조직. 선택 대상 ❌
 ├ children[0] (siteSeq 7) ← 현장관리자가 소속된 사업장 ✅
 └ children[1] (siteSeq 8) ← 동일 ✅
```

현장관리자는 한 지사 아래 **복수 사업장**에 소속될 수 있고, `children` 이 그 목록이다.
단일 소속인지 복수인지는 **이 API를 호출해야만 알 수 있다** → 로그인 직후 무조건 호출한 뒤 분기한다.

> ⚠️ 테스트 데이터 주의: 루트(`siteSeq 6`)에도 지점 7건·코스 6건·근무자 5명이 붙어 있다(`GetSiteDetail(6)`, `GetPointList(6)` 실측). 루트를 선택 대상에서 제외하면 그 데이터는 WEB에서 접근 경로가 없다. 테스트 데이터가 느슨하게 만들어진 것으로 보이며, 규칙은 위 표대로 간다.

---

## 3. 🔴 에러 응답은 **3가지 형태**가 섞여 있다

프론트 인터셉터는 세 경우를 모두 처리해야 한다.

### (A) `ApiResponse` 래퍼 — 비즈니스 오류

```json
{ "message": "아이디 또는 비밀번호가 올바르지 않습니다.", "data": null, "code": 400 }
```

| 사례 | HTTP |
|---|---|
| 로그인 실패 (잘못된 PW / 없는 ID — 메시지 동일) | 400 |
| 없는 ID 조회(`pointSeq=99999999`) → `'잘못된 요청입니다.'` | 400 |
| `pageNumber=0` | 400 |
| RefreshToken 무효 → `'세션이 만료되었거나 유효하지 않습니다.'` | 401 |

### (B) ASP.NET ProblemDetails (RFC 9110) — 래퍼 **아님**

```json
{
  "errors": { "siteSeq": ["The siteSeq field is required."] },
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "traceId": "00-...-00"
}
```

| 사례 | HTTP |
|---|---|
| 필수 파라미터 누락 | 400 |
| 타입 불일치(`siteSeq=abc`) → `"The value 'abc' is not valid."` | 400 |
| 서버 오류(`GetGroupList`) → `detail: '서버에서 요청을 처리하지 못하였습니다...'` | 500 |

→ `message` 필드가 **없다**. `title` / `detail` / `errors` 를 봐야 한다.

### (C) **빈 body** — 래퍼도 ProblemDetails도 없음

| 사례 | HTTP | body |
|---|---|---|
| 토큰 없음 | 401 | `""` |
| 잘못된 토큰 | 401 | `""` |
| 권한 없는 엔드포인트 호출 | 403 | `""` |

→ 파싱 시도하면 터진다. **status code만으로 분기해야 한다.**

### 권한 범위는 403이 아니다 (주의)

현장계정(site 6)이 `siteSeq=1` 로 `GetPointList` 호출 → **`HTTP 200` + `items: []`**.
→ "권한 없음"과 "데이터 없음"을 **응답으로 구분할 수 없다.** 프론트에서 접근 가능 사업장을 `UserSiteSelect` / `AdminSiteSelect` 결과로 제한해야 한다(§2-2). 즉 **`siteSeq` 는 사용자가 임의로 넣을 수 있는 값이 아니라, 선택 목록에서 고른 값만 쿼리에 실어야 한다** — URL 쿼리스트링으로 `siteSeq` 를 노출할 경우 선택 목록 밖의 값은 거부 처리한다.

---

## 4. enum 실측 사전

> `{필드}` + `{필드}Name` 쌍으로 내려오는 패턴. **표시명이 서버에서 오므로 프론트 매핑표는 필터 UI 용도로만 필요.**

### `authMethod` (인증수단)

| 값 | Name |
|---|---|
| 9 | `QR` |
| 10 | `NFC` |
| `null` | `''` 또는 `'Unknown'` (미인증 지점이력) |

→ ⚠️ GPS 값 미관측. `AddPointDto` 에 `gpsLat`/`gpsLng` 가 있으므로 GPS 인증 코드가 따로 있을 것 → OQ-2

### `status` — **코스이력과 지점이력의 값 체계가 다르다** 🔴

| 컨텍스트 | 값 | Name |
|---|---|---|
| `GetCourseHistory.items[].status` | 1 | `완료` |
|  | 2 | `미완료` |
| `GetPointHistory.items[].status` | 3 | `미완료` |
|  | 4 | `완료` |

→ **같은 `status` 이름인데 1·2 vs 3·4로 분리.** 공용 enum으로 묶으면 안 된다.

### `courseStatusCode` (코스 현재 상태)

| 값 | Name |
|---|---|
| 0 | `대기중` |

→ 테스트 DB에 0만 존재. `courseStatus` 필터를 1·2·3으로 호출하면 `totalCount: 0`(에러 아님) → 진행중/완료 등 코드가 더 있을 것 → OQ-3

### `codeSeq` (권한/직급)

| 값 | Name | 프로젝트 권한 5단계 대응 |
|---|---|---|
| 2 | `시스템관리자` | 시스템관리자 |
| 3 | `관리자` | Master |
| 4 | `매니저` | Manager |
| 6 | `현장 관리자` | 현장관리자 |
| 7 | `현장 근무자` | 근무자 |

→ **`5` 결번.** 또한 codeSeq 목록을 주는 API가 없다(사용자 등록 폼에서 필요) → OQ-4

### `eventType` (코스이력 필터) — 필터 반응만 관측

| 값 | totalCount (site 6) |
|---|---|
| 0 | 0 |
| 1 | 15 |
| 2 | 26 |
| 3~6 | 0 |

→ 응답 본문에 `eventType` 필드가 **없어서** 1·2의 의미를 알 수 없다 → OQ-5

### `deviceType` (UserDetail)

`"0"` — **문자열**로 내려온다(숫자 아님). 의미 불명 → OQ-6

---

## 5. 엔드포인트별 실측 응답

### 5-1. 요약표

| # | 엔드포인트 | data 형태 | field | admin |
|---|---|---|---|---|
| 1 | `Login/W/Login` | `{accessToken, refreshToken}` | 200 | 200 |
| 2 | `Login/W/sign/RefreshToken` | `{accessToken, refreshToken}` | 200 | — |
| 3 | `Login/W/sign/AdminSiteSelect` | `GroupNode` (재귀 트리) | **403** | 200 |
| 4 | `Login/W/sign/UserSiteSelect` | `UserSiteSelectData` | 200 | **403** |
| 5 | `Group/W/sign/GetGroupList` | — | **403** | **500** 🔴 |
| 6 | `Group/W/sign/GetGroupAdminList` | `GroupAdminRow[]` | **403** | 200 |
| 7 | `Site/W/sign/GetSiteDetail` | `SiteDetail` | **403** | 200 |
| 8 | `User/W/sign/UserList` | `PagedData<UserRow>` | **403** | 200 |
| 9 | `User/W/sign/UserDetail` | `UserDetail` | **403** | 200 |
| 10 | `Point/W/sign/GetPointList` | `PagedData<PointRow>` | 200 | 200 |
| 11 | `Point/W/sign/DetailPoint` | `PointDetail` | 200 | 200 |
| 12 | `Course/W/sign/GetCourseList` | `PagedData<CourseRow>` | 200 | 200 |
| 13 | `Course/W/sign/GetCourseDetail` | `CourseDetail` | 200 | 200 |
| 14 | `Course/W/sign/GetClassificationPoint` | `ClassificationPoint[]` | 200 | 200 |
| 15 | `History/W/sign/GetCourseHistory` | `PagedData<CourseHistoryRow>` | 200 | 200 |
| 16 | `History/W/sign/GetCourseHistoryDetail` | `CourseHistoryDetail` | 200 | 200 |
| 17 | `History/W/sign/GetCourseHistoryCheckDetails` | `CheckDetailRow[]` | 200 | 200 |
| 18 | `History/W/sign/GetCourseHistoryHandOvers` | `HandOverRow[]` | 200 | 200 |
| 19 | `History/W/sign/GetPointHistory` | `PagedData<PointHistoryRow>` | 200 | 200 |
| 20 | `History/W/sign/GetPointHistoryDetail` | `PointHistoryDetail` | 200 | 200 |
| 21 | `History/W/sign/GetPointCurrentList` | `PointCurrentRow[]` | 200 | 200 |
| 22 | `History/W/sign/GetPointUsedCount` | `{authMethod, usedCount}` | 200 | 200 |
| 23 | `Notice/W/sign/GetNoticeList` | `PagedData<NoticeRow>` | 200 | 200 |
| 24 | `Notice/W/sign/DetailNotice` | `NoticeDetail` | 200 | 200 |

**권한 경계가 깔끔하게 갈린다**: Group / Site / User = admin 전용, Point / Course / History / Notice = 양쪽 공통. `AdminSiteSelect` ↔ `UserSiteSelect` 는 **상호 배타**.

🔴 **`GetGroupList` 는 admin 계정에서 HTTP 500** — 백엔드 버그. 그룹 관리 화면이 막힌다.

### 5-2. 응답 타입 (실측 기반 TS)

```ts
// ── 1. 로그인 / 토큰 ─────────────────────────────
interface LoginData { accessToken: string; refreshToken: string }

// ── 3. AdminSiteSelect : 그룹 트리 + 사업장 트리 (이중 재귀) ──
/**
 * 본사 관리자는 그룹(서울본부 → 강동지사 ...)에 소속된다.
 * 선택 대상은 트리 안의 **사업장 노드**(`sites[]`, 그 `children[]`). 그룹 노드는 선택 대상 아님. §2-2 참조.
 */
interface SiteNode {
  siteSeq: number
  siteName: string
  parentSiteSeq: number | null
  children: SiteNode[]        // 사업장도 자기 트리
}
interface GroupNode {
  groupSeq: number
  groupName: string
  parentGroupSeq: number | null
  layer: number               // 0,1,2 — depth와 값이 동일하게 관측됨
  depth: number
  sites: SiteNode[]
  children: GroupNode[]       // 그룹 트리
}
// 루트 1개 객체로 내려옴(배열 아님). groupSeq=1 '에스텍시스템' 고정

// ── 4. UserSiteSelect : 현장계정 전용. 필드명이 Admin쪽과 다르다 ──
/**
 * 루트 = 소속 지사·상위 조직 → **선택 대상 아님**.
 * children = 현장관리자가 소속된 사업장 목록 → **이것만 선택 대상**. §2-2 참조.
 */
interface UserSiteSelectData {
  siteSeq: number             // 루트. 선택 대상 ❌
  siteName: string
  children: {
    childSiteSeq: number      // ← siteSeq 아님. 이 값이 선택 결과로 쓰이는 siteSeq
    childSiteName: string     // ← siteName 아님
    parentSeq: number         // ← parentSiteSeq 아님
  }[]                         // 1단만. 재귀 아님
}

// ── 6. GetGroupAdminList ────────────────────────
interface GroupAdminRow {
  userSeq: number
  codeSeq: number
  codeName: string
  userName: string
  isInclude: boolean          // 해당 그룹 포함 여부 (체크박스 바인딩)
}

// ── 7. GetSiteDetail ────────────────────────────
interface SiteDetail {
  siteSeq: number
  siteName: string
  tel: string | null
  address: string | null
  healthCheckYn: boolean
  healthCheckInterval: number     // 분
  healthCheckTimeout: number
  healthCheckRetry: number
  healthCheckStartTime: string    // 'HH:mm:ss' (예 '08:00:00')
  healthCheckEndTime: string      // 'HH:mm:ss' (예 '00:00:00')
  exceptionTime: {
    detailSeq: number
    exceptionStartTime: string    // 'HH:mm:ss'
    exceptionEndTime: string
  }[]
  userCount: number               // 요약 카운트 3종
  courseCount: number
  pointCount: number
}

// ── 8. UserList ─────────────────────────────────
interface UserRow {
  userSeq: number
  userName: string
  loginId: string
  codeSeq: number
  codeName: string
  originSiteSeq: number | null
  originSiteName: string | null   // Seq는 null인데 Name은 채워진 행 존재 ⚠ OQ-7
  workYn: boolean
  createDt: string                // ISO 8601, 타임존 없음 '2026-07-30T16:47:28'
}

// ── 9. UserDetail ───────────────────────────────
interface UserDetail {
  userSeq: number
  loginId: string
  userName: string
  phone: string                   // 하이픈 없음
  siteSeq: number
  siteName: string
  workYn: boolean
  deviceType: string              // '0' — 문자열
  fcmToken: boolean               // ⚠ 토큰 값이 아니라 보유 여부 boolean
  voipToken: boolean
  imagePath: string | null        // 절대 URL (baseURL + /UploadedFiles/users/YYYYMM/...)
  imageName: string | null
  imageExt: string | null         // '.jpg'
}
// ⚠ codeSeq / codeName 이 상세에 없다 (목록에는 있음) → 권한 표시·수정 불가 : OQ-8

// ── 10. GetPointList ────────────────────────────
interface PointRow {
  pointSeq: number
  pointName: string               // ← 목록은 pointName
  memo: string | null
  authMethod: number
  authMethodName: string
  usedCount: number               // 이 지점을 쓰는 코스 수
  useYn: boolean
  nfcTagId: string | null
  lastPatrolDt: string | null
}

// ── 11. DetailPoint ─────────────────────────────
interface PointDetail {
  pointSeq: number
  name: string                    // ← 상세는 name 🔴 목록과 필드명 불일치
  memo: string | null
  authMethod: number
  authMethodName: string
  qrCode: string | null           // 'STSP1:{siteSeq}:{pointSeq}:{epoch}:{base64url서명}'
  nfcTagId: string | null
  gpsLat: number | null           // double
  gpsLng: number | null
  useYn: boolean
  lastPatrolDt: string | null
  lastPatrolUserSeq: number | null
  lastPatrolUserName: string | null
  courseList: { courseSeq: number; courseName: string }[]
}

// ── 12. GetCourseList ───────────────────────────
interface CourseRow {
  courseSeq: number
  courseName: string
  useYn: boolean
  switchYn: boolean               // 교대 사용
  totalMin: number
  courseStatusCode: number
  courseStatusName: string
  pointCount: number
  history: {                      // 최근 순찰 1건. 이력 없으면 null
    historySeq: number
    historyUserSeq: number
    historyUserName: string
    historyStatusCode: number
    historyStatusName: string
    historyEndDt: string
  } | null
}

// ── 13. GetCourseDetail ─────────────────────────
interface CourseDetail {
  courseSeq: number
  courseName: string
  memo: string | null
  useYn: boolean
  switchYn: boolean
  totalMin: number
  points: {
    coursePointSeq: number        // UpdateCourse 시 이 값으로 기존 행 식별
    pointSeq: number
    pointName: string
    authMethod: number            // authMethodName 없음 ⚠
    orderNo: number
    useYn: boolean
    courseMin: number
  }[]
}
// ⚠ siteSeq 가 응답에 없다. UpdateCourseDto 는 siteSeq 를 요구 → 프론트 별도 보관 필요 : OQ-9

// ── 14. GetClassificationPoint (코스 편집용 지점 후보) ──
interface ClassificationPoint {
  pointSeq: number
  pointName: string
  memo: string | null
  authMethod: number
  authMethodName: string
}
// PagedData 아님. 배열 직접. 페이징 없음

// ── 15. GetCourseHistory ────────────────────────
interface CourseHistoryRow {
  historySeq: number
  courseSeq: number
  courseName: string
  useYn: boolean
  startDt: string
  endDt: string | null
  status: number                  // 1=완료 2=미완료
  statusName: string
  overtimeYn: boolean             // ← 목록은 overtimeYn (소문자 t)
  pointCount: number
  checkedCount: number
  pauseTime: string               // 'HH:mm:ss'
  actualElapsedTime: string       // 'HH:mm:ss'
  hasMemo: boolean
  userList: { userSeq: number; userName: string }[]   // 교대 시 복수
}

// ── 16. GetCourseHistoryDetail ──────────────────
interface CourseHistoryDetail {
  historySeq: number
  courseSeq: number
  courseName: string
  overTimeYn: boolean             // 🔴 상세는 overTimeYn (대문자 T) — 목록과 불일치
  status: number
  startUserSeq: number
  startUserName: string
  startDt: string
  endDt: string | null
  totalMin: number
  elapsedTime: string             // 'HH:mm:ss'
  pauseTime: number               // 🔴 상세는 number — 목록은 'HH:mm:ss' 문자열. 타입 불일치
  totalPointCount: number
  completedPointCount: number
  handoverCount: number
}
// ⚠ statusName 없음 (목록에는 있음) → 프론트 매핑표 필요

// ── 17. GetCourseHistoryCheckDetails ────────────
interface CheckDetailRow {
  detailSeq: number
  pointSeq: number
  pointName: string
  status: number
  checkDt: string | null
  authMethod: number | null
  checkUserSeq: number            // ← userSeq 아님
  userName: string
  orderNo: number
  gpsLat: number | null
  gpsLng: number | null
  overtimeYn: boolean
  memos: unknown[]                // 🔴 빈 배열만 관측 — 요소 구조 미확인 : OQ-10
}

// ── 18. GetCourseHistoryHandOvers ───────────────
// 🔴 빈 배열 [] 만 관측. 교대 기록이 있는 이력이 테스트 DB에 없음 : OQ-11

// ── 19. GetPointHistory ─────────────────────────
interface PointHistoryRow {
  detailSeq: number
  courseSeq: number
  courseName: string
  pointSeq: number
  pointName: string
  checkDt: string
  userSeq: number
  userName: string
  authMethod: number | null
  authMethodName: string          // null일 때 '' (빈 문자열)
  status: number                  // 3=미완료 4=완료
  statusName: string
  overTimeYn: boolean             // 🔴 여기는 대문자 T
  hasMemo: boolean
  pauseTime: string               // 'HH:mm:ss'
}

// ── 20. GetPointHistoryDetail ───────────────────
interface PointHistoryDetail {
  detailSeq: number
  pointSeq: number
  pointName: string
  overtimeYn: boolean             // 🔴 여기는 소문자 t (목록과 반대)
  hasMemo: boolean
  status: number
  gpsLat: number | null
  gpsLng: number | null
  statusName: string
  courseSeq: number
  courseName: string
  userSeq: number
  userName: string
  pauseTime: string
  checkDt: string
  authMethod: number | null
  authMethodName: string          // null일 때 'Unknown' (목록은 '') 🔴 불일치
  memoList: unknown[]             // 빈 배열만 관측 : OQ-10
}

// ── 21. GetPointCurrentList ─────────────────────
interface PointCurrentRow {
  detailSeq: number
  userSeq: number
  userName: string
  overtimeYn: boolean
  checkDt: string
}

// ── 22. GetPointUsedCount ───────────────────────
interface PointUsedCount { authMethod: number; usedCount: number }

// ── 23. GetNoticeList ───────────────────────────
interface NoticeRow {
  noticeSeq: number
  title: string
  description: string             // 🔴 목록인데 본문 전문이 내려온다 (수백자) — 페이로드 과대
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  attachCount: number
}

// ── 24. DetailNotice ────────────────────────────
interface NoticeDetail {
  noticeSeq: number
  title: string
  description: string
  userSeq: number
  userName: string
  isPin: boolean
  createDt: string
  imageList: NoticeAttach[]       // 이미지/파일이 두 배열로 분리되어 내려온다
  fileList: NoticeAttach[]
}
interface NoticeAttach {
  attachSeq: number
  attachPath: string              // 절대 URL (baseURL + /UploadedFiles/notices/YYYYMM/...)
  attachName: string
  attachExt: string               // '.jpg'
}
// ⚠ UpsertNotice 요청은 attachList[] 하나인데 응답은 imageList/fileList 2개로 분리 : OQ-12
```

---

## 6. 발견된 문제 / Open Questions

### 6-1. 백엔드 확인·수정 요청 대상

| # | 내용 | 심각도 |
|---|---|---|
| B-1 | `GetGroupList` admin 계정 **HTTP 500**(ProblemDetails). 그룹 관리 화면 전체가 막힘 | 🔴 |
| B-2 | **403/401이 빈 body** 반환 — 래퍼 미적용. 프론트에서 메시지 표시 불가 | 🔴 |
| B-3 | 유효성 오류(400)·서버 오류(500)가 **ProblemDetails**로 빠져나감 — 래퍼 미적용 | 🔴 |
| B-4 | 필드명 불일치: 목록 `pointName` ↔ 상세 `name` / `overtimeYn` ↔ `overTimeYn`(엔드포인트마다 뒤섞임) | 🟡 |
| B-5 | 타입 불일치: `pauseTime` 이 목록은 `'HH:mm:ss'` 문자열, 상세는 `number` | 🟡 |
| B-6 | `authMethodName` null 표현이 `''` / `'Unknown'` 두 가지 | 🟡 |
| B-7 | `status` 값 체계가 코스이력(1,2) ↔ 지점이력(3,4)으로 분리 — 의도된 것인지 | 🟡 |
| B-8 | `GetNoticeList` 가 본문 전문(`description`) 포함 — 목록 페이로드 과대 | 🟡 |
| B-9 | 권한 밖 사업장 조회가 403이 아니라 **200 + 빈 목록** | 🟡 |
| B-10 | `refreshToken` 회전 없음 — 재발급 후 기존 값 계속 유효 | 🟡 |
| B-11 | `codeSeq` **5 결번** | ⚪ |
| B-12 | `DeleteCourse` 만 파라미터명 `courseId`(나머지는 `courseSeq`) / `UserList` 는 `siteId`, `UserDetail` 은 `userId` | ⚪ |

### 6-2. Open Questions

| # | 질문 |
|---|---|
| OQ-1 | `code` 사전은 §2-1에 **전부 확정**(`202` = 근무자, 2026-10-02). **남은 것**: JWT `role` 문자열의 전체 목록 — 실측된 것은 `FieldManager`(현장관리자)·`SystemManager`(시스템관리자) **2개뿐**이고, Master·Manager·근무자에 해당하는 문자열은 미확인(해당 계정이 없어 실측 불가). 라우트 가드를 `role` 기준으로 삼으려면 필요. **해소 방향**: 백엔드에 묻지 않고 **계정 생성 기능을 만들 때 직접 만들어 로그인해 실측**하고 §1-2에 기록한다(결정 2026-10-02). 그때까지 알 수 없는 `role`은 권한 없음 처리 |
| OQ-1A | 사업장 선택 규칙은 §2-2에 확정. **남은 것**: ① 현장계정 `children` 이 **0개**일 때(소속 사업장 없는 현장관리자) 서버가 무엇을 주는지 — 빈 배열인지 에러인지 ② 선택한 `siteSeq` 를 서버가 세션에 기억하는지, 아니면 매 요청 쿼리로만 전달하는지(현재는 후자로 가정) |
| OQ-2 | `authMethod` 에 GPS 코드가 있는가? (9=QR, 10=NFC만 관측) |
| OQ-3 | `courseStatusCode` 전체 값 (0=대기중만 관측) |
| OQ-4 | `codeSeq` 목록을 주는 API — 사용자 등록 폼에 필요한데 없음 |
| OQ-5 | `eventType` 값 의미 (1→15건, 2→26건 관측. 응답 본문에 필드 없음) |
| OQ-6 | `UserDetail.deviceType` 의 `'0'` 의미 (문자열 타입인 이유) |
| OQ-7 | `UserRow.originSiteSeq`=null 인데 `originSiteName` 은 채워진 행의 의미 |
| OQ-8 | `UserDetail` 에 `codeSeq`/`codeName` 없음 — 권한 표시·수정을 어떻게? |
| OQ-9 | `GetCourseDetail` 응답에 `siteSeq` 없음 — `UpdateCourseDto` 는 요구함. 프론트가 별도 보관해야 하는가? |
| OQ-10 | `memos` / `memoList` 요소 구조 (빈 배열만 관측) |
| OQ-11 | `GetCourseHistoryHandOvers` 응답 구조 (빈 배열만 관측 — 교대 데이터 필요) |
| OQ-12 | `UpsertNotice` 요청 `attachList[]` ↔ 응답 `imageList`/`fileList` 분리 기준 (확장자? MIME?) |

### 6-3. 프로젝트 문서와의 차이 — 정합 현황

| 항목 | 당초 설계 | 실측 | 문서 교정 | 코드 반영 |
|---|---|---|---|---|
| `code` 의미 | HTTP status code | **비즈니스/권한 코드** | ✅ `CLAUDE.md B4` · `data-model.md §2-1` | — (분기 로직은 spec 019) |
| 에러 응답 | 동일 래퍼 1종 | **3종 혼재**(§3) | ✅ `CLAUDE.md B4` · `data-model.md §6` | ⬜ 인터셉터 재설계 — spec 019 |
| 페이징 응답 구조 | `{ meta, data }` 중첩 | **평면** `items`/`page`/`pageSize`/`totalCount`/`totalPages` | ✅ `data-model.md §2-1` | ✅ `src/types/api.ts` (소비처 0개) |
| ID 타입 | `string`(UUID 가정) | **`number`(int32), `~Seq`** | ✅ `CLAUDE.md B4` · `data-model.md §0` | ⬜ mock·feature 타입 전면 — spec 019 |
| 시각 표기 | `'HH:mm'` | `'HH:mm:ss'`(.NET TimeSpan) | ✅ `CLAUDE.md B4` · `data-model.md §0` | ⬜ 변환은 화면별 어댑터 |
| 날짜 | ISO 8601 | ISO 8601(**타임존 없음**, 로컬시각) | ✅ `data-model.md §0` | ⬜ 파싱 주의 — 화면별 어댑터 |
| enum | 문자열 유니온 | **정수 + 동반 Name 문자열** | ✅ §4 사전 확보 | ⬜ 화면별 어댑터에서 변환 |
| "표시 안 되는 필드 DTO 금지" 규칙 | 금지 | **서버 응답 전량 선언으로 전환** | ✅ `CLAUDE.md B4` · `data-model.md §0` 에서 **규칙 삭제** | — |

### 6-4. 현재 코드의 가짜 경로

| 코드 위치 | 현재 | 실제 |
|---|---|---|
| `src/features/auth/hooks/useMe.ts` | `/api/auth/me` | **엔드포인트 없음** → JWT 클레임 디코딩으로 대체 |
| `src/lib/axios.ts` `REFRESH_PATH` | `/api/auth/refresh` | `/api/v1/Login/W/sign/RefreshToken` (+ `Authorization` 헤더 동반 필요) |
| 로그인 | — | `/api/v1/Login/W/Login` |

### 6-5. 범위 밖 (백엔드 미개발 — 보류)

아래 영역은 swagger에 없으나 **백엔드가 개발 완료 상태가 아니기 때문**이며, 프론트 mock을 유지하고 손대지 않는다.

비상연락망 · 근무자 배치요청/배치이력 · 환경설정 키워드 · 순찰 진행현황(실시간) · 사업장 목록 조회 · 권한코드 목록 조회 · 공지 APP 푸시 발송

---

## 7. 재현 방법

수집 스크립트는 세션 scratchpad에 있으며 저장소에 커밋하지 않는다(실데이터·토큰 포함).
재수집이 필요하면 `.env.local` 의 `VITE_API_BASE_URL` 기준으로 아래 순서를 따른다.

1. `POST /api/v1/Login/W/Login` 으로 두 계정 토큰 획득
2. `UserSiteSelect`(현장) / `AdminSiteSelect`(본사) 로 접근 가능 `siteSeq` 확보
3. 목록 엔드포인트 호출 → 응답에서 `courseSeq`/`historySeq`/`detailSeq`/`pointSeq`/`noticeSeq`/`userSeq` 수집
4. 상세 엔드포인트에 주입 호출
5. 두 토큰을 교차 호출해 권한 경계(403) 확인

> **변경계 19개는 미검증.** 실데이터를 생성·삭제하므로 별도 승인 후 전용 테스트 그룹/사업장 안에서만 수행한다.
