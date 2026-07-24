# 009-patrol-history-zone tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 B — 화면 재작성 + 신규 컴포넌트 2종 + Carry-over 3건 흡수. 화면 단위로 크게 분할하되, 좌/우 영역이 크기가 커서 US1(좌측 골격)과 US2(우측 상세)로 분리.

---

## Phase 1: Setup

Carry-over 즉시 처리(문서/오타)와 신규 컴포넌트 스켈레톤 준비. 코드 재작성 전 선행.

- [x] T001 [P] `design-system.md` §1-1 뱃지 매트릭스 "진행 중" 행 `warning` → `point` 갱신 + §6 Open Q 해당 항목 제거 in docs/design-system.md
- [x] T002 [P] `PATROL_RESULT.IN_PROGRESS` 값 오타 수정 (`'IN_COMPLETE'` → `'IN_PROGRESS'`) in src/pages/service/patrol/zones/PatrolZonesPage.tsx (재작성 T005에서 흡수 가능하나 mock 라인 참조 안전을 위해 선행)

## Phase 2: Foundational (모든 US 선행 blocking)

US1·US2·US3가 공유하는 신규 컴포넌트. 둘 다 프레젠테이션 전용으로 상호 의존 없음 → 병렬 가능.

- [x] T003 [P] `PatrolHistoryTabs` 컴포넌트 신설 — `/patrol/zones`↔`/patrol/points` 라우트 링크 탭. `NavLink`(react-router-dom)로 활성 강조. shadcn `tabs` 스타일 대신 목업의 밑줄 강조 스타일을 직접 구현 in src/features/patrol-zones/components/PatrolHistoryTabs.tsx
- [x] T004 [P] `PatrolTimeline` 컴포넌트 신설 — 순찰 시작/각 지점/순찰 종료를 세로 리스트로. 정상 지점은 접힘(아이콘+라벨+시각), 특이사항 지점(`status=false` OR `note` 존재)은 자동 펼침("특이사항" `AppBadge` + `note` 텍스트) in src/features/patrol-zones/components/PatrolTimeline.tsx

## Phase 3: US1 — 페이지 좌측 골격 (헤더/탭/필터/테이블/페이지네이션)

> **독립 테스트 기준** (= 세션 검증 게이트): `/patrol/zones` 접속 시 상단에 "순찰이력" 제목 + 서브타이틀, 그 아래 `코스 순찰이력 / 지점 순찰이력` 탭(코스 활성), 그 아래 좌측 `[기간 선택][코스][결과]` 3개 트리거 + 우측 `[내보내기]` 버튼, 하단 테이블(코스명/시작/종료/결과 4컬럼) + 페이지 하단 `AppPagination`이 목업(`코스순찰이력-신규.png`)과 시각적으로 일치. 필터/내보내기 클릭은 no-op OK.

- [x] T005 [US1] `PatrolZonesPage.tsx` 좌측 영역 재작성 — `AppPageHeader` + `PatrolHistoryTabs` + 필터바(`AppFilterButton`×3 + `AppButton`(내보내기) 우측 정렬) + `AppTable`(`hidePagination` + controlled `pagination` prop 확장 흡수) + `AppPagination` in src/pages/service/patrol/zones/PatrolZonesPage.tsx (AppTable 확장: `pagination?: PaginationState` + `onPaginationChange` 하위호환 옵션 추가 in src/components/AppTable.tsx)
- [x] T006 [US1] `ZoneColumn.tsx` — 순수 `ColumnDef` 리터럴로 재작성(pre-existing 51번 타입 에러 자연 해소). 헤더 라벨 목업 문구로(코스명/시작 일시/종료 일시/순찰 결과). 결과 셀 = `AppBadge` variant 매핑 (완료=`success`, 미완료=`danger`, 진행중=`point`). IN_PROGRESS 행의 종료 일시는 "—" in src/features/patrol-zones/components/ZoneColumn.tsx

## Phase 4: US2 — 페이지 우측 상세 카드 (AppDetailCard + Timeline)

