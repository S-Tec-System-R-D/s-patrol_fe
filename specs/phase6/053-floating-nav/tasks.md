# 053-floating-nav tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). `xl` 미만에서 68px 레일을 하단 floating nav 로 바꾸고, 좁은 폭의 가로 넘침을 없앤다.
> 입력: 사용자 결정(2026-10-27 — "레일 길이가 치명적" · 모달 넣고 레일도 같이 · 여백 축소 포함).
> 태스크 ID 는 052 다음부터(T945~).
> 🔴 API · 데이터 흐름 · 라우트 · 권한은 바꾸지 않는다 — 셸 모양 · 툴바 배치 · 여백만.

---

## 진단 (2026-10-27 · 390×844 캡쳐)

| 화면 | 문서 가로 폭 | 넘친 요소 |
|---|---|---|
| 근무자 | 612px | 필터 줄(검색 260px 고정 + `flex` 줄바꿈 없음) |
| 코스 / 지점 | 625 / 646px | 필터 줄 |
| 공지사항 | 518px | 필터 줄 |
| 배치관리 | 768px | 테이블 906px · 탭 라벨 글자 단위 줄바꿈 |

- 콘텐츠 폭 = 390 − 레일 68 − 여백 64 = **258px**.
- 🔴 **"레일이 짧고 스크롤이 안 된다" 의 원인은 가로 넘침**이다 — 문서가 화면보다 넓으면 모바일 브라우저가 페이지 전체를 **축소**해 목록이 한 화면에 다 들어오고, `h-screen` 레일은 위쪽에 짧게 남는다. floating nav 만으로는 고쳐지지 않아 넘침 수정을 같은 작업에 넣었다.

## 결정 표 (사용자 결정 2026-10-27)

| # | 요소 | 결정 |
|---|---|---|
| 1 | 기준 폭 | `xl`(1280px) 미만 = floating nav · 이상 = 레일 그대로 |
| 2 | 형태 | **하단 가운데 pill 바** — 메뉴 아이콘 · 대기 뱃지 · 구분선 · 로그아웃. 우하단 FAB 펼침은 이동이 두 번 탭이라 제외 |
| 3 | 적용 범위 | 현장 · 본사 둘 다(`RailSidebar` 공용) |
| 4 | 하단 여백 | 콘텐츠 영역 `pb-24 xl:pb-0` — 마지막 행 · 페이지네이션이 가려지지 않게 |
| 5 | 프로필 | **제거 → 로그아웃 버튼 + 확인 모달**. 드롭다운의 실제 기능이 로그아웃 하나뿐이었다(내 정보 = 비활성 자리표시). 하단 바는 엄지가 닿는 자리라 한 번 탭 로그아웃은 위험 → 확인 모달. 이름은 툴팁 · 모달 문구로 |
| 6 | 레일도 같이 | 레일 하단 프로필도 같은 로그아웃 버튼 — 폭에 따라 동작이 달라지지 않게 |
| 7 | 가로 넘침 | 필터 줄 9곳 · 페이지네이션 · 배치 탭 · 카드 없는 테이블을 같은 작업에서 고친다 |
| 8 | 페이지 여백 | `p-8` → `p-4 xl:p-8` — 390px 에서 콘텐츠 258 → **358px** |
| 9 | 원칙 개정 | `layout.md` §5-7 "좁은 폭에서도 레일 유지" 뒤집힘 · `design-system.md` §2-5 "덜어내기만" 에 내비게이션 예외 |

---

## Phase 1: floating nav · 로그아웃

