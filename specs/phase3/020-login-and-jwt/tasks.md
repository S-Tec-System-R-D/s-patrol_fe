# 020-login-and-jwt tasks

> 입력: [`spec.md`](./spec.md) (위험도 **A** — 잘게 분할, 검증 지점 다수)
> 응답·클레임 근거: [`docs/api-spec.md`](../../../docs/api-spec.md) §1-1·§1-2·§2-1
> 선행 계약: `spec 019` — `_raw` 탈출구 / `ApiError` 정규화 / 재발급
> 태스크 ID는 019(T170~T190)에 이어 **T191**부터

---

## ⚠️ 분할 순서를 좌우한 제약 (착수 전 확인)

**`useMe`를 전환하는 순간 테스트 4파일이 즉시 깨진다.** 그 4파일이 `MeRaw` 타입 fixture를 직접 선언하고 있기 때문이다 — `ProfileBadge.test.tsx:15` / `RequireRoute.test.tsx:15·24` / `AuthGuard.test.tsx:15` / `DeploymentHistoryTabs.test.tsx`(전역 핸들러 의존). `MeRaw`는 **존재하지 않는 응답의 타입**이므로 전환과 함께 폐기 대상이다.

따라서 테스트 복구를 Polish로 미루면 **Phase 2 종료 시점이 red**가 된다. 019에서 "각 Phase 끝에서 green 확인"을 운영 원칙으로 삼았으므로, **가짜 JWT 생성 헬퍼 → `useMe` 전환 → 테스트 4파일 복구**를 Phase 2 안에 묶는다.

---

## Phase 1: Setup — 타입·스키마

> **독립 테스트 기준**: `npm run typecheck` 통과. `AccessTokenClaims`가 `api-spec.md` §1-2 실측 필드와 일치하고, zod 스키마가 사번·비번 규칙을 담고 있다.
>
> 🔴 **Phase 1은 신설 파일만 다룬다.** 기존 타입(`me.ts`)을 손대면 `useMe.ts:18`의 `toMeDto`가 즉시 타입 에러를 내 이 기준을 깨뜨린다 — `me.ts` 정리는 `useMe`를 교체하는 Phase 2(T196-A)로 옮겼다(WF-3 착수 시 발견, 2026-10-06).

- [x] T191 [P] `AccessTokenClaims` 타입 + `role` 매핑 in src/features/auth/types/claims.ts — 실측 필드 **전량 선언**(`userSeq`·`loginId`·`userName`·`uuid`·`roleDisplay`·MS 네임스페이스 `role`·`nbf`·`exp`·`iss`·`aud`). 안 쓰는 필드도 둔다(`CLAUDE.md` B4). 매핑은 **확인된 2개만** — `FieldManager`→`FIELD_MANAGER`, `SystemManager`→`SYSTEM`. 🔴 미실측 3종(Master·Manager·근무자)을 추측으로 넣지 않는다(spec §3 규칙 6, A1). MS 클레임 키가 긴 URL이므로 상수로 분리
- [x] T192 [P] 로그인 zod 스키마 in src/features/auth/form/schema.ts — 파일명은 **기존 패턴을 따른다**(`features/{도메인}/form/schema.ts`가 5곳 선례. 당초 `loginSchema.ts`로 적었으나 교정, A3). 서버 필드명과 맞춰 `loginId`/`loginPw`로 선언해 변환 레이어를 만들지 않는다.
  - **사번**: 길이만 검증 `min(1).max(8)` — `screens.md:41`은 "6자리"지만 자릿수가 늘 수 있어 상한을 8로 둔다(사용자 결정 2026-10-06). 🔴 **숫자 제한을 넣지 않는다** — 명세에 없는 제한이다(A1)
  - **비번**: `min(8)` + 영문·숫자·특수 각 1자 이상(`screens.md:41`). 정확히 8자가 아니라 **최소 8자**다(사용자 결정 2026-10-06) — 기존 `workers/form/schema.ts`의 `initialPassword: min(8)` 선례와 일치하고, 짧은 상한은 기존 사용자의 로그인을 막을 위험이 있다

---

