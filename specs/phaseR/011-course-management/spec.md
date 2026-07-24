# 011-course-management spec

> 위험도: **B** (출처: `roadmap.md` §5-2, `screens.md` §1-3 "순찰코스 목록 + 선택 코스 상세" 진행도 △)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#1-3-순찰코스--순찰지점-관리) §1-3
> Phase: roadmap.md Phase R (R2-3)

---

## 0. Carry-over (010 → 011)

- [ ] **필터 팝오버/URL 연동/Export 실동작** — 010에서 011로 명시 이월되었으나 011(코스 관리)은 필터·Export가 없는 마스터-디테일 화면이라 **해당 없음**. Phase 3 이월 대상은 순찰이력 2개 화면(009/010)에 한정.
- [ ] **첨부사진 최대 허용 장수 정책** — 010(지점 순찰이력) 전용 이슈. 011과 무관, 그대로 Phase 3 이후 유지.
- [ ] **`AppButton`/`AppTable`(td/th) 타이포 토큰 미반영** — 009에서 등록된 전역 Open Q. 011도 `AppButton`을 그대로 사용하므로 해소되지 않음, `design-system.md` §6에 계속 유지.
- DoD 미달 항목 없음 (010은 전 항목 완료).

---

## User Stories

- US1. 현장관리자가 `/zones`에 접속하면 좌측 코스 목록에서 코스를 선택하고, 우측에 선택된 코스의 **경로 다이어그램 카드**(체크포인트 zigzag 배치, 점선 커넥터 + 구간 소요시간 라벨, 4개 지점마다 줄바꿈)와 그 아래 **지점 순서·편집 카드**(그립 핸들 + 잠금/수정/삭제 아이콘 버튼)를 확인한다.
- US2. 현장관리자가 코스 상세 헤더에서 순찰중 상태(해당 시), 코스명·설명·지점 수, 교대허용/코스활성화 상태를 확인하고 "코스 수정" 버튼으로 기존 수정 모달을 연다.
- US3. 현장관리자가 뷰포트 폭이 768px(`md`) 미만으로 좁아지면 경로 다이어그램 카드가 자동 숨김 처리되고 지점 순서·편집 카드만 노출된다.
- US4. 현장관리자가 상단 "지점" 탭을 클릭하면 `/points`로 이동한다(012 담당 spec, 011은 탭 링크 UI만 제공).

---

## 1. 목적

`/zones` 코스 관리 화면을 Phase R(리디자인) 셸 위에서 신규 목업(`docs/ui-mock/현장/코스-지점관리/코스관리-신규.png`)과 일치하는 UI로 교체한다. **범위는 조회 화면**(좌측 코스 목록 + 우측 경로 다이어그램 카드 신규 + 지점 순서·편집 카드 비주얼)에 한정한다. 코스 추가/수정/삭제 모달 내부 로직, 지점 드래그 정렬 실기능(dnd-kit 미도입, Phase 2 선행 필요), 지점별 소요시간/활성화 모달 로직은 **기존 상태(스텁) 그대로 유지**하고 본 spec에서 변경하지 않는다 — 사용자 확인 완료(011 범위를 "읽기/조회 UI만"으로 결정).

---

## 2. I/O

### Input
- 코스 목록/상세 데이터: 기존 `features/zone/mocks/zoneData.ts`(`ZoneTreeData`) 재사용. `ZoneType`에 데모용 `isPatrolling?: boolean` 필드 추가(사용자 확인 완료 — 명세에 데이터 출처 없어 데모 mock으로 처리, A동 코스 1건만 `true`).
- 선택 코스 상태: 페이지 로컬 `useState<ZoneType | null>` (기존 `ZonesPage.tsx` 로직 유지).

### Output
- 화면 렌더링:
  - `AppPageHeader`(제목 "코스/지점" + 서브타이틀 "순찰 코스와 지점을 구성하고 관리합니다")
  - `CourseTabs`(코스/지점 라우트 링크 탭, `/zones` ↔ `/points`)
  - 좌측 코스 목록 카드(리스트, 항목별 상태 dot + 지점 수 카운트뱃지)
  - 우측: 상세 헤더(순찰중 뱃지 조건부 + 코스명 + 설명("N개 지점" 인라인) + 교대허용/코스활성화 토글(읽기전용 표시) + "코스 수정" 버튼) → `CourseDiagramCard`(zigzag, `md` 미만 숨김) → 지점 순서·편집 카드(그립 + 소요시간 + 인증뱃지 + 잠금/수정/삭제 인라인 버튼, 기존 다이얼로그 재사용) → 하단 "사용지점 N/M · 총 소요시간" 요약바(기존 `CourseTotal` 리스타일).
