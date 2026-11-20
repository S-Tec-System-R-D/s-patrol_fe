# 084-design-renewal-screens tasks

> 입력: [`spec.md`](./spec.md) · 목업 [`현장 30장`](../../../docs/ui-mock/현장/개선안/디자인개편-2026-11/). 태스크 ID 는 **T1476~**(083 의 T1475 다음).
> 위험도 B — 화면 단위로 크게 나눈다. 대시보드만 영역별로 조금 더 나눴다.
> 🔴 **083 이 끝난 뒤 착수한다.** 착수할 때 083 `tasks.md` 의 `## 다음 spec으로 이월` 을 `spec.md` §0 으로 옮기고 이 목록을 다시 본다.

## 작업 규칙(이 spec 한정)

- 🔴 화면마다 **첫 단계는 대조** — 지금 구현을 읽고 목업과 어긋난 곳(문구 · 칸 · 버튼 자리)을 보고한 뒤 계획을 낸다(OQ-084-G). 어긋나면 **지금 구현이 맞다**.
- 🔴 계획 먼저(제시 → 승인 → 수정). 화면 하나가 끝나면 `verify` · `test` + 브라우저 확인 + 1920×911 캡처를 목업과 대조한다.
- 문구 · 표의 칸 · 필터 · 조회 · 쓰기 동작은 바꾸지 않는다. 접근 이름이 바뀌면 테스트를 같은 태스크에서 고친다.

## Phase 1: Setup

- [ ] T1476 083 이월 항목 옮기기 · 주황을 쓰던 곳 중 화면별 판단이 필요한 곳 표 확정 in specs/phase7/084-design-renewal-screens/spec.md
- [ ] T1477 개편 전 화면 캡처 보관(대조용 — 태그 `design-before-renewal-2026-11` 에서 현장 14화면 1920×911) in e2e/capture.pw.ts
- [ ] T1478 React Bits `Counter` 의 의존성과 그 라이선스 확인 → 보고(설치는 T1486) in package.json

## Phase 2: US1 · US2 — 대시보드

> 독립 테스트 기준: 1920×911 에서 목업 `01` 과 같은 배치다. 실시간 알림이 온 코스가 약 4초 움직이고, 움직임 줄이기 설정에서는 움직이지 않는다. 승인 · 반려 · 새로고침이 그대로 동작한다.

- [ ] T1479 [US1] 영역 배치 — 제목 오른쪽 한 줄 숫자 네 개 → 진행 중 전체 폭 → 세 칸 in src/pages/service/dashboard/DashboardPage.tsx · src/features/dashboard/components/DashboardKpiCard.tsx
- [ ] T1480 [US1] 진행 중 코스 상자 — 가로 경로 · `순찰 시작` 점 + 시작 시각 · 지점별 인증 시각 · 다음 지점 강조 · 점선 구간 · 미인증 · 교대. 지점이 많은 코스의 지금 처리(여러 줄)를 먼저 확인(OQ-084-B) · `순찰 시작` 점은 검정을 쓰지 않는다(OQ-084-D) in src/features/dashboard/components/ActiveCourseCard.tsx · src/features/dashboard/components/CourseStepper.tsx · src/features/dashboard/components/ActiveCourseSection.tsx
- [ ] T1481 [US1] 미완료 · 시간초과 / 종료된 순찰 — 탭 두 개인 한 상자 → 위아래 두 영역(내용 · 문구 유지 · 테스트 수정) in src/features/dashboard/components/RecentRecordPanel.tsx
- [ ] T1482 [US1] 배치 대기 · 공지사항 — 오른쪽 칸 · 선으로 나눈 줄 목록(승인 · 반려 동작 유지) in src/features/dashboard/components/DeploymentPendingPanel.tsx · src/features/dashboard/components/DashboardNoticePanel.tsx
- [ ] T1483 [US2] 오늘 기록 집계 함수(시간대별 24칸 · 코스별 횟수 · 0회 코스 포함) + 단위 테스트. 하루 건수가 100건을 넘는 사업장이 있는지 실서버에서 확인해 보고(OQ-084-A) in src/features/dashboard/lib/todayStats.ts
- [ ] T1484 [US2] 오늘 시간대별 순찰(세로 막대 · 지금 시간대 강조) · 오늘 코스별 순찰(가로 막대 + 횟수) in src/features/dashboard/components/TodayHourChart.tsx · src/features/dashboard/components/TodayCourseBars.tsx
- [ ] T1485 [US1] 움직임 — 진행 중 코스에서 약 4초(아이콘 회전 · 다음 지점 물결 · 점선 흐름) · 화면이 뜰 때 + 실시간 알림이 온 코스에서 다시 · `prefers-reduced-motion` in src/features/dashboard/components/ActiveCourseCard.tsx · src/index.css
- [ ] T1486 [US1] 숫자 굴러감 — React Bits `Counter` 를 복사해 넣고(파일 머리에 저작권 표시 · 허가 문구) 제목 오른쪽 숫자에 적용 in src/components/app/ · src/features/dashboard/components/DashboardKpiCard.tsx
- [ ] T1487 [US1] 빈 상태 · 불러오지 못함 — 진행 중은 상자 안 타일, 나머지는 글자 한 줄, 코스별은 0회 줄(목업 `29`) in src/features/dashboard/components/AreaFallback.tsx
- [ ] T1488 [US1] 회귀 확인 — 실시간 연결 · 새로고침 · `마지막 갱신` · 승인 · 반려 · e2e · 캡처 대조 in e2e/

