# 069-dashboard-sse tasks

> 입력: 같은 폴더 `spec.md`. SSE 서버 · 이벤트 실측 SSOT 는 `docs/api-spec.md` §5-1-D. 🔴 알림 반영 = **전부 다시 받기**(OQ-069-A · B 해소 — 캐시를 고치지 않는다). mock 은 **연결만**.

---

## Phase 1: Setup

- [x] T1141 [P] env 신설 in .env.example · .env.real — `VITE_SSE_BASE_URL`(`.env.real` 만 테스트 SSE 서버 `:5258`, 나머지는 비움 = 같은 출처)
- [x] T1142 [P] SSE 타입 in src/features/dashboard/types/index.ts — §5-1-D "5. SSE data" 그대로(`SseEventBase` · `PointCheckedEvent` · `CourseHandoverEvent` · `CourseEndedEvent`). 알림 뒤 조회 타입은 넣지 않는다(쓰지 않음)
- [x] T1143 [P] 재발급 함수 export in src/lib/axios.ts — single-flight 재발급 · 인증 실패 처리를 export 만(동작 변경 없음)
- [x] T1144 [P] mock SSE 핸들러 in src/mocks/handlers/dashboard.ts — `GET /api/v1/Sse/subscribe` → `retry: 10000` + `event: connected` 후 스트림을 열어 둔다(이벤트 없음)

## Phase 2: Foundational

> **독립 테스트 기준**: 청크가 줄 중간에서 끊겨도 메시지가 그대로 나온다 · 주석 무시 · `retry` 반영 · 401 은 구분해 알린다 · 중단(abort)하면 조용히 끝난다

- [x] T1145 SSE 파서 in src/lib/sse/parseSse.ts — 텍스트 청크 → 메시지(`event` · `data` · `id`) + `retry`. 빈 줄 = 메시지 끝 · `:` 주석 무시 · 여러 `data:` 줄 이어 붙이기 · 남은 조각은 다음 청크로
- [x] T1146 SSE 연결 in src/lib/sse/subscribeSse.ts — `fetch`(+ `Authorization`) · 스트림 읽기 → 파서 · 메시지 콜백 · 끊김 / 401 / 오류 구분 · `AbortSignal`
- [x] T1147 [P] 단위 테스트 in src/lib/sse/__tests__/{parseSse,subscribeSse}.test.ts — 위 기준 전부

## Phase 3: US1 · US2 — 이벤트 처리

> **독립 테스트 기준**: 다른 사업장 · `link` 다른 이벤트 · JSON 아님 · 모르는 이름 무시 · 시작/멈춤/교대 = 목록 · 지점 인증/종료 = 목록 + 오늘 숫자 · 최근 기록 · 첫 연결 = 목록 · 재연결 = 셋 다 · 0.5초 안 여러 알림이 영역마다 1번

- [x] T1148 [US1] [US2] 이벤트 처리 in src/features/dashboard/realtime/handleDashboardEvent.ts — 공통 필터 → 다시 받을 영역 정하기(spec §2 표) → 0.5초 묶어 `invalidateQueries`
- [x] T1149 [US1] [US2] 단위 테스트 in src/features/dashboard/realtime/__tests__/handleDashboardEvent.test.ts — 위 기준 전부(가짜 타이머)

## Phase 4: US3 — 연결 · 재연결 · 상태 표시

> **독립 테스트 기준**: 대시보드에서 연결 · 떠나면 끊김 · 끊기면 `retry` 뒤 다시 · 401 → 재발급 후 즉시 다시 · 재연결 `connected` 때 목록 + KPI · 최근 다시(첫 연결은 목록만) · 상태 `실시간` / `다시 연결 중`

