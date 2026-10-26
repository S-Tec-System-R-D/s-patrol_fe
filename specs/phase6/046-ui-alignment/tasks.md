# 046-ui-alignment tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 본사 · 현장 화면 UI 어긋남 정리.
> 입력: 사용자와의 항목별 결정(2026-10-26) — 아래 결정 표가 SSOT.
> 태스크 ID 는 999 다음부터(T876~). `[P]` = 병렬 가능. `#n` = 결정 표 번호.
> 🔴 API · 데이터 흐름 · 상태 · 라우트 · 권한은 바꾸지 않는다 — 겉모습 · 문구 · 접근성 속성만.

---

## 결정 표 (사용자 결정 2026-10-26)

| # | 요소 | 결정 |
|---|---|---|
| 1 | [추가] 버튼 색 | **`primary`**(기본 버튼)로 통일 — 페이지네이션 활성과 같은 색. xl 미만 아이콘만은 유지 · 관리자 추가에도 적용. 🔴 레일 활성의 파란 막대(`point`)는 **남긴다** — `point` 는 강조 · 포커스 역할 |
| 1-1 | [비밀번호 변경] 버튼 | point 연한 톤 → **`sub`**(수정 버튼과 같은 테두리) |
| 2 | 목록 꺾쇠(›) | **상세 페이지로 가는 목록만** 붙인다 — 사업장 · 지점 · 코스에 추가. 모달로 여는 관리자 · 배치 목록은 없음 |
| 3 | 상세 머리 | 본사도 **브레드크럼**(`사업장 › 사업장 상세`) — 그룹 경로는 이름 위 보조 줄로 유지. 🔄 044 결정(뒤로 버튼) 변경 |
| 4 | 상세 로딩 · 실패 | 브레드크럼 유지 + 본문만 교체(현장과 같게) |
| 5 | 상세 로딩 뼈대 높이 | 그대로 — 실제 카드 높이에 맞춘 값 |
| 6 | 모달 설명 어미 | **"~합니다."** 로 통일(현장 "~할 수 있습니다." 6곳). 🔄 999 "톤 고치지 않음" 범위 변경 |
| 7 | 수정 버튼 · 모달 이름 | 버튼 **`수정`** · 제목 **`{대상} 수정`**(사업장 정보 수정 → 사업장 수정) |
| 8 | 폼 모달 폭 | **`sm:max-w-[520px]`** 기본 — 특수 모달(관리그룹 편집 등)만 예외 |
| 9 | 빈 상태 제목 마침표 | **없음**으로 통일(제목 = 머리글, 설명 = 문장). 🔄 999 "톤 고치지 않음" 범위 변경 |
| 10 | 필터 초기화 | 관리자 목록에 ↺ 버튼 + 0건 시 [필터 초기화](현장과 같게) |
| 11 | 필터 묶음 이름 | 관리자 목록에 `role="group" aria-label="목록 필터"` |
| 12 | 검색창 폭 | **`260px`** |
| 13 | 목록 로딩 뼈대 이름 | 현장 목록 뼈대에도 `aria-label="… 불러오는 중"` |
| 14 | 부제 | "범위 + 수" — 관리자 = **"○○ 담당 관리자 N명"** |
| 15 | 본문 `min-w-0` | `ServiceLayout` 에도 추가(현장 전 화면 회귀 확인) |
| 16 | 삭제 · 해제 확인 제목 | **질문형 "~하시겠습니까?"** 로 통일 — 본사 3곳(사업장 삭제 · {단계}그룹 삭제 · 담당 그룹 해제). 영향 설명은 유지. 🔄 999 · `design-system.md` §4-2 명사형 예외 **폐지** |
| 17 | 페이지 나눔 | 그대로(본사는 "총 N개/명") |
| 18 | xl 미만 카드 목록 | 본사도 **카드** — 사업장 카드는 **하위 사업장 들여쓰기**(A안) · 관리자 카드는 이름 · 권한 · 담당 그룹 |
| 19 | 관리자 상세 | 그대로(모달) |
| 20 | 관리그룹 패널 | 그대로 |
| 21 | 레일 `ADMIN` 태그 · 배치 뱃지 | 그대로 |

---

## Phase 1: 버튼 색 (#1 · #1-1)

- [x] T876 [P] [추가] 버튼 5곳 `point-bg` → 기본(`primary`) in src/pages/admin/locations/LocationsPage.tsx · src/pages/service/users/UsersPage.tsx · src/pages/service/notice/NoticeListPage.tsx · src/features/courses/components/CourseTopNav.tsx · src/features/points/components/PointTopNav.tsx — `h-9 px-3 xl:px-4` · 아이콘만(xl 미만)은 유지
- [x] T877 [P] [관리자 추가] 를 같은 모양으로 in src/pages/admin/admins/AdminsPage.tsx — `aria-label` + xl 미만 아이콘만
- [x] T878 [P] [비밀번호 변경] → `variant="sub"` + `bg-card` in src/pages/service/users/UserDetailPage.tsx — 주석(사용자 요청 2026-10-21 "추가 버튼과 같은 톤") 정정

## Phase 2: 목록 (#2 · #10 · #11 · #12 · #13 · #14)

