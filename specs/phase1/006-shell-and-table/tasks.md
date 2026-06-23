# 006-shell-and-table tasks

> 입력: 같은 폴더 `spec.md` (위험도 B — 화면 단위로 묶되 AppButton 마이그/모바일 분기/페이지네이션은 분리)
> 태스크 ID `T001`~ (spec 단위 재시작)
> `[P]` 병렬 가능 / `[US?]` user story 소속

---

## Phase 1: Setup — AppButton 위치 이동 (다른 작업 토대)

> **독립 테스트 기준**: `npm run verify` exit 0 + grep `@/components/Button` / `@/components/AppIconButton` 결과 0건

- [x] T001 [P] [US6] `src/components/Button.tsx` → `src/components/app/AppButton.tsx` 이동 + default export 이름 `AppButton`으로 변경 (파일 내부 컴포넌트명 `Button` → `AppButton` 일괄)
- [x] T002 [P] [US6] `src/components/AppIconButton.tsx` → `src/components/app/AppIconButton.tsx` 이동 (default export 이름 유지)
- [x] T003 [US6] 11개 import 사이트 일괄 갱신 — `src/features/{zone,points,patrol-zones}/**` + `src/pages/service/zones/ZonesPage.tsx`. `@/components/Button` → `@/components/app/AppButton` / `@/components/AppIconButton` → `@/components/app/AppIconButton`. 컴포넌트 호출명도 `Button` → `AppButton`로 일괄 교체

## Phase 2: Foundational — 메뉴 config·lookup

- [x] T004 [P] [US2·US3] `AdminMenus` export 추가 in src/components/layout/sidebar/sidebar.config.ts (그룹 "본사 관리" + `사업장 관리`/`관리자 관리` 2건. paths 상수 사용)
- [x] T005 [US3] 메뉴명 lookup 헬퍼 신설 in src/components/layout/sidebar/menu-lookup.ts (`ServiceMenus` + `AdminMenus`에서 자동 도출 — 정확 매칭 > prefix(`activeUrl`) 매칭 > 빈 문자열)

## Phase 3: US1 — 모바일 햄버거 + Sidebar Sheet

> **독립 테스트 기준**: dev 환경에서 viewport `<1024px`로 줄이면 사이드바 사라지고 TopNav 햄버거 노출. 햄버거 클릭 시 Sheet 슬라이드, 메뉴 클릭 후 자동 닫힘.

- [x] T006 [US1] AppLayout 또는 신규 래퍼에서 `lg` 미만 분기 in src/components/layout/AppLayout.tsx (`<Sidebar>`는 `hidden lg:flex`, 모바일은 Sheet wrapper로 대체)
- [x] T007 [US1] TopNav 좌측 햄버거 통합 in src/components/layout/topnav/TopNav.tsx (`MenuIcon`, `lg:hidden`, Sheet `open` state 제어)
- [x] T008 [US1] Sheet 라우트 이동 자동 닫힘 — `useLocation` + `useEffect`로 `open=false`. (T006 또는 T007 안에 내포 — 코드 위치만 명확하게)

## Phase 4: US2 — 본사 사이드바 분기

> **독립 테스트 기준**: `/admin/locations` 진입 시 좌측 사이드바가 본사 메뉴(사업장/관리자 관리)로 자동 전환

- [x] T009 [US2] Sidebar.tsx에 `isAdminArea(location.pathname)` 분기 in src/components/layout/sidebar/Sidebar.tsx (true → `AdminMenus`, false → `ServiceMenus`)
- [x] T010 [P] [US2] Sidebar 영역 분기 단위 테스트 in src/components/layout/sidebar/__tests__/Sidebar.test.tsx (현장 경로 / admin 경로 2 case + 메뉴 항목 노출 확인)

## Phase 5: US3 — TopNav 메뉴명 lookup

> **독립 테스트 기준**: `/zones`에서는 "구역/지점", `/admin/locations`에서는 "사업장 관리" 표시

- [x] T011 [US3] TopNav 좌측 라벨에 lookup 결과 적용 in src/components/layout/topnav/TopNav.tsx (`menu-lookup.ts` 사용. 비매칭 시 빈 문자열)
- [x] T012 [P] [US3] menu-lookup 단위 테스트 in src/components/layout/sidebar/__tests__/menu-lookup.test.ts (정확 매칭 / prefix 매칭 / 비매칭 / admin 경로 4 case)

## Phase 6: US4 — ProfileBadge 드롭다운 + 로그아웃

> **독립 테스트 기준**: ProfileBadge 클릭 시 드롭다운 노출(사용자명 + 내 정보 + 로그아웃). 로그아웃 클릭 시 토큰 clear + 로그인 페이지 이동

- [x] T013 [US4] ProfileBadge에 dropdown-menu 통합 in src/components/layout/topnav/ProfileBadge.tsx (`@/components/ui/dropdown-menu` 사용. trigger=기존 아바타. items: 사용자명(disabled) / 내 정보(placeholder) / 로그아웃)
- [x] T014 [US4] 로그아웃 액션 — `clearTokens()` + `queryClient.invalidateQueries({ queryKey: meQueryKey })` + 영역별 로그인 이동 (`redirectToLogin(location.pathname)` 활용 또는 직접 Navigate)
- [x] T015 [P] [US4] ProfileBadge 로그아웃 단위 테스트 in src/components/layout/topnav/__tests__/ProfileBadge.test.tsx (MSW: useMe 200 → 사용자명 표시 + 로그아웃 클릭 시 토큰 clear 확인)

