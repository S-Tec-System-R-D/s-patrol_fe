# 010-patrol-history-point tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 B — 화면 단위로 태스크 분할

---

## Phase 1: Setup

- [x] T017 [P] 페이지 로컬 타입(`PointPatrolType`/`PointRecordType`/`PATROL_POINT_RESULT`) + mock 데이터 `pointPatrols`(목업 `지점순찰이력-신규.png` 10행 그대로, 기록 N건 항목은 `records` 배열로 확장) in src/pages/service/patrol/points/PatrolPointsPage.tsx

## Phase 2: Foundational (US1·US2 공유)

- [x] T018 [P] `PointColumn.tsx` — 컬럼 정의(순찰일자·시간·순찰코스·순찰지점·인증·순찰자·결과·기록) + 인증뱃지(QR=point/NFC=success) + 결과뱃지 5종 매핑 + 기록건수 셀 렌더러(0=회색 텍스트, N≥1=클릭 가능 버튼형 뱃지) in src/features/patrol-points/components/PointColumn.tsx

## Phase 3: US1 — 지점 순찰이력 목록 (전체 폭 테이블)

> **독립 테스트 기준**: `/patrol/points` 접속 시 상세 패널 없는 전체 폭 테이블 렌더, 필터 트리거 5종 + 내보내기 버튼 표시(클릭 시 no-op), `AppPagination`으로 페이지 이동 동작.

- [x] T019 [US1] `PatrolPointsPage.tsx` 전면 재작성 — `AppPageHeader` + `PatrolHistoryTabs`(수정 없이 재사용) + `AppFilterButton`×5(기간/순찰코스/인증수단/순찰자/결과) + 내보내기 `AppButton` + `AppTable`(`hidePagination`, columns=`pointColumns`) + `AppPagination`. 009와 달리 우측 상세 패널(aside) 없음 — 전체 폭 wrapper로 교체 in src/pages/service/patrol/points/PatrolPointsPage.tsx

## Phase 4: US2 — 기록 상세 모달

> **독립 테스트 기준**: 기록건수 N건(N≥1) 뱃지 클릭 → "순찰 기록 상세" 모달 오픈, 기록 N개 항목이 리스트로 표시(각 항목 시각·기록내용·첨부사진 그리드 "업로드수/3"), 닫기 버튼으로 모달 닫힘. 0건 뱃지는 클릭 이벤트 없음.

- [x] T020 [US2] `PatrolRecordDialog.tsx` 신규 — `AppDialog` 기반 제어형 모달. `records: PointRecordType[]` prop을 받아 N건을 리스트로 나열, 각 항목에 시각/기록내용/첨부사진 그리드(플레이스홀더 아이콘 + "업로드수/3") 표시 in src/features/patrol-points/components/PatrolRecordDialog.tsx
- [x] T021 [US2] `PatrolPointsPage.tsx`에 `selectedRecord` 상태 추가, 기록건수 셀 클릭 핸들러 → `PatrolRecordDialog` 오픈 연결 in src/pages/service/patrol/points/PatrolPointsPage.tsx

## Phase 5: Polish

- [x] T022 [P] vitest — `PatrolRecordDialog` 기록 N건 리스트 렌더(항목 수·첨부사진 "업로드수/3" 표기 확인) in src/features/patrol-points/components/__tests__/PatrolRecordDialog.test.tsx
- [x] T023 [P] vitest — `PointColumn` 기록건수 셀 (0건=비클릭 텍스트, N건=클릭 가능 뱃지 + onClick 호출 확인) in src/features/patrol-points/components/__tests__/PointColumn.test.tsx
- [x] T024 [P] `docs/screens.md` §1-2 "지점 이력" 진행도 ✗ → ✓ 갱신 in docs/screens.md
- [x] T025 [P] `docs/roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 010" 행 갱신 in docs/roadmap.md

---

## Dependencies & Execution Order

- **T017, T018 병렬** — 서로 다른 파일, 완전 독립.
- **T019 = T017 + T018 완료 후** — 페이지 재작성에 mock 데이터와 컬럼 정의 필요.
- **T020 = T017 완료 후** — `PointRecordType` 필요. T019와는 병렬 가능(다른 파일).
- **T021 = T019 + T020 완료 후** — 페이지에서 모달을 실제로 연결.
- **T022 = T020 이후 / T023 = T018 이후** — 각 컴포넌트 테스트.
- **T024, T025 = 모든 코드 태스크(T017~T021) 완료 후** — DoD·회귀 확인 후 문서 갱신.
- **세션 분할 권장**: 세션 A = Phase 1~3(US1) / 세션 B = Phase 4(US2) / 세션 C = Phase 5(Polish). 한 세션 내에서 이어 진행해도 무방(009도 세션 내 연속 진행 사례 있음) — 010은 한 세션에서 Phase 1~5 연속 진행.

## 다음 spec으로 이월

> 다음 spec(**011-course-management**, R2-3)의 `§0 Carry-over` 입력원.

- [ ] **필터 팝오버/URL 연동/Export 실동작** — 009·010 모두 UI 골격 + no-op만 구현. 011부터는 화면 성격이 달라(마스터-디테일 코스 관리) 직접 관련 없음, Phase 3(현장 코어 마감)에서 순찰이력 2개 화면 한꺼번에 실동작 예정 → **Phase 3**
- [ ] **첨부사진 최대 허용 장수 정책** — 010에서는 UI 데모용으로 3 고정(mock 상수). 실제 정책 미확정 → **Phase 3 이후 백엔드 연동 시점**
- [ ] **`AppButton`/`AppTable`(td/th) 타이포 토큰 미반영** — 009에서 이미 `design-system.md` §6 Open Q로 등록됨. 010도 동일 컴포넌트 그대로 사용해 범위 밖 유지 → **Phase 3·5 (해당 화면 리디자인 시점)**
- [ ] DoD 미달 항목 없음 — spec §5 전 항목 완료(`npm run verify` exit 0, `npm run test` 48/48 통과, 브라우저 시각 확인 완료)
