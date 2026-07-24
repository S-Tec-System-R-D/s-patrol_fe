# 010-patrol-history-point spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-2 진행도 ✗)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-2-순찰이력-조회-전용-생성수정삭제-없음) §1-2
> Phase: roadmap.md Phase R (R2-2)

---

## 0. Carry-over (009 → 010)

- [ ] **필터 팝오버/URL 연동/Export 실동작** — 009는 UI 골격 + no-op만 구현하고 Phase 3로 이월함. 010도 동일하게 필터 트리거 5종(기간/순찰코스/인증수단/순찰자/결과) + 내보내기 버튼을 **UI 골격 + no-op**으로만 구현 → 본 spec에서도 **Phase 3로 재이월** (실동작은 010 범위 아님).
- [ ] **`AppButton`/`AppTable`(td/th) 타이포 토큰 미반영** — 009에서 이미 `design-system.md` §6 Open Q로 등록됨. 010도 동일 컴포넌트를 그대로 사용하므로 별도 처리 없음 (해당 화면 리디자인 시점에 일괄 처리 예정, 010 범위 아님).
- [x] **`PatrolHistoryTabs` 재사용** — 009 T009에서 이미 구현 완료. 010은 수정 없이 그대로 소비.
- [x] **AppPageHeader 등 R1 컴포넌트 placeholder → 실컨텐츠 교체** — 본 spec의 본 작업. §1·§3 참조.
- DoD 미해결 항목 없음 (009는 전 항목 완료).

---

## User Stories

- US1. 현장관리자가 `/patrol/points`에 접속하면 전체 폭 테이블로 지점 단위 순찰이력을 확인한다 — 페이지 헤더 + 탭 + 필터 트리거 5종 + 내보내기 + 테이블(순찰일자·시간·순찰코스·순찰지점·인증뱃지·순찰자·결과뱃지·기록건수) + 페이지네이션. 마스터-디테일 상세 패널은 없음(전체 폭).
- US2. 현장관리자가 기록건수가 1건 이상인 행의 "N건" 뱃지를 클릭하면 "순찰 기록 상세" 모달이 열려 해당 지점 방문에서 기록된 항목들(기록내용 + 첨부사진)을 확인한다.

---

## 1. 목적

`/patrol/points` 지점 순찰이력 화면을 Phase R(리디자인) 셸 위에서 신규 목업(`docs/ui-mock/현장/순찰이력/지점순찰이력-신규.png`)과 일치하는 UI로 신설한다(007에서 만든 placeholder를 실컨텐츠로 교체). 코스 이력(009)과 달리 **상세 패널 없는 전체 폭 테이블** 구조이며, 기록건수 뱃지 클릭 시 별도 모달로 상세를 확인한다. 필터 팝오버·Export 로직·URL 쿼리스트링 연동은 본 spec 범위 밖(009와 동일하게 Phase 3로 이월).

---

## 2. I/O

### Input
- 목록 데이터: 페이지 로컬 mock `pointPatrols` (신규 작성, `PatrolPointsPage.tsx`에 인라인 — 009 `zonePatrols` 패턴과 동일)
- 모달 데이터: 선택된 행의 `records: PointRecordType[]` (기록건수 N건에 대응하는 N개 항목)
- 페이지네이션 상태: 로컬 `useState`(`pageIndex`/`pageSize`) — URL 연동은 Phase 3
- 라우트 탭 상태: 기존 `PatrolHistoryTabs`(009 산출물) 그대로 재사용, 수정 없음

### Output
- 화면 렌더링: `AppPageHeader`(제목 "순찰이력" + 서브타이틀 "코스·지점 단위 순찰 수행 이력을 확인합니다", 009와 동일 문구 유지) + `PatrolHistoryTabs` + 필터 트리거 5종(기간/순찰코스/인증수단/순찰자/결과) + 내보내기 버튼 + 전체 폭 `AppTable`(컬럼: 순찰일자·시간·순찰코스·순찰지점·인증·순찰자·결과·기록) + `AppPagination`
- 상태 변화: 기록건수 뱃지 클릭 → 모달 오픈 상태 갱신(`selectedRecord`) → "순찰 기록 상세" `AppDialog` 렌더. 모달 닫기 → 상태 초기화.
- 외부 효과: 없음. 필터 트리거/내보내기 클릭은 이번 spec에서 no-op 또는 `disabled`(009와 동일 정책).

---

## 3. 제약

### 기술 제약
- **재사용 컴포넌트(필수)**: `AppPageHeader`, `AppFilterButton`(×5), `AppPagination`, `AppTable`(`hidePagination`), `AppBadge`, `AppButton`(내보내기), `AppDialog`(기록 상세 모달), `PatrolHistoryTabs`(009 산출물, 수정 없이 재사용).
- **재사용 훅**: 없음(URL 연동 없음, 009와 동일).
- **신규 컴포넌트**:
  - `PointColumn.tsx` (`features/patrol-points/components/`) — 테이블 컬럼 정의 + 결과/인증 뱃지 매핑 (009 `ZoneColumn.tsx`와 동일 패턴)
  - `PatrolRecordDialog.tsx` (`features/patrol-points/components/`) — 기록 상세 모달. `AppDialog` 기반, 기록 N건을 리스트로 렌더(각 항목: 시각 + 기록내용 + 첨부사진 그리드)
