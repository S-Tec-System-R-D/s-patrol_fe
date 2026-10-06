# 020-login-and-jwt spec

> 위험도: **A** (출처: `screens.md` §1-1 현장 로그인 / `roadmap.md` §7 "로그인 실구현" — 임의 산정 아님)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md) §1-1 — `/login`(현장) · `/admin/login`(본사)
> Phase: roadmap.md Phase 3 (실 API 전환 2번째. 번호 SSOT = `roadmap.md` §7-1)
> 선행: `spec 019`(통신 계약) 완료 — 본 spec은 019가 만든 `_raw` 탈출구·`ApiError`의 첫 소비처다
> 응답 근거: [`api-spec.md`](../../../docs/api-spec.md) §1-1·§1-2·§2-1 / 요청 DTO: `docs/swagger-api.json`
> 관련 목업: **없음** (`screens.md:11` — 로그인·랜딩은 리디자인 라운드 미적용, 기존 시안 유지)

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `019-api-contract` (완료, `tasks.md` 하단 "다음 spec으로 이월" 블록).

- [ ] **`/api/auth/me` MSW 핸들러 제거 + `useMe` JWT 디코딩 전환** — **본 spec US4에서 처리.** 019 DoD #9의 유일한 미달 항목이다. 런타임 소비처 12개 파일이 의존해 019에서 단독 제거가 불가능했다(제거하면 `AuthGuard`가 로그인으로 보내 dev 환경 진입 불가)
- [ ] **`DEV_ROLE_KEY` 스왑 로직 제거** — **본 spec US1·US2에서 처리.** 실 로그인 폼이 임시 진입 버튼을 대체하는 시점이 제거 시점이다
- [ ] **OQ-B 근무자(`code: 202`) WEB 차단** — **본 spec US3에서 처리.** 서버가 토큰을 발급하므로 프론트가 막아야 한다
- [ ] **OQ-C 에러 toast 위치** — **결정(2026-10-06): 호출부 책임 유지.** 019 현행 방식을 그대로 둔다. 사유는 §3 비즈니스 규칙 9
- [ ] **OQ-D JWT `role` 문자열 전체 목록** — **본 spec에서 부분 처리.** 확인된 2개만 매핑하고 나머지는 권한 없음 처리(§3 규칙 6). 전체 목록 확보는 계정 생성 기능이 생기는 Phase 5로 이월
- [x] 019 OQ-E (변경계 "HTTP 200 + 실패 `code`" 패턴) — **본 spec 범위 외 → `spec 022`로 이월.** 본 spec의 로그인도 POST지만 실측 완료된 엔드포인트이고(`api-spec.md` §1-1), 미검증 대상은 등록·수정계 19개다
- [x] 019 DoD #1~#8·#10·#11 — 019에서 충족 확인 완료. 본 spec은 그 계약 위에 올라선다

---

## User Stories

- **US1.** 현장관리자가 `/login`에서 사번과 비밀번호를 입력해 로그인하면, 현장 사이트로 진입한다.
- **US2.** 본사 관리자(시스템관리자/Master/Manager)가 `/admin/login`에서 로그인하면, 본사 사이트로 진입한다.
- **US3.** 근무자가 올바른 사번·비밀번호로 로그인해도 WEB에 진입하지 못하고, 토큰이 저장되지 않은 채 안내를 받는다.
- **US4.** 개발자가 본인 정보를 조회할 때, 실재하지 않는 `/api/auth/me` 대신 **`accessToken` JWT 클레임**에서 얻는다 — 소비처 코드는 바뀌지 않는다.

---

## 1. 목적

**임시 진입 버튼을 실 로그인으로 교체하고, 사용자 정보의 출처를 JWT로 옮긴다.**

