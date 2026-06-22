# 005-auth-and-error-pages tasks

> 입력: 같은 폴더 `spec.md` (위험도 A — 잘게 분할: 가드 분기 / 페이지 컴포넌트 / 라우트 등록 / 테스트 분리)
> 태스크 ID `T001`~ (Phase 무관 글로벌 일련번호. 직전 004의 마지막이 T026였으나 본 spec은 새 영역이라 T001부터 재시작 — 워크플로 §2 "Task ID 3자리"만 명시되어 있고 글로벌 일관성은 spec 단위로 충분)
> `[P]` 병렬 가능 / `[US?]` user story 소속

---

## Phase 1: Setup

기본 타입·헬퍼·페이지 디렉토리 준비. 모든 US 선행.

- [x] T001 [P] 에러 페이지 디렉토리 신설(`src/pages/errors/` 폴더 + `index.ts` 배럴)
- [x] T002 [P] 본인 영역 홈 경로 헬퍼 `homePath(role)` 신설 in src/features/auth/lib/homePath.ts (Admin 3종 → `/admin/locations`, 현장관리자 → `/zones`. 근무자는 진입 자체 차단이라 fallback `/login`)

## Phase 2: Foundational (모든 US 선행 blocking)

- [x] T003 `<RequireRoute roles=[...]>` 라우트 가드 신설 in src/features/auth/components/RequireRoute.tsx (useMe 결과 + 로딩/미인증/role 불일치 분기. 분기 결과는 children 또는 `<Navigate to=403>` 또는 `redirectToLogin`)
- [x] T004 [P] `<RequireRoute>` 단위 테스트 in src/features/auth/components/__tests__/RequireRoute.test.tsx (MSW: 로딩/200 role 일치/200 role 불일치/미인증 4 case)

## Phase 3: US1 — AuthGuard 실제화

> **독립 테스트 기준** (세션 검증 게이트): MSW `/api/auth/me` 200 응답 + 토큰 있음 → children 렌더, 401 응답 → 로그인 리다이렉트, 토큰 없음 → 즉시 로그인 리다이렉트

- [x] T005 [US1] AuthGuard 본체 실제화 in src/router/guards/AuthGuard.tsx
  - `isAuthentication = true` 하드코딩 제거
  - `getAccessToken()` 없음 → 즉시 Navigate(영역별 로그인 + `?redirect=` 보존)
  - 토큰 있음 → `useMe()` 결과 분기: 로딩=null 렌더 / 에러=Navigate / 성공=`<AppLayout />`
- [x] T006 [US1] AuthGuard 단위 테스트 in src/router/guards/__tests__/AuthGuard.test.tsx (MSW: 토큰 없음/토큰 없음+admin/토큰 있음+200/토큰 있음+401 4 case)
- [x] T007 [US1] 002 T029 수동 회귀 체크리스트 작성 + 실행 in specs/phase1/005-auth-and-error-pages/manual-regression.md (전 케이스 ✓ — dev 환경 진입 사용자 검증 완료, 2026-06-22)

## Phase 4: US2 — 403 / RequireRoute 적용

> **독립 테스트 기준**: 현장관리자 role로 `/admin/*` 진입 시 403 페이지 노출 + 본인 영역 홈 액션 동작

- [x] T008 [US2] ForbiddenPage 컴포넌트 in src/pages/errors/ForbiddenPage.tsx (AppEmpty + useMe → homePath로 홈 액션. 액션은 임시 `<Link>` 스타일 — 006 AppButton 마이그 후 교체)
- [x] T009 [US2] 403 라우트 등록 in src/router/index.tsx (`path: paths.forbidden = '/403'` — AuthGuard 밖에 등록해 모든 영역에서 진입 가능)
- [x] T010 [US2] `<RequireRoute>` 실제 적용 예시 in src/router/index.tsx (`/admin/locations` placeholder 라우트에 `<RequireRoute roles=[SYSTEM, MASTER, MANAGER]>` 적용. AdminPlaceholderPage 신설)
- [x] T011 [US2] paths.ts에 403 / 404 경로 상수 추가 in src/router/paths.ts (`paths.forbidden = '/403'`, `paths.notFound = '/404'`)

## Phase 5: US3 — 404 NotFound

