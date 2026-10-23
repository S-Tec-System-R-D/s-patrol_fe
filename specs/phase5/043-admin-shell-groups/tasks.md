# 043-admin-shell-groups tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 042 가 **T734** 에서 끝났으므로 **T735** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **WF-1-0 실측 완료**(2026-10-22) — `api-spec.md` §5-1-B "관리그룹 3종" · B-49 ~ B-51. 임시 그룹·사업장은 삭제, 트리·할당 원상 확인.

---

## Phase 1: 기반 — 타입 · API · MSW · 트리 함수

> **독립 테스트 기준**: MSW 위에서 그룹 추가·이름 변경·삭제가 `AdminSiteSelect` 트리를 바꾸고(삭제는 자손·사업장까지), 같은 이름은 409. `groupTree.ts` 셈이 사업장 `children` 까지 센다.

- [x] T735 타입 in src/features/auth/types/site.ts(GroupNode·SiteNode) · src/features/groups/types/group.ts — `GroupNode` · `SiteNode`(`api-spec.md` §5-2 그대로) · `GroupAdminRow` · `AddGroupRequest` · `UpdateGroupRequest`. `features/auth/types/site.ts` 의 "Phase 5" 주석 정리
- [x] T736 `AdminSiteSelect` 조회 함수 — 로그인·트리 공용 1개(`userSiteSelect.ts` 와 같은 규칙: `_raw` 없음)
- [x] T737 [P] 그룹 API in src/features/groups/api/ — `addGroup`(POST) · `updateGroup`(PUT) · `deleteGroup`(DELETE `?groupSeq`) · `getGroupAdminList`
- [x] T738 [P] 🔴 트리 순수 함수 in src/features/groups/lib/groupTree.ts — 깊이 우선 순회 · `findGroup` · 경로(루트 제외 표기용) · 자손 그룹 목록 · **사업장 셈(자기+자손 그룹, 사업장 `children` 재귀)** · 단계 이름(`layer` 0/1/2 → 회사/본부/지사)
- [x] T739 쿼리 키 · 훅 in src/features/groups/queryKeys.ts · hooks/useGroupTree.ts · hooks/useGroupMutations.ts(변경 3종 한 파일) — 트리 쿼리 · 변경 훅 3종(성공 시 트리 무효화) · 🔴 **이름 변경 훅은 `getGroupAdminList` → `isInclude` 모음 → `updateGroup` 순서**, 조회 실패면 요청하지 않는다(B-50)
- [x] T740 🔴 **상태 보유 MSW** in src/mocks/handlers/groups.ts — `AdminSiteSelect`(실측 모양 3단계 · 사업장 `children` 포함) · Add/Update/Delete(연쇄) · 409 실측 문구 · 없는 그룹 400 · `GetGroupAdminList`(할당 상태 보유) · reset. `handlers/index.ts` 등록
- [x] T741 [P] 테스트 in src/features/groups/lib/__tests__/groupTree.test.ts · hooks/__tests__/groupMutations.test.tsx — 셈 · 경로 · 이름 변경 바디에 현재 할당 · 조회 실패 시 PUT 0건 · 삭제 연쇄

## Phase 2: US1 — 본사 레일 셸

> **독립 테스트 기준**: `/admin/locations` 에 레일(`ADMIN` 태그 · 메뉴 2개 · 이동 링크 · 프로필)이 있고 TopNav 가 없다. 본사에서 `GetAssignmentCount` 요청 0건. 옛 셸 import 0건.