- [x] T945 [US1] 로그아웃 버튼 in src/components/layout/sidebar/LogoutButton.tsx — 44px 아이콘 버튼 + 확인 모달(`AppAlertDialog`). 툴팁 방향은 prop(레일 `right` · floating `top`)
- [x] T946 [US1] 레일 in src/components/layout/sidebar/RailSidebar.tsx — `hidden xl:flex` · nav `aria-label="메뉴"` · `ProfileBadge` → `LogoutButton`
- [x] T947 [US1] floating nav in src/components/layout/sidebar/FloatingNav.tsx — `xl:hidden` · `fixed bottom-4` 가운데 · `z-40`(모달 · 시트 `z-50` 아래) · 활성 = 배경 + 아이콘 아래 점 · 뱃지 레일과 같음
- [x] T948 [US1] 셸 in src/components/layout/ServiceLayout.tsx · AdminLayout.tsx — `FloatingNav` 추가 · 콘텐츠 `pb-24 xl:pb-0`
- [x] T949 [US1] `ProfileBadge` 삭제 in src/components/layout/topnav/ — 사용처가 레일 하나뿐
- [x] T950 [US1] 테스트 in src/components/layout/**/__tests__/ — 레일 · 본사 셸은 `메뉴` 영역 안에서 찾기(jsdom 은 미디어쿼리가 없어 둘 다 렌더된다) · `FloatingNav` · `LogoutButton`(확인 → 로그아웃 · 취소 → 유지 · 본사 → `/admin/login`)

## Phase 2: 가로 넘침 · 여백

- [x] T951 [P] [US2] 필터 줄 9곳 — `flex-wrap xl:flex-nowrap` · 검색 `w-full xl:w-[260px]`(`AppInput` 바깥이 `w-full` 이라 좁은 폭에서 한 줄을 차지한다) in UsersPage · NoticeListPage · PatrolZonesPage · PatrolPointsPage · CourseTopNav · PointTopNav · DeploymentBoard · AdminsPage · LocationsPage
- [x] T952 [P] [US2] 페이지네이션 in src/components/app/AppPagination.tsx — 줄바꿈 허용 · 문구 `whitespace-nowrap`
- [x] T953 [P] [US2] 배치 탭 in src/features/deployments/components/DeploymentBoard.tsx — 탭 줄 가로 스크롤(`xl` 미만) · 라벨 꺾임 방지
- [x] T954 [P] [US2] 카드 없는 테이블 in src/components/AppTable.tsx — `overflow-hidden` → `relative overflow-x-auto`(상자 안에서만 스크롤). 🔴 `relative` 없이 1차 측정에서 배치관리가 684px — 셀 안 `sr-only`(absolute)가 상자를 빠져나갔다
- [x] T955 [P] [US2] 페이지 여백 in src/pages/**/*.tsx — `p-8` → `p-4 xl:p-8`(18개 파일 · 30곳)

## Phase 3: 검증 · 문서

- [x] T956 `npm run verify` green(경고 1 = 기존 `public/mockServiceWorker.js`) · `npm run test` 129 파일 · 1460/1460
- [x] T956a 지도 겹침 in src/index.css — 캡쳐에서 Leaflet 확대/축소 버튼(z 1000)이 floating nav 위로 올라왔다 → `.leaflet-container { isolation: isolate }`(지도 카드 3곳 공통)
- [x] T957 390px · 1280px 캡쳐 — 현장 12 + 본사 3 + 근무자 상세, **16화면 × 2폭 모두 문서 가로 폭 = 화면 폭**. 1280 은 레일 · 한 줄 툴바 그대로. 로그아웃 모달이 nav 를 덮는 것 확인(임시 스크립트, 확인 후 삭제)
- [x] T958 문서 — `layout.md` §2-A · §5-7 · `design-system.md` §2-5 · `components.md` · `roadmap.md`(053 행)
- [x] T959 브라우저 확인(사용자) — 휴대폰 폭 스크롤 · floating nav 이동 · 로그아웃 모달 · 시트/모달이 nav 위로 덮이는지

## Phase 4: 좁은 폭 글자 꺾임 (사용자 요청 2026-10-27 — "white-space:nowrap 이 안 돼서 세로로 되는 요소")

> 조사: 현장 15 · 본사 3 · 근무자 상세 · 모달 6 × 390 · 768 · 1100 · 1280px, 텍스트 노드 단위로 "짧은 글자가 2줄 이상" 을 잡았다. 1100 이상은 0건.

