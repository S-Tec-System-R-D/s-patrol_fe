# 045-admin-managers tasks

> 입력: 같은 폴더 `spec.md`. 위험도 **A** — 할당(교체 PUT)은 읽기 · 제출 · 실패를 나눠 잘게.
> 태스크 ID 는 044 다음부터(T815~). `[P]` = 병렬 가능 · `[US?]` = spec User Story.
> 실제로 동작하는 쓰기는 **담당 그룹 할당(US4) 하나**다. US3 은 막힌 버튼뿐이라 폼 · 모달 태스크가 없다(spec §2-4).
>
> 🔄 **구현 중 결정 · 변경(2026-10-23, 사용자 "바로 진행" — plan-first 생략)**
> ① 권한 뱃지 = 시스템관리자 · 마스터 `point` / 매니저 `muted`(근무자 화면 `roleBadgeVariant` 와 같은 판단) ② 권한 필터는 세그먼트 대신 **`AppSelect`**(근무자 목록과 같은 컴포넌트)
> ③ MSW 는 Manager 403 을 **흉내 내지 않는다**(`users.ts` 의 현장관리자 403 과 같은 판단 — 화면이 조작 UI 를 숨긴다) ④ dev Manager 계정 = **`777777`**(userSeq 6) · Master `111111` 에 userSeq 3 부여(본인 판정용)
> ⑤ 🔴 **계획 외 발견**: `claims.ts` 에 **`Manager` 매핑이 없어** Manager 계정은 로그인해도 가드가 막았다(022 의 Master 와 같은 결함) → 실측값으로 추가 · 관련 테스트 3곳의 "Manager 미매핑" 예시를 `Worker` 로 교체
> ⑥ `UserDetail.siteName` 을 `string | null` 로(관리자는 `null` — 실측, B4 응답 전량) · `EditWorkerForm` 1곳 `?? ''`
> ⑦ 테스트 파일: T825 · T828 · T830 · T835(화면 쪽)는 **`AdminsPage.test.tsx` 하나**에(모달이 페이지에 붙어 있어 같은 렌더로 본다) · 훅 실패 경로는 `hooks/__tests__/adminGroupMutations.test.tsx`
> ⑧ 막힌 버튼은 `components/LockedAccountButton.tsx` 로 한 번 정의(페이지 · 모달 두 곳) · `groupKeys.adminsAll` 추가(할당 전체 무효화)
> ⑨ 시스템관리자 본인 해제는 **확인하지 않는다** — 범위가 할당으로 정해지는 것은 Master 뿐(실측)

---

## Phase 1: 기반 — 순수 함수 · 조회 묶음 · 변경 훅 · MSW

> **독립 테스트 기준**: `lib` 단위 테스트 green · MSW 로 그룹별 `GetGroupAdminList` 가 할당을 반영하고, 관리자 `UserDetail` 이 `siteSeq: 0` 으로 온다.

- [x] T815 [P] 🔴 목록 순수 함수 in src/features/admins/lib/adminList.ts — 그룹별 응답 → **관리자 행**(루트 응답 행, 응답 순서) + **담당 그룹 맵**(`userSeq → groupSeq[]`, 트리 순서) · 범위(선택 그룹 최상위 = 전원 · 그 외 = 선택 + 자손 그룹 할당) · 트리 수(그룹 + 자손 할당, 중복 제거) · 이름 검색 · 권한 필터(`master`/`manager`, 잘못된 값 = 전체) · 담당 그룹 표기(첫 경로 + `외 N개` / `—`). 경로 · 자손은 043 `groupTree` 재사용
- [x] T816 [P] 권한 표시 in src/features/admins/lib/adminRole.ts — `codeSeq` 2·3·4 → 라벨(시스템관리자 / 마스터 / 매니저) · 뱃지 톤(목업 `ROLE_TONE` → `AppBadge` variant, plan-first 에서 매핑 확정) · `isSystemAdmin`
- [x] T817 조회 묶음 훅 in src/features/admins/hooks/useAdminAssignments.ts — 트리(`useGroupTree`)의 그룹마다 `useQueries`(키 `groupKeys.admins(g)` — 043 · 044 와 캐시 공유) · 🔴 **전부 성공해야 데이터**, 하나라도 로딩이면 로딩 · 실패면 실패 + 실패분만 `refetch`
- [x] T818 🔴 할당 변경 훅 in src/features/admins/hooks/useAdminGroupMutations.ts — 추가: 고른 그룹 **차례로** `getGroupAdminList(g)` → `updateGroup({ groupSeq, parentGroupSeq, groupName, userSeq: 현재 ∪ 대상 })` · 읽기 실패 시 그 PUT 안 보냄 · 첫 실패에서 중단 / 해제: 현재 − 대상 · 🔴 최상위 그룹이면 호출부 버그로 throw(043 `useRenameGroup` 과 같다) · 성공 · 실패 모두 `group-admins` 전체 + `groupKeys.tree` 무효화 · 성공 토스트 2종 · 실패 토스트는 전역
- [x] T819 MSW in src/mocks/handlers/users.ts · groups.ts — 관리자 `UserDetail`(043 `ADMINS` 를 **한 출처로** — 사번 · 연락처 · `siteSeq: 0` · `siteName: null`) · `UpdateGroup` 할당 교체는 043 그대로(이미 상태 보유). Manager 403 래퍼 재현 여부는 plan-first(MSW 가 토큰 role 을 읽을 수 있는지에 달렸다)
- [x] T820 [P] dev 로그인 Manager 계정 in src/mocks/handlers/auth.ts — `code 103` · `jwtRole 'Manager'`(실측 2026-10-23) · 사번은 plan-first(기존 mock 사번과 겹치지 않게). 주석의 "Manager 미실측" 교정
- [x] T821 [P] 테스트 in src/features/admins/lib/__tests__/adminList.test.ts · adminRole.test.ts — 행 · 맵 · 범위(최상위 전원 · 자손 포함) · 트리 수 중복 제거 · 검색 · 권한 필터 · `외 N개` · 권한 라벨

