# 021-site-select tasks

> 입력: [`spec.md`](./spec.md) (위험도 **A** — 잘게 분할, 검증 지점 다수)
> 응답·규칙 근거: [`docs/api-spec.md`](../../../docs/api-spec.md) §2-2 · §5-2
> 선행: `spec 019`(`ApiError` 정규화) · `spec 020`(로그인·`code` 분기·JWT)
> 태스크 ID는 020(T191~T217)에 이어 **T218**부터

---

## ⚠️ 분할 순서를 좌우한 제약 (착수 전 확인)

**세 가지가 분할 순서를 강제했다.**

1. 🔴 **`clearTokens()`가 `siteSeq`를 지워야 한다**(T229). 테스트 **8파일**이 cleanup으로 `clearTokens()`를 호출하고 있다(실측: `ProfileBadge`·`RequireRoute`·`useMe`·`AdminLoginPage`·`LoginPage`·`AuthGuard` 테스트). 이걸 빼면 `siteSeq`가 테스트 간에 누설돼 **순서 의존 flaky**가 된다.
2. 🔴 **`lib/auth/site.ts`는 `tokens.ts`의 헬퍼를 import하지 않는다**(T219). `clearTokens()`가 `clearSite()`를 부르므로(T229) import하면 **순환 참조**가 된다. `readString`/`writeString`의 try/catch 복제(약 12줄)를 수용한다 — A6("3줄의 명료한 중복이 잘못된 추상화보다 낫다")의 연장이고, 대안인 `storage.ts` 추출은 `tokens.ts` 리팩토링이라 A3 위반이다.
3. 🔴 **가드·`locationName`·스텁 제거는 한 Phase에 묶는다**(Phase 5). `locationName`이 채워지는 순간 `DeploymentHistoryTabs.test.tsx`의 `vi.mock` 스텁이 실제 값을 가리고, `useMe.test.ts:38`의 *"`locationName`·`groupName`은 undefined다"* 테스트가 **즉시 깨진다**. 쪼개면 Phase 종료 시점이 red다 — 020 Phase 2에서 `MeRaw` fixture 4파일로 똑같은 함정을 겪었다.

---

## Phase 1: Setup — 타입·저장소·어댑터

> **독립 테스트 기준**: `npm run typecheck` 통과. `UserSiteSelectData`가 `api-spec.md` §5-2 실측 필드와 일치한다.
>
> 🔴 **Phase 1은 신설 파일만 다룬다.** `tokens.ts` 수정(T229)은 Phase 5로 미뤘다 — 여기서 건드리면 8개 테스트 파일의 cleanup 동작이 먼저 바뀌어 이 기준을 깨뜨린다.

- [x] T218 [P] 응답·옵션 타입 in src/features/auth/types/site.ts — `UserSiteSelectData`를 **실측 그대로 전량 선언**(`siteSeq`·`siteName`·`children[{ childSiteSeq, childSiteName, parentSeq }]`). 안 쓰는 `parentSeq`도 둔다(`CLAUDE.md` B4). 공용 `SiteOption { siteSeq, siteName }`도 여기. 🔴 **`children`은 재귀가 아니다** — 1단 평면이다(Admin쪽 `SiteNode`와 혼동 금지)
- [x] T219 [P] `siteSeq`·`siteName` 저장소 in src/lib/auth/site.ts — `getSiteSeq`/`getSiteName`/`setSite`/`clearSite`. 키는 `auth.siteSeq`·`auth.siteName`(기존 `auth.accessToken` 네이밍과 정렬). `localStorage` 접근 자체가 막힌 환경 방어 + **숫자 파싱 실패는 `null`**, 자동 클리어 없음(`tokens.ts` 비파괴 방침 승계). 🔴 **`tokens.ts`에서 import하지 않는다**(위 제약 2 — 순환)
- [x] T220 [P] 어댑터 in src/features/auth/lib/siteOptions.ts — `UserSiteSelectData` → `SiteOption[]`. **`children`만 매핑하고 루트 `siteSeq`는 버린다**(spec §3 규칙 7). `children`이 배열이 아니면 `[]` 반환 — throw하지 않는다(019 방어 패턴). 필드명 변환(`childSiteSeq`→`siteSeq`)은 서버 내부 불일치 흡수이고, 우리 옛 이름으로 되돌리는 것이 아니다(B4)

## Phase 2: Foundational (모든 US 선행 blocking)

