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
- ✅ **재실측 2026-10-08**(`spec 022` Phase 8 R1, 계정 `333333`·`000000`): 클레임 필드 구성·`role` 문자열(`FieldManager`/`SystemManager`)·수명 10800초 모두 일치. 🔴 **`userSeq` 만 `number` 로 잘못 적혀 있었다** — 실제는 문자열이다. 우리 모델(`MeDto.userSeq: number`)로의 변환은 어댑터 한 자리(`useMe`)에서 한다
- 🔴 **payload 에 non-ASCII 바이트가 실제로 들어온다**(`userName`·`roleDisplay` 한글). `atob` 결과를 그대로 `JSON.parse` 하면 `'현장 관리자 테스트'` → `'íì¥ ê´ë¦¬ì íì¤í¸'` 로 깨지는 것을 실 토큰으로 확인했다 — `TextDecoder` 경로(`lib/auth/jwt.ts`)가 필수다

```ts
/** accessToken JWT payload (실측) */
interface AccessTokenClaims {
  userSeq: string               // 🔴 문자열이다 ('13'·'1' 실측 2026-10-08)
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

#### JWT `role` 문자열 ↔ `code` 실측 (2026-10-08, `spec 022` Phase 8 R1)

| 사번 | `code` | JWT `role` | `roleDisplay` | 앱 `Role` 매핑 |
|---|---|---|---|---|
| `000000` | 101 | `SystemManager` | 시스템관리자 | `SYSTEM` |
| `222222` | **102** | **`Master`** | 마스터 | `MASTER` — 🔴 **022 Phase 8 에서 추가** |
| — | 103 | ❓ `Manager` 추정 | ❓ | **미실측** (해당 계정 없음) |
| `333333` | 201 | `FieldManager` | 현장관리자 | `FIELD_MANAGER` |
| `444444`·`555555` | **202** | **`FieldWorker`** | 현장근무자 | 🔴 **의도적으로 매핑하지 않는다** |

🔴 **`Master` 매핑이 없던 동안 Master 계정은 로그인에 성공해도 들어갈 수 없었다** —
`toRole` 이 `null` → `useMe` 가 실패 반환 → `AuthGuard` 가 로그인 화면으로 되돌렸다.

🔴 **`FieldWorker` 는 실측됐지만 매핑하지 않는다.** `AuthGuard` 는 role 값으로 분기하지 않고
**"매핑되면 통과"** 이므로 넣는 순간 근무자가 WEB 을 통과한다(근무자는 APP 전용 — `CLAUDE.md` B1).
근무자 차단은 로그인 단계의 `code 202` 가 담당하고, 매핑 부재가 2중 방어로 남는다.

⚠️ `roleDisplay` 실측값이 앱의 `roleLabel` 과 다르다 — **마스터** vs `'Master'`,
**현장근무자** vs `'근무자'`. 서버 표시명을 쓸지는 미결정(OQ-A).

---

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

> **구현 확정(2026-10-07, `spec 021` — 현장만)**
> - 선택 UI는 **라우트가 아니라 로그인 카드 안의 단계**다. 선택 확정 API가 없어 이 단계가 하는 일은
>   "목록 1회 조회 + 로컬 저장"뿐이라 라우트·가드를 둘 무게가 아니다.
> - `UserSiteSelect` 는 `sign` 엔드포인트라 **토큰 저장이 호출보다 먼저**여야 한다
>   → "토큰 있음 + `siteSeq` 없음" 중간 상태가 반드시 생기고, `AuthGuard` 가 그 상태를 막는다.
>   **본사 영역은 그 체크에서 제외**한다(본사는 아직 선택 단계가 없다).
> - 0개·호출 실패·403에서는 **토큰을 저장하지 않는다**(남기면 새로고침으로 가드를 통과할 여지).
> - 선택 결과는 `localStorage` 의 `auth.siteSeq`·`auth.siteName` 에 보관하고 로그아웃 시 함께 지운다.
>   `auth.siteName` 은 `useMe().locationName` 의 출처다(클레임에 없다).
> - **`siteSeq` 를 URL 쿼리스트링에 노출하지 않는다** → 아래 §4의 "목록 밖 값 거부"가 불필요해진다.

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
| 🔴 **서버 내부 오류 일부** | **500** | `""` — 실측 2026-10-08(`AddPoint` 에 `authMethod: 99`). 500 은 ProblemDetails 로 올 때도 있고 **빈 body 로 올 때도 있다.** `normalizeError` 는 `isEmptyBody` → status 기반 문구로 이미 수렴시킨다 |

→ 파싱 시도하면 터진다. **status code만으로 분기해야 한다.**

✅ **재실측 2026-10-08** (`spec 022` Phase 8 R0·R1) — 세 형태 전부 확인했다.
- **(A)** 로그인 실패 → HTTP **400** + `{"message":"아이디 또는 비밀번호가 올바르지 않습니다.","data":null,"code":400}`
- **(B)** 로그인 요청에서 필드 누락 → HTTP **400** + ProblemDetails(`errors`/`type`/`title`/`status`/`traceId`). 🔴 **`message` 필드 없음**이 확인됐다
- **(C)** 토큰 없음·엉뚱한 토큰 → **401** + `Content-Length: 0`. 🔴 **변경계(`DeletePoint`)도 동일** — 인증 실패 경로는 조회계와 같다. **403 도 빈 body** 확인(본사 토큰으로 `UserSiteSelect`, 현장 토큰으로 `AdminSiteSelect` 교차 호출)
- 🔴 **두 SiteSelect 의 상호 배타가 실측됐다**(§5-1 의 403 표기 확인) — 사이트가 다른 토큰으로 호출하면 **403 + 빈 body**. `LoginForm` 이 본사(1xx)에서 `UserSiteSelect` 를 부르지 않는 것은 미룬 것이 아니라 **필요한 분기**였다

### 권한 범위는 403이 아니다 (주의)

🔴 **교정(실측 2026-10-08).** 기존 기록은 "현장계정이 `siteSeq=1` 호출 → 200 + `items: []`" 였으나, **site 1 은 지점이 실제로 0건**이었다 — 권한 필터링의 증거가 아니었다.

재실측: 현장 계정 `333333`(접근 가능 = 7·8)이 `siteSeq=3` 을 조회하면 **`HTTP 200` + 실제 15건**이 내려오고, 그 지점의 `DetailPoint` 도 **200 으로 열린다.** 즉 **서버는 `siteSeq` 권한을 검사하지 않는다**(B-9).

→ "권한 없음"과 "데이터 없음"을 **응답으로 구분할 수 없는 것보다 나쁘다 — 구분할 필요도 없이 전부 내려온다.** 프론트에서 접근 가능 사업장을 `UserSiteSelect` / `AdminSiteSelect` 결과로 제한해야 한다(§2-2). 즉 **`siteSeq` 는 사용자가 임의로 넣을 수 있는 값이 아니라, 선택 목록에서 고른 값만 쿼리에 실어야 한다** — URL 쿼리스트링으로 `siteSeq` 를 노출할 경우 선택 목록 밖의 값은 거부 처리한다.

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

### 5-1-B. 변경계 실측 (POST / PATCH / DELETE) — 🔴 신설 2026-10-08

> §5-1 의 실측 24종은 **전부 조회계**였다. `spec 022` 가 프로젝트의 첫 쓰기 호출을 만들면서
> 실측했다. 대상은 순찰지점 3종이며, **다른 도메인의 변경계는 여전히 미실측**이다 —
> 다만 아래 "공통 규칙"은 같은 백엔드이므로 출발점으로 쓸 수 있다.

**공통 규칙 (지점 3종에서 관측)**

| 항목 | 실측 |
|---|---|
| 성공 | **HTTP 200** + `{"message":"요청이 정상 처리되었습니다.","data":true,"code":200}` |
| `data` 타입 | **`boolean`** — 성공 `true`. 🔴 **생성된 ID 를 주지 않는다** |
| 🔴 OQ-022-A | **해당 없음.** "HTTP 200 + 실패 `code`" 는 **관측되지 않았다.** 실패는 전부 4xx/5xx → 019 의 "성공은 2xx 전담" 판정이 변경계에서도 안전하다 |
| 🔴 OQ-022-J | **해당 없음.** 204 No Content 가 아니라 조회계와 같은 `ApiResponse` 래퍼다 → 인터셉터의 `isApiResponse` 검사를 통과한다 |
| 비즈니스 실패 | **400 + 래퍼**, `data: false`, `message` 는 **전부 `"잘못된 요청입니다."`** (B-17) |
| 유효성 실패 | **일관되지 않다** — 400 ProblemDetails / 500 ProblemDetails / 500 빈 body 가 섞인다 (B-16) |

**엔드포인트별**

| 엔드포인트 | 성공 | 특이사항 |
|---|---|---|
| `POST Point/W/sign/AddPoint` | 200 / `data: true` | 🔴 `qrCode` 를 **서버가 자동 생성**: `STSP1:{siteSeq}:{pointSeq}:{unix}:{서명}`. `gpsLat`/`gpsLng` 를 보내지 않으면 `null` 로 남는다. 생성된 `pointSeq` 는 응답에 없다 |
| `PATCH Point/W/sign/UpdatePoint` | 200 / `data: true` | 🔴 **진짜 부분 갱신** — 생략한 필드는 유지된다. 🔴 **그러나 값을 비울 수 없다**(B-15): `null`·`''` 은 무시. `memo` 는 `' '` 로만 지워지고 `nfcTagId` 는 지울 방법이 없다. 인증수단을 바꿔도 `qrCode` 는 그대로 남는다 |
| `DELETE Point/W/sign/DeletePoint` | 200 / `data: true` | 삭제 후 해당 `DetailPoint` 는 400 + 래퍼(`data: null`). ⚠️ **`usedCount > 0` 지점의 거부 여부는 미실측** — 확인하려면 실 지점을 지울 위험이 있어 보류(OQ-022-B) |

**코스 3종 (실측 2026-10-10, `spec 023` WF-1-0)**

| 엔드포인트 | 성공 | 특이사항 |
|---|---|---|
| `POST Course/W/sign/AddCourse` | 200 / `data: true` | 🔴 **`points` 가 무시된다.** 지점을 실어 보내도 `pointCount: 0` 으로 생성된다 — **200 인데 절반만 됐다**(B-27) |
| `PUT Course/W/sign/UpdateCourse` | 200 / `data: true` | 🔴 **`points` 는 전체 교체다**(B-25 확정) — 생략·빈 배열·일부 전송 **모두 나머지를 삭제**한다. ⚠️ `memo: null` 은 **반영된다**(비워짐) — 지점 `UpdatePoint` 와 **반대**(B-15) |
| `DELETE Course/W/sign/DeleteCourse` | 200 / `data: true` | 파라미터는 **`courseId`**(`courseSeq` 로 보내면 400 ProblemDetails). 편성 지점이 있어도 삭제된다 |

**오류 응답**

| 상황 | 결과 |
|---|---|
| `UpdateCourse` 에 **`courseSeq` 누락** | 🔴 **401** + 래퍼(`"잘못된 요청입니다."`). 인증 문제가 아닌데 **401** 이다(B-28) |
| `UpdateCourse` 에 없는 `courseSeq` | 400 + 래퍼 |
| `DeleteCourse` 에 파라미터명 오타 | 400 **ProblemDetails**(`errors.courseId`) |

🔴 **`DeletePoint` 는 코스에 편성돼 있어도 거부하지 않는다**(OQ-022-B 해소) — 지점이 삭제되고
코스 편성에서도 함께 빠진다. 즉 **"사용 중이라 못 지운다" 는 서버 규칙이 없다.**

---

**재현**: `docs/api-spec.md` §7 과 같은 방식. 테스트 지점을 `siteSeq=7`(현장 계정 소속, 지점 0건)에 만들어 생성 → 수정 → 삭제 한 사이클로 확인하고 **마지막에 삭제해 뒷정리**했다.

---

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
| B-9 | 🔴 **교정(실측 2026-10-08)** — 권한 밖 사업장 조회가 "200 + 빈 목록"이 아니라 **200 + 실제 데이터**다. 서버가 `siteSeq` 권한을 **전혀 검사하지 않는다.** 현장 계정 `333333`(접근 가능 `UserSiteSelect` = 7·8)이 `siteSeq=3` 을 조회하면 **15건이 그대로** 내려오고 `DetailPoint` 로 상세까지 열린다. 기존 "빈 목록" 기록은 **지점이 0건인 사업장을 조회한 탓의 잘못된 추론**이었다(site 1 은 실제로 0건). → 현재 유일한 방어는 **프론트가 선택 목록 안의 값만 쿼리에 싣는 것**이고(`spec 021` 설계가 결과적으로 옳았다), 서버측 검사 추가가 필요하다 | 🔴 |
| B-10 | `refreshToken` 회전 없음 — 재발급 후 기존 값 계속 유효 | 🟡 |
| B-11 | `codeSeq` **5 결번** | ⚪ |
| B-12 | `DeleteCourse` 만 파라미터명 `courseId`(나머지는 `courseSeq`) / `UserList` 는 `siteId`, `UserDetail` 은 `userId` | ⚪ **개선 방향**: `~Seq` 로 통일. `spec 023` 의 `UpdateCourse` 요청(B-24~B-26)과 **함께 전달**한다 | ⚪ |
| B-13 | 🔴 **`authMethod=10`(NFC) 인데 `nfcTagId: null` 인 지점이 실제로 존재**(실측 `pointSeq=30`). 서버가 NFC 지점의 TAG ID 를 강제하지 않는다. 프론트 폼은 필수로 막고 있어 **서버가 더 느슨하다** — 기존 데이터에 빈 TAG 가 있을 수 있다 | 🟡 |
| B-14 | **`qrCode` 에 QR 페이로드가 아닌 임의 문자열이 들어있다**(실측 `pointSeq=30`: `"수정하면서 넣은 지점"`). 형식(`STSP1:...`)이 강제되지 않고 **NFC 지점에도 값이 들어있다** | 🟡 |
| B-15 | 🔴 **`UpdatePoint` 로 값을 비울 수 없다.** `null` 과 `''` 를 "변경하지 않음" 으로 해석해 무시한다(실측 2026-10-08). → ① 사용자가 **설명을 비워도 지워지지 않는다** ② NFC → QR 로 바꿔도 `nfcTagId` 가 남아 **인증수단과 어긋난 데이터**가 된다. `memo` 는 공백 1칸(`' '`)을 보내면 지워지지만 `nfcTagId` 는 `null`·`''`·`' '` **전부 무시**되어 지울 방법이 없었다. **"비우기" 를 표현할 수 있는 규약이 필요하다** | 🔴 |
| B-16 | **유효성 오류가 400 이 아니라 500 으로 샌다**(실측 2026-10-08). `AddPoint` 에서 `name` 누락은 400 ProblemDetails 로 오지만, **`siteSeq` 누락은 500**(ProblemDetails + `detail`), **`authMethod: 99`(enum 밖)는 500 + 빈 body** 다. 필수값·enum 검증이 일부 누락돼 있다 | 🟡 |
| B-17 | **변경계 실패 문구가 전부 `"잘못된 요청입니다."`** 하나다(실측 2026-10-08, 없는 `pointSeq` 로 `UpdatePoint`·`DeletePoint`). 호출부가 사유를 구분할 수 없고 사용자에게 보여줄 문구로도 불충분하다 | 🟡 |
| B-18 | 🔴 **CORS 설정이 없다** — `Access-Control-Allow-Origin` 을 **전혀 주지 않는다**(실측 2026-10-08). preflight(OPTIONS)에는 204 를 주지만 CORS 헤더가 없어 **브라우저가 응답을 버린다.** `curl` 은 CORS 를 적용하지 않아 API 계약 실측에서는 드러나지 않았고, 브라우저로 앱을 돌리는 순간 전부 실패했다. → 프론트는 **vite dev 프록시**로 우회했다(`vite.config.ts` · `.env.real`). 운영은 same-origin(도메인 + 백엔드 prefix)이라 문제가 없으므로 **로컬 개발 환경을 위한 설정 요청**이다 | 🟡 |
| B-19 | 🔴 **`DetailPoint` 에 생성·수정 메타가 없다** — `createdAt`·`createdBy`·`updatedAt`·`updatedBy`. 지점상세 목업(`지점상세-신규.html`)의 **기본정보 8칸 중 4칸**이 여기 달려 있다. 가장 적은 비용으로 가장 많이 채우는 항목 | 🔴 |
| B-20 | **"상세 위치" 필드가 없다**(예: `지하 1층 · 주차장 B구역 입구`). 목업은 `memo`(설명)와 **별개 칸**으로 둔다 — 설명은 자유 서술이고 상세 위치는 **현장에서 지점을 찾는 정보**다. `gpsLat`/`gpsLng` 는 좌표일 뿐 사람이 읽는 위치가 아니다 | 🟡 |
| B-21 | **사람이 읽는 지점 코드가 없다**(목업 `PT-0032`). `pointSeq`(정수)뿐이라 헤더·기본정보·QR 식별자 표기를 채울 수 없다. QR 식별자 목업(`SPT-0032-9F4C2A`)도 이 코드를 전제로 한다 | 🟡 |
| B-22 | **변경 이력(감사 로그) API 가 없다.** swagger 44종을 확인했고 `History/*` 는 전부 **순찰** 이력이지 데이터 변경 이력이 아니다. 목업의 "변경 이력" 섹션이 통째로 여기 달려 있다(누가·무엇을·언제) | 🟡 |
| B-23 | **QR 발행 메타가 없다** — 발행일·버전(`v1`)·유효 상태. `qrCode` 문자열만 있고(`STSP1:{site}:{seq}:{unix}:{서명}`) 언제 발행됐는지·유효한지 알 수 없다. 목업의 통계 4번째 칸과 QR 카드가 여기 달려 있다 | 🟡 |
| B-24 | 🔴 **`UpdateCourse` 가 `PUT` 이다**(지점 `UpdatePoint` 는 `PATCH`). 같은 백엔드에서 메서드가 갈린다. **개선 방향: `PATCH` 로 통일 + 부분 갱신.** ⚠️ **메서드만 바꾸면 절반만 해결된다** — 진짜 문제는 B-25 다. `spec 023` 착수 전 요청, 작업 중에는 **현 스펙(PUT) 그대로 둔다**(사용자 결정 2026-10-10) | 🟡 |
| B-25 | 🔴🔴 **`UpdateCourse` 의 `points[]` 의미가 미정이다.** 이 배열 하나가 **코스의 지점 편성 + 순서(`orderNo`) + 구간시간(`courseMin`)** 을 전부 담는다. **생략하면 편성이 유지되는가 전부 삭제되는가**, **일부만 보내면 나머지는 어떻게 되는가** 가 정해져 있지 않다. 지점 5개 중 1개의 시간만 바꾸려는데 **하나를 빠뜨려 코스에서 지점이 사라지는** 사고가 가능하다. **개선 방향**: ① 배열 전체 교체라면 그 사실을 명시 ② 부분 갱신을 원하면 **변경분만 보내는 규약**(또는 편성 전용 엔드포인트 분리). `spec 023` Phase 0 에서 **현재 동작을 실측해 기록**한 뒤 요청한다 | 🔴 🔴 **확정(실측 2026-10-10)**: **전체 교체다.** `points` 를 **생략해도·빈 배열이어도·일부만 보내도** 나머지 편성이 **전부 삭제**된다. 그리고 **200 성공 응답이 온다** — 코스명만 바꾸려다 지점을 전부 날릴 수 있다 |
| B-26 | **`UpdateCourseDto` 에 `required` 가 하나도 없다** — `courseSeq` 조차. 어느 코스를 수정할지 없는 요청이 스키마상 성립한다. `AddCourseDto` 는 `siteSeq`·`courseName` 이 제대로 required 라 대비된다. **개선 방향**: 최소 `courseSeq`·`siteSeq` 를 required 로. 🔴 **스키마 오류일 가능성이 높다** — 실제 서버가 거부하는지는 실측으로 확인 | 🟡 🔴 **실측(2026-10-10)**: `courseSeq` 를 빼고 보내면 **401** 이 온다 — 거부는 하지만 **상태 코드가 틀렸다**(인증 문제가 아니다). B-28 참조 |
| B-27 | 🔴🔴 **`AddCourse` 의 `points` 가 무시된다**(실측 2026-10-10). 지점을 실어 보내도 **`pointCount: 0`** 으로 생성되는데 응답은 **200 + `data: true`** 다 — **성공이라 믿고 넘어가면 지점 없는 코스가 남는다.** 편성은 `UpdateCourse` 로만 된다. → 화면이 **"생성 후 수정" 2단계**가 되거나, 생성 직후 `UpdateCourse` 를 **자동으로 한 번 더** 불러야 한다. **개선 방향**: `AddCourse` 에서도 `points` 를 처리하거나, 받지 않을 거면 **DTO 에서 빼서** 오해를 없앤다 | 🔴 |
| B-28 | **`UpdateCourse` 에 `courseSeq` 누락 시 `401`** 을 준다(실측 2026-10-10). 인증은 정상인데 401 이라 프론트가 **토큰 만료로 오해해 재발급·로그아웃 경로를 탄다**(019 인터셉터가 401 을 그렇게 다룬다). 유효성 오류면 **400** 이어야 한다 | 🔴 |

### 6-1-A. 🔴 백엔드 전달용 — 우선순위 (2026-10-10 기준)

> `spec 022` Phase 8 실측 + `spec 023` 사전 분석에서 나온 것을 한곳에 모았다.
> **지금 전달할 것**과 **나중에 볼 것**을 나눠 둔다 — 한 번에 다 보내면 급한 게 묻힌다.

| 순위 | # | 한 줄 | 왜 급한가 |
|:-:|---|---|---|
| **1** | B-9 | `siteSeq` **권한 미검사** — 현장 계정이 소속 밖 사업장 지점을 그대로 받는다 | **보안.** 프론트 제한은 전부 우회 가능하고 서버만 막을 수 있다 |
| **2** | B-15 | `UpdatePoint` 로 **값을 비울 수 없다**(`null`·`''` 무시) | **조용히 실패한다** — 성공 응답이 와서 사용자는 지워진 줄 안다 |
| **3** | **B-25** | `UpdateCourse` 의 **`points[]` 가 전체 교체**(실측 확정) | 코스명만 바꾸려고 `points` 를 빼면 **지점이 전부 삭제**되고 **200 이 온다** |
| **3** | **B-27** | `AddCourse` 의 **`points` 가 무시된다**(200 인데 `pointCount: 0`) | 성공이라 믿고 넘어가면 **지점 없는 코스**가 남는다. 편성은 `UpdateCourse` 로만 된다 |
| **3** | **B-28** | `UpdateCourse` `courseSeq` 누락 시 **401** | 인터셉터가 **토큰 만료로 오해**해 재발급·로그아웃 경로를 탄다 |
| **4** | B-16 | 유효성 오류가 400 이 아니라 **500 으로 샌다** | "서버 오류" 로 보여 **입력을 고치라는 안내를 못 한다** |
| **5** | B-19 | `DetailPoint` 에 **생성·수정 메타 없음** | 지점 상세 **기본정보 4칸**이 통째로 빈다 |
| 6 | B-24·B-26 | `UpdateCourse` 가 `PUT` / `required` 없음 | B-25 와 **같이** 전달한다(한 엔드포인트 이야기) |
| 7 | B-17 | 변경계 실패 문구가 전부 `"잘못된 요청입니다."` | 사유를 구분·안내할 수 없다 |
| 8 | B-20·B-21 | 상세 위치 · 지점 코드 필드 없음 | 화면 칸이 비지만 동작은 한다 |
| 9 | B-22·B-23 | 변경 이력 API · QR 발행 메타 | 섹션이 placeholder 로 남아 있다 |
| 10 | B-6·B-12·B-13·B-14 | 표현·네이밍 불일치 | 프론트가 흡수 중. 정리되면 좋은 수준 |

⚠️ **1~5 는 기능·보안에 직접 걸리고, 6 이하는 화면이 비거나 불편한 수준**이다. 그 선을 넘기지 말 것.

---

### 6-2. Open Questions

| # | 질문 |
|---|---|
| OQ-1 | `code` 사전은 §2-1에 **전부 확정**(`202` = 근무자, 2026-10-02). **남은 것**: JWT `role` 문자열의 전체 목록 — 실측된 것은 `FieldManager`(현장관리자)·`SystemManager`(시스템관리자) **2개뿐**이고, Master·Manager·근무자에 해당하는 문자열은 미확인(해당 계정이 없어 실측 불가). 라우트 가드를 `role` 기준으로 삼으려면 필요. **해소 방향**: 백엔드에 묻지 않고 **계정 생성 기능을 만들 때 직접 만들어 로그인해 실측**하고 §1-2에 기록한다(결정 2026-10-02). 그때까지 알 수 없는 `role`은 권한 없음 처리 |
| OQ-1A | 사업장 선택 규칙은 §2-2에 확정. ② **해소(2026-10-07, `spec 021`)** — 서버는 선택한 `siteSeq` 를 **기억하지 않는다.** 선택 확정 엔드포인트가 swagger에 없고(`Login` 태그는 `Login`/`RefreshToken`/`Logout`/`AdminSiteSelect`/`UserSiteSelect` **5개뿐**), 두 SiteSelect는 **파라미터 없는 조회 GET**이다. 따라서 클라이언트가 보관하고 **매 요청 쿼리로 전달**한다(기존 가정이 맞았음 → `spec 022~026` 쿼리 설계 변경 없음). 🔴 **과거 구현은 선택 시 토큰을 재발급해 거기에 담았으나 현 백엔드에는 그 엔드포인트가 없다**(사용자 전달) — **JWT 클레임에서 `siteSeq` 를 찾지 말 것.** **남은 것**: ① 현장계정 `children` 이 **0개**일 때(소속 사업장 없는 현장관리자) 서버가 무엇을 주는지 — 빈 배열인지 에러인지. 0개 계정이 테스트 데이터에 없어 **계정 생성이 필요**하다. 프론트는 양쪽을 동일 처리로 수렴시켜 뒀다(`spec 021` §4) |
| OQ-1B | ✅ **해소(실측 2026-10-08, `spec 022` Phase 8 R1)** — "평면 배열로 바뀐다"던 전달(2026-10-06)은 **반영되지 않았다.** 본사 계정 `000000` 으로 호출한 `AdminSiteSelect` 는 여전히 **`GroupNode` 이중 재귀 트리**다(§5-2 기록이 맞다): 그룹이 `children` 으로 재귀하고 각 그룹의 `sites[]` 안에서 사업장이 또 `children` 으로 재귀한다(실측: 그룹 `에스텍시스템`(1) → `테스트사업장(수정)`(2) → `강동지사`(3), 사업장 `테테테(수정)1`(3) → `수정사업장테테`(4)). → **본사 사업장 선택(Phase 5)은 트리 평탄화 어댑터가 필요하다**. 평면 배열을 기다릴 이유가 없어졌다 |
| OQ-2 | `authMethod` 에 GPS 코드가 있는가? (9=QR, 10=NFC만 관측) |
| OQ-3 | `courseStatusCode` 전체 값 (0=대기중만 관측) |
| OQ-4 | `codeSeq` 목록을 주는 API — 사용자 등록 폼에 필요한데 없음 |
| OQ-5 | `eventType` 값 의미 (1→15건, 2→26건 관측. 응답 본문에 필드 없음) |
| OQ-6 | `UserDetail.deviceType` 의 `'0'` 의미 (문자열 타입인 이유) |
| OQ-7 | `UserRow.originSiteSeq`=null 인데 `originSiteName` 은 채워진 행의 의미 |
| OQ-8 | `UserDetail` 에 `codeSeq`/`codeName` 없음 — 권한 표시·수정을 어떻게? |
| OQ-9 | `GetCourseDetail` 응답에 `siteSeq` 없음 — `UpdateCourseDto` 는 요구함. 프론트가 별도 보관해야 하는가? → **`spec 023` 에서 프론트 보관으로 진행한다**(`getSiteSeq()`, spec 021). 응답에 넣어 달라고 요청할 수도 있으나, 우리가 이미 들고 있는 값이라 **없어도 막히지 않는다** — B-24~B-26 보다 우선순위가 낮다 |
| OQ-10 | ✅ **해소(실측 2026-10-10)** — `DeletePoint` 는 **코스에 편성된 지점도 거부 없이 삭제**한다. 지점이 지워지고 코스 편성에서도 함께 빠진다. 즉 `usedCount > 0` 삭제 차단은 **서버 규칙이 아니다**(`spec 022` OQ-022-B / 판단 3 해소) |
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
