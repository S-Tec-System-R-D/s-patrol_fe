# 084-design-renewal-screens tasks

> 입력: [`spec.md`](./spec.md) · 목업 [`현장 30장`](../../../docs/ui-mock/현장/개선안/디자인개편-2026-11/). 태스크 ID 는 **T1476~**(083 의 T1475 다음).
> 위험도 B — 화면 단위로 크게 나눈다. 대시보드만 영역별로 조금 더 나눴다.
> 🔴 **083 이 끝난 뒤 착수한다.** 착수할 때 083 `tasks.md` 의 `## 다음 spec으로 이월` 을 `spec.md` §0 으로 옮기고 이 목록을 다시 본다.

## 작업 규칙(이 spec 한정)

- 🔴 화면마다 **첫 단계는 대조** — 지금 구현을 읽고 목업과 어긋난 곳(문구 · 칸 · 버튼 자리)을 보고한 뒤 계획을 낸다(OQ-084-G). 어긋나면 **지금 구현이 맞다**.
- 🔴 계획 먼저(제시 → 승인 → 수정). 화면 하나가 끝나면 `verify` · `test` + 브라우저 확인 + 1920×911 캡처를 목업과 대조한다.
- 문구 · 표의 칸 · 필터 · 조회 · 쓰기 동작은 바꾸지 않는다. 접근 이름이 바뀌면 테스트를 같은 태스크에서 고친다.

## Phase 1: Setup

- [x] T1476 083 이월 항목 옮기기(🔴 083 `tasks.md` 의 `## 다음 spec으로 이월` — 공용 조각 3종(083 T1469~T1471) · 탭 · 주황 26곳 · 한 영역 안의 빈 상태 · 근무 상태 점 등. 이 목록의 태스크에 빠진 것이 있으면 여기서 태스크를 더한다) · 주황을 쓰던 곳 중 화면별 판단이 필요한 곳 표 확정 in specs/phase7/084-design-renewal-screens/spec.md
  - 2026-11-20: spec §0 을 이월 표로 다시 썼다(17건 — 어느 태스크에서 다루는지 함께). 빠진 것을 태스크로 더했다 — T1519(제목 아이콘 타일 · 영역 제목 굵기) · T1520(캡처 기준본) · T1521(좁은 화면 일괄 확인). 주황 26곳 중 색을 정해야 하는 5곳은 그 화면을 시작할 때 묻는다.
- [x] T1477 개편 전 화면 캡처 보관(대조용 — 태그 `design-before-renewal-2026-11` 에서 현장 14화면 1920×911) in e2e/capture.pw.ts
  - 2026-11-20: 태그의 코드를 임시 폴더에 꺼내(`git worktree`) 따로 설치하고 가짜 서버(5175)로 현장 14화면을 1920×911 로 찍었다 → `docs/ui-mock/현장/개선안/디자인개편-2026-11/개편전-캡처/`(14장 · 약 1.1MB). 찍는 스크립트 = `_gen/shot-app.cjs`(개편 뒤 화면도 같은 스크립트로 찍어 대조한다 — 임시 폴더로 복사해 돌린다). 🔴 `docs/ui-current` 는 2026-10-21 것이라 개편 전 기준으로 쓸 수 없었다(073~082 가 반영되지 않았다). 임시 폴더는 지웠다.
- [x] T1478 React Bits `Counter` 의 의존성과 그 라이선스 확인 → 보고(설치는 T1486) in package.json
  - 2026-11-20: 공식 등록 정보(`reactbits.dev/r/Counter-TS-TW`)를 읽었다 — **npm 의존성 0개**(`dependencies: []`). import 는 `react` 뿐이고 움직임은 직접 쓴 스프링 + `requestAnimationFrame`. `prefers-reduced-motion` 이면 바로 값으로 붙는다. 약 450~500줄(추정). 라이선스는 MIT + Commons Clause(2026-11-20 원문 확인 — 제품 안 사용 가능 · 복사한 파일에 저작권 표시 유지). 🔴 숫자 네 개를 굴리려고 500줄을 들이는 셈이라, T1486 에서 "그대로 복사"와 "같은 움직임을 짧게 직접 쓰기"를 놓고 다시 묻는다. React 19 · Tailwind v4 에서 돌려 보지는 않았다.

## Phase 2: US1 · US2 — 대시보드

