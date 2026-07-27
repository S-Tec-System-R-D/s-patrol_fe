# 014-deployments tasks

> 입력: `spec.md`. 위험도 A — 잘게 분할(검증 지점 분리). `/deployments`는 완전 신규 화면 + 신규 워크플로(mock 상태 실제 갱신)라 Phase 2(Foundational)에 타입/mock/store를 먼저 완성해 US별 조립 부담을 줄인다.

---

## Phase 1: Setup

- [x] T070 [P] `DeploymentDirection`/`DeploymentStatus` 타입 + 라벨 맵 추가(data-model.md §2-2 그대로) in src/types/enum.ts
- [x] T071 [P] `DeploymentRequestSummary`(+ `reason` 필드) / `DeploymentHistoryItem` 타입 정의 in src/features/deployments/types/deployment.ts
- [x] T072 [P] `rejectRequestSchema` zod 스키마(`reason` required) in src/features/deployments/form/schema.ts

## Phase 2: Foundational (US1~US4 선행)

> **독립 테스트 기준**: `useDeploymentStore`의 초기 상태가 mock 시드(대기 요청 2건, 이력 3건: 나간 1·온 2)와 일치. `approve(id)` 호출 시 해당 id가 `pendingRequests`에서 제거되고 `historyItems`에 1건 추가(`endedAt` 없음). `reject(id, reason)` 호출 시 `pendingRequests`에서만 제거되고 `historyItems`는 불변.

- [x] T073 배치 요청/이력 mock 시드 데이터 작성(목업 그대로 대기 요청 2건 + 배치 나간 이력 1건 + 배치 온 이력 2건 자체 구성) in src/features/deployments/mocks/deploymentData.ts — 사업장명은 실 `useMe()` mock값("강동 그랜드타워")에 맞춰 통일(구현 중 발견, spec.md §참고와 별개 이슈)
- [x] T074 `useDeploymentStore`(zustand) — state(`pendingRequests`/`historyItems`) + actions(`approve`/`reject`) in src/features/deployments/store/deploymentStore.ts

## Phase 3: US1 — KPI 표시

> **독립 테스트 기준**: `/deployments` 접속 시 KPI 3종이 초기값(배치 나간 1명 / 배치 온 2명 / 대기중 2건)으로 렌더, 서브타이틀에 `useMe().locationName` 반영.

- [x] T075 [US1] `DeploymentKpiRow.tsx` — `AppKpiCard` × 3, store에서 파생 계산(spec §3 공식 그대로) in src/features/deployments/components/DeploymentKpiRow.tsx
- [x] T076 [US1] `DeploymentsPage.tsx` — `AppPageHeader` + `DeploymentKpiRow` 조립 in src/pages/service/deployments/DeploymentsPage.tsx
- [x] T077 [US1] 라우터에 `/deployments` 페이지 연결(`paths.service.deployments`는 007에서 이미 예약) in src/router/index.tsx

## Phase 4: US2 — 배치 요청 승인

> **독립 테스트 기준**: "승인" 클릭 → 해당 row가 목록에서 사라짐 + KPI(배치 온 인원 +1, 대기중 -1) 즉시 갱신 + `toast.success` 노출.

- [x] T078 [US2] `DeploymentRequestRow.tsx` — 카드형 row(장식용 아이콘 아바타 + "{fromLocationName}·{workerName}" + "{toLocationName}로 배치 요청·사유:{reason}" + 요청일), "승인" 버튼 → `store.approve(id)` + toast in src/features/deployments/components/DeploymentRequestRow.tsx — AppButton에 success variant가 없어 기존 `default`(주요 액션) 사용으로 결정(design-system.md 매트릭스의 "승인=success"는 뱃지·상태 색 기준이며 버튼 variant 신설은 A6 범위 초과로 판단)
- [x] T079 [US2] `DeploymentRequestList.tsx` — `AppPagination` + `AppEmpty`(0건 시) 조립, `DeploymentsPage`에 연결 in src/features/deployments/components/DeploymentRequestList.tsx

## Phase 5: US3 — 배치 요청 거부

> **독립 테스트 기준**: "거부" 클릭 → 사유 입력 모달 오픈. 사유 미입력 제출 시 zod 에러로 차단. 사유 입력 후 확인 → 요청이 목록에서 사라짐 + KPI(대기중 -1) 갱신 + toast + 이력 탭엔 미반영(불변 확인).

