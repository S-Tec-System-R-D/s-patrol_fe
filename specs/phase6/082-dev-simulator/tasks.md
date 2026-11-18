# 082-dev-simulator tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 **T1401~** — 같은 시기에 다른 세션이 079 다음 번호(T1353~)를 쓰고 있어 겹치지 않게 띄웠다.
> 위험도 B — 화면 단위로 크게 나눈다.

## Phase 0: 실측 (WF-1-0)

- [x] T1401 앱 서버 CORS · 로그인 확인 — 허용 출처 `123.2.156.229:5173` · `:5174`
- [x] T1402 앱 API 실측(57개 중 55개 · 조회 + 쓰기 + 오류) → `docs/app-api-spec.md` · swagger 저장 `docs/swagger-app-api.json`
- [x] T1403 테스트 데이터 구축 — 사업장 34 에 시뮬 지점 4 · 코스 2 · 근무자 2, 사업장 35(WEB 테스트 사업장2) 생성

## Phase 1: Setup — 틀 · 스타일

- [x] T1404 의존성 추가(`@base-ui/react` · `@fontsource-variable/manrope` · `@fontsource-variable/geist-mono`) in package.json
- [x] T1405 [P] env — `VITE_APP_API_BASE_URL` in .env.real · 키 설명 in .env.example
- [x] T1406 [P] 범위 한정 테마(Mist 다크 · Emerald · 모서리 · 글꼴 · 반짝임) in src/features/simulator/simulator.css
- [x] T1407 [P] Base UI Rhea 컴포넌트 이식(button · badge · select · collapsible · trace · spinner) in src/features/simulator/ui/ — shadcn CLI 는 기존 `components/ui/button.tsx` 를 덮어쓰려 해서 레지스트리 원본을 수동 이식
- [x] T1408 개발 전용 라우트(`/dev/simulator` · DEV 에서만 · 지연 로딩) in src/router/paths.ts · src/router/index.tsx

## Phase 2: Foundational — 계정 · 세션

- [x] T1409 설정 읽기(env · mock 모드 · 출처 판정) in src/features/simulator/config.ts
- [x] T1410 웹 API 클라이언트(본사 토큰 메모리 보관 · 401 재로그인) in src/features/simulator/api/webClient.ts
- [x] T1411 앱 API 클라이언트(근무자별 토큰 맵 · 401 재로그인) in src/features/simulator/api/appClient.ts
- [x] T1412 [P] 오류 정리(래퍼 · ProblemDetails · 빈 body → 상태 + 문구) in src/features/simulator/api/simError.ts

## Phase 3: US1 — 사업장 선택 · 근무자 목록

> **독립 테스트 기준**: 실서버 모드에서 `/dev/simulator` → 사업장 34 선택 → 근무자 3명이 "로그인 가능"으로, 지점 10 · 코스 4 가 보인다. 다른 탭의 현장 화면 로그인이 유지된다.

- [x] T1413 [US1] 사업장 목록(본사 `AdminSiteSelect` → 평면 목록) · 사업장 정보(근무자 · 지점 · 코스) in src/features/simulator/api/siteData.ts · src/features/simulator/lib/flattenSites.ts
- [x] T1414 [US1] 근무자 상태(로그인 가능 · 근무 · 진행 중 순찰) in src/features/simulator/hooks/useWorkerStatus.ts
- [x] T1415 [US1] 페이지 틀(상단 사업장 선택 · 근무자 · 작업 · 실행 영역) · 안내 화면(mock · localhost · 계정 없음) in src/pages/dev/SimulatorPage.tsx · src/features/simulator/components/
- [x] T1416 [US1] 단위 테스트(사업장 평면화 · 앱 클라이언트 토큰 맵 · 재로그인 · 오류 정리) in src/features/simulator/**/__tests__/
- [x] T1417 [US1] verify · test(142 files · 1554 tests) · build 산출물에 시뮬레이터 흔적 없음 · 실서버 브라우저 확인(사업장 34 → 근무자 3 · 지점 10 · 코스 4, 사업장 35 → 근무자 없음, 선택 목록 다크 팝업)

## Phase 4: US5(틀) + US2 — 작업 틀 · 실행기 · 구축

> **독립 테스트 기준**: 근무자 일괄 추가 3명 → 실행 목록에 단계 로그가 쌓이고 근무자 목록에 3명이 늘어난다.

- [x] T1418 [US5] 작업 정의 타입 · 실행기(동시 실행 · 상태 · 단계 로그 · 중단) in src/features/simulator/engine/
- [x] T1419 [US5] 실행 목록(Trace) · 작업 입력 창 틀 in src/features/simulator/components/
- [x] T1420 [US2] 근무자 일괄 추가 in src/features/simulator/tasks/addWorkers.ts
- [x] T1421 [US2] 지점 일괄 추가 · 코스 추가 in src/features/simulator/tasks/ — 🔴 웹 `AddCourse` 는 지점을 무시한다(B-27 · 실서버에서 지점 0개 코스가 만들어져 확인) → 추가 → 번호 찾기 → `UpdateCourse` 로 지점 편성 → 개수 확인 4단계
- [x] T1429 누를 수 있는 요소에 `cursor-pointer`(사용자 2026-11-18) in src/features/simulator/ui/ — button · select · checkbox · 입력 창의 라벨 줄
- [x] T1430 [US2] 단위 테스트(실행기 5 · 번호 계산 9) · verify · test · 실서버 브라우저 확인(사업장 35 — 지점 3 · 근무자 3(`600201`~) · 코스 2, 아이디 중복 400 실패 표시)

