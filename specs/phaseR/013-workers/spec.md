# 013-workers spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-4 "근무자 목록 + 선택 근무자 상세" 진행도 ✗)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-4-근무자-관리) §1-4
> Phase: roadmap.md Phase R (R2-5)
> **비고**: 009~012와 달리 기존 코드가 전혀 없는 **완전 신규 화면**(라우트·타입·mock·컴포넌트 전부 신규). `/deployments`(014)와 도메인은 겹치지만(`Worker`, `WorkerAssignmentHistory`) 배치 요청 큐/워크플로는 014 범위.

---

## 0. Carry-over (012 → 013)

- 012 tasks.md 이월 4건은 모두 "코스/지점 도메인 고유" 항목으로, 013(근무자 도메인)과 무관 확인됨 → 전부 **해당 없음**.
- DoD 미달 항목 없음(012는 전 항목 완료).

---

## User Stories

- US1. 현장관리자가 `/users`에 접속하면 상단에 소속 사업장·근무자 수(`"{사업장명} 소속 근무자 {N}명"`)를 확인하고, 테이블(이름·연락처·소속 사업장·근무 상태·사용자 상태·등록일)에서 근무자를 선택해 우측 상세 패널(기본정보 + 배치 변경 이력 + 액션)을 확인한다.
- US2. 현장관리자가 우측 상세 패널의 "비밀번호" / "수정" / "근무자 삭제" 액션으로 각각 비밀번호 초기화 확인 모달, 수정 모달, 삭제 확인 모달을 연다.
- US3. 현장관리자가 상단 "근무자 추가" 버튼으로 등록 모달(이름·연락처·소속 사업장(읽기전용)·초기비밀번호)을 연다.

---

## 1. 목적

`/users`(근무자 관리) 화면을 신규 목업(`docs/ui-mock/현장/근무자/근무자-신규.png`)과 일치하는 UI로 **신규 구현**한다. 좌측 전체 폭 테이블 + 우측 상세 패널의 마스터-디테일 구조이며, 검색·필터는 009/010과 동일하게 **비와이어드(시각만)** 로 둔다. 배치 요청 승인/거부 워크플로(대시보드)는 014의 범위이며, 013은 근무자 상세의 "배치 변경 이력"을 **조회 전용**으로만 표시한다.

---

## 2. I/O

### Input
- 근무자 mock 데이터: `features/workers/mocks/workerData.ts` 신규 작성(`data-model.md` §3-1 `Worker`/`WorkerSummary`/`WorkerAssignmentHistoryItem` 기반), 목업 인원수(8명) 상당의 데모 데이터. 배치중(`isAssignedElsewhere: true`) 사례 최소 1건 포함(목업의 "오준혁 → 강서 스퀘어타워" 참고).
- 현재 로그인 사업장 정보: `useMe()`(`locationName`)로 페이지 서브타이틀 및 등록 모달의 소속 사업장 값을 구성.
- 선택 근무자 상태: 페이지 로컬 `useState<Worker | null>`(009/010과 동일 패턴).

### Output
- 화면 렌더링:
  - `AppPageHeader`(제목 "근무자", 서브타이틀 "{사업장명} 소속 근무자 {N}명")
  - 검색 `AppInput`(placeholder "이름 또는 연락처 검색") + `AppFilterButton` 2종("근무 상태", "사용자 상태") — 비와이어드
  - 우측 상단 "근무자 추가" `AppButton`(primary) → 등록 모달(`AppDialog`) 트리거
  - `AppTable`(전체 폭) + `AppPagination`: 컬럼 = 아바타+이름 / 연락처 / 소속 사업장(+배치중이면 `AppBadge`(point) "배치중") / 근무 상태(dot+라벨) / 사용자 상태(`AppBadge`: 활성=success/비활성=muted) / 등록일
  - 우측 상세 패널: 아바타+이름+"{소속 사업장} · {역할}" → 기본정보(연락처/소속 사업장/근무 상태/사용자 상태/등록일, `AppDetailRow`) → 배치 변경 이력(건수 뱃지 + dot 리스트: "{toLocationName} 배치|복귀" + "{startedAt}~{endedAt 또는 현재}") → 액션 3버튼(비밀번호/수정/근무자 삭제, 012 `PointDetail` 패턴과 동일하게 `AppDialog`+`AppAlertDialog`)
  - 근무자 없음(빈 상태): `AppEmpty`
- 상태 변화: 테이블 행 클릭 → 우측 상세 전환. 그 외 모달 제출은 `console.log` 스텁(002~012 관례 동일, 실 API는 Phase 3 이후).
- 외부 효과: 없음.

---

## 3. 제약

### 기술 제약
- **재사용(필수)**: `AppPageHeader`, `AppFilterButton`, `AppTable`, `AppPagination`, `AppBadge`, `AppButton`, `AppInput`, `AppDialog`, `AppAlertDialog`, `AppEmpty`, `AppDetailRow`, `useMe()`.
- **신규 파일**:
  - `src/features/workers/types/worker.ts` — `Worker`/`WorkerSummary`/`WorkerAssignmentHistoryItem` (data-model.md §3-1 그대로, 화면 미표시 필드 제외).
  - `src/features/workers/mocks/workerData.ts` — 데모 데이터.
  - `src/features/workers/components/WorkerAvatar.tsx` — 이니셜 원형 아바타. id/name 해시로 팔레트 순환 배정(순수 장식, 상태 의미 없음 — 아래 디자인 토큰 항목 참조).
  - `src/features/workers/components/WorkerColumns.tsx` — `AppTable` 컬럼 정의(009 `ZoneColumn.tsx` 패턴 참고).
  - `src/features/workers/components/WorkerDetailPanel.tsx` — 상세 패널(012 `PointDetail.tsx` 액션 버튼 구성 참고, 배치 이력 리스트는 신규).
  - `src/features/workers/form/schema.ts` + `AddWorkerForm.tsx` + `EditWorkerForm.tsx` — react-hook-form + zod(`features/points/form` 패턴 동일). 소속 사업장 필드는 `useMe().locationName` 읽기전용 표시(select 아님 — 현장관리자는 자신의 사업장 소속 근무자만 등록).
  - `src/pages/service/users/UsersPage.tsx` — 페이지 조립.