> **독립 테스트 기준**: `npm run test` green. 0/1/N 3분기가 **화면 없이** 순수함수 테스트로 고정된다.

- [x] T221 `UserSiteSelect` 호출 in src/features/auth/api/userSiteSelect.ts — `GET /api/v1/Login/W/sign/UserSiteSelect`, 파라미터 없음. 🔴 **`_raw`를 쓰지 않는다** — `code`가 필요 없다. 019의 탈출구는 로그인·재발급 **2곳 전용**이고 번지면 A6 위반이라고 `login.ts`에 명시해 뒀다
- [x] T222 0/1/N 분기 순수함수 in src/features/auth/lib/siteSelectOutcome.ts — `SiteOption[]` → `{ kind: 'auto', site }` | `{ kind: 'choose', options }` | `{ kind: 'none', message }`. 020 `loginResult.ts`와 같은 패턴 — 화면 테스트보다 싸게 분기 전체를 고정한다
- [x] T223 [P] vitest — 어댑터 + 분기 in src/features/auth/lib/\_\_tests\_\_/siteOptions.test.ts · siteSelectOutcome.test.ts — 루트 제외 / 0·1·2개 / `children` 비배열 / `children` 누락

## Phase 3: US1 + US2 — 선택 단계 전환 · 1개 자동 진입

> **독립 테스트 기준**: MSW로 `children` 2개 → 로그인 카드가 목록 단계로 전환되고 선택 시 `/zones`. 1개 → 목록 없이 즉시 `/zones`. **양쪽 모두** `localStorage`에 `siteSeq`·`siteName`이 남는다.

- [x] T224 [P] [US1] 선택 목록 컴포넌트 in src/features/auth/components/SiteSelectStep.tsx — props `{ options, onSelect, disabled }`. 🔴 **`LoginForm` 안에 인라인하지 않는다** — OQ-021-C(사업장 전환 UI)의 재사용 지점이다(spec §4 엣지 케이스). 목업이 없으므로 `design-system.md` 토큰 + `AppButton`으로 구성
- [x] T225 [US1] [US2] 단계 전환 + 저장·이동 in src/features/auth/components/LoginForm.tsx — 토큰 저장(기존 `setAccessToken`/`setRefreshToken`) **뒤에** `userSiteSelect()` 호출 → `siteSelectOutcome` 분기. 🔴 `auto`와 `choose`가 **같은 저장→이동 경로**를 타게 한다(spec §3 규칙 10 — 자동 진입에서만 저장을 빼먹는 실수를 구조로 막는다). 근무자(`202`) 차단은 호출 **전**(규칙 11, 020 순서 유지). 선택 버튼 `disabled`로 연타 차단
- [x] T226 [US1] [US2] vitest in src/pages/auth/\_\_tests\_\_/LoginPage.test.tsx — 2개 → 목록 렌더 + 선택 후 `/zones` + 저장값 확인 / 1개 → 목록 미렌더 + 즉시 이동 + 저장값 확인

## Phase 4: US3 — 0개 · 호출 실패 (토큰 미잔존)

> **독립 테스트 기준**: `children` 0개 · 네트워크 실패 · 403 **각각**에서 ① 안내 문구 노출 ② `getAccessToken() === null` ③ 이동 없음.

- [x] T227 [US3] 0개·실패 처리 in src/features/auth/components/LoginForm.tsx — `none`/throw 모두 **`clearTokens()` 후 로그인 단계 복귀** + 인라인 메시지. 🔴 **중간 상태("토큰 있음 + `siteSeq` 없음")를 남기지 않는 것이 이 태스크의 핵심**이다. 에러 문구는 019 `ApiError` 메시지를 그대로 쓰고 형태를 다시 분기하지 않는다
- [x] T228 [US3] vitest in src/pages/auth/\_\_tests\_\_/LoginPage.test.tsx — 0개 / 500 / 403 3종. 403은 "현장 `code`인데 서버가 본사로 판정" 경우이고 추측으로 통과시키지 않음을 고정(A1)

## Phase 5: 🔴 가드 · `locationName` · 스텁 제거 (묶음 — 쪼개면 red)

> **독립 테스트 기준**: `npm run test` **전체** green + `npm run verify` 0 errors. 위 제약 3 참조 — 이 Phase 안에서 깨지는 테스트를 모두 복구한 상태로 끝낸다.