- [x] T1150 [US3] 연결 훅 in src/features/dashboard/realtime/useDashboardRealtime.ts — 마운트 동안 연결 · `siteSeq` 전달 · 재연결 · 401 재발급(T1143) · 연결 상태 반환
- [x] T1151 [US3] 연결 상태 표시 in src/features/dashboard/components/DashboardUpdatedAt.tsx — `실시간` / `다시 연결 중`(1280 · 390)
- [x] T1152 [US3] 페이지 조립 in src/pages/service/dashboard/DashboardPage.tsx — 훅 연결 · 상태 전달
- [x] T1153 [US3] 훅 테스트 in src/features/dashboard/realtime/__tests__/useDashboardRealtime.test.tsx — 위 기준(`subscribeSse` 를 가짜로)

## Phase 4-2: US4 — 최근 종료된 순찰 · 마지막 갱신 (실서버 확인 중 추가, 사용자 결정 2026-11-04)

> **독립 테스트 기준**: 오늘 끝난 회차만 · 종료 시각 순 5건 · 진행 중 · 어제 끝난 회차 제외 · 종료 알림 뒤 행이 나타남 · 오류는 그 영역만 · `마지막 갱신` 이 알림 반영 때 바뀜

- [x] T1159 [US4] 고르기 in src/features/dashboard/lib/finishedCourses.ts(+ 단위 테스트) — 오늘 끝난 회차 · 종료 시각 순 · 앞 5건
- [x] T1160 [US4] 조회 훅 in src/features/dashboard/hooks/useFinishedCourses.ts · queryKeys.ts — `GetCourseHistory` 어제~오늘 100건
- [x] T1161 [US4] 패널 in src/features/dashboard/components/FinishedCoursePanel.tsx — 1280 · 390
- [x] T1162 [US4] 알림 연결 in handleDashboardEvent.ts(+ 테스트) — 지점 인증 · 종료 · 재연결 때 다시 받기
- [x] T1163 페이지 조립 in DashboardPage.tsx — 패널 · 새로고침 5개 영역 · `마지막 갱신` = 가장 최근 받은 시각
- [x] T1164 mock · 화면 테스트 · e2e — 오늘 종료 시드 · 종료 알림 → 행 · 마지막 갱신

- [x] T1165 진행 중 카드 1개면 전체 폭 · 2개부터 2열 in ActiveCourseSection.tsx(사용자 결정 2026-11-04)

## Phase 5: Polish

- [x] T1154 [P] 화면 테스트 in src/pages/service/dashboard/__tests__/DashboardPage.test.tsx — 기존 통과 유지 + 연결 상태 `실시간` 표시
- [x] T1155 [P] e2e in e2e/open-service.pw.ts — 대시보드 테스트에 연결 상태 확인 추가(1280 · 390)
- [x] T1156 `npm run verify` + `npm run test` 병렬 · `npm run e2e` · 브라우저 확인(mock 1280 · 390)
- [x] T1157 🔴 실서버 + 앱 순찰 확인 — IP 로 열기(`npm run dev:real`) · 사업장 6 · 시작 → 인증/건너뜀 → 교대 요청 → 교대 → 종료(완료 · 중단 각 1회) · 068 이월 카드 확인(경과 · 지점 색 · 다음 지점 · 건너뜀 · 교대) · 끊김 → 재연결 — 2026-11-04 사용자 확인: 시작 ~ 종료 전부 · 줄 끝 `
` 만(`` 없음, 연결 메시지 실측). 끊김 → 재연결 · 최근 종료 섹션(완료 · 중단)도 사용자 확인 완료
- [x] T1158 문서 in docs/roadmap.md · docs/screens.md · docs/api-spec.md — 069 행 · 대시보드 행(실시간) · §5-1-D 처리 방침(멈춤 · 교대 = 목록 다시) · spec DoD

---

## Dependencies & Execution Order

- Phase 1 은 서로 병렬(T1141 ~ T1144)
- T1145 → T1146 → T1147
- T1148 은 T1142 뒤 → T1149
- T1150 은 T1143 · T1146 · T1148 뒤 → T1151 · T1152 → T1153
- Phase 5 는 T1152 · T1144 뒤. T1154 · T1155 병렬 → T1156 → T1157 → T1158
