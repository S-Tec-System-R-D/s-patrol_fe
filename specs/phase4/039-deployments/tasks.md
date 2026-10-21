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

- [x] T627 🔴 **가정 계약 타입** in src/features/deployments/types/deployment.ts — `DeploymentRequestRow` · `DeploymentHistoryRow` · `DeploymentSummary` · 요청 파라미터 3종 · 승인/거부 요청 바디. 🔴 파일 머리에 **"가정 — 백엔드 구현 후 WF-1-0 으로 교정"** 과 요청서 링크를 박는다. ⚠️ 구 타입(`DeploymentRequestSummary`·`DeploymentHistoryItem`)은 **같은 파일에서 지우지 않는다** — 소비처를 옮긴 뒤 T650 에서
- [x] T628 [P] 이력 방향·파라미터 변환 in src/features/deployments/lib/deploymentParams.ts — `?historyTab`(`out`/`in`, 그 외 `out`) → `direction` 0/1 · `?historyPage` → `pageNumber`. 헬퍼(`parsePageNumber`·`clampPageSize`)는 `course-history` **재사용**
- [x] T629 [P] `deploymentKeys` in src/features/deployments/queryKeys.ts — `summary(siteSeq)` · `requests(params)` · `history(params)` + 무효화 접두사 `all(siteSeq)`. 🔴 승인·거부가 **셋을 한 번에** 무효화해야 하므로 공통 루트를 둔다(사이트 포함)
- [x] T630 [P] API 5종 in src/features/deployments/api/ — `getDeploymentSummary.ts` · `getDeploymentRequestList.ts` · `getDeploymentHistory.ts` · `approveDeploymentRequest.ts` · `rejectDeploymentRequest.ts`. 경로는 가정(`/api/v1/Deployment/W/sign/...`) — 🔴 **경로 상수는 각 파일 1곳**(바뀌면 그 줄만)
- [x] T631 [P] 파라미터 변환 테스트 in src/features/deployments/lib/__tests__/deploymentParams.test.ts

## Phase 2: Foundational — 상태 보유 MSW · 조회 훅

> **독립 테스트 기준**: MSW 에서 승인하면 **요청이 사라지고 · 이력(전입)에 1건 · 요약 `pendingCount -1`·`inCount +1`**,
> 거부하면 **요청만 사라지고 이력은 그대로**. 처리된 요청을 다시 처리하면 400 래퍼. 테스트마다 `reset` 된다.

- [x] T632 🔴 **상태 보유 MSW** in src/mocks/handlers/deployments.ts · src/mocks/handlers/index.ts — 시드는 `deploymentData.ts` 를 가정 계약 형태로 옮긴다 — 🔴 **계획 수정**: 014 시드는 오준혁을 "강동 → 강서 전출" 로 뒀는데 **근무자 mock(038)은 그를 강서 소속으로 배치 온 사람**(`originSiteSeq 12`)으로 둔다. 두 화면이 같은 사람을 반대로 말하지 않게 **전입**으로 바꿨다 → 대기 2 · 전출 2(배치 중 1 · 복귀 1) · 전입 2(배치 중 1 = 오준혁 · 복귀 1) · 요약 **나간 1 · 온 1 · 대기 2**(KPI 가 "온 2명" 에서 1명으로 바뀐다). 023 `courses.ts` 처럼 **store + `resetDeploymentStore()`**. 승인 = 요청 제거 + 이력 1건(`startDt` = 처리 시각, `endDt` null) · 거부 = 요청만 제거 · 없는/처리된 `requestSeq` = **400 + 래퍼 `"이미 처리된 요청입니다."`**(가정) · 요약은 **store 에서 계산**(따로 들고 있지 않는다 — 어긋나지 않게) · `pageSize` 상한 100
- [x] T633 MSW reset 규약 in 각 테스트 파일 — 🔴 **`setup.ts` 에 두지 않는다**: 선례(`resetCourseStore`·`resetPointStore`)는 **상태를 바꾸는 테스트 파일의 `beforeEach`** 에서 부른다. 같은 방식으로 T635·T646 등 배치 테스트 파일에서 `resetDeploymentStore()` 를 부른다
- [x] T634 [P] 조회 훅 3종 in src/features/deployments/hooks/ — `useDeploymentSummary` · `useDeploymentRequests` · `useDeploymentHistory`. `siteSeq` null 이면 요청 안 함
- [x] T635 [P] 훅·MSW 테스트 in src/features/deployments/hooks/__tests__/deploymentQueries.test.tsx — 조회 3종 · 방향 필터 · 페이징 · `null` 미요청