> **독립 테스트 기준**: 좌측 테이블 행 클릭 시 우측 영역이 `AppDetailCard`(제목 = 코스명, 헤더 뱃지 = 결과 뱃지)로 전환. 카드 상단 "순찰 정보"에 `AppDetailRow`로 시작 일시/종료 일시/지점 수 표시. 카드 하단 "타임라인"에 `PatrolTimeline`. 목업의 B동 계단실("특이사항") 케이스처럼 note 있는 지점이 자동 펼침 상태로 표시. 선택 해제(예: 없음) 시 `AppEmpty` 유지.

- [x] T007 [US2] `PatrolZonesPage.tsx` 우측 영역 재작성 — 선택 시 `AppDetailCard`(icon=`ListIcon`) + 헤더 `AppBadge`(결과 매핑 재사용) + 순찰정보 섹션(`AppDetailRow` × 3, 진행중 종료 일시 "—") + 타임라인 섹션(`PatrolTimeline`). 미선택 시 기존 `AppEmpty` 유지. 우측 `<aside>`에 `sticky top-0 h-screen` 적용(layout.md §4-2·§5-5 정책 반영, 스크롤 이슈 3번 해소) in src/pages/service/patrol/zones/PatrolZonesPage.tsx (`patrolResultBadge` DRY export in src/features/patrol-zones/components/ZoneColumn.tsx)
- [x] T008 [US2] `PatrolSheet.tsx`(`PatrolContentBody`) 폐기 — grep 결과 self-reference만 확인 후 파일 삭제

## Phase 5: US3 — 지점 순찰이력 탭 링크 활성

> **독립 테스트 기준**: `/patrol/zones`에서 "지점 순찰이력" 탭 클릭 시 `/patrol/points`로 이동, 탭 활성 표시가 지점으로 이동. 010 spec의 실컨텐츠는 담당 아님(placeholder 페이지가 존재만 하면 OK).

- [x] T009 [US3] `/patrol/points` placeholder 페이지 재작성 — `AppPageHeader`(순찰이력, 서브타이틀 동일) + `PatrolHistoryTabs` + "010 예정" 문구. 라우터 등록은 이미 완료(index.tsx). 세션 A 후속 수정에서 `PatrolLayout` 제거 → 각 페이지가 탭 자체 렌더링 in src/pages/service/patrol/points/PatrolPointsPage.tsx

## Phase 6: 타이포 시맨틱 토큰화

> **배경**: 세션 B에서 `AppPageHeader`/`AppDetailCard`/`AppDetailRow`/`AppFilterButton`/`AppBadge`/`PatrolHistoryTabs`/`PatrolTimeline`/`PatrolZonesPage`에 `text-[17px]`~`text-[10.5px]` 형태의 arbitrary 값을 직접 박아 넣었음(design-system.md §1-2 10단계 스케일 반영). 색상은 이미 `point`/`success` 같은 시맨틱 토큰인데 타이포만 하드코딩 상태라 010~015에서 값이 또 흩어질 위험 → 토큰화.
> **범위**: 009에서 실제로 값을 넣은 8개 파일 15곳만. `AppButton`/`AppTable`(td)은 B그룹(로그인·에러·미리디자인 화면과 공유)이라 미포함 — §6 Open Q에 이미 이월됨.
> **독립 테스트 기준**: `npm run verify` 통과 + 브라우저에서 순찰이력 화면 시각 변화 없음(순수 리팩터, 렌더링 결과 동일).

- [x] T014 `index.css` `@theme inline`에 시맨틱 폰트사이즈 토큰 10종 추가 (`--text-page-title:17px` ~ `--text-label:10.5px`) in src/index.css
- [x] T015 8개 파일 15곳의 arbitrary `text-[Npx]` → 해당 시맨틱 유틸리티로 교체 (`AppPageHeader`/`AppDetailCard`/`AppDetailRow`/`AppFilterButton`/`AppBadge.variants`/`PatrolHistoryTabs`/`PatrolTimeline`/`PatrolZonesPage`). weight는 기존처럼 `font-*` 유틸리티 그대로 분리 유지(토큰에 미포함)
- [x] T016 `docs/design-system.md` §1-2 스케일 표에 "유틸리티 클래스명" 컬럼 추가 — 코드-문서 SSOT 동기화 in docs/design-system.md

## Phase 7: Polish

