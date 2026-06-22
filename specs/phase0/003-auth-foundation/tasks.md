# 003-auth-foundation tasks

> 입력: 같은 폴더 `spec.md`
> 위험도: **A** → 검증 지점 잘게. 인터셉터 분기·useMe 변환·가드 렌더 각각 분리.
> US 매핑: US1(자동 갱신) / US2(재방문 동기화) / US3(만료 종료) / US4(액션 권한)

---

## Phase 1: Setup

본 spec 신규 파일이 의존하는 **도메인 타입**을 먼저 정의. 004 `src/types/enum.ts` SSOT 통합 전까지 도메인 폴더에 둠.

- [x] T001 [P] [US2,US4] `Role` / `AdminRole` / `FieldRole` / `MeRaw` / `MeDto` 타입 정의 (data-model.md §2-2 Enum + §4-3) in src/features/auth/types/me.ts

## Phase 2: Foundational (모든 US 선행)

- [x] T002 [P] [US1,US2,US3,US4] 토큰 헬퍼 5종(`getAccessToken` / `setAccessToken` / `getRefreshToken` / `setRefreshToken` / `clearTokens`) — localStorage 직접 접근, 손상 값은 `null` 취급, 자동 클리어 없음 in src/lib/auth/tokens.ts
- [x] T003 [P] [US3] `redirectToLogin(currentPath)` — `/admin/` prefix 분기 + `?redirect=` 쿼리 보존, `window.location.assign` 사용 in src/lib/auth/redirect.ts

## Phase 3: US1 + US3 — axios 인터셉터 확장

> **독립 테스트 기준**: 401 응답을 받았을 때 single-flight `/auth/refresh` 호출 → 신규 토큰으로 원 요청 1회 재시도, refresh 실패 시 토큰 클리어 + toast 1회 + 영역별 로그인 리다이렉트.

- [x] T004 [US1] 요청 인터셉터 — accessToken 존재 시 `Authorization: Bearer ${token}` 자동 부착(없으면 미부착) in src/lib/axios.ts
- [x] T005 [US1] 응답 인터셉터 401 분기 골격 — single-flight refresh(모듈 스코프 Promise 보유), 원 요청 `_retry` 마커, `/auth/refresh` 자체는 분기에서 제외 in src/lib/axios.ts
- [x] T006 [US3] refresh 실패 처리 — `clearTokens()` + `notify.error('다시 로그인이 필요합니다')` 1회(single-flight 종단) + `redirectToLogin(currentPath)` in src/lib/axios.ts (T005 흐름 내부)

## Phase 4: US2 — useMe()

> **독립 테스트 기준**: 토큰 있을 때 `/auth/me` 호출 결과가 `MeDto`로 변환되어 반환. 401이면 인터셉터(Phase 3)가 refresh 흐름을 처리.

- [x] T007 [US2] `useMe()` 훅 — react-query, queryKey `['auth','me']`, `select`에서 `MeRaw → MeDto` 변환(헬퍼는 모듈 내부, export 안 함), `staleTime: 30_000` / `retry: 1`(전역 옵션 그대로) in src/features/auth/hooks/useMe.ts

## Phase 5: US4 — <RequireRole>

> **독립 테스트 기준**: `roles`에 본인 role 포함 시 children 렌더, 미포함·로딩·미인증 시 children 렌더 안 함(있으면 fallback).

- [x] T008 [US4] `<RequireRole roles fallback?>` — `useMe()`를 내부에서 호출, `data === undefined`이면 children 미렌더 in src/features/auth/components/RequireRole.tsx

## Phase 6: Polish

