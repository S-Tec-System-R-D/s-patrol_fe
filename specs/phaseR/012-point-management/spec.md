# 012-point-management spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-3 "순찰지점 목록 + 선택 지점 상세" 진행도 △)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-3-순찰코스--순찰지점-관리) §1-3
> Phase: roadmap.md Phase R (R2-4)

---

## 0. Carry-over (011 → 012)

- [ ] **`/points`에 `CourseTabs` 미부착** — 011에서 `LocationLayout` 폐기로 `/points`가 탭 바 없이 렌더됨 → **본 spec에서 `CourseTabs`를 `PointsPage.tsx`에 부착해 해소**.
- [ ] **코스 CRUD 모달 로직·지점 드래그 실기능(dnd-kit)** — 011은 조회 UI만 다룸. 012 착수 시 "`/points` 편집 모달도 스텁 유지할지 재확인 필요"로 이월됨 → **사용자 확인 완료: 모달(`AddPointForm`/`EditPointForm`) 완전 유지, 필드·로직 변경 없음.** 실동작은 Phase 2(dnd-kit)/Phase 3 이후.
- [ ] **경로 다이어그램 구간 소요시간 값 출처**(`point.timeLimit`) — 011(코스) 전용 이슈, 012(지점 조회 화면)와 무관. Phase 3 이후 유지.
- [ ] **순찰중(`isPatrolling`) 실시간 연동** — 011 전용, 012와 무관. Phase 3 이후 유지.
- [ ] **좌측 코스 목록 상태 dot 색상 의미**(`isActive` 매핑) — 012의 지점 목록/상세에도 동일 매핑 재사용(본 spec §3에 반영).
- DoD 미달 항목 없음(011은 전 항목 완료).

---

## User Stories

- US1. 현장관리자가 `/points`에 접속하면 좌측 지점 목록(검색 입력 + 정사각형 추가 버튼 + 번호·이름·인증뱃지 카드)에서 지점을 선택하고, 우측 상세 카드(기본정보/소속 코스/인증수단 읽기전용 표시/NFC TAG ID)를 확인한다.
- US2. 현장관리자가 상세 카드 하단의 "수정"/"삭제" 버튼으로 기존 편집 모달과 삭제 확인 다이얼로그를 연다(모달 내부 로직 불변).
- US3. 현장관리자가 상단 "코스" 탭을 클릭하면 `/zones`로 이동한다(011 산출물 `CourseTabs` 재사용, 부착만 본 spec 범위).

---

## 1. 목적

`/points` 지점 관리 화면을 Phase R(리디자인) 셸 위에서 신규 목업(`docs/ui-mock/현장/코스-지점관리/지점관리-신규.png`)과 일치하는 UI로 교체한다. **범위는 조회 화면**(좌측 지점 목록 + 우측 상세 카드 비주얼)에 한정한다. 지점 추가/수정 모달(`AddPointForm`/`EditPointForm`) 내부 필드·로직은 **기존 상태(스텁) 그대로 유지**하고 본 spec에서 변경하지 않는다 — 사용자 확인 완료(012 범위를 "조회 UI만"으로 결정, 011과 동일한 원칙).

---

## 2. I/O

### Input
- 전역 지점 목록: 기존 `features/points/mock/pointData.ts`(`PointType[]`, 15건) 재사용.
- `PointType`에 데모용 `nfcTagId?: string` 필드 추가(NFC 지점의 TAG ID 표시용, 명세에 실제 발급 로직 없어 데모 상수 — 사용자 확인 완료). QR 지점은 값 없음.
- 소속 코스 표시용 데모 상수: 기존 `PointDetail.tsx`의 하드코딩 값 유지, 라벨/텍스트만 "코스" 용어로 통일(사용자 확인 완료 — 실제 연동은 Open Question으로 이월).
- 선택 지점 상태: 페이지 로컬 `useState<PointType | null>` (기존 `PointsPage.tsx` 로직 유지).