현재 `/login`·`/admin/login`은 `localStorage['dev.role']`에 역할 문자열을 심고 가짜 토큰을 발급하는 placeholder다. 그리고 `useMe`는 **백엔드에 존재하지 않는** `GET /api/auth/me`를 호출하며, MSW mock이 그것을 받아주고 있다. 즉 지금 앱의 인증은 전부 mock 위에 서 있다.

실측(`api-spec.md` §1-2)상 백엔드에는 본인 정보 조회 엔드포인트가 **없고**, 사용자 정보는 `accessToken`의 JWT 클레임에 들어 있다. 따라서 로그인 실구현과 `useMe`의 JWT 전환은 **같은 작업**이다 — 토큰이 없으면 디코딩할 것이 없고, 전환 없이 로그인만 붙이면 `useMe`가 없는 엔드포인트를 때린다.

사업장 선택은 본 spec이 다루지 않는다(`spec 021`). 본 spec은 "로그인 → 홈 진입"까지만 책임진다.

---

## 2. I/O

### Input

**폼 필드** (`screens.md:41`)

| 필드 | 규칙 | 서버 필드 |
|---|---|---|
| 사번 | **6자리** | `loginId` |
| 비밀번호 | **8자리**, 영문·숫자·특수문자 각 1자 이상 | `loginPw` |

**API** — `POST /api/v1/Login/W/Login`

- 요청 `{ loginId: string, loginPw: string }` (swagger `LoginDto`, 둘 다 required)
- **`sign` 없는 유일한 엔드포인트** — 인증 불필요(`api-spec.md` §1-1)
- 응답 `data`는 **토큰 2개뿐**: `{ accessToken, refreshToken }`
- 성공 `code`: `101`/`102`/`103`(본사) · `201`/`202`(현장) — `api-spec.md` §2-1
- 실패: `HTTP 400` + 래퍼 `{ message: '아이디 또는 비밀번호가 올바르지 않습니다.', data: null, code: 400 }`

**JWT 클레임** (`api-spec.md` §1-2 실측)

```ts
interface AccessTokenClaims {
  userSeq: number
  loginId: string
  userName: string
  uuid: string
  roleDisplay: string   // '현장관리자' | '시스템관리자' | ... (한글 표시명)
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string
                        // 'FieldManager' | 'SystemManager' | ...
  nbf: number
  exp: number           // 수명 10800초(3시간)
  iss: 'https://stsp.s-tec.co.kr'
  aud: 'https://stsp.s-tec.co.kr'
}
```

### Output

- **US1 성공** → 토큰 2개 저장 + `homePath('FIELD_MANAGER')` = `/zones`로 이동
- **US2 성공** → 토큰 2개 저장 + `homePath(role)` = `/admin/locations`로 이동
- **US3 (`code: 202`)** → **토큰을 저장하지 않고** 로그인 화면에 머문 채 안내 문구 표시
- **US4** → `useMe()`가 JWT 클레임에서 파생한 `MeDto`를 **동기로** 반환. 소비처 12개 파일 **무변경**
- 로그인 실패 → 폼 안에 인라인 에러 표시(toast 아님 — §3 규칙 9)

---

## 3. 제약

### 기술 제약

- **수정 대상**: `src/pages/auth/LoginPage.tsx`, `src/pages/auth/AdminLoginPage.tsx`, `src/features/auth/hooks/useMe.ts`, `src/mocks/handlers/auth.ts`, `src/lib/auth/tokens.ts`(`DEV_ROLE_KEY` 제거)
- **재사용**: `AppButton`, `AppInput`, `react-hook-form` + `zod` + `@hookform/resolvers`(B2 스택), `homePath()`, `paths`, `api`(019 인터셉터)
- **신설**: 로그인 폼 컴포넌트 1종(현장·본사 **공용**), JWT 디코딩 순수함수, 클레임 타입
- **JWT 디코딩은 검증이 아니다.** 서명 검증은 서버 책임이며 클라이언트는 **payload를 읽기만** 한다. 라이브러리를 새로 추가하지 않고 `atob` + `JSON.parse`로 처리한다(B2 스택에 JWT 라이브러리가 없고, 읽기 전용이라 불필요)
- **`useMe`는 react-query를 벗는다.** JWT 디코딩은 네트워크가 없으므로 서버 상태 관리가 필요 없다. 단 **반환 모양 `{ data, isLoading, isError }`는 유지**해 소비처 12곳과 `AuthGuard`/`RequireRoute`/`RequireRole` 분기를 건드리지 않는다(결정 2026-10-06, A3)
- **MSW `/api/auth/me` 핸들러를 제거한다.** 019에서 제거 예정 사유를 주석으로 남겨둔 그 핸들러다

