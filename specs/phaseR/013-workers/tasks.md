# 013-workers tasks

> 입력: `spec.md`. 위험도 B — 화면 단위로 크게 분할. 013은 기존 코드가 없는 완전 신규 화면이라 Phase 2(Foundational)에 타입/mock/컴포넌트 기반을 모아 US별 조립 부담을 줄인다.

---

## Phase 1: Setup

- [x] T051 [P] 아바타 전용 장식 팔레트 토큰 6종(`--avatar-1`~`--avatar-6`, light/dark) 추가 + `design-system.md` §1에 "상태 의미 없는 순수 장식용" 명시 in src/index.css, docs/design-system.md
- [x] T052 [P] `Worker`/`WorkerSummary`/`WorkerAssignmentHistoryItem` 타입 정의(data-model.md §3-1 기준, 화면 미표시 필드 제외) in src/features/workers/types/worker.ts

## Phase 2: Foundational (US1~US3 선행)

> **독립 테스트 기준**: `WorkerAvatar`가 같은 근무자에겐 항상 같은 팔레트 색을 렌더(해시 결정성). `WorkerColumns` 컬럼 정의가 목업 6개 컬럼(이름·연락처·소속 사업장·근무 상태·사용자 상태·등록일)에 대응. mock 데이터 8건(배치중 1건 포함) 로드 확인.

- [x] T053 근무자 mock 데이터 8건(배치중 1건·배치이력 포함) 작성 in src/features/workers/mocks/workerData.ts
- [x] T054 [P] `WorkerAvatar.tsx` — 이니셜 원형 아바타, id/name 해시로 `--avatar-1`~`--avatar-6` 순환 배정 in src/features/workers/components/WorkerAvatar.tsx
- [x] T055 `WorkerColumns.tsx` — `AppTable` 컬럼 정의(아바타+이름 / 연락처 / 소속 사업장+배치중 조건부 `AppBadge`(point) / 근무 상태 dot+라벨 / 사용자 상태 `AppBadge`(success/muted) / 등록일), 009 `ZoneColumn.tsx` 패턴 참고 in src/features/workers/components/WorkerColumns.tsx
- [x] T056 [P] `schema.ts` — 근무자 등록/수정 zod 스키마(이름/연락처/소속사업장/초기비밀번호, `features/points/form/schema.ts` 패턴) in src/features/workers/form/schema.ts

## Phase 3: US1 — 근무자 목록 + 상세 조회

> **독립 테스트 기준**: `/users` 접속 시 서브타이틀 "{사업장명} 소속 근무자 {N}명" 노출, 테이블에 8건 렌더, 행 클릭 시 우측 상세 패널이 해당 근무자 데이터로 갱신, 목록이 비면 `AppEmpty` 표시.

- [x] T057 [US1] `WorkerDetailPanel.tsx` — 헤더(아바타+이름+"{소속 사업장} · {역할}") + 기본정보(`AppDetailRow` 5행) + 배치 변경 이력(건수 뱃지 + dot 리스트, 이력 없으면 "이력 없음") 조립(액션 버튼은 Phase 4에서 연결) in src/features/workers/components/WorkerDetailPanel.tsx
- [x] T058 [US1] `UsersPage.tsx` — `AppPageHeader`(`useMe().locationName` 서브타이틀) + 검색 `AppInput`/`AppFilterButton` 2종(비와이어드) + `AppTable`+`AppPagination` + 우측 `WorkerDetailPanel`\|`AppEmpty` 조립, 선택 상태 `useState<Worker \| null>` in src/pages/service/users/UsersPage.tsx
- [x] T059 [US1] 라우터에 `/users` 페이지 연결(`paths.service.users`는 007에서 이미 예약) in src/router/index.tsx

## Phase 4: US2 — 상세 액션(비밀번호/수정/삭제)

> **독립 테스트 기준**: "수정" 클릭 → `EditWorkerForm` 모달 오픈, 필드 채워진 상태로 표시, 제출 시 스텁 처리. "비밀번호"/"근무자 삭제" 클릭 → 각각 확인 `AppAlertDialog` 오픈, 확인 시 스텁 처리. 소속 사업장은 두 모달 모두 읽기전용.

- [x] T060 [US2] `EditWorkerForm.tsx` — react-hook-form+zod, 소속 사업장은 `useMe().locationName` 읽기전용 표시, 제출은 `console.log` 스텁 in src/features/workers/form/EditWorkerForm.tsx
- [x] T061 [US2] `WorkerDetailPanel.tsx`에 액션 3버튼 연결 — "수정"(`AppDialog`+`EditWorkerForm`), "비밀번호"(`AppAlertDialog` 확인, 012 `PointDetail` 패턴), "근무자 삭제"(`AppAlertDialog` destructive) in src/features/workers/components/WorkerDetailPanel.tsx

## Phase 5: US3 — 근무자 추가