## Phase 7: US5 — AppTable 페이지네이션 UI

> **독립 테스트 기준**: 테이블 하단에 이전/다음/페이지 N/M/전체 N건 노출. 첫 페이지에서 "이전" 비활성, 마지막 페이지에서 "다음" 비활성

- [x] T016 [US5] AppTable footer 페이지네이션 컴포넌트 in src/components/AppTable.tsx (1-based 표시. `table.getState().pagination.pageIndex + 1` / `table.getPageCount()`. 이전/다음 버튼은 AppButton variant=sub)
- [x] T017 [US5] AppTable에 외부 `pageSize?: number` prop 추가 (기본 10 유지. 본 spec에선 사용처 0건이라 prop 인터페이스만 보장)
- [x] T018 [P] [US5] AppTable 페이지네이션 단위 테스트 in src/components/__tests__/AppTable.test.tsx (15행 dummy data + pageSize 10 → 페이지 2개 / 이전·다음 버튼 클릭 / 경계 비활성 3 case)

## Phase 8: US6 — 005 임시 액션 교체 (AppButton)

- [x] T019 [US6] ForbiddenPage / NotFoundPage 액션 `<Link>` → `AppButton`(variant="default") 교체 in src/pages/errors/ForbiddenPage.tsx + NotFoundPage.tsx (Link 자체 동작은 유지. `asChild` 패턴 또는 onClick+navigate 결정 — AppButton에 asChild 없으면 onClick으로 navigate)

## Phase 9: US7 — MSW dev 첫 진입 안내 docs

- [x] T020 [US7] `README.md` 또는 `docs/dev-setup.md` 1개 섹션 추가 — `.env.local`(`VITE_USE_MSW=true`) + `npx msw init public/` 절차 명시. README가 비어있거나 없으면 신설

## Phase 10: Open Q 해소 + 수동 회귀 + 검증

- [x] T021 [P] `docs/design-system.md` D1 §2-3 경로 갱신(`src/components/Button.tsx` → `src/components/app/AppButton.tsx`) + D1 Open Q "완료 시점" 체크박스 [x] 종결
- [x] T022 [P] `docs/layout.md` §6 Open Q 3건 해소 표시 [x] (본사 사이드바 / TopNav 메뉴명 / ProfileBadge 메뉴). 알림 시트 본문은 [ ] 그대로 → Phase 2 위임 명시
- [x] T023 [P] `docs/components.md` §10 Open Q "AppTable 페이지네이션 UI" 해소 표시 [x]
- [x] T024 [US1·US5] 수동 회귀 작성 + 실행 in manual-regression.md (admin role 케이스 6·9·13 스킵 외 전 케이스 ✓, 2026-06-23). 보완: MobileSidebar Sheet 우측 공백 이슈 발견 → `data-[side=left]:w-70` 클래스로 수정
- [x] T025 [P] `npm run verify` 통과 확인 — exit 0
- [x] T026 [P] `npm run test` 신규 테스트 포함 전체 통과 — 기존 13건 + 신규 ~10건
- [x] T027 DoD 대조표 작성 in tasks.md 본 파일 맨 아래 (spec §5 17건 1:1 매칭, 증거 파일:라인)
- [x] T028 `docs/roadmap.md` §11 갱신 — `1 Layout Plus — 006 shell/table ☑` + Phase 1 전체 ☑

---

## Dependencies & Execution Order

- **Phase 1(T001~T003) → 다른 모든 Phase** — AppButton 이동·rename·import 갱신을 먼저 하지 않으면 빌드 깨짐
- T004 → T005 → T009·T010·T011·T012 (config/lookup → 사용처)
- T005 → T011·T012
- T006 → T007·T008 (래퍼 → TopNav 통합)
- T013 → T014·T015 (dropdown 통합 → 로그아웃)
- T016 → T017·T018·T019 (페이지네이션 + ForbiddenPage 액션)
- T003 → T019 (AppButton 사용 가능 후 005 잔여 교체)
- 모든 코드 → T025·T026
- T025·T026 → T027 → T028
- T024(수동 회귀)는 T006~T019 끝난 뒤 dev 진입 검증 단계
- `[P]` 끼리 병렬 가능

---

## Phase별 검증 게이트

- **Phase 1 끝**: `npm run verify` exit 0 + grep `from '@/components/Button'` 0건 + grep `from '@/components/AppIconButton'` 0건
- **Phase 2 끝**: getDiagnostics 0건 (sidebar.config.ts, menu-lookup.ts)
- **Phase 3 끝**: 단위 테스트 없음 — 시각 검증은 T024 수동 회귀
- **Phase 4 끝**: `Sidebar.test.tsx` green
- **Phase 5 끝**: `menu-lookup.test.ts` green
- **Phase 6 끝**: `ProfileBadge.test.tsx` green
- **Phase 7 끝**: `AppTable.test.tsx` green
- **Phase 10 끝**: `npm run verify` + `npm run test` exit 0 + 수동 회귀 결과 ✓