## Phase 3: US1 — 현황 (KPI · 사이드바 뱃지 · 부제)

> **독립 테스트 기준**: KPI 3종이 요약 응답 숫자를 그리고, 요약만 실패하면 KPI 만 `-` 다. 사이드바 뱃지가 같은 숫자다.

- [x] T636 [US1] KPI 재작성 in src/features/deployments/components/DeploymentKpiRow.tsx — `useDeploymentSummary`. 🔴 로딩은 스켈레톤, **실패는 값 `-`**(0 으로 그리지 않는다 — "대기 0건" 은 거짓 안심이다). `AppKpiCard` 그대로
- [x] T637 [US1] 🔴 **사이드바 뱃지 전환** in src/components/layout/sidebar/sidebar.config.ts · src/components/layout/sidebar/RailSidebar.tsx — store `.getState()`·구독 제거 → `useDeploymentSummary(getSiteSeq())` 의 `pendingCount`. ⚠️ config 의 `badge: () => number` 는 **훅을 부를 수 없는 자리**다 — 뱃지 값을 RailSidebar 가 훅으로 받아 넘기는 구조로 바꾼다(형태는 코드를 보고 최소 변경으로) — ✅ config 의 `badge` 를 **함수 → 키**(`'deploymentPending'`)로 바꾸고 `RailSidebar` 가 `useDeploymentSummary` 로 센다. 실패·로딩이면 뱃지 없음
- [x] T638 [US1] 부제 in src/pages/service/deployments/DeploymentsPage.tsx — `useMe().locationName`(JWT 에 없다) → `getSiteName()`
- [x] T639 [US1] [P] 테스트 in src/features/deployments/components/__tests__/DeploymentKpiRow.test.tsx · src/components/layout/sidebar/__tests__/ — KPI 숫자 · 요약 실패 시 `-` · 뱃지 = `pendingCount`(기존 사이드바 테스트가 있으면 갱신)

## Phase 4: US2 — 요청 목록 · 승인 · 거부 (🔴 A급 — 제출 / 갱신 / 실패 분리)

> **독립 테스트 기준**: 승인 → 행이 사라지고 KPI·뱃지·이력이 갱신된다. 거부 → 사유 필수, 성공 시 모달 닫힘, 이력 불변.
> 처리 중 버튼 비활성. 이미 처리된 요청 → 토스트 + 재조회. 거부 실패 → 모달 유지.