> **독립 테스트 기준**: 등록되지 않은 URL(예: `/zzz-not-exist`)로 접근 시 NotFoundPage 노출 + 본인 영역 홈 액션 동작

- [x] T012 [US3] NotFoundPage 컴포넌트 in src/pages/errors/NotFoundPage.tsx (AppEmpty + useMe → homePath. 액션은 임시 `<Link>`)
- [x] T013 [US3] 404 catch-all 라우트 등록 in src/router/index.tsx (`path: '*'` — 최하단. 가드 밖에 두어 비인증·인증 영역 모두 흡수)

## Phase 6: US4 — 401 정책 명문화 (코드 없음, 문서)

> **독립 테스트 기준**: 401 별도 페이지 미생성 결정이 docs에 반영되어 다음 spec에서 재논쟁 발생 안 함

- [x] T014 [US4] `docs/screens.md` §3 갱신 (401 행에 "별도 401 페이지 만들지 않음 — 005 결정" 메모 추가. 403/404 진행도 ✓로 갱신)
- [x] T015 [US4] `docs/screens.md` §6 Open Q "권한 실패 시 리다이렉트 정책" 해소 (체크박스 [x] + 결정 사유 명시)

## Phase 7: Polish

- [x] T016 [P] `homePath` 단위 테스트 in src/features/auth/lib/__tests__/homePath.test.ts (Admin 3종 / 현장관리자 / 근무자 fallback — 3 case)
- [x] T017 [P] AuthGuard 로딩 깜빡임 점검 — 단위 테스트(RequireRoute 1초 지연 시나리오) + dev 환경 시각 확인 케이스 C 통과(2026-06-22)
- [x] T018 [P] `npm run verify` 통과 확인 — exit 0
- [x] T019 [P] `npm run test` 신규 테스트 포함 전체 통과 확인 — 4 files / 13 tests passed
- [x] T020 DoD 대조표 작성 in tasks.md 본 파일 맨 아래 (spec §5 13건 1:1 매칭, 증거 파일:라인)
- [x] T021 `docs/roadmap.md` §11 갱신 (Phase 1 005 항목 추가 ☑, 006 placeholder 추가)

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2 → Phase 3·4·5 → Phase 6·7**
- T001, T002 → 다른 모든 태스크 선행 (페이지 디렉토리 / homePath 헬퍼 부재 시 T005·T008·T012 작성 불가)
- T003 → T004, T006, T010 (RequireRoute 본체 → 테스트·적용)
- T005 → T006, T007 (AuthGuard 본체 → 테스트·수동 회귀)
- T008 → T009 (페이지 → 라우트 등록)
- T011 → T009, T013 (경로 상수 → 라우트 등록 활용. 단 catch-all `*`로 결론 나면 T011 일부만 사용)
- T012 → T013
- T014, T015 → 본 spec 코드 변경 모두 완료 후 (문서는 결정 확정 후)
- T016 → T002 (homePath 본체 → 테스트)
- T018, T019 → 코드 작업 전부 완료 후
- T020 → T018, T019 통과 후
- T021 → T020 통과 후
- `[P]` 끼리 병렬 가능 (특히 T001/T002, T003/T004 동시, T016/T017/T018/T019 동시)

---

## Phase별 검증 게이트

- **Phase 2 끝**: `npx tsc --noEmit` 통과 + `RequireRoute.test.tsx` green
- **Phase 3 끝**: `AuthGuard.test.tsx` green + 수동 회귀(T007) 4화면 OK
- **Phase 4 끝**: `mcp__ide__getDiagnostics` 0건 (`index.tsx`/`ForbiddenPage.tsx`/`RequireRoute.tsx`)
- **Phase 5 끝**: 라우트 등록 grep으로 catch-all 1개만 존재 확인
- **Phase 6 끝**: docs grep으로 "별도 페이지 생성하지 않음" / "권한 실패 정책" 결정 문구 존재 확인
- **Phase 7 끝**: `npm run verify` + `npm run test` exit 0

---

## DoD 대조표 (WF-4 세션 풀세트)

spec §5 13건 1:1 매칭. 증거는 파일:라인.