> 독립 테스트 기준: 1920×911 에서 목업 `01` 과 같은 배치다. 실시간 알림이 온 코스가 약 4초 움직이고, 움직임 줄이기 설정에서는 움직이지 않는다. 승인 · 반려 · 새로고침이 그대로 동작한다.

- [x] T1479 [US1] 영역 배치 — 제목 오른쪽 한 줄 숫자 네 개(🔴 공용 조각 "상자 없는 한 줄 숫자"를 여기서 만든다 — 083 T1469) → 진행 중 전체 폭 → 세 칸 · 실시간 표시 · 새로고침을 `TopBar` 오른쪽 자리로 in src/pages/service/dashboard/DashboardPage.tsx · src/features/dashboard/components/DashboardKpiCard.tsx
  - 2026-11-20: 제목 오른쪽 한 줄 숫자(26px · 상자 없음 — `DashboardKpiCard` 를 그 모양으로. 따로 공용 조각을 만들지는 않았다 — 쓰는 곳이 아직 여기뿐) → 진행 중 전체 폭 → 세 칸(`2xl` 3칸 · `xl` 2칸 · 그 아래 1칸). 실시간 표시 · 새로고침은 위 줄 오른쪽으로 — 🆕 `TopBarRight`(틀이 잡은 자리에 portal · 틀이 없으면 제자리) · `TopBarSlotContext`. 🔴 숫자 줄은 `xl` 미만에서 제목 아래로 내린다 — 제목 옆에 두면 390px 에서 부제가 가려졌다(e2e 로 발견).
- [x] T1480 [US1] 진행 중 코스 상자 — 가로 경로 · `순찰 시작` 점 + 시작 시각 · 지점별 인증 시각 · 다음 지점 강조 · 점선 구간 · 미인증 · 교대. 지점이 많은 코스의 지금 처리(여러 줄)를 먼저 확인(OQ-084-B) · `순찰 시작` 점은 검정을 쓰지 않는다(OQ-084-D) in src/features/dashboard/components/ActiveCourseCard.tsx · src/features/dashboard/components/CourseStepper.tsx · src/features/dashboard/components/ActiveCourseSection.tsx
  - 2026-11-20: 알약 뱃지 → 선 위의 점(이름 · 인증 시각이 아래). 맨 앞 `순찰 시작` 점 + 시작 시각(카드 둘째 줄의 `08:20 시작` 을 옮김). 지나온 구간 파란 실선 · 다음 지점까지 점선 · 남은 구간 옅은 선. 🔴 **한 줄 최대 10칸**(순찰 시작 포함 — 사용자 결정) · 넘으면 다음 줄 · 10칸 이하면 칸 수만큼 똑같이 나눔. 번호는 그리지 않는다. 카드 머리 한 줄 = 이름 · `순찰 중`(🆕 — 멈춘 회차는 적지 않는다) / `시간초과 +n분` · `미인증 n` | 순찰자 · 막대 · `n/N 지점`. 시간초과의 빨간 테두리는 없앴다. 🔴 점 색은 목업대로 **인증 = 파랑**(전에는 초록)이다 — 경로는 "어디까지 갔나"(진행)라 파랑으로 봤다. `순찰 시작` 점은 옅은 파랑(검정 아님 — OQ-084-D 해소).
- [x] T1481 [US1] 미완료 · 시간초과 / 종료된 순찰 — 탭 두 개인 한 상자 → 위아래 두 영역(내용 · 문구 유지 · 테스트 수정) in src/features/dashboard/components/RecentRecordPanel.tsx
  - 2026-11-20: 탭 두 개인 한 상자 → 위아래 두 영역(영역 제목 + 건수 + `전체 보기`). 줄 내용 · 문구는 그대로. 건수 뱃지(빨강 / 회색 칩)는 회색 숫자로.
- [x] T1482 [US1] 배치 대기 · 공지사항 — 오른쪽 칸 · 선으로 나눈 줄 목록(승인 · 반려 동작 유지) in src/features/dashboard/components/DeploymentPendingPanel.tsx · src/features/dashboard/components/DashboardNoticePanel.tsx
  - 2026-11-20: 상자를 없애고 영역 제목 + 선으로 나눈 목록. 구성은 그대로(요청 종류별 묶음 · 기다린 날수 · 출발지 · 기간 · `승인` · `반려`). 기다린 날수 주황 → 회색(사용자 결정). 실시간 연결이 끊겼을 때의 점 주황 → 회색(사용자 결정).