- [x] T640 [US2] 요청 목록 재작성 in src/features/deployments/components/DeploymentRequestList.tsx — `useDeploymentRequests` + 서버 페이징(`?requestPage`). 상태 분기 4종(실패 다시 시도 · 로딩 · 0건 "대기 중인 요청이 없습니다" · 목록)
- [x] T641 [US2] 요청 행 재작성 in src/features/deployments/components/DeploymentRequestRow.tsx — 가정 타입 필드(`userName` · `fromSiteName → toSiteName` · `requestTypeName` · `reason` · `requestDt`). 승인/거부 버튼 사이 간격 유지(되돌릴 수 없는 승인의 오클릭 방지 — spec §3)
- [x] T642 [US2] 🔴 **승인 제출** in src/features/deployments/hooks/useApproveDeployment.ts — `useMutation`. **비옵티미스틱**(023 승계). 처리 중 그 행 두 버튼 `disabled`
- [x] T643 [US2] 🔴 **성공 갱신** in src/features/deployments/hooks/useApproveDeployment.ts · src/features/deployments/hooks/useRejectDeployment.ts — `deploymentKeys.all(siteSeq)` 무효화(요약·요청·이력 한 번에) + 성공 토스트. 🔴 **마지막 행 처리 후 빈 페이지** → 이전 페이지로(spec §4)
- [x] T644 [US2] 🔴 **실패 처리** in 같은 훅 — ✅ 확인: 전역 `MutationCache.onError`(`queryClient.ts`)가 이미 서버 메시지로 토스트한다 → **훅에서는 띄우지 않는다**(중복 방지). 성공·실패 모두 `onSettled` 에서 `all(siteSeq)` 무효화 — 원래 계획: 서버 메시지 토스트(전역 에러 정규화 경로 확인 후 중복 토스트 방지) + **요청 목록 재조회**(이미 처리된 행 정리)
- [x] T645 [US2] 거부 폼 전환 in src/features/deployments/form/RejectRequestForm.tsx · src/features/deployments/form/schema.ts — store → `useRejectDeployment`. 🔴 **성공해야 닫는다**(실패 시 모달·입력 유지, 029 규약). 사유 **트림 후 필수**. 처리 중 제출 버튼 비활성
- [x] T646 [US2] [P] 🔴 **통합 테스트** — ⚠️ "승인 → 전입 이력 +1" 은 이력이 아직 store 라 **T649 로 옮겼다**. 빈 페이지 방지 1건 추가 — in src/pages/service/deployments/__tests__/DeploymentsPage.test.tsx — MSW 상태 기준: 승인 → 행 사라짐·KPI 대기 -1·배치 온 +1·전입 이력 +1 · 거부 → 이력 불변 · 연타 시 요청 1회 · 처리된 요청 400 → 토스트 + 재조회 · 거부 500 → 모달 유지
- [x] T647 [US2] [P] 폼 테스트 갱신 in src/features/deployments/form/__tests__/RejectRequestForm.test.tsx — 공백만 거부 · 성공 시 `onSuccess` · 실패 시 미호출

## Phase 5: US3 — 전출 / 전입 이력

> **독립 테스트 기준**: 탭이 `direction` 으로 서버에 나가고 `?historyTab`·`?historyPage` 가 보존된다. 기간·상태가 `endDt` 로 갈린다.

- [x] T648 [US3] 이력 탭·컬럼 재작성 in src/features/deployments/components/DeploymentHistoryTabs.tsx · src/features/deployments/components/DeploymentHistoryColumns.tsx — `useDeploymentHistory(direction)` + 서버 페이징. 컬럼: 이름(아바타) · 배치 경로 · 사유 · 기간(`yyyy.MM ~ 현재|yyyy.MM`) · 상태(`배치중`/`복귀완료`). 🔴 정렬 off. 상태 분기 4종. 🔴 탭을 바꾸면 `historyPage` 를 지운다
- [x] T649 [US3] [P] 테스트 갱신 in src/features/deployments/components/__tests__/DeploymentHistoryTabs.test.tsx — 방향 파라미터 · URL 보존 · `endDt` 분기 · 탭 전환 시 첫 페이지

### Phase 5 사용자 수정 (2026-10-21)

- [x] ~~T649a~~ (T649g 에서 대체 — 페이지 탭으로) [US3] 이력 탭을 **필터 컨트롤 모양으로** in src/features/deployments/components/DeploymentHistoryTabs.tsx — 크기(`h-8`)·테두리·아이콘(16px 반투명, **`SquareArrowRightExit` 전출 / `SquareArrowRightEnter` 전입** — 사용자 선택)·선택 톤(`border-point bg-point-bg`)을 `AppSelect` 와 맞췄다. 셀렉트가 아니라 **radix 탭 그대로**(키보드·ARIA). 공용 `ui/tabs` 는 건드리지 않고 이 화면에서 클래스만 덮었다(소비처가 여기 하나)
- [x] T649b [US2] 요청 행 버튼을 **필터와 같은 높이(`h-8`)** in src/features/deployments/components/DeploymentRequestRow.tsx — 기본 버튼(`py-2`)이 카드 행보다 무거웠다. 아이콘 14px

