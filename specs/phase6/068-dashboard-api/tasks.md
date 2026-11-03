# 068-dashboard-api tasks

> 입력: 같은 폴더 `spec.md`. 🔴 **조회 4종만** — SSE 실시간은 `069`. 응답 형태 SSOT 는 `docs/api-spec.md` §5-1-D.

---

## Phase 1: Setup

- [ ] T1123 [P] 응답 타입 교체 in src/features/dashboard/types/index.ts — 화면 모양 타입(`DashboardKpi` · `ActiveCourse` · `ActiveCoursePoint` · `RecentIssueRow` · `DashboardNoticeRow`) → §5-1-D 실측 타입(`TodaySummary` · `DashboardCourse` · `DashboardCoursePoint`). 최근 기록은 `PointHistoryRow`, 공지는 `NoticeRow` 재사용. `PointStepStatus` 는 유지
- [ ] T1124 [P] API 함수 3개 in src/features/dashboard/api/{getTodaySummary,getDashboardCourseList,getDashboardPointHistory}.ts — 엔드포인트 하나에 파일 하나(기존 `features/notice/api` 패턴)
- [ ] T1125 [P] mock 핸들러 in src/mocks/handlers/dashboard.ts — 067 고정 데이터를 응답으로 옮김(오늘 날짜 기준 시각 · 진행 중 회차 `status` 0·1·3·4 섞기 · `totalMin 0` 회차 1개 · `overTimeYn` / `status` 필터 반응) + src/mocks/handlers/index.ts 등록

## Phase 2: Foundational

> **독립 테스트 기준**: 단계 상태가 서버 `status` 와 1:1 · 경과 계산 · 최근 기록 합치기

- [ ] T1126 계산 함수 교체 in src/features/dashboard/lib/activeCourse.ts — 단계 = `status` 그대로(4 `done` · 3 `skipped` · 1 `next` · 0·2 `pending`) · `n/N` = `status 4` 개수 · 건너뜀 = `status 3` 개수 · 다음 = `status 1` 지점 · 경과 = `elapsedSec` + (지금 − 받은 시각), `pausedYn` 이면 그대로 · 시간초과 = 경과 분 > `totalMin`, **`totalMin 0` 은 기준 없음** · 정렬(시간초과 → 경과 비율)은 유지. 067 의 "마지막 인증보다 앞" 계산 삭제
- [ ] T1127 [P] 최근 기록 합치기 in src/features/dashboard/lib/recentIssues.ts — 두 목록 → `detailSeq` 로 하나 · `checkDt` 최근 순 · 앞 5건
- [ ] T1128 [P] 단위 테스트 in src/features/dashboard/lib/__tests__/{activeCourse,recentIssues}.test.ts — 위 두 파일 규칙 전부(`totalMin 0` · `pausedYn` · 겹친 행 포함)

## Phase 3: US1 · US2 — KPI · 진행 중 카드

> **독립 테스트 기준**: mock 응답의 숫자 · 카드가 그대로 보인다 · 경과가 1분 뒤 늘어난다 · 기준 없음 표시

- [ ] T1129 [US1] [US2] 조회 훅 in src/features/dashboard/hooks/{useTodaySummary,useDashboardCourses}.ts + src/features/dashboard/queryKeys.ts — `siteSeq` 를 키에 포함(사업장 전환 시 새로 받음)
- [ ] T1130 [US1] DashboardKpiRow in src/features/dashboard/components/DashboardKpiRow.tsx — `TodaySummary` 받기 · 로딩 · 오류(다시 시도)
- [ ] T1131 [US2] 진행 중 카드 in src/features/dashboard/components/{ActiveCourseCard,ActiveCourseSection,CourseStepper}.tsx — 서버 이름으로 교체(`users` 마지막 = 순찰자 · `handoverCount > 0` = `교대` · `totalMin`) · 1분마다 다시 그리기 · `기준 없음`

## Phase 4: US3 · US4 — 하단 · 새로고침 · 상태

> **독립 테스트 기준**: 최근 기록 2번 호출이 합쳐져 5건 · 한 호출 실패 = 영역 오류 · 공지 3건 · 새로고침이 4개 영역을 다시 부름 · 한 영역 실패해도 나머지는 보임

- [ ] T1132 [US3] 하단 훅 in src/features/dashboard/hooks/useRecentIssues.ts — 2번 호출(`useQueries`) → `recentIssues` 합치기 · 하나라도 실패면 오류. 공지는 기존 `useNoticeList`(`pageSize 3`)
- [ ] T1133 [US3] 하단 패널 in src/features/dashboard/components/{RecentIssuePanel,DashboardNoticePanel}.tsx — `PointHistoryRow` · `NoticeRow` 받기 · 로딩 · 빈 · 오류(다시 시도)
- [ ] T1134 [US4] 갱신 표시 in src/features/dashboard/components/DashboardUpdatedAt.tsx — `30초마다 자동` 문구 삭제 · 새로고침 중 버튼 회전/비활성
- [ ] T1135 [US4] 페이지 조립 in src/pages/service/dashboard/DashboardPage.tsx — 훅 연결 · 새로고침 = 4개 영역 `refetch` 후 `마지막 갱신` 갱신 · `?preview=` 삭제
- [ ] T1136 고정 데이터 삭제 in src/features/dashboard/mocks/dashboardMock.ts — 파일 삭제(값은 T1125 핸들러로 옮겨짐)

## Phase 5: Polish

- [ ] T1137 [P] 화면 테스트 in src/pages/service/dashboard/__tests__/DashboardPage.test.tsx — mock 핸들러 기준(숫자 · 카드 · 단계 색 · 최근 5건 · 공지 · 영역별 오류 · 새로고침 · 기준 없음)
- [ ] T1138 [P] e2e in e2e/open-service.pw.ts — 대시보드 테스트를 핸들러 데이터 기준으로 갱신(진행 중 카드 · 하단 패널 · 390 가로 넘침 없음)
- [ ] T1139 `npm run verify` + `npm run test` 병렬 · `npm run e2e` · 브라우저 확인(1280 · 390 · mock · `npm run dev:real` 사업장 6)
- [ ] T1140 문서 in docs/roadmap.md · docs/screens.md — 068 행 · 대시보드 행 API 연결 표기 · spec DoD · `## 다음 spec으로 이월`(069 SSE)

---

## Dependencies & Execution Order

- T1123 → 나머지 전부. T1124 · T1125 는 T1123 뒤 병렬
- T1126 · T1127 은 T1123 뒤 병렬 → T1128
- T1129 → T1130 · T1131 (T1126 필요)
- T1132 (T1127 필요) → T1133
- T1135 는 T1130 · T1131 · T1133 · T1134 뒤 → T1136
- Phase 5 는 T1136 뒤. T1137 · T1138 병렬 → T1139 → T1140
