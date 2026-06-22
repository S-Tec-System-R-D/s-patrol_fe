# 001-api-foundation tasks

> 입력: 같은 폴더 `spec.md`
> 위험도: **A** → 잘게 분할 (인터셉터 책임 단위로 태스크 분리, 검증·정규화 분리)
> 본 spec은 인증/refresh 없는 API 인프라 토대 → 외부 의존성 최소. 태스크 간 의존성도 단순.

---

## Phase 1: Setup

기본 셋업·SSOT 타입. 모든 작업 선행.

- [x] T001 [P] `sonner` dependency 추가 in `package.json`
- [x] T002 [P] `ApiResponse<T>` / `PaginationMeta` / `PagedData<T>` / `ApiListResponse<T>` / `ApiDetailResponse<T>` SSOT 타입 정의 (data-model.md §2-1 1:1 일치) in `src/types/api.ts`

## Phase 2: Foundational (모든 US 선행 blocking)

`api` 인스턴스·QueryClient·notify 헬퍼·Provider 마운트까지. 화면이 호출하기 시작할 토대 완성.

- [x] T003 [P] `notify` 헬퍼 작성 (`success / error / info / warning`) — sonner의 `toast` 재export 형태 in `src/lib/notify.ts`
- [x] T004 `src/lib/axios.ts` baseURL을 `import.meta.env.VITE_API_BASE_URL`로 설정 + 기존 요청 인터셉터의 Authorization placeholder 제거 (002에서 재도입 예정) in `src/lib/axios.ts`
- [x] T005 axios 응답 인터셉터 — `responseType === 'blob'` 우회 가드 추가 in `src/lib/axios.ts`
- [x] T006 axios 응답 인터셉터 — `ApiResponse<T>` 형식 검증 + `code === 200` 자동 unwrap + `code !== 200` → `Error(message)` throw + 형식 불일치 시 `Error('알 수 없는 응답 형식')` + `console.warn(response)` in `src/lib/axios.ts`
- [x] T007 axios reject 핸들러 — 네트워크 실패(`error.response` 없음) `Error('네트워크 연결을 확인해주세요')` 정규화 후 re-reject in `src/lib/axios.ts`
- [x] T008 `QueryClient` 인스턴스 + `defaultOptions.queries` (retry:1, staleTime:30_000, refetchOnWindowFocus:false) in `src/lib/queryClient.ts`
- [x] T009 `MutationCache` 생성하여 `onError`에서 `notify.error((err as Error).message)` 호출, `QueryClient`에 주입 in `src/lib/queryClient.ts`
- [x] T010 `QueryClientProvider`로 앱 wrapping + sonner `<Toaster>` 마운트 in `src/main.tsx`

## Phase 3: US1 — 자동 unwrap 동작 확인

> **독립 테스트 기준**: 임의 호출이 `useQuery`를 통해 도달한 `data`가 wrapper(`{ code, message, data }`)가 아닌 unwrap된 페이로드 형태. blob 응답은 우회 동작.

- [~] T011 [US1] 데모용 임시 호출 시나리오 1건 (mock 또는 임시 핸들러)로 `useQuery` 결과를 `console.log`/UI에 표시하여 unwrap 확인 — 검증 후 코드 위치/라인 메모 in `src/App.tsx` (임시 — 002에서 제거)
  - 코드: `src/App.tsx:21-30` (`ApiFoundationDemo` 내 useQuery)
  - 한계: `App`이 라우터에 마운트되지 않은 상태라 실제 런타임 검증은 미완. 002에서 MSW 도입 후 정상 검증 예정.

## Phase 4: US2 — mutation 실패 시 전역 toast

> **독립 테스트 기준**: 강제로 `code: 500` 응답을 받는 mutation을 호출하면, 화면 추가 코드 없이 `notify.error` toast가 자동 노출.

- [~] T012 [US2] 데모용 임시 mutation 1건을 실패 응답으로 호출 → `<Toaster>`에 메시지 표시 확인 — 검증 후 코드 위치/라인 메모 in `src/App.tsx` (임시 — 002에서 제거)
  - 코드: `src/App.tsx:33-38` (`ApiFoundationDemo` 내 useMutation)
  - 한계: T011과 동일. 라우터 미연결로 실제 토스트 노출 검증은 002에서 진행.

## Phase 5: Polish

- [x] T013 [P] 임시 데모(T011/T012)에 "002 시작 시 제거" 주석 표기 in `src/App.tsx`
- [~] T014 [P] `npm run verify` 통과 (typecheck + lint)
  - typecheck: 통과 (`tsc --noEmit` 0건)
  - lint: 본 spec이 추가/수정한 6개 파일(`src/types/api.ts`, `src/lib/{axios,notify,queryClient}.ts`, `src/main.tsx`, `src/App.tsx`)만 대상으로 `eslint`를 돌리면 0건.
  - 전체 `npm run verify`는 사전 잔존 에러 19건(zone form, points/zones page, AuthGuard 등 본 spec 범위 밖)으로 실패. → 별도 정리 spec 또는 002 진행 중 처리 필요.

---

## Dependencies & Execution Order

- **T001, T002 → 모든 후속 태스크 선행** (sonner 미설치 / 타입 미정의 시 인터셉터·QueryClient 작성 불가)
- **T003 → T009** (`MutationCache.onError`가 `notify.error`를 호출하므로 헬퍼 선행)
- **T004 → T005 → T006 → T007** (`src/lib/axios.ts` 동일 파일, 순차)
- **T008 → T009** (`src/lib/queryClient.ts` 동일 파일, 순차)
- **(T007 AND T009) → T010** (Provider 마운트는 인스턴스 완성 후)
- **T010 → T011, T012** (Provider 없이는 demo 검증 불가)
- **T011, T012 → T013, T014** (Polish는 US 완료 후)
- `[P]` 끼리는 병렬 가능: (T001, T002, T003) 동시 가능 / (T013, T014) 동시 가능

---

## 다음 spec으로 이월

> 다음 spec의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] **T011/T012 런타임 미검증** — `src/App.tsx` 데모(useQuery unwrap / mutation 실패 toast)가 작성만 됐고, `App`이 라우터에 미연결이라 브라우저 동작 확인 미완 → **003-auth-foundation**에서 인증 흐름 연결 + 임시 mock(또는 MSW)으로 검증, 검증 후 임시 데모 제거
- [x] **T014 — `npm run verify` 전체 미통과** — 본 spec 6개 파일은 typecheck·lint 클린이나, 전체 `verify`는 사전 잔존 lint 19건(zone form, points/zones page, AuthGuard 등 본 spec 범위 밖)으로 실패 → **002-lint-cleanup**으로 분리(별도 spec, `verify` green 복구가 목표). **✓ 해소** in `specs/phase0/002-lint-cleanup/` (verify green 확인).
- [ ] **spec.md Open Q — react-query 기본 옵션 미세조정** (`staleTime: 30_000`/`retry: 1` 잠정) → **Phase 3 화면 작업 시** 체감 후 확정
- [ ] **spec.md Open Q — MutationCache 전역 toast vs 화면별 onError** (인라인 폼 에러 등 우회 필요 케이스) → 발생 시 `meta: { suppressErrorToast: true }` 확장 검토, 현재 **미정**