- [x] T649c [US1] KPI 나간·온 아이콘을 탭과 같은 `SquareArrowRightExit`/`Enter` 로 in src/features/deployments/components/DeploymentKpiRow.tsx
- [x] T649d [US2] 요청 행에서 **사업장과 사유를 분리** in src/features/deployments/components/DeploymentRequestRow.tsx — 전에는 `A → B · 사유: …` 한 줄이라 이어져 읽혔다. 사업장은 **회색 뱃지 2개 + 화살표**, 배치/복귀는 **포인트 뱃지**(종류라 사업장과 구분), 사유는 **가운데 칸**(작은 "사유" 라벨 + 본문, 넘치면 말줄임 + `title`)

- [x] T649e [US2] 🔴 **요청 목록을 카드형 → 표로** in src/features/deployments/components/DeploymentRequestColumns.tsx · DeploymentRequestActions.tsx(← `DeploymentRequestRow.tsx` 이름 변경) · DeploymentRequestList.tsx — 사용자 결정. 카드 행이 이미 근무자 · 구분 · 경로 · 사유 · 요청일 · 액션의 **열 구조**였다(사유 칸 정렬을 위해 폭을 고정한 것이 신호). 액션은 행마다 mutation 을 들어야 해 **셀이 아니라 컴포넌트**. 처리할 일이라는 강조는 액션 칸과 KPI(주황)가 맡는다. 014 의 "마스터-디테일 폐기" 근거는 그대로(상세 없음)
- [x] T649f [US2·US3] 🔴 **경로 표기 `SiteRoute`** in src/features/deployments/components/SiteRoute.tsx — 도착 사업장 **진하게 + 굵게**, 출발은 회색(사용자 요청). 요청 표와 이력 표가 같은 컴포넌트를 쓴다

- [x] T649g [US2·US3] 🔴 **섹션 박스 제거 · 탭 3개 + 표 1개** in src/features/deployments/components/DeploymentBoard.tsx(신설) · DeploymentKpiRow.tsx · lib/deploymentParams.ts · pages/service/deployments/DeploymentsPage.tsx — 사용자 결정. 요청 목록이 표가 되면서(T649e) 세 목록의 공통 칸이 같아져 **끝 칸만** 탭별로 바뀐다. 레이아웃은 다른 목록 화면 틀(헤더 → KPI → 탭 → 표 → 페이지네이션). ① 탭은 순찰이력·코스/지점과 같은 **밑줄형 페이지 탭**(쿼리라 링크가 아니라 `role=tab` 버튼) — 필터형 탭(T649a)을 대체 ② **기본 탭 = 배치 요청** + 대기 건수 뱃지(014 "요청 우선" 을 탭 순서·숫자로) ③ **활성 탭의 쿼리만** 요청 ④ URL `?tab=requests|out|in` + `?page` 하나(`requestPage`·`historyPage`·`historyTab` 폐기) ⑤ 🔴 **KPI 카드 클릭 → 해당 탭**(나간 ↔ 전출 · 온 ↔ 전입 · 대기 ↔ 요청 — 014 의 "클릭 시 스크롤 미구현" 자리). `AppKpiCard` 는 손대지 않고 버튼으로 감쌌다. `DeploymentRequestList`·`DeploymentHistoryTabs` 삭제 · 테스트 재배치(`DeploymentBoard.test.tsx` 8 · KPI→탭 1). ⚠️ `AppTable.tsx` 주석의 `DeploymentHistoryTabs` 언급은 T654 에서 정리