## Phase 2: Foundational — JWT 디코딩 + `useMe` 전환 (모든 US 선행 blocking)

> **독립 테스트 기준**: 가짜 JWT를 `localStorage`에 심으면 `useMe()`가 **네트워크 호출 없이** 동기로 `MeDto`를 반환한다. 손상된 토큰·빈 문자열·비 JSON payload에서 **throw하지 않고** `isError`를 반환한다. **이 Phase 종료 시 전체 테스트가 green이어야 한다.**

- [x] T194 [US4] JWT 디코딩 순수함수 in src/lib/auth/jwt.ts — `decodeAccessToken(token) → AccessTokenClaims | null`. `atob` + `JSON.parse`만 쓰고 **패키지를 추가하지 않는다**(읽기 전용. 서명 검증은 서버 책임 — spec §3 기술 제약). base64url(`-`/`_`) 치환 필요. 🔴 **어떤 입력에도 throw하지 않는다** — 빈 문자열·점 없음·점 1개·payload가 비 JSON·payload가 배열/숫자 전부 `null` 반환
- [x] T195 [US4] T194 단위 테스트 in src/lib/auth/__tests__/jwt.test.ts — 정상 토큰(실측 클레임 형태)에서 각 필드 추출 / 비정상 입력 7종 이상에서 **throw 없이 `null`** / base64url 문자(`-`·`_`) 포함 payload 디코딩 / 한글 `userName`·`roleDisplay` 디코딩(`atob`은 UTF-8을 깨뜨리므로 처리 필요 — **여기서 걸릴 가능성이 높다**)
- [x] T196 [US4] 테스트용 가짜 JWT 생성 헬퍼 in src/test/jwt.ts — `makeAccessToken(partialClaims) → string`. T197의 복구 재료이자 이후 모든 인증 테스트의 공용 도구. `src/test/`는 기존 테스트 셋업 위치로 **확인됨**(`vitest.config.ts:22` → `src/test/setup.ts`). 서명은 의미 없는 placeholder
- [x] T196-A [US4] `MeDto` 정리 in src/features/auth/types/me.ts — `MeDto.id: string` → **`userSeq: number`**(`CLAUDE.md` B4 "ID는 number, 접미사 ~Seq"). 소비처를 실측했고 **0곳**이라 무위험(`useMe.ts:18`에서 매핑만 하고 아무도 읽지 않는다). `locationName`·`groupName`은 **필드를 유지**하되 020에서는 `undefined`(spec §3 규칙 7 — 021이 채운다). 🔴 **`MeRaw` 제거는 여기서 하지 않는다** — MSW 핸들러와 테스트 4파일이 아직 쓰고 있어 typecheck가 깨진다. T209 이후로 미룬다(T210-A)
- [x] T197 [US4] `useMe` JWT 전환 in src/features/auth/hooks/useMe.ts — react-query 제거, **동기 훅**으로 교체. 🔴 **반환 모양 `{ data, isLoading, isError }` 유지**(결정 2026-10-06, A3) — 소비처 12곳과 `AuthGuard`·`RequireRoute`·`RequireRole` 분기를 건드리지 않는다. `isLoading`은 항상 `false`. 토큰 없음/디코딩 실패/`role` 매핑 실패 → `isError: true`. `meQueryKey` export를 쓰는 곳이 있는지 확인해 함께 정리(`ProfileBadge.tsx:12`가 import한다)
- [x] T198 [US4] 테스트 4파일 복구 in src/components/layout/topnav/__tests__/ProfileBadge.test.tsx, src/features/auth/components/__tests__/RequireRoute.test.tsx, src/router/guards/__tests__/AuthGuard.test.tsx, src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx — `MeRaw` fixture + `server.use(http.get('/api/auth/me'...))`를 **T196 헬퍼로 만든 토큰 주입**으로 교체. 🔴 **복구 범위가 `useMe` 재설계나 소비처 수정으로 번지면 멈추고 보고**(A3) — 반환 모양을 유지하는 이유가 바로 이것이다
- [x] T199 [US4] `useMe` 단위 테스트 in src/features/auth/hooks/__tests__/useMe.test.ts — 토큰 있음 → `MeDto` 반환 / 토큰 없음 → `isError` / 손상 토큰 → `isError` / **알 수 없는 `role`** → `isError`(권한 없음) / **네트워크 호출이 발생하지 않음**(MSW unhandled 감시 또는 adapter 미호출로 고정)

