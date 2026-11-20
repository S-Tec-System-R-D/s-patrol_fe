# 083-design-renewal-foundation tasks

> 입력: [`spec.md`](./spec.md) · 값의 기준 [`디자인-규칙.md`](../../../docs/ui-mock/현장/개선안/디자인개편-2026-11/디자인-규칙.md). 태스크 ID 는 **T1435~**(082 의 T1434 다음).
> 위험도 A — 잘게 나눈다. 틀 · 부품마다 "모양 바꾸기"와 "쓰는 곳 회귀 확인"을 따로 둔다.
> 브랜치 `design-renewal-2026-11` · 되돌아올 지점 태그 `design-before-renewal-2026-11`.

## 작업 규칙(이 spec 한정)

- 🔴 태스크마다 **계획 먼저**(무엇을 어떻게 바꿀지 제시 → 승인 → 수정).
- 🔴 공용 구성 요소는 **이름 · props 를 유지하고 모양만** 바꾸는 것이 기본이다. props 를 바꿔야 하면 그 이유와 쓰는 곳 수를 계획에 적는다.
- 태스크가 끝날 때마다 `npm run verify` · `npm run test`(병렬). Phase 가 끝날 때마다 브라우저 확인 + 1920×911 캡처를 목업과 대조한다.
- 접근 이름(`aria-label` · 역할)을 바꾸면 깨지는 테스트를 같은 태스크에서 고치고 이유를 적는다.

## Phase 1: Setup — 글꼴 · 색 · 줄바꿈 (US1)

> 독립 테스트 기준: 모든 화면의 글꼴이 Noto Sans KR 로 보이고, 화면 배치는 그대로다. 시뮬레이터는 변함없다.

- [x] T1435 글꼴 패키지 고르기 — Noto Sans KR 을 앱에 묶어 싣는 패키지 후보와 굵기(400 · 500 · 600 · 700)별 용량을 재서 표로 보고(코드 변경 없음) in package.json
  - 실측(2026-11-20 · 두 패키지 5.3.1 · 라이선스 OFL-1.1): **`@fontsource-variable/noto-sans-kr`** = woff2 124조각 합계 3.5MB 로 굵기 100~900 전부(조각 하나 최대 65KB · 화면에 나온 글자가 든 조각만 받는다) / `@fontsource/noto-sans-kr` = 굵기 하나에 125조각 2.4MB → 네 굵기 9.8MB(굵기마다 따로 받는다) / 지금 Pretendard = 2.06MB 한 파일을 통째로 받는다.
  - 결론: 가변 글꼴 패키지(`@fontsource-variable/noto-sans-kr`). 목업이 쓴 구글 웹폰트도 같은 가변 글꼴 조각 방식이다. 사용자 승인 대기.
- [x] T1436 [US1] 글꼴 교체 — 고른 패키지 설치 · `pretendard` 제거 · `--font-sans` 교체 in package.json · src/index.css
  - 2026-11-20: `@fontsource-variable/noto-sans-kr` 5.3.1 설치 · `pretendard` 제거 · `--font-sans: 'Noto Sans KR Variable'`. verify 통과 · test 1604건 통과 · 개발 서버 로그인 화면에서 적용 글꼴과 조각 8개만 받는 것 확인.
- [x] T1437 [US1] 시뮬레이터가 Pretendard 를 예비 글꼴로 적고 있다 — 빠진 뒤에도 모양이 같은지 확인하고 필요하면 예비 글꼴만 고친다 in src/features/simulator/simulator.css
  - 2026-11-20: Manrope 에 한글이 없어 한글은 Pretendard 로 그려지고 있었다 → 예비 글꼴을 `Noto Sans KR Variable` 로(사용자 결정 — 색 · 틀은 그대로, 한글 글꼴만 따라간다). spec 의 해당 문장 3곳 수정.
- [x] T1438 [US1] 전역 줄바꿈 `word-break: keep-all` · 본문 크기 13px in src/index.css
  - 2026-11-20: `body` 에 `word-break: keep-all` · 12.5px → 13px. 제목(h1~h4) 기본값은 크기 단계와 함께 T1439 에서 본다.
- [x] T1439 [US1] 크기 단계 토큰 값 맞추기(화면 제목 20 · 영역 제목 15/600 · 내용 13 · 보조 12 · 11) — 토큰 이름은 유지 in src/index.css
  - 2026-11-20: page-title 22→20 · panel-title 16→15 · section-title 14→13 · tab 14→13 · body 12.5→13 · badge 11→12 · meta 11.5→11 · label 10.5→11(panel-header 15 · caption 12 는 그대로). 굵기는 쓰는 곳에 적혀 있어 부품 · 화면을 고칠 때 맞춘다.