- [x] T010 [P] vitest — `PatrolTimeline` 자동 펼침 정책 (정상=접힘, `status=false` 또는 `note` 존재=펼침) in src/features/patrol-zones/components/__tests__/PatrolTimeline.test.tsx (3건)
- [x] T011 [P] vitest — `PatrolHistoryTabs` 활성 표시 (`MemoryRouter`로 각 pathname에서 렌더 → 활성 탭 강조 확인) in src/features/patrol-zones/components/__tests__/PatrolHistoryTabs.test.tsx (3건)
- [x] T012 [P] `docs/screens.md` §1-2 "코스 이력" 진행도 △ → ✓ 갱신 + §5 우선순위 힌트("B+△" 예시가 코스 이력을 참조하던 것 갱신) in docs/screens.md
- [x] T013 `docs/roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 009 patrol-history-zone" 행 ☑ 갱신 in docs/roadmap.md

---

## Dependencies & Execution Order

- **T001, T002 병렬** — 서로 다른 파일, 완전 독립. 코드 재작성 전 선행.
- **T003, T004 병렬** — 프레젠테이션 컴포넌트, 상호 의존 없음. 각각 US1·US2에서 소비.
- **T005 = T002 + T003 완료 후** — 페이지 재작성 시 `PatrolHistoryTabs` 필요, mock 오타 선행 안전.
- **T006 = T005와 병렬 가능** — 같은 폴더지만 파일 다름. T005가 결과 컬럼 셀 렌더러를 참조하므로 실제로는 T006을 먼저(또는 동시) 완료 권장.
- **T007 = T005 + T004 완료 후** — 같은 `PatrolZonesPage.tsx` 파일의 우측 영역. T005 편집과 순차.
- **T008 = T007 완료 후** — `PatrolContentBody` 참조를 T007에서 제거해야 안전 삭제 가능.
- **T009 = T003 완료 후** — 지점 페이지에서 `PatrolHistoryTabs` 렌더링에 필요.
- **T014 → T015 → T016 순차** — 토큰 정의 → 소비처 교체 → 문서 동기화.
- **T010 = T004 이후 / T011 = T003 이후** — 각 컴포넌트 테스트.
- **T012, T013 = 모든 코드 태스크 완료 후** — DoD·회귀 확인 후 문서 갱신.
- **세션 분할 권장**: 세션 A = Phase 1~3(US1) / 세션 B = Phase 4~5(US2·US3) / **세션 C = Phase 6(타이포 토큰화)** / 세션 D = Phase 7(Polish). 한 세션 내에서 이어 진행해도 무방.

## 다음 spec으로 이월

> 다음 spec(**010-patrol-history-point**, R2-2)의 `§0 Carry-over` 입력원.

- [ ] **필터 팝오버/URL 연동/Export 실동작** — 009는 `AppFilterButton`×3 UI 골격 + no-op만 구현. 실제 팝오버 콘텐츠(날짜 선택/코스 선택/결과 선택)와 URL 쿼리스트링 반영, Excel/PDF export는 Phase 3(현장 코어 마감)로 이월 — 010에서도 동일하게 UI 골격만 재사용 권장 → **Phase 3**
- [ ] **`AppButton`/`AppTable`(td/th) 타이포 토큰 미반영** — 로그인·에러·미리디자인 zone/points 화면과 공유해 009에서 범위 제외. `design-system.md` §6 Open Q 등록됨 → **Phase 3·5 (해당 화면 리디자인 시점)**
- [ ] **`PatrolHistoryTabs` 재사용** — 010(`/patrol/points`)은 이미 이 컴포넌트로 탭 골격이 존재(009 T009). 010은 페이지 좌측 컨텐츠(전체 폭 테이블)만 채우면 됨 → **010**
- [ ] **AppPageHeader/AppFilterButton 등 R1 컴포넌트가 이미 010 페이지 상단에 부분 적용됨** — placeholder 상태(`(010 spec에서 지점 순찰이력 컨텐츠 구현 예정)` 문구)를 실컨텐츠로 교체하는 것이 010의 본 작업 → **010**
- [ ] DoD 미달 항목 없음 — spec §5 전 항목 완료(`npm run verify` exit 0, `npm run test` 42/42 통과)