- 상태 변화: 좌측 목록 클릭 → 우측 상세 전환(기존 로직 유지). 그 외 토글/모달 트리거는 기존 로직 그대로(변경 없음).
- 외부 효과: 없음.

---

## 3. 제약

### 기술 제약
- **재사용(필수)**: `AppPageHeader`, `AppBadge`, `AppButton`, `AppDialog`, `AppAlertDialog`, `AppEmpty`(선택 코스 없음 상태, 기존 유지).
- **신규 컴포넌트**:
  - `CourseTabs.tsx` (`features/zone/components/`) — `/zones`↔`/points` 라우트 링크 탭. `PatrolHistoryTabs`(009 산출물) 패턴 재사용, 012에서도 재사용 예정.
  - `CourseDiagramCard.tsx` (`features/zone/components/`) — zigzag 경로 다이어그램. 4개 지점마다 줄바꿈, 홀수 번째 행은 시각적으로 역순 배치(방향 전환), 노드 사이 점선 커넥터 + 소요시간 라벨, 행 경계는 세로 커넥터로 연결. 조회 전용(액션 없음).
- **수정(비주얼 리디자인, 로직 불변)**:
  - `ZoneSideBar.tsx` / `ZoneTree.tsx` / `ZoneNode.tsx` — 리스트 카드화, 타이포 시맨틱 토큰 적용, 상태 dot 추가.
  - `ZoneTopNav.tsx` — 헤더 재배치(뱃지/토글/버튼 순서), 트리거하는 `EditZoneForm` 다이얼로그 자체는 불변.
  - `PointCard.tsx` — 그립 핸들 + 소요시간 + 인증뱃지 + 잠금/수정/삭제 인라인 버튼 스타일로 재배치.
  - `ActiveMenu.tsx` — 드롭다운(`⋮`) → 인라인 아이콘 버튼 3종으로 교체. 여닫는 다이얼로그(`AppAlertDialog` 비활성화 확인, `AppDialog`+`EditPointForm` 수정, `AppAlertDialog` 삭제 확인)는 동일하게 유지.
  - `ZonesPage.tsx` — 전체 레이아웃 재구성(헤더+탭+마스터-디테일+다이어그램+편집카드+요약바 조립).
- **폐기 대상**:
  - `point-card/AuthenticationBadge.tsx` — `AppBadge`(variant 매핑)로 대체. 기존 이 컴포넌트는 QR/NFC 색상 매핑이 `design-system.md` §1-1과 **반대로 구현된 버그**였음(QR=success, NFC=point로 되어 있었음) → 교체하며 함께 수정.
  - `features/auth/components/location/LocationLayout.tsx`(+ 그 안의 `AppTabs` 사용, 미사용 `LocationTabs.tsx` 포함) — **구현 중 발견**: 라우터가 `/zones`·`/points`를 이 레이아웃으로 묶어 구(舊) "구역/지점" `AppTabs` 탭 바를 페이지 위에 별도로 렌더링하고 있었음(009에서 `PatrolLayout` 폐기 후 `PatrolHistoryTabs`로 대체한 것과 동일한 구조가 코스/지점 쪽엔 아직 남아있던 상태). `CourseTabs` 도입 시 이중 탭 바가 생기는 문제를 발견 → 009 선례를 따라 `LocationLayout` 폐기, 라우터에서 `/zones`·`/points`를 `patrolZones`/`patrolPoints`와 동일하게 `ServiceLayout`의 평평한(flat) 자식으로 승격. `AppTabs`는 이로써 참조 0건이 되어 함께 삭제. `docs/components.md` §8·`docs/patterns.md`·`docs/layout.md`의 관련 서술도 갱신 필요(WF-5).
- **타입 처리**: `ZoneType`(`features/zone/types/zone.ts`)에 `isPatrolling?: boolean` 선택 필드만 추가. `ZonePointType`/`PointType`은 변경 없음.
- **디자인 토큰**: 임의 hex 금지. 시맨틱 트리오만.
- **좁은 폭 대응**: `CourseDiagramCard`를 감싸는 wrapper에 `hidden md:block` 적용(`layout.md` §5-7).