- [x] AuthGuard `isAuthentication=true` 제거 + 실 분기 — src/router/guards/AuthGuard.tsx:13-37
- [x] 토큰 없음/실패 시 영역별 로그인 Navigate — src/router/guards/AuthGuard.tsx:18-23, 31-36 (isError/!data 분기)
- [x] 로딩 시 children 렌더 X — src/router/guards/AuthGuard.tsx:25
- [x] `<RequireRoute>` 신설 + 적용 — src/features/auth/components/RequireRoute.tsx:25-41, src/router/index.tsx:73-80 (admin placeholder)
- [x] ForbiddenPage 신설 + 라우트 등록 — src/pages/errors/ForbiddenPage.tsx:13-34, src/router/index.tsx:27-31
- [x] NotFoundPage 신설 + catch-all — src/pages/errors/NotFoundPage.tsx:13-34, src/router/index.tsx:88-92
- [x] 401 별도 페이지 미생성 결정 docs 반영 — docs/screens.md §3 (401 행 갱신)
- [x] §6 Open Q "권한 실패 정책" 해소 — docs/screens.md §6 (체크박스 [x])
- [x] 002 T029 수동 회귀 4화면 — specs/phase1/005-auth-and-error-pages/manual-regression.md (전 케이스 ✓, 2026-06-22)
- [x] vitest 단위 테스트 최소 4 case — RequireRoute.test.tsx(4) + AuthGuard.test.tsx(4) + homePath.test.ts(3) = 11 case 추가
- [x] `npm run verify` exit 0 — 실행 결과 typecheck + lint 통과
- [x] `npm run test` 전체 통과 — 4 files / 13 tests passed
- [x] `docs/roadmap.md` §11 005 갱신 — docs/roadmap.md:220 (Phase 1 005 auth/error ☑ 추가, 006 placeholder 추가)

---

## 다음 spec으로 이월

> 다음 spec(`006-shell-and-table`)의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] **403/404 액션 버튼 임시 `<Link>` 스타일** — 006에서 AppButton 도입 후 동시 교체 (ForbiddenPage.tsx:23-28, NotFoundPage.tsx:23-28)
- [ ] **admin placeholder 라우트 임시** — `/admin/locations`에 AdminPlaceholderPage 등록. Phase 5 본사 spec에서 실 화면으로 교체. `<RequireRoute>` 래핑은 그대로 유지
- [ ] **AdminLoginPage placeholder 임시** — `src/pages/auth/AdminLoginPage.tsx` ("요기는 본사 로그인 페이지"). 실 로그인 폼은 Phase 5 본사 영역 spec 또는 Phase 3 `/login` spec에서 동시 구현
- [ ] **MSW 환경 셋업 안내** — `.env.local`(`VITE_USE_MSW=true`) + `public/mockServiceWorker.js`(`npx msw init public/`)는 005 수동 회귀 진행 중 셋업 완료. 다른 개발자의 dev 환경 첫 진입 시 동일 셋업 필요 — `docs/` 또는 README에 안내 추가 검토 (006 또는 별도 chore)
- [ ] **모바일 햄버거 + Sidebar Sheet** (roadmap §4) → 006
- [ ] **본사 사이드바 config 분리(`AdminMenus`)** — screens.md §4 라우트 인벤토리 기준 (현재 `/admin/locations` + `/admin/admins`) → 006
- [ ] **TopNav 메뉴명 매핑** (paths 상수) → 006
- [ ] **ProfileBadge 드롭다운** (로그아웃 / 내 정보, useMe) → 006
- [ ] **AppTable 페이지네이션 UI** (1-based) → 006
- [ ] **AppButton 마이그레이션 (옵션 1)** — `src/components/Button.tsx` → `src/components/app/AppButton.tsx` 이동 + named export `AppButton` + `AppIconButton`도 동일 이동 + 10개 import 사이트 일괄 갱신 + design-system.md D1 §2-3 경로 갱신 + D1 Open Q "완료 시점" 종결 → 006
- [ ] (004 이월 잔여 유지) AppInput → AppFormField 마이그(Phase 3 화면 spec), MSW 핸들러 도메인 이관(Phase 3+), `useQueryParams` zod 통합(Phase 3 첫 사용처), MSW init `npx msw init public/`(dev 첫 사용 시 사용자 안내), react-query 기본 옵션·MutationCache 우회(Phase 3), 다중 탭 토큰 동기화·JWT 사전 만료·refresh status code(백엔드 연동 시점)
