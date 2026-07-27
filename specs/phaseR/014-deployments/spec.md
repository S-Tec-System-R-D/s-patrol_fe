# 014-deployments spec

> 위험도: **A** (출처: `roadmap.md` §5-2, `screens.md` §1-4A "배치관리")
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-4a-배치관리-신규-리디자인-재정의) §1-4A
> Phase: roadmap.md Phase R (R2-6)
> **비고**: `/deployments` 신규 라우트(007에서 path·사이드바 링크만 예약, 클릭 시 404였음). 마스터-디테일이 아닌 **대시보드형**(KPI + 요청 목록 + 이력 탭). 013(`Worker`)과 도메인은 겹치지만 013 이월 항목에 따라 **mock은 통합하지 않고 자체 보유**(아래 §0 참조).

---

## 0. Carry-over (013 → 014)

- **배치 변경 이력 mock 통합 검토** — 013은 `features/workers/mocks/workerData.ts`에 자체 `WorkerAssignmentHistoryItem` mock을 둠. 검토 결과: **통합하지 않음**. 014는 `features/deployments/mocks/deploymentData.ts`에 자체 `DeploymentHistoryItem` mock을 별도로 두고, 013의 `workerData.ts`는 변경하지 않는다(`CLAUDE.md` A3 최소 변경). 근거: 013의 배치 요청 큐에 등장하는 근무자(예: 최범수·배수진)는 013 로컬 근무자 목록(강동 테크노타워 소속 8명)에 속하지 않는 **타 사업장 근무자**라 애초에 같은 mock 배열을 공유할 근거가 약함. 실 API 연동 시(Phase 3+) 서버가 단일 소스가 되므로 mock 레벨 통합은 불필요하다고 판단.
- **근무자 삭제 시 대기중 배치요청 영향 확인** — 013 spec Open Question. 본 spec 범위 밖(013의 "근무자 삭제"는 스텁 처리이며 배치요청 큐와 연동되어 있지 않음) → **미해결로 유지, 실 API 연동 단계(Phase 3 이후)로 재이월**.
- **비밀번호 초기화 실제 값 생성 방식** — 013 spec Open Question(서버 책임). 014와 무관 → Phase 3 이후 유지.

---

## User Stories

- US1. 현장관리자가 `/deployments`에 접속하면 상단 KPI 3종(배치 나간 인원 / 배치 온 인원 / 대기중인 배치요청)으로 현황을 즉시 파악한다.
- US2. 현장관리자가 배치 요청 목록에서 각 요청(사업장·이름·사유·요청일)을 확인하고 "승인"을 클릭해 즉시 확정한다 — 확정 즉시 목록에서 사라지고 배치 이력에 반영된다.
- US3. 현장관리자가 배치 요청 목록에서 "거부"를 클릭하면 사유 입력 모달이 열리고, 사유를 입력해 거부를 확정한다.
- US4. 현장관리자가 하단 배치 이력에서 "전출 이력" / "전입 이력" 탭을 전환해 과거 배치 기록(이름·배치 경로·사유·기간·상태)을 조회한다.

---

## 1. 목적

`/deployments`(배치관리) 화면을 신규 목업(`docs/ui-mock/현장/배치관리/배치관리-신규.png`)과 일치하는 UI로 **신규 구현**한다. 근무자 APP에서 발송한 배치(파견)/복귀 요청을 목적지 사업장 관리자가 승인·거부하는 신규 워크플로 화면이며, 마스터-디테일이 아닌 **KPI + 요청 목록(인라인 액션) + 이력 탭**의 대시보드 구조다. 013과 달리 승인/거부는 **화면에 실질적으로 반영되는 상태 변화**(목록에서 제거, 이력 탭에 반영, KPI 갱신, 사이드바 대기건수 갱신)를 mock 레벨에서 구현한다 — 이는 사용자와 사전 확인한 결정사항(002~013의 순수 `console.log` 스텁 관례와 다름).

---

## 2. I/O

