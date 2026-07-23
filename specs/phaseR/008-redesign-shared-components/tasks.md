# 008-redesign-shared-components tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 B — 컴포넌트(=화면 단위 상당) 크게 분할. 컴포넌트 간 상호 의존 없음(모두 프레젠테이션 전용) → 대부분 `[P]` 병렬 가능.

---

## Phase 1: Setup

- [x] T001 [P] `AppBadge.variants.ts` cva 베이스 정의 (5 variant: success/point/warning/danger/muted) in src/components/app/AppBadge.variants.ts

## Phase 2: Foundational

해당 없음 — 6개 컴포넌트가 서로 참조하지 않는 독립 프레젠테이션 컴포넌트. `AppDetailRow`만 `AppDetailCard`의 바디에서 함께 쓰이지만 코드 의존은 없음(각자 독립 export).

## Phase 3: US1 — AppPageHeader

> **독립 테스트 기준**: 임의 페이지에서 `<AppPageHeader title="근무자" subtitle="..." action={<Button>근무자 추가</Button>} />` 렌더 시 목업(근무자-신규.png)과 동일한 배치(제목 bold + 부제 muted + 우측 action) 확인

- [x] T002 [US1] `AppPageHeader` 컴포넌트 in src/components/app/AppPageHeader.tsx

## Phase 4: US2 — AppFilterButton

> **독립 테스트 기준**: 아이콘+라벨+chevron 트리거 렌더, `active` prop 시 강조 스타일(테두리/배경) 전환 확인. 실제 팝오버 콘텐츠 결합은 본 spec 범위 아님(스토리북/임시 페이지에서 클릭 시 `active` 토글만 확인)

- [x] T003 [US2] `AppFilterButton` 컴포넌트 in src/components/app/AppFilterButton.tsx

## Phase 5: US3 — AppPagination

> **독립 테스트 기준**: `pageIndex=0, pageSize=10, total=25`로 렌더 시 "1–10 / 전체 25개 항목" + 이전 비활성/다음 활성. `pageIndex=2`(마지막)에서 다음 비활성. `pageSize` 변경 콜백 시 `onPageSizeChange` 호출 확인(리셋 로직은 소비 측 책임 — 컴포넌트는 콜백만 발행)

- [x] T004 [US3] `AppPagination` 컴포넌트 in src/components/app/AppPagination.tsx
- [x] T005 [US3] `AppTable`에 `hidePagination?: boolean` prop 추가(기본 `false`, 미지정 시 기존 동작 무변화) in src/components/AppTable.tsx

## Phase 6: US4 — AppDetailCard / AppDetailRow

> **독립 테스트 기준**: `<AppDetailCard icon={Icon} title="B동 순찰코스" badge={<AppBadge variant="danger">미완료</AppBadge>} footer={...}>` 안에 `<AppDetailRow label="시작 일시" value="2026-05-01 10:00:00" />` 여러 개 렌더 시 목업(코스순찰이력-신규.png 우측 패널)과 동일한 헤더/바디/풋터 구조 확인

- [x] T006 [US4] `AppDetailCard` 컴포넌트 in src/components/app/AppDetailCard.tsx
- [x] T007 [US4] `AppDetailRow` 컴포넌트 in src/components/app/AppDetailRow.tsx

## Phase 7: US5 — AppKpiCard

> **독립 테스트 기준**: `<AppKpiCard icon={ArrowRightIcon} label="배치 나간 인원" value={1} unit="명" tone="point" />` 렌더 시 목업(배치관리-신규.png 상단 3타일)과 동일한 원형 아이콘 배지+라벨+큰 숫자+단위 배치 확인. `tone` 3종(point/success/warning) 색상 전환 확인

- [x] T008 [US5] `AppKpiCard` 컴포넌트 in src/components/app/AppKpiCard.tsx

## Phase 8: US6 — AppBadge

> **독립 테스트 기준**: variant 5종(`success`/`point`/`warning`/`danger`/`muted`) 각각 렌더 시 `design-system.md` §1-1 트리오 토큰(`{semantic}-bg`+`{semantic}-foreground`)이 클래스에 반영되는지 확인. children 텍스트 없이 렌더 시 타입 에러(색만 전달 금지 강제)

- [x] T009 [US6] `AppBadge` 컴포넌트 in src/components/app/AppBadge.tsx (T001 variants 파일 사용)

## Phase 9: Polish

- [x] T010 [P] vitest — `AppPagination` 경계값 테스트(첫/마지막 페이지 비활성, 콜백 호출) in src/components/app/__tests__/AppPagination.test.tsx
- [x] T011 [P] vitest — `AppBadge` variant별 클래스 스냅샷/속성 테스트 in src/components/app/__tests__/AppBadge.test.tsx
- [x] T012 `docs/components.md` — §0 카탈로그 표 + 개별 사용 가이드 섹션 6개 추가(AppPageHeader/AppFilterButton/AppPagination/AppDetailCard·AppDetailRow/AppKpiCard/AppBadge)

---

## Dependencies & Execution Order

- T001 → T009 (AppBadge는 variants 파일 선행 필요)
- T004 → T005 (AppPagination 컴포넌트가 먼저 있어야 AppTable에 탈출구 prop을 의미 있게 추가 가능 — 단, T005는 AppTable 코드만 수정하므로 병행 착수 가능, merge 전 T004 완료 확인)
- T002, T003, T006, T007, T008 — 서로 완전 독립, `[P]` 병렬 가능
- T009 — T001 완료 후 진행
- T010은 T004 이후, T011은 T009 이후
- T012는 모든 컴포넌트(T002~T009) 완료 후 마지막에 진행
- Phase 3~8(US1~US6)은 서로 blocking 없음 — 세션을 나눠도 되고, 한 세션에서 순서대로 진행해도 무방(6개 다 소규모)

## 다음 spec으로 이월

> 다음 spec(**009-patrol-history-zone**, R2-1)의 `§0 Carry-over` 입력원.

- [ ] **`design-system.md` §6 Open Q — 코스 순찰이력 `진행중` 뱃지 시맨틱** — 사용 매트릭스는 `warning`으로 나열하나 `코스순찰이력-신규.png` 목업은 파란(`point`) 색. 009에서 목업 재확인 후 `AppBadge` variant 확정 + 표 갱신 → **009**
- [ ] **`AppTable` → `AppPagination` 실제 교체** — 008은 컴포넌트만 신설(`hidePagination` 탈출구만 열어둠), 009(순찰이력-코스 목록)가 실제 사용 화면이므로 여기서 최초 마이그레이션 진행 → **009**
- [ ] **007에서 이월된 pre-existing 타입 에러** — `PatrolZonesPage.tsx:51`(009가 다루는 파일) → **009**
- [ ] DoD 미달 항목 없음 — spec §5 전 항목 완료(`npm run verify` exit 0, `npm run test` 36/36 통과)
