# 011-course-management tasks

> 입력: `spec.md`. 위험도 B — 화면 단위로 크게 분할.

---

## Phase 1: Setup

- [x] T026 [P] `ZoneType`에 `isPatrolling?: boolean` 필드 추가 + `zoneData.ts` A동 순찰 구역 1건만 `true`로 설정 in src/features/zone/types/zone.ts, src/features/zone/mocks/zoneData.ts

## Phase 2: Foundational (US1~US4 선행)

> **독립 테스트 기준**: `CourseTabs` 렌더 시 두 탭 모두 표시, 현재 경로에 맞는 탭이 강조. `AppBadge` 기반 인증뱃지가 QR=point/NFC=success로 렌더.

- [x] T027 [P] `CourseTabs.tsx` 신규 — `/zones`↔`/points` 라우트 링크 탭. `PatrolHistoryTabs.tsx`(009) 패턴 재사용(아이콘: 코스=RouteIcon, 지점=MapPinIcon) in src/features/zone/components/CourseTabs.tsx
- [x] T028 [P] `point-card/AuthenticationBadge.tsx` 폐기, 사용처를 `AppBadge`(QR="point", NFC="success")로 교체 — 기존 반대 매핑 버그 수정 in src/features/zone/components/PointCard.tsx (delete: src/features/zone/components/point-card/AuthenticationBadge.tsx), 추가로 src/features/zone/form/AddPointForm.tsx도 동일 사용처라 함께 교체
- [x] T028b [P] **(구현 중 발견, 계획에 없던 태스크)** `LocationLayout.tsx`/`AppTabs.tsx`/`LocationTabs.tsx` 폐기 — `CourseTabs` 도입 시 라우터의 `LocationLayout`이 구 "구역/지점" `AppTabs` 탭을 이중으로 렌더하는 것을 발견(009의 `PatrolLayout`과 동일 구조가 미처리 상태로 남아있었음). `/zones`·`/points`를 `ServiceLayout`의 평평한 자식으로 승격, 참조 0건 확인 후 세 파일 삭제 in src/router/index.tsx (delete: src/features/auth/components/location/LocationLayout.tsx, src/features/auth/components/location/LocationTabs.tsx, src/components/AppTabs.tsx)

## Phase 3: US1 — 코스 목록 + 경로 다이어그램 카드 + 지점 편집 카드

> **독립 테스트 기준**: `/zones` 접속 시 좌측 코스 목록에서 코스 선택 → 우측에 zigzag 다이어그램(4개마다 줄바꿈, 점선+소요시간 라벨) + 지점 편집 카드(그립/잠금/수정/삭제)가 함께 렌더.

- [x] T029 [US1] `ZoneSideBar.tsx`/`ZoneNode.tsx` 리스트 카드화 — 타이포 시맨틱 토큰(`text-*`) 적용 + 항목별 상태 dot(`isActive` 기준: 활성=point 채움, 비활성=muted 테두리) 추가 in src/features/zone/components/ZoneSideBar.tsx, src/features/zone/components/zone-tree/ZoneNode.tsx
- [x] T030 [US1] `CourseDiagramCard.tsx` 신규 — 지점 배열을 4개 단위로 행 분할, 홀수 인덱스 행은 시각적 역순 배치(zigzag), 노드(원형 번호 + 이름/설명 + 인증뱃지) + 행 내부 점선 커넥터(소요시간 라벨 = 도착 지점 `timeLimit`) + 행 간 세로 커넥터 in src/features/zone/components/CourseDiagramCard.tsx
- [x] T031 [US1] `PointCard.tsx` 리스트 행 리디자인(그립 핸들 + 소요시간 + 인증뱃지 + 잠금/수정/삭제 인라인 버튼) — `ActiveMenu.tsx`를 드롭다운(`⋮`)에서 인라인 아이콘 버튼 3종으로 교체(다이얼로그 로직 불변: 비활성화 확인/`EditPointForm` 수정 모달/삭제 확인) in src/features/zone/components/PointCard.tsx, src/features/zone/components/point-card/ActiveMenu.tsx
- [x] T032 [US1] `ZonesPage.tsx` 레이아웃 재구성 — `AppPageHeader`(제목 "코스/지점"/서브타이틀) + `CourseTabs` + 좌측 목록(`ZoneSideBar`) + 우측(`CourseDiagramCard` + 편집 카드 목록 + 요약바) 조립 in src/pages/service/zones/ZonesPage.tsx

## Phase 4: US2 — 코스 상세 헤더(뱃지/토글/버튼)

> **독립 테스트 기준**: `isPatrolling: true`인 코스 선택 시에만 "순찰중" 뱃지 노출, 나머지는 미노출. "코스 수정" 버튼 클릭 시 기존 `EditZoneForm` 모달 정상 오픈.

- [x] T033 [US2] `ZoneTopNav.tsx` 헤더 재배치 — 순찰중 뱃지(조건부 `AppBadge variant="point"`) + 코스명 + 설명("N개 지점" 인라인) + 교대허용/코스활성화 토글(읽기전용, 기존과 동일 `onCheckedChange` 없음) + "코스 수정" 버튼(`AppButton`) in src/features/zone/components/ZoneTopNav.tsx