- [x] T1440 [US1] 색 토큰 값 맞추기(파랑 `#2563eb` · 설명용 회색 `#64748b` · 선 · 옅은 바탕) · 다크 값도 같은 관계로 따라가기 in src/index.css
  - 2026-11-20: 라이트 값만 — point · ring · chart-1 `#3b82f6`→`#2563eb` · success `#22c55e`→`#16a34a` · danger `#ef4444`→`#dc2626`. 🔴 **다크 값은 그대로 뒀다** — 어두운 바탕에서는 지금의 밝은 값이 대비가 낫다(계획에서는 같이 바꾼다고 했으나 고치며 판단을 바꿨다). `primary`(남색)는 건드리지 않았다 — 주 버튼 파랑은 T1457. 선 두 단계(`#e8ecf1` · `#dde3ea`)는 틀 · 표 태스크에서.
- [x] T1441 [US1] 주황(`warning`) 을 쓰는 곳 전수 조사 → 표로 정리(여기서 옮길 곳 / 084 · 085 로 넘길 곳) in specs/phase7/083-design-renewal-foundation/tasks.md
  - 2026-11-20 조사 결과(시뮬레이터 · 테스트 제외 · 14개 파일 27곳). 🔴 **여기(083)서 옮기는 것은 뱃지 종류 정의 하나뿐**이고 나머지는 화면 코드라 084 · 085 로 넘긴다.

  | 곳 | 지금 주황의 뜻 | 옮길 색(제안) | 어디서 |
  |---|---|---|---|
  | `AppBadge.variants.ts` 의 `warning` 종류 | 뱃지 색 | 종류 이름은 남기고 모양을 새 상태 표시로(회색 아이콘) | **083 T1453 · T1456** |
  | 특이사항 표시 — `ZoneColumn` · `ZoneHistoryCard` · `PointColumn` · `PointHistoryCard` · `RunSummaryStrip`(건수) · `RunTimeline` · `UserRunRow`(2곳) · `PatrolPointDetailPage` 뱃지 · `historyBadge` 의 `특이사항` | 메모가 있음 | 진한 회색 말풍선(확정된 규칙) | 084 |
  | `historyBadge` 의 `순찰제외` | 지점이 순찰에서 빠짐 | 회색(미인증과 같은 계열) — 판단 필요 | 084 |
  | `AssignmentStatusBadge` 의 배치예정 | 아직 시작 전 | 회색(목업) | 084 |
  | `DeploymentPendingPanel` 의 기다린 시간(`n일 전` 류) | 오래 기다림 | 회색 보조 글자 — 판단 필요 | 084 |
  | `DashboardUpdatedAt` 의 연결 점(끊김) | 실시간 연결 안 됨 | 회색 점 — 판단 필요(문제로 보면 빨강) | 084 |
  | `CourseRouteCard` 의 인증률이 가장 낮은 지점 막대 · 숫자 | 약한 지점 | 빨강 또는 강조 없음 — 판단 필요 | 084 |
  | `PointQrCode` 의 QR 미발급 안내 상자 | 인증이 안 되는 이상 상태 | 빨강(문제) | 084 |
  | 검색어 강조 — `AddCoursePointDialog` · `GroupPicker` | 찾은 글자 표시 | 옅은 파랑 바탕 + 파란 글자 | 084 · 085 |
  | `EmergencyAddDialog` 의 `배치 중` 표시 | 다른 사업장에 가 있음 | 회색 — 판단 필요 | 085 |
  | `EmergencyContactCard` 의 빈 요일 | 담당자 없음 | 빨강 점선(확정) | 085 |
  | `index.css` 의 `--warning` 3종 · `--chart-4` | 토큰 | 쓰는 곳이 0 이 되면 지운다 | 084 T1513 |
  | `notify.warning`(토스트 종류) | 색 토큰이 아니다 · 쓰는 곳 0 | 그대로 | — |
- [ ] T1442 [US1] 회귀 확인 — 현장 전 화면 · 본사 3화면 · 로그인 · 시뮬레이터를 브라우저로 열어 글자가 잘리거나 넘치는 곳 목록화 · e2e 캡처의 글꼴 대기 문구 확인 in e2e/capture.pw.ts

## Phase 2: Foundational — 바깥 틀 (US2)

> 독립 테스트 기준: `xl` 이상에서 224px 사이드바 + 본문 카드 한 장으로 보이고, 메뉴 이동 · 사업장 전환 · 로그아웃이 지금과 같다. 1920×911 캡처의 틀이 목업과 같다.