- [x] T080 [US3] `RejectRequestForm.tsx` — react-hook-form+zod, textarea 1개(013 `EditWorkerForm` 패턴), 제출 시 `store.reject(id, reason)` + 모달 닫힘 + toast in src/features/deployments/form/RejectRequestForm.tsx
- [x] T081 [US3] `DeploymentRequestRow.tsx`에 "거부" 버튼(danger) 추가 → `AppDialog`+`RejectRequestForm` 연결 in src/features/deployments/components/DeploymentRequestRow.tsx

## Phase 6: US4 — 배치 이력 탭

> **독립 테스트 기준**: "배치 나간 이력"/"배치 온 이력" 클릭 시 `?historyTab=out|in` 쿼리스트링 반영 + 새로고침 시 유지. 컬럼(이름·배치 경로·사유·기간·상태)이 목업과 일치, 상태 배지 배치중=point/복귀완료=muted.

- [x] T082 [US4] `DeploymentHistoryColumns.tsx` — `AppTable` 컬럼 정의(이름=`WorkerAvatar`+텍스트 재사용, 배치 경로="A → B", 기간=013 `historyPeriod` 패턴, 상태=`AppBadge`) in src/features/deployments/components/DeploymentHistoryColumns.tsx
- [x] T083 [US4] `DeploymentHistoryTabs.tsx` — `ui/tabs` 2개 + `useQueryParams<'historyTab'>()` + `AppTable`+`AppPagination`, 로그인 사업장 기준으로 나간/온 런타임 필터링, `DeploymentsPage`에 연결 in src/features/deployments/components/DeploymentHistoryTabs.tsx

## Phase 7: 사이드바 대기건수 뱃지

> **독립 테스트 기준**: 대기 요청이 있을 때 RailSidebar 배치관리 아이콘에 dot+숫자 노출. `/deployments`에서 승인/거부 후 **페이지 이동 없이** 즉시 숫자가 갱신(또는 감소해 0이면 dot 숨김).

- [x] T084 `sidebar.config.ts` 배치관리 메뉴에 `badge: () => useDeploymentStore.getState().pendingRequests.length` 추가 in src/components/layout/sidebar/sidebar.config.ts
- [x] T085 `RailSidebar.tsx`에 `useDeploymentStore()` 구독 훅 1줄 추가(store 변경 시 재렌더 트리거 — 기존 `useLocation()`만으론 페이지 이탈 없이 뱃지 갱신 안 됨) in src/components/layout/sidebar/RailSidebar.tsx

## Phase 8: Polish

- [x] T086 [P] vitest — `useDeploymentStore` approve/reject 상태 전이(Phase 2 독립 테스트 기준 그대로) in src/features/deployments/store/__tests__/deploymentStore.test.ts
- [x] T087 [P] vitest — `RejectRequestForm` 사유 미입력 시 zod 에러 노출 in src/features/deployments/form/__tests__/RejectRequestForm.test.tsx
- [x] T088 [P] vitest — `DeploymentHistoryTabs` 탭 클릭 시 쿼리스트링 반영 in src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx
- [x] T089 [P] `docs/screens.md` §1-4A 진행도 갱신 + `docs/roadmap.md` §12 "R Redesign — 014" 행 갱신 + `docs/data-model.md` §3-1 `reason` 필드 추가 및 관련 Open Question 해소 in docs/screens.md, docs/roadmap.md, docs/data-model.md
- [x] T090 [P] 브라우저 확인 — 목업(`배치관리-신규.png`)과 시각 대조, 승인/거부/탭전환/사이드바 뱃지 실동작 확인 (M2). Playwright(msedge channel, 임시 설치·작업 종료 후 제거)로 실 브라우저 재현 — 아래 T091~T093 발견·수정
- [x] T091 [P] 사용자 피드백 — RailSidebar 대기건수 뱃지 텍스트 색상 대비 문제 수정(`text-danger-foreground`(짙은 빨강, 빨강 배경과 대비 부족) → `text-white`) in src/components/layout/sidebar/RailSidebar.tsx
- [x] T092 [P] 사용자 피드백 — 배치 이력 탭 명칭 변경("배치 나간 이력"/"배치 온 이력" → "전출 이력"/"전입 이력") in src/features/deployments/components/DeploymentHistoryTabs.tsx, src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx, docs/screens.md, specs/phaseR/014-deployments/spec.md
- [x] T093 **버그 수정** — 사용자 피드백("이력 탭 연속 클릭 또는 승인 클릭 시 브라우저 멈춤") 재현 후 원인 확인: `DeploymentHistoryTabs`의 `outHistory`/`inHistory`가 렌더마다 `.filter()`로 새 배열 참조를 생성 → `AppTable`(`@tanstack/react-table`) 컨트롤드 페이지네이션과 결합해 실 브라우저에서만 무한 재렌더 루프 발생(jsdom 테스트로는 재현 안 됨, Playwright 실브라우저 재현으로 확인). `useMemo([historyItems, locationName])`로 배열 참조 안정화하여 해결 in src/features/deployments/components/DeploymentHistoryTabs.tsx