- [x] T1483 [US2] 오늘 기록 집계 함수(시간대별 24칸 · 코스별 횟수 · 0회 코스 포함) + 단위 테스트. 하루 건수가 100건을 넘는 사업장이 있는지 실서버에서 확인해 보고(OQ-084-A) in src/features/dashboard/lib/todayStats.ts
  - 2026-11-20: `countByHour`(0~23시 · 시작 시각 기준 · 오늘 것만) · `countByCourse`(많은 순 · 코스 목록을 주면 0회 포함) · `isCapped`(100건). 단위 테스트 9건 — 🔴 테스트가 결함을 잡았다(시각이 없는 기록을 0시로 셌다 — `Number('')` 가 0). 🔴 **하루 건수가 100건을 넘는 사업장이 있는지는 실서버에서 확인하지 못했다**(OQ-084-A 그대로) — 받은 것이 100건이면 `최근 100건 기준` 이라고 적는다(사용자 결정).
- [x] T1484 [US2] 오늘 시간대별 순찰(세로 막대 · 지금 시간대 강조) · 오늘 코스별 순찰(가로 막대 + 횟수) in src/features/dashboard/components/TodayHourChart.tsx · src/features/dashboard/components/TodayCourseBars.tsx
  - 2026-11-20: `TodaySummaryPanel` 하나에 두 영역(파일 둘로 나누지 않았다 — 같은 자료 · 같은 조회 상태). 시간대별 = Recharts 세로 막대(가로 격자만 · 축 선 없음 · 둥근 막대 · 카드 툴팁 · 지금 시간대만 진하게) · 코스별 = 직접 그린 가로 막대(0회 줄 포함 — 사용 중인 코스 목록을 한 번 더 받는다 · 실패해도 영역은 그린다). 조회 상태는 `최근 기록` 과 같이 움직인다. 테스트 7건. 🔴 차트 공용 조각은 만들지 않았다 — 두 번째로 쓰는 화면(코스 상세)에서 공통 부분을 뽑는다.
- [x] T1485 [US1] 움직임 — 진행 중 코스에서 약 4초(아이콘 회전 · 다음 지점 물결 · 점선 흐름) · 화면이 뜰 때 + 실시간 알림이 온 코스에서 다시 · `prefers-reduced-motion` in src/features/dashboard/components/ActiveCourseCard.tsx · src/index.css
  - 2026-11-20: CSS 만으로 — `순찰 중` 고리 회전(1초 × 4) · 다음 지점 둘레 물결(2초 × 2 — 전에는 무한) · 다음 지점까지의 점선 흐름(0.8초 × 5). 🔴 **실시간 알림이 온 코스에서 다시** = 카드의 `key` 에 지점 상태를 넣었다 — 지점이 인증 · 미인증으로 바뀌거나 회차가 멈추면 그 카드만 다시 붙어 움직임이 처음부터 돈다(1분마다의 경과 갱신으로는 다시 붙지 않는다). 움직임 줄이기 설정은 전역 규칙이 끈다. 🔴 실제로 움직이는 모습은 브라우저에서 보지 못했다(캡처는 정지 화면 · 움직임 줄이기로 찍는다).
- [~] T1486 [US1] ~~숫자 굴러감 — React Bits `Counter`~~ — **보류**(사용자 결정 2026-11-20): React Bits 를 쓰지 않고, 쓸지는 나중에 방향을 정해서 적용한다. 숫자는 움직임 없이 바로 바뀐다(지금 동작 그대로).
- [x] T1487 [US1] 빈 상태 · 불러오지 못함 — 진행 중은 상자 안 타일, 나머지는 글자 한 줄, 코스별은 0회 줄(목업 `29`) in src/features/dashboard/components/AreaFallback.tsx
  - 2026-11-20: 진행 중 없음 = 상자 안 타일 빈 상태(083 의 `AppEmpty`) · 나머지 영역 = 회색 글자 한 줄(기존 문구) · 코스별은 코스가 있으면 0회 줄 · 조회 중 = 줄 모양 · 실패 = 문구 + `다시 시도`. 새 문구는 `오늘 시작한 순찰이 없습니다` 하나.
