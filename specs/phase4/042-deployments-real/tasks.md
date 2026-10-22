# 042-deployments-real tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 041 이 **T701** 에서 끝났으므로 **T702** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **WF-1-0 실측 완료**(2026-10-21 · 재실측 2026-10-22) — `api-spec.md` §5-1-B "배치 10종" · B-46~B-48. 테스트 근무자는 매번 삭제했다(사업장 7·8 배치 0건).
> 🔴 가정 타입이 쓰이는 곳은 `features/deployments/` 와 MSW 뿐이다(grep 확인) — 다른 화면으로 번지지 않는다.

---

## Phase 1: 기반 — 타입 · API · MSW

> **독립 테스트 기준**: MSW 위에서 배치·복귀 승인/반려가 목록·요약·이력을 바꾸고, 반려 바디에 `approved: false` 가 있다. 가정 경로 `Deployment/W/sign` grep 0건.

- [x] T702 🔴 **실측 타입으로 교체** in src/features/deployments/types/deployment.ts — `AssignmentRequestRow` · `AssignmentHistoryBase` + In/Out/User 행 · `AssignmentCount` · `AssignmentApproveRequest` · 상태 코드 상수(0/1/2). 가정 주석 블록·`RequestKind` 외 가정 타입(`direction`·`status` 파라미터·`rejectReason`·`pendingReturnCount`) 제거
- [x] T703 API 교체 in src/features/deployments/api/ — 조회 5개(`getAssignmentList` · `getAssignmentReturnList` · `getAssignmentInHistory` · `getAssignmentOutHistory` · `getAssignmentCount`) + 변경 2개(`approveAssignment` · `approveAssignmentReturn`, **PUT JSON**). 039 파일 8개 삭제
- [x] T704 [P] 근무자별 이력 API in src/features/deployments/api/getUserAssignmentHistory.ts — `userSeq` · 페이징
- [x] T705 쿼리 키 · 조회 훅 in src/features/deployments/queryKeys.ts · hooks/ — 요청 목록 2종은 `siteSeq` 만 키에(배열 응답) · 이력 In/Out · `userHistory(userSeq)` 를 **`deploymentKeys` 아래**에(🔴 승인·반려 무효화에 걸리도록 — 사업장 무관 키라 `all(siteSeq)` 와 별개 접두사 `['deployment', 'user', userSeq]` 를 함께 무효화)
- [x] T706 🔴 **처리 훅 통합** in src/features/deployments/hooks/useApproveDeployment.ts — `kind`(배치/복귀) × `approved`(승인/반려) 하나로. 🔴 `approved` 를 항상 보낸다(B-48). `useRejectDeployment.ts` 삭제 · 토스트 문구 승인/반려
- [x] T707 🔴 **상태 보유 MSW 교체** in src/mocks/handlers/deployments.ts — 실측 경로·행 모양 · 승인 → 요청 제거 + 이력 추가(status 1, 시작일이 미래면 0) · 반려 → 요청 제거만 · 복귀 승인 → status 2 · 처리된 요청 재처리 400 래퍼(실측 문구) · 없는 ID 404 · `GetAssignmentHistory` · reset
- [x] T708 [P] API + MSW 통합 테스트 in src/features/deployments/hooks/__tests__/deploymentQueries.test.tsx — 승인/반려 바디(`approved` 명시) · 상태 변화 · 재처리 400

## Phase 2: US1 — 현황 (KPI · 사이드바)

> **독립 테스트 기준**: KPI 3종이 `GetAssignmentCount` 숫자이고 보조 문구가 "배치예정 포함". 카드를 누르면 탭만 바뀌고 `?status` 가 생기지 않는다.

- [x] T709 [US1] KPI in src/features/deployments/components/DeploymentKpiRow.tsx — 보조 문구 "배치예정 포함" · 클릭 시 `status` 제거
- [x] T710 [US1] 사이드바 뱃지 확인 in src/components/layout/sidebar/RailSidebar.tsx — 훅 이름이 바뀌면 import 만(`pendingCount` 그대로)
- [x] T711 [US1] [P] 테스트 in src/features/deployments/components/__tests__/DeploymentKpiRow.test.tsx — 문구 · 클릭 시 필터 없음 · 실패 `-`

## Phase 3: US2 — 배치·복귀 요청 처리

> **독립 테스트 기준**: 두 요청 탭에 근무자가 나오고 클라이언트 페이징이 `?page` 로 움직인다. 승인 → 행 사라짐 · 반려 → 확인창 → `approved: false`. 복귀 경로가 `도착 → 출발` 로 그려진다.