### 비즈니스 규칙

1. **로그인 응답은 래퍼째 받는다.** 래퍼를 벗기면 `code`가 사라지는데 사이트 분기에 필요하다 → 019가 만든 `_raw: true` 요청 플래그를 쓴다(019 `spec.md` §3 규칙 4의 유일한 용도).
2. **`code`는 저장하지 않는다.** 로그인 직후 **1회성 라우팅 힌트**로만 쓴다. `1xx` → 본사, `2xx` → 현장(`api-spec.md` §2-1).
3. **권한 판단의 SSOT는 JWT `role` 클레임**이다(`CLAUDE.md` B4). 가드·메뉴·액션 권한은 전부 `role` 기준이며 `code`를 참조하지 않는다.
4. 🔴 **`code: 202`(근무자)는 토큰을 저장하지 않는다.** 서버는 로그인을 성공시키고 토큰을 발급하지만 근무자는 APP 전용(`CLAUDE.md` B1)이다. **차단은 프론트 책임**이고, 저장 후 차단이 아니라 **저장 자체를 하지 않는다** — 저장하면 새로고침 시 토큰이 살아 있어 가드를 통과할 여지가 생긴다.
5. **로그인 성공 판정은 HTTP 2xx로 한다**(019 계약 승계). `code`로 판정하면 `101`·`201`이 실패가 된다.
6. **JWT `role` → 앱 `Role` 매핑은 확인된 2개만 한다.** `FieldManager` → `FIELD_MANAGER`, `SystemManager` → `SYSTEM`. Master·Manager·근무자에 해당하는 문자열은 **계정이 없어 미실측**(OQ-D)이므로, **알 수 없는 `role`은 권한 없음으로 처리**한다(토큰은 저장하되 가드가 막는다). 추측으로 `'Master'`·`'Manager'` 같은 값을 매핑에 넣지 않는다(A1).
7. **`locationName`·`groupName`은 JWT에 없다.** 클레임에는 사업장·그룹 정보가 전혀 없고 사업장명은 `spec 021`의 `UserSiteSelect`에서 나온다. 따라서 본 spec에서 `MeDto.locationName`은 **`undefined`**다(결정 2026-10-06). 소비처 6곳이 이미 옵셔널 접근(`me?.locationName ?? ''`)을 하므로 코드 변경 없이 넘어가고, **020~021 사이의 일시적 공백을 수용**한다. `groupName`은 소비처가 0곳(dead)이다.
8. **`/admin/login`도 본 spec에서 실구현한다**(결정 2026-10-06). 로그인 엔드포인트가 `Login/W/Login` **단 하나**이고 본사·현장이 응답 `code`로만 갈리므로 **폼 컴포넌트를 공용화**하면 추가 비용이 작다. ⚠️ `AdminLoginPage.tsx:14`의 "Phase 5에서 구현" 주석과 `roadmap.md` §9(Phase 5 범위)를 **함께 정리**해야 한다 → OQ-E.
9. **에러 toast를 인터셉터에서 일괄 발생시키지 않는다**(OQ-C 결정 2026-10-06). 로그인 실패는 폼 안 인라인 표시가 맞고, 일괄 toast면 중복 노출이 된다. 019의 현행(호출부 책임)을 유지한다.
10. **로그인 후 랜딩은 현행 `homePath()`를 따른다**(결정 2026-10-06) — 현장관리자 `/zones`, Admin 3종 `/admin/locations`. `flow.md` §0의 잠정 가정(`/patrol/zones`)이 코드와 달라 **`flow.md`를 교정**한다.