- [x] T009 [P] [US1,US2,US3,US4] `src/App.tsx` 데모 파일 제거 — 001 T011/T012 검증을 useMe(useQuery unwrap) + refresh 실패 toast(MutationCache onError) 흐름으로 대체. App.css도 동시 제거(import 처가 없어 dead file)
- [x] T010 [P] [US1,US2,US3,US4] `specs/phase0/002-lint-cleanup/tasks.md` 이월 블록의 T029 항목에 "→ Phase 1 — AuthGuard 실제화로 재이월(`003-auth-foundation`은 인증 인프라만)" 표시
- [x] T011 [US1,US2,US3,US4] `npm run verify` 통합 통과 — `exit code: 0`
- [x] T012 [US1,US2,US3,US4] DoD 10건 대조표 작성 — 본 파일 아래 "## DoD 대조표" 섹션

---

## Dependencies & Execution Order

### Phase 간

- **Phase 1(T001) → Phase 2/3/4/5**: 타입(`Role`, `MeRaw`, `MeDto`)이 후속 모든 task에서 import됨.
- **Phase 2(T002, T003) → Phase 3**: axios 인터셉터(T004~T006)가 tokens·redirect 헬퍼 사용.
- **Phase 3(T004 → T005 → T006)**: 같은 파일(`src/lib/axios.ts`) 순차. T005 single-flight 골격이 있어야 T006 실패 처리를 그 종단에 붙임.
- **Phase 4(T007)**: react-query 사용. axios 인터셉터 위에 동작하지만 코드 의존은 axios 인스턴스 import만 → Phase 3과 코드 충돌 없음. 다만 의미적으로는 Phase 3 이후가 자연스러움.
- **Phase 5(T008) ← Phase 4(T007)**: `<RequireRole>`이 `useMe()` 호출.
- **Phase 1~5 → Phase 6**: Polish는 마지막.

### 같은 파일 순차

| 파일 | task 순서 |
|---|---|
| `src/lib/axios.ts` | T004 → T005 → T006 |

다른 task들은 각자 단일 파일이라 동일 파일 충돌 없음.

### 병렬 가능

- Phase 1 T001 — 단독
- Phase 2 T002, T003 — 서로 다른 파일 `[P]`
- Phase 6 T009, T010 — 서로 다른 파일 `[P]`

---

## 검증 체크 (각 phase 끝 자동)

- Phase 1·2 끝: `npx tsc --noEmit` 통과(타입 + 헬퍼 시그니처)
- Phase 3 끝: `npm run verify` 통과 + 의도 코드 검토(single-flight 골격이 모듈 스코프 Promise 공유, `_retry` 마커 존재, `/auth/refresh` 자체 분기 제외)
- Phase 4 끝: `useMe`가 react-query `select`로 변환을 수행하는지 코드 확인 (변환 헬퍼는 모듈 내부, export 안 함)
- Phase 5 끝: `<RequireRole>`가 `useMe.isLoading` / `data === undefined` / `roles` 미포함 3종 분기 모두 미렌더 처리
- Phase 6 T011: `npm run verify` exit 0
- Phase 6 T012: spec §5 DoD 10건 대조표

---

## DoD 대조표 (WF-4 세션 풀세트)

spec §5 항목과 1:1 매칭. 증거는 파일:라인.

