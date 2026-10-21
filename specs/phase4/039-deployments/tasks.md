# 039-deployments tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 038 이 **T626** 에서 끝났으므로 **T627** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **위험도 A → 잘게 쪼갠다**(`workflow-protocol.md` §2 — 검증·제출·에러 분리). 특히 **승인·거부(변경계)** 는
> 제출 / 성공 갱신 / 실패 처리를 따로 둔다. API 가 없으므로 **가정 계약**(spec §2-1) 위에서 만든다.

---

## Phase 1: Setup — 가정 계약 (모든 US 선행)

> **독립 테스트 기준**: 가정 타입이 `types/deployment.ts` **한 곳**에만 있고, 이력 파라미터 변환이 탭(`out`/`in`)을
> `direction`(0/1)으로, 페이지를 1-based 로 내보낸다.

- [ ] T627 🔴 **가정 계약 타입** in src/features/deployments/types/deployment.ts — `DeploymentRequestRow` · `DeploymentHistoryRow` · `DeploymentSummary` · 요청 파라미터 3종 · 승인/거부 요청 바디. 🔴 파일 머리에 **"가정 — 백엔드 구현 후 WF-1-0 으로 교정"** 과 요청서 링크를 박는다. ⚠️ 구 타입(`DeploymentRequestSummary`·`DeploymentHistoryItem`)은 **같은 파일에서 지우지 않는다** — 소비처를 옮긴 뒤 T650 에서
- [ ] T628 [P] 이력 방향·파라미터 변환 in src/features/deployments/lib/deploymentParams.ts — `?historyTab`(`out`/`in`, 그 외 `out`) → `direction` 0/1 · `?historyPage` → `pageNumber`. 헬퍼(`parsePageNumber`·`clampPageSize`)는 `course-history` **재사용**
- [ ] T629 [P] `deploymentKeys` in src/features/deployments/queryKeys.ts — `summary(siteSeq)` · `requests(params)` · `history(params)` + 무효화 접두사 `all(siteSeq)`. 🔴 승인·거부가 **셋을 한 번에** 무효화해야 하므로 공통 루트를 둔다(사이트 포함)
- [ ] T630 [P] API 5종 in src/features/deployments/api/ — `getDeploymentSummary.ts` · `getDeploymentRequestList.ts` · `getDeploymentHistory.ts` · `approveDeploymentRequest.ts` · `rejectDeploymentRequest.ts`. 경로는 가정(`/api/v1/Deployment/W/sign/...`) — 🔴 **경로 상수는 각 파일 1곳**(바뀌면 그 줄만)
- [ ] T631 [P] 파라미터 변환 테스트 in src/features/deployments/lib/__tests__/deploymentParams.test.ts

## Phase 2: Foundational — 상태 보유 MSW · 조회 훅

> **독립 테스트 기준**: MSW 에서 승인하면 **요청이 사라지고 · 이력(전입)에 1건 · 요약 `pendingCount -1`·`inCount +1`**,
> 거부하면 **요청만 사라지고 이력은 그대로**. 처리된 요청을 다시 처리하면 400 래퍼. 테스트마다 `reset` 된다.

- [ ] T632 🔴 **상태 보유 MSW** in src/mocks/handlers/deployments.ts · src/mocks/handlers/index.ts — 시드는 `deploymentData.ts` 를 가정 계약 형태로 옮긴다(사업장 7 기준: 대기 2 · 전출 1(배치 중) · 전입 2). 023 `courses.ts` 처럼 **store + `resetDeploymentStore()`**. 승인 = 요청 제거 + 이력 1건(`startDt` = 처리 시각, `endDt` null) · 거부 = 요청만 제거 · 없는/처리된 `requestSeq` = **400 + 래퍼 `"이미 처리된 요청입니다."`**(가정) · 요약은 **store 에서 계산**(따로 들고 있지 않는다 — 어긋나지 않게) · `pageSize` 상한 100
- [ ] T633 MSW reset 규약 in 각 테스트 파일 — 🔴 **`setup.ts` 에 두지 않는다**: 선례(`resetCourseStore`·`resetPointStore`)는 **상태를 바꾸는 테스트 파일의 `beforeEach`** 에서 부른다. 같은 방식으로 T635·T646 등 배치 테스트 파일에서 `resetDeploymentStore()` 를 부른다
- [ ] T634 [P] 조회 훅 3종 in src/features/deployments/hooks/ — `useDeploymentSummary` · `useDeploymentRequests` · `useDeploymentHistory`. `siteSeq` null 이면 요청 안 함
- [ ] T635 [P] 훅·MSW 테스트 in src/features/deployments/hooks/__tests__/deploymentQueries.test.tsx — 조회 3종 · 방향 필터 · 페이징 · `null` 미요청