### Input
- 배치 요청 mock 데이터: `features/deployments/mocks/deploymentData.ts` 신규 작성. 목업 그대로 대기 요청 2건(해운대 마린시티 최범수 → 강동 테크노타워, 송도비즈니스타워 배수진 → 강동 테크노타워), 모두 `toLocation = 로그인 사업장`(승인 권한 조건).
- 배치 이력 mock 데이터: 같은 파일에 시드. "전출 이력" 1건(오준혁, 목업 그대로) + "전입 이력" 2건(목업에 미노출 — KPI "배치 온 인원 2명"과 정합하도록 자체 구성, §참고에 명시).
- 현재 로그인 사업장 정보: `useMe()`(`locationName`)로 서브타이틀 구성.
- 선택 상태 없음(마스터-디테일 아님). 요청/이력 상태는 zustand store(`useDeploymentStore`)로 관리(아래 §3).
- 이력 탭 선택 상태: URL 쿼리스트링 `?historyTab=out|in`(`useQueryParams`).

### Output
- 화면 렌더링:
  - `AppPageHeader`(제목 "배치관리", 서브타이틀 "{사업장명} 소속 근무자의 배치 이력과 요청을 확인합니다")
  - KPI 3종(`AppKpiCard` × 3): "배치 나간 인원"(point, →), "배치 온 인원"(success, ←), "대기중인 배치요청"(warning, ⏱) — store에서 파생 계산(아래 §3 비즈니스 규칙)
  - 배치 요청 목록(중단): 카드형 row(`DeploymentRequestRow`) — 아바타(장식용 아이콘) + "{fromLocationName} · {workerName}" + "{toLocationName}로 배치 요청 · 사유: {reason}" + 우측 요청일 + `[✓ 승인]`(success) `[✕ 거부]`(danger) 인라인 버튼. `AppPagination` 하단.
  - 배치 이력(하단): `ui/tabs` 2개("전출 이력"/"전입 이력") + `AppTable`(컬럼: 이름·배치 경로·사유·기간·상태) + `AppPagination`.
  - 목록/이력 모두 0건이면 `AppEmpty`.
  - `RailSidebar` 배치관리 아이콘 위 대기 요청 건수 dot+숫자 뱃지(기존 `badge?: () => number` 계약 사용).
- 상태 변화:
  - "승인" 클릭 → 해당 요청이 큐에서 제거 + `DeploymentHistoryItem` 1건이 "전입 이력"에 자동 추가(`startedAt`=오늘, `endedAt` 없음) + KPI(배치 온 인원 +1, 대기중 배치요청 -1) 갱신 + `toast.success`.
  - "거부" 클릭 → 사유 입력 모달(`AppDialog`+`RejectRequestForm`) 오픈 → 확인 시 해당 요청이 큐에서 제거 + KPI(대기중 배치요청 -1) 갱신 + `toast.success`(이력 탭에는 미노출 — 아래 비즈니스 규칙).
  - 사이드바 뱃지 숫자는 승인/거부 직후 페이지 이동 없이도 즉시 갱신(RailSidebar가 store를 구독).
- 외부 효과: 없음(mock 전용, 실 API는 Phase 3 이후).

---

## 3. 제약

### 기술 제약

**재사용(필수)**: `AppPageHeader`, `AppKpiCard`, `AppButton`, `AppDialog`, `AppTable`, `AppPagination`, `AppBadge`, `AppEmpty`, `WorkerAvatar`(013, 이력 테이블 이름 컬럼에서 재사용), `useMe()`, `useQueryParams()`, `notify`(sonner 헬퍼).