- [x] 토큰 헬퍼 5종 — src/lib/auth/tokens.ts:38-46 (`getAccessToken` / `setAccessToken` / `getRefreshToken` / `setRefreshToken` / `clearTokens`). 손상 값은 `readString`이 `null` 반환(:14-21), 자동 클리어 없음.
- [x] 요청 인터셉터 Authorization 자동 부착 — src/lib/axios.ts:37-43 (`getAccessToken()` 존재 시만 헤더 set).
- [x] 401 single-flight refresh + `_retry` 마커 + `/auth/refresh` 제외 — src/lib/axios.ts:49-77 (`ensureRefresh` single-flight), 106-115 (분기 골격, `isRefreshRequest` + `_retry` 가드), 116-126 (재시도 흐름).
- [x] `redirectToLogin` `/admin/` 분기 + `?redirect=` 보존 — src/lib/auth/redirect.ts:10-15.
- [x] refresh 실패 → 토큰 클리어 + toast 1회 + 리다이렉트 — src/lib/axios.ts:139-150 (`finalizeAuthFailure`). 시간 가드(`FAILURE_TOAST_GUARD_MS`)로 다중 호출 시 toast 중복 차단.
- [x] `useMe()` — react-query, `['auth','me']`, `select`로 변환, 잠정 옵션 유지 — src/features/auth/hooks/useMe.ts:33-38 (`useMe` 본체), 18-24 (`toMeDto` 모듈 내부 헬퍼, export 안 함). queryKey `meQueryKey` 공유 위해 export(:31).
- [x] `<RequireRole>` — 로딩/미인증/role 미일치 시 children 미렌더 — src/features/auth/components/RequireRole.tsx:20-28.
- [x] `src/App.tsx` 데모 제거 — 파일 부재 확인 완료. 001 T011/T012 검증은 `useMe`(useQuery unwrap) + `queryClient.ts` MutationCache onError(refresh 실패 시 `notify.error` 경로) 흐름이 대체. App.css도 동시 제거(import 처 없음).
- [x] `npm run verify` exit 0 — Bash `exit code: 0` 확인.
- [x] 002 T029 항목 재이월 표시 — specs/phase0/002-lint-cleanup/tasks.md:140 ("→ Phase 1 — AuthGuard 실제화로 재이월" 추가).

CLAUDE.md 컨벤션 점검:
- 한글 기본 / 코드 식별자 영문 — OK
- 추측 금지 — refresh 실패 toast 1회 가드는 `FAILURE_TOAST_GUARD_MS` 1초로 잠정(Open Q 후보 아님: spec §4 엣지 케이스 "single-flight 종단 1회" 명시 + 시간 가드 보완). 추정 결정 아닌 spec 직접 결정 반영.
- 최소 변경 — `src/lib/axios.ts`는 기존 unwrap 로직 유지(99-122) + 인터셉터·헬퍼·refresh 함수만 추가.

---

## 다음 spec으로 이월

> 다음 spec의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] **002 T029 수동 회귀(4개 화면)** — 본 spec에서 처리 못 함. → **Phase 1 — Layout Plus(AuthGuard 실제화)** 작업 시 동시 검증. spec §0 Carry-over에 명시한 대로.
- [ ] **`<RequireRole>` 라우트 가드 변형 필요 여부**(spec Open Q) — Phase 1 AuthGuard 실제화 시 라우트 단위 role 분기 패턴 등장 시 결정.
- [ ] **영역 prefix(`/admin/`) 하드코딩 → 004 라우트 상수 SSOT 교체**(spec Open Q + redirect.ts 주석) → **004-dev-infrastructure**에서 paths 상수 도입 시 함께 교체.
- [ ] **`?redirect=` 쿼리 활용**(로그인 성공 시 복귀) → Phase 3 로그인 화면 실구현(012-login)에서 소비.
- [ ] **단위 테스트(single-flight refresh, RequireRole 분기, redirectToLogin)** — vitest 미도입(004 예정) → **004-dev-infrastructure**의 vitest 도입 후 본 spec 인증 인프라 대상 단위 테스트 추가 권장.
- [ ] **다중 탭 토큰 동기화** / **JWT 사전 만료 검사** / **refresh 별도 status code** (spec Open Q 3종) → 백엔드 연동 시점에 재검토. 본 spec 범위 외.
- [ ] (001 이월 잔여) react-query 기본 옵션(`staleTime`/`retry`) 미세조정 → Phase 3 화면 작업 시 체감 후 확정.
- [ ] (001 이월 잔여) MutationCache 전역 toast vs 화면별 onError 우회 → 발생 시 검토.
- [ ] (002 이월 잔여) URL 쿼리스트링 동기화(`useQueryParams`) → **004-dev-infrastructure**에서 정형화.