## Phase 3: US3 — 코스 · 지점 상세

> 독립 테스트 기준: 목업 `05` · `07` 과 같은 배치다. 편성 편집 · 수정 · 삭제 · 회차 보기 · QR 내려받기가 그대로 동작한다.

- [ ] T1489 [US3] 코스 상세 — 제목 줄 · 낮은 숫자 칸 3개 · 왼쪽(순찰 경로 · 최근 순찰 기록) / 오른쪽(기본정보 · 시간대별 · 근무자별) · 카드 상자 제거 in src/pages/service/zones/ZoneDetailPage.tsx · src/features/courses/components/detail/CourseKpiRow.tsx · src/features/courses/components/detail/CourseInfo.tsx · src/features/courses/components/detail/CourseRouteCard.tsx
- [ ] T1490 [US3] 코스 상세 — 마지막 순찰 칸의 진행 표시(진행 중이면 순찰자 · 진행 막대 · `지점 n / n` · 경과) in src/features/courses/components/detail/CourseKpiRow.tsx
- [ ] T1491 [US3] 코스 상세 — 작은 그림 2개 · 시간대별을 shadcn 모양 차트로 · 툴팁 = 순찰 시작 일시 + 값 · 단위 in src/features/courses/components/detail/CourseRunCharts.tsx · src/features/courses/components/detail/CourseRunStatCards.tsx
- [ ] T1492 [US3] 코스 상세 — 최근 순찰 기록(펼친 줄 = 내용만 흰 상자 · 고른 줄 = 옅은 회색) · 순서 번호 옅은 파랑 in src/features/courses/components/detail/CoursePatrolLog.tsx · src/features/courses/components/detail/CourseMapCard.tsx
- [ ] T1493 [US3] 지점 상세 — 상자 없는 한 줄 숫자 · 최근 순찰에 순찰자 · 코스 이름 · 시각 · 14일 막대 shadcn 모양 · 왼쪽 속성 단 in src/pages/service/points/PointDetailPage.tsx · src/features/points/components/detail/PointDetail.tsx · src/features/points/components/detail/PointActivityCard.tsx · src/features/points/components/detail/PatrolBarChart.tsx
- [ ] T1494 [US3] 회귀 확인 — 두 화면 동작 · 캡처 대조 in e2e/

## Phase 4: US4 — 목록 화면

> 독립 테스트 기준: 일곱 화면이 같은 순서(제목 → 탭 → 검색 · 필터 → 표 → 페이지 이동)이고, 표의 칸 · 필터 · URL 쿼리 동작이 개편 전과 같다.

- [ ] T1495 [P] [US4] 순찰이력 — 코스(특이사항은 순찰 결과 옆 회색 말풍선) in src/pages/service/patrol/zones/PatrolZonesPage.tsx
- [ ] T1496 [P] [US4] 순찰이력 — 지점(인증수단 글자만) in src/pages/service/patrol/points/PatrolPointsPage.tsx · src/features/patrol-points/components/PointColumn.tsx
- [ ] T1497 [P] [US4] 코스 목록 in src/pages/service/zones/ZonesPage.tsx
- [ ] T1498 [P] [US4] 지점 목록 in src/pages/service/points/PointsPage.tsx
- [ ] T1499 [P] [US4] 근무자 목록 · 빈 상태 두 종류(목록 영역 가운데 — 목업 `27` · `28`) in src/pages/service/users/UsersPage.tsx · src/features/workers/components/WorkerColumns.tsx
- [ ] T1500 [US4] 배치관리 — 제목 오른쪽 한 줄 숫자(전출 · 전입 인원) · 탭 4개(요청 건수 파란 알약) · 표 4종. 복귀 요청 경로 방향을 지금 구현과 대조 in src/pages/service/deployments/DeploymentsPage.tsx · src/features/deployments/components/DeploymentBoard.tsx · src/features/deployments/components/DeploymentPeopleStats.tsx
- [ ] T1501 [P] [US4] 공지사항 목록 in src/pages/service/notice/NoticeListPage.tsx · src/features/notice/components/NoticeColumn.tsx
- [ ] T1502 [US4] 좁은 폭 카드(`WorkerCard` · `NoticeCard` · `DeploymentRequestCard` 등)가 새 색 · 글꼴에서 깨지지 않는지 확인(모양은 유지) in src/features/
- [ ] T1503 [US4] 회귀 확인 — 일곱 화면의 검색 · 필터 · 페이지 이동 · 줄 누르기 · e2e · 캡처 대조 in e2e/

## Phase 5: US5 — 나머지 상세

