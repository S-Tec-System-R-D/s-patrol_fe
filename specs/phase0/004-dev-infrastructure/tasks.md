# 004-dev-infrastructure tasks

> 입력: 같은 폴더 `spec.md`
> 위험도: **B** → 화면 단위로 크게, 다만 본 spec은 6 US × 8 모듈이라 모듈별 분리. 같은 파일 작업만 순차.
> US 매핑: US1(paths+env) / US2(Enum SSOT) / US3(useQueryParams + redirect 갱신) / US4(MSW+vitest) / US5(AppFormField+AppInput) / US6(ErrorBoundary)

---

## Phase 1: Setup

- [x] T001 [P] [US4] devDependencies 설치 — `msw`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` — `npm i -D` 실행 후 `package.json`/`package-lock.json` 변경 확인

## Phase 2: Foundational (모든 US 선행)

- [x] T002 [P] [US1] `paths.ts` 신설 — service/admin/auth 그룹 객체 + 동적 세그먼트 함수(`adminLocationDetail(id)`) + 라우터용 패턴 상수(`adminLocationDetailPattern`) in src/router/paths.ts
- [x] T003 [P] [US2] `enum.ts` 신설 — data-model.md §2-2 enum 10종(`AdminRole`/`FieldRole`/`Role`/`UserStatus`/`WorkStatus`/`LocationStatus`/`AuthMethod`/`CourseResult`/`PointResult`/`DayOfWeek`) + 라벨 매핑(`roleLabel` 등) in src/types/enum.ts

## Phase 3: US1 — paths + env

- [x] T004 [US1] 라우트 정의가 `paths` 상수를 사용하도록 갱신(import + 문자열 교체) in src/router/index.tsx
- [x] T005 [P] [US1] `.env.example` 갱신 — `VITE_API_BASE_URL` / `VITE_USE_MSW` / `VITE_ENV` 3종 키 + 주석 in .env.example

## Phase 4: US2 — Enum 이관

- [x] T006 [US2] `me.ts`에서 `Role` / `AdminRole` / `FieldRole` / `UserStatus`를 `@/types/enum`에서 import해 사용. `MeRaw` / `MeDto`는 잔류 in src/features/auth/types/me.ts

## Phase 5: US3 — useQueryParams + redirect 갱신

- [x] T007 [P] [US3] `useQueryParams` 훅 — `[params, setParams]` 튜플, `setParams(partial, { replace? })` 부분 갱신·빈문자/undefined 키 제거, react-router `useSearchParams` 기반 in src/hooks/useQueryParams.ts
- [x] T008 [US3] `redirect.ts`에서 `paths.serviceLogin` / `paths.adminLogin` import해 하드코딩 제거 (003 Carry-over 해소) in src/lib/auth/redirect.ts

## Phase 6: US4 — MSW + vitest

- [x] T009 [P] [US4] MSW 인증 핸들러 — `/api/auth/me`(`MeRaw` mock, default role `FIELD_MANAGER`), `/api/auth/refresh`(신규 토큰 발급) in src/mocks/handlers/auth.ts
- [x] T010 [US4] MSW 핸들러 묶음 — `export const handlers = [...auth]` in src/mocks/handlers/index.ts
- [x] T011 [P] [US4] MSW 브라우저 worker — `setupWorker(...handlers)` in src/mocks/browser.ts
- [x] T012 [P] [US4] MSW node server — `setupServer(...handlers)` in src/mocks/server.ts
- [x] T013 [US4] `main.tsx`에 MSW 동적 import — `if (import.meta.env.VITE_USE_MSW === 'true')` 분기로 `worker.start()` 호출(렌더 전) in src/main.tsx
- [x] T014 [P] [US4] `vitest.config.ts` — `environment: 'jsdom'` / `setupFiles: ['./src/test/setup.ts']` / Vite React 플러그인 공유 in vitest.config.ts
- [x] T015 [P] [US4] 테스트 setup — `@testing-library/jest-dom` import + MSW `server.listen/resetHandlers/close` lifecycle in src/test/setup.ts
- [x] T016 [US4] `package.json` 스크립트 추가 — `"test": "vitest run"` / `"test:watch": "vitest"` in package.json
- [x] T017 [P] [US4] 스모크 단위 테스트 1개 — vitest 동작 증명(`expect(1 + 1).toBe(2)` 수준) in src/test/smoke.test.ts

## Phase 7: US5 — AppFormField + AppInput

- [x] T018 [P] [US5] `AppFormField` 컨테이너 — props `label?` / `required?` / `error?` / `hint?` / `children`. 구조 `<label> + children + (error|hint)` in src/components/app/AppFormField.tsx
- [x] T019 [P] [US5] `AppInput`의 `label` / `error` / `required` props JSDoc `@deprecated` 마킹 (동작 보존, 콘솔 경고 없음) in src/components/app/AppInput.tsx
- [x] T020 [P] [US5] `design-system.md` §5에 **D9. AppFormField + AppInput 역할 분리** 결정 추가 + §6 Open Q 해당 항목 제거 in docs/design-system.md
- [x] T021 [P] [US5] `components.md` — AppFormField 사용 가이드 1절 추가 + AppInput deprecation 메모. 추후 task 줄에서 AppFormField 항목 제거 in docs/components.md

## Phase 8: US6 — ErrorBoundary

- [x] T022 [P] [US6] `AppErrorBoundary` class component — props `fallback?` 또는 `fallbackRender?: (error) => ReactNode`, 라이브러리 없음 in src/components/app/AppErrorBoundary.tsx
- [x] T023 [US6] `router/index.tsx` — 최상위 route에 `errorElement` 1개 + 각 페이지 element에 `errorElement` 적용. 텍스트 위주 최소 fallback(콘텐츠 톤 §4 따름) in src/router/index.tsx

## Phase 9: Polish

- [x] T024 [US1,US2,US3,US4,US5,US6] `npm run verify` 통합 통과 — exit 0 확인
- [x] T025 [US4] `npm run test` 스모크 통과 — vitest 동작 확인(T017 테스트 + auth handler 사용한 가벼운 통합 테스트가 가능하면 1개 추가, 안 되면 스모크만)
- [x] T026 [US1,US2,US3,US4,US5,US6] DoD 대조표 작성 — spec §5 21개 항목 1:1 매칭(파일:라인)
- [x] T027 [US1,US2,US3,US4,US5,US6] `roadmap.md` §11 — 004 row ☑ + Phase 0 종료 조건 3종(표준 사용·verify·AppFormField Open Q) 충족 메모

---

## Dependencies & Execution Order

### Phase 간

- **T001 → 모든 US4 후속**(T009~T017): 라이브러리 없이 import 불가.
- **T002(paths.ts) → T004**(router에서 사용) / **→ T008**(redirect에서 사용).
- **T003(enum.ts) → T006**(me.ts가 enum 사용).
- **T009 → T010**(handlers/index.ts가 auth.ts import). **T010 → T011, T012**(브라우저/서버가 handlers 묶음 import).
- **T011 → T013**(main.tsx가 browser.ts 동적 import).
- **T014, T015 → T017**(테스트 인프라가 있어야 스모크 실행).
- **Phase 1~8 → Phase 9 Polish**.

### 같은 파일 순차

| 파일 | task 순서 |
|---|---|
| `src/router/index.tsx` | T004 → T023 |

다른 파일들은 단일 task.

### 병렬 가능

- Phase 2: T002, T003 — 서로 다른 파일 `[P]`
- Phase 3: T005 — 단독
- Phase 5: T007 — 단독
- Phase 6: T009/T011/T012/T014/T015/T017 — 서로 다른 파일 `[P]`. 단 T010, T013, T016은 의존 순차
- Phase 7: T018/T019/T020/T021 — 서로 다른 파일 `[P]`
- Phase 8: T022 — 단독

---

## 검증 체크 (각 phase 끝 자동)

- Phase 1 끝: `package.json` deps 갱신 확인 + `npx tsc --noEmit` 통과
- Phase 2 끝: paths/enum 사용처 import 깨짐 없음 — `npm run typecheck`
- Phase 3 끝: 라우터 정의가 paths 상수만 사용(grep으로 라우트 문자열 잔존 확인) + `npm run verify`
- Phase 4 끝: 003 import 경로(redirect/RequireRole)가 깨지지 않음 — `npm run typecheck`
- Phase 5 끝: redirect.ts에서 `/admin/` 하드코딩 grep 결과 0건
- Phase 6 끝: `npm run test` 스모크 1건 통과 exit 0
- Phase 7 끝: AppInput 사용처 6곳 빌드 깨짐 없음(`@deprecated`는 경고만)
- Phase 8 끝: 라우터 errorElement 정의 + dev에서 의도적 throw 시 fallback이 노출되는지 코드 동등성 검토(브라우저 수동 검증은 Phase 1 작업 시 함께)
- Phase 9 T024: `npm run verify` exit 0
- Phase 9 T026: spec §5 DoD 21건 대조표

---

## DoD 대조표 (WF-4 세션 풀세트)

spec §5 21건과 1:1 매칭. 증거는 파일:라인.

**US1 — paths + env**
- [x] `src/router/paths.ts` (service/admin/auth 그룹 + 동적 함수 + 패턴 상수 + `isAdminArea`) — src/router/paths.ts:16-45,51-52
- [x] `src/router/index.tsx` paths 사용 — src/router/index.tsx:27,53,58,67,72
- [x] `src/lib/auth/redirect.ts` paths 사용 (003 Carry-over 해소) — src/lib/auth/redirect.ts:12
- [x] `.env.example` 3종 키 — .env.example:9, .env.example:15, .env.example:19

**US2 — Enum SSOT**
- [x] `src/types/enum.ts` enum 10종 + 라벨 매핑 — src/types/enum.ts:11-43,49-101
- [x] `src/features/auth/types/me.ts` enum.ts import — src/features/auth/types/me.ts:9,12

**US3 — useQueryParams**
- [x] `src/hooks/useQueryParams.ts` — src/hooks/useQueryParams.ts:19-49

**US4 — MSW + vitest**
- [x] `src/mocks/handlers/auth.ts` (`/api/auth/me`, `/api/auth/refresh`) — src/mocks/handlers/auth.ts:23-32
- [x] `src/mocks/handlers/index.ts` 묶음 — src/mocks/handlers/index.ts:9
- [x] `src/mocks/browser.ts` — src/mocks/browser.ts:9
- [x] `src/mocks/server.ts` — src/mocks/server.ts:7
- [x] `src/main.tsx` MSW 동적 import 분기 — src/main.tsx:15-19
- [x] `vitest.config.ts` jsdom + setupFiles — vitest.config.ts:12-21
- [x] `src/test/setup.ts` jest-dom + MSW lifecycle — src/test/setup.ts:13-15
- [x] `package.json` test/test:watch 스크립트 — package.json:13-14
- [x] `npm run test` smoke 통과 (2 tests passed) — src/test/smoke.test.ts:9-18

**US5 — AppFormField + AppInput**
- [x] `src/components/app/AppFormField.tsx` 컨테이너 — src/components/app/AppFormField.tsx:30-50
- [x] `src/components/app/AppInput.tsx` `@deprecated` JSDoc — src/components/app/AppInput.tsx:8-12
- [x] `docs/design-system.md` D9 추가 + §6 Open Q 제거 — docs/design-system.md §5 D9, §6
- [x] `docs/components.md` AppFormField 가이드(§3-1) + AppInput deprecation 메모(§3) — docs/components.md §3, §3-1

**US6 — ErrorBoundary**
- [x] `src/components/app/AppErrorBoundary.tsx` class component — src/components/app/AppErrorBoundary.tsx:23-49
- [x] `src/router/index.tsx` errorElement 적용 — src/router/index.tsx:28,38,44,52,57,66,71

**통합**
- [x] `npm run verify` exit 0
- [x] `npm run test` smoke 2 passed

CLAUDE.md 컨벤션 점검:
- 한글 기본 / 코드 영문 — OK
- 추측 금지 — paths 명명(그룹 vs flat), MSW default role 등 Open Q에 명시한 추천대로 적용, 검토 단계에서 사용자 OK
- 최소 변경 — 기존 6개 폼 파일 미수정 / AppInput props 보존(deprecated만)
- only-export-components — router 컴포넌트는 PageErrorFallback로 분리(002 컨벤션)

---

## 다음 spec으로 이월

> 다음 spec(또는 다음 Phase)의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] **Phase 0 종료** — 본 spec으로 Phase 0 (001~004) 모두 완료. 다음은 **Phase 1 — Layout Plus**.
- [ ] **Phase 1로 이월 — 002 T029 수동 회귀** (4개 화면 AppTabs/LocationTabs/PointsPage/ZonesPage) — AuthGuard 실제화 작업과 동시 검증. (이미 003에서 재이월 표시됨)
- [ ] **Phase 1로 이월 — AuthGuard 실제화** — 003 인증 인프라(`useMe`/`<RequireRole>`/401 refresh) 위에 본체 연결. 영역별 분기는 `paths.adminLogin` / `paths.serviceLogin` + `isAdminArea` 사용.
- [ ] **Phase 1로 이월 — `<RequireRole>` 라우트 가드 변형 필요 여부** — AuthGuard 작업 시 라우트 단위 role 분기 패턴 결정.
- [ ] **MSW 핸들러 도메인 점진 이관** — 현재 auth만. 화면 spec(Phase 3+)에서 해당 도메인 핸들러를 `src/mocks/handlers/{points,zones,...}` 로 이관. 기존 `features/{points,zone}/{mock,mocks}/*.ts` 데이터는 핸들러에서 import 재사용.
- [ ] **003 인증 인프라 단위 테스트 작성** — vitest 도입 완료. single-flight refresh / `<RequireRole>` 분기 / `redirectToLogin` 등. Phase 1 작업 흐름에 자연 흡수.
- [ ] **`useQueryParams` zod 통합** — primitive만 도입. Phase 3 첫 사용처(`/patrol/zones` 필터)에서 zod 파싱 헬퍼 추가.
- [ ] **AppInput → AppFormField 마이그레이션** — 기존 6개 폼 파일은 화면 작업 시 자연 교체. Phase 3 화면 spec이 흡수.
- [ ] **MSW init (mockServiceWorker.js)** — `npx msw init public/` 실행이 운영 환경에서 필요. dev에서 worker가 처음 동작할 때만 필요한 작업. 사용자가 dev 환경에서 MSW를 처음 켤 때 별도 안내.
- [ ] **`docs/screens.md`** — 본 spec은 화면 신설/변경 없음. 갱신 항목 없음.
- [ ] (001 이월 잔여) react-query 기본 옵션 / MutationCache 우회 → Phase 3 화면 작업 시 체감 후 확정.
- [ ] (003 이월 잔여) 다중 탭 토큰 동기화 / JWT 사전 만료 / refresh status code → 백엔드 연동 시점.