## Phase 2: US1 — 관리자 목록

> **독립 테스트 기준**: MSW 로 `/admin/admins?group=3` → 그 그룹 + 자손 할당 관리자 · `?q=` · `?role=manager` · 그룹별 조회 하나 실패 시 실패 표시.

- [x] T822 [US1] 목록 열 in src/features/admins/components/AdminColumns.tsx — 열 3개(이름 · 권한 뱃지 · 담당 그룹) · 표는 기존 `AppTable` · 행 클릭
- [x] T823 [US1] 페이지 in src/pages/admin/admins/AdminsPage.tsx — `AppPageHeader`(부제 · [관리자 추가] 는 T829) · 043 패널/버튼(`unitLabel="관리자"` · `count` = T815) · 필터 줄(검색 `?q=` 300ms 디바운스 · 권한 세그먼트 `?role=`) · "총 N명" · 빈 상태 2종(범위 0 우선) · 🔴 로딩 = 스켈레톤(전부 끝날 때까지) · 실패 + [다시 시도]
- [x] T824 [US1] 라우트 in src/router/index.tsx — `paths.admin.admins` → `AdminsPage` · `AdminPlaceholderPage` 사용처 0 이면 src/pages/admin/AdminPlaceholderPage.tsx 삭제
- [x] T825 [US1] [P] 테스트 in src/pages/admin/admins/__tests__/AdminsPage.test.tsx — 범위 · 트리 수 · 검색 · 권한 필터 · 잘못된 `role` · 없는 열(연락처 · 상태 · 소속 그룹) · 빈 상태 우선순위 · 부분 로딩 중 표 없음 · 실패 표시

## Phase 3: US2 — 상세 모달

> **독립 테스트 기준**: MSW 로 행 클릭 → 이름 · 권한 · 사번 · 연락처 · 담당 그룹 · 시스템관리자는 [닫기] + 잠금 안내.

- [x] T826 [US2] 상세 모달 in src/features/admins/components/AdminDetailDialog.tsx — `AppDialog` 680px · 머리(이름 + 권한) · 좌 기본 정보(038 `useUserDetail` · `userFormat` 연락처 · 스켈레톤 · 이 칸만 실패 + [다시 시도]) · 우 담당 그룹 목록(경로 · 빈 상태) · 하단 2종(시스템관리자 = [닫기] + 잠금 안내 / 그 외 = T829 버튼)
- [x] T827 [US2] 열기 · 닫기 in src/pages/admin/admins/AdminsPage.tsx — 선택 `userSeq` 로컬 상태 · 🔴 재조회 후 그 관리자가 행에서 사라지면 닫는다
- [x] T828 [US2] [P] 테스트 in src/features/admins/components/__tests__/AdminDetailDialog.test.tsx — 기본 정보 · 연락처 형식 · 상세 실패 시 담당 그룹 칸은 유지 · 시스템관리자 잠금 · [활성화] 없음

## Phase 4: US3 — 계정 관리 자리

