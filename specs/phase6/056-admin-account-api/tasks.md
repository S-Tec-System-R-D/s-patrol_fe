# 056-admin-account-api tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID 는 055 다음부터(T991~).
> 결정(사용자 2026-10-27): 056 관리자 / 057 사업장 상세로 분리 · 할당은 `UpdateAdmin` · 사업장 목록 담당 관리자 열은 057 에서 뺀다 ·
> 마스터는 "전체" 표시만 · 그룹 범위는 회사 = 전원 · 본부/지사 = 그 그룹 + 하위 할당 매니저만(2026-10-28 재결정) · ~~관리 권한 = 만들 수 있는 대상~~ → 계층 권한(T1015, 2026-10-28) · 시스템관리자 제외 · ~~사번 표시 안 함~~ → 상세에 사번 · 목록에 연락처 열(2026-10-28).

---

## Phase 1: Foundational

- [x] T991 [P] 타입 in src/features/admins/types/admin.ts — `AdminListItem` · `AdminGroupNode` · `AdminDetail` · 요청 3종(`api-spec.md` §5-1-C 그대로)
- [x] T992 [P] API 6종 in src/features/admins/api/ — `getAdminList` · `getAdminDetail` · `addAdmin` · `updateAdmin` · `resetAdminPassword` · `deleteAdmin`
- [x] T993 [P] 키 in src/features/admins/queryKeys.ts — `list` 하나(상세는 할당 직전 읽기에만 써서 캐시하지 않는다)
- [x] T994 MSW in src/mocks/handlers/groups.ts — 🔄 새 파일 대신 그룹 핸들러 안에(관리자 · 할당 저장소를 `GetGroupAdminList` 와 한 출처로 — 사용자 확인 2026-10-28) · 상태 보유 6종 · 노드 `admins` 상속 · 시스템관리자 · Master 전체 담당 · 중복 사번 · 없는 계정 · 시스템관리자 상세 400 · 시드에 매니저 6 = 강동지사(실측)
- [x] T995 순수 함수 교체 in src/features/admins/lib/adminList.ts — 행(중복 제거 · 시스템관리자 제외) · 노드 범위(회사 = 전원) · 트리 수 · 담당 그룹 seq → 트리 노드 · 마스터 `전체`. 단위 테스트 in src/features/admins/lib/__tests__/adminList.test.ts
- [x] T996 권한 함수 in src/features/admins/lib/adminRole.ts — `canManageAdmin(myRole, targetCodeSeq)`(= `creatableAdminCode` 와 같은 대상) · `isSystemAdmin` 은 목록 제외용으로 유지 — 🔄 T1015 에서 `adminPermission` 으로 대체

## Phase 2: US1 · US2 — 목록 · 상세

> **독립 테스트 기준**: 요청 = 트리 + `GetAdminList` 뿐 · 시스템관리자 없음 · 범위 = 노드 admins · 마스터 담당 `전체` · 상세 연락처 · 사번 없음.

- [x] T997 [US1] 조회 훅 in src/features/admins/hooks/useAdminList.ts(🔄 `useAdminAssignments` 대체 · 삭제)
- [x] T998 [US1] 연결 in src/pages/admin/admins/AdminsPage.tsx · src/features/admins/components/AdminColumns.tsx · AdminCard.tsx
- [x] T999 [US2] 상세 in src/features/admins/components/AdminDetailDialog.tsx — `UserDetail` 제거 · 연락처(목록 값) · 마스터 "전체 그룹" · 시스템관리자 잠금 · 자기 해제 확인 제거

## Phase 3: US3 · US4 — 계정 관리

> **독립 테스트 기준**: 추가 · 수정 · 비밀번호 · 삭제 바디(MSW) · 성공 처리 · 중복 사번 모달 유지 · 권한별 버튼 유무.

- [x] T1000 [US3] 계정 변경 훅 in src/features/admins/hooks/useAdminAccountMutations.ts — 추가 · 수정 · 비밀번호 · 삭제 · 성공 토스트 · 목록 무효화
- [x] T1001 [US3] 추가 제출 in src/features/admins/form/AddAdminForm.tsx · schema.ts — 안내 토스트 → `AddAdmin`(매니저 `groupSeq` · 마스터 키 없음)
- [x] T1002 [US4] 수정 · 비밀번호 폼 in src/features/admins/form/EditAdminForm.tsx · src/features/admins/form/AdminPasswordForm.tsx — 근무자 `editWorkerSchema` · `passwordSchema` 재사용
- [x] T1003 [US4] 상세 하단 액션 in src/features/admins/components/AdminDetailDialog.tsx — 권한 있을 때만 [삭제](확인창) · [비밀번호] · [수정] · `LockedAccountButton` 삭제

## Phase 4: US5 — 담당 그룹

> **독립 테스트 기준**: 추가 · 해제 = `GetAdminDetail` → `UpdateAdmin` 순서 · 읽기 실패 시 PUT 0건 · 여러 그룹 1회 · 마지막 그룹 해제 막힘.