---

## Phase 3: US1 — 현장 로그인

> **독립 테스트 기준**: `/login`에서 사번 6자리·비번 8자리를 넣고 제출하면 `POST /api/v1/Login/W/Login`이 호출되고, `code: 201` 응답에서 토큰 2개가 저장된 뒤 `/zones`로 이동한다. 형식 위반은 제출 자체가 막힌다.

- [x] T200 [US1] 로그인 폼 컴포넌트 in src/features/auth/components/LoginForm.tsx — **현장·본사 공용**(spec §3 규칙 8). `react-hook-form` + `zodResolver`(T192) + `AppInput`·`AppButton`. 제목·안내 문구는 prop으로 받아 사이트별 차이를 흡수한다. 제출 중 버튼 비활성(엣지 케이스 "연타")
- [x] T201 [US1] 로그인 API 호출 in src/features/auth/api/login.ts — `POST /api/v1/Login/W/Login`, body `{ loginId, loginPw }`. 🔴 **`_raw: true`로 래퍼째 받는다**(019 탈출구의 첫 소비처 — 래퍼를 벗기면 `code`가 사라진다). 반환은 `{ code, accessToken, refreshToken }`
- [x] T202 [US1] `code` 분기 + 토큰 저장 in src/features/auth/lib/loginResult.ts — `1xx`→본사 / `2xx`→현장(`api-spec.md` §2-1). **`code`를 저장하지 않는다**(1회성 라우팅 힌트). `202`는 T206이 담당하므로 여기서는 분기 지점만 둔다. 랜딩 경로는 기존 `homePath()` 재사용(spec §3 규칙 10)
- [x] T203 [US1] `LoginPage` 교체 in src/pages/auth/LoginPage.tsx — placeholder 통째로 교체. `devSignInAsField`·`DEV_ROLE_KEY` 사용 제거. 실패 시 `ApiError.message`를 **폼 인라인**에 표시(toast 아님 — spec §3 규칙 9)
- [x] T204 [US1] 화면 테스트 in src/pages/auth/__tests__/LoginPage.test.tsx — 형식 위반 → 제출 차단(API 미호출) / 성공(`code: 201`) → 토큰 2개 저장 + `/zones` 이동 / 실패(400 + 래퍼) → 폼 인라인에 서버 문구 / 네트워크 실패 → 019 정규화 문구 / 제출 중 버튼 비활성

---

## Phase 4: US2 — 본사 로그인

> **독립 테스트 기준**: `/admin/login`에서 같은 폼으로 로그인해 `code: 101` 응답이면 `/admin/locations`로 이동한다.

- [x] T205 [US2] `AdminLoginPage` 교체 in src/pages/auth/AdminLoginPage.tsx — T200 폼 재사용. 임시 버튼 3종·`DEV_ROLE_KEY` 제거. ⚠️ 파일 주석의 "Phase 5에서 구현" 선언을 **본 spec으로 정정**(OQ-E)
- [x] T206 [US2] 화면 테스트 in src/pages/auth/__tests__/AdminLoginPage.test.tsx — `code: 101`/`102`/`103` 전부 `/admin/locations` 이동(`it.each`) / 실패 문구 인라인 표시

---

## Phase 5: US3 — 근무자(`code: 202`) 차단

> **독립 테스트 기준**: `code: 202` 응답에서 **`localStorage`에 토큰이 하나도 저장되지 않고**, 화면 이동도 없고, 안내 문구가 보인다.

- [x] T207 [US3] `202` 차단 처리 in src/features/auth/lib/loginResult.ts, src/features/auth/components/LoginForm.tsx — 🔴 **토큰 저장 자체를 하지 않는다.** 저장 후 차단이 아니다(spec §3 규칙 4 — 저장하면 새로고침 시 토큰이 살아 있어 가드를 통과할 여지가 생긴다). 안내 문구는 "WEB 접근 불가, APP 사용" 취지
- [x] T208 [US3] 차단 테스트 in src/pages/auth/__tests__/LoginPage.test.tsx — `code: 202` → **`getAccessToken()`·`getRefreshToken()`이 둘 다 `null`** / 화면 이동 없음 / 안내 문구 노출. 🔴 "토큰이 저장되지 않음"을 **직접 단정**한다 — 이것이 US3의 전부다