> **독립 테스트 기준**: [관리자 추가] · [수정] · [비밀번호] · [삭제] disabled + 툴팁 · 눌러도 `AddUser`·`UpdateUser`·`RemoveUser` 요청 0건.

- [x] T829 [US3] 막힌 버튼 in src/pages/admin/admins/AdminsPage.tsx · src/features/admins/components/AdminDetailDialog.tsx — disabled + 툴팁 "관리자 계정 관리는 아직 지원되지 않습니다"(044 `SiteManagersCard` 의 `Tooltip` 패턴) · 폼 · 모달 없음 · 생성 권한 규칙은 코드에 넣지 않고 spec §2-4 에만 둔다
- [x] T830 [US3] [P] 테스트 in src/pages/admin/admins/__tests__/AdminsPage.test.tsx — 4개 disabled · 툴팁 · MSW 요청 검사(User 변경계 0건)

## Phase 5: US4 — 담당 그룹 추가 · 해제

> **독립 테스트 기준**: MSW 로 그룹 2개 추가 → 그룹마다 `GetGroupAdminList` → `UpdateGroup` 순서 · 바디 = 현재 ∪ 대상 · 해제 바디 = 현재 − 대상 · 최상위 행 [해제] 없음 · MANAGER 에게 조작 UI 없음.

- [x] T831 [US4] 그룹 선택 모달 in src/features/admins/components/AssignGroupDialog.tsx — `AppDialog` 520px · 트리 그룹을 `layer` 들여쓰기로 · `AppCheckbox` 다중 · 🔴 최상위 · 이미 할당 그룹 제외 · 선택지 0 빈 상태 · [추가 (N)] · 처리 중 비활성 · 실패 시 모달 유지
- [x] T832 [US4] 추가 연결 in src/features/admins/components/AdminDetailDialog.tsx — [+ 그룹 추가] → T831 → T818 추가 · 전부 성공 시 닫기
- [x] T833 [US4] 🔴 해제 in src/features/admins/components/AdminDetailDialog.tsx — 행 [해제] → T818 해제 · 🔴 최상위 그룹 행엔 [해제] 없음 · 처리 중 그 행 비활성 · **Master 자기 자신**이면 `AppAlertDialog` 확인 후 진행(본인 판정은 `useMe().userSeq`)
- [x] T834 [US4] 권한 분기 in src/features/admins/components/AdminDetailDialog.tsx — `MANAGER` 에게 [+ 그룹 추가] · [해제] 를 그리지 않는다(`useMe().role`)
- [x] T835 [US4] [P] 테스트 in src/features/admins/hooks/__tests__/useAdminGroupMutations.test.tsx(요청 순서 · 바디 · 읽기 실패 PUT 0건 · 첫 실패 중단) + src/features/admins/components/__tests__/AdminDetailDialog.test.tsx(선택지 제외 · 최상위 [해제] 없음 · MANAGER 숨김 · 자기 해제 확인창 · 성공 후 목록 반영)

## Phase 6: 검증 · 문서 · Phase 5 종료

- [x] T836 `npm run verify` + `npm run test` 병렬 green
- [x] T837 브라우저 확인 — mock(1280 이상 · 미만, 시스템관리자 · Master · Manager dev 계정) + 🔴 dev:real(본사 계정 · `테스트그룹` 아래 임시 지사 → 기존 관리자 1명 추가 → 목록 · 트리 수 반영 → 해제 → 임시 지사 삭제 · 기존 할당 G2 · G4 · G6 원상 확인)
- [x] T838 [P] 문서 — `screens.md` §2-1(진행도 · 할당 = 그룹 단위 · 추가 막힘) · `flow.md` §2 · `data-model.md`(관리자 부분 서버 기준) · `components.md`(신설 공용이 있으면) · `roadmap.md` §9-0(판정 표 · 045 행) · **Phase 5 종료**
- [x] T839 DoD 점검 + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- **Phase 1 → 나머지 전부.** T815 · T816 · T820(병렬) → T817 → T818. T819 는 T817 테스트 전에. T821 은 T815 · T816 뒤.
- Phase 2(US1): T822 → T823 → T824 → T825.
- Phase 3(US2): T823 뒤. T826 → T827 → T828.
- Phase 4(US3): T823 · T826 뒤(버튼이 두 곳에 있다). T829 → T830.
- Phase 5(US4): T818 · T826 뒤. T831 → T832 · T833 · T834(같은 파일이라 순차) → T835.
- `[P]` 테스트는 각 Phase 구현 뒤. Phase 6 은 전부 뒤.
