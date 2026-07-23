# 007-redesign-foundation tasks

> 입력: [`spec.md`](./spec.md)
> 위험도 A — 잘게 분할(검증 지점 많이). "폰트/토큰" / "레이아웃 뼈대" / "사이드바" / "라우터 연결" / "회귀·문서" 따로.

---

## Phase 1: Setup

- [x] T001 [P] `@fontsource-variable/pretendard` 설치 + `@fontsource-variable/geist` 제거 in package.json, src/index.css:4
- [x] T002 [P] `paths.ts`에 `service.deployments: '/deployments'` 추가 in src/router/paths.ts

## Phase 2: Foundational (모든 US 선행 blocking)

토큰·설정이 준비돼야 레이아웃·사이드바 구현이 가능.

- [x] T003 `--font-sans`를 `'Pretendard Variable', sans-serif`로 교체 in src/index.css:13
- [x] T004 `--rail` / `--rail-2` 라이트+다크 정의 (다크 배경 고정값) in src/index.css `:root` + `.dark` 블록
- [x] T005 `@theme inline`에 `--color-rail: var(--rail)` / `--color-rail-2: var(--rail-2)` 연결 in src/index.css:11-75
- [x] T006 `sidebar.config.ts` — `ServiceMenus`를 `MenuItemType[]` 5개 flat으로 변경(순찰이력→코스/지점→근무자→배치관리→공지사항), `MenuItemType`에 `badge?: () => number` 필드 추가, 배치관리 항목에 `badge` 슬롯만 열어둠(값 미지정) in src/components/layout/sidebar/sidebar.config.ts
- [x] T007 `src/components/ui/tooltip.tsx` 신규 — `radix-ui` Tooltip 프리미티브 shadcn 패턴 래핑 in src/components/ui/tooltip.tsx

## Phase 3: US2 — 라우터 레벨 셸 분리 (개발자가 두 레이아웃 확인)

> **독립 테스트 기준**: `/admin/locations` 렌더 트리에 `AdminLayout`(Sidebar w-70 + TopNav)이, `/zones` 렌더 트리에 `ServiceLayout`(RailSidebar)이 사용됨을 라우터 정의 + 컴포넌트 테스트로 확인.

- [x] T008 [US2] `AdminLayout.tsx` 신규 — 기존 `AppLayout` 구조 이식(Sidebar+TopNav+`.app-shell`) in src/components/layout/AdminLayout.tsx
- [x] T009 [US2] `Sidebar.tsx` 단순화 — `isAdminArea` 분기·`ServiceMenus` 참조 제거, `AdminMenus` 고정 참조 유지(`ADMIN` 뱃지 유지) in src/components/layout/sidebar/Sidebar.tsx
- [x] T010 [US2] `ProfileBadge`에 `side`/`align` optional prop 추가(기본값 = 현재 TopNav 동작 유지) in src/components/layout/topnav/ProfileBadge.tsx
- [x] T011 [US2] `RailSidebar.tsx` 신규 — 68px 다크 sticky, 로고, 아이콘 5개 flat(`ServiceMenus` 순회), 활성 좌측 2px `border-accent` + `bg-rail-2`, hover 툴팁(T007 재사용), 하단 `ProfileBadge`(`side="right"`) in src/components/layout/sidebar/RailSidebar.tsx
- [x] T012 [US2] `ServiceLayout.tsx` 신규 — `RailSidebar` + 자연 스크롤 컨텐츠(`min-h-screen flex`, TopNav 없음) in src/components/layout/ServiceLayout.tsx
- [x] T013 [US2] `router/index.tsx` — `AuthGuard` 하위를 현장/본사 두 브랜치로 분리, 각각 `ServiceLayout`/`AdminLayout` 적용 in src/router/index.tsx
- [x] T014 [US2] `AppLayout.tsx` 제거 + `layout/index.ts` export 정리(`ServiceLayout`/`AdminLayout` export 추가) in src/components/layout/AppLayout.tsx, src/components/layout/index.ts
- [x] T015 [US2] `menu-lookup.ts`를 `AdminMenus` 전용으로 단순화(TopNav가 이제 AdminLayout 전용이므로 `ServiceMenus` 분기 제거) in src/components/layout/sidebar/menu-lookup.ts

## Phase 4: US3 — 본사 셸 무변화 검증

> **독립 테스트 기준**: `/admin/locations` 진입 시 기존 UI(사이드바 w-70 + TopNav + ADMIN 뱃지)가 006 스펙 상태와 시각적으로 동일.