- [x] T649h [US1·US3] 🔴 **이력 상태 필터 + KPI → 탭·배치중** in types/deployment.ts · lib/deploymentParams.ts · DeploymentBoard.tsx · DeploymentKpiRow.tsx · mocks/handlers/deployments.ts · docs/api-request-deployment.md — 사용자 지적: KPI 는 **지금** 나가/와 있는 **인원**, 탭은 **기록**(복귀 포함)이라 "1명" 을 눌러 2건이 나왔다. 사용자 결정(B안): KPI 유지 + 이력 탭에 **상태 필터**(전체/배치중/복귀완료, `?status=active|returned`) + KPI 클릭 시 **해당 탭 + 배치중** → 숫자와 행 수가 맞는다. 탭 숫자는 **배치 요청에만**(이력 탭에 현재 인원을 달면 "이력 n건" 으로 읽힌다). 가정 계약에 `status`(0 배치 중 / 1 복귀 완료) 추가 · 요청서 4·5번에 상태 필터 한 줄. 탭 전환 시 상태 필터도 지운다. 필터 0건은 "조건에 맞는 이력이 없습니다". 테스트 5건(+ KPI→탭 행 수 단언)

- [x] T649i [US1] KPI 를 **한 줄 얇게** in src/components/app/AppKpiCard.tsx · DeploymentKpiRow.tsx — 사용자 요청(넓은 폭에서 숫자 하나에 카드가 너무 두껍다). 🔴 **공용 카드에 opt-in `inline`** 을 열었다(`[아이콘] 라벨 · 보조 ··· 값 단위`) — 주지 않은 소비처 5곳은 무변화. 이 모드는 `bar`·`foot`·`badge` 를 그리지 않는다(값 하나만 말한다). ⚠️ T654 에서 `components.md` AppKpiCard 에 `inline` 추가

## Phase 6: Polish

- [x] T650 🔴 **삭제** — ✅ `store/`(+ 테스트) · `mocks/` · 구 타입 2종 · `enum.ts` 의 `DeploymentDirection`·`DeploymentStatus`·라벨 2종(구 타입만 썼다 — 가정 계약의 정수 코드로 대체). 원래 경로 in src/features/deployments/store/deploymentStore.ts (+ 테스트) · src/features/deployments/mocks/deploymentData.ts · 구 타입 2종 — grep 소비처 **0건** 후. `enum.ts` 의 `DeploymentDirection`·`DeploymentStatus`·라벨은 다른 소비처 확인 후 판단(`data-model.md` 설계 기록과 별개)
- [x] T651 `npm run verify` 0 + `npm run test` green(1158 → **1196**, 107 files). 🔴 병렬 실행
- [~] T652 🔴 **사용자 브라우저 확인**(mock — 실 API 없음) — 승인·거부·연타·이력 탭·사이드바 뱃지 — ◩ **화면은 Phase 5 이후 사용자가 캡쳐·화면으로 확인하며 재구성 9건(T649a~i)을 냈다.** ⚠️ dev 서버에서 **승인·거부를 직접 눌러 본 확인**은 아직이다(동작은 통합 테스트가 본다)
- [x] T653 `npm run capture` — `현장/deployments--대시보드` 교체. 나머지 바이트 대조만 — 10 동일 · 지도 3 · 🔴 `users--상세` **2×3 픽셀**(카드 모서리 안티앨리어싱, 노이즈) — 덮지 않았다
- [x] T654 문서 동기화 — ✅ + docs/components.md(`AppKpiCard inline`) · `AppTable.tsx` 주석(030 근거의 바뀐 이름) · docs/screens.md(§1-4A) · docs/flow.md(배치 흐름) · docs/data-model.md(배치 타입·엔드포인트 = 가정) · docs/api-spec.md(§6-5 "요청서 전달" 로) · docs/roadmap.md(039 행·§12) · docs/ui-current/README.md
- [x] T655 DoD 20개 대조표 + `## 다음 spec으로 이월` in specs/phase4/039-deployments/tasks.md — 🔴 백엔드 구현 후 WF-1-0(가정 계약 교정) · 근무자 상세 배치 이력 카드 · OQ-039-A~D

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

### 종료 후 후속 — 배치 로직 반영 (2026-10-21)