- [x] T1488 [US1] 회귀 확인 — 실시간 연결 · 새로고침 · `마지막 갱신` · 승인 · 반려 · e2e · 캡처 대조 in e2e/
  - 2026-11-20: verify 통과 · test 150파일 1652건 · e2e 40건(1280 + 390). 1920 폭 전체 길이 캡처로 목업과 대조 — 배치 · 경로 · 세 칸이 맞다. e2e 가 잡은 것 2가지를 고쳤다: 없어진 탭을 누르던 단계 · 390px 에서 숫자 줄이 부제를 가리던 것. 🔴 못 본 것: 실제 움직임 · 승인 · 반려를 브라우저에서 직접 누르는 것(단위 테스트는 통과) · 지점이 20개 넘는 코스(가짜 서버 자료는 최대 12개 — 두 줄로 꺾이는 것까지 확인).
  - 🔧 **마감 뒤 수정(2026-11-20 — 사용자가 시뮬레이터로 돌려 보고 지적 6가지)**: ① 영역 제목 `진행 중인 순찰` → `진행 중` + 건수 ② 지점 경로 — 선을 점에서 4px 씩 띄움(흰 바탕 점 뒤로 선이 비쳤다) · 점 20px → 16px · 다음 지점에 가운데 6px 파란 점 + 둘레 옅은 파랑 · 대기 지점은 테두리 없는 8px 옅은 회색 점 · 미인증은 흰 바탕 회색 테두리 + 짧은 줄 ③ `순찰 중` 고리는 순찰 중인 동안 **계속** 돈다(4바퀴 돌고 멈추면 오류처럼 읽혔다) · 이어서 다음 지점 둘레 물결 · 점선 흐름도 계속 반복으로(멈춘 회차는 움직이지 않는다) — 알림이 온 코스의 카드를 다시 붙이던 처리(T1485)는 필요 없어져 뺐다 ④ 종료된 순찰은 지금 모양 유지(목업보다 깔끔하다는 판단) ⑤ 배치 대기 — 요청 종류별 묶음을 없애고 한 목록 · 한 줄 = 이름 / `배치 요청 · 출발지 → 이 사업장 · n일 대기` · 제목 옆 건수 · 링크 `전체`(`반려` 버튼과 기다린 날수는 남김 · 배치 기간은 뺌 — 사용자 결정) ⑥ 공지사항 — 제목 / `고정 · 작성자 · 날짜`(핀 아이콘 → 글자). verify · test 1652건 · e2e 40건 · 1920 캡처 확인.
  - 🔴 **원인 기록**: T1479~T1488 을 "끝"으로 보고했지만 배치만 맞추고 세부 모양(점 크기 · 선 간격 · 줄 구성 · 영역 제목)은 목업 수치와 하나씩 대조하지 않았다. "지금 구현이 맞다"는 **내용**(어떤 값을 보여 주는가)에 대한 지침인데 **모양**에까지 적용했다. 이후 화면은 목업의 수치를 먼저 뽑아 놓고 만든 뒤 캡처를 목업과 나란히 대조한다.

## Phase 3: US3 — 코스 · 지점 상세

> 독립 테스트 기준: 목업 `05` · `07` 과 같은 배치다. 편성 편집 · 수정 · 삭제 · 회차 보기 · QR 내려받기가 그대로 동작한다.