- [ ] T1443 [US2] 메뉴 구성에 묶음 제목 추가(현장 `현황` · `관리` / 본사는 없음) — 메뉴 6개 · 순서 · 주소는 그대로 in src/components/layout/sidebar/sidebar.config.ts
- [ ] T1444 [US2] 사이드바를 224px 밝은 모양으로 — 로고 · 메뉴(아이콘 + 이름) · 묶음 제목 · 건수 알약 · 아래 사용자 이름 · 권한 in src/components/layout/sidebar/RailSidebar.tsx
- [ ] T1445 [US2] 사업장 선택 칸(현장) — 사이드바 위쪽으로 옮기고 선택지 1개면 이름만 보이게 in src/components/layout/sidebar/SiteSwitchButton.tsx
- [ ] T1446 [US2] 로그아웃 자리 옮기기(사이드바 아래 사용자 줄) in src/components/layout/sidebar/LogoutButton.tsx
- [ ] T1447 [US2] 현장 틀 — 본문 카드 한 장 + 맨 위 줄(지금 위치) · `<Outlet key={siteSeq}>` · 전환 오버레이 유지 in src/components/layout/ServiceLayout.tsx
- [ ] T1448 [US2] 본사 틀 — 같은 모양 · 사업장 선택 칸 없음 · 배치 대기 조회를 부르지 않는 규칙 유지 in src/components/layout/AdminLayout.tsx
- [ ] T1449 [US2] 맨 위 줄의 지금 위치(`부모 › 지금`) — 화면마다 그리던 경로 표시(`Breadcrumb`)와 겹치지 않게 한 곳으로 모으는 방법을 계획으로 제시 in src/components/app/AppPageHeader.tsx
- [ ] T1450 [US2] `xl` 미만 — 아래 메뉴의 색 · 글꼴만 맞추기(동작 유지) in src/components/layout/sidebar/FloatingNav.tsx
- [ ] T1451 [US2] 틀 테스트 고치기 in src/components/layout/__tests__ · src/components/layout/sidebar/__tests__
- [ ] T1452 [US2] 회귀 확인 — `npm run e2e`(1280px · 390px) · 현장 전 화면 + 본사 3화면 브라우저 확인 · 1920×911 캡처 대조 in e2e/

## Phase 3: US3 — 상태 표시

> 독립 테스트 기준: 완료 · 미완료 · 진행 · 시간초과 · 반려 · 근무 중이 아이콘 + 글자로 보이고, 권한 · 인증수단 · 교대는 글자만 보인다.

- [ ] T1453 [US3] 상태 표시 모양(아이콘 + 글자 · 색은 아이콘에만 · 빨강만 글자도) — 종류 이름 유지 in src/components/app/AppBadge.tsx · src/components/app/AppBadge.variants.ts
- [ ] T1454 [US3] 종류 → 아이콘 대응표 확정(완료 체크 · 미완료 빼기 원 · 진행 고리 · 시간초과 시계 · 반려 X 원 · 근무 중 점 원) — 쓰는 곳 32곳을 훑어 대응이 안 맞는 곳 목록화 in src/components/app/AppBadge.variants.ts
- [ ] T1455 [US3] 분류 · 설정 값(권한 · 인증수단 · 교대)을 글자만으로 — 쓰는 곳을 찾아 여기서 고칠 수 있는 곳만 고치고 나머지는 084 로 넘김 in src/components/app/AppBadge.tsx
- [ ] T1456 [US3] 테스트 고치기 · 주황을 쓰던 상태(T1441 표의 "여기서 옮길 곳") 옮기기 in src/components/app/__tests__

## Phase 4: US4 — 표 · 버튼 · 검색 · 필터 · 페이지 이동

> 독립 테스트 기준: 목록 화면 하나(근무자)에서 검색 · 필터 · 표 · 페이지 이동이 목업 모양이고 동작은 그대로다.

- [ ] T1457 [P] [US4] 버튼 — 높이 30px · 주 버튼 파랑 · 화면 제목 오른쪽 버튼(회색 채움 · 삭제는 빨강 채움) in src/components/ui/button.variants.ts · src/components/app/AppButton.tsx · src/components/app/AppIconButton.tsx · src/components/app/AppLinkButton.tsx
- [ ] T1458 [P] [US4] 검색 칸 · 필터(아이콘 + `이름 · 값` + 꺾쇠 · 걸리면 파란 테두리) 높이 30px in src/components/app/AppInput.tsx · src/components/app/AppSelect.tsx · src/components/app/AppDatePicker.tsx
- [ ] T1459 [US4] 표 — 줄 46px · 카드 테두리 없음 · 줄 전체가 누르는 대상 · 고른 줄 옅은 회색 in src/components/AppTable.tsx
- [ ] T1460 [US4] 페이지 번호 계산 바꾸기 — 지금 페이지를 가운데에 둔 다섯 개(앞뒤가 모자라면 반대쪽으로 채움) + 단위 테스트 in src/components/app/AppPagination.pageItems.ts · src/components/app/__tests__
- [ ] T1461 [US4] 페이지 이동 모양 — `« ‹ 번호 › »` · 1280px 미만 `‹ ›` · 왼쪽 `현재 / 전체 페이지` · 테두리 없는 30px 칸 · 지금 페이지 옅은 파랑 in src/components/app/AppPagination.tsx
- [ ] T1462 [US4] 탭(밑줄 · 건수 알약) in src/components/ui/tabs.tsx · src/components/ui/tabs.variants.ts
- [ ] T1463 [US4] 모달 틀 — 입력 폼(가로 전체 폭 버튼 유지) · 확인 창(아이콘 · 제목 · 설명 가운데 + 버튼 반반) in src/components/app/AppDialog.tsx · src/components/AppAlertDialog.tsx
- [ ] T1464 [US4] 회귀 확인 — 목록 화면 전부(순찰이력 2 · 코스 · 지점 · 근무자 · 배치관리 4탭 · 공지 · 본사 2)와 모달 대표 3종 브라우저 확인 in e2e/