---

## Dependencies & Execution Order

- **T070, T071, T072 병렬** — 서로 다른 파일, 선행 의존 없음.
- **T073 = T071 완료 후** — mock이 타입을 사용.
- **T074 = T071 + T073 완료 후** — store가 타입/시드 데이터를 사용.
- **T075 = T074 완료 후** — KPI가 store 파생값을 읽음.
- **T076 = T075 완료 후, T077 = T076 완료 후**.
- **T078 = T074(+토스트 헬퍼) 완료 후, T079 = T078 완료 후**. Phase 4는 Phase 3 완료 후 이어서 진행(같은 페이지 조립).
- **T080 = T072 완료 후, T081 = T074 + T080 완료 후**. Phase 5는 Phase 4와 순차(같은 컴포넌트 `DeploymentRequestRow`를 이어서 수정).
- **T082 = T070 완료 후(라벨/뱃지 참조), T083 = T074 + T082 완료 후**. Phase 6은 Phase 3~5와 독립적으로 병렬 착수 가능(다른 컴포넌트 트리).
- **T084, T085 = T074 완료 후** — store가 있어야 뱃지 연동 가능. Phase 3~6과 독립적으로 아무 때나 가능하나, 실제 확인(T090)은 Phase 4~5 완료 후 의미 있음.
- **T086 = T074 이후 / T087 = T080 이후 / T088 = T083 이후**.
- **T089, T090 = 모든 코드 태스크(T070~T085) 완료 후**.
- **세션 분할 권장**: A급이라 Phase 1~2(기반: 타입/mock/store)를 먼저 끝내고 M3(vitest)로 store 로직을 검증한 뒤, Phase 3(US1) 완료 시점에 M4 중간 점검. Phase 4~5(승인/거부, 상호 의존)는 한 세션, Phase 6(이력 탭)과 Phase 7(사이드바)은 서로 독립이라 별도 세션 또는 이어서 진행 가능.

## 다음 spec으로 이월

> 다음 spec(**015-notice**, R2-7, `/notice`)의 `§0 Carry-over` 입력원.

- [ ] **거부된 요청(REJECTED)의 이력 노출 여부** — 014 Open Question. `/notice`와 무관 → 실 API 연동 단계(Phase 3 이후)로 재이월, 015에서 다룰 필요 없음.
- [ ] **근무자 삭제 시 대기중 배치요청 영향** — 013→014 이월분, 여전히 미해결. `/notice`와 무관 → 실 API 연동 단계로 계속 이월.
- [ ] **비밀번호 초기화 실제 값 생성 방식** — 013 Open Question. `/notice`와 무관 → Phase 3 이후 유지.
- [ ] **`AppTable` `data` prop 불안정 참조 → 실 브라우저 무한 재렌더 위험(014 T093)** — `docs/components.md` §9에 주의사항 추가 완료. 015에서 `AppTable`을 새로 쓴다면(공지 목록) `data`를 파생 배열로 넘길 경우 반드시 `useMemo`로 감쌀 것 — **015에서 유의**.
- DoD 미달 항목 없음(014는 전 항목 완료 — `npm run verify` exit 0 · `npm run test` 25 files/77 tests 통과 · 브라우저(Playwright+msedge) 실동작 확인 완료, 발견된 이슈 3건(사이드바 뱃지 대비·탭 명칭·무한 재렌더 버그) 모두 수정 완료).