- [x] T656 🔴 **배치 로직 반영**(사용자 정리) in types/deployment.ts · mocks/handlers/deployments.ts · DeploymentRequestColumns.tsx · DeploymentHistoryColumns.tsx · DeploymentBoard.tsx · DeploymentEndDateAction.tsx(신설) · hooks/useUpdateDeploymentEndDate.ts(신설) · api/updateDeploymentEndDate.ts(신설) · lib/deploymentPeriod.ts(신설) · lib/deploymentParams.ts · docs/api-request-deployment.md — 로직: ① 근무자가 앱에서 **사업장 · 시작일 · 종료일(선택) · 사유**로 요청 ② 목적지 현장관리자가 승인·거부 ③ 승인하면 이력에 ④ 종료일 미입력·조기 복귀 시 **관리자가 복귀일 지정**.
  - 🔴 **"복귀 요청" 은 없다** — 014 목업의 배치/복귀 구분(`requestType`)과 "구분" 칸을 지웠다(사용자 지적: 그런 기능을 말한 적이 없다)
  - 요청 표에 **배치 기간**(`시작 ~ 종료` / 종료 없으면 **`미정`** — `현재` 가 아니다)
  - 승인 → 이력 기간 = 요청의 시작일·종료일
  - 🔴 **상태 3종을 서버가 날짜로 계산한다고 가정**: 배치예정(시작 전) · 배치중 · 복귀완료(종료일이 **지나면** — 당일은 배치중). 종료일이 미래일 수 있게 되어 `endDt` 유무만으로는 판단할 수 없다. KPI 현재 인원은 **배치중만**. 상태 필터에 배치예정 추가(`?status=scheduled`)
  - 🔴 **전입 이력의 복귀 전 행 오른쪽에 아이콘 버튼 → 달력 모달**(목적지 관리자 — 사용자 결정). 전출은 보기만. 시작일 전 날은 막는다. 미정이면 **이번 달로** 연다(시작월로 열면 오래 배치된 사람의 조기 복귀를 고르려 여러 번 넘겨야 한다)
  - 요청서: 1번 시작일·종료일, 4·5번 상태 3종, 7번 배치중만 센다, **8번 복귀일 지정 API**
  - MSW 시드: 최범수 = 종료일 있는 앞으로의 배치(승인 시 배치예정) · 배수진 = 종료일 미정. 테스트 +7 · 기존 3건 기대값 갱신(배치예정은 현재 인원이 아니라 승인 대상을 배수진으로)

- [x] T657 탭 순서 **배치 요청 · 전입 이력 · 전출 이력** · 대기 건수 뱃지를 **사이드바와 같은 빨강**(`bg-danger` + 흰 글자) in src/features/deployments/components/DeploymentBoard.tsx — 사용자 요청. 전입이 먼저인 이유: 승인한 요청이 전입으로 이어지고 복귀일 지정도 전입에서 한다

---

## DoD 대조표 (T655)

