# 009-patrol-history-zone spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-2 진행도 △)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-2-순찰이력-조회-전용-생성수정삭제-없음) §1-2
> Phase: roadmap.md Phase R (R2-1)

---

## 0. Carry-over (008 → 009)

- [ ] **`design-system.md` §1-1 Open Q — 코스 순찰이력 `진행중` 뱃지 시맨틱** → 목업(`코스순찰이력-신규.png`) 재확인 결과 파란색이므로 **`point`로 확정**하고 §1-1 매핑 표 갱신(`진행 중` 행 `warning` → `point`).
- [ ] **`AppTable` → `AppPagination` 실전 교체** → 본 spec에서 최초 마이그레이션. `AppTable`은 `hidePagination` 옵션을 켜고, 페이지 하단에 `AppPagination` 컴포넌트를 소비 측에서 직접 배치.
- [ ] **`PatrolZonesPage.tsx:51` pre-existing 타입 에러** → 페이지 재작성 과정에서 자연 해소. 남는 잔여 에러는 `PATROL_RESULT.IN_PROGRESS` 값 오타(`'IN_COMPLETE'`)만 수정하고 나머지 타입 통합은 본 spec 범위 외로 명시.

---

## User Stories

- US1. 현장관리자가 `/patrol/zones` 접속 시 신규 셸(RailSidebar + ServiceLayout) 위에서 신규 목업과 시각적으로 일치하는 코스 순찰이력 페이지를 본다 — 페이지 헤더 + 탭 + 필터 트리거 3종 + 내보내기 + 테이블 + 페이지네이션 + 우측 상세 카드.
- US2. 현장관리자가 코스 이력 행을 클릭하면 우측에 `AppDetailCard`가 렌더링되어 순찰정보(시작·종료·지점 수)와 타임라인(순찰 시작 → 각 지점 → 순찰 종료)을 확인한다. 특이사항이 있는 지점과 미방문 지점은 자동으로 펼쳐져 상세가 함께 표시된다.
- US3. 현장관리자가 상단 "지점 순찰이력" 탭 링크를 클릭하면 `/patrol/points` 라우트로 이동한다(010 spec의 실컨텐츠는 별도 담당, 009는 라우트 링크 UI만).

---

## 1. 목적

`/patrol/zones` 코스 순찰이력 화면을 Phase R(리디자인) 셸 위에서 신규 목업(`docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png`)과 일치하는 UI로 전면 교체한다. **데이터·기능·문구는 유지, UI만 교체**한다. 필터 팝오버·Export 로직·URL 쿼리스트링 연동 같은 상호작용 로직은 본 spec 범위 밖(Phase 3에서 재산정).

---

## 2. I/O

### Input
- 목록 데이터: 페이지 로컬 mock `zonePatrols` (기존 `PatrolZonesPage.tsx`에 인라인, 유지)
- 상세 데이터: 선택된 행의 `ZonePatrolType` (`points: PointPatrolType[]` 포함)
- 페이지네이션 상태: 로컬 `useState`(`pageIndex`/`pageSize`) — URL 연동은 Phase 3
- 라우트 탭 상태: `useLocation().pathname`으로 활성 탭 판단

### Output
- 화면 렌더링: `AppPageHeader`(제목 "순찰이력" + 서브타이틀 "코스·지점 단위 순찰 수행 이력을 확인합니다") + 탭(코스 순찰이력 / 지점 순찰이력) + 필터 트리거 3종(기간/코스/결과) + 내보내기 버튼 + 테이블(코스명·시작 일시·종료 일시·순찰 결과) + `AppPagination` + 우측 `AppDetailCard`(선택 시)
- 상태 변화: 행 클릭 → `selectedPatrol` 상태 갱신 → 우측 상세 카드 갱신. 페이지 이동 시 선택 유지 여부는 목업에 명시 없음 → 페이지 이동 시 초기화(리셋).
- 외부 효과: 없음. 필터 트리거/내보내기 클릭은 이번 spec에서 no-op 또는 `disabled`.

---

## 3. 제약

### 기술 제약
- **재사용 컴포넌트(필수)**: `AppPageHeader`, `AppFilterButton`, `AppPagination`, `AppDetailCard`, `AppDetailRow`, `AppBadge` (R1 008 산출물). `AppButton`(내보내기). `AppTable`(테이블 본체, `hidePagination` 옵션 신규 사용).
- **재사용 훅**: 없음(URL 연동 없음).
- **신규 컴포넌트**:
  - `PatrolHistoryTabs` (라우트 링크 탭. `/patrol/zones`↔`/patrol/points` 활성 표시. features/patrol-zones/components/에 두되 patrol-points와 공유되므로 위치 결정은 구현 시 재확인)
  - `PatrolTimeline` (타임라인 카드 본문. `AppDetailCard`의 children으로 들어감)
- **폐기 대상**: `src/features/patrol-zones/components/PatrolSheet.tsx`의 `PatrolContentBody`(우측 패널). 재사용 지점 없음 확인 후 파일 삭제.
- **타입 처리**: 페이지 로컬 `ZonePatrolType`/`PointPatrolType`/`PATROL_RESULT` 유지. `IN_PROGRESS: 'IN_COMPLETE'` 오타만 `'IN_PROGRESS'`로 수정. `features/patrol-zones/types/PatrolZone.ts`와의 통합은 Phase 3로 이월.
- **디자인 토큰**: 임의 hex 금지. 시맨틱 트리오만. `design-system.md` §1-1 뱃지 매핑 갱신 대상 = 코스 이력 진행중(`warning` → `point`).