---

## Phase 6: Polish

- [ ] T209 MSW 인증 핸들러 정리 in src/mocks/handlers/auth.ts — `/api/auth/me` 핸들러 **제거**(019에서 제거 예정 주석을 달아둔 그것) + `buildMockMe`·`readDevRole`·`VALID_ROLES` 제거. 실 로그인 mock이 필요하면 `Login/W/Login` 핸들러를 **실경로·실 code로** 신설. **019 DoD #9 미달분 해소 지점**
- [ ] T210-A `MeRaw` 타입 제거 in src/features/auth/types/me.ts — **존재하지 않는 응답의 타입**이다. 소비처(MSW 핸들러·테스트 4파일)가 T198·T209에서 모두 사라진 뒤 지운다. 남아 있으면 지우지 않고 **보고**
- [ ] T210 `DEV_ROLE_KEY` 제거 in src/lib/auth/tokens.ts — 소비처(`LoginPage`·`AdminLoginPage`·`mocks/handlers/auth.ts`)가 T203·T205·T209에서 모두 사라진 뒤 상수를 지운다. 남아 있으면 제거하지 않고 **보고**
- [ ] T211 [P] `docs/flow.md` §0 교정 — 로그인 랜딩 잠정 가정(`/patrol/zones`)을 코드 실제(`/zones`)와 일치시키고 "Open" 표기 해소(spec §3 규칙 10). 근무자 차단·사업장 선택(021) 흐름도 현재 결정과 맞는지 확인
- [ ] T212 [P] `docs/screens.md` §1-1 갱신 — `/login`·`/admin/login` 진행도 ✗ → ✓, 비고에 구현 결과 기록
- [ ] T213 [P] `docs/roadmap.md` 갱신 — §12에 020 행 추가(결과·이월). §7 "로그인 실구현" 항목 상태 갱신. §9 Phase 5 범위에서 **"본사 로그인" 제거**(OQ-E — 본 spec이 흡수)
- [ ] T214 [P] `docs/data-model.md` §4-3 갱신 — `MeRaw` 폐기 + `MeDto` 변경(`userSeq`) + 출처가 `/auth/me`가 아니라 **JWT 클레임**임을 반영. 차이가 없는 절은 "변경 없음"으로 기록하고 넘어간다
- [ ] T215 `npm run verify` + `npm run test` **병렬 실행** green 확인 (CLAUDE.md A4)
- [ ] T216 **브라우저 실제 로그인 확인** — 테스트 서버 계정 `333333`(현장) / `000000`(본사). UI 변경이므로 의무(CLAUDE.md A4). `VITE_API_BASE_URL`이 테스트 서버를 가리키는지 먼저 확인
- [ ] T217 DoD 대조표 작성(증거 `파일:라인`) + 본 파일 하단 "다음 spec으로 이월" 블록 작성

---

## Dependencies & Execution Order

- T191, T192는 서로 다른 신설 파일 → `[P]`
- **T191 → T194**(디코딩이 클레임 타입을 쓴다)
- **T194 → T195 → T196 → T196-A → T197 → T198 → T199** 순차. 🔴 **T196-A·T197·T198은 끊지 않는다** — `me.ts`를 고치면 `useMe.ts`가 깨지고, `useMe`를 교체하면 테스트 4파일이 깨진다. 셋을 한 묶음으로 끝내야 green이 유지된다
- **T210-A는 T198·T209 이후** — `MeRaw` 소비처가 모두 사라진 뒤에만 제거 가능
- **Phase 1 + Phase 2 전체 → Phase 3·4·5 선행** (JWT 전환이 안 되면 로그인 성공 후 가드가 막는다)
- T192 → T200, T200 → T201 → T202 → T203 → T204
- **T200은 Phase 3·4 공용** → T205는 T200 완료 후. Phase 3 전체 → Phase 4
- T202 → T207 (같은 파일. `code` 분기 지점이 생긴 뒤 `202`를 끼운다) → T208
- Phase 3·4·5 → T209 → T210 (소비처가 먼저 사라져야 상수 제거 가능)
- T211~T214 서로 독립 `[P]`. 모두 T210 완료 후
- T215 → T216 → T217

