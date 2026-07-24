# 012-point-management tasks

> 입력: `spec.md`. 위험도 B — 화면 단위로 크게 분할.

---

## Phase 1: Setup

- [x] T040 [P] `PointType`에 `nfcTagId?: string` 필드 추가 + `pointData.ts`의 NFC 지점(예: '로비 1층' 등) 데모 TAG ID 값(14자리 HEX) 채우기 in src/features/points/types/point.ts, src/features/points/mock/pointData.ts

## Phase 2: Foundational (US1~US3 선행)

> **독립 테스트 기준**: `AuthMethodDisplay` 렌더 시 현재 `authenticationMethod`에 해당하는 옵션만 강조되고 클릭 시 상태 변화 없음. `PointListCard` 렌더 시 번호뱃지+이름+`AppBadge`(QR/NFC) 표시, 선택 시 강조. `ZoneRow`가 `isActive` 기반 시맨틱 dot로 렌더.

- [x] T041 [P] `AuthMethodDisplay.tsx` 신규 — 읽기전용 QR/NFC 세그먼트 표시. `AuthMethodSelector`(폼 필드) 스타일 재사용, 클릭 핸들러 없이 `authenticationMethod` prop에 해당하는 옵션만 강조 in src/features/points/components/detail/AuthMethodDisplay.tsx
- [x] T042 [P] `PointListCard.tsx` 카드화 — 번호뱃지 사각형화(원형 → `rounded-sm`) + 우측 `AppBadge`(QR=`point`/NFC=`success`) 추가, 선택 강조 스타일 정리(011 `ZoneNode` 선택 스타일 참고) in src/features/points/components/PointListCard.tsx
- [x] T043 [P] `ZoneRow.tsx` 임의색 제거 — `ZONE_COLORS` 해시 폐기, props를 `{ title, isActive }`로 변경, `isActive` 기반 시맨틱 dot(`bg-point` / `border border-muted-foreground/40`)로 교체(011 `ZoneNode` dot 패턴과 동일) in src/features/points/components/detail/ZoneRow.tsx

## Phase 3: US1~US3 — 지점 목록 + 상세 카드 조립

> **독립 테스트 기준**: `/points` 접속 시 좌측 지점 목록에서 QR 지점 1건·NFC 지점 1건을 각각 선택 → 우측 상세 카드(기본정보/소속 코스/인증수단 읽기전용 표시/NFC일 때만 TAG ID)가 갱신되고, "수정"/"삭제" 버튼과 "코스" 탭(`CourseTabs`)이 기존 로직대로 동작.

- [x] T044 [US1] `PointTopNav.tsx` 추가 버튼을 텍스트 `AppButton` → 정사각형 `AppIconButton`("+")으로 교체(`ZoneSideBar` 패턴 재사용), `AddPointForm` 다이얼로그 트리거는 변경 없음 in src/features/points/components/PointTopNav.tsx
- [x] T045 [US1] `PointDetail.tsx` 상세 카드 재구성 — 소속 코스 섹션에 `ZoneRow`(새 API) 데모 항목 적용 + `AuthMethodDisplay` 추가 + TAG ID 행(NFC 조건부, 모노스페이스 스타일) 추가, 수정/삭제 버튼을 세로 스택 → 가로 배치로 변경(다이얼로그/핸들러 불변) in src/features/points/components/detail/PointDetail.tsx
- [x] T046 [US1,US2,US3] `PointsPage.tsx` 레이아웃 재구성 — `AppPageHeader`(제목 "코스/지점"/서브타이틀) + `CourseTabs` + 좌측(`PointTopNav`+`PointList`) + 우측(`PointDetail` | `AppEmpty`) 조립, 커스텀 `PointEmptyCard` 삭제 in src/pages/service/points/PointsPage.tsx (delete: src/features/points/components/PointEmptyCard.tsx)

## Phase 4: Polish

- [x] T047 [P] vitest — `AuthMethodDisplay` 현재 인증수단만 강조 + 클릭 무반응(읽기전용) 확인 in src/features/points/components/detail/__tests__/AuthMethodDisplay.test.tsx — 3건
- [x] T048 [P] vitest — `PointListCard` 선택 강조 + `AppBadge`(QR/NFC) 렌더 확인 in src/features/points/components/__tests__/PointListCard.test.tsx — 4건
- [x] T049 [P] `docs/screens.md` §1-3 "순찰지점 목록 + 선택 지점 상세" 진행도 △ → ✓ 갱신 in docs/screens.md
- [x] T050 [P] `docs/roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 012" 행 갱신 in docs/roadmap.md

---

## Dependencies & Execution Order

- **T040 선행** — `nfcTagId` 필드가 있어야 T045(TAG ID 표시)가 가능.
- **T041, T042, T043 병렬** — 서로 다른 파일, T040과 독립.
- **T044 = T040 완료 후, T041~T043과 병렬 가능** — 다른 파일(`PointTopNav.tsx`).
- **T045 = T041 + T043 완료 후** — `AuthMethodDisplay`/`ZoneRow` 신규 API를 상세 카드에서 사용.
- **T046 = T042 + T044 + T045 완료 후** — 페이지 조립에 목록 카드·탑나브·상세 카드 모두 필요.
- **T047 = T041 이후 / T048 = T042 이후** — 각 컴포넌트 테스트.
- **T049, T050 = 모든 코드 태스크(T040~T046) 완료 후** — DoD·회귀 확인 후 문서 갱신.
- **세션 분할 권장**: 011 사례처럼 한 세션 내 Phase 1~4 연속 진행 가능(B급, 화면 단위). 012는 한 세션에서 Phase 1~4 연속 진행.

## 다음 spec으로 이월

> 다음 spec(**013-workers**, R2-5, `/users`)의 `§0 Carry-over` 입력원.

- [ ] **NFC TAG ID 유일성 검증 정책** — `data-model.md` 기존 오픈 항목. 012는 표시만 다룸, 검증 로직 미구현 → Phase 3 이후
- [ ] **지점 삭제 시 사용 중 코스 영향 확인** — `screens.md` §1-3 기존 오픈 항목. 012에서도 스텁(`onAction={() => {}}`) 그대로 유지 → Phase 3 이후
- [ ] **소속 코스 실제 연동** — 전역 지점 mock(`features/points`)과 코스별 지점 mock(`features/zone`)이 분리된 데이터셋. `PointDetail.tsx`는 데모 상수(`DEMO_BELONGING_COURSES`) 유지 → Phase 3 이후 mock 통합 시 재검토
- [ ] **모달 "지점사용" 필드 보완 여부** — `screens.md`/구본 목업(`지점생성.png`/`지점수정.png`)엔 토글이 명시되어 있으나 `AddPointForm`/`EditPointForm`엔 없음. 012는 "모달 완전 유지"로 결정 → Phase 3 이후 재검토
- 013(`/users`, 근무자 관리)은 012와 도메인이 달라(코스/지점 ↔ 근무자) 위 항목은 대부분 013과 무관. 013 착수 시 위 4건은 "해당 없음"으로 처리하고 Phase 3 이월 대상으로만 유지.
- DoD 미달 항목 없음(012는 전 항목 완료, `npm run verify` exit 0 · `npm run test` 19 files/63 tests 통과 · 브라우저 시각 확인 완료).