- [x] T229 `clearTokens()`가 `clearSite()`도 호출 in src/lib/auth/tokens.ts — DoD #9. 🔴 **단방향**(`tokens.ts` → `site.ts`)을 유지한다. 테스트 8파일의 cleanup이 이 함수를 쓰므로 누설·flaky 방지가 본 태스크의 실제 목적이다(제약 1)
- [x] T230 `AuthGuard` `siteSeq` 체크 in src/router/guards/AuthGuard.tsx — 토큰 체크 **뒤**에 1건 추가, 없으면 로그인으로 `Navigate`(기존 `?redirect=` 보존 방식 그대로). 🔴 **`isAdminArea(location.pathname)`로 본사 영역 제외**(spec §3 규칙 6) — 빼먹으면 본사 로그인이 즉시 막힌다. DoD #7·#8
- [x] T231 `useMe`가 `locationName` 채움 in src/features/auth/hooks/useMe.ts — `getSiteName()` **동기** 읽기. 반환 모양 `{ data, isLoading, isError }` 유지(020 A3 방침 승계). `resolveMe`가 순수함수인 구조를 깨지 않도록 인자로 받는다. 🔴 `groupName`은 **계속 `undefined`** — 현장관리자는 그룹에 소속되지 않는다(`api-spec.md` §2-2)
- [x] T232 `AuthGuard` 테스트 보강 in src/router/guards/\_\_tests\_\_/AuthGuard.test.tsx — 토큰O+`siteSeq`없음 → 로그인 / 토큰O+`siteSeq`있음 → 통과 / **본사 경로는 `siteSeq` 없이도 통과**
- [x] T233 🔴 `vi.mock` 스텁 제거 in src/features/deployments/components/\_\_tests\_\_/DeploymentHistoryTabs.test.tsx — `setSite()`로 실제 값을 주입하는 방식으로 교체. **020 이월 블록의 "스텁을 남긴 채 021을 끝내면 동작한다고 착각하게 된다"가 이 태스크다.** DoD #11
- [x] T234 [P] `useMe` 테스트 갱신 in src/features/auth/hooks/\_\_tests\_\_/useMe.test.ts — `:38`의 *"`locationName`·`groupName`은 undefined다 (021에서 채움)"* 가 이제 **절반만 맞다**. `locationName`은 저장값을 반환하고 `groupName`은 여전히 `undefined`임을 두 테스트로 분리

## Phase 6: Polish

- [x] T235 [P] MSW 핸들러 in src/mocks/handlers/auth.ts — `UserSiteSelect` **3종**(0개·1개·2개 이상). 020이 세운 **사번으로 권한을 고르는** 체계를 그대로 확장한다(`333333` 현장관리자 → 2개). 0개 케이스용 사번을 1개 추가하고 주석에 용도를 남긴다. DoD #14
- [x] T236 [P] 🔴 캡쳐 파이프라인 `siteSeq` 주입 in e2e/capture.pw.ts — 현재 seed는 `auth.accessToken`·`auth.refreshToken` **2개뿐**(`:49·50` 실측)이다. T230이 들어가면 **baseline 12장이 전부 로그인 화면으로 리다이렉트된다** — 020에서 토큰 주입이 깨져 똑같은 일이 났다. ⚠️ `npm run capture`는 `verify`/`test`에 포함되지 않아 **자동 검증망 밖**이므로 이 태스크를 빼먹으면 다음 캡쳐까지 드러나지 않는다
- [x] T237 브라우저 확인 (MSW 모드) — 0/1/N 3분기 + 가드 리다이렉트 + 본사 미차단. 🔴 `npm run capture`를 그대로 돌리면 **baseline을 덮어써** 비교 기준이 사라진다 — scratchpad에 별도 스크립트를 두고 포트 5175 `--mode capture`로 수행(020 방식 승계). DoD #16
- [x] T238 [P] 문서 4종 — `api-spec.md`(OQ-1A ② **해소** 기록 + OQ-021-B 본사 평면 배열 메모를 "사용자 전달·미실측"으로) / `flow.md` §0(선택 단계 반영 + `Open(021)` 해소) / `data-model.md` §4-3(`locationName` 출처 = 선택 저장값) / `roadmap.md` §7-1·§12. DoD #17
- [x] T239 DoD 17개 대조표 작성 + 미충족 항목 사유 명시 in specs/phase3/021-site-select/tasks.md

---

## Dependencies & Execution Order