- [x] T016 [US3] `Sidebar.test.tsx` 갱신 — 본사 전용 단순화 반영(ServiceMenus 분기 케이스 제거, AdminMenus 렌더 케이스만) in src/components/layout/sidebar/__tests__/Sidebar.test.tsx
- [x] T017 [US3] `menu-lookup.test.ts` 갱신 — 현장 경로 케이스 제거(더 이상 TopNav가 소비하지 않음), 본사 경로 케이스만 유지 in src/components/layout/sidebar/__tests__/menu-lookup.test.ts
- [x] T018 [US3] 수동 확인 — `/admin/locations` 시각·기능 무변화 in specs/phaseR/007-redesign-foundation/manual-regression.md

## Phase 5: US1 — 현장 셸 진입 검증

> **독립 테스트 기준**: 현장 라우트(`/zones`, `/points`, `/patrol/zones`, `/patrol/points`) 진입 시 68px 레일 렌더 + TopNav 없음 + 페이지 컨텐츠 원본 그대로 표시.

- [x] T019 [US1] `RailSidebar.test.tsx` 신규 — 아이콘 5개 렌더, 활성 판정(activeUrl), 프로필 아바타 존재 in src/components/layout/sidebar/__tests__/RailSidebar.test.tsx
- [x] T020 [US1] 수동 확인 — 현장 4개 라우트 진입 시 레일+자연스크롤 렌더링, 콘텐츠 원본 유지(009~015 전이므로 시각적 어색함은 허용, 렌더 오류만 체크) in specs/phaseR/007-redesign-foundation/manual-regression.md
- [x] T021 [US1] 수동 확인 — 프로필 아바타 클릭 → 드롭다운 우측 오픈 + 로그아웃 동작 in specs/phaseR/007-redesign-foundation/manual-regression.md

## Phase 6: Polish / 문서 동기화

- [x] T022 [P] `docs/layout.md` §6 Open Q "AppLayout 영역 분기 구현 방식" → 해소 표시(라우터 레벨 분리로 확정) in docs/layout.md
- [x] T023 [P] `docs/design-system.md` §1-1 "신설 필요 토큰" `--rail`/`--rail-2` → 해소 표시 in docs/design-system.md
- [x] T024 [P] `docs/design-system.md` D11 "로딩" 항목 — 실채택 방식(`@fontsource-variable/pretendard`) 반영 in docs/design-system.md
- [x] T025 [P] `docs/screens.md` §4 라우트 매핑에 `/deployments` 예약 표시(014에서 실 페이지 연결 예정 각주) in docs/screens.md
- [x] T026 manual-regression.md 작성(006 패턴 참고) in specs/phaseR/007-redesign-foundation/manual-regression.md
- [x] T027 `npm run verify` 통과 확인 — exit 0
- [x] T028 `npm run test` 신규 테스트 포함 전체 통과
- [x] T029 DoD 대조표 작성 in tasks.md 본 파일 맨 아래
- [x] T030 `docs/roadmap.md` §12 갱신 — `R Redesign — 007 foundation ☑`

---

## Dependencies & Execution Order

- T001 → T003 (패키지 설치 후 CSS 참조 교체)
- T003, T004, T005 → T011, T012 (토큰 준비 후 레일/서비스레이아웃 스타일링)
- T006 → T011, T015 (ServiceMenus 구조 변경 후 레일이 순회, menu-lookup 단순화)
- T007 → T011 (툴팁 프리미티브 → 레일 아이콘 사용)
- T002 → T006 (deployments 경로 상수 → 사이드바 config 참조)
- T008, T009 → T013 (AdminLayout·Sidebar 준비 후 라우터 연결)
- T010 → T011 (ProfileBadge prop 확장 → 레일에서 사용)
- T011, T012 → T013 (ServiceLayout·RailSidebar 준비 후 라우터 연결)
- T013 → T014 (라우터 전환 확인 후 구 AppLayout 제거 — 순서 뒤바뀌면 빌드 깨짐)
- T009 → T015 → T016, T017 (Sidebar 단순화 → menu-lookup 단순화 → 테스트 갱신)
- T013, T014 → T018, T019, T020, T021 (라우터 연결 완료 후 검증)
- 모든 코드 → T027, T028
- T027, T028 → T029 → T030
- `[P]` 끼리 병렬 가능

---

## Phase별 검증 게이트