### Output
- 화면 렌더링:
  - `AppPageHeader`(제목 "코스/지점" + 서브타이틀 "순찰 코스와 지점을 구성하고 관리합니다", 011과 동일 문구)
  - `CourseTabs`(011 산출물 부착, `/zones` ↔ `/points`)
  - 좌측: 검색 `AppInput`(기존과 동일 비와이어드 유지, 범위 밖) + `AppIconButton`(정사각형 "+", `ZoneSideBar` 패턴 재사용) → `AddPointForm` 다이얼로그 트리거
  - 좌측 목록: 지점 카드화(번호뱃지 + 이름 + 우측 `AppBadge`(QR=`point`/NFC=`success`)), 선택 시 강조
  - 우측 상세 카드: 헤더(`MapPinIcon` + 지점명) → 기본정보(이름/설명/생성일) → 소속 코스(dot + 코스명 리스트, 임의색 제거) → 인증수단(읽기전용 세그먼트 표시, 클릭 불가) → NFC 지점만 TAG ID 표시(모노스페이스 코드 스타일) → 수정/삭제 버튼(가로 배치)
  - 지점 없음(빈 상태): 공용 `AppEmpty`로 표시(기존 커스텀 `PointEmptyCard` 폐기)
- 상태 변화: 좌측 목록 클릭 → 우측 상세 전환(기존 로직 유지). 그 외 모달 트리거는 기존 로직 그대로(변경 없음).
- 외부 효과: 없음(모달 제출은 기존과 동일 `console.log` 스텁).

---

## 3. 제약

### 기술 제약
- **재사용(필수)**: `AppPageHeader`, `CourseTabs`(011 산출물, 신규 파일 없음), `AppBadge`, `AppButton`, `AppIconButton`, `AppDialog`, `AppAlertDialog`, `AppEmpty`.
- **신규 컴포넌트**:
  - `AuthMethodDisplay.tsx`(`features/points/components/detail/`) — 읽기전용 QR/NFC 세그먼트 표시. `AuthMethodSelector`(폼 필드)와 시각 스타일은 동일하되 클릭 핸들러 없음(현재 지점의 `authenticationMethod`만 강조).
- **수정(비주얼 리디자인, 로직 불변)**:
  - `PointTopNav.tsx` — 추가 버튼을 텍스트 `AppButton` → 정사각형 `AppIconButton`("+")으로 교체(`ZoneSideBar` 패턴).
  - `PointListCard.tsx` — 번호뱃지 사각형화 + 우측 `AppBadge`(인증수단) 추가, 선택 강조 스타일 정리.
  - `PointDetail.tsx` — 상세 카드 재구성(소속 코스/인증수단 표시/TAG ID 추가, 수정·삭제 버튼 가로 배치로 변경).
  - `ZoneRow.tsx` — 임의 Tailwind 색상 해시(`ZONE_COLORS`) 제거, `isActive` 기반 시맨틱 dot(`bg-point` / `border-muted-foreground/40`)로 교체 — `design-system.md` 임의 hex 금지 위반 수정(011의 코스 목록 dot와 동일 패턴, ZoneRow가 이번에 손대는 파일이라 함께 정리).
  - `PointsPage.tsx` — 전체 레이아웃 재구성(헤더+탭+마스터-디테일 조립).
- **폐기 대상**:
  - `PointEmptyCard.tsx` — `AppEmpty`로 대체(011 패턴 통일, 기존 컴포넌트의 오타 "상서젱보" 포함 문제 해소).
- **타입 처리**: `PointType`(`features/points/types/point.ts`)에 `nfcTagId?: string` 선택 필드만 추가.
- **디자인 토큰**: 임의 hex/Tailwind 색상 팔레트 금지. 시맨틱 트리오만.
- **모달**: `AddPointForm`/`EditPointForm`/`AuthMethodSelector`/`schema.ts` **변경 없음**(필드·로직·스타일 전부 불변).

### 비즈니스 규칙
- **인증뱃지 매핑**: QR = `point`, NFC = `success` — 011에서 확정된 매핑 그대로(`design-system.md` §1-1), 신규 결정 아님.
- **인증수단 읽기전용 표시**: 지점의 `authenticationMethod`에 해당하는 옵션만 강조(`point` 컬러), 클릭 시 아무 동작 없음.
- **NFC TAG ID**: NFC 지점만 표시, QR 지점은 미표시 — 기존 폼의 조건부 로직과 동일한 원칙.
- **좌측 지점 목록 검색 입력**: 기존과 동일하게 비와이어드 상태 유지(범위 밖, 명시적 결정).
- **소속 코스**: 데모 상수 표시(다중 가능 UI 지원하되 실제 데이터 연동 없음) — Open Question 유지.