---

## DoD 대조표 (WF-4 세션 풀세트)

spec §5 17건 1:1 매칭. 증거는 파일:라인.

- [x] AdminMenus 추가 — src/components/layout/sidebar/sidebar.config.ts:53-71
- [x] Sidebar 영역 분기 — src/components/layout/sidebar/Sidebar.tsx:14-17 (`isAdminArea` 분기 + `ADMIN` 뱃지)
- [x] AppLayout `lg` 미만 분기 — src/components/layout/AppLayout.tsx:14-16 (`hidden lg:flex`)
- [x] MobileSidebar 햄버거 + Sheet — src/components/layout/sidebar/MobileSidebar.tsx:14-32
- [x] TopNav 메뉴명 동적 — src/components/layout/topnav/TopNav.tsx:17-18 (`getMenuTitle`)
- [x] menu-lookup 헬퍼 — src/components/layout/sidebar/menu-lookup.ts:11-29
- [x] ProfileBadge 드롭다운 + 로그아웃 — src/components/layout/topnav/ProfileBadge.tsx:28-33 (handleLogout)
- [x] AppTable 페이지네이션 UI(1-based) — src/components/AppTable.tsx:118-149 (TablePagination)
- [x] AppTable `pageSize` prop — src/components/AppTable.tsx:23,29
- [x] `Button.tsx` → `app/AppButton.tsx` 이동·rename — src/components/app/AppButton.tsx
- [x] `AppIconButton.tsx` → `app/AppIconButton.tsx` 이동 — src/components/app/AppIconButton.tsx
- [x] 11개 import grep 0건 — `@/components/Button` / `@/components/AppIconButton` 모두 0건
- [x] ForbiddenPage/NotFoundPage 액션 AppButton 교체 — src/pages/errors/ForbiddenPage.tsx:23, NotFoundPage.tsx:23
- [x] D1 §2-3 경로 갱신 + D1 Open Q 종결 — docs/design-system.md §2-3 (line 146), D1 §5 (line 229-238), Open Q (line 305)
- [x] layout.md §6 Open Q 3건 해소 — docs/layout.md §6 (line 254-256). 알림 시트 본문은 Phase 2로 이월 명시
- [x] components.md §10 Open Q 해소 — docs/components.md §12 (line 397), §9 규칙 (line 360)
- [x] MSW 첫 진입 절차 docs — README.md "개발 환경 첫 진입 (MSW 셋업)" 섹션
- [x] vitest 15+ case 추가 — menu-lookup(7) + Sidebar(2) + ProfileBadge(3) + AppTable(3) = 15건
- [x] `npm run verify` exit 0
- [x] `npm run test` 전체 통과 — 8 files / 28 tests passed
- [x] roadmap.md §11 갱신 — `006 shell/table ☑` + `1 Layout Plus (전체) ☑` 추가

---

## 다음 spec으로 이월

> 다음 spec(Phase 2 `007-공용-컴포넌트` 또는 Phase 3 첫 화면)의 `§0 Carry-over` 입력원.

- [ ] **006 수동 회귀 미실행** — `specs/phase1/006-shell-and-table/manual-regression.md` 작성만 완료. dev 진입 검증은 사용자가 별도 수행. 모바일 햄버거(US1), 본사 사이드바 분기(US2), TopNav 메뉴명(US3), ProfileBadge 로그아웃(US4), 403/404 액션 AppButton(US6) 등 17 case.
- [ ] **admin placeholder 라우트 / AdminLoginPage placeholder** — 005에서 등록한 임시. Phase 5 본사 영역 spec에서 실 화면으로 교체. `<RequireRoute>` 래핑은 유지.
- [ ] **AppTable 페이지네이션 URL 쿼리 연동** — 006에선 인터페이스 + UI만. Phase 3 첫 사용처(`/patrol/zones` 이력 필터)에서 `useQueryParams`와 통합.
- [ ] **알림 시트 본문** (layout.md §6 잔여 Open Q) — 알림 목록 형태(읽음/안읽음·시간) 정의 → Phase 2 공용 컴포넌트 확충
- [ ] **shadcn `ui/button.tsx` 완전 제거** (design-system.md D1 잔여) — dialog/sheet/alert-dialog 내부 의존 정리 → Phase 6 마감
- [ ] (004 이월 잔여 유지) AppInput → AppFormField 마이그(Phase 3 화면 spec), MSW 핸들러 도메인 이관(Phase 3+), `useQueryParams` zod 통합(Phase 3 첫 사용처), react-query 기본 옵션·MutationCache 우회(Phase 3), 다중 탭 토큰 동기화 등(백엔드 연동 시점)
- [ ] **Phase 1 종료** — 본 spec으로 Phase 1(005·006) 완료. 다음은 **Phase 2 — 공용 컴포넌트 확충** (AppSelect / AppDatePicker / dnd-kit / 알림 시트 본문 등).
