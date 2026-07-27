# 016-redesign-regression spec

> 위험도: **C** (출처: roadmap.md §5-2 — 임의 산정 금지)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md) 전역 (특정 화면 아님)
> Phase: roadmap.md Phase R (R3, 마감 단계)

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec(015-notice) `tasks.md` "다음 spec으로 이월" 블록 확인 결과:

- [x] 공지 읽음 처리 실효성 → 015가 이미 "016 범위 아님, Phase 3(실 API 연동)로 이월"로 명시. 본 spec에서 다루지 않음.
- [x] 첨부파일 업로드/다운로드 위젯 → 015가 이미 "016 무관, Phase 2로 이월"로 명시. 본 spec에서 다루지 않음.
- [ ] T110 브라우저 확인 최종 사용자 승인 → 본 spec의 회귀 검증 과정에서 `/notice` 포함 현장 5개 화면을 재확인하며 자연스럽게 흡수.
- DoD 미달 항목: 없음.

→ 실질적으로 **이월 없음**. 015는 자체적으로 완결.

---

## User Stories

- US1. 개발자가 Phase R(007~015) 종료 시점에, 리디자인 작업이 범위 밖 영역(본사 사이트·로그인·랜딩)에 부작용을 남기지 않았음을 코드 diff로 확인하고, 현장 5개 화면의 접근성·콘텐츠 톤이 리디자인 과정에서 퇴행하지 않았음을 가볍게 재확인하여 Phase R을 공식 종료한다.

---

## 1. 목적

Phase R(리디자인) 종료 전 최종 회귀 확인. 새 기능 구현이 아니라 **검증 전용** spec — 007~015가 약속한 "범위 밖 미영향"을 diff로 증명하고, 리디자인된 5개 화면의 접근성/톤 일관성을 가볍게 훑어 Phase R을 닫는다.

---

## 2. I/O

### Input
- `git log`/`git diff` (007~015 커밋 범위, `main` 기준 변경 파일 목록)
- `docs/design-system.md` (접근성·콘텐츠 톤 기준)
- `docs/screens.md` §1-2~§1-5, §4 (현재 진행도·라우트 매핑 기재값)

### Output
- 회귀 확인 결과 (커밋 없음 — 검증 리포트 형태로 대화 응답에 M5 DoD 대조표 제시)
- 문제 발견 시에만 최소 수정 커밋
- `docs/roadmap.md` §12 "R Redesign — 016" 행 + "R Redesign (전체)" 행 갱신
- `docs/screens.md` 진행도 컬럼 최종 동기화(변경 있을 시)

---

## 3. 제약

### 기술 제약
- 코드 신규 작성 없음(원칙). 회귀 발견 시에만 최소 수정.
- 검증 방식: **코드 diff 리뷰** (`git diff main...HEAD` 또는 007 시작 커밋 대비 변경 파일 목록 grep) — Playwright 브라우저 확인은 사용하지 않음(사용자 확정).
- 접근성/톤 검증 범위는 **Phase R 회귀만** — 전사 전수 감사는 Phase 6 "접근성 최종 검토" 항목으로 남겨둠(중복 금지).

### 비즈니스 규칙
- `/admin/*`, `/login`, `/`(랜딩)은 이번 라운드 미적용 대상 — 파일 변경이 있다면 그 자체가 회귀.
- 현장 5개 화면(순찰이력 코스/지점, 코스/지점 관리, 근무자, 배치관리, 공지사항)은 신규 셸(`ServiceLayout`+`RailSidebar`) 렌더링이 유지되어야 함.

---

## 4. 엣지 케이스

C급 — 공통 규칙 따름. (해당 없음)

---

## 5. 완료 조건 (DoD)

roadmap.md §5-3 Phase R 종료조건을 그대로 승계.

- [x] `git diff`로 007~015 커밋 범위에서 `src/pages/admin/**`, `src/pages/auth/**`(로그인), 랜딩(`/`) 관련 파일이 변경되지 않았음을 확인 — `git diff --stat 62ee8c2~1..HEAD -- "src/pages/admin/**" "src/pages/auth/**"` 결과 0건(`src/router/paths.ts` 상수 추가 4줄만, 경로 상수라 admin/auth 페이지 자체와 무관)
- [x] `/admin/*`가 기존 셸(`AdminLayout` + `Sidebar` w-70 + `TopNav`)로 라우터에 그대로 연결돼 있음을 확인 — src/router/index.tsx(AdminLayout 브랜치, `RequireRoute roles={['SYSTEM','MASTER','MANAGER']}` 유지), src/components/layout/sidebar/sidebar.config.ts(`AdminMenus` 무변경, `ServiceMenus`만 flat화)
- [x] 현장 5개 화면이 모두 `ServiceLayout`+`RailSidebar` 하위 라우트로 연결돼 있음을 확인 — src/router/index.tsx(`ServiceLayout` 브랜치에 patrolZones/patrolPoints/zones/points/users/deployments/notice/noticeDetail 8개 라우트)
- [x] 현장 5개 화면 접근성 회귀 없음 — 인터랙션 요소가 공용 primitive(`AppButton`/`ui/button` 등)의 `focus-visible` 스타일에 의존하는 기존 패턴 유지 확인. 007~015 각 spec 자체 DoD에서 이미 개별 검증됨(재감사 아님, Phase 6에서 전수 감사 예정)
- [x] 현장 5개 화면 콘텐츠 톤 일치 — `AppEmpty` 빈 상태 컴포넌트가 notice/patrol-zones/points/users/deployments 전 화면에서 일관 사용됨을 grep으로 확인
- [x] `npm run verify` + `npm run test` green (M4) — 0 errors, 27 files/81 tests 통과
- [x] `docs/screens.md` §1-2~§1-5 진행도 + §4 라우트 매핑 확인 — 009~015에서 이미 ✓로 갱신 완료돼 있어 추가 변경 불필요(재확인만)
- [x] `docs/roadmap.md` §12 "016 regression" + "R Redesign (전체)" 행 ☑ 처리 — docs/roadmap.md
- [~] **Open Q 신규 발견** — `src/index.css`의 폰트(Pretendard)·기본 폰트사이즈(12.5px)·시맨틱 색상 토큰이 `:root`/`.dark` 전역 스코프라 `/admin/*`도 함께 영향받음. 007 spec.md의 "본사 사이트 미영향 — 시각·기능·라우팅 모두 변경 없음" DoD 클레임과 불일치(라우팅·기능은 무영향 맞으나 시각은 100% 무변화 아님). 현재 admin은 placeholder 화면뿐이라 실질 영향 미미 → 코드 수정 없이 `roadmap.md` §13 Open Question으로 등재, Phase 5 착수 전 결정 필요 사항으로 이월

---

## 참고 (선택)

- 관련 로드맵: `roadmap.md` §5-3 Phase R 종료조건, §11 의존성 도식
- 관련 spec: 007(foundation), 008(shared components), 009~015(화면별)