---

## 4. 엣지 케이스

공통 규칙 따름 (`CLAUDE.md` / `design-system.md`).

- 선택된 지점이 없을 때(목록이 비어 있는 극단 상황): `AppEmpty` 표시.
- QR 지점 선택 시: TAG ID 행 자체를 렌더하지 않음(빈 값 표시 금지).

---

## 5. 완료 조건 (DoD)

- [x] `/points` 접속 시 신규 목업(`docs/ui-mock/현장/코스-지점관리/지점관리-신규.png`)과 시각적으로 일치 (M2) — 사용자 브라우저 확인 완료
- [x] 상단 "지점" 탭이 강조 표시되고, "코스" 탭 클릭 시 `/zones`로 이동 (`CourseTabs` 재사용 확인) — src/pages/service/points/PointsPage.tsx
- [x] 좌측 목록에서 QR 지점 1건, NFC 지점 1건 각각 선택 시 우측 상세 카드가 해당 데이터로 갱신 — 사용자 확인 완료
- [x] NFC 지점 선택 시에만 TAG ID 행 표시, QR 지점 선택 시 미표시 — src/features/points/components/detail/PointDetail.tsx:47-52
- [x] 인증수단 읽기전용 세그먼트에서 클릭 시 상태 변화 없음(읽기전용 확인) — src/features/points/components/detail/AuthMethodDisplay.tsx, vitest로 검증
- [x] 상세 카드의 "수정"/"삭제" 버튼 클릭 시 기존 다이얼로그(수정 모달/삭제 확인)가 회귀 없이 동작 — 다이얼로그/핸들러 불변(코드 검토+사용자 확인)
- [x] `AppEmpty`가 빈 상태에서 정상 렌더(기존 `PointEmptyCard` 오타·비표준 스타일 해소 확인) — src/pages/service/points/PointsPage.tsx, PointEmptyCard.tsx 삭제
- [x] `ZoneRow` dot 색상이 임의 팔레트가 아닌 `isActive` 기반 시맨틱 토큰으로 렌더 — src/features/points/components/detail/ZoneRow.tsx
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 19 files/63 tests 통과(기존 전부 유지 + 신규 7건)
- [x] `screens.md` §1-3 "순찰지점 목록 + 선택 지점 상세" 행 진행도 △ → ✓ 갱신
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 012" 행 갱신

---

## Open Questions

- [ ] **NFC TAG ID 유일성 검증 정책** — `data-model.md` 기존 오픈 항목(지점 단위 고유 여부). 본 spec은 표시만 다룸, 검증 로직은 범위 밖.
- [ ] **지점 삭제 시 사용 중 코스 영향 확인** — `screens.md` §1-3 기존 오픈 항목. 012에서도 기존 스텁(`onAction={() => {}}`) 그대로 유지.
- [ ] **소속 코스 실제 연동** — 전역 지점 mock(`features/points`)과 코스별 지점 mock(`features/zone`)이 분리된 데이터셋이라 실제 연결 시 두 mock 정리 필요 → Phase 3 이후
- [ ] **모달 "지점사용" 필드 보완 여부** — `screens.md`/구본 목업(`지점생성.png`/`지점수정.png`)엔 토글이 명시되어 있으나 현재 폼엔 없음. 012는 "모달 완전 유지"로 결정, 재검토는 Phase 3 이후

---

## 참고

- 관련 목업: `docs/ui-mock/현장/코스-지점관리/지점관리-신규.png`(신규, 셸 기준). `지점생성.png`/`지점수정.png`는 구본(모달 필드 참고용, 셸은 구버전이라 스타일 기준 아님).
- 관련 문서: `docs/screens.md` §1-3, `docs/data-model.md` §3-3(`PatrolPoint.belongingCourses`), `docs/design-system.md` §1-1(뱃지 매핑).
- 011에서 재사용: `CourseTabs`, `ZoneSideBar`/`ZoneNode`의 상태 dot 패턴, `AppEmpty` 사용 패턴.
