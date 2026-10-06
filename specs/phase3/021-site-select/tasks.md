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

- [ ] T218 [P] 응답·옵션 타입 in src/features/auth/types/site.ts — `UserSiteSelectData`를 **실측 그대로 전량 선언**(`siteSeq`·`siteName`·`children[{ childSiteSeq, childSiteName, parentSeq }]`). 안 쓰는 `parentSeq`도 둔다(`CLAUDE.md` B4). 공용 `SiteOption { siteSeq, siteName }`도 여기. 🔴 **`children`은 재귀가 아니다** — 1단 평면이다(Admin쪽 `SiteNode`와 혼동 금지)
- [ ] T219 [P] `siteSeq`·`siteName` 저장소 in src/lib/auth/site.ts — `getSiteSeq`/`getSiteName`/`setSite`/`clearSite`. 키는 `auth.siteSeq`·`auth.siteName`(기존 `auth.accessToken` 네이밍과 정렬). `localStorage` 접근 자체가 막힌 환경 방어 + **숫자 파싱 실패는 `null`**, 자동 클리어 없음(`tokens.ts` 비파괴 방침 승계). 🔴 **`tokens.ts`에서 import하지 않는다**(위 제약 2 — 순환)
- [ ] T220 [P] 어댑터 in src/features/auth/lib/siteOptions.ts — `UserSiteSelectData` → `SiteOption[]`. **`children`만 매핑하고 루트 `siteSeq`는 버린다**(spec §3 규칙 7). `children`이 배열이 아니면 `[]` 반환 — throw하지 않는다(019 방어 패턴). 필드명 변환(`childSiteSeq`→`siteSeq`)은 서버 내부 불일치 흡수이고, 우리 옛 이름으로 되돌리는 것이 아니다(B4)

## Phase 2: Foundational (모든 US 선행 blocking)

> **독립 테스트 기준**: `npm run test` green. 0/1/N 3분기가 **화면 없이** 순수함수 테스트로 고정된다.

- [ ] T221 `UserSiteSelect` 호출 in src/features/auth/api/userSiteSelect.ts — `GET /api/v1/Login/W/sign/UserSiteSelect`, 파라미터 없음. 🔴 **`_raw`를 쓰지 않는다** — `code`가 필요 없다. 019의 탈출구는 로그인·재발급 **2곳 전용**이고 번지면 A6 위반이라고 `login.ts`에 명시해 뒀다
- [ ] T222 0/1/N 분기 순수함수 in src/features/auth/lib/siteSelectOutcome.ts — `SiteOption[]` → `{ kind: 'auto', site }` | `{ kind: 'choose', options }` | `{ kind: 'none', message }`. 020 `loginResult.ts`와 같은 패턴 — 화면 테스트보다 싸게 분기 전체를 고정한다
- [ ] T223 [P] vitest — 어댑터 + 분기 in src/features/auth/lib/\_\_tests\_\_/siteOptions.test.ts · siteSelectOutcome.test.ts — 루트 제외 / 0·1·2개 / `children` 비배열 / `children` 누락

## Phase 3: US1 + US2 — 선택 단계 전환 · 1개 자동 진입

> **독립 테스트 기준**: MSW로 `children` 2개 → 로그인 카드가 목록 단계로 전환되고 선택 시 `/zones`. 1개 → 목록 없이 즉시 `/zones`. **양쪽 모두** `localStorage`에 `siteSeq`·`siteName`이 남는다.

- [ ] T224 [P] [US1] 선택 목록 컴포넌트 in src/features/auth/components/SiteSelectStep.tsx — props `{ options, onSelect, disabled }`. 🔴 **`LoginForm` 안에 인라인하지 않는다** — OQ-021-C(사업장 전환 UI)의 재사용 지점이다(spec §4 엣지 케이스). 목업이 없으므로 `design-system.md` 토큰 + `AppButton`으로 구성
- [ ] T225 [US1] [US2] 단계 전환 + 저장·이동 in src/features/auth/components/LoginForm.tsx — 토큰 저장(기존 `setAccessToken`/`setRefreshToken`) **뒤에** `userSiteSelect()` 호출 → `siteSelectOutcome` 분기. 🔴 `auto`와 `choose`가 **같은 저장→이동 경로**를 타게 한다(spec §3 규칙 10 — 자동 진입에서만 저장을 빼먹는 실수를 구조로 막는다). 근무자(`202`) 차단은 호출 **전**(규칙 11, 020 순서 유지). 선택 버튼 `disabled`로 연타 차단
- [ ] T226 [US1] [US2] vitest in src/pages/auth/\_\_tests\_\_/LoginPage.test.tsx — 2개 → 목록 렌더 + 선택 후 `/zones` + 저장값 확인 / 1개 → 목록 미렌더 + 즉시 이동 + 저장값 확인

## Phase 4: US3 — 0개 · 호출 실패 (토큰 미잔존)

> **독립 테스트 기준**: `children` 0개 · 네트워크 실패 · 403 **각각**에서 ① 안내 문구 노출 ② `getAccessToken() === null` ③ 이동 없음.