- [x] T879 [P] 꺾쇠 열 추가 in src/features/sites/components/SiteColumns.tsx · src/features/points/components/PointColumn.tsx · src/features/courses/components/CourseColumn.tsx — `WorkerColumns` 의 `open` 열 그대로
- [x] T880 관리자 목록 필터 줄 in src/pages/admin/admins/AdminsPage.tsx — 검색창 `260px`(#12) · 필터 `role="group"`(#11) · ↺ 초기화 버튼 + 0건 [필터 초기화](#10) · 부제 "○○ 담당 관리자 N명"(#14, 조회 중에는 그룹 이름만 — `UsersPage` 승계)
- [x] T881 [P] 현장 목록 로딩 뼈대 `aria-label` in src/pages/service/{points,zones,users,notice,patrol/zones,patrol/points}/*Page.tsx(목록 6곳) — `"{대상} 불러오는 중"`

## Phase 3: 상세 (#3 · #4 · #7)

- [x] T882 사업장 상세 브레드크럼 in src/pages/admin/locations/LocationDetailPage.tsx — 뒤로 버튼 → `Breadcrumb`(`사업장 › 사업장 상세`, 목록 링크는 `?group` 유지) · 그룹 경로는 이름 위 보조 줄 · 로딩 · 실패 화면에도 브레드크럼(#4) · 실패 화면 `BackToList` 유지
- [x] T883 [P] 수정 버튼 · 제목 in src/pages/admin/locations/LocationDetailPage.tsx — `정보 수정` → `수정` · `사업장 정보 수정` → `사업장 수정`(#7). 🔴 헬스체크 카드에도 [수정] 이 있어 `aria-label="사업장 수정"` 으로 구분(보이는 글자 포함). ⚠️ T882 와 같은 파일 — 한 번에 저장

## Phase 4: 모달 · 문구 (#6 · #8 · #9 · #16)

- [x] T884 [P] 설명 "~할 수 있습니다." → "~합니다." in src/pages/service/{notice/NoticeDetailPage,points/PointDetailPage,users/UserDetailPage,users/UsersPage,zones/ZoneDetailPage}.tsx · src/features/points/components/PointTopNav.tsx
- [x] T885 [P] 폼 모달 폭 `sm:max-w-[520px]` in 현장 폼 모달(UsersPage · UserDetailPage 2개 · NoticeListPage · NoticeDetailPage · PointTopNav · PointDetailPage · CourseTopNav · ZoneDetailPage) — 🔴 폼이 아닌 모달(`AddCoursePointDialog` · `AuthMethodChangeDialog`)은 손대지 않는다. 지금보다 좁아지는 모달이 있으면 브라우저에서 확인
- [x] T886 [P] 빈 상태 제목 마침표 제거 in `AppEmpty`/빈 상태 `title` 이 `.` 로 끝나는 곳(12곳 — `grep 'title="[^"]*없습니다\."'`) — AdminsPage · LocationsPage · PatrolPointsPage · PatrolZonesPage · PointsPage · ZonesPage · GroupPicker · PointHistoryMemoCard · CheckDetailTable · SiteManagersCard. 설명은 그대로
- [x] T887 [P] 확인 제목 질문형 in src/features/sites/components/SiteDeleteDialog.tsx(`'{이름}' 사업장을 삭제하시겠습니까?`) · src/features/groups/components/GroupEditDialog.tsx(`{단계}그룹을 삭제하시겠습니까?`) · src/features/admins/components/AdminDetailDialog.tsx(`담당 그룹을 해제하시겠습니까?`) — 영향 설명 유지 · 설명 첫 문장이 제목과 겹치면 줄인다
- [x] T888 테스트 문구 단언 동기화 — T884 ~ T887 로 바뀐 문구를 단언하는 테스트(`grep` 으로 찾는다)

## Phase 5: 카드 목록 (#18)

- [x] T889 [P] `SiteCard` 신설 in src/features/sites/components/SiteCard.tsx — `WorkerCard` 모양 · 이름 · 소속 그룹 · 주소 · 🔴 하위 사업장은 `depth` 만큼 들여쓰기 + `└`(A안) → `LocationsPage` 에 `renderCard`
- [x] T890 [P] `AdminCard` 신설 in src/features/admins/components/AdminCard.tsx — 이름 · 권한 뱃지 · 담당 그룹 요약 → `AdminsPage` 에 `renderCard`(클릭 = 상세 모달)
- [x] T891 [P] 카드 테스트 in 각 `__tests__` — 렌더 · 들여쓰기(사업장) · 클릭 동작

## Phase 6: 레이아웃 (#15)

- [x] T892 `min-w-0` 추가 in src/components/layout/ServiceLayout.tsx

## Phase 7: 검증 · 문서

- [x] T893 `npm run verify` + `npm run test` 병렬 green
- [x] T894 브라우저 확인 — 본사 2화면 + 사업장 상세 · 현장 목록 6 · 상세 4 · 모달 · xl 미만 카드(본사 2) · 🔴 **#15 회귀**: 현장 전 화면 넓은 표 · 지도 · 드래그 정렬이 레일 옆에서 깨지지 않는지
- [x] T895 [P] 문서 — `design-system.md` §4-2(명사형 예외 폐지 · 질문형 통일) · §4-3(제목 마침표 없음) · 버튼 색 규칙(추가 = `primary`, `point` = 강조 · 포커스) · `layout.md` §5-1(본사 상세 브레드크럼 — 실제와 맞춤) · `patterns.md`(꺾쇠 = 상세 페이지 이동만) · `999-finalize/tone-check.md`(B~E 중 이번에 고친 것 표기) · `roadmap.md` §12(046 행)