- **T218 → 그 외 전부.** 타입이 없으면 어댑터·API·분기가 모두 컴파일되지 않는다
- **T219 → T225·T227·T229·T231·T233.** 저장소가 저장·삭제·읽기의 공통 기반
- **T220 → T222 → T225.** 어댑터 → 분기 → 폼 조립 순서는 뒤집을 수 없다
- **T221 → T225**
- **T224 → T225** (컴포넌트가 있어야 폼이 붙인다)
- **T225 → T226·T227.** T227은 T225의 성공 경로가 선 뒤에 실패 경로를 덧붙인다
- **T229 → T232·T233.** `clearTokens()`가 `siteSeq`를 안 지우면 두 테스트가 순서 의존으로 흔들린다
- **T230 → T232·T236.** 가드가 생긴 **직후** 캡쳐 seed를 고쳐야 한다(T236을 뒤로 미루면 깨진 줄 모른다)
- **T231 → T233·T234**
- **T235 → T226·T228·T237.** MSW 3종이 없으면 Phase 3·4의 테스트 기준을 세울 수 없다 → 🔴 **T235는 Polish에 있지만 실제로는 Phase 3 착수 전에 당겨야 한다.** Phase 6에 둔 것은 "핸들러 정리·주석"까지 포함한 마감 작업 기준이고, 최소 fixture는 T226 착수 시 함께 만든다
- **Phase 5 내부는 순차**(T229 → T230 → T231 → T232·T233·T234). 제약 3 때문에 중간에서 멈추면 red다
- **T238·T239는 마지막.** 코드가 확정된 뒤 문서를 맞춘다
- `[P]` 끼리는 병렬 가능: (T218·T219·T220) / (T223) / (T234) / (T235·T236·T238)

---

## 진행 기록

> WF-3 구현 중 발견·결정 사항을 Phase 단위로 누적한다.

### Phase 1 완료 — 타입·저장소·어댑터 (2026-10-06)

- T218~T220 완료. **신설 3파일만, 기존 파일 0건 수정.** 신규 패키지 없음
- `npm run verify` **0 errors**(경고 1건은 기존 MSW 생성물 `public/mockServiceWorker.js`) + `npm run test` **40 files / 294 tests green** — 신설만이라 테스트 수 변동 없음(계획대로)
- `getSiteSeq`의 반환 타입을 `number | null`로 뒀다 — `getAccessToken(): string | null`과 같은 모양이라 가드·쿼리에서 `null` 체크로 일관되게 다룰 수 있다
- 🔴 **`Number('')`이 `0`이 되는 함정**을 `readString`의 빈 문자열 → `null` 처리에 의존해 막았다. `localStorage`에 빈 문자열이 들어가면 `siteSeq: 0`으로 읽혀 **존재하지 않는 사업장으로 조회**가 나간다(`200` + 빈 목록으로 돌아와 눈치채기 어렵다). `Number.isInteger` 검사만으로는 `0`을 통과시킨다
  - ⚠️ 다만 `siteSeq: 0`이 서버에서 유효한 값인지는 미확인이다. 실측 `siteSeq`는 6·7·8이고 1-based로 보이지만 확정은 아니다 — 0을 별도로 거부하지는 않았다(명세에 없는 제한을 넣지 않음, A1)
- `toSiteOptions`의 인자를 `UserSiteSelectData | null | undefined`로 받았다. 호출부에서 null 체크를 중복하지 않게 하려는 것이고, 0개·비정상 응답을 **한 자리에서** `[]`로 수렴시킨다(spec §4)
- 다음: Phase 2(T221~T223) — API 호출 + 0/1/N 순수함수 + 단위 테스트

### Phase 2 완료 — API + 0/1/N 분기 (2026-10-06)

