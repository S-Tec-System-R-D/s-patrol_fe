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

> **독립 테스트 기준**: `npm run typecheck` 통과. `AccessTokenClaims`가 `api-spec.md` §1-2 실측 필드와 일치하고, zod 스키마가 사번 6자리·비번 8자리 규칙을 담고 있다.

- [ ] T191 [P] `AccessTokenClaims` 타입 + `role` 매핑 in src/features/auth/types/claims.ts — 실측 필드 **전량 선언**(`userSeq`·`loginId`·`userName`·`uuid`·`roleDisplay`·MS 네임스페이스 `role`·`nbf`·`exp`·`iss`·`aud`). 안 쓰는 필드도 둔다(`CLAUDE.md` B4). 매핑은 **확인된 2개만** — `FieldManager`→`FIELD_MANAGER`, `SystemManager`→`SYSTEM`. 🔴 미실측 3종(Master·Manager·근무자)을 추측으로 넣지 않는다(spec §3 규칙 6, A1). MS 클레임 키가 긴 URL이므로 상수로 분리
- [ ] T192 [P] 로그인 zod 스키마 in src/features/auth/form/loginSchema.ts — 사번 **6자리**, 비번 **8자리 + 영문·숫자·특수 각 1자 이상**(`screens.md:41`). 서버 필드명과 맞춰 `loginId`/`loginPw`로 선언해 변환 레이어를 만들지 않는다
- [ ] T193 [P] `MeDto` 정리 in src/features/auth/types/me.ts — ① `MeRaw` **제거**(존재하지 않는 응답의 타입) ② `MeDto.id: string` → **`userSeq: number`**(`CLAUDE.md` B4 "ID는 number, 접미사 ~Seq"). **소비처를 실측했고 0곳**이라 무위험(`useMe.ts:18`에서 매핑만 하고 아무도 읽지 않는다) ③ `locationName`·`groupName`은 **필드를 유지**하되 020에서는 `undefined`(spec §3 규칙 7 — 021이 채운다)

---

## Phase 2: Foundational — JWT 디코딩 + `useMe` 전환 (모든 US 선행 blocking)

> **독립 테스트 기준**: 가짜 JWT를 `localStorage`에 심으면 `useMe()`가 **네트워크 호출 없이** 동기로 `MeDto`를 반환한다. 손상된 토큰·빈 문자열·비 JSON payload에서 **throw하지 않고** `isError`를 반환한다. **이 Phase 종료 시 전체 테스트가 green이어야 한다.**

- [ ] T194 [US4] JWT 디코딩 순수함수 in src/lib/auth/jwt.ts — `decodeAccessToken(token) → AccessTokenClaims | null`. `atob` + `JSON.parse`만 쓰고 **패키지를 추가하지 않는다**(읽기 전용. 서명 검증은 서버 책임 — spec §3 기술 제약). base64url(`-`/`_`) 치환 필요. 🔴 **어떤 입력에도 throw하지 않는다** — 빈 문자열·점 없음·점 1개·payload가 비 JSON·payload가 배열/숫자 전부 `null` 반환
- [ ] T195 [US4] T194 단위 테스트 in src/lib/auth/__tests__/jwt.test.ts — 정상 토큰(실측 클레임 형태)에서 각 필드 추출 / 비정상 입력 7종 이상에서 **throw 없이 `null`** / base64url 문자(`-`·`_`) 포함 payload 디코딩 / 한글 `userName`·`roleDisplay` 디코딩(`atob`은 UTF-8을 깨뜨리므로 처리 필요 — **여기서 걸릴 가능성이 높다**)
- [ ] T196 [US4] 테스트용 가짜 JWT 생성 헬퍼 in src/test/jwt.ts — `makeAccessToken(partialClaims) → string`. T197의 복구 재료이자 이후 모든 인증 테스트의 공용 도구. `src/test/`는 기존 테스트 셋업 위치로 **확인됨**(`vitest.config.ts:22` → `src/test/setup.ts`). 서명은 의미 없는 placeholder
- [ ] T197 [US4] `useMe` JWT 전환 in src/features/auth/hooks/useMe.ts — react-query 제거, **동기 훅**으로 교체. 🔴 **반환 모양 `{ data, isLoading, isError }` 유지**(결정 2026-10-06, A3) — 소비처 12곳과 `AuthGuard`·`RequireRoute`·`RequireRole` 분기를 건드리지 않는다. `isLoading`은 항상 `false`. 토큰 없음/디코딩 실패/`role` 매핑 실패 → `isError: true`. `meQueryKey` export를 쓰는 곳이 있는지 확인해 함께 정리(`ProfileBadge.tsx:12`가 import한다)
- [ ] T198 [US4] 테스트 4파일 복구 in src/components/layout/topnav/__tests__/ProfileBadge.test.tsx, src/features/auth/components/__tests__/RequireRoute.test.tsx, src/router/guards/__tests__/AuthGuard.test.tsx, src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx — `MeRaw` fixture + `server.use(http.get('/api/auth/me'...))`를 **T196 헬퍼로 만든 토큰 주입**으로 교체. 🔴 **복구 범위가 `useMe` 재설계나 소비처 수정으로 번지면 멈추고 보고**(A3) — 반환 모양을 유지하는 이유가 바로 이것이다
- [ ] T199 [US4] `useMe` 단위 테스트 in src/features/auth/hooks/__tests__/useMe.test.ts — 토큰 있음 → `MeDto` 반환 / 토큰 없음 → `isError` / 손상 토큰 → `isError` / **알 수 없는 `role`** → `isError`(권한 없음) / **네트워크 호출이 발생하지 않음**(MSW unhandled 감시 또는 adapter 미호출로 고정)