---

## 4. 엣지 케이스

| 상황 | 처리 |
|---|---|
| 사번·비번 형식 위반 | zod 스키마가 제출 전 차단. 인라인 에러 |
| 아이디·비번 불일치 (400 + 래퍼) | 019 `ApiError.message`(`'아이디 또는 비밀번호가 올바르지 않습니다.'`)를 폼 인라인에 표시 |
| 유효성 400 + ProblemDetails | 019 정규화가 `errors` 첫 항목을 뽑아준다. 폼 인라인에 동일하게 표시 |
| **`code: 202`(근무자)** | 🔴 **토큰 저장 없이** 차단 + 안내. 화면 이동 없음 |
| **알 수 없는 `role` 클레임** (OQ-D 미실측 3종) | 토큰은 저장하되 `Role` 매핑 실패 → 권한 없음. 가드가 막아 `/403`으로 간다. 로그인 자체를 실패로 만들지는 않는다 |
| **JWT 디코딩 실패** (형식 깨짐·`atob` 예외) | 토큰이 손상된 상태. `useMe`가 `isError`를 반환 → `AuthGuard`가 로그인으로 보낸다. **예외를 throw하지 않는다** |
| **클레임에 `role`이 없음** | 위와 동일 취급(권한 없음) |
| `exp` 경과한 토큰으로 진입(새로고침) | 디코딩은 성공하나 API 호출이 401 → 019 인터셉터가 재발급 시도 |
| 네트워크 실패 | 019 정규화(`'네트워크 연결을 확인해주세요'`)를 폼 인라인에 표시 |
| 제출 연타 | 요청 중 제출 버튼 비활성 |
| 이미 로그인된 상태로 `/login` 직접 접근 | 현행 유지(가드가 공개 영역을 막지 않는다) → OQ-C |

---

## 5. 완료 조건 (DoD)

- [ ] `/login`에서 실 사번·비번으로 `POST /api/v1/Login/W/Login`이 호출되고, 성공 시 토큰 2개가 저장된다
- [ ] 사번 6자리·비번 8자리(영문·숫자·특수 1+) zod 검증이 제출을 차단한다
- [ ] 로그인 응답을 `_raw`로 받아 `code`를 읽고, `1xx` → 본사 / `2xx` → 현장으로 분기한다
- [ ] 🔴 `code: 202`(근무자)에서 **토큰이 저장되지 않고** 안내가 표시되며 화면 이동이 없다
- [ ] `/admin/login`이 같은 폼으로 실구현되어 Admin 3종이 `/admin/locations`로 진입한다
- [ ] `useMe()`가 **JWT 클레임에서** `MeDto`를 반환하고, 네트워크 호출이 발생하지 않는다
- [ ] `useMe()` 반환 모양이 `{ data, isLoading, isError }`로 유지되어 **소비처 12개 파일이 무변경**이다
- [ ] JWT `role` 매핑이 확인된 2개(`FieldManager`·`SystemManager`)만이며, 알 수 없는 값은 권한 없음으로 처리된다
- [ ] JWT 디코딩이 **어떤 입력에도 throw하지 않는다**(형식 깨짐·빈 문자열·payload 비 JSON)
- [ ] MSW 핸들러에 `/api/auth/me`가 없고, `DEV_ROLE_KEY`와 임시 진입 버튼이 제거됐다 — **019 DoD #9 미달분 해소**
- [ ] `/api/auth/me` 의존 테스트 복구 완료 — 전역 핸들러 의존 2건(`DeploymentHistoryTabs`) + 자체 `server.use` 3파일(`ProfileBadge`·`RequireRoute`·`AuthGuard`)이 JWT 토큰 주입 방식으로 전환됐다
- [ ] `flow.md` §0의 로그인 랜딩 가정이 코드(`/zones`)와 일치하도록 교정됐다
- [ ] `npm run verify` 0 errors + `npm run test` green (CLAUDE.md A4, 병렬 실행)
- [ ] UI 변경이므로 **브라우저에서 실제 로그인 1회 이상 확인**(CLAUDE.md A4). 테스트 서버 계정 `333333`(현장)·`000000`(본사)