> 독립 테스트 기준: 목업 `12`~`15` 와 같은 배치다. 특이사항 펼침 · 지도 핀 · 수정 · 삭제 · 비밀번호 변경이 그대로 동작한다.

- [ ] T1504 [US5] 코스 순찰 상세 — 제목 줄(오른쪽 `코스 상세` 회색 채움) · 요약 4칸(상자 없이 위아래 선 · `기준 n분` 유지) · 타임라인(번호 인증 초록 / 미인증 회색 테두리 · 펼침 = 내용만 흰 상자) · 코스 경로 · 교대 이력 in src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx · src/features/patrol-zones/components/detail/RunSummaryStrip.tsx · src/features/patrol-zones/components/detail/RunTimeline.tsx · src/features/patrol-zones/components/detail/HandOverTimelineCard.tsx
- [ ] T1505 [US5] 지점 인증 상세 — 같은 틀 · 오른쪽 `지점 상세` 버튼 in src/pages/service/patrol/points/PatrolPointDetailPage.tsx · src/features/patrol-points/components/detail/
- [ ] T1506 [US5] 근무자 상세 — 왼쪽 400px(기본정보 · 배치 이력) / 오른쪽 순찰 기록(한 줄 숫자 · 14일 막대 · 날짜별 묶음) in src/pages/service/users/UserDetailPage.tsx · src/features/workers/components/detail/
- [ ] T1507 [US5] 공지사항 상세 — 제목 줄 오른쪽 `수정` · `삭제`(빨강 채움) · 본문 폭 880px. 삭제 버튼 자리를 지금 구현과 대조 in src/pages/service/notice/NoticeDetailPage.tsx · src/features/notice/components/detail/
- [ ] T1508 [US5] 회귀 확인 — 네 화면 동작 · 캡처 대조 in e2e/

## Phase 6: US6 — 모달

> 독립 테스트 기준: 다섯 유형이 spec §2-5 의 버튼 자리를 따르고, 저장 · 취소 · 닫기 동작이 그대로다.

- [ ] T1509 [US6] 모달 전수 조사 → 유형 분류표(입력 폼 / 확인 창 / 편집 창 / 고르기 창 / 보기 창)와 규칙에서 벗어난 곳 목록 in specs/phase7/084-design-renewal-screens/tasks.md
- [ ] T1510 [US6] 입력 폼 · 확인 창 — 083 의 틀로 충분한지 확인하고 벗어난 곳만 고친다 in src/features/
- [ ] T1511 [US6] 지점 순서 편집 · 지점 추가 · 회차 보기 — 줄 메뉴 · 점선 `지점 추가` · `새 지점 만들기` 줄 · 순서 번호 옅은 파랑 in src/features/courses/components/detail/CoursePointEditor.tsx · src/features/courses/components/detail/AddCoursePointDialog.tsx · src/features/courses/components/detail/CourseRunDialog.tsx
- [ ] T1512 [US6] 회귀 확인 — 유형별 대표 모달의 열기 · 저장 · 취소 · e2e in e2e/

## Phase 7: Polish — 문서 정리

- [ ] T1513 남은 주황 · 한 영역 안의 타일 빈 상태 · 본문 안 카드 상자 전수 확인(예외 3곳만 남는다)
- [ ] T1514 `design-system.md` 를 새 규칙으로 — `디자인-규칙.md` 의 확정 항목을 옮기고 뒤집힌 결정을 정리 in docs/design-system.md
- [ ] T1515 [P] `layout.md`(틀) · `components.md`(공용 구성 요소) · `patterns.md`(목록 · 상세 · 모달 유형) 정리 in docs/layout.md · docs/components.md · docs/patterns.md
- [ ] T1516 [P] `screens.md` 화면 설명을 개편된 배치로 in docs/screens.md
- [ ] T1517 DoD 대조 · `verify` · `test` · `e2e` 전체 · 현장 14화면 대조 캡처 묶음
- [ ] T1518 `roadmap.md` 084 행 상태 · 진행 추적 갱신 · `## 다음 spec으로 이월` 작성(085 로 넘길 것) in docs/roadmap.md

---

## 다음 spec으로 이월

(작업이 끝날 때 적는다)

---

## Dependencies & Execution Order

- 🔴 083 완료 → T1476 부터.
- T1476~T1478 은 모든 Phase 선행. T1478 → T1486.
- Phase 2: T1479 → T1480~T1482(파일이 달라 순서 자유) → T1483 → T1484 → T1485 → T1486 → T1487 → T1488.
- Phase 3~6 은 Phase 2 와 독립이지만, 🔴 **대시보드를 먼저** 한다(주 화면 — 규칙이 실제로 맞는지 가장 먼저 드러난다).
- Phase 4 의 `[P]` 는 화면이 달라 병렬 가능. T1500(배치관리)은 탭 · 숫자 줄이 달라 따로.
- Phase 6 은 Phase 3 뒤(코스 상세가 모달의 바탕).
- Phase 7 은 전부 끝난 뒤. T1514 → T1515 · T1516(`[P]`).