### 비즈니스 규칙
- **경로 다이어그램 zigzag**: 지점을 4개 단위로 행 분할. 짝수 인덱스 행(0, 2, 4…)은 자연 순서(좌→우), 홀수 인덱스 행(1, 3, 5…)은 시각적으로 역순 배치(좌→우 렌더 시 배열을 반전) — 행 끝에서 다음 행 시작으로 이어지는 지그재그 흐름을 만든다. 행과 행 사이는 세로 점선 커넥터로 연결.
- **구간 소요시간 라벨**: 각 지점의 기존 `timeLimit` 필드(도착 지점 기준)를 재사용해 커넥터 라벨로 표시. 별도의 "구간 이동시간" 필드가 명세에 없어 임시로 기존 필드를 재매핑한 것 — Open Question으로 남김.
- **순찰중 뱃지**: `zone.isPatrolling === true`일 때만 상세 헤더에 `AppBadge variant="point"` "순찰중" 노출, 그 외에는 뱃지 없음. 데모 mock 전용, 실시간 연동 없음.
- **인증수단 뱃지**: QR = `point`(`point-bg`/`point-foreground`), NFC = `success`(`success-bg`/`success-foreground`) — `design-system.md` §1-1 확정 매핑 그대로, 신규 결정 아님(기존 컴포넌트 버그 수정).
- **좌측 코스 목록 상태 dot**: `zone.isActive` 기준 — 활성 코스는 채워진 `point` 색 dot, 비활성 코스는 테두리만 있는 `muted` dot. 목업엔 존재하나 문서화된 의미가 없어 본 spec에서 내린 결정(Open Question으로 병기).
- **교대허용/코스활성화 토글**: 읽기 전용 표시(기존과 동일, `onCheckedChange` 없음) — 실제 토글 동작은 Phase 3 이월.
- **지점 순서·편집 카드**: 그립 핸들·잠금·수정·삭제는 시각 배치만 변경. 드래그 실기능(dnd-kit)은 Phase 2 선행 필요 — 그립 핸들은 기존과 동일하게 데코레이션(비기능) 상태 유지.

---

## 4. 엣지 케이스

공통 규칙 따름 (`CLAUDE.md` / `design-system.md`).

- 선택된 코스가 없을 때: 기존 `AppEmpty` 유지.
- 코스 내 지점이 0개: 다이어그램 카드·편집 카드 모두 빈 상태 문구 표시.
- 지점 수가 4의 배수가 아님(예: 5, 6, 7개): 마지막 행이 4개 미만으로 렌더, 정상 동작.

---

## 5. 완료 조건 (DoD)