- [x] T742 [US1] 메뉴 in src/components/layout/sidebar/sidebar.config.ts — `AdminMenus` 를 flat 2개(사업장 Building2 · 관리자 Shield)로. `MenuGroupType` 사용처가 없어지면 제거
- [x] T743 [US1] 🔴 **레일 공용화** in src/components/layout/sidebar/RailSidebar.tsx — 메뉴 · 상단 태그 · 하단 링크 슬롯을 받는다. 배치 대기 뱃지 훅은 현장에서만 → **`ServiceLayout` 이 세서 `badges` 로 넘긴다**(레일은 숫자만 그린다)
- [x] T744 [US1] 셸 교체 in src/components/layout/AdminLayout.tsx — `ServiceLayout` 과 같은 구조(레일 + 자연 스크롤). 하단 "현장 사이트로 이동" → `sidebar/SiteSwitchLink.tsx` 로 **동작까지 여기서**(T761 앞당김)
- [x] T745 [US1] 🔴 **옛 셸 삭제** — `Sidebar` · `SidebarGroup` · `SdebarItem` · `SidebarToggle` · `MobileSidebar` · `TopNav` · `AlarmSheet` · `menu-lookup` + `__tests__` 해당 파일 · `index.ts` export 정리(`sidebar/index.ts` · `topnav/index.ts` 도 삭제). 삭제 전 grep 재확인
- [x] T746 [US1] 라우트 in src/router/index.tsx — `/admin/admins` placeholder(`RequireRoute` Admin 3종)
- [x] T747 [US1] [P] 테스트 in src/components/layout/__tests__/AdminLayout.test.tsx · sidebar/__tests__/RailSidebar.test.tsx(`ServiceLayout` 으로 렌더) — 레일 구성 · TopNav 없음 · 배치 요약 요청 0건 · 현장 레일 뱃지 회귀

## Phase 3: US2 — 관리그룹 트리

> **독립 테스트 기준**: XL 이상에서 패널, 미만에서 경로 버튼 → 시트. 행을 누르면 `?group` 이 바뀌고 새로고침해도 남는다. 잘못된 `?group` 은 루트.

- [x] T748 [US2] 트리 in src/features/groups/components/GroupTree.tsx — 펼침(처음 전부) · 들여쓰기 18px · 선택 강조 · 우측 숫자(prop 함수) · 큰 행 변형(시트용 44px)
- [x] T749 [US2] 패널 in src/features/groups/components/GroupFilterPanel.tsx — 248px 카드 sticky · 머리(`관리그룹` + 단위 캡션 + [편집] 슬롯) · 로딩 스켈레톤 · 실패 + 다시 시도 · 🔴 sticky 는 페이지 래퍼가 건다(자기 높이 래퍼 안에서는 안 붙는다)
- [x] T750 [US2] 경로 버튼 + 시트 in src/features/groups/components/GroupFilterButton.tsx — `본부 › 지사` 경로 · `ui/sheet` 좌측 · 선택 시 닫힘 · XL 로 커지면 닫힘
- [x] T751 [US2] `?group` 훅 in src/features/groups/hooks/useGroupParam.ts — `useQueryParams` · 숫자 아님/트리에 없음 = 루트
- [x] T752 [US2] 사업장 화면 골격 in src/pages/admin/locations/LocationsPage.tsx — `/admin/locations` 에 `AppPageHeader`("사업장") + XL 패널 / 미만 버튼 + 빈 본문(`AppEmpty`). `AdminPlaceholderPage` 는 `/admin/admins` 용으로 남긴다
- [x] T753 [US2] [P] 테스트 in src/features/groups/components/__tests__/GroupTree.test.tsx — 펼침 · 선택 → `?group` · 잘못된 값 루트 · 숫자

## Phase 4: US3 — 관리그룹 편집

> **독립 테스트 기준**: [편집] → 모달 → 하위 추가·이름 변경·삭제가 MSW 트리를 바꾼다. 409 는 필드 아래. 삭제 문구에 하위·사업장 수. MANAGER 에게 [편집] 없음.