## Phase 3: US1 — 현황 (KPI · 사이드바 뱃지 · 부제)

> **독립 테스트 기준**: KPI 3종이 요약 응답 숫자를 그리고, 요약만 실패하면 KPI 만 `-` 다. 사이드바 뱃지가 같은 숫자다.

- [ ] T636 [US1] KPI 재작성 in src/features/deployments/components/DeploymentKpiRow.tsx — `useDeploymentSummary`. 🔴 로딩은 스켈레톤, **실패는 값 `-`**(0 으로 그리지 않는다 — "대기 0건" 은 거짓 안심이다). `AppKpiCard` 그대로
- [ ] T637 [US1] 🔴 **사이드바 뱃지 전환** in src/components/layout/sidebar/sidebar.config.ts · src/components/layout/sidebar/RailSidebar.tsx — store `.getState()`·구독 제거 → `useDeploymentSummary(getSiteSeq())` 의 `pendingCount`. ⚠️ config 의 `badge: () => number` 는 **훅을 부를 수 없는 자리**다 — 뱃지 값을 RailSidebar 가 훅으로 받아 넘기는 구조로 바꾼다(형태는 코드를 보고 최소 변경으로)
- [ ] T638 [US1] 부제 in src/pages/service/deployments/DeploymentsPage.tsx — `useMe().locationName`(JWT 에 없다) → `getSiteName()`
- [ ] T639 [US1] [P] 테스트 in src/features/deployments/components/__tests__/DeploymentKpiRow.test.tsx · src/components/layout/sidebar/__tests__/ — KPI 숫자 · 요약 실패 시 `-` · 뱃지 = `pendingCount`(기존 사이드바 테스트가 있으면 갱신)

## Phase 4: US2 — 요청 목록 · 승인 · 거부 (🔴 A급 — 제출 / 갱신 / 실패 분리)

> **독립 테스트 기준**: 승인 → 행이 사라지고 KPI·뱃지·이력이 갱신된다. 거부 → 사유 필수, 성공 시 모달 닫힘, 이력 불변.
> 처리 중 버튼 비활성. 이미 처리된 요청 → 토스트 + 재조회. 거부 실패 → 모달 유지.

- [ ] T640 [US2] 요청 목록 재작성 in src/features/deployments/components/DeploymentRequestList.tsx — `useDeploymentRequests` + 서버 페이징(`?requestPage`). 상태 분기 4종(실패 다시 시도 · 로딩 · 0건 "대기 중인 요청이 없습니다" · 목록)
- [ ] T641 [US2] 요청 행 재작성 in src/features/deployments/components/DeploymentRequestRow.tsx — 가정 타입 필드(`userName` · `fromSiteName → toSiteName` · `requestTypeName` · `reason` · `requestDt`). 승인/거부 버튼 사이 간격 유지(되돌릴 수 없는 승인의 오클릭 방지 — spec §3)
- [ ] T642 [US2] 🔴 **승인 제출** in src/features/deployments/hooks/useApproveDeployment.ts — `useMutation`. **비옵티미스틱**(023 승계). 처리 중 그 행 두 버튼 `disabled`
- [ ] T643 [US2] 🔴 **성공 갱신** in src/features/deployments/hooks/useApproveDeployment.ts · src/features/deployments/hooks/useRejectDeployment.ts — `deploymentKeys.all(siteSeq)` 무효화(요약·요청·이력 한 번에) + 성공 토스트. 🔴 **마지막 행 처리 후 빈 페이지** → 이전 페이지로(spec §4)
- [ ] T644 [US2] 🔴 **실패 처리** in 같은 훅 — 서버 메시지 토스트(전역 에러 정규화 경로 확인 후 중복 토스트 방지) + **요청 목록 재조회**(이미 처리된 행 정리)
- [ ] T645 [US2] 거부 폼 전환 in src/features/deployments/form/RejectRequestForm.tsx · src/features/deployments/form/schema.ts — store → `useRejectDeployment`. 🔴 **성공해야 닫는다**(실패 시 모달·입력 유지, 029 규약). 사유 **트림 후 필수**. 처리 중 제출 버튼 비활성
- [ ] T646 [US2] [P] 🔴 **통합 테스트** in src/pages/service/deployments/__tests__/DeploymentsPage.test.tsx — MSW 상태 기준: 승인 → 행 사라짐·KPI 대기 -1·배치 온 +1·전입 이력 +1 · 거부 → 이력 불변 · 연타 시 요청 1회 · 처리된 요청 400 → 토스트 + 재조회 · 거부 500 → 모달 유지
- [ ] T647 [US2] [P] 폼 테스트 갱신 in src/features/deployments/form/__tests__/RejectRequestForm.test.tsx — 공백만 거부 · 성공 시 `onSuccess` · 실패 시 미호출