## Phase 5: US3 — 순찰 실행

> **독립 테스트 기준**: 시뮬 단축 코스에서 프리셋 6종이 각각 완료 · 미완료 · 시간초과 · 교대 표시를 만든다.

- [x] T1422 [US3] 순찰 계획 타입 · 프리셋 6종 in src/features/simulator/patrol/plan.ts
- [x] T1423 [US3] 순찰 엔진(시작 → 지점별 인증 · 건너뛰기 · 메모 · 교대 · 종료) in src/features/simulator/patrol/runPatrol.ts
- [x] T1424 [US3] 순찰 실행 입력 창(프리셋 · 지점별 표) in src/features/simulator/components/PatrolRunDialog.tsx
- [x] T1425 [US3] 엔진 단위 테스트(가짜 API 로 호출 순서) · 진행 중 순찰 종료 작업 in src/features/simulator/patrol/__tests__/ · src/features/simulator/tasks/endPatrols.ts
- [x] T1431 [US3] 실서버 확인(사업장 35) — 회차 `112` 시간초과(70초 대기 → 시간초과 1) · `113` 미인증 + 특이사항 + 교대(근무자2 → 근무자1 · 인증 2 · 미완료 1) 동시 실행 · `114` 도중 종료 · `115` 중단 → "진행 중 순찰 종료"로 닫음. 프리셋은 **겹쳐 누르는 방식**(정상 완료만 되돌림)

- [x] T1432 [US3] 수정(사용자 2026-11-18) — **상황은 그 줄에서 일어난다**: 교대 · 종료를 "이 지점 전" → "이 지점 처리 **후**"로(웹 대시보드가 교대를 직전 인증 지점 `lastOrderNo` 에 표시해 줄이 어긋났다 — 사용자 회차 `117` · `118`: 3번 줄에 넣은 교대가 서버에 직전 2 · 직후 3 으로 기록) · 줄마다 상황 버튼(미인증 · 특이사항 · 시간초과 · 교대 · 종료)을 눌러 켜고 끔 — 켜면 값 자동 채움 · "순찰 시작" 줄(첫 지점 전 교대 · 인증 0개 종료) · 마지막 지점은 교대 · 종료 불가 · 상단 프리셋은 "한 번에 채우기"로 유지 in src/features/simulator/patrol/plan.ts · runPatrol.ts · src/features/simulator/components/PatrolRunDialog.tsx — 실서버 확인 회차 `119`(1번 줄 교대 → 서버 직전 1 · 직후 2)

## Phase 6: US4 — 배치

- [x] T1426 [US4] 배치 요청 · 복귀 요청 · 근무 시작/종료 in src/features/simulator/tasks/ · src/features/simulator/api/assignment.ts — 받는 사업장 기본값은 같은 그룹 사업장 · 배치돼 온 근무자는 목록에 "배치 중 · 원 소속 …" 표시
- [x] T1433 [US4] 실서버 확인 — 근무자3(`600203`) 사업장 35 → 34 배치 요청(신청 `53` · 받는 사업장 대기 목록에서 확인) → (확인용으로 API 승인) → 사업장 34 목록에 나타남 → 복귀 요청 → (API 승인으로 원상 복구) · 근무 시작 전원 → 목록에 "근무 중"

- [x] T1434 [US4] 수정(사용자 2026-11-18) — **근무자 한 명에 대한 동작은 그 줄에서**: 드롭다운으로 고르면 배치 중이 아닌 사람에게 복귀 요청을 보내는 식으로 잘못된 대상이 섞인다 → 근무자 줄에 근무 스위치 · 상태별 버튼(원 소속 = 배치 요청 / 배치 중 = 복귀 요청 / 승인 대기 = 버튼 없음) · 순찰 중인 줄에만 순찰 종료 · 패널 머리에 전체 근무 시작 · 종료(이미 그 상태인 사람은 제외) · 배치 단계 색(배치 중 = 강조색 + 줄 배경 / 승인 대기 = 주황 / 거절 = 빨강) · 작업 패널에서 배치 · 근무 묶음 제거 · 정리는 "전원 종료"만(확인 창) in src/features/simulator/components/WorkerList.tsx · src/features/simulator/tasks/workerActions.ts · src/features/simulator/lib/assignmentState.ts — 배치 단계는 `DetailUser.affiliation` 으로 판정(실측 → `app-api-spec.md` §2) · 실서버 확인(근무자1 `600201`: 배치 요청 → 승인 대기 표시 → 승인 → 사업장 34 에서 복귀 요청 버튼 → 복귀 승인 대기 표시 · 근무 스위치)

## Phase 7: Polish

- [ ] T1427 실시간 로그 다듬기(OQ-082-B — 사용자와 구성 논의 후)
- [x] T1428 roadmap 등재 · `CLAUDE.md` 문서 표에 `app-api-spec.md` 추가 · 백엔드 전달 목록은 `app-api-spec.md` §4(14건 — 전달은 사용자)

## 다음 spec으로 이월

- T1427 실시간 로그 다듬기(OQ-082-B)
- 생체확인 작업(OQ-082-A — 백엔드 확인 뒤)
- 브라우저 미확인 항목(OQ-082-D) · "배치 거절됨" 표시(OQ-082-E)

---

## Dependencies & Execution Order

- T1404 → T1406 · T1407(패키지가 있어야 한다)
- T1409 → T1410 · T1411 → T1413 · T1414 → T1415
- Phase 3 → Phase 4(실행기) → Phase 5 · 6(작업들은 실행기 위에 얹는다)
- `[P]` 끼리 병렬 가능