- [x] T712 [US2] 요청 컬럼 in src/features/deployments/components/DeploymentRequestColumns.tsx — 실측 필드(`assignmentSeq` · `plannedEndDt` · `createDt`) · 근무자 · 기간 `미정`
- [x] T713 [US2] 🔴 **복귀 컬럼** in src/features/deployments/components/ReturnRequestColumns.tsx — 경로 **뒤집기**(`toSiteName → fromSiteName`) · 복귀일 칸 제거 · 배치 기간 칸
- [x] T714 [US2] 🔴 **반려 확인창** in src/features/deployments/components/DeploymentRequestActions.tsx — 사유 모달 → `AppAlertDialog`("반려하시겠습니까?") · 처리 중 두 버튼 비활성 · 취소 시 요청 없음
- [x] T715 [US2] 사유 폼 삭제 — src/features/deployments/form/ 폴더 전체(`RejectRequestForm.tsx` · `schema.ts` · 테스트)
- [x] T716 [US2] 🔴 **요청 탭 페이징** in src/features/deployments/components/DeploymentBoard.tsx — 배열을 클라이언트에서 잘라 `?page` 연결(`AppPagination` total = 배열 길이) · 마지막 행 처리 후 이전 페이지(039 규약) · 복귀 탭 뱃지 = 복귀 목록 길이(🔴 복귀 목록은 탭과 무관하게 조회) · 실패 시 뱃지 없음
- [x] T717 [US2] [P] 테스트 in src/features/deployments/components/__tests__/DeploymentBoard.test.tsx · src/pages/service/deployments/__tests__/DeploymentsPage.test.tsx — 근무자 표시 · 복귀 경로 · 승인/반려 흐름 · 반려 취소 · 연타 1회 · 재처리 토스트 + 재조회 · 빈 페이지 방지 · 복귀 뱃지

## Phase 4: US3 — 전입·전출 이력

> **독립 테스트 기준**: 전입/전출 탭이 각자 엔드포인트로 나가고 이름 검색이 `userName` 으로 간다. 상태 필터·사유 칸이 없고 상태 뱃지 3종이 `statusName` 이다.

- [x] T718 [US3] 파라미터 in src/features/deployments/lib/deploymentParams.ts — `direction`·`status`·`historyStatusOptions`·`parseHistoryStatus` 제거 · 테스트 갱신(lib/__tests__/deploymentParams.test.ts)
- [x] T719 [US3] 이력 컬럼 in src/features/deployments/components/DeploymentHistoryColumns.tsx — 사유 제거 · 경로 한쪽 = 선택 사업장명(전입 `from → 여기` / 전출 `여기 → to`) · 기간 종료 `endDt` 또는 `미정` · 상태 뱃지(배치예정 neutral · 배치중 point · 복귀완료 muted)
- [x] T720 [US3] 이력 필터 줄 in src/features/deployments/components/DeploymentBoard.tsx — 상태 `AppSelect` 제거 · 검색만 · 초기화는 검색어 기준 · 탭 전환 시 `status` 지우기 제거
- [x] T721 [US3] [P] 테스트 — 탭별 엔드포인트 · 검색 파라미터 · 경로 양끝 · 상태 뱃지 · `미정`

## Phase 5: US4 — 근무자 상세 배치 이력

> **독립 테스트 기준**: 근무자 상세 우측에 배치 이력 섹션이 나오고 5행씩 페이지를 넘긴다. 이력 조회만 실패해도 상세 나머지는 보인다.

- [x] T722 [US4] 훅 in src/features/deployments/hooks/useUserAssignmentHistory.ts — `userSeq` · 페이지(5행)
- [x] T723 [US4] 🔴 **섹션** in src/features/workers/components/detail/UserAssignmentCard.tsx — `UserPatrolCard` 와 같은 카드 틀 · 컬럼(배치 사업장 · 기간 · 상태 — T719 의 규칙·뱃지 재사용) · 로컬 state 페이징 · 상태 분기 4종 · 캡션 "전체 사업장 배치 기록"
- [x] T724 [US4] 상세 연결 in src/pages/service/users/UserDetailPage.tsx — 우측 열 `UserPatrolCard` 아래
- [x] T725 [US4] [P] 테스트 in src/features/workers/components/detail/__tests__/UserAssignmentCard.test.tsx — 목록 · 페이지 이동 · 0건 · 실패 시 섹션만 실패

## Phase 6: 마무리

- [x] T726 `npm run verify` + `npm run test` (병렬) · 가정 경로·`rejectReason`·`pendingReturnCount` grep 0건
- [ ] T727 브라우저 확인 — mock + 🔴 **dev:real**. 데이터: 테스트 근무자(사업장 7)를 만들어 그 토큰으로 `UserAssignment` 7 → 8 → 사업장 8 로 승인/반려 · `UserAssignmentReturn` → 사업장 7 로 복귀 승인 · 근무자 상세 확인 → **근무자 삭제**(이력도 사라진다)
- [x] T728 문서 — `docs/api-request-deployment.md`(남은 요청: 복귀일 · 이력 사유) · `screens.md` §1-4A·§1-4 · `data-model.md` · `flow.md` · `roadmap.md`(042 행 · §12)
- [x] T729 DoD 점검 + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- T702 → T703·T704 → T705 → T706 — 모든 US 선행(타입·API·훅이 화면보다 먼저)
- T707 은 T702 뒤(타입 import) · T708 은 T706·T707 뒤
- Phase 2·3·4 는 Phase 1 뒤. 🔴 **T716 과 T720 은 같은 파일**(`DeploymentBoard.tsx`) — 순차. 파일 저장은 한 번에(Vite 감지 누락 방지)
- T719 → T723(상태 뱃지·기간 규칙 재사용)
- Phase 5 는 T704·T705 뒤면 Phase 2~4 와 병렬 가능
- [P] 끼리는 병렬 가능 · T726 → T727 → T728 → T729