---

## 구현 시 유의사항 (착수 전 예상)

> 결과는 WF-4에서 "예상 → 실제"로 덧붙인다.

- 🔴 **`atob`의 UTF-8 문제(T195)가 가장 걸릴 지점** — 클레임의 `userName`·`roleDisplay`가 **한글**이다(`'현장관리자'`). `atob`는 바이트열을 주므로 그대로 `JSON.parse`하면 한글이 깨진다. `TextDecoder` 또는 `decodeURIComponent(escape(...))` 계열 처리가 필요하다. 실측 토큰으로 확인하는 것이 가장 확실하고, **깨진 채 통과하면 화면에 사용자 이름이 깨져 나온다**
- **T197의 `isLoading` 의미 변화** — 동기 훅이라 항상 `false`다. `AuthGuard.tsx:27`이 `if (isLoading) return null`로 깜빡임을 막고 있었는데, 이제 그 분기가 죽은 코드가 된다. **지우지 않는다**(A3 — 반환 모양 유지가 목적이고, 021에서 사업장 선택이 붙으면 비동기 로딩이 다시 생길 수 있다). 다만 죽은 분기임을 주석으로 남길지는 구현 시 판단
- **테스트 복구(T198)가 019와 같은 함정을 가진다** — 019에서 "경로를 하드코딩해 핸들러가 안 걸려 가짜 green"이 났다. 이번엔 토큰 주입이 **실제로 `useMe`에 도달하는지**를 확인해야 한다. 주입에 실패하면 `isError` 경로로 떨어져 "로그인으로 리다이렉트"가 나오고, 그게 테스트 의도와 우연히 맞아떨어질 수 있다
- **`code` 분기와 `role` 매핑이 어긋날 수 있다** — `code: 101`(시스템관리자)인데 JWT `role`이 미실측 값이면, 라우팅은 본사로 가고 가드는 막는다. 즉 **로그인은 성공했는데 `/403`에 떨어지는** 상태가 가능하다. 이것은 OQ-D가 해소될 때까지 **의도된 동작**이며(spec §4), 혼동하지 않도록 테스트로 고정한다
- **폼 공용화(T200)의 범위 위험** — 사이트별 차이를 prop으로 흡수하는데, 차이가 3개 이상으로 늘면 공용화가 오히려 복잡해진다. 현재 확정된 차이는 **제목·안내 문구·성공 후 경로 3가지**다. 그 이상이 필요해 보이면 분리를 검토하고 **Open Q로 등재**(A6)
- **`spec 021` 경계를 넘지 않는다** — `locationName`은 `undefined`로 두고(spec §3 규칙 7), 사업장 선택·`siteSeq` 저장·`UserSiteSelect` 호출은 **일절 손대지 않는다.** 배치 화면 전입/전출 판정이 빈 결과가 되는 것은 수용된 일시 퇴행이다

---

## 진행 기록

> WF-3 각 Phase 완료 시 추가.

### Phase 1 완료 — 타입·스키마 (2026-10-06)

- T191~T192 완료. **신설 2파일**(`features/auth/types/claims.ts`, `features/auth/form/schema.ts`)
- `npm run verify` 0 errors(경고 1건은 `public/mockServiceWorker.js` 기존 MSW 생성물)
- 🔴 **착수 시 tasks.md의 순서 결함을 발견해 고쳤다** — 원래 T193(`me.ts` 정리)이 Phase 1에 있었는데, `MeDto.id`를 바꾸거나 `MeRaw`를 지우면 `useMe.ts:18`의 `toMeDto`가 즉시 타입 에러를 내 **Phase 1의 독립 테스트 기준(typecheck 통과) 자체를 깨뜨린다.** 분할
  - `MeDto` 변경 → **T196-A**(Phase 2, `useMe` 교체와 한 묶음)
  - `MeRaw` 제거 → **T210-A**(Phase 6, MSW·테스트 소비처가 사라진 뒤)
  - 교훈: Phase 1을 "신설 파일만"으로 유지하면 이 종류의 충돌이 생기지 않는다