### 비즈니스 규칙
- **결과 뱃지(코스 이력 3종)**: 완료 = `success`, 미완료 = `danger`, **진행중 = `point`**(신규 확정).
- **타임라인 항목 자동 펼침 정책**:
  - 순찰 시작 / 종료: 접힘(아이콘 + 라벨 + 시각만)
  - 정상 지점(status=true, note 비어있음): 접힘
  - 특이사항 있는 지점(status=false OR note 존재): 자동 펼침. "특이사항" 뱃지(`AppBadge variant="danger"` 또는 `warning`, 목업 재확인 후 결정) + `note` 텍스트 표시. 시각 표시는 유지.
  - 미방문 지점(추후 데이터 확장 시): x 아이콘 + "예정 시간 내 미방문 — 순찰 미완료 처리" 자동 펼침. **현재 mock에는 명시적 "미방문" 케이스 없음** → 본 spec에서는 목업의 "비상구 A" 예시를 흉내 낸 정적 데모를 mock에 1건 추가하는 것까지만.
- **탭 이동**: 클릭 시 상단 URL만 바뀌고 페이지 헤더/필터 골격은 두 탭이 공유. 지점 탭 진입 시의 컨텐츠는 010 spec에서 채움 → 009 완료 시점의 `/patrol/points`는 007에서 임시 placeholder일 것으로 가정.

---

## 4. 엣지 케이스

공통 규칙 따름 (`CLAUDE.md` / `design-system.md`).

- 선택된 이력이 없을 때 우측: 기존 `AppEmpty` 유지 (아이콘·문구 그대로).
- 목록이 비어 있을 때: `AppTable` 기본 빈 상태 유지.
- 페이지네이션 경계값 처리는 `AppPagination` 자체 스펙에 위임.

---

## 5. 완료 조건 (DoD)

- [x] `/patrol/zones` 접속 시 신규 목업(`docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png`)과 시각적으로 일치 (M2) — 세션 A~D에 걸쳐 사용자가 실브라우저로 반복 확인·조정(border/surface/spacing/폰트 등)
- [x] R1 6종 컴포넌트 모두 실사용 — `AppPageHeader` src/pages/service/patrol/zones/PatrolZonesPage.tsx:61, `AppFilterButton`×3 :67-69, `AppPagination` :88, `AppDetailCard` :118, `AppDetailRow`×3 :128-130, `AppBadge` :121(+src/features/patrol-zones/components/ZoneColumn.tsx 결과 셀)
- [x] 상단 "지점 순찰이력" 탭 링크 클릭 시 `/patrol/points`로 이동, 활성 탭 강조 표시 (M6) — src/features/patrol-zones/components/PatrolHistoryTabs.tsx, vitest로 대체 검증(`PatrolHistoryTabs.test.tsx` 3건)
- [x] `AppTable`에 `hidePagination` 적용 + 페이지 하단 `AppPagination` 실전 배치 (008 이월 해소) — PatrolZonesPage.tsx:82-94, src/components/AppTable.tsx(controlled `pagination`/`onPaginationChange` 확장)
- [x] `design-system.md` §1-1 매트릭스 "진행 중" 행이 `point`로 갱신, Open Q에서 항목 제거 (008 이월 해소) — docs/design-system.md §1-1, §6
- [x] `PATROL_RESULT.IN_PROGRESS` 오타 수정 (`'IN_COMPLETE'` → `'IN_PROGRESS'`), 그로 인한 참조 코드 회귀 없음 — PatrolZonesPage.tsx:28
- [x] `PatrolSheet.tsx`(`PatrolContentBody`) 폐기 — 참조 0건 확인 후 파일 삭제
- [x] 타임라인 자동 펼침 정책(정상=접힘, 특이사항=펼침) 동작 확인 (M2) — `PatrolTimeline.test.tsx` 3건으로 대체 검증
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 13 files/42 tests 통과
- [x] `screens.md` §1-2 코스 순찰이력 행 진행도 △ → ✓ 갱신
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 009" 행 ☑ 갱신

**부가 반영 (spec 작성 시점엔 없었으나 세션 중 확정된 결정)**
- 타이포 시맨틱 토큰 10종 신설(`text-page-title`~`text-label`, `design-system.md` §1-2) 및 009 소비 컴포넌트 8개 파일 적용
- 페이지 레벨 spacing `gap-4`(16px) 컨벤션 시범 적용
- `PatrolLayout.tsx`(구 "구역/지점" 탭 wrapper) 폐기 — `PatrolHistoryTabs`와 중복이라 라우터에서 직접 승격
- `AppButton`/`AppTable`(td/th)은 로그인·에러·미리디자인 zone/points 화면과 공유 컴포넌트라 타이포 토큰화 범위에서 제외 — `design-system.md` §6 Open Q로 이월

---

## 참고

- 관련 목업: `docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png` (신규), `코스이력.png` (구본, 비교용)
- 관련 문서: `docs/screens.md` §1-2, `docs/design-system.md` §1-1 (뱃지 매핑), `docs/layout.md` §4-2 (마스터-디테일), `docs/components.md` (R1 6종 사용 가이드)
- 010(`/patrol/points`)에서 재사용될 예정 컴포넌트: `PatrolHistoryTabs` (탭 링크 컴포넌트)