- [x] T1004 [US5] 할당 훅 교체 in src/features/admins/hooks/useAdminGroupMutations.ts — 다시 읽기 → `UpdateAdmin.groupSeq` · 테스트 in src/features/admins/hooks/__tests__/adminGroupMutations.test.tsx
- [x] T1005 [US5] 마지막 그룹 해제 막음 in src/features/admins/components/AdminDetailDialog.tsx

## Phase 4-B: 브라우저 확인 뒤 수정(사용자 2026-10-28)

- [x] T1010 범위 재결정 in src/features/admins/lib/adminList.ts · src/pages/admin/admins/AdminsPage.tsx — 회사 = 전원 · 본부/지사 = 그 그룹 + 하위에 할당된 매니저만(마스터 · 상위 할당 없음). `scopeAdminRows` · `countAdmins` 가 서버 노드를 더 받지 않는다
- [x] T1011 목록 연락처 열 in src/features/admins/components/AdminColumns.tsx · AdminCard.tsx
- [x] T1012 상세 사번 · 520px in src/features/admins/hooks/useAdminDetail.ts(신설) · src/features/admins/queryKeys.ts(`detail`) · src/features/admins/components/AdminDetailDialog.tsx — 계정 변경 시 상세 키도 무효화
- [x] T1013 테스트 in src/features/admins/lib/__tests__/adminList.test.ts · components/__tests__/AdminCard.test.tsx · src/pages/admin/admins/__tests__/AdminsPage.test.tsx(57 passed)
- [x] T1014 상세 담당 그룹 줄의 사업장 수(`N개`) 제거(사용자 요청 2026-10-28) in src/features/admins/components/AdminDetailDialog.tsx · src/features/admins/lib/groupSelection.ts(`AssignmentSection.sites` 삭제 — 쓰는 곳이 없어졌다)

- [x] T1015 관리 권한 재결정(사용자 2026-10-28) in src/features/admins/lib/adminList.ts(`adminPermission` — 시스템관리자 = 전원 · 마스터 = 본인 + 매니저 · 본부 매니저 = 본인 + 아래 지사 매니저 · 지사 매니저 = 본인 · 본인 삭제 없음) · src/features/admins/lib/adminRole.ts(`canManageAdmin` 삭제) · src/features/admins/components/AdminDetailDialog.tsx(`permission` prop) · src/pages/admin/admins/AdminsPage.tsx · 테스트 2파일(61 passed). 추가 · 담당 그룹 권한은 그대로

## Phase 5: 검증 · 문서

- [x] T1006 테스트 in src/pages/admin/admins/__tests__/AdminsPage.test.tsx — Phase 2~4 독립 테스트 기준
- [x] T1007 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` 1462/1463 → 실패 1건 = 시드에 매니저 6 · 강동지사 할당을 넣어 044 "할당 없으면 빈 상태" 가 사업장 3 에서 깨짐 → 할당 없는 지사의 사업장 2 로(src/pages/admin/locations/__tests__/LocationDetailPage.test.tsx) · 그 파일 재실행 31/31
- [x] T1008 브라우저 확인 — mock + dev:real(사용자 확인 2026-10-28)
- [x] T1009 문서 — `screens.md` §2-1(목록 · 계정 관리 · 할당 행 · 비밀번호 행 · 라우트 표) · `data-model.md`(§3-1 주석 · §4-2 표 · §5-2 머리) · 045 spec 머리 뒤집힘 표기 · `roadmap.md`(056 행 · Phase 5 △ 1건 해소 · §12 056 행) · `api-spec.md` §5-1-C(2026-10-27 실측)

---

## Dependencies & Execution Order

- T991 · T992 · T993 병렬 → T994 · T995 · T996 → Phase 2 → Phase 3 · Phase 4(둘 다 `AdminDetailDialog` 를 고쳐 순차) → Phase 5.
- T999 → T1003 → T1005(같은 파일).

---

## 다음 spec으로 이월

- **057** 사업장 상세 — 담당 관리자 카드 `GetSiteManagerList`(조회만 · 시스템관리자 제외) · 비상연락망 `Emergency` 4종 · 사업장 목록 담당 관리자 열 제거(사용자 결정 2026-10-27). 실측 `api-spec.md` §5-1-C.
- **OQ-056-A** 마스터 · 매니저 토큰의 `GetAdminList` 범위 · 매니저 트리의 본부 `layer` — 본사 계정으로만 실측. 본부 매니저 권한(`adminPermission`)이 `layer 1` 에 기댄다.
- **OQ-045-A** 회사(루트) 할당 — 그대로 미실측. 고르기 선택지에서 뺀다.
- 043 `GetGroupAdminList`(그룹 이름 변경 직전 읽기) · 044 담당 관리자 카드는 아직 그 API 를 쓴다 — 카드는 057 에서 교체.