- **계획 대비 변경 2건**
  1. **스키마 파일명** `loginSchema.ts` → `schema.ts`. 기존 패턴이 `features/{도메인}/form/schema.ts`로 **5곳 선례**(deployments·notice·points·workers·zone)였다(A3)
  2. **사번 검증을 `length(6)`에서 `min(1).max(8)`로** — 사용자 결정(자릿수가 늘 수 있음). 🔴 `length(8)`로 고정하면 **실측 테스트 계정 `333333`·`000000`(6자)이 막힌다**는 점을 확인하고 범위를 되물어 확정했다
- **의도적으로 넣지 않은 것**: 사번의 숫자 전용 제한. 실측 계정이 숫자라는 것은 사번 체계가 숫자 전용이라는 근거가 아니다(A1). 명세(`screens.md:41`)도 비번에만 문자 종류를 명시하고 사번은 길이만 적었다
- **`role` 매핑은 2개만 넣었다**(`FieldManager`·`SystemManager`). 추측 매핑이 위험한 이유를 `claims.ts`에 주석으로 남겼다 — 서버가 다른 문자열을 쓸 때 **엉뚱한 권한으로 통과시키는** 사고가 되므로, 모르는 값은 통과시키지 않는다
- `MS_ROLE_CLAIM` 상수와 인터페이스 키에 같은 URL이 두 번 등장한다. `interface`는 computed key를 못 쓰는 TS 제약이고, 주석으로 사유를 명시했다
- 다음: Phase 2(JWT 디코딩 + `useMe` 전환 + 테스트 복구, T194~T199) — **T196-A·T197·T198은 끊지 않는다** → 완료

### Phase 2 완료 — JWT 디코딩 + `useMe` 전환 (2026-10-06)

- T194~T199 완료. 테스트 **224 → 259건**(+35), 파일 35 → 37
- `npm run verify` 0 errors + `npm run test` 37 files / 259 tests green
- **`useMe`가 네트워크를 완전히 떠났다.** `/api/auth/me` 호출이 사라졌고, 그것을 adapter 수준에서 고정했다(`useMe.test.ts` — 렌더 시 어떤 HTTP 요청도 없음). MSW 핸들러는 아직 남아 있으나 **아무도 호출하지 않는다**(제거는 T209)
- ✅ **예상했던 `atob` UTF-8 문제가 실제로 있었고 막았다** — `atob`는 바이트열을 "문자당 1바이트" 문자열로 주므로 그대로 `JSON.parse`하면 한글(`userName`·`roleDisplay`)이 깨진다. `Uint8Array` → `TextDecoder` 경로로 처리하고, 한글 클레임 테스트로 고정했다. 이걸 놓치면 **화면에 사용자 이름이 깨져 나오는** 조용한 버그가 된다
- **계획 대비 변경 3건**
  1. 🔴 **`ProfileBadge.tsx`를 수정했다 — "소비처 12곳 무변경" 약속의 유일한 예외.** `meQueryKey`를 import해 로그아웃 시 `invalidateQueries`를 호출하고 있었는데, react-query를 벗으면 무효화할 캐시가 없다. 토큰을 지우면 다음 `useMe()`가 바로 `isError`가 되므로 그 호출과 `useQueryClient`를 함께 제거했다. 반환 모양 유지로 막을 수 있는 건 `{ data, isLoading, isError }` 소비였고, **export 소비(`meQueryKey`)는 막을 수 없었다**
  2. **`useMemo` 콜백에서 계산을 모듈 레벨 순수함수(`resolveMe`)로 빼냈다** — 콜백 안의 조건부 early return을 `react-hooks/preserve-manual-memoization`이 lint 에러로 막는다. 계산을 빼면 콜백이 단일 호출식이 되어 통과한다. 동작은 동일
  3. **`AuthGuard`에 "매핑에 없는 role" 테스트를 추가했다**(계획 외 1건). 미실측 role 3종이 가드에서 어떻게 처리되는지가 OQ-D의 실질적 영향이라 명시 고정이 필요했다