- [x] T1489 [US3] 코스 상세 — 제목 줄 · 낮은 숫자 칸 3개 · 왼쪽(순찰 경로 · 최근 순찰 기록) / 오른쪽(기본정보 · 시간대별 · 근무자별) · 카드 상자 제거 in src/pages/service/zones/ZoneDetailPage.tsx · src/features/courses/components/detail/CourseKpiRow.tsx · src/features/courses/components/detail/CourseInfo.tsx · src/features/courses/components/detail/CourseRouteCard.tsx
  - 2026-11-20: 영역마다 있던 흰 카드 상자를 없애고 영역 제목 + 내용으로. 두 단 = 왼쪽(순찰 경로 · 최근 순찰 기록) / 오른쪽 340px(기본정보 · 시간대별 · 근무자별) · 단 사이 세로 선 · 영역 사이 28px. 숫자 칸 3개는 낮은 상자(60px · 라벨 12px · 값 18px · 라벨 앞 아이콘 없음 — `AppKpiCard`). 🔴 **사용자 결정 4가지(2026-11-20)**: ① 화면 제목 왼쪽의 남색 아이콘 타일 제거 — 상세 여섯 화면 모두(`AppPageHeader` 의 `icon` 을 없앴다) ② 기본정보 줄 = 이름 왼쪽 고정 폭 88px · 값 바로 옆 · 줄 사이 선(`AppDetailRow` — 두 갈래이던 배치를 하나로) ③ 인증률이 가장 낮은 지점의 주황 강조 제거 ④ QR 미발급 안내 주황 → 빨강. 🔴 **같이 바뀐 화면**: `AppDetailCard`(상자 제거) · `AppDetailRow` 를 쓰는 근무자 상세 · 지점 인증 상세 · 순찰 상세의 교대 이력 · 본사 사업장 상세 3영역 · 본사 관리자 보기 창 — 이 화면들은 아직 자기 차례 전이라 **상자 있는 영역과 없는 영역이 섞여 보인다**(T1504~T1506 · 085 에서 정리). 지점 인증 상세의 인증 정보는 바깥 상자에 안쪽 여백만 넣어 두었다. 🔴 순찰 경로는 목업(큰 지도 + 가로 지점 줄)이 아니라 지금 구성(지도 + 지점별 인증률 세로 목록)을 유지했다 — 지금 구현이 기준. 1280px 에서 지점 줄이 좁은 문제는 좁은 화면 일괄 확인(T1521)으로.
- [x] T1490 [US3] 코스 상세 — 마지막 순찰 칸의 진행 표시(진행 중이면 순찰자 · 진행 막대 · `지점 n / n` · 경과) in src/features/courses/components/detail/CourseKpiRow.tsx
  - 2026-11-20: 가장 최근에 시작한 회차가 진행 중(코스 상태 0)이면 = 시작 시각 + `진행 중 · 순찰자`(파랑) + 오른쪽에 진행 막대 · `지점 n / n` · 경과. 끝난 회차면 지금처럼 일시 + `n시간 전`. 🔴 경과는 **시작부터 지금까지**로 센다(목록 응답의 소요시간은 끝난 회차의 값) — 멈춘 시간을 빼지 않는다. 교대한 회차는 순찰자를 모두 적는다(누가 지금 돌고 있는지는 목록 응답으로 알 수 없다).
- [x] T1491 [US3] 코스 상세 — 작은 그림 2개 · 시간대별을 shadcn 모양 차트로 · 툴팁 = 순찰 시작 일시 + 값 · 단위 in src/features/courses/components/detail/CourseRunCharts.tsx · src/features/courses/components/detail/CourseRunStatCards.tsx
  - 2026-11-20: 🆕 `AppChartTooltip`(차트 말풍선 카드 — 윗줄 무엇의 값인가 · 아랫줄 색 네모 + 이름 + 값 · 단위. 대시보드 · 코스 상세 · 지점 상세가 같이 쓴다 — 083 에서 미룬 차트 공용 조각). 작은 그림 2개 = 120 × 30 · 막대는 바탕 칸 없이 옅은 파랑(시간초과만 빨강) · 선은 하늘색 → 포인트 파랑 · 말풍선 = **순찰 시작 일시**(`11.05 09:10`) + `소요 44분` / `인증률 100% · 8/8`. 🔴 **작은 그림은 Recharts 로 옮기지 않았다** — "7칸 고정 · 중앙값 2배 눈금 · 값 없는 회차는 빈 칸" 규칙을 직접 쥐고 있고 테스트가 그 DOM 을 본다. 모양만 맞췄다. 시간대별 순찰 = Recharts 세로 막대(대시보드와 같은 모양 · 가장 많은 시만 진하게 · `순찰 시간대` · `가장 많은 시간` 두 줄은 유지).
- [x] T1492 [US3] 코스 상세 — 최근 순찰 기록(펼친 줄 = 내용만 흰 상자 · 고른 줄 = 옅은 회색) · 순서 번호 옅은 파랑 in src/features/courses/components/detail/CoursePatrolLog.tsx · src/features/courses/components/detail/CourseMapCard.tsx
  - 2026-11-20: 순서 번호 = 옅은 파랑 바탕 + 파란 숫자 + 옅은 파란 테두리(검정 원 제거). 지도 위 핀은 진한 파랑 그대로. 최근 순찰 기록 = 줄 높이 46px · 시작 칸만 진하게 · `전체 기록 n건 보기` 를 표 아래 가운데 → 영역 제목 줄 오른쪽(파랑). 🔴 **하지 않은 것**: "펼친 줄 · 고른 줄" — 이 표에는 펼치는 줄이 없고(줄을 누르면 회차 보기 창이 뜬다) 고른 줄은 창에 가려 보이지 않는다. 순찰 상세(T1504)에서 다룬다.
