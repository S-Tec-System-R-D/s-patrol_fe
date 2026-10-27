# 051-site-form-cascade tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID 는 050 다음부터(T929~).

---

## Phase 1: Foundational

- [x] T929 선택지 순수 함수 in src/features/sites/lib/siteList.ts — `hqOptions` · `branchOptions(hqSeq)` · `parentSiteOptions(branchSeq)`(최상위만) · `hqOf(groupSeq)`. `groupOptions` 제거
- [x] T930 [P] 테스트 in src/features/sites/lib/__tests__/siteList.test.ts — 위 4종 · 루트가 지사인 트리
- [x] T931 스키마 in src/features/sites/form/schema.ts — `parentSiteSeq`(없음 값 `NO_PARENT`. 본부는 지사 선택지를 거르는 화면 상태라 스키마에 두지 않는다) · `toAddSiteRequest` 에 `parentSiteSeq` 선택 실기 · 지사 문구. `AddSiteRequest` in src/features/sites/types/site.ts

## Phase 2: US1 — 추가 모달

> **독립 테스트 기준**: MSW 로 하위 추가 → 바디에 `parentSiteSeq` · 목록에 들여쓰기 행 / "없음" 이면 키 없음.

- [x] T932 [US1] `SiteForm` 3단 선택 in src/features/sites/form/SiteForm.tsx — 트리 prop · 위 칸 변경 시 아래 비움 · 본부 칸 숨김 · 안내 문구
- [x] T933 [US1] 호출부 in src/pages/admin/locations/LocationsPage.tsx — 트리 전달 · 기본값 본부 · 지사
- [x] T934 [US1] 테스트 in src/features/sites/form/__tests__/SiteForm.test.tsx · src/pages/admin/locations/__tests__/LocationsPage.test.tsx

## Phase 3: US2 — 수정 모달

> **독립 테스트 기준**: 최상위 사업장 수정 → 본부 · 지사 바꿔 저장 / 하위 사업장 → 셋 다 막힘 · 모 사업장 이름 표시.

- [x] T935 [US2] 호출부 in src/pages/admin/locations/LocationDetailPage.tsx — 트리 · 기본값 · 모 사업장 읽기 전용
- [x] T936 [US2] 테스트 in src/pages/admin/locations/__tests__/LocationDetailPage.test.tsx

## Phase 4: 검증 · 문서

- [x] T937 `npm run verify` + `npm run test` green (128 파일 · 1452 테스트)
- [x] T938 브라우저 확인(사용자 확인 2026-10-27) — 추가(최상위 · 하위) · 수정(최상위 · 하위) · 좁은 폭
- [x] T939 문서 — `screens.md` 사업장 추가 / 수정 행 · 044 spec 뒤집힘 표기 · `roadmap.md`(051 행)

---

## Dependencies & Execution Order

T929 → T930 · T931 → T932 → T933 · T935 → T934 · T936 → T937 → T938 → T939

---

## 다음 spec으로 이월

- **OQ-051-A** Manager 의 사업장 추가 · 수정 권한 — 명세 확인 필요(서버는 검사하지 않는다, B-60 계열). 화면은 분기하지 않는다.
- **OQ-051-B** 본부 직속 사업장 → 본부직할 지사로 정리 · Master 지사 할당 정리(데이터 쪽 예정). 끝나면 `SiteForm` 의 "루트가 지사(본부 칸 숨김)" · "기본 그룹이 지사 아님(비움)" 분기를 지울지 판단.