---

## 참고

- 로그인·JWT 실측: [`api-spec.md`](../../../docs/api-spec.md) §1-1·§1-2 · code 사전 §2-1 · 에러 3종 §3
- 요청 DTO: `docs/swagger-api.json` → `LoginDto`
- 통신 계약(선행): `specs/phase3/019-api-contract/spec.md`
- 진입·가드 흐름: [`flow.md`](../../../docs/flow.md) §0
- 관련 목업: **없음**

---

## Open Questions

- [ ] **OQ-A. `roleDisplay`(한글 표시명)를 쓸 것인가** — 클레임에 `roleDisplay`(`'현장관리자'`)와 영문 `role`(`'FieldManager'`)이 **둘 다** 있다. 현재 앱은 `types/enum.ts`의 `roleLabel` 맵으로 한글 라벨을 만든다. 서버 표시명을 그대로 쓰면 맵이 불필요해지지만 **미실측 3종의 `roleDisplay`도 모르므로** 기존 `roleLabel` 유지를 제안한다. 권한 판단에는 영향 없음(SSOT는 영문 `role`).
- [x] **OQ-B. `MeDto.id` 타입 불일치** — **해소(WF-2, 2026-10-06): `userSeq: number`로 교체한다.** 소비처를 실측했더니 **0곳**이었다(`useMe.ts:18`에서 매핑만 하고 아무도 읽지 않는다). `CLAUDE.md` B4("ID는 모두 `number`, 접미사 `~Seq`")를 따르는 쪽이 맞고 소비처가 없어 무위험이다. → `tasks.md` T193. 함께 **`MeRaw` 타입도 폐기**한다(존재하지 않는 응답의 타입).
- [ ] **OQ-C. 이미 로그인된 상태로 `/login` 접근** — 현행은 그냥 폼이 보인다. 홈으로 돌려보낼지 여부. 실사용 불편이 확인되면 처리하고 지금은 현행 유지.
- [ ] **OQ-D(승계). JWT `role` 문자열 3종 미실측** — Master·Manager·근무자. 계정 생성 기능이 생기는 Phase 5 본사 영역에서 실측해 `api-spec.md` §1-2에 기록한다. 그때까지 권한 없음 처리.
- [ ] **OQ-F. `AppInput`의 label-input 연결이 끊겨 있다**(WF-3 Phase 3에서 발견) — `AppInput.tsx:29`의 `<label>`에 `htmlFor`가 없고 input에 `id`가 없어 **스크린리더가 라벨을 읽지 못하고** `getByLabelText`도 동작하지 않는다(로그인 테스트는 placeholder로 우회). `AppInput`의 `label`/`error` prop은 `004 D9`에서 이미 **`AppFormField`로 이전 예정(deprecated)** 으로 표시된 영역이라 본 spec에서 손대지 않았다(A3) — 소비처가 전역이라 파급이 크다. `AppFormField` 도입 작업(`roadmap.md` §6)에서 함께 해소한다.
- [ ] **OQ-E. `AdminLoginPage` Phase 5 선언과의 충돌 정리** — 본 spec이 `/admin/login`을 실구현하므로 `AdminLoginPage.tsx:14` 주석과 `roadmap.md` §9(Phase 5 범위)에서 "본사 로그인"을 빼야 한다. WF-5 통합에서 처리.