- **폐기 대상**: 없음.
- **타입 처리**: 페이지 로컬 타입 신규 정의(`PointPatrolType`, `PointRecordType`, `PATROL_POINT_RESULT`). 기존 `features/patrol-points/types/PatrolPoint.ts`(`PatrolPointHistory`/`PatrolPointResultState`)는 목업 컬럼 구성과 맞지 않아 **미사용 유지** — 009가 `features/patrol-zones/types/PatrolZone.ts`를 페이지 로컬 타입으로 대체했던 것과 동일 결정. 통합은 Phase 3로 이월.
- **디자인 토큰**: 임의 hex 금지. 시맨틱 트리오만.
- **인증수단 뱃지**: QR = `point-bg`/`point-foreground`, NFC = `success-bg`/`success-foreground` (`design-system.md` §1-1 매트릭스 기존 매핑 그대로 사용, 신규 결정 없음).
- **결과뱃지 5종**: `design-system.md` §1-1 "지점 순찰이력 결과 뱃지 5종 매핑" 표 그대로 사용 — 신규 결정 없음.
- **첨부사진 표기 "N/M"**: **업로드된 장수 / 최대 허용 장수**로 확정(사용자 확인 완료). 최대 허용 장수는 실제 백엔드 정책 미확정 → 본 spec에서는 **UI 데모용으로 3 고정**(mock 상수), 실제 정책은 Open Question으로 남김.
- **기록 상세 모달 구성**: 기록건수 N건인 행을 클릭하면 모달 내부에 **기록 N건을 리스트로 나열**하고 각 항목이 자체적으로 시각/기록내용/첨부사진 그리드를 확장 표시(사용자 확인 완료). 페이저(1건씩 넘기기) 아님.

### 비즈니스 규칙
- **결과 뱃지(지점 이력 5종)**: 이상없음=`success`, 순찰기록=`point`, 시간초과=`danger`, 미완료=`danger`, 순찰제외=`warning`.
- **기록건수 표시**: 0건 → 회색 텍스트 `0`(클릭 불가). N건(N≥1) → 클릭 가능한 버튼형 뱃지(`AppBadge variant="point"`를 버튼으로 감쌈, "N건" 라벨) → 클릭 시 `PatrolRecordDialog` 오픈.
- **시간 컬럼 결측**: 순찰 결과가 `미완료`인 행은 시간 컬럼을 `—`로 표시(목업 "비상구 A" 09:07 미완료 행 참조). 날짜는 그대로 표시.
- **탭 이동**: 009와 동일하게 `PatrolHistoryTabs`가 페이지 헤더 하단에 위치, `/patrol/zones`↔`/patrol/points` 전환.
- **필터·내보내기**: UI 골격만, no-op(009 동일 정책, Phase 3 이월).

---

## 4. 엣지 케이스

공통 규칙 따름 (`CLAUDE.md` / `design-system.md`).

- 목록이 비어 있을 때: `AppTable` 기본 빈 상태 유지.
- 페이지네이션 경계값 처리는 `AppPagination` 자체 스펙에 위임.
- 기록 상세 모달에서 첨부사진이 0장인 기록: "첨부 사진 (0/3)" + 그리드 영역은 빈 상태 문구 표시(별도 컴포넌트 없이 텍스트로 충분).

---

## 5. 완료 조건 (DoD)

- [x] `/patrol/points` 접속 시 신규 목업(`docs/ui-mock/현장/순찰이력/지점순찰이력-신규.png`)과 시각적으로 일치 — 전체 폭 테이블(상세 패널 없음), 필터 5종, 내보내기, 페이지네이션 (M2) — Playwright 스크린샷으로 목업과 대조 확인
- [x] 인증뱃지 QR/NFC, 결과뱃지 5종 매핑이 `design-system.md` §1-1 그대로 반영 — src/features/patrol-points/components/PointColumn.tsx
- [x] 기록건수 0 → 회색 텍스트 `0`(비클릭), N≥1 → 클릭 가능한 버튼형 뱃지, 클릭 시 `PatrolRecordDialog` 오픈 — PointColumn.tsx 기록 셀, vitest로 대체 검증(`PointColumn.test.tsx` 3건)
- [x] `PatrolRecordDialog`: 기록 N건 리스트 + 각 항목 시각/기록내용/첨부사진 그리드("업로드수/최대3" 표기) 렌더 — src/features/patrol-points/components/PatrolRecordDialog.tsx, vitest로 대체 검증(`PatrolRecordDialog.test.tsx` 3건)
- [x] `AppTable hidePagination` + `AppPagination` 실전 배치(009 마이그레이션 패턴 재사용) — src/pages/service/patrol/points/PatrolPointsPage.tsx
- [x] `PatrolHistoryTabs` 재사용, `/patrol/zones` ↔ `/patrol/points` 탭 전환 회귀 없음 — 수정 없이 그대로 소비, 009 vitest 3건 그대로 유효
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 15 files/48 tests 통과
- [x] `screens.md` §1-2 지점 이력 행 진행도 ✗ → ✓ 갱신
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 010" 행 갱신

---

## Open Questions

- [ ] 첨부사진 최대 허용 장수 정책(현재 3 고정은 UI 데모 상수) — 실제 정책 확정 시 데이터 모델/화면 갱신 필요 → Phase 3 이후 백엔드 연동 시점

---

## 참고

- 관련 목업: `docs/ui-mock/현장/순찰이력/지점순찰이력-신규.png`(신규), `지점이력.png`(구본), `지점이력상세(변경가능성).png`(모달 참고, 구본 — 항목 구조는 참고하되 N건 리스트 방식은 본 spec에서 확장)
- 관련 문서: `docs/screens.md` §1-2, `docs/design-system.md` §1-1(뱃지 매핑), `docs/components.md` §5(AppDialog) §9-2~9-6, `docs/patterns.md`
- 009에서 재사용: `PatrolHistoryTabs`(features/patrol-zones/components/)