- [x] T754 [US3] 편집 모달 in src/features/groups/components/GroupEditDialog.tsx — 600px(`AppDialog` 에 `contentClassName` 추가 — 기본 폭이 384px 고정) · 행(들여쓰기 20px + 연결선 · 이름 · 단계 뱃지 · "사업장 N") · 액션 3칸(`layer < 2` 에만 [+] · 루트 잠금 + 툴팁) · [완료]. 🔴 관리자 수 없음(결정 (a))
- [x] T755 [US3] 폼 모달 in src/features/groups/form/GroupNameForm.tsx — 추가/변경 겸용 400px · zod(trim · 필수) · Enter 제출 · 🔴 409 → 전역 토스트(서버 문구) + 모달 유지 · 400 "존재하지 않습니다" → 토스트 + 재조회 + 닫기 · 처리 중 비활성
- [x] T756 [US3] 🔴 **삭제 확인** in GroupEditDialog.tsx — `AppAlertDialog` · 하위 그룹·사업장 수 문구(0이면 생략) · 성공 후 선택 중(또는 조상)이면 `?group` 제거
- [x] T757 [US3] [편집] 링크 권한 in src/features/groups/components/GroupEditTrigger.tsx — **허용 목록**(SYSTEM · MASTER)으로 건다. MANAGER 는 JWT 문자열 미실측이라 매핑 자체가 없다(테스트는 FieldManager 로 대신)
- [x] T758 [US3] [P] 테스트 in src/features/groups/components/__tests__/GroupEditDialog.test.tsx — [+] 노출 규칙 · 루트 잠금 · 추가 바디 · 409 · 삭제 문구 · MANAGER

## Phase 5: US4 — 본사 사업장 선택 · 현장 이동 — 🔴 철회(사용자 결정 2026-10-23, T776)

> T759~T763 은 구현 후 **되돌렸다**(T776). 본사 3종은 사업장 선택 없이 본사 화면으로 가고, 현장 이동 링크도 없다.

> **독립 테스트 기준**: 본사 로그인 → 선택지(중첩 사업장 포함) → 선택 → `siteSeq` 저장 → `/admin/locations`. 0개 → 바로 본사 홈. 실패 → 토큰 없음. 레일 이동 링크 → 현장 홈.

- [x] T759 [US4] 평탄화 어댑터 in src/features/auth/lib/siteOptions.ts — `GroupNode` → `SiteOption[]`(깊이 우선 · 응답 순서 · 정수 아닌 `siteSeq` 건너뜀). 현장 어댑터 옆에
- [x] T760 [US4] 🔴 **로그인 분기** in src/features/auth/components/LoginForm.tsx — `1xx` → `AdminSiteSelect` → **항상 선택 단계**(1개여도) · 🔴 **0개 = 본사 홈 직행**(토큰 유지) + `clearSite()`(이전 세션 사업장 제거) · 실패/403 = `clearTokens()`. 86행 주석 교체
- [x] T761 [US4] (T744 에서 완료) "현장 사이트로 이동" — `getSiteSeq()` 있으면 현장 홈으로, 없으면 비활성 + 툴팁 "선택한 사업장이 없습니다"
- [x] T762 [US4] `AuthGuard` 주석 갱신 — 본사 예외를 **유지하는 이유**(규칙 7)로 바꾼다. 동작 변경 없음
- [x] T763 [US4] [P] 테스트 in src/pages/auth/__tests__/LoginPage.test.tsx · AdminLoginPage.test.tsx(직행 → 선택 후 진입으로 갱신) · siteOptions 테스트 — 평탄화 · 1개도 선택 화면 · 0개 직행 · 403 토큰 없음

## 후속 (2026-10-22) — 관리그룹 UI 수정 4건 (사용자 지적)

- [x] T768 트리 머리 `관리그룹` 제목 14px 굵게(10.5px → `text-section-title`) in GroupFilterPanel.tsx(`GroupTreeHeader` — 시트도 같다)
- [x] T769 편집 버튼 → `AppIconButton` + `SquarePenIcon`(현장 `CourseInfo` 수정 버튼과 같은 것) in GroupEditTrigger.tsx
- [x] ~~T770~~ (T772 가 대체) 편집 모달 단계 구분 — 세로 가이드선 + `├─`/`└─` 연결선(2px · 24px/단계) · 단계 뱃지 색(회사 진한 파랑 · 본부 파랑 · 지사 회색) in GroupEditDialog.tsx
- [x] T771 🔴 사업장 개수 **지사 행에만 "N개"**(`branchSiteCount`) — 트리 패널 · 편집 모달. 삭제 확인 문구는 실제로 함께 지워지는 전부(`countSites`) 유지. 테스트 갱신(삭제 테스트의 `?group` 정리 대기 경합 수정 포함)

