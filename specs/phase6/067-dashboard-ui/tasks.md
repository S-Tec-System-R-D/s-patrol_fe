# 067-dashboard-ui tasks

> 입력: 같은 폴더 `spec.md`. 🔴 **API 호출 없음** — 고정 데이터로 UI 만.

---

## Phase 1: Setup

- [x] T1102 [P] 화면 타입(view model) in src/features/dashboard/types/index.ts — KPI · 진행 중 코스(지점 단계 포함) · 확인 이력 행 · 공지 행
- [x] T1103 [P] 고정 데이터 in src/features/dashboard/mocks/dashboardMock.ts — 목업 A안 값(코스 4 · 이력 5 · 공지 3) · **오늘 날짜 기준 시각** · 링크 키는 mock 서버에 있는 값
- [x] T1104 [P] 순수 함수 in src/features/dashboard/lib/activeCourse.ts — 정렬(시간초과 → 경과 비율) · 경과 비율 · 다음 지점 · 건너뜀 개수 · 단계별 상태

## Phase 2: US1 — KPI · 머리

> **독립 테스트 기준**: 4칸 · 0 이면 `neutral` · 링크 주소

- [x] T1105 [US1] DashboardKpiRow in src/features/dashboard/components/DashboardKpiRow.tsx — `AppKpiCard inline` 4칸 · ~~링크(오늘 날짜 쿼리)~~ → T1118 에서 삭제
- [x] T1106 [US1] 갱신 표시 in src/features/dashboard/components/DashboardUpdatedAt.tsx — 마지막 갱신 · 30초 자동 문구 · 새로고침(시각만 갱신)

## Phase 3: US2 — 진행 중 카드

> **독립 테스트 기준**: 정렬 · 2줄 머리 · 시간 막대 · 다음 지점 · 단계 색 · 카드 링크

- [x] T1107 [US2] CourseStepper in src/features/dashboard/components/CourseStepper.tsx — 줄바꿈 · 지도 핀 색 규칙 · 다음 지점 점선 · 출발 점 · `motion-reduce`
- [x] T1108 [US2] ActiveCourseCard in src/features/dashboard/components/ActiveCourseCard.tsx — 1줄(코스명 · 뱃지 · `n/N 지점`) · 2줄(순찰자 · 교대 · 시작 · 경과/기준 · 막대 · 다음) · 시간초과 테두리 · → 회차 상세
- [x] T1109 [US2] ActiveCourseSection in src/features/dashboard/components/ActiveCourseSection.tsx — 제목 + 개수 · 정렬 · 빈 · 로딩(스켈레톤) · 오류(다시 시도)

## Phase 4: US3 · US4 — 하단 · 상태

- [x] T1110 [US3] ~~AttentionHistoryPanel~~ → `RecentIssuePanel`(T1118) in src/features/dashboard/components/RecentIssuePanel.tsx — 행(뱃지 `pointCheckBadge` · 메모) · `md` 미만 열 숨김 · 링크
- [x] T1111 [US3] DashboardNoticePanel in src/features/dashboard/components/DashboardNoticePanel.tsx — 고정만 핀 · 날짜 · 링크
- [x] T1112 [US4] 페이지 조립 in src/pages/service/dashboard/DashboardPage.tsx — 머리 · KPI · 진행 중 · 하단 2:1(`xl` 미만 1열) · `?preview=`(개발 전용)

## Phase 5: Polish

- [x] T1113 [P] 테스트 — `activeCourse` 단위 · 컴포넌트 · 페이지(정렬 · 링크 · 상태 3종 · 0 KPI 색)
- [x] T1114 [P] e2e — `open-service` 대시보드 테스트 보강(진행 중 카드 · 하단 패널 보임 · 390 가로 넘침 없음)
- [x] T1115 `ProgressPage` 삭제(라우트 없음 — 이 화면이 흡수)
- [x] T1116 `npm run verify` + `npm run test` 병렬 · `npm run e2e` · 브라우저 확인(1280 · 390 · 상태 3종)
  - 결과: `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) · `npm run test` 1517/1517(+16) · `npm run e2e` 39/39. 🔴 **브라우저 확인은 사용자 대기**
- [x] T1117 문서 — `screens.md` §1-1 대시보드 행 · §1-2A 흡수 · `roadmap.md` 067 행 · spec DoD · 이월(API 요청서 초안)

## Phase 6: 1차 검토 수정 (사용자 2026-10-30)

- [x] T1118 `확인이 필요한 이력` → `최근 미완료 · 시간초과`(`RecentIssuePanel` · `RecentIssueRow` · 건수 뱃지 삭제 · 시각 `MM.dd HH:mm` · 고정 데이터 일부 어제 · 그제) · KPI 링크 삭제 · 지점 단계 숫자 세로 중앙(`leading-5` + 1px 테두리) · 최근 기록 행 뱃지 칸 폭 고정 96px(뱃지 1·2개에 따라 코스 · 순찰자 열이 밀리던 것) · 완료 행은 결과 뱃지(`이상없음`/`순찰기록`) 빼고 `시간초과` 만(대시보드 패널만)
- [x] T1120 진행 중 카드 A안(칸 막대) 비교 → **버림**(숫자 스테퍼 유지) · 배치만 넓은 폭 2열(`xl:grid-cols-2`). 비교용 `ActiveCourseBarCard` · `?variant=a` 삭제 · 스테퍼 연결선 2px · 길이 40px(좌우 10px) · 줄 간격 12px(사용자 요청) · 연결선을 단계 **앞**으로 옮기고 줄 첫머리 선은 잘라냄(줄 끝에 선이 혼자 남던 것) · 단계 원 20 → 24px(숫자 11.5px · 이름 12.5px) · 현재 위치 효과 `animate-ping`(2배, 줄 `overflow-hidden` 에 상하좌우 잘림) → `step-pulse`(1.5배, `index.css`) + 감싼 여백 6px
- [x] T1121 지점 단계 B안(뱃지형 — 번호 + 지점명을 한 뱃지, 선 24px 바로 붙임) `?stepper=pill` 로 비교 → **뱃지형 선택**(사용자 2026-10-30). 숫자 스테퍼 코드 · 옵션 삭제, 테스트는 뱃지형 기준
- [x] T1119 `npm run verify` + `npm run test` 병렬 · `npm run e2e` · 브라우저 재확인
  - 결과: `npm run verify`(경고 1 = 기존) · `npm run test` 1517/1517 · `npm run e2e` 39/39. 최종(뱃지형 · 2열 반영 뒤) `npm run test` 1517/1517 · `npm run e2e` 39/39. 브라우저 검토 완료(사용자, 2026-10-30)

---

## Dependencies & Execution Order

- T1102 → 나머지 전부. T1103 · T1104 는 T1102 뒤 병렬
- T1107 → T1108 → T1109
- Phase 2 · 3 · 4 컴포넌트는 서로 독립, T1112 는 전부 뒤
- Phase 5 는 T1112 뒤