- **라우터 연동**: `src/router/index.tsx`에 `paths.service.users` 라우트 등록(경로 상수는 007에서 이미 예약됨, 페이지 연결만 추가).
- **디자인 토큰(신규)**: 아바타 전용 장식 팔레트 6종(`--avatar-1`~`--avatar-6`, `src/index.css` light/dark) 추가. 기존 시맨틱 4색(point/success/warning/danger)과 겹치지 않는 색상. `design-system.md` §1에 "상태 의미 없는 순수 장식용, 시맨틱 뱃지와 혼동 금지" 명시.
- **엔팀 라벨**: `WorkStatus`/`UserStatus` 라벨은 기존 SSOT(`src/types/enum.ts`) 그대로 사용(013이 첫 실사용처).

### 비즈니스 규칙
- **목록 대상**: 현장관리자 포함(같은 사업장 소속 `Worker` 전원, role 무관) — 사용자 확인 완료.
- **소속 사업장 컬럼**: `isAssignedElsewhere`이면 `currentAssignedLocation.name` + "배치중" 뱃지 우선 표시(목업 그대로) — 사용자 확인 완료. 아니면 `locationName`.
- **근무자 추가/수정 모달**: `CreateWorkerRequest`/`UpdateWorkerRequest`(data-model.md §5-3) 필드 그대로(이름/연락처/소속사업장/초기비밀번호). 소속 사업장은 읽기전용 고정값 — 사용자 확인 완료.
- **비밀번호 액션**: `ResetPasswordRequest` 대응. 별도 입력 없이 확인 모달(`AppAlertDialog`) → 확인 시 스텁 처리(실 초기화값 생성은 서버 책임, Open Question).
- **삭제 액션**: `AppAlertDialog`(destructive) 확인 모달, 스텁 처리.

---

## 4. 엣지 케이스

공통 규칙 따름(`CLAUDE.md`/`design-system.md`).

- 근무자 목록이 비어 있으면 `AppEmpty` 표시.
- 배치 변경 이력이 없는 근무자는 해당 섹션에 "이력 없음" 문구(빈 배열 케이스).

---

## 5. 완료 조건 (DoD)

- [x] `/users` 접속 시 신규 목업(`docs/ui-mock/현장/근무자/근무자-신규.png`)과 시각적으로 일치 (M2) — 사용자 브라우저 확인 완료(아바타 텍스트색·필터버튼 줄바꿈 2건 발견·수정)
- [x] 테이블에서 근무자 선택 시 우측 상세 패널이 해당 데이터로 갱신 — 사용자 확인 완료
- [x] 배치중인 근무자는 소속 사업장 컬럼에 현재 배치지 + "배치중" 뱃지로 표시 — src/features/workers/components/WorkerColumns.tsx
- [x] 상세 패널의 "비밀번호"/"수정"/"근무자 삭제" 액션이 각각 확인 모달/수정 모달/삭제 확인 모달을 정상 오픈 — src/features/workers/components/WorkerDetailPanel.tsx
- [x] "근무자 추가" 모달에서 소속 사업장이 현재 로그인 사업장으로 읽기전용 표시, 나머지 필드(이름/연락처/초기비밀번호) 입력 가능 + zod 검증 — src/features/workers/form/AddWorkerForm.tsx, vitest로 검증
- [x] 아바타 색상이 신규 토큰(`--avatar-1`~`--avatar-6`)을 통해 렌더(임의 hex 없음) — src/features/workers/components/WorkerAvatar.tsx
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 22 files/71 tests 통과(기존 63 + 신규 8)
- [x] `screens.md` §1-4 진행도 ✗ → ✓ 갱신
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 013" 행 갱신
- [x] `design-system.md` §1에 아바타 팔레트 토큰 항목 추가

---

## Open Questions

- [ ] **비밀번호 초기화 실제 값 생성 방식** — 서버 책임(임의 생성 후 안내 vs 관리자 직접 입력). 013은 확인 모달 스텁까지만.
- [ ] **배치 변경 이력이 014(`/deployments`)의 `WorkerAssignmentHistory`와 데이터 연동** — 013은 자체 mock 사용, 014 구현 시 mock 통합 필요.
- [ ] **근무자 삭제 시 진행 중인 순찰/배치 요청 영향 확인** — 서버 책임 여부 미정(012의 "지점 삭제 시 코스 영향"과 유사 패턴).

---

## 참고

- 관련 목업: `docs/ui-mock/현장/근무자/근무자-신규.png`.
- 관련 문서: `docs/data-model.md` §3-1(`Worker` 계열), §5-3(`CreateWorkerRequest`/`UpdateWorkerRequest`/`ResetPasswordRequest`), `docs/screens.md` §1-4.
- 참고 구현: `src/pages/service/patrol/zones/PatrolZonesPage.tsx`(AppTable+AppPagination+우측 패널 조립), `src/features/points/components/detail/PointDetail.tsx`(수정/삭제 버튼 다이얼로그 패턴), `src/features/points/form/AddPointForm.tsx`(react-hook-form+zod 패턴).