**신규 파일**
- `src/types/enum.ts` — `DeploymentDirection`/`DeploymentStatus` + 라벨 맵 추가(data-model.md §2-2 그대로, 014가 첫 실사용처. 수정 파일).
- `src/features/deployments/types/deployment.ts` — `DeploymentRequestSummary`(data-model.md 기준 + `reason: string` 필드 추가, 아래 비즈니스 규칙 참조), `DeploymentHistoryItem`(mock 전용, 화면 표시 필드만: id/workerName/fromLocationName/toLocationName/reason/startedAt/endedAt).
- `src/features/deployments/mocks/deploymentData.ts` — 초기 시드 데이터(대기 요청 2건, 이력 3건).
- `src/features/deployments/store/deploymentStore.ts` — zustand store. state: `pendingRequests: DeploymentRequestSummary[]`, `historyItems: DeploymentHistoryItem[]`. actions: `approve(id)`, `reject(id, reason)`. 초기값은 mock 시드.
- `src/features/deployments/components/DeploymentKpiRow.tsx` — KPI 3종 조립, store에서 파생 계산.
- `src/features/deployments/components/DeploymentRequestRow.tsx` — 요청 카드형 row(아바타는 장식용 아이콘 사각형, `WorkerAvatar`와 구분 — 013 근무자와 달리 미등록 타 사업장 인원이라 색상 해시 대상 아님).
- `src/features/deployments/components/DeploymentRequestList.tsx` — 목록 컨테이너(`AppPagination` + `AppEmpty`).
- `src/features/deployments/components/DeploymentHistoryColumns.tsx` — `AppTable` 컬럼 정의(이름은 `WorkerAvatar`+텍스트, 배치 경로는 "A → B", 상태는 `AppBadge`: 배치중=point / 복귀완료=muted).
- `src/features/deployments/components/DeploymentHistoryTabs.tsx` — 탭 2개 + `AppTable`+`AppPagination` 조립. `useQueryParams<'historyTab'>()`로 `out`(기본)/`in` 관리.
- `src/features/deployments/form/schema.ts` — `rejectRequestSchema`(zod, `reason: z.string().min(1, '거부 사유를 입력해주세요.')`).
- `src/features/deployments/form/RejectRequestForm.tsx` — react-hook-form+zod, textarea 1개(신규 shadcn `ui/textarea` 없음 — `AppInput`과 동일 스타일의 인라인 `<textarea>` 직접 사용, 013 `EditWorkerForm` 패턴 참고), 제출 시 `store.reject(id, reason)` 호출 후 모달 닫힘.
- `src/pages/service/deployments/DeploymentsPage.tsx` — 페이지 조립.
- **라우터 연동**: `src/router/index.tsx`에 `paths.service.deployments`(007에서 이미 예약) 라우트 등록.
- **사이드바 뱃지 연동**: `src/components/layout/sidebar/sidebar.config.ts`의 배치관리 메뉴 항목에 `badge: () => useDeploymentStore.getState().pendingRequests.length` 추가. `src/components/layout/sidebar/RailSidebar.tsx`에 `useDeploymentStore()` 구독 훅 1줄 추가(승인/거부 시 store가 바뀌어도 RailSidebar 자체가 재렌더되도록 트리거 — 현재는 `useLocation()`에만 반응해 페이지 이탈 없이는 뱃지가 갱신되지 않음).

### 비즈니스 규칙

- **요청 목록 대상**: `DeploymentRequestSummary.status === 'PENDING'` && `toLocation === 로그인 사업장` 건만(승인 권한 = `toLocation` 관리자, `data-model.md` §5-3 주석 그대로). mock은 이 조건을 만족하는 데이터만 시드.
- **`reason` 필드 추가(data-model.md 갱신 필요)**: 목업(`배치관리-신규.png`)에 "요청 사유"가 명시적으로 노출되나 현재 `DeploymentRequest`/`DeploymentRequestSummary`에는 필드가 없음(`data-model.md` 기존 Open Question, line 846). 목업을 근거로 `reason: string`(필수) 필드를 추가하고, WF-5 통합 시 `data-model.md` §3-1과 해당 Open Question을 함께 갱신한다.
- **승인**: 인라인 클릭 → 확인 모달 없이 즉시 확정(screens.md 명시). `DeploymentHistoryItem` 1건이 store에 추가된다(013 `WorkerAssignmentHistoryItem`과는 별개 mock — 위 Carry-over 참조).
- **거부**: 사유 입력 **필수**(zod required, 사용자 확인 완료). 거부된 요청은 큐에서만 제거되고 **배치 이력 탭에는 노출하지 않는다** — 이력 탭은 실제로 성립된 배치(승인 건)만 다룬다는 화면 설계 근거(screens.md "설계 근거" 참조)에 따른 결정. `rejectReason`은 근무자 APP 전용 노출(WEB 화면엔 표시 UI 없음, data-model.md §5-3 주석 그대로).
- **KPI 파생 계산**(모두 store에서 파생, 별도 API 없음):
  - 배치 나간 인원 = `historyItems`(나간 방향, 즉 `fromLocationName === 로그인 사업장`) 중 `endedAt` 없는(현재 진행중) 건수.
  - 배치 온 인원 = `historyItems`(온 방향, 즉 `toLocationName === 로그인 사업장`) 중 `endedAt` 없는 건수.
  - 대기중인 배치요청 = `pendingRequests.length`.