- T221~T223 완료. 신설 4파일(테스트 2개 포함), 기존 파일 0건 수정
- `npm run verify` **0 errors** + `npm run test` **42 files / 307 tests green**(294 → **+13**)
- `fetchUserSiteSelect`는 `_raw`를 쓰지 않는다 — `code`가 필요 없고, 인터셉터가 래퍼를 벗겨 `data`만 준다(`axios.ts:145`). `_raw`의 확정 수요는 로그인·재발급 2곳뿐이라는 019 경계를 지켰다
- 🔴 **`auto`(1개)가 사업장 값을 담아 돌려주게 설계했다.** "자동 진입"을 "저장 없이 이동"으로 구현하면 `siteSeq` 없이 홈에 들어가고, 그 조회는 403이 아니라 `200` + 빈 목록으로 돌아와 **조용히 틀린 화면**이 된다. 타입 차원에서 호출부가 저장할 값을 받게 만들어 규칙 10을 구조로 보장한다 — 테스트로도 고정(`siteSelectOutcome.test.ts`)
- `NO_SITE_MESSAGE`를 상수로 분리했다. 0개 응답 형태가 미실측(OQ-021-A)이라 빈 배열·에러 어느 쪽이든 호출부가 **같은 문구 하나로** 수렴시켜야 한다
- `toSiteOptions`의 비정상 입력 4종(`null`/`undefined`/`children` 누락/`children` 비배열)을 테스트로 고정. 019 방어 패턴대로 throw하지 않는다
- ⚠️ **계획 외 관찰 1건(미조치)** — `tsconfig.json`의 `"strict": true`가 `src`에 적용되지 않는다. `files: []` + `references` 구조인데 `tsconfig.app.json`이 `extends`를 쓰지 않아 루트 `compilerOptions`를 상속하지 않는다. 021 범위 밖이라 **건드리지 않았다**(A3). 별도 판단 필요
- 다음: Phase 3(T224~T226) — 선택 목록 컴포넌트 + `LoginForm` 단계 전환. 🔴 MSW fixture(T235 일부)를 T226 착수 시 함께 만든다(의존성 섹션 참조)

### Phase 3 완료 — 단계 전환 · 자동 진입 (2026-10-07)

- T224~T226 완료. 신설 1파일 + 기존 3파일 수정(`LoginForm.tsx`·`mocks/handlers/auth.ts`·`LoginPage.test.tsx`)
- `npm run verify` **0 errors** + `npm run test` **42 files / 312 tests green**(307 → **+5**)
- 🔴 **착수 전 발견: 기존 테스트 4건이 T225 순간 깨지는 구조였다.** `LoginForm`이 `UserSiteSelect`를 호출하게 되면 핸들러가 없는 기존 테스트에서 요청이 실제로 나가고(`src/test/setup.ts:13` `onUnhandledRequest: 'warn'`) 에러 경로로 떨어져 `SERVICE_HOME`에 도달하지 못한다. 해당: `LoginPage.test.tsx:47·70·124`, `AdminLoginPage.test.tsx:63`
  - 그래서 **T235의 최소 fixture를 Phase 3으로 당겼다**(의존성 섹션에 예고한 대로)
  - 🔴 **MSW `UserSiteSelect` 폴백을 "1개"로 뒀다.** 그 4건은 `server.use(loginOk(201))`로 로그인 응답만 덮고 accessToken에 JWT가 아닌 `'new-access'`를 써서 사번을 디코딩할 수 없다. 폴백이 2개 이상이면 4건이 전부 선택 단계에서 멈춰, *"code가 착지점을 정한다"*는 020의 테스트 의도가 사업장 선택 테스트로 변질된다. 1개면 `auto` → 즉시 이동이라 **의도가 그대로 보존**된다 — 실제로 4건 모두 무수정 통과
- **로그인 핸들러가 `loginId` 클레임을 실제 사번으로 심도록 고쳤다.** `makeAccessToken`의 기본값이 `'333333'` 고정이라, 심지 않으면 모든 dev 계정이 같은 사번으로 디코딩돼 `UserSiteSelect` 분기가 통째로 망가진다
- dev 계정 2종 추가 — `444444`(1개 소속) · `555555`(0개 소속). 권한은 `333333`과 같고 **소속 사업장 수만 다르다**. 020의 "사번으로 고른다" 체계를 그대로 이었다
- 본사/현장 판별은 `isServiceLoginCode(code)` import로 했다. 대안이던 `LoginOutcome.allowed`에 `site` 필드 추가는 `loginResult.test.ts`의 `toEqual` 3곳을 깨뜨려 churn이 더 크다(A3)
- `enterSite(site, landing)` 단일 경로로 `auto`·`choose`를 모았다(규칙 10). `landing`은 `code`가 정한 값을 state에 보관했다가 그대로 쓴다 — 선택 단계에서 재계산하면 code 해석이 두 군데로 갈린다
- ⚠️ **Phase 4로 넘긴 것**: `none`·호출 실패에서 **아직 `clearTokens()`를 하지 않는다**(메시지만 표시). 즉 지금은 "토큰 있음 + `siteSeq` 없음" 중간 상태가 남는다 — T227에서 닫는다. 계획대로지만 이 상태로 Phase를 끝내지 않도록 주의
- 다음: Phase 4(T227~T228) — 0개·실패 처리, 토큰 미잔존

### Phase 4 완료 — 0개 · 실패에서 토큰 미잔존 (2026-10-07)