---

## Phase 3: US1 — 현장 로그인

> **독립 테스트 기준**: `/login`에서 사번 6자리·비번 8자리를 넣고 제출하면 `POST /api/v1/Login/W/Login`이 호출되고, `code: 201` 응답에서 토큰 2개가 저장된 뒤 `/zones`로 이동한다. 형식 위반은 제출 자체가 막힌다.

- [ ] T200 [US1] 로그인 폼 컴포넌트 in src/features/auth/components/LoginForm.tsx — **현장·본사 공용**(spec §3 규칙 8). `react-hook-form` + `zodResolver`(T192) + `AppInput`·`AppButton`. 제목·안내 문구는 prop으로 받아 사이트별 차이를 흡수한다. 제출 중 버튼 비활성(엣지 케이스 "연타")
- [ ] T201 [US1] 로그인 API 호출 in src/features/auth/api/login.ts — `POST /api/v1/Login/W/Login`, body `{ loginId, loginPw }`. 🔴 **`_raw: true`로 래퍼째 받는다**(019 탈출구의 첫 소비처 — 래퍼를 벗기면 `code`가 사라진다). 반환은 `{ code, accessToken, refreshToken }`
- [ ] T202 [US1] `code` 분기 + 토큰 저장 in src/features/auth/lib/loginResult.ts — `1xx`→본사 / `2xx`→현장(`api-spec.md` §2-1). **`code`를 저장하지 않는다**(1회성 라우팅 힌트). `202`는 T206이 담당하므로 여기서는 분기 지점만 둔다. 랜딩 경로는 기존 `homePath()` 재사용(spec §3 규칙 10)
- [ ] T203 [US1] `LoginPage` 교체 in src/pages/auth/LoginPage.tsx — placeholder 통째로 교체. `devSignInAsField`·`DEV_ROLE_KEY` 사용 제거. 실패 시 `ApiError.message`를 **폼 인라인**에 표시(toast 아님 — spec §3 규칙 9)
- [ ] T204 [US1] 화면 테스트 in src/pages/auth/__tests__/LoginPage.test.tsx — 형식 위반 → 제출 차단(API 미호출) / 성공(`code: 201`) → 토큰 2개 저장 + `/zones` 이동 / 실패(400 + 래퍼) → 폼 인라인에 서버 문구 / 네트워크 실패 → 019 정규화 문구 / 제출 중 버튼 비활성

---

## Phase 4: US2 — 본사 로그인

> **독립 테스트 기준**: `/admin/login`에서 같은 폼으로 로그인해 `code: 101` 응답이면 `/admin/locations`로 이동한다.

- [ ] T205 [US2] `AdminLoginPage` 교체 in src/pages/auth/AdminLoginPage.tsx — T200 폼 재사용. 임시 버튼 3종·`DEV_ROLE_KEY` 제거. ⚠️ 파일 주석의 "Phase 5에서 구현" 선언을 **본 spec으로 정정**(OQ-E)
- [ ] T206 [US2] 화면 테스트 in src/pages/auth/__tests__/AdminLoginPage.test.tsx — `code: 101`/`102`/`103` 전부 `/admin/locations` 이동(`it.each`) / 실패 문구 인라인 표시

---

## Phase 5: US3 — 근무자(`code: 202`) 차단

> **독립 테스트 기준**: `code: 202` 응답에서 **`localStorage`에 토큰이 하나도 저장되지 않고**, 화면 이동도 없고, 안내 문구가 보인다.

- [ ] T207 [US3] `202` 차단 처리 in src/features/auth/lib/loginResult.ts, src/features/auth/components/LoginForm.tsx — 🔴 **토큰 저장 자체를 하지 않는다.** 저장 후 차단이 아니다(spec §3 규칙 4 — 저장하면 새로고침 시 토큰이 살아 있어 가드를 통과할 여지가 생긴다). 안내 문구는 "WEB 접근 불가, APP 사용" 취지
- [ ] T208 [US3] 차단 테스트 in src/pages/auth/__tests__/LoginPage.test.tsx — `code: 202` → **`getAccessToken()`·`getRefreshToken()`이 둘 다 `null`** / 화면 이동 없음 / 안내 문구 노출. 🔴 "토큰이 저장되지 않음"을 **직접 단정**한다 — 이것이 US3의 전부다

---

## Phase 6: Polish

- [ ] T209 MSW 인증 핸들러 정리 in src/mocks/handlers/auth.ts — `/api/auth/me` 핸들러 **제거**(019에서 제거 예정 주석을 달아둔 그것) + `buildMockMe`·`readDevRole`·`VALID_ROLES` 제거. 실 로그인 mock이 필요하면 `Login/W/Login` 핸들러를 **실경로·실 code로** 신설. **019 DoD #9 미달분 해소 지점**
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

- T191, T192, T193은 서로 다른 파일 → `[P]`
- **T191 → T194**(디코딩이 클레임 타입을 쓴다), **T193 → T197**(`MeDto` 모양이 확정돼야 전환)
- **T194 → T195 → T196 → T197 → T198 → T199** 순차. 🔴 **T197과 T198은 끊지 않는다** — T197만 하고 멈추면 테스트 4파일이 red다
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