- **이력 탭 방향 판정**: 별도 `direction` 필드를 두지 않고 `fromLocationName`/`toLocationName`을 로그인 사업장과 비교해 "나간"/"온"을 런타임에 판정한다(화면 표시 필드만 두는 컨벤션 — `CLAUDE.md` B4).
- **KPI 클릭 시 스크롤**: screens.md에 "(선택)"으로 명시된 항목 — 본 spec 범위에서 **제외**.
- **검색/필터 UI**: 실 목업(`배치관리-신규.png`)에 검색창이 노출되지 않음(screens.md ASCII 표에는 "검색 · 페이지네이션"으로 적혀 있으나 실 목업이 우선 — M2 시각검증 기준) → 요청 목록·이력 모두 **검색 UI 미포함**, 페이지네이션(`AppPagination`)만 적용.

---

## 4. 엣지 케이스

- **거부 사유 미입력** → zod 에러 노출, 제출 차단(RejectRequestForm).
- **승인/거부 연타** → 클릭 즉시 해당 row가 store에서 제거되어 리렌더되므로 버튼 자체가 사라짐(중복 액션 불가). 별도 로딩/디바운스 처리 불필요(mock 동기 처리).
- **대기 요청 0건** → KPI "대기중인 배치요청 0건" + 요청 목록 영역 `AppEmpty` + 사이드바 뱃지 숨김(기존 `count > 0` 조건 그대로 적용).
- **이력 0건(나간/온 각 탭 개별)** → 해당 탭에 `AppEmpty`.
- **권한 범위**: mock 데이터 자체가 이미 `toLocation = 로그인 사업장` 조건으로 시드되어 있어 화면에는 항상 권한 있는 요청만 노출(실 API 연동 시 서버가 필터링 — Open Question).
- **네트워크 실패**: 해당 없음(mock 전용, 실 API 연동은 Phase 3 이후).
- **로딩 상태**: 해당 없음(react-query 미사용, 동기 mock).

---

## 5. 완료 조건 (DoD)