- [x] T1493 [US3] 지점 상세 — 상자 없는 한 줄 숫자 · 최근 순찰에 순찰자 · 코스 이름 · 시각 · 14일 막대 shadcn 모양 · 왼쪽 속성 단 in src/pages/service/points/PointDetailPage.tsx · src/features/points/components/detail/PointDetail.tsx · src/features/points/components/detail/PointActivityCard.tsx · src/features/points/components/detail/PatrolBarChart.tsx
  - 2026-11-20: 왼쪽 속성 단 400px(지도 — 자기 테두리 · 둥근 모서리 / 기본정보) · 단 사이 세로 선 · 오른쪽 인증 기록. 숫자 = 상자 없는 한 줄(`인증 4 / 7회 · 57%` · `미인증 3 회` · `최근 순찰 2일 전 김근무 · A동 순찰코스 · 10.17 09:16`). 🆕 최근 순찰의 순찰자 · 코스 · 일시는 받은 14일 기록 중 **가장 최근에 인증한 줄**에서 읽는다(요청이 늘지 않는다 — 14일 안에 인증이 없으면 적지 않는다). 14일 막대 = 세로 눈금 숫자 없음 · 실선 격자 · 날짜 `n일`(오늘은 `오늘`) · 차트 카드 말풍선. 날짜 묶음 머리 = 회색 한 줄 + 선 · 줄 높이 46px. 지도 위 지점 표시 검정 → 파랑. TAG ID 는 상자 없이 고정폭 글자 + 작은 `복사`. 🔴 목업은 좌우가 반대(인증 기록 왼쪽 · 속성 오른쪽)지만 지금 구성(속성 왼쪽 — `spec 076` 결정)을 유지했다.
- [x] T1494 [US3] 회귀 확인 — 두 화면 동작 · 캡처 대조 in e2e/
  - 2026-11-20: verify 통과 · test 150파일 1652건 · e2e 40건(1280 + 390). 1920 폭 캡처로 두 화면 확인. 테스트는 구조가 바뀐 4곳만 고쳤다(영역을 `.rounded-lg` 가 아니라 `section` 으로 집기 · 라벨 요소 · 선 색 클래스 · 숫자 칸의 아이콘 인자). 🔴 캡처 주의: 전체 길이(`fullPage`) 캡처에서는 Recharts 막대가 영역 오른쪽으로 넘쳐 보인다 — 실제 폭을 재면 영역 안이다(캡처 때 창 크기가 바뀌며 생기는 현상). 상세 화면은 높은 창으로 찍는다. 🔴 못 본 것: 진행 중 회차의 경과 시간(가짜 서버의 진행 중 회차가 고정 시계보다 10분 뒤라 경과가 비어 나온다 — 단위 계산은 단순 뺄셈) · NFC 지점의 TAG ID 줄 · QR 미발급 빨강 안내(가짜 서버 자료에 그 경우가 없다) · 본사 사업장 상세.
  - 🔧 **마감 뒤 수정(2026-11-20 — 목업 `05` · `07` 을 앱과 같은 크기로 띄워 하나씩 대조)**. **코스 상세**: 순찰 경로를 목업 구성으로(전체 폭 지도 220px → 아래 가로 지점 줄 — 번호 점 · 이름 · 구간 시간 · 인증수단 / 한 줄 최대 10칸 / 제목 옆 지점 수). 🔴 전의 세로 목록에 있던 **지점별 인증률은 실제 값이 아니라 자리표시 값**이었다(OQ-074-A) — 없앴다. 좌표가 하나도 없으면 지도 없이 지점 줄만 그린다. `pointRateStub` · `CourseDiagramCard` 는 화면에서 쓰지 않게 됐다(파일 · 테스트는 남아 있다 — 지울지는 문서 정리 때 정한다). 최근 순찰 기록 = 인증 칸 `4 / 8` 글자만(막대 제거) · 소요 왼쪽 정렬 · 시간초과면 빨강 · 제목 옆 건수만 · `순찰이력 전체` 링크는 늘 보임. 시간대별 눈금 `0 · 6 · 12 · 18시`. `근무자별` → `근무자별 순찰`(내용은 유지 — 횟수 + 인증률 · 사용자 결정). **지점 상세**: 🔴 좌우를 뒤집었다 — 왼쪽 인증 기록(넓게) / 오른쪽 속성 단 340px(코스 상세와 같은 틀 · `spec 076` 의 "속성 왼쪽" 을 뒤집음 · 사용자 결정). `위치` 영역(제목 옆 좌표 · 지도 170px — 기본정보의 좌표 줄은 없앰). 14일 막대 = 칸을 채우는 넓은 막대 · 격자 없음 · 옅게 깔고 고른 날(없으면 오늘)만 진하게 · 범례 줄 제거. 날짜 묶음 머리 `오늘 · 10월 20일 (화) · 2회`. 기록 줄 = 시각 80px · 이름 120px · 코스 · 오른쪽 상태(정상 인증은 뱃지 없이 초록 체크 — 11-13 결정 유지 · 줄 앞 아이콘과 화살표 제거). 소속 코스 = 파란 글자 링크 · 인증수단 = 글자만(`AuthMethodDisplay` 는 이 화면에서 안 쓴다). verify · test 1652건 · e2e 40건.