- **Phase 1~2 끝**: `npm run verify` — index.css/paths.ts/sidebar.config.ts 타입 에러 0건
- **Phase 3 끝**: `npm run verify` exit 0 + grep `from '@/components/layout/AppLayout'` 0건
- **Phase 4 끝**: `Sidebar.test.tsx` + `menu-lookup.test.ts` green
- **Phase 5 끝**: `RailSidebar.test.tsx` green
- **Phase 6 끝**: `npm run verify` + `npm run test` exit 0 + manual-regression 결과 ✓

---

## DoD 대조표

spec §5 DoD 1:1 매칭. 증거는 파일:라인.

**폰트 / 토큰**

- [x] `@fontsource-variable/pretendard` 설치 — **정정**: 존재하지 않는 패키지명. 공식 `pretendard` 패키지로 대체(design-system.md D11 갱신) — package.json:36
- [x] `@fontsource-variable/geist` 제거 — package.json (dependencies에서 삭제 확인)
- [x] `--font-sans: 'Pretendard Variable', sans-serif` 교체 — src/index.css:13
- [x] `--rail`/`--rail-2` 라이트+다크 신설 — src/index.css:144-145(`:root`), :204-205(`.dark`)
- [x] `@theme inline`에 `--color-rail`/`--color-rail-2` 연결 — src/index.css:52-54
- [x] `bg-rail`/`bg-rail-2` 유틸 실적용 — src/components/layout/sidebar/RailSidebar.tsx:18,44(활성 스타일)

**라우터 / 레이아웃**

- [x] `ServiceLayout.tsx` 신규 — src/components/layout/ServiceLayout.tsx
- [x] `AdminLayout.tsx` 신규 — src/components/layout/AdminLayout.tsx
- [x] `router/index.tsx` 현장/본사 두 브랜치 분리 — src/router/index.tsx:41-96
- [x] 구 `AppLayout.tsx` 제거 + `index.ts` 정리 — src/components/layout/AppLayout.tsx(삭제), index.ts:1-4
- [x] **(spec 외 필연적 수정)** `AuthGuard.tsx`가 `<AppLayout/>` 직접 렌더하던 구조 → `<Outlet/>`로 변경 — src/router/guards/AuthGuard.tsx:35 (라우터 레벨 분기가 실제로 동작하려면 필수)

**사이드바**

- [x] `RailSidebar.tsx` 신규 — src/components/layout/sidebar/RailSidebar.tsx
- [x] 활성 스타일(좌측 2px + bg-rail-2 + 색상 승격) — RailSidebar.tsx:44
- [x] hover 툴팁(라벨 우측, 포커스 노출) — RailSidebar.tsx:47-49 + src/components/ui/tooltip.tsx(신규)
- [x] 프로필 아바타 → ProfileBadge 재사용 — RailSidebar.tsx:60 (`side="right"`)
- [x] `ServiceMenus` 5개 flat 전환 + `/deployments` 경로 예약 + `badge?` 인터페이스 — src/components/layout/sidebar/sidebar.config.ts:26-53, src/router/paths.ts:30
- [x] `Sidebar.tsx` 본사 전용 단순화 — src/components/layout/sidebar/Sidebar.tsx (isAdminArea 분기 제거)
- [x] `Sidebar.test.tsx` 갱신 — src/components/layout/sidebar/__tests__/Sidebar.test.tsx
- [x] **(spec 외 필연적 수정)** `menu-lookup.ts` Admin 전용 단순화(TopNav가 AdminLayout 전용이 되어 ServiceMenus 분기 dead code화) — src/components/layout/sidebar/menu-lookup.ts + menu-lookup.test.ts

**정책 / 회귀**

- [x] 현장 페이지 자연 스크롤 — ServiceLayout.tsx (`.app-shell` 미사용, `min-h-screen`)
- [x] 본사 셸 무변화 — manual-regression.md 케이스 6·7 ✓ (스크린샷 대조)
- [x] 로그인/랜딩/403/404 무영향 — layout 밖 라우트, 변경 없음
- [x] `paths.ts`에 `service.deployments` 추가 — src/router/paths.ts:30
- [x] `layout.md` §6 Open Q 해소 — docs/layout.md §1(재작성) + §6(line 352)
- [x] `design-system.md` §1-1 "신설 필요 토큰" 해소 — docs/design-system.md line 77
- [x] `design-system.md` D11 로딩 방식 갱신 — docs/design-system.md line 342
- [x] `npm run verify` — lint 0 errors(무관 warning 1건). **주의**: `npm run typecheck`(루트) 자체가 no-op 인프라 결함 발견 → `tsc --noEmit -p tsconfig.app.json`으로 직접 검증, 007 관련 에러 0건(무관 pre-existing 3건은 범위 밖, 별도 보고)
- [x] `npm run test` 전체 통과 — 9 files / 26 tests passed