| # | 조건 | 판정 | 증거 |
|:-:|---|:-:|---|
| 1 | KPI 3종이 요약 쿼리 — store import 0건 | ✅ | `DeploymentKpiRow.tsx` · `store/` 삭제 |
| 2 | 사이드바 뱃지가 같은 쿼리 | ✅ | `RailSidebar.tsx` · config `badge` 키 · 테스트 2 |
| 3 | 요약 실패 시 KPI 만 `-` | ✅ | `DeploymentKpiRow.test.tsx` |
| 4 | 부제가 선택 사업장명 | ✅ | `DeploymentsPage.tsx` `getSiteName()` · 통합 테스트 |
| 5 | 요청 목록 서버 페이징 + 상태 분기 4종 | ✅ | `DeploymentBoard.tsx`(T649g 로 통합) · 테스트 |
| 6 | 승인 → 요청 사라짐 · 요약 · 이력 +1 · 뱃지 | ✅ | `DeploymentsPage.test.tsx` · `DeploymentBoard.test.tsx` |
| 7 | 거부 → 사유 필수 · 모달 닫힘 · 이력 불변 | ✅ | 통합 테스트 · `RejectRequestForm.test.tsx` |
| 8 | 연타 방지 — 요청 1회 | ✅ | 통합 테스트 "연타해도 요청은 1번" |
| 9 | 처리된 요청 → 토스트 + 재조회 | ✅ | 통합 테스트(전역 MutationCache 경로) |
| 10 | 거부 실패 시 모달 유지 | ✅ | 통합 테스트 · 폼 테스트 |
| 11 | 마지막 행 처리 후 빈 페이지 없음 | ✅ | 통합 테스트 "이전 페이지로" |
| 12 | 전출/전입이 `direction` 으로 · URL 보존 | ✅ | `DeploymentBoard.test.tsx`(`?tab`·`?page` — T649g 에서 키 정리) |
| 13 | 기간·상태가 `endDt` 로 갈린다 · 상태 분기 | ✅ | 같은 테스트 + **상태 필터**(T649h) |
| 14 | store·mock·구 타입 삭제 · enum 판단 | ✅ | T650 |
| 15 | 가정 타입이 한 곳 | ✅ | `types/deployment.ts` 만 — MSW 는 그 타입을 import |
| 16 | `verify` + `test` green | ✅ | 0 errors · **1196 passed**(107 files) |
| 17 | 브라우저 확인 + 캡쳐 | ◩ | 캡쳐 ✅ · 화면 확인 ✅(재구성 9건) · ⚠️ dev 에서 승인·거부 직접 클릭 미확인(T652) |
| 18 | 요청서 전달 가능 · §6-5 갱신 | ✅ | `docs/api-request-deployment.md`(상태 필터 반영) · `api-spec.md` §6-5 |
| 19 | 문서 동기화 | ✅ | T654 |
| 20 | 이월 블록 | ✅ | 아래 |

**판정: 20개 중 ✅ 19 · ◩ 1(#17).**

---

## 다음 spec으로 이월

### ① 🔴 백엔드 구현 후 WF-1-0 — 가정 계약 교정

⚠️ T656 이후 가정이 늘었다: 요청의 `startDt`·`endDt` · 이력 `status`(0 배치중 / 1 복귀완료 / 2 배치예정) +
`statusName` 을 **서버가 날짜로 계산**하는지 · `UpdateDeploymentEndDate`(경로·바디·시작일 검증·복귀완료 거부).

요청서(`docs/api-request-deployment.md`)대로 백엔드가 만들면 **실측해서 `types/deployment.ts` 와
`mocks/handlers/deployments.ts` 만** 고친다. 확인할 것(전부 가정):
- 경로·메서드 · 파라미터 이름(`siteSeq`·`direction`·`status`·`requestSeq`·`rejectReason`)
- 이력 엔드포인트 1개 + `direction` 인지 2개인지(OQ-039-B) · 요약 API 유무(OQ-039-C)
- 코드값(배치/복귀 `requestType` · `direction` · `status`) · 처리된 요청 재처리 오류 형태
- 승인 즉시 이동인지(OQ-039-D) · 복귀 승인 시 이력 처리
- 현장관리자 권한(근무자 API 는 처음에 403 이었다 — B-41)

### ② 근무자 상세의 배치 이력 카드(038 이월 ③)

요청서 6번. API 가 나오면 근무자 상세(`/users/:userSeq`)에 **카드로** 붙인다(가정 타입을 근무자 화면까지 넓히지 않았다).

### ③ 남겨 둔 판단

- KPI 카드 클릭은 **버튼으로 감쌌다** — 공용 `AppKpiCard` 에 클릭이 생길 수요가 다른 화면에서 나오면 그때 올린다
- 요청서 7번(요약) 중 "나간·온 인원" 은 **현재 인원**이다 — 이력 상태 필터(배치 중)의 건수와 같아야 한다. 백엔드 구현 후 둘이 일치하는지 실측한다

### ④ T652 dev 화면에서 승인·거부 직접 확인

`npm run dev` → 사업장 7 → `/deployments` — 승인(행 사라짐 · KPI · 뱃지 · 전입 탭 +1) · 거부(사유 · 이력 불변) · 연타.