---

## DoD 점검 (2026-10-22)

**17/18 + 확인 대기 1** — #16 브라우저 확인(mock · dev:real)은 사용자 확인 대기(Phase 5 이후 일괄 확인 — 사용자 결정 2026-10-22).

| # | 조건 | 판정 | 증거 |
|:-:|---|:-:|---|
| 1 | 실측 타입 · 가정 경로 0건 | ✅ | `types/deployment.ts` · grep `Deployment/W/sign`·`rejectReason`·`pendingReturnCount` 0건 |
| 2 | 승인·반려 API 2개 · `approved` 항상 | ✅ | `api/approveAssignment*.ts` · `deploymentQueries.test.tsx` 바디 단언 |
| 3 | MSW 실측 모양 + 상태 보유 + reset | ✅ | `mocks/handlers/deployments.ts` — 배치 1건 = 레코드 1개 |
| 4 | KPI · "배치예정 포함" · 클릭 시 필터 없음 | ✅ | `DeploymentKpiRow.test.tsx` |
| 5 | 사이드바 뱃지 = `pendingCount` | ✅ | `RailSidebar.test.tsx` |
| 6 | 요청 표 근무자 · 클라이언트 페이징 | ✅ | `DeploymentBoard.test.tsx` "10건씩 잘라" |
| 7 | 복귀 경로 뒤집기 · 복귀일 칸 없음 | ✅ | 같은 파일 "복귀 경로를 뒤집어" |
| 8 | 승인 → 갱신 | ✅ | `DeploymentsPage.test.tsx` |
| 9 | 반려 확인창 · `approved: false` · 사유 폼 삭제 | ✅ | 같은 파일 · `form/` 삭제 |
| 10 | 연타 · 재처리 · 빈 페이지 | ✅ | 같은 파일 · `DeploymentBoard.test.tsx` |
| 11 | 복귀 탭 뱃지 = 목록 길이 | ✅ | `DeploymentBoard.test.tsx` |
| 12 | 전입·전출 엔드포인트 · 검색 · 사유·필터 없음 | ✅ | 같은 파일 |
| 13 | 상태 뱃지 · 기간 `endDt`/`미정` | ✅ | 같은 파일 · `AssignmentStatusBadge` |
| 14 | 근무자 상세 배치 이력 | ✅ | `UserAssignmentCard.test.tsx` |
| 15 | verify + test | ✅ | lint 0 errors(경고 1 = 기존 `mockServiceWorker.js`) · **1252 passed**(111 files) |
| 16 | 브라우저 확인 | ⏳ | 사용자 확인 대기 |
| 17 | 문서 | ✅ | `api-request-deployment.md`(남은 요청) · `api-spec.md` · `screens.md` · `data-model.md` · `flow.md` · `roadmap.md` |
| 18 | 이월 블록 | ✅ | 아래 |

## 다음 spec으로 이월

### ① 브라우저 확인 (#16) — 사용자 확인 대기

- mock: `npm run dev` → 사업장 7 → `/deployments`(배치 요청 2 · 복귀 요청 1 · 전입·전출 각 2) · 근무자 상세 장도윤(배치 이력 1건)
- dev:real: 웹에서 요청을 만들 수 없다 — 테스트 근무자(사업장 7)를 만들어 그 토큰으로 `UserAssignment` 7 → 8 → 사업장 8 에서 승인/반려 · `UserAssignmentReturn` → 사업장 7 에서 복귀 승인 → **근무자 삭제**(이력도 사라진다)

### ② 백엔드 회신 대기 (`docs/api-request-deployment.md`)

- 🔴 **전입·전출 이력 `status` 필터 파라미터**(OQ-042-F — 백엔드 누락 확인 2026-10-22) → 오면 필터 UI 복원(`?status`, KPI 클릭 시 `배치중`)
- 이력 **사유**(OQ-042-B) → 오면 이력 표 사유 칸
- 복귀 요청 **복귀일**(OQ-042-A, 앱 쪽 입력 필요) → 오면 복귀 표 복귀일 칸
- B-48 — `approved` 누락 시 반려 처리 · 종료일 < 시작일 500 · 문구 오타
- 요약이 배치예정을 세는 것(OQ-042-C) — 바뀌면 KPI 보조 문구를 되돌린다

### ③ 남겨 둔 판단

- `completeDt` 는 테스트 값이라 화면에 쓰지 않았다(OQ-042-E) — 실데이터가 쌓이면 복귀완료 행의 종료일로 쓸지 본다
- 이력 행에 `userSeq` 가 없어 아바타 색 키가 이름이다 — 요청 표(`userSeq`)와 색이 다를 수 있다
- 캡쳐 `deployments--대시보드` 재촬영 — 다음 캡쳐 작업 때