- [x] `/deployments` 접속 시 신규 목업(`docs/ui-mock/현장/배치관리/배치관리-신규.png`)과 시각적으로 일치 (M2) — Playwright(msedge)로 실 브라우저 확인, 발견된 버그(T093)·피드백(T091,T092) 반영 완료
- [x] KPI 3종이 초기 mock 기준(배치 나간 1명 / 배치 온 2명 / 대기중 2건)으로 렌더 — src/features/deployments/components/DeploymentKpiRow.tsx, 브라우저 스크린샷 확인
- [x] 배치 요청 목록에 목업과 동일한 2건이 카드형 row로 렌더(아바타·사업장·이름·사유·요청일 + 승인/거부 버튼) — src/features/deployments/components/DeploymentRequestRow.tsx
- [x] "승인" 클릭 → 요청이 목록에서 사라짐 + "전입 이력" 탭에 신규 1건 반영 + KPI(배치 온 인원/대기중 요청) 갱신 + toast 노출 — src/features/deployments/store/deploymentStore.ts, 브라우저 확인(최범수 승인 → 배치 온 3명/대기 1건)
- [x] "거부" 클릭 → 사유 입력 모달 오픈, 사유 미입력 시 zod 에러, 입력 후 확인 시 요청이 목록에서 사라짐 + KPI(대기중 요청) 갱신 + toast 노출 + 이력 탭에는 미노출 — src/features/deployments/form/RejectRequestForm.tsx, vitest(T087)
- [x] "전출 이력"/"전입 이력" 탭 전환이 `?historyTab=out|in`에 반영되고 새로고침 시 유지 — src/features/deployments/components/DeploymentHistoryTabs.tsx, vitest(T088)
- [x] 배치 이력 컬럼(이름·배치 경로·사유·기간·상태)이 목업과 일치, 상태 배지(배치중=point/복귀완료=muted) 표시 — src/features/deployments/components/DeploymentHistoryColumns.tsx
- [x] RailSidebar 배치관리 아이콘에 대기 건수 dot+숫자 뱃지 표시, 승인/거부 직후(페이지 이동 없이) 즉시 갱신 — src/components/layout/sidebar/RailSidebar.tsx, src/components/layout/sidebar/sidebar.config.ts, 브라우저 확인
- [x] 요청/이력 각각 0건 시 `AppEmpty` 표시 — src/features/deployments/components/DeploymentRequestList.tsx, DeploymentHistoryTabs.tsx(코드 리뷰로 확인, 0건 mock 시나리오는 미시딩)
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 25 files/77 tests 통과
- [x] `screens.md` §1-4A 진행도 ✗ → ✓ 갱신(영역별) — docs/screens.md
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 014" 행 갱신 — docs/roadmap.md
- [x] `data-model.md` §3-1에 `DeploymentRequest`/`DeploymentRequestSummary.reason` 필드 추가 + 관련 Open Question(요청 사유 필드) 해소 반영 — docs/data-model.md
- [x] `src/types/enum.ts`에 `DeploymentDirection`/`DeploymentStatus` + 라벨 SSOT 추가 — src/types/enum.ts

---

## Open Questions

- [ ] **거부된 요청(REJECTED)의 이력 노출 여부** — `data-model.md`의 `?status=PROCESSED` 엔드포인트는 APPROVED·REJECTED·CANCELLED를 통합 반환하지만, 본 spec의 이력 탭은 승인 건만 노출하기로 결정. 실 API 연동 시 "거부 이력"을 별도로 보여줄지 재검토 필요.
- [ ] **근무자 삭제 시 대기중 배치요청 영향** — 013에서 이월, 여전히 미해결. 실 API 연동 단계로 재이월.
- [ ] 기존 `data-model.md` §14 근처 Open Questions(재요청 쿨다운, 승인 시 세션 처리, 처리이력 필터 파라미터)는 WEB(관리자 승인/거부) 범위 밖 — 그대로 유지.

---

## 참고

- 관련 목업: `docs/ui-mock/현장/배치관리/배치관리-신규.png`(KPI·요청 목록·"전출 이력" 탭까지만 노출. "전입 이력" 탭 내용은 목업에 없어 KPI "배치 온 인원 2명"과 정합하도록 자체 구성). 탭 명칭 "전출/전입 이력"은 사용자 피드백 반영(초기 구현 시 "배치 나간/온 이력"이었으나 리뷰 중 변경).
- 관련 문서: `docs/data-model.md` §3-1(`DeploymentRequest` 계열), §5-3(`ApproveDeploymentRequest`/`RejectDeploymentRequest`), `docs/screens.md` §1-4A.
- 참고 구현: `src/pages/service/users/UsersPage.tsx`(AppPageHeader+AppTable+AppPagination 조립), `src/features/workers/components/WorkerDetailPanel.tsx`(AppAlertDialog/AppDialog 액션 패턴, 이력 기간 표기 `historyPeriod`), `src/features/zone/components/CourseTabs.tsx`(탭 라우팅 참고 — 단, 014는 라우트 탭이 아니라 쿼리스트링 탭).