## Phase 5: US5 — 빈 상태

> 독립 테스트 기준: 근무자 목록에서 처음부터 없음 / 조건에 맞는 것 없음 / 불러오지 못함이 서로 다른 아이콘 · 문구로 보이고, 목록 영역의 가운데(살짝 위)에 놓인다.

- [ ] T1465 [US5] 빈 상태 모양 — 흰 타일 아이콘 → 제목 → 설명 · 겹친 카드 그림과 순찰 경로 그림 제거(`illustration` 을 쓰는 곳 정리) in src/components/app/AppEmpty.tsx
- [ ] T1466 [US5] 불러오지 못함은 빨간 아이콘 — 지금 `TriangleAlertIcon` 을 넘기는 곳을 그대로 두고 색만 구분할 방법을 계획으로 제시 in src/components/app/AppEmpty.tsx
- [ ] T1467 [US5] 안내 화면 두 장(권한 없음 · 찾을 수 없음)이 새 모양으로 보이는지 확인 in src/pages/errors/ForbiddenPage.tsx · src/pages/errors/NotFoundPage.tsx
- [ ] T1468 [US5] 테스트 고치기 · 쓰는 곳 32곳 훑어 한 영역 안에서 타일을 쓰는 곳 목록화(084 에서 글자 한 줄로 바꿀 곳) in src/components/app/__tests__

## Phase 6: 084 가 쓸 공용 조각

> 독립 테스트 기준: 조각이 만들어져 있고 단위 테스트가 있다. 화면에는 아직 쓰지 않는다.

- [ ] T1469 [P] 상자 없는 한 줄 숫자(대시보드 26px · 그 밖 18px) 조각 in src/components/app/AppKpiCard.tsx
- [ ] T1470 [P] 차트 공용 조각(가로 격자만 · 축 선 없음 · 둥근 막대 · 카드 툴팁) — 지금 Recharts 를 쓰는 지점 상세 · 근무자 상세의 설정을 한 곳으로 모을 수 있는지 계획으로 제시 in src/components/app/
- [ ] T1471 [P] 순서 번호(옅은 파랑 바탕 + 파란 숫자 + 옅은 파란 테두리) 조각 — 지금 번호 원을 그리는 곳 조사 in src/components/app/

## Phase 7: Polish

- [ ] T1472 DoD 대조 · `npm run verify` · `npm run test` · `npm run e2e` 전체
- [ ] T1473 현장 전 화면 + 본사 3화면 1920×911 캡처를 목업과 나란히 놓고 틀 · 부품의 차이 목록화(화면 안 배치 차이는 084 · 085 몫으로 분류)
- [ ] T1474 기존 문서에 "083 에서 바뀜" 표시(뒤집히는 결정이 있는 절만 — 본문 정리는 084 마지막) in docs/design-system.md · docs/layout.md · docs/components.md
- [ ] T1475 `roadmap.md` 083 행 상태 · 진행 추적 갱신 · `## 다음 spec으로 이월` 작성 in docs/roadmap.md

---

## 다음 spec으로 이월

(작업이 끝날 때 적는다)

---

## Dependencies & Execution Order

- T1435 → T1436 → T1437. T1438~T1440 은 T1436 뒤(같은 파일 `index.css` 라 순차).
- Phase 1 → Phase 2(틀이 새 색 · 크기 토큰을 쓴다).
- T1443 → T1444 → T1445 · T1446 → T1447 · T1448 → T1449 → T1451 → T1452.
- Phase 3 · 4 · 5 는 Phase 2 뒤. 서로는 파일이 달라 순서를 바꿀 수 있지만, 🔴 **한 번에 하나씩** 한다(공용 부품이라 회귀 확인을 섞지 않는다).
- T1460 → T1461. T1457 · T1458 은 `[P]`.
- Phase 6 은 Phase 3 뒤(조각이 새 상태 표시 · 색을 쓴다). `[P]` 끼리 병렬 가능.
- T1441(주황 조사) 결과가 T1456 과 084 의 입력이다.
