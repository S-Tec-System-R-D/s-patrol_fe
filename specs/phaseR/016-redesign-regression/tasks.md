# 016-redesign-regression tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 C — 통째로 한 번에 분할.
> 검증 방식(사용자 확정): 코드 diff 리뷰. Playwright 브라우저 확인 사용 안 함.

---

## Phase 1: US1 — Phase R 회귀 확인

> **독립 테스트 기준**: `git diff`/`git log`로 007~015 커밋 범위의 변경 파일 목록을 뽑아 admin/login/랜딩 관련 파일이 0건임을 확인. `src/router/index.tsx`에서 두 레이아웃(`ServiceLayout`/`AdminLayout`) 라우트 트리가 스펙대로 분리돼 있음을 확인. 현장 5개 화면 접근성·톤을 각 spec DoD 재확인 수준으로 훑음.

- [x] T121 [US1] `git log --oneline` + `git diff --stat` (007 시작 커밋 대비 HEAD)으로 변경 파일 전체 목록 확보 — 회귀 확인의 원본 증거. 136 files changed, 007 시작 커밋 `62ee8c2`
- [x] T122 [US1] 변경 파일 목록에서 `src/pages/admin/**`, `AdminLayout` 관련, `src/pages/auth/**`(로그인), 랜딩 페이지 파일 존재 여부 grep — `src/router/paths.ts`(상수 추가만) 제외 0건. `AdminLayout.tsx`는 006의 `AppLayout.tsx` 단순 rename(007 spec에 명시된 예정 작업)이라 회귀 아님
- [x] T123 [US1] `src/router/index.tsx` 확인 — `/admin/*`가 기존 `AdminLayout`+`Sidebar`+`TopNav`로, 현장 8개 라우트가 `ServiceLayout`+`RailSidebar`로 연결됨을 확인. `RequireRoute` 권한 로직·`AdminMenus` 무변경
- [x] T124 [US1] 현장 5개 화면 접근성 재확인 — 공용 primitive(`AppButton` 등) 기반 `focus-visible` 패턴 유지 확인. 각 spec 자체 DoD에서 이미 검증됨, 전수 감사는 Phase 6으로 유지
- [x] T125 [US1] 현장 5개 화면 콘텐츠 톤 재확인 — `AppEmpty` 빈 상태 컴포넌트가 notice/patrol/points/users/deployments 전 화면 일관 사용 확인
- [x] T126 [US1] `npm run verify` + `npm run test` 병렬 실행, green 확인 — verify exit 0, test 27 files/81 tests 통과
- [x] T127 [US1] `docs/screens.md` §1-2~§1-5 진행도 + §4 라우트 매핑 최종 동기화 확인 — 009~015에서 이미 ✓ 갱신 완료, 추가 변경 불필요
- [x] T128 [US1] `docs/roadmap.md` §12 "016 regression" 행 + "R Redesign (전체)" 행 ☑ 처리 + §13에 전역 토큰/본사 side-effect Open Q 신규 등재

## 발견 사항 (코드 수정 아님 — Open Question으로 등재)

- **전역 디자인 토큰의 본사 side-effect**: `src/index.css`의 폰트(Pretendard)·기본 폰트사이즈(12.5px)·시맨틱 색상 값이 `:root`/`.dark` 전역 스코프라 `/admin/*`도 함께 적용받음. 007 spec.md "본사 사이트 미영향" DoD 클레임과 불일치. 라우팅·기능·로직은 무영향 확인, 시각(폰트/색)만 해당. 현재 admin이 placeholder뿐이라 실질 영향 미미 → `roadmap.md` §13에 Open Q로 등재, 코드 수정은 보류(사용자 결정 필요 사안)

---

## Dependencies & Execution Order

- T121 → T122, T123, T124, T125 선행 (변경 파일 목록이 있어야 이후 확인 가능)
- T122, T123, T124, T125 = 서로 독립, 순서 무관하나 순차 진행 권장(단일 세션, C급이라 병렬 분할 불필요)
- T126 = T121~T125 완료 후 (문제 발견 시 수정 커밋 포함)
- T127, T128 = T126 green 확인 후 마지막

## 다음 spec으로 이월

> Phase R 마지막 spec 종료. 다음은 Phase 2(공용 컴포넌트 확충) 또는 Phase 3(현장 코어 마감) — roadmap.md §11 의존성 도식에 따라 다음 세션에서 결정.

- [ ] **전역 디자인 토큰의 본사(`/admin/*`) side-effect** (본 spec에서 발견, 코드 수정 안 함) → `roadmap.md` §13 Open Q로 등재. **Phase 5(본사 전체 구현) 착수 전** 반드시 재검토·결정 필요(본사 전용 토큰 오버라이드 신설 vs 신규 토큰 수용 vs 현행 유지)
- [ ] 015에서 넘어온 T110(브라우저 확인 최종 사용자 승인) — 본 spec은 코드 diff 리뷰 방식으로 진행해 별도 브라우저 확인을 하지 않음(사용자 확정 사항). 미해결 상태 그대로 유지, 실 브라우저 검증이 필요해지는 시점(Phase 3 이후 실 API 연동 또는 Phase 6 최종 점검)에 재확인
- DoD 미달 항목: 없음(위 신규 Open Q 1건은 "미달"이 아니라 "발견 후 이월 결정"임 — spec.md DoD에 `[~]`로 반영됨)