## Phase 4: US4 — 목록 화면

> 독립 테스트 기준: 일곱 화면이 같은 순서(제목 → 탭 → 검색 · 필터 → 표 → 페이지 이동)이고, 표의 칸 · 필터 · URL 쿼리 동작이 개편 전과 같다.

- [ ] T1495 [P] [US4] 순찰이력 — 코스(특이사항은 순찰 결과 옆 회색 말풍선) in src/pages/service/patrol/zones/PatrolZonesPage.tsx
- [ ] T1496 [P] [US4] 순찰이력 — 지점(인증수단 글자만) in src/pages/service/patrol/points/PatrolPointsPage.tsx · src/features/patrol-points/components/PointColumn.tsx
- [ ] T1497 [P] [US4] 코스 목록 in src/pages/service/zones/ZonesPage.tsx
- [ ] T1498 [P] [US4] 지점 목록 in src/pages/service/points/PointsPage.tsx
- [ ] T1499 [P] [US4] 근무자 목록 · `근무 중 / 근무 종료` 를 새 상태 표시로 · 권한 표시를 아이콘으로 구분하는 안 두 가지 제시 → 결정(본사 관리자 화면도 같은 규칙) · 빈 상태 두 종류(목록 영역 가운데 — 목업 `27` · `28`) in src/pages/service/users/UsersPage.tsx · src/features/workers/components/WorkerColumns.tsx
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

- [ ] T1519 화면 제목 왼쪽의 남색 아이콘 타일(`AppPageHeader` 의 `icon` — 목업에는 없다)을 어떻게 할지 제시 → 결정 · 영역 제목 굵기 600 맞춤 in src/components/app/AppPageHeader.tsx · src/components/app/AppDetailCard.tsx
- [ ] T1520 캡처 기준본(`docs/ui-current`) 다시 찍기 · README 변경 이력 in docs/ui-current/
- [ ] T1521 🔴 좁은 화면(1280px 미만) 일괄 확인 — 전 화면을 390px · 768px · 1024px 로 찍어 보고 고칠 곳을 목록으로 제시 → 결정 → 수정(아래 메뉴 · 카드 · 페이지 이동 · 본문 여백) in e2e/
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
- T1476~T1478 은 모든 Phase 선행. (T1486 은 보류 — React Bits)
- Phase 2: T1479 → T1480~T1482(파일이 달라 순서 자유) → T1483 → T1484 → T1485 → T1487 → T1488.
- Phase 3~6 은 Phase 2 와 독립이지만, 🔴 **대시보드를 먼저** 한다(주 화면 — 규칙이 실제로 맞는지 가장 먼저 드러난다).
- Phase 4 의 `[P]` 는 화면이 달라 병렬 가능. T1500(배치관리)은 탭 · 숫자 줄이 달라 따로.
- Phase 6 은 Phase 3 뒤(코스 상세가 모달의 바탕).
- Phase 7 은 전부 끝난 뒤. T1519 는 화면 작업 중 언제든(제목 줄을 처음 고치는 화면에서). T1521 → T1520(좁은 화면까지 고친 뒤 기준본을 찍는다). T1514 → T1515 · T1516(`[P]`).
