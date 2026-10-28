# 057-site-managers-emergency tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID 는 056 다음부터(T1016~).
> 결정(사용자 2026-10-27 · 28): 담당 관리자 조회만 · **매니저만** · 비상연락망 후보 시스템관리자 제외 · **담당자 풀 제거** ·
> 추가는 **요일별 [추가] → 사람 여러 명** · 사업장 목록 담당 관리자 열 삭제 · `assignmentType` 무시.

---

## Phase 1: Foundational

- [x] T1016 [P] 타입 · API in src/features/emergency/types/emergency.ts · src/features/emergency/api/(4종) · src/features/sites/api/getSiteManagerList.ts · src/features/sites/types/site.ts(`SiteManager`)
- [x] T1017 [P] 키 in src/features/emergency/queryKeys.ts(`week(siteSeq)` · `tree`) · src/features/sites/queryKeys.ts(`managers(siteSeq)`)
- [x] T1018 MSW — 담당 관리자 in src/mocks/handlers/groups.ts(사업장 소속 그룹 + 조상에 할당된 매니저 + 전체 담당) · 비상연락망 4종 in src/mocks/handlers/emergency.ts(신설 — 그룹 · 근무자 저장소를 읽는다) · src/mocks/handlers/index.ts · `groups.ts` `mockGroupSnapshot` · `users.ts` `mockFieldUsers`(읽기 전용 스냅숏 — 순환 import 회피) · 시드 사업장 3 = 월 매니저 6 · 토 마스터 3
- [x] T1019 트리 순수 함수 in src/features/emergency/lib/emergencyTree.ts — 시스템관리자 제외 · 빈 노드 숨김 · 이름 검색(경로 유지) · 요일별 등록 `userSeq` 집합 · 담당자 수(중복 제거). 단위 테스트 in src/features/emergency/lib/__tests__/emergencyTree.test.ts

## Phase 2: US1 · US3 — 담당 관리자 · 목록 열

> **독립 테스트 기준**: 상세 카드 = `GetSiteManagerList` 매니저만 · `GetGroupAdminList` 0건 · 버튼 · 안내 없음 / 목록 열 4개(담당 관리자 없음).

- [x] T1020 [US1] 조회 훅 · 카드 in src/features/sites/hooks/useSiteManagers.ts · src/features/sites/components/SiteManagersCard.tsx · src/pages/admin/locations/LocationDetailPage.tsx · 🔄 `features/groups/hooks/useGroupAdminList.ts` 삭제(쓰는 곳이 이 카드뿐이었다)
- [x] T1021 [US1] 056 무효화에 담당 관리자 키 추가 in src/features/admins/hooks/useAdminAccountMutations.ts
- [x] T1022 [US3] 열 삭제 in src/features/sites/components/SiteColumns.tsx

## Phase 3: US2 — 비상연락망

> **독립 테스트 기준**: 7요일 칩 · 담당자 N명 / 추가 모달 — 시스템관리자 없음 · 잠금 · 배치 뱃지 · 검색 · `AddEmergency` 차례로 · 첫 실패 중단 / 칩 해제 `DeleteEmergency`.

- [x] T1023 [US2] 훅 in src/features/emergency/hooks/(조회 · 트리 · 추가 · 해제)
- [x] T1024 [US2] 추가 모달 in src/features/emergency/components/EmergencyAddDialog.tsx
- [x] T1025 [US2] 카드 in src/features/sites/components/EmergencyContactCard.tsx(목업 → 실제 · `siteSeq` prop) · src/pages/admin/locations/LocationDetailPage.tsx

## Phase 3-B: 브라우저 확인 뒤 수정(사용자 2026-10-28)

- [x] T1030 사업장 목록 소속 그룹 → **본부 · 지사 두 열**(경로에 그 단계가 없으면 `-` — 본부 직속 테스트 데이터) in src/features/sites/lib/siteList.ts(`SiteRow.hqName` · `branchName`, `layer` 기준) · src/features/sites/components/SiteColumns.tsx · 테스트 3파일. 좁은 폭 카드 · 상세 경로는 그대로

## Phase 4: 검증 · 문서

- [x] T1026 테스트 in src/pages/admin/locations/__tests__/LocationDetailPage.test.tsx · LocationsPage.test.tsx — Phase 2 · 3 독립 테스트 기준
- [x] T1027 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` green — 130 파일 · 1480 테스트
- [x] T1028 브라우저 확인 — mock + dev:real(사용자 확인 2026-10-28)
- [x] T1029 문서 — `screens.md` §2-2(목록 · 상세 · 헬스체크/비상연락망 행 · 라우트 표) · `data-model.md`(§4-2 표 · 비상연락망 설계 주석) · 044 spec 머리 뒤집힘 표기 · `roadmap.md`(057 행 · Phase 5 ☑ · §12 057 행)

---

## Dependencies & Execution Order

- T1016 · T1017 병렬 → T1018 · T1019 → Phase 2 · Phase 3(둘 다 `LocationDetailPage` 를 고쳐 순차 — T1020 → T1025) → Phase 4.

---

## 다음 spec으로 이월

- **OQ-057-A** 비상연락 담당자의 계정이 지워지면 `GetEmergency` 에서 함께 빠지는가 — 미실측. 화면은 응답대로 그린다.
- **OQ-057-B** 알림 발송(헬스체크 이상 → 담당자)은 서버 · APP 몫 — 웹은 편성만.
- **OQ-056-A** · **OQ-045-A** 그대로(056 이월).
- Phase 5 △ 전부 해소 — 남은 본사 항목은 외부 대기(screens.md §2).