- [ ] T227 [US3] 0개·실패 처리 in src/features/auth/components/LoginForm.tsx — `none`/throw 모두 **`clearTokens()` 후 로그인 단계 복귀** + 인라인 메시지. 🔴 **중간 상태("토큰 있음 + `siteSeq` 없음")를 남기지 않는 것이 이 태스크의 핵심**이다. 에러 문구는 019 `ApiError` 메시지를 그대로 쓰고 형태를 다시 분기하지 않는다
- [ ] T228 [US3] vitest in src/pages/auth/\_\_tests\_\_/LoginPage.test.tsx — 0개 / 500 / 403 3종. 403은 "현장 `code`인데 서버가 본사로 판정" 경우이고 추측으로 통과시키지 않음을 고정(A1)

## Phase 5: 🔴 가드 · `locationName` · 스텁 제거 (묶음 — 쪼개면 red)

> **독립 테스트 기준**: `npm run test` **전체** green + `npm run verify` 0 errors. 위 제약 3 참조 — 이 Phase 안에서 깨지는 테스트를 모두 복구한 상태로 끝낸다.

- [ ] T229 `clearTokens()`가 `clearSite()`도 호출 in src/lib/auth/tokens.ts — DoD #9. 🔴 **단방향**(`tokens.ts` → `site.ts`)을 유지한다. 테스트 8파일의 cleanup이 이 함수를 쓰므로 누설·flaky 방지가 본 태스크의 실제 목적이다(제약 1)
- [ ] T230 `AuthGuard` `siteSeq` 체크 in src/router/guards/AuthGuard.tsx — 토큰 체크 **뒤**에 1건 추가, 없으면 로그인으로 `Navigate`(기존 `?redirect=` 보존 방식 그대로). 🔴 **`isAdminArea(location.pathname)`로 본사 영역 제외**(spec §3 규칙 6) — 빼먹으면 본사 로그인이 즉시 막힌다. DoD #7·#8
- [ ] T231 `useMe`가 `locationName` 채움 in src/features/auth/hooks/useMe.ts — `getSiteName()` **동기** 읽기. 반환 모양 `{ data, isLoading, isError }` 유지(020 A3 방침 승계). `resolveMe`가 순수함수인 구조를 깨지 않도록 인자로 받는다. 🔴 `groupName`은 **계속 `undefined`** — 현장관리자는 그룹에 소속되지 않는다(`api-spec.md` §2-2)
- [ ] T232 `AuthGuard` 테스트 보강 in src/router/guards/\_\_tests\_\_/AuthGuard.test.tsx — 토큰O+`siteSeq`없음 → 로그인 / 토큰O+`siteSeq`있음 → 통과 / **본사 경로는 `siteSeq` 없이도 통과**
- [ ] T233 🔴 `vi.mock` 스텁 제거 in src/features/deployments/components/\_\_tests\_\_/DeploymentHistoryTabs.test.tsx — `setSite()`로 실제 값을 주입하는 방식으로 교체. **020 이월 블록의 "스텁을 남긴 채 021을 끝내면 동작한다고 착각하게 된다"가 이 태스크다.** DoD #11
- [ ] T234 [P] `useMe` 테스트 갱신 in src/features/auth/hooks/\_\_tests\_\_/useMe.test.ts — `:38`의 *"`locationName`·`groupName`은 undefined다 (021에서 채움)"* 가 이제 **절반만 맞다**. `locationName`은 저장값을 반환하고 `groupName`은 여전히 `undefined`임을 두 테스트로 분리

## Phase 6: Polish

- [ ] T235 [P] MSW 핸들러 in src/mocks/handlers/auth.ts — `UserSiteSelect` **3종**(0개·1개·2개 이상). 020이 세운 **사번으로 권한을 고르는** 체계를 그대로 확장한다(`333333` 현장관리자 → 2개). 0개 케이스용 사번을 1개 추가하고 주석에 용도를 남긴다. DoD #14
- [ ] T236 [P] 🔴 캡쳐 파이프라인 `siteSeq` 주입 in e2e/capture.pw.ts — 현재 seed는 `auth.accessToken`·`auth.refreshToken` **2개뿐**(`:49·50` 실측)이다. T230이 들어가면 **baseline 12장이 전부 로그인 화면으로 리다이렉트된다** — 020에서 토큰 주입이 깨져 똑같은 일이 났다. ⚠️ `npm run capture`는 `verify`/`test`에 포함되지 않아 **자동 검증망 밖**이므로 이 태스크를 빼먹으면 다음 캡쳐까지 드러나지 않는다
- [ ] T237 브라우저 확인 (MSW 모드) — 0/1/N 3분기 + 가드 리다이렉트 + 본사 미차단. 🔴 `npm run capture`를 그대로 돌리면 **baseline을 덮어써** 비교 기준이 사라진다 — scratchpad에 별도 스크립트를 두고 포트 5175 `--mode capture`로 수행(020 방식 승계). DoD #16
- [ ] T238 [P] 문서 4종 — `api-spec.md`(OQ-1A ② **해소** 기록 + OQ-021-B 본사 평면 배열 메모를 "사용자 전달·미실측"으로) / `flow.md` §0(선택 단계 반영 + `Open(021)` 해소) / `data-model.md` §4-3(`locationName` 출처 = 선택 저장값) / `roadmap.md` §7-1·§12. DoD #17
- [ ] T239 DoD 17개 대조표 작성 + 미충족 항목 사유 명시 in specs/phase3/021-site-select/tasks.md

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
