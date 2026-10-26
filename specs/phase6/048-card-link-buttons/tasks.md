# 048-card-link-buttons tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 사업장 상세의 담당 관리자 · 비상연락망 카드 정리 + 카드 안 버튼 모양 통일.
> 입력: 사용자 결정(2026-10-26 — "추천안대로 진행").
> 태스크 ID 는 047 다음부터(T901~).
> 🔴 API · 데이터 흐름 · 라우트는 바꾸지 않는다 — 담당 관리자는 지금 데이터(소속 지사 그룹 할당) 그대로, 비상연락망은 **예시 데이터 화면**(msw 없음).

---

## 결정 표 (사용자 결정 2026-10-26)

| # | 요소 | 결정 |
|---|---|---|
| 1 | 담당 관리자 카드 | 실데이터 유지 · 관리자마다 테두리 상자(카드 안 카드)를 **행 목록**으로 · "API 미지원" 안내 줄 · [관리자 지정] 계속 막힘 |
| 2 | 비상연락망 카드 | **예시 데이터 목업**(요일 7행 + 담당자 풀) · 버튼 · 칩 해제 전부 막힘 · "예시 화면, 저장되지 않음" 안내 · 아바타 없음 · msw 없음 |
| 3 | 카드 안 버튼 | 관리자 상세 [그룹 추가] 모양(링크형)으로 — [관리자 지정] · 헬스체크 [수정] · 비상연락망 [추가] · [담당자 추가]. **제외**: 오류 상태 [다시 시도] · 카드 **밖** [수정] [삭제] |
| 3-1 | 카드 머리 · 트리 머리 버튼 | 관리그룹 [편집](`GroupEditTrigger`) + 현장 카드 머리 3곳(코스 기본정보 [수정] · 지점 편성 [편성 편집] · 지점 기본정보 [수정])도 링크형 + 글자(가안 — 10-12 · 10-22 아이콘 전용 결정을 뒤집음). `aria-label` 은 그대로 |
| 4 | 공용화 | 같은 클래스 사본 2개(`AdminDetailDialog` · `GroupEditDialog`)를 `AppLinkButton` 으로 올린다. 막힘은 회색 글자. 🔴 `cn` 을 거치지 않는다(`text-meta` 가 지워짐) |

---

## Phase 1: 구현

- [x] T901 `AppLinkButton` in src/components/app/AppLinkButton.tsx — 링크형 버튼 · `disabled` 는 회색 글자 · hover 배경 없음. `AdminDetailDialog` [그룹 추가] · `GroupEditDialog` [+ 본부/지사 추가] 를 교체
- [x] T902 담당 관리자 카드 in src/features/sites/components/SiteManagersCard.tsx — 행 목록(왼쪽 포인트 바 — 사용자 요청) · API 미지원 안내 · [관리자 지정] 링크형(막힘 + 툴팁)
- [x] T903 헬스체크 [수정] in src/features/sites/components/HealthCheckCard.tsx — 링크형(미사용이면 막힘)
- [x] T904 비상연락망 목업 in src/features/sites/components/EmergencyContactCard.tsx — 예시 담당자 3명 · 요일 7행 표(칩 + [추가]) · 담당자 풀 행 목록 + [담당자 추가] · 전부 막힘
- [x] T908 카드 머리 · 트리 머리 링크형 in src/features/groups/components/GroupEditTrigger.tsx · src/features/courses/components/detail/CourseInfo.tsx · src/features/courses/components/detail/CoursePointList.tsx · src/features/points/components/detail/PointDetail.tsx
- [x] T902-1 담당 관리자 행 왼쪽 포인트 바(사용자 요청 — `CheckDetailMemo` 와 같은 바)

## Phase 2: 검증 · 문서

- [x] T905 `npm run verify` + `npm run test` 병렬 green (128 파일 · 1439 테스트)
- [x] T906 브라우저 확인(사용자 확인 2026-10-26) — 사업장 상세(담당 관리자 · 헬스체크 · 비상연락망) · 관리자 상세 모달 [그룹 추가] · 관리그룹 편집 모달 [+ 추가] · 트리 머리 [편집] · 코스 상세 · 지점 상세 카드 머리
- [x] T907 문서 — `design-system.md` §2-3(카드 안 버튼) · `components.md`(`AppLinkButton`) · `screens.md` §2-2 · `roadmap.md`(048 행)
