# 049-worker-detail-sections tasks

> 입력: [`spec.md`](./spec.md) (사용자 결정 2026-10-26). 태스크 ID 는 048 다음부터(T909~).

---

## Phase 1: US1 — 최근 순찰 기록

> 독립 테스트 기준: 날짜 머리로 묶이고, 행 링크가 지점 인증 상세로 가며, ✓/✕ 접근 이름이 5종 문구다.

- [x] T909 [US1] 날짜 묶음 · ✓/✕ 아이콘 · 오른쪽 예외(시간초과 · 메모) + 인증 방식 · 결과 뱃지 제거 in src/features/workers/components/detail/UserPatrolCard.tsx
- [x] T910 [US1] 테스트 — 행 링크 이름(시각) · 날짜 머리 · 아이콘 접근 이름 in src/pages/service/users/__tests__/UserDetailPage.test.tsx

## Phase 2: US2 — 배치 이력

> 독립 테스트 기준: 소속지 → 도착지 · 상태별 오른쪽 문구 · [더보기]가 5건씩 늘고 다 보이면 사라진다.

- [x] T911 [US2] 타임라인 행 · 출발지 · 일수 문구 · `completeDt` 복귀 · 필터/페이지네이션 → [더보기] in src/features/workers/components/detail/UserAssignmentCard.tsx
- [x] T912 [US2] 이전 목록 유지(`placeholderData`) in src/features/deployments/hooks/useUserAssignmentHistory.ts
- [x] T913 [US2] 소속지 전달 in src/pages/service/users/UserDetailPage.tsx
- [x] T914 [US2] OQ-042-E 닫힘 반영(주석) in src/features/deployments/types/deployment.ts · src/features/deployments/lib/deploymentPeriod.ts
- [x] T915 [US2] 테스트 — 필터 · 페이징 테스트를 더보기 · 일수 문구로 교체 in src/features/workers/components/detail/__tests__/UserAssignmentCard.test.tsx

## Phase 3: 검증 · 문서

- [x] T916 `npm run verify` + `npm run test` 병렬 green (128 파일 · 1444 테스트)
- [x] T917 브라우저 확인(사용자 확인 2026-10-26) — `/users/103`(배치중 · 순찰 0건) · `/users/104`(순찰 8건 · 복귀완료)
- [x] T918 문서 — `screens.md` §2 근무자 상세 · `roadmap.md`(049 행) · `specs/phase4/042-deployments-real/spec.md` OQ-042-E 해소 표기

---

## Dependencies & Execution Order

- T909 → T910 순차, T911~T914 → T915 순차
- Phase 1 과 Phase 2 는 서로 독립(다른 파일)
- T916 은 T910 · T915 이후, T917 은 T916 이후

---

## 다음 spec으로 이월

> 다음 spec의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [x] OQ-049-A mock 미완료 행의 인증 방식(`authMethodName` 이 실측과 달리 채워져 있음) → ✅ **058 해소**(2026-10-28 — 미완료 행 `authMethod: null` · `authMethodName: ''`)