- **테스트 의미가 바뀐 것 3건** — 네트워크가 사라져 기존 의도가 성립하지 않는다
  - `AuthGuard`: "useMe 401 + refresh 실패 → 로그인" → **"손상된 토큰 → 로그인"**. 401이라는 상황 자체가 없어졌다
  - `RequireRoute`: "로딩 중에는 children 렌더 안 함" → **"사용자를 특정할 수 없으면 렌더 안 함"**. 동기 훅이라 `isLoading`이 항상 `false`이고 로딩 상태가 존재하지 않는다
  - `RequireRoute`: "미인증(useMe 실패)" → **"토큰 없음"**
- **`DeploymentHistoryTabs.test.tsx`는 `useMe`를 `vi.mock`으로 스텁했다** — 전입/전출 판정이 `locationName` 문자열 비교인데 클레임에 사업장명이 없어 020에서는 빈 결과가 된다. 이 테스트의 관심사는 **탭 전환과 이력 렌더**이고 인증이 아니므로, 사업장명을 스텁해 기능 검증을 보존했다. 🔴 **021에서 실제 `locationName`이 들어오면 이 스텁을 걷어낸다**(이월 등재)
- **`AuthGuard.tsx:27`의 `if (isLoading) return null`은 죽은 분기가 됐지만 지우지 않았다**(계획대로, A3). 021에서 사업장 선택이 붙으면 비동기 로딩이 다시 생길 수 있다
- `MeRaw`는 아직 살아 있다 — MSW 핸들러가 쓰고 있어 T209 이후 T210-A에서 제거
- 다음: Phase 3(US1 현장 로그인, T200~T204) → 완료

### Phase 3 완료 — US1 현장 로그인 (2026-10-06)

- T200~T204 완료. 테스트 **259 → 273건**(+14), 파일 37 → 38
- `npm run verify` 0 errors + `npm run test` 38 files / 273 tests green
- **`_raw` 탈출구의 첫 실사용** — 019가 만들어 둔 것을 로그인이 처음 쓴다. 래퍼째 받아 `code`를 읽고 즉시 소비한 뒤 버린다(저장하지 않는다)
- **계획 대비 변경 3건**
  1. 🔴 **랜딩 경로를 `role`이 아니라 `code`로 정했다.** spec §2 Output은 `homePath(role)`로 적었는데, 미실측 `role`(OQ-D)이면 `toRole`이 `null`이라 **`homePath()`를 구할 수 없다.** `code`는 사이트가 확실히 담겨 있어 그 경우에도 착지점이 결정되고, 권한 차단은 그 뒤 가드가 한다. 결과 경로는 동일(`/zones`·`/admin/locations`)하지만 **미실측 role에서도 로그인이 멈추지 않는다**
  2. **`LoginForm` props가 3개 → 2개로 줄었다.** 착지 경로를 `code`가 정하므로 prop에서 빠지고 **제목·안내 문구만** 남았다. 공용화 위험(A6, 차이 3개 이상이면 분리 검토)이 오히려 줄었다
  3. **`navigate`로 이동한다 — 기존 placeholder의 `window.location.assign`(하드 리로드)을 쓰지 않는다.** 하드 리로드의 이유는 "`useMe` 캐시 무효화 + MSW 재초기화"였는데, `useMe`가 동기로 토큰을 읽게 되어 캐시가 없다. SPA 네비게이션으로 충분하고 테스트도 쉬워진다