## Phase 5: US3 — 좁은 폭 대응

> **독립 테스트 기준**: 뷰포트 768px 미만에서 `CourseDiagramCard`가 DOM에서 숨겨지고(display:none) 편집 카드는 그대로 보임.

- [x] T034 [US3] `ZonesPage.tsx`에서 `CourseDiagramCard` wrapper에 `hidden md:block` 적용 (layout.md §5-7) in src/pages/service/zones/ZonesPage.tsx

## Phase 6: Polish

- [x] T035 [P] vitest — `CourseDiagramCard` 4개 초과 시 다음 행 줄바꿈 + 홀수 행 역순 배치 + 커넥터 라벨 렌더 확인 in src/features/zone/components/__tests__/CourseDiagramCard.test.tsx — 5건(빈 상태/줄바꿈+역순/커넥터 라벨/4의 배수 아닌 개수/비활성 노드 스타일)
- [x] T036 [P] vitest — `CourseTabs` 활성 탭 강조(현재 경로별) 확인 in src/features/zone/components/__tests__/CourseTabs.test.tsx — 3건(탭 2개 렌더/`/zones`·`/points` 각각 활성 강조)
- [x] T037 [P] `docs/screens.md` §1-3 "순찰코스 목록 + 선택 코스 상세" 진행도 △ → ✓ 갱신 in docs/screens.md
- [x] T038 [P] `docs/roadmap.md` §12 진행 추적 매트릭스 "R Redesign — 011" 행 갱신 in docs/roadmap.md
- [x] T039 [P] **(구현 중 발견, 계획에 없던 태스크)** `docs/components.md` §8 AppTabs 항목 갱신(폐기 반영), `docs/patterns.md`·`docs/layout.md`의 `LocationLayout`/`PatrolLayout` 서술 갱신 in docs/components.md, docs/patterns.md, docs/layout.md

---

## Dependencies & Execution Order

- **T026 선행** — 이후 모든 태스크가 `isPatrolling` 필드를 참조할 수 있어야 함(T033 특히).
- **T027, T028 병렬** — 서로 다른 파일, T026과도 독립.
- **T029, T030, T031 병렬** — 서로 다른 파일(ZoneSideBar/ZoneNode, CourseDiagramCard, PointCard/ActiveMenu).
- **T032 = T029 + T030 + T031 완료 후** — 페이지 조립에 세 컴포넌트 모두 필요.
- **T033 = T026 완료 후, T032와 병렬 가능** — 다른 파일(ZoneTopNav.tsx).
- **T034 = T030 + T032 완료 후** — 다이어그램 카드가 실제 배치된 뒤 반응형 wrapper 적용.
- **T035 = T030 이후 / T036 = T027 이후** — 각 컴포넌트 테스트.
- **T037, T038 = 모든 코드 태스크(T026~T034) 완료 후** — DoD·회귀 확인 후 문서 갱신.
- **세션 분할 권장**: 세션 A = Phase 1~3(US1 핵심 조립) / 세션 B = Phase 4(헤더) / 세션 C = Phase 5~6(반응형+Polish). 009·010 사례처럼 한 세션 내 연속 진행도 무방 — 011은 한 세션에서 Phase 1~6 연속 진행.

## 다음 spec으로 이월

> 다음 spec(**012-point-management**, R2-4, `/points`)의 `§0 Carry-over` 입력원.

- [ ] **`/points`에 `CourseTabs` 미부착** — `LocationLayout` 폐기(T028b)로 `/points`가 현재 "코스/지점" 탭 바 없이 렌더됨. 010이 `/patrol/points`에 `PatrolHistoryTabs`를 붙였던 것과 동일하게 → **012에서 `CourseTabs`를 `PointsPage.tsx`에 부착**
- [ ] **코스 CRUD 모달 로직·지점 드래그 실기능(dnd-kit)** — 011은 조회 UI만 다룸(사용자 확인 완료). `AddZoneForm`/`EditZoneForm`/`EditPointForm`은 여전히 스텁(콘솔 로그만). 012의 `/points` 편집 모달(`AddPointForm`/`EditPointForm`, 명세상 편집은 모달 유지)도 동일하게 스텁 상태 그대로 둘지, 아니면 실동작까지 포함할지 **012 착수 시 재확인 필요** → Phase 2(dnd-kit)/Phase 3(실동작) 또는 012 범위 재검토
- [ ] **경로 다이어그램 구간 소요시간 값 출처**(`point.timeLimit` 재사용) — 백엔드 확정 필요 → Phase 3 이후
- [ ] **순찰중(`isPatrolling`) 실시간 연동** — 데모 mock 상수 → Phase 3 이후
- [ ] **좌측 코스 목록 상태 dot 색상 의미**(`isActive` 매핑으로 결정) — 012의 지점 목록에도 유사 패턴 필요 시 참고
- DoD 미달 항목 없음(011은 전 항목 완료, `npm run verify` exit 0 · `npm run test` 56/56 통과 · 브라우저 스크린샷 시각 확인 완료)