> **독립 테스트 기준**: 상단 "근무자 추가" 클릭 → 등록 모달 오픈, 소속 사업장이 현재 로그인 사업장으로 읽기전용 표시, 이름/연락처/초기비밀번호 미입력 시 zod 에러 노출, 제출 시 스텁 처리.

- [x] T062 [US3] `AddWorkerForm.tsx` — react-hook-form+zod, 소속 사업장 `useMe().locationName` 읽기전용, 제출은 `console.log` 스텁 in src/features/workers/form/AddWorkerForm.tsx
- [x] T063 [US3] `UsersPage.tsx` 상단 "근무자 추가" `AppButton`에 `AppDialog`+`AddWorkerForm` 연결 in src/pages/service/users/UsersPage.tsx

## Phase 6: Polish

- [x] T064 [P] vitest — `WorkerAvatar` 해시 결정성(동일 id → 동일 팔레트) 확인 in src/features/workers/components/__tests__/WorkerAvatar.test.tsx
- [x] T065 [P] vitest — `WorkerColumns`/테이블 렌더 시 배치중 뱃지 조건부 표시 확인 in src/features/workers/components/__tests__/WorkerColumns.test.tsx
- [x] T066 [P] vitest — `AddWorkerForm`/`EditWorkerForm` 필수값 누락 시 zod 에러 노출 확인 in src/features/workers/form/__tests__/WorkerForm.test.tsx
- [x] T067 [P] `docs/screens.md` §1-4 "근무자 목록 + 선택 근무자 상세" 진행도 ✗ → ✓ 갱신 in docs/screens.md
- [x] T068 [P] `docs/roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 013" 행 갱신 in docs/roadmap.md
- [x] T069 [P] 브라우저 확인 중 발견 — `AppFilterButton`(008 공용 컴포넌트) 라벨 줄바꿈 버그 수정(`shrink-0`+`whitespace-nowrap` 추가). 009/010에도 동일 적용되는 공용 컴포넌트 수정 in src/components/app/AppFilterButton.tsx

---

## Dependencies & Execution Order

- **T051, T052 병렬** — 서로 다른 파일, 선행 의존 없음.
- **T053 = T052 완료 후** — mock 데이터가 `Worker` 타입을 사용.
- **T054 = T051 완료 후** — 아바타 토큰이 있어야 `WorkerAvatar`가 참조 가능. T053과 병렬 가능.
- **T055 = T052 + T054 완료 후** — 컬럼 정의가 타입과 `WorkerAvatar`를 모두 사용.
- **T056 = T052와 병렬 가능** — 스키마는 mock/컬럼과 독립.
- **T057 = T053 + T055 완료 후** — 상세 패널이 mock 데이터 구조와 컬럼 정의(뱃지 매핑 재사용)를 참고.
- **T058 = T053, T055, T057 완료 후** — 페이지 조립에 목록·상세 모두 필요.
- **T059 = T058 완료 후** — 페이지가 완성돼야 라우팅 연결 의미가 있음.
- **T060 = T056 완료 후, T061 = T057 + T060 완료 후**.
- **T062 = T056 완료 후, T063 = T058 + T062 완료 후**.
- **T064 = T054 이후 / T065 = T055 이후 / T066 = T060 + T062 이후**.
- **T067, T068 = 모든 코드 태스크(T051~T063) 완료 후**.
- **세션 분할 권장**: 013은 신규 화면이라 Phase 1~2(기반)를 먼저 끝내고, Phase 3(US1) 완료 시점에 한 번 중간 점검(M4) 권장. Phase 4~6은 이어서 진행 가능(B급, 화면 단위 한 세션도 가능).

## 다음 spec으로 이월

> 다음 spec(**014-deployments**, R2-6, `/deployments`)의 `§0 Carry-over` 입력원.

- [ ] **배치 변경 이력 mock 통합** — 013은 `features/workers/mocks/workerData.ts`에 자체 `WorkerAssignmentHistoryItem` mock을 두고 있음. 014에서 배치 요청 승인 시 이 이력에 항목이 추가되는 흐름을 다루게 되면, 두 mock을 통합하거나 참조 관계를 정리할 필요 있음 → **014에서 처리**.
- [ ] **근무자 삭제 시 대기중 배치요청 영향 확인** — 013 spec Open Question. 대기 중인 배치 요청이 있는 근무자를 삭제할 때 큐에 미치는 영향은 미정 → **014에서 검토**.
- [ ] **비밀번호 초기화 실제 값 생성 방식** — 013 spec Open Question(서버 책임, 확인 모달 스텁까지만 구현). 014와 무관 → Phase 3 이후 유지.
- DoD 미달 항목 없음(013은 전 항목 완료 — `npm run verify` exit 0 · `npm run test` 22 files/71 tests 통과 · 브라우저 시각 확인 완료, 발견된 이슈 2건(아바타 텍스트색·필터버튼 줄바꿈) 모두 수정 완료).