- T227~T228 완료. 기존 2파일 수정(`LoginForm.tsx`·`LoginPage.test.tsx`), 신설 없음
- `npm run verify` **0 errors** + `npm run test` **42 files / 316 tests green**(312 → **+4**)
- ✅ **Phase 3이 남긴 중간 상태를 닫았다.** `none`과 catch 양쪽에서 `clearTokens()`를 호출한다 — 이제 "토큰 있음 + `siteSeq` 없음" 상태로 로그인 화면을 벗어날 수 없다
- **catch 하나가 두 호출의 실패를 받는다**는 점을 주석에 명시했다 — `login()` 실패(아직 저장 전이라 `clearTokens()`가 no-op)와 `fetchUserSiteSelect()` 실패(저장 후라 실제로 지운다). 호출별로 try를 쪼개지 않은 이유이고, 쪼개면 019가 `ApiError`로 통일해 둔 처리가 두 벌이 된다
- 실패 4종을 **같은 단언 묶음**(`expectStuckAtLogin`)으로 고정했다 — 안내 노출 + accessToken·refreshToken·siteSeq 전부 `null` + 홈·선택 단계 미진입. 403을 별도 케이스로 둔 것은 "현장 `code`인데 서버는 본사로 판정"(상호 배타, `api-spec.md:286·287`)을 추측으로 통과시키지 않음을 고정하기 위함이다(A1)
- 다음: Phase 5(T229~T234) — 🔴 가드·`locationName`·스텁 제거 **묶음**. 쪼개면 Phase 종료가 red다(상단 제약 3)

### Phase 5 완료 — 가드 · locationName · 스텁 제거 (2026-10-07)