| # | 화면 | 위치 | 증상 | 폭 |
|---|---|---|---|---|
| 1 | 순찰이력 › 코스 순찰 상세 | 지점 인증 내역 표 | 머리 `순찰지점` 4줄 · `인증수단`/`인증시각`/`기록` 2줄 · 지점명 4줄 | 390 |
| 2 | 코스 상세 | 최근 순찰 기록 표 | 머리 `근무자`/`인증`/`기준 초과` · 근무자명 2줄 | 390 |
| 3 | 배치관리 4탭 | 요청 · 복귀 · 전입 · 전출 표 | 근무자명 3줄(이름 칸 11px) · 요청일 2줄 · 승인/거부 버튼이 요청일을 덮음 | 390 · 768 |
| 4 | 목록 카드 6종 | 메타 줄 | 줄바꿈 시 구분선 `│` 이 줄 끝에 홀로 남음 | 390 |
| 5 | 상세 머리(`AppPageHeader`) | 제목 | 뱃지 · 액션에 밀려 `A동 순찰코스` 가 한 글자씩 6줄(320) · `순찰코/스`(390) | 320 · 390 |

- [x] T960 [P] [US3] 지점 인증 내역 표 in src/features/patrol-zones/components/detail/CheckDetailTable.tsx — 머리 줄 · 지점명 칸 `whitespace-nowrap`
- [x] T961 [P] [US3] 최근 순찰 기록 표 in src/features/courses/components/detail/CoursePatrolLog.tsx — 머리 줄 · 근무자 · 인증 칸 `whitespace-nowrap`
- [x] T962 [P] [US3] 배치 표 3종 in src/features/deployments/components/{DeploymentRequest,ReturnRequest,DeploymentHistory}Columns.tsx — 근무자 칸 묶음 · 요청일 · 처리 열(`w-px whitespace-nowrap`)
- [x] T963 [P] [US3] 카드 메타 줄 in src/index.css(`card-meta`) + 카드 6종(Worker · Course · Notice · PointHistory · ZoneHistory · Site) — 구분선 `<span>` 12개 제거 → `::before` + 줄 첫 항목 구분선 잘라냄
- [x] T964 [P] [US3] 상세 머리 in src/components/app/AppPageHeader.tsx — 제목 줄 `flex-wrap` · 제목 `break-keep` · 왼쪽 묶음 `min-w-0`
- [x] T965 재측정 — 320 · 390 · 768 · 1100px × 해당 12화면: 세로 글자 0건 · 줄 시작 구분선 0건 · 문서 가로 폭 = 화면 폭. 남은 1건 `태그 ID 등록 / 필요`(320, 띄어쓰기에서 자연 꺾임)는 그대로 둔다
- [x] T966 문서 — `patterns.md` §14 "좁은 폭 글자 꺾임" · `components.md` §9-1 · `design-system.md` §2-5
- [x] T967 `npm run verify` green(경고 1 = 기존 `mockServiceWorker.js`) · `npm run test` 1460/1460
- [x] T968 브라우저 확인(사용자) — 글자 꺾임 · 카드 구분선 · 상세 제목

## Phase 5: 순찰 인증 기록 차트 x축 (사용자 요청 2026-10-27 — "x축 날짜가 너무 타이트해서 이어진 숫자 같다")

> 원인: 14일을 전부 `MM.dd`(약 30px)로 찍는데 칸당 폭은 320px 에서 약 15px · 390px 에서 약 21px. 방법 A(일만 + 월 표시) 선택 — 하루 걸러 찍기는 "모든 날짜 라벨링"(2026-10-10) 결정과 충돌, 기울이기 · 가로 스크롤은 제외.

- [x] T969 [US4] x축 눈금 in src/features/points/components/detail/PatrolBarChart.tsx — 첫 줄 `dd` · 첫 칸 · 월이 바뀌는 칸만 둘째 줄 `M월`(커스텀 `DateTick`). 월을 같은 줄에 붙인 `10.07` 은 320px 에서 옆 칸과 붙어(`10.0708`) 둘째 줄로 내림 · 축 높이 42 · 차트 140 → 152px. 지점 상세 · 순찰이력 지점 상세 공용
- [x] T970 확인 — 320 · 390 · 1280px × 2화면 캡쳐(임시 스크립트, 확인 후 삭제) · `patterns.md` 집계 기간 항목 · verify · test · 브라우저 확인(사용자)

## Dependencies & Execution Order

- T945 → T946 · T947 → T948 → T949 → T950
- Phase 2 는 Phase 1 과 독립 · [P] 끼리 병렬 가능
- T956 ~ T958 은 Phase 1 · 2 이후
- Phase 4(T960 ~ T964)는 서로 독립 · [P] 병렬 → T965 → T966 → T967