- 🔴 **`AppInput`의 label-input 연결이 끊겨 있는 것을 발견했다**(`AppInput.tsx:29` — `<label>`에 `htmlFor` 없음, input에 `id` 없음). 스크린리더가 라벨을 읽지 못하고 `getByLabelText`도 안 먹는다. `AppInput`의 `label`/`error` prop은 `004 D9`에서 이미 `AppFormField` 이전 예정으로 deprecated 처리된 영역이고 소비처가 전역이라 본 spec에서 손대지 않았다(A3) → **spec OQ-F 등재**. 테스트는 placeholder로 우회
- **에러 처리는 019 정규화에 전적으로 의존한다** — 폼은 `error.message`를 그대로 꺼내 쓰고 래퍼/ProblemDetails/네트워크 형태를 **다시 분기하지 않는다**. 테스트로 3형태 모두 폼에 문구가 뜨는 것을 고정했다
- **테스트에서 고정한 것**: 성공 code 4종(201·101·102·103) 라우팅 / 요청 본문이 swagger `LoginDto`(`loginId`/`loginPw`)와 일치 / 형식 위반 시 **API 미호출** / 비번 복잡도 3종 / **숫자 아닌 사번 통과**(숫자 제한을 넣지 않았다는 계약) / 실패 4종(래퍼·ProblemDetails·네트워크·비래퍼 2xx)에서 토큰 미저장
- ⚠️ **MSW에 `Login/W/Login` 핸들러가 아직 없다.** 테스트는 각자 `server.use`로 깔았다. dev 환경에서 로그인을 해보려면 T209(핸들러 신설) 이후이거나 실 서버를 가리켜야 한다
- 다음: Phase 4(US2 본사 로그인, T205~T206) → 완료

### Phase 4·5 완료 — 본사 로그인 + 근무자 차단 (2026-10-06)

- T205~T208 완료. 테스트 **273 → 294건**(+21), 파일 38 → 40
- `npm run verify` 0 errors + `npm run test` 40 files / 294 tests green
- **US 4개 전부 완료.** 남은 것은 Phase 6 Polish
- **T207(근무자 차단)은 Phase 3에서 이미 구현됐다** — `loginResult.ts`와 `LoginForm`을 만들면서 `outcome.kind !== 'allowed'` 분기에 자연히 포함됐다. Phase 5에서는 **테스트(T208)만** 추가했다. 같은 파일을 두 Phase가 나눠 갖는 분할이었는데, 실제로는 "한 번에 쓰고 나중에 테스트"가 됐다
- **본사 로그인은 폼 재사용만으로 끝났다**(`AdminLoginPage`가 3줄). 임시 버튼 3종·`DEV_ROLE_KEY` 사용이 사라졌고, 파일 주석의 "Phase 5에서 구현" 선언도 정정했다(OQ-E의 코드 쪽 — `roadmap.md` §9는 T213에서)
- **계획 외 추가 1건**: `loginResult.ts` 순수함수 테스트(`features/auth/lib/__tests__/loginResult.test.ts`). 화면 테스트보다 싸게 code 사전 전체를 고정할 수 있고, 특히 **202 판정이 사이트 판정보다 먼저인지**를 직접 겨냥한다(순서가 바뀌면 근무자가 현장 사이트로 들어간다)
- 🔴 **경계 케이스를 하나 잡았다 — `code: 200`** — `200`은 사전상 **일반 조회 성공** code인데 `isServiceLoginCode`의 "2xx = 현장" 범위에 걸려 현장으로 판정된다. 처음엔 `unknown`을 기대하는 테스트를 썼다가 실패했다.
  - **화이트리스트(실측 5개만 허용)로 좁히지 않고 범위를 유지**하기로 했다. 서버가 `104`·`204` 같은 권한을 추가하면 화이트리스트는 로그인을 막아버린다. 반면 사이트 분기는 **힌트**이고 최종 권한은 JWT `role`이 정하므로 범위를 넓게 잡아도 권한이 새지 않는다(role이 없거나 매핑 밖이면 가드가 막는다)
  - 이 판단을 테스트에 "의도된 동작"으로 명시 고정했다. 안 그러면 다음 사람이 버그로 보고 화이트리스트로 좁힐 것이다
- **본사 화면에 현장 계정이 들어오는 경우를 테스트로 고정했다** — `/admin/login`에서 `code: 201`이면 **현장 홈**으로 간다. 화면이 아니라 code가 착지점을 정한다
- 다음: Phase 6(Polish, T209~T217) — MSW·`DEV_ROLE_KEY` 제거, 문서 4종, 브라우저 확인