- T229~T234 완료. 기존 7파일 수정, 신설 0건
- `npm run verify` **0 errors** + `npm run test` **42 files / 320 tests green**(316 → **+4**)
- ✅ **020 이월 2건 해소** — `locationName`이 실제 값을 반환하고(DoD #10), `DeploymentHistoryTabs.test.tsx`의 `vi.mock` 스텁이 사라졌다(DoD #11). 스텁 자리에는 **토큰 + 선택 결과를 심어** 실제 경로로 검증한다
- 깨질 것으로 센 3건이 **정확히 3건 깨졌고** 모두 복구했다(`AuthGuard.test.tsx:52` / `useMe.test.ts:38` / `DeploymentHistoryTabs` 스텁). 사전 계수가 맞았다
- 🔴 **계획 외 발견 1건 — `AuthGuard.test.tsx`의 라우트 픽스처가 깨져 있었다.** 부모가 `/admin/*`인데 자식이 `path="admin/locations"`로 선언돼 실제로는 `/admin/admin/locations`를 가리키고 있었다(현장 쪽은 `"zones"`로 정상). **본사 통과 케이스를 검사하는 테스트가 하나도 없어서** 지금까지 드러나지 않았다 — 기존 본사 테스트는 "토큰 없음 → 로그인으로" 하나뿐이라 자식 라우트를 탈 일이 없었다
  - 신규 테스트 "본사 영역은 사업장 미선택이어도 통과한다"가 이걸 즉시 노출했다. 픽스처를 `path="locations"`로 고치고 사유를 주석에 남겼다
  - ⚠️ **픽스처만의 문제다.** 실 라우터(`src/router/index.tsx`)는 `paths.admin.locations`(절대 경로)를 쓰므로 영향 없음을 확인했다
- `useMe`는 `resolveMe(token, siteName)`으로 인자만 늘렸다 — 순수함수 구조와 반환 모양을 유지해 소비처 분기는 그대로다(020 A3 방침 승계). `useMemo` 의존성에 `siteName` 추가
- 가드 분기 순서: **토큰 → siteSeq(현장만) → useMe**. `siteSeq` 체크를 `useMe` 앞에 둔 이유는 디코딩보다 싸고, 중간 상태를 더 이른 지점에서 끊기 때문이다
- 다음: Phase 6(T235~T239) — MSW 마감·🔴 캡쳐 seed·브라우저 확인·문서 4종·DoD 대조표

### Phase 6 완료 — Polish (2026-10-07)

- T235~T239 완료. 테스트 **320건 유지**(42 files) — 문서·seed 작업이라 신규 테스트 없음
- T235(MSW)는 Phase 3에서 이미 완성됐다(핸들러 + `DEV_SITES` 3종 + `loginId` 클레임 주입). 여기서는 추가 작업 없이 확인만 했다
- 🔴 **T236 캡쳐 seed를 고쳤다 — 예고한 함정이 실재했다.** `e2e/capture.pw.ts`의 `AUTH_SEED`에 `auth.siteSeq`·`auth.siteName`을 추가했다. T230 가드가 들어간 뒤 이걸 안 넣으면 **baseline 12장이 전부 로그인 화면**이 된다. `docs/ui-current/README.md`의 인증 블록도 함께 갱신했다
  - ⚠️ `npm run capture`는 `verify`/`test` 밖이라 **020(토큰)·021(사업장) 두 번 연속 같은 함정**을 밟았다. README에 "가드에 조건이 붙을 때마다 seed를 갱신한다"를 명시해 뒀다
- **T237 브라우저 확인은 사용자가 직접 수행**(2026-10-07). 체크리스트 19항목 — 2개 선택/1개 자동진입/0개 차단/가드 중간상태/본사 미차단/로그아웃 잔존 없음/근무자 차단 회귀/배치관리 이월 해소. **전항목 이상 없음**
- 문서 4종 갱신: `api-spec.md`(§2-2 구현 확정 블록 + OQ-1A ② 해소 + **OQ-1B 신설**) / `flow.md` §0(다이어그램에 선택 단계 5노드 추가, `Open(021)` 해소) / `data-model.md` §4-3(`locationName` 출처 블록 신설) / `roadmap.md`(§7-1 ☑, §9에 **본사 선택 이월 행 추가**, §12 행 추가)

---

## DoD 대조표

| # | 완료 조건 | 결과 | 증거 |
|---|---|---|---|
| 1 | 현장 로그인 성공 후 `UserSiteSelect` 호출(토큰 저장 뒤) | ☑ | `LoginForm.tsx:88`(저장) → `:98`(호출) / `api/userSiteSelect.ts:27` |
| 2 | `children` 2개 이상 → 목록 단계 전환 + 선택 시 `/zones` | ☑ | `LoginPage.test.tsx` "2개면 선택 단계로 전환된다"·"선택하면 … 현장 홈으로 간다" / 브라우저 확인 A-1~A-4 |
| 3 | `children` 1개 → 자동 진입, 저장은 **같은 경로** | ☑ | `siteSelectOutcome.ts:36`(`auto`에 site 담음) / `LoginForm.tsx:70` `enterSite` 단일 경로 / 테스트 "선택 화면 없이 자동 진입하고, 저장은 그대로 한다" |
| 4 | `children` 0개 → 안내 + 토큰 삭제 + 로그인 복귀 | ☑ | `LoginForm.tsx:101`(`clearTokens()`) / 테스트 "0개면 안내하고 토큰을 남기지 않는다" |
| 5 | 선택 대상에 루트 `siteSeq` 미포함 | ☑ | `siteOptions.ts:20`(`children`만 매핑) / `siteOptions.test.ts` "루트 siteSeq는 결과에 포함되지 않는다" / `LoginPage.test.tsx` "루트 사업장(siteSeq 6)은 선택지에 나타나지 않는다" |
| 6 | `childSiteSeq`/`childSiteName` → `SiteOption` 정규화 | ☑ | `siteOptions.ts:21` / `siteOptions.test.ts` "childSiteSeq가 siteSeq가 된다" |
| 7 | 🔴 토큰O + `siteSeq`없음 → 로그인 리다이렉트 | ☑ | `AuthGuard.tsx:40` / `AuthGuard.test.tsx` "토큰은 있지만 사업장 미선택 → 로그인으로 Navigate" / 브라우저 D-12·13 |
| 8 | 🔴 본사 영역은 `siteSeq` 체크 제외 | ☑ | `AuthGuard.tsx:40`(`!isAdmin`) / `AuthGuard.test.tsx` "본사 영역은 사업장 미선택이어도 통과한다" / 브라우저 E-15 |
| 9 | `clearTokens()`가 `siteSeq`·`siteName`도 지움 | ☑ | `tokens.ts:48` / 브라우저 F-16·17 |
| 10 | `useMe().data.locationName`이 선택한 `siteName` 반환 | ☑ | `useMe.ts:52` / `useMe.test.ts` "locationName은 선택한 사업장명을 반환한다" |
| 11 | 🔴 `DeploymentHistoryTabs.test.tsx` `vi.mock` 스텁 제거 | ☑ | 해당 파일에 `vi.mock` 없음(`vi` import도 제거) → `beforeEach`의 `setAccessToken`+`setSite`로 교체 / 브라우저 H-19 |
| 12 | `UserSiteSelect` 실패·403에서 토큰 미잔존 | ☑ | `LoginForm.tsx:117`(catch의 `clearTokens()`) / 테스트 4종(0개·500·403·네트워크)이 `expectStuckAtLogin` 공유 |
| 13 | `siteSeq`가 URL에 노출되지 않음 | ☑ | 저장은 `localStorage`뿐 — `site.ts`에 쿼리 조작 코드 없음. `paths.ts`에도 `siteSeq` 세그먼트·쿼리 없음 |
| 14 | MSW가 `UserSiteSelect` 3종 제공 | ☑ | `mocks/handlers/auth.ts` `DEV_SITES`(`333333`=2개 / `444444`=1개 / `555555`=0개) + `FALLBACK_SITES`(1개) |
| 15 | `verify` 0 errors + `test` green | ☑ | verify 0 errors(경고 1건은 기존 MSW 생성물) / **42 files · 320 tests** |
| 16 | 브라우저 확인 — 0/1/N + 가드 | ☑ | **사용자 직접 수행 2026-10-07**, 체크리스트 19항목 전항목 이상 없음 |
| 17 | 문서 동기화 4종 | ☑ | `api-spec.md`·`flow.md`·`data-model.md`·`roadmap.md` (+ 계획 외 `docs/ui-current/README.md`) |

**17/17 충족.** 020의 미충족 2건(#7 `ProfileBadge` 수정·#14 실 서버 확인)과 달리 이번엔 미달 항목이 없다 — 단, **실 서버 검증은 애초에 DoD에 넣지 않았다**(사내망 필요). 아래 이월 블록 참조.

---

## 다음 spec으로 이월

- [ ] 🔴 **실 서버 검증 (020 이월분과 묶음)** → 사내망에서 `npm run dev:real`. 020에서 넘어온 3가지(한글 클레임·실 `role` 문자열·로그인 실패 문구)에 **021 몫 2가지를 더한다**: ① `UserSiteSelect` 실 응답이 `api-spec.md` §5-2 실측 구조와 같은지(특히 `childSiteSeq` 필드명) ② 실 계정 `333333`(`siteSeq=6`)의 `children`이 몇 개인지 — mock은 2개로 가정했다. **여기서 틀어지면 `spec 022` 착수 전에 고쳐야 한다**
- [ ] **OQ-021-A `children` 0개 서버 응답 미실측** → 0개 계정 생성이 필요하다. 프론트는 빈 배열·에러 양쪽을 동일 처리로 수렴시켜 뒀으니(spec §4) 실측 후 문구·분기만 재확인
- [ ] **OQ-021-B `AdminSiteSelect` 평면 배열** → Phase 5 본사 영역. `roadmap.md` §9에 행을 추가했다. 🔴 그때 **`AuthGuard`의 본사 예외(`!isAdmin`)를 걷어내는 것**을 함께 해야 한다 — 남겨두면 본사가 영구히 미선택 통과다
- [ ] **OQ-021-C 사업장 전환 UI** → 현재는 로그아웃→재로그인. `SiteSelectStep`을 분리해 뒀으니 헤더 드롭다운을 붙일 때 재사용된다. 복수 소속 현장관리자의 실사용 빈도 확인 후 결정
- [ ] **OQ-021-D 다음 로그인에서 사업장 기억** → 미결정. 현재는 매 로그인마다 고른다
- [ ] **`npm run capture` baseline 재촬영** → seed를 고쳤으므로(T236) **다음 캡쳐에서 12장이 정상인지 실증된다.** 로그인 화면은 baseline 12장에 없지만 선택 단계가 추가됐으니 포함 여부 재검토
- [ ] ⚠️ **`tsconfig.json`의 `"strict": true`가 `src`에 적용되지 않는다** → 021 범위 밖이라 손대지 않았다(Phase 2에서 발견). `files: []` + `references` 구조인데 `tsconfig.app.json`이 `extends`를 쓰지 않아 루트 `compilerOptions`를 상속하지 않는다. 켜면 기존 코드에서 에러가 다수 날 수 있어 **별도 spec**이 필요하다
- [ ] **OQ-D JWT `role` 문자열 3종 미실측** / **OQ-F `AppInput` label 연결** / **OQ-A `roleDisplay`** / **OQ-C 로그인 상태로 `/login` 접근** → 020에서 승계, 변동 없음
