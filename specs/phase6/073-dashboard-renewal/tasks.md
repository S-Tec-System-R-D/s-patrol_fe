# 073-dashboard-renewal tasks

> 입력: [`spec.md`](./spec.md) · 시안 `docs/ui-mock/현장/개선안/dashboard/`. 태스크 ID 는 071 T1201 다음부터 — 072 가 T1202~ 를 잡아 두어 **T1210~** 을 쓴다.

---

## Phase 1 — 데이터

- [x] T1210 [US4] 최근 미완료 고르기 in src/features/dashboard/lib/recentIssueCourses.ts — 100건 쿼리에서 종료된 회차 중 `status 2` 또는 `overtimeYn` · 종료 시각 역순 앞 5건 + 단위 테스트
- [x] T1211 [US4] 놓친 지점 이름 in 같은 파일 — `CheckDetails` 행 중 지점 상태 `3 미완료` 의 이름(순번 순) + 단위 테스트
- [x] T1212 [US4] 최근 기록 훅 정리 in src/features/dashboard/hooks — `useFinishedCourses` → `useRecentCourses`(키 `recentCourses`)가 **100건 원본**을 주고 종료 · 미완료를 화면에서 고른다 · `useRecentIssues` · `getDashboardPointHistory` · `recentIssues.ts`(+테스트) · 키 `pointHistory` 삭제
- [x] T1213 실시간 in handleDashboardEvent.ts — 결과 이벤트의 다시 받기 대상에서 `pointHistories` 삭제(100건 쿼리 하나로 충분) + 테스트 수정
- [x] T1214 mock in src/mocks/handlers — 오늘 시간초과 완료 회차 1건 · 오늘 미완료 회차(191)의 인증 내역 · `GetDashboardPointHistory` 핸들러 삭제

## Phase 2 — 화면

- [x] T1215 [US1] KPI 카드 in DashboardKpiCard.tsx — 4칸(진행 중 · 완료 · 미완료 · 시간초과) · 보조 줄 · 배치 숫자 없음 · 미완료/시간초과만 색 · 0 회색 · `DashboardKpiRow` 삭제
- [x] T1216 [US2] 배치 대기 패널 in DeploymentPendingPanel.tsx — 배치 요청 · 복귀 요청 묶음 · 아바타 · `N일 대기` · 출발지 · 기간 · `DeploymentRequestActions` 재사용 · 빈 상태 · `배치관리 ›`
- [x] T1217 [US3] 진행 중 카드(`nextPoint` 삭제 — 쓰는 곳이 없어졌다) in ActiveCourseCard.tsx · CourseStepper.tsx · ActiveCourseSection.tsx — `다음:` 문구 삭제(칩과 중복) · 시간 막대 길게 · 교대는 칩 안 · xl 1열 / 2xl 2열
- [x] T1218 [US4][US5] 최근 기록 패널 in RecentRecordPanel.tsx — 탭(숫자 뱃지) · 2xl 두 목록 · 미완료 행(시각 · 코스 · 순찰자 · 놓친 지점 · `미완료 N` / `시간초과`) · 종료 행(미니 막대 + 인증 수 · 예외만 뱃지) · `RecentIssuePanel` · `FinishedCoursePanel` 삭제
- [x] T1219 [US1] 배치 in DashboardPage.tsx — xl 2열(왼쪽 나머지 · 오른쪽 440px 고정, 시안 `.gd`)(왼쪽 KPI · 진행 중 · 최근 기록 / 오른쪽 배치 대기 · 공지) · xl 미만 한 열 순서 KPI → 진행 중 → 배치 대기 → 최근 기록 → 공지 · 새로고침에 배치 대기 포함

## Phase 3 — 검증 · 문서

- [x] T1220 테스트 in DashboardPage.test.tsx — KPI · 배치 대기(승인 후 목록에서 빠짐) · 최근 기록 · 새로고침 호출 수 갱신
- [x] T1221 verify · test(1,566) · e2e(39) · 화면 캡처 1280 / 1600 / 390(mock)
- [ ] T1222 🔴 실서버 + 앱 순찰 1회 — 인증 · 종료 알림 뒤 KPI · 최근 기록이 바뀐다
- [x] T1224 배치 대기 다듬기(사용자 요청 2026-11-12) — 2열 비율을 시안 `.gd` 와 같게(왼쪽 나머지 · 오른쪽 440px) · 아바타 삭제(이니셜이 이름과 같은 정보) · 승인/반려 작은 버튼(`DeploymentRequestActions` `compact` — 높이 28px · 글자만 · 배치관리 화면은 그대로)
- [x] T1225 배치 대기 요청 줄(사용자 요청 2026-11-12) — 출발 사업장 · 기간 앞에 아이콘(건물 · 달력) · `에서` · `에서 복귀` 없이 사업장 이름만 · 사유는 대시보드에서만 뺀다(값은 있고 배치관리 표에는 그대로 · 사용자 결정 2026-11-12)
- [x] T1226 제목 옆 개수 정리(사용자 결정 2026-11-12) — `진행 중인 순찰` 개수 삭제(KPI `진행 중` 과 같은 값) · `배치 대기` 합계 삭제(`배치 요청 N` · `복귀 요청 N` 과 겹침) · 최근 기록 탭 숫자 뱃지는 유지(숨은 목록 개수 · 미완료 빨강 신호)
- [x] T1223 문서 — `screens.md` 대시보드 행 · `roadmap.md` 073 행 · spec DoD

## Dependencies & Execution Order

- T1210 · T1211 → T1212 → T1218. T1213 · T1214 는 T1212 와 함께.
- T1215 · T1216 · T1217 은 서로 독립. T1219 는 Phase 2 나머지 뒤.
- T1222 는 사용자 앱 순찰이 필요하다.