- [x] T772 🔴 **편집 모달 재구성**(재수정 — 참고 `관리그룹-편집모달1·2.png`) in GroupEditDialog.tsx — 회사 머리 줄(`+ 본부 추가`) · **본부 카드**(진한 3px 포인트바) · 지사 회색 영역(연한 2px 포인트바, "사업장 N개") · `+ 지사 추가` · 지사 없음 문구. T770 의 가이드선·뱃지 색 폐기
- [x] T773 목록 트리 단계 구분 in GroupTree.tsx — 펼친 부모 아래 세로 가이드선 + 글자 굵기(회사 bold · 본부 semibold · 지사 normal)
- [x] T774 단계 기호 통일(3차 수정) in GroupTree.tsx · GroupEditDialog.tsx — 본부 아이콘(`BuildingIcon`, 트리·모달 카드 머리 — 포인트바 대체) · 지사 네모 닷(트리 화살표 자리 · 모달 지사 행, 행 사이 gap) · 트리 가이드선 폐기(화살표만)
- [x] T775 4차 수정 — 트리 지사 행 왼쪽 여백 55px in GroupTree.tsx · 모달 지사 영역 배경색 제거(회색 영역·흰 행·빈 문구 박스) in GroupEditDialog.tsx
- [x] T776 🔴 **US4 철회**(사용자 결정 2026-10-23 — "사업장 선택은 현장관리자만, 본사 3종은 본사 화면으로. 현장 사이트로 이동은 없다") — LoginForm · AuthGuard · siteOptions(+테스트) · LoginPage/AdminLoginPage 테스트를 HEAD 로 되돌림(주석만 결정 반영) · `SiteSwitchLink.tsx` 삭제 · AdminLayout 하단 링크 제거 · RailSidebar `footer` prop 제거(알림 예약 자리 복귀) · AdminLayout/RailSidebar 테스트에서 링크 케이스 제거
- [x] T777 삭제 확인창 제목을 단계별로 — `{단계}그룹 삭제`(본부그룹 삭제 · 지사그룹 삭제, 사용자 지시 2026-10-23) in GroupEditDialog.tsx

## Phase 6: 검증 · 문서

- [x] T764 `npm run verify` + `npm run test` 병렬 green
- [x] T765 브라우저 확인(사용자 확인 2026-10-23) — mock(1280 이상·미만) + dev:real(본사 로그인 → 트리 → `테스트그룹` 아래 임시 그룹 추가·이름 변경·삭제 → 끝에 트리 원상 확인)
- [x] T766 [P] 문서 — `layout.md`(§0-2 · §1 · §2-B · §3-B · §4-4 → 레일 셸) · `screens.md` §2(진행도 · 그룹 편집 = 모달 하나) · `flow.md` §2-2(트리 노드 메뉴 → 편집 모달) · `data-model.md` §3-2 · §4-2 · §5-2 그룹 부분 서버 기준 · `components.md`(그룹 트리) · `roadmap.md` §9-0 · §12
- [x] T767 DoD 점검(17/17 + 철회 2) + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- T735 → T736 · T737 · T738 → T739 → T740 → T741
- Phase 2(셸)는 Phase 1 과 **독립** — T742 → T743 → T744 → T745 · T746 → T747
- Phase 3 은 T739 · T744 선행 — T751 → T748 → T749 · T750 → T752 → T753
- Phase 4 는 Phase 3 선행 — T755 · T757 → T754 → T756 → T758
- Phase 5 는 T736 · T744 선행(Phase 3·4 와 독립) — T759 → T760 → T761 · T762 → T763
- Phase 6 은 전부 완료 후