- [x] `/zones` 접속 시 신규 목업(`docs/ui-mock/현장/코스-지점관리/코스관리-신규.png`)과 시각적으로 일치 (M2) — Playwright 스크린샷으로 목업과 대조 확인(로그인 임시 진입 → `/zones`)
- [x] 좌측 코스 목록 선택 시 우측 다이어그램 카드 + 편집 카드가 선택된 코스 데이터로 갱신 — A동(순찰중 뱃지·6지점)→B동(뱃지 없음·7지점·비활성 지점 포함) 전환 스크린샷으로 확인
- [x] 경로 다이어그램: 4개 지점마다 줄바꿈(zigzag) + 점선 커넥터 + 소요시간 라벨 렌더, 임의 개수(4의 배수 아닌 경우 포함)에서 정상 동작 — 6지점(2+4행 아닌 4+2)·7지점(4+3) 모두 스크린샷 확인
- [x] `md`(768px) 미만 뷰포트에서 다이어그램 카드 자동 숨김, 편집 카드는 그대로 노출 — 700px 뷰포트 스크린샷으로 확인
- [x] QR/NFC 인증뱃지 매핑이 `design-system.md` §1-1과 일치(기존 반대 매핑 버그 수정 확인) — src/features/zone/components/PointCard.tsx, CourseDiagramCard.tsx, AddPointForm.tsx
- [x] 순찰중 뱃지: `isPatrolling: true`인 코스에서만 노출, 나머지는 미노출 — A동만 노출, B동 미노출 확인
- [x] 지점 편집 카드의 잠금/수정/삭제 버튼 클릭 시 기존 다이얼로그(비활성화 확인/수정모달/삭제확인)가 회귀 없이 동작 — `ActiveMenu.tsx` 인라인 버튼화, 다이얼로그 컴포넌트/핸들러 불변(코드 검토로 확인, 기존 vitest 없음)
- [x] 상단 "지점" 탭 클릭 시 `/points`로 이동, 활성 탭 강조 표시 — `CourseTabs`(NavLink 기반, `PatrolHistoryTabs` 패턴)
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 15 files/48 tests 통과(기존 테스트 전부 유지, 회귀 없음)
- [x] `screens.md` §1-3 "순찰코스 목록 + 선택 코스 상세" 행 진행도 △ → ✓ 갱신
- [x] `roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 011" 행 갱신

**부가 반영 (spec 작성 시점엔 없었으나 구현 중 발견·해소)**
- `LocationLayout`/`AppTabs`/`LocationTabs` 폐기 — 이중 탭 바 버그 해소(§3 참조). 라우터에서 `/zones`·`/points`를 `ServiceLayout` 평평한 자식으로 승격.
- `PointCard.tsx`/`ZoneNode.tsx`/`ZoneSideBar.tsx`/`ZoneTopNav.tsx` 타이포 시맨틱 토큰 적용.

**부가 반영 (사용자 시각 피드백 반영, 1차 완료 후)**
- 상세 헤더 "순찰중" 상태 뱃지 완전 제거(`isPatrolling` 필드도 함께 제거 — 사용처 없어짐). 순찰 진행 상태 표시는 본 spec 범위에서 제외.
- 다이어그램 체크포인트 노드: 원형+테두리만 → **사각형(rounded-lg)+`point-bg`/`point-foreground` 채움**(비활성은 `bg-muted`)으로 변경. 활성 노드에는 이후 사용자가 직접 `border-2 border-point` 외곽선을 추가.
- 다이어그램 카드 배경: 단색 `bg-card`(흰색)가 밋밋하다는 피드백 → `bg-muted/40` 톤 + 점 격자(dot-grid) 텍스처로 변경, "경로/공간" 컨셉에 맞는 캔버스 느낌 부여.
- 노드 간 커넥터(가로/세로 점선): `border` 1px `border-border` → `border-2` + `border-point`로 변경(흰색 시도 시 배경과 대비 없어 보이지 않는 문제 확인 후 point 컬러로 최종 확정).

---

## Open Questions

- [ ] **경로 다이어그램 구간 소요시간 값 출처** — 현재 `point.timeLimit` 재사용(도착 지점 기준). 실제로 "지점 체류시간"과 "구간 이동시간"이 별도 개념인지 백엔드/명세 확정 필요 → Phase 3 이후 백엔드 연동 시점
- [ ] **순찰중(`isPatrolling`) 실시간 연동** — 데모 mock 상수. 실제 순찰 세션 진행 여부를 판단하는 API/로직 확정 필요 → Phase 3 이후
- [ ] **좌측 코스 목록 상태 dot 색상 의미** — 목업엔 존재하나 문서화된 의미 없음. 본 spec은 `isActive` 매핑으로 결정, 추후 재검토 여지
- [ ] **`/points`가 코스/지점 탭 없이 렌더** — `LocationLayout` 폐기로 `/points`는 현재 "코스/지점" 탭 바가 없는 상태(레일 사이드바로는 이동 가능). 010이 `/patrol/points`에 `PatrolHistoryTabs`를 붙였던 것과 동일하게, **012에서 `CourseTabs`를 `/points` 페이지에 붙여 해소** 예정 → 012로 이월

---

## 참고

- 관련 목업: `docs/ui-mock/현장/코스-지점관리/코스관리-신규.png`(신규). `코스관리목록.png`/`코스목록.png`/`코스수정.png`/`코스내지점수정.png`는 구본(모달 내부 참고용, 본 spec 범위 밖).
- 관련 문서: `docs/screens.md` §1-3, `docs/design-system.md` D10·§1-1(뱃지 매핑), `docs/layout.md` §5-7(좁은 폭 숨김), `docs/new-design-note.md` "코스/지점" 절.
- 009에서 재사용 패턴 참고: `PatrolHistoryTabs`(라우트 탭 구조).
- 012(`/points`)에서 재사용 예정: `CourseTabs`.