## Phase 5: US3 — 전출 / 전입 이력

> **독립 테스트 기준**: 탭이 `direction` 으로 서버에 나가고 `?historyTab`·`?historyPage` 가 보존된다. 기간·상태가 `endDt` 로 갈린다.

- [ ] T648 [US3] 이력 탭·컬럼 재작성 in src/features/deployments/components/DeploymentHistoryTabs.tsx · src/features/deployments/components/DeploymentHistoryColumns.tsx — `useDeploymentHistory(direction)` + 서버 페이징. 컬럼: 이름(아바타) · 배치 경로 · 사유 · 기간(`yyyy.MM ~ 현재|yyyy.MM`) · 상태(`배치중`/`복귀완료`). 🔴 정렬 off. 상태 분기 4종. 🔴 탭을 바꾸면 `historyPage` 를 지운다
- [ ] T649 [US3] [P] 테스트 갱신 in src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx — 방향 파라미터 · URL 보존 · `endDt` 분기 · 탭 전환 시 첫 페이지

## Phase 6: Polish

- [ ] T650 🔴 **삭제** in src/features/deployments/store/deploymentStore.ts (+ 테스트) · src/features/deployments/mocks/deploymentData.ts · 구 타입 2종 — grep 소비처 **0건** 후. `enum.ts` 의 `DeploymentDirection`·`DeploymentStatus`·라벨은 다른 소비처 확인 후 판단(`data-model.md` 설계 기록과 별개)
- [ ] T651 `npm run verify` 0 + `npm run test` green(1158 → 증가). 🔴 병렬 실행
- [ ] T652 🔴 **사용자 브라우저 확인**(mock — 실 API 없음) — 승인·거부·연타·이력 탭·사이드바 뱃지
- [ ] T653 `npm run capture` — `현장/deployments--대시보드` 교체. 나머지 바이트 대조만
- [ ] T654 문서 동기화 — docs/screens.md(§1-4A) · docs/flow.md(배치 흐름) · docs/data-model.md(배치 타입·엔드포인트 = 가정) · docs/api-spec.md(§6-5 "요청서 전달" 로) · docs/roadmap.md(039 행·§12) · docs/ui-current/README.md
- [ ] T655 DoD 20개 대조표 + `## 다음 spec으로 이월` in specs/phase4/039-deployments/tasks.md — 🔴 백엔드 구현 후 WF-1-0(가정 계약 교정) · 근무자 상세 배치 이력 카드 · OQ-039-A~D

---

## Dependencies & Execution Order

- **T627 → 나머지 전부** (가정 타입이 먼저)
- **T628·T629·T630** 은 T627 뒤 병렬. **T631** 은 T628 뒤
- **T632 → T635 · T639 · T646 · T649** (화면 테스트는 상태 보유 MSW 위에서 돈다 — 각 파일이 T633 규약대로 reset)
- **T634 → T636 · T637 · T640 · T648**
- **T642 → T643 → T644** 🔴 제출 → 갱신 → 실패 순(A급 분리). **T645 는 T643·T644 뒤**(같은 훅 규약)
- **T640·T641 → T646**
- **T650 은 Phase 3~5 뒤** — 삭제는 전환 후. 🔴 **T637 이 끝나기 전에는 store 를 지울 수 없다**(사이드바가 읽는다)
- Phase 3·4·5 는 T634 이후 **서로 독립 진행 가능**. Phase 6 은 모든 US 뒤