**spec 외 추가 산출물**

- `screens.md` §4 라우트 매핑에 `/users`·`/deployments`·`/notice` 007 연결 상태 각주 추가
- `AuthGuard.test.tsx` 갱신(Outlet 기반 렌더로 assertion 변경)
- `RailSidebar.test.tsx` 신규(3 case)

**2차 수정 (사용자 제공 목업 CSS 반영, 2026-07-23)**

- [x] SP 로고 그라데이션 적용 — `bg-gradient-to-br from-point to-point-foreground` — RailSidebar.tsx:20
- [x] `.rail` 패딩 — `pt-[18px] pb-5` — RailSidebar.tsx:18
- [x] 메뉴 아이템 44×44 고정 + `rounded-[10px]` (기존 68px 풀블리드 방식에서 변경) — RailSidebar.tsx:41-44
- [x] 활성 아이템 배경 `bg-rail-2` 정확값 갱신(`oklch(0.29 0.02 262)`) — src/index.css:145,206
- [x] 비활성 아이콘 전용 토큰 `--rail-icon`(`oklch(0.62 0.02 260)`) 신설 — src/index.css:146,207 + `@theme inline`:55
- [x] 활성 좌측 액센트 바(3×18px, left:-10px, `bg-point` 재사용) — RailSidebar.tsx:46-48
- [x] `ProfileBadge`에 `variant="rail"` 추가 — 44px 박스(`bg-rail-2`+`border-white/6`+box-shadow) + 30px 그라데이션 이니셜 아바타 + 11px 온라인 dot(`bg-success`+`border-rail` 링) — ProfileBadge.tsx
- [x] Playwright 스크린샷 크롭 대조로 목업 스펙 일치 확인(44px 박스·30px 아바타·온라인 dot 위치)
- [x] `npm run verify`(lint+typecheck 007 범위) + `npm run test` 26/26 재통과 확인

---

## 다음 spec으로 이월

> 다음 spec(**008-redesign-shared-components**, R1)의 `§0 Carry-over` 입력원.

- [ ] **`npm run typecheck`(루트 `tsc --noEmit`) 사실상 no-op** — 루트 `tsconfig.json`이 `files: []` + project references 구조라 `-b` 없이는 아무 것도 검사 안 함. 실제 검사는 `tsc --noEmit -p tsconfig.app.json` 사용 필요. **007 범위 밖 — 별도 인프라 이슈로 사용자 보고 완료, 처리 spec 미정**(전체 프로젝트 영향이라 008보다는 다음 Foundation 성격 spec 또는 즉시 별도 처리 권장)
- [ ] **007 범위 밖 pre-existing 타입 에러 3건** — `src/features/points/components/detail/PointDetail.tsx:28`, `src/features/zone/components/zone-tree/PointNode.tsx:2`, `src/pages/service/patrol/zones/PatrolZonesPage.tsx:51`. 007에서 발견만 하고 미수정(A3 최소 변경) → 각 파일을 다루는 화면 spec(009 순찰이력-코스, 011 코스관리 등)에서 자연 수정 또는 위 typecheck 이슈 처리 시 함께
- [ ] **RailSidebar 배치관리 뱃지 미연결** — `badge?: () => number` 인터페이스만 존재, 실제 대기요청 카운트 연결은 **014-deployments**에서
- [ ] **`/users`·`/deployments`·`/notice` 라우트 미등록** — RailSidebar 링크는 걸려있으나 페이지·라우트 부재(클릭 시 404, 의도된 동작). 각각 **013/014/015**에서 실 라우트 연결
- [ ] (기존 이월 잔여, 007과 무관 — 계속 유지) 알림 시트 본문(Phase 2), shadcn `ui/button.tsx` 완전 제거(Phase 6), AppInput→AppFormField 마이그 잔여(Phase 3+), 본사 사이트 리디자인(별도 라운드)
- [ ] **DoD 미달 항목 없음** — spec §5 전 항목 [x] 완료 확인(위 DoD 대조표 참조)
