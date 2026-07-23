# 007-redesign-foundation spec

> 위험도: **A** (출처: [`docs/roadmap.md`](../../../docs/roadmap.md) §5-2 · Phase R R0 셸 전면 교체)
> 관련 화면: 현장 사이트 전체 셸 ([`docs/screens.md`](../../../docs/screens.md) §1-2~§1-5 진입 기반)
> Phase: roadmap.md Phase R (Redesign)
>
> **핵심**: 현장 사이트 UI 리디자인의 **셸 전용 spec**. 이후 008(공용 컴포넌트) / 009~015(화면별) / 016(회귀)이 모두 이 위에 얹힘. 데이터·기능·문구는 유지, **UI만** 교체.
>
> **공통 규칙(토큰·콘텐츠 톤·반응형·에러 처리 등)은 적지 않는다.** `CLAUDE.md`/`design-system.md`에 이미 있음.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = **006-shell-and-table** (Phase 1). 007에서 다룰 항목만 옮김.

- [ ] **006 Open Q — `AppLayout` 영역 분기 구현 방식** (layout.md §6) → **본 spec에서 해소**. 라우터 레벨 `ServiceLayout` / `AdminLayout` 분리로 확정 (roadmap §5-2 · 사용자 결정 2026-07-23).
- [ ] **로드맵 §3의 Phase 1 대비 리디자인 결정 반영** — Sidebar/TopNav 셸 자체가 바뀌므로 006에서 만들어둔 wrapping을 현장/본사 두 셸로 재편.

**본 spec 범위 외로 이월 (그대로 다음 spec/Phase에 유지)**

- [ ] 006 수동 회귀 미실행 → 사용자 별도 수행 (007은 셸 자체를 바꾸므로 006 회귀 대상 화면 대부분이 016 회귀로 흡수)
- [ ] admin placeholder 라우트 / AdminLoginPage placeholder → Phase 5
- [ ] AppTable 페이지네이션 URL 쿼리 연동 → Phase 3
- [ ] 알림 시트 본문 (본사 전용) → Phase 2
- [ ] shadcn `ui/button.tsx` 완전 제거 → Phase 6
- [ ] AppInput → AppFormField 마이그 잔여, MSW 도메인 이관, `useQueryParams` zod 통합 등 (004/005/006 이월 잔여) → Phase 3+
- [ ] 본사 사이트 리디자인 → 추후 별도 라운드

---

## User Stories

- **US1.** 현장관리자로서, 리디자인된 셸(68px 다크 아이콘 레일 + Pretendard 타이포 + 자연 스크롤)에 진입해 이후 화면 리디자인(008~015)이 얹힐 **셸 기반**이 준비되어 있음을 확인한다.
- **US2.** 개발자로서, 라우터 레벨에서 `/*` → `ServiceLayout`, `/admin/*` → `AdminLayout`으로 셸이 분기되어 두 사이트가 서로 독립적으로 렌더링된다 (`useLocation` 조건분기 X).
- **US3.** 시스템관리자로서, `/admin/*` 진입 시 기존 셸(w-70 사이드바 + TopNav)이 리디자인 영향 없이 그대로 동작한다.

---

## 1. 목적

현장 사이트(`/*`) UI 리디자인의 **셸 · 토큰 · 타이포 기반**을 세팅한다. R0(007)이 끝나야 R1(008 공용 컴포넌트) → R2(009~015 화면별)이 진행 가능하다. 본 spec은 **아무 페이지 내용도 손대지 않는다** — 오직 셸·토큰·폰트만 교체하고 개별 페이지는 기존 컨텐츠 그대로 신규 셸 안에서 렌더링된다.

---

## 2. I/O

### Input

- **참조 문서**
  - [`docs/new-design-note.md`](../../../docs/new-design-note.md) — 리디자인 배경·컨셉
  - [`docs/design-system.md`](../../../docs/design-system.md) §1-1(팔레트 매핑), §1-2(타이포), D10(리디자인 방향), D11(Pretendard)
  - [`docs/layout.md`](../../../docs/layout.md) §0-1(현장 셸), §0-2(본사 셸), §2-A(RailSidebar), §3-A(TopNav 삭제), §5-5(자연 스크롤)
  - [`docs/ui-mock/현장/*/*-신규.png`](../../../docs/ui-mock/현장/) — 시각 기준 (5개 화면)
- **현재 상태 (교체 대상)**
  - `src/index.css` — `@fontsource-variable/geist` import + `--font-sans: 'Geist Variable'`
  - `src/components/layout/AppLayout.tsx` — 단일 셸, `hidden lg:flex`로 Sidebar 노출, TopNav 상단 고정
  - `src/components/layout/sidebar/Sidebar.tsx` — w-70, `isAdminArea`로 자동 분기
  - `src/components/layout/sidebar/sidebar.config.ts` — `ServiceMenus`(2 그룹: 관리/알림, 3 아이템) / `AdminMenus`
  - `src/router/index.tsx` — `element: <AuthGuard />` 아래 모든 라우트가 단일 AppLayout 사용

### Output

- **폰트**: `@fontsource-variable/pretendard` 도입, `--font-sans` 값 교체, Geist 제거.
- **토큰**: `--rail`, `--rail-2` 신설 (라이트/다크 모두). `@theme inline`에 `--color-rail`, `--color-rail-2` 연결.
- **레이아웃**: 신규 파일 2개
  - `src/components/layout/ServiceLayout.tsx` — 68px `RailSidebar` + 자연 스크롤 컨텐츠, TopNav 없음
  - `src/components/layout/AdminLayout.tsx` — 기존 셸 구조 이식 (사이드바 w-70 + TopNav + `.app-shell` overflow:hidden 유지)
- **컴포넌트**: `src/components/layout/sidebar/RailSidebar.tsx` 신규 (아이콘 flat 5개 + 프로필 아바타).
- **라우터**: `router/index.tsx`에서 `AuthGuard` 아래를 두 갈래로 분기 (현장 라우트는 `ServiceLayout`, 본사 라우트는 `AdminLayout`).
- **사이드바 config**: `ServiceMenus` 구조를 **5개 flat `MenuItemType[]`**로 변경 — `순찰이력 · 코스/지점 · 근무자 · 배치관리 · 공지사항`. `MenuGroupType` 미사용. (배치관리·근무자·공지사항 라우트는 아직 미구현 페이지 — URL만 예약)
- **삭제/단순화**: 기존 `AppLayout.tsx` 제거 (사용처 라우터 1곳만), `Sidebar.tsx`의 `isAdminArea` 분기 로직 제거하고 본사 전용으로 단순화.
- **정책**: 현장 사이트는 페이지 자연 스크롤. `.app-shell` 유틸은 본사 전용으로 그대로 남김.

---

## 3. 제약

### 기술 제약

- **재사용 컴포넌트**: `ProfileBadge` (사이드바 하단 아바타에서 재사용), 기존 `Sidebar` / `TopNav` / `AlarmSheet` (본사 전용으로 유지)
- **재사용 훅**: `useMe`, `useLocation` (사이드바 활성 판단)
- **사용 라이브러리**:
  - `@fontsource-variable/pretendard` (신규 추가)
  - `radix-ui/tooltip` (이미 shadcn 통해 설치, 레일 아이콘 툴팁용)
  - `lucide-react` (아이콘)
- **금지**:
  - 임의 hex/oklch 사용 (design-system.md §2-1) — 신설 토큰은 `index.css`에 정의 후 Tailwind 유틸 경유
  - 개별 페이지 내부 수정 (본 spec은 셸만; 페이지 스크롤 처리는 009~015에서 화면별로)
  - 본사 셸 시각적 변화 (본사는 이번 라운드 대상 아님)
  - `useLocation` 기반 셸 분기 (라우터 노드 분기로 처리)

### 비즈니스 규칙

- **현장 5개 flat 메뉴 순서 (고정)**: 순찰이력 → 코스/지점 → 근무자 → 배치관리 → 공지사항. 사용자 결정 2026-07-23.
- **본사 사이트 미영향** — 시각·기능·라우팅 모두 변경 없음.
- **로그인·랜딩 (공개 영역) 미영향** — layout 밖이므로 자동 미영향.

---

## 4. 엣지 케이스

- **셸 미매칭 라우트** — `/login`, `/admin/login`, `/403`, `/404`, `/`는 AuthGuard 밖이므로 layout 없음. 007에서 그대로 유지 (현행 동작).
- **AuthGuard 통과 후 layout 진입 실패** — layout이 라우터 노드로 분리되었으므로 `<Outlet />` 렌더링 자연 성립. `useMe` 실패는 AuthGuard가 이미 리다이렉트 처리 (005).
- **RailSidebar 배치관리 뱃지 카운트** — `badge?: () => number` 인터페이스만 열어두고, 실제 카운트 연결은 014에서. 007에서 `badge` 미정의면 뱃지 숨김.
- **모바일 (lg 미만)** — 현장은 레일이 이미 68px 최소폭이므로 햄버거 불필요 (layout.md §5-7). `MobileSidebar` 미사용. 본사는 기존 `MobileSidebar` 동작 그대로 유지.
- **다크 모드** — `--rail`은 다크 배경, `--rail-2`는 밝은 하이라이트로 **양쪽 테마 모두 어두운 값**으로 정의 (레일은 항상 다크). 본문 텍스트 토큰은 기존 라이트/다크 정의 재사용.
- **페이지 자연 스크롤 전환 부작용** — 기존 페이지가 `flex-1 min-h-0 overflow-hidden`으로 자체 스크롤을 잡고 있음. 자연 스크롤 셸 안에서 이들이 어색하게 보일 수 있으나, 개별 페이지 리팩터는 009~015에서 각 화면 리디자인 시 자연 흡수. 007 셸만으로도 페이지가 깨져 보이지 않는지 (렌더링 오류 X) 시각 확인 필요.
- **동일 컴포넌트(`ProfileBadge`)의 두 컨텍스트 재사용** — 현장 사이드바 하단 vs 본사 TopNav 우측. 트리거만 다르고 드롭다운 내용 동일. CSS 충돌 없어야 함 (relative positioning 확인).
- **툴팁 지연/포커스** — 레일 아이콘 hover 툴팁은 shadcn/radix 기본값. 키보드 포커스 시에도 노출 (접근성).
- **네트워크 실패 / 빈 입력 / 중복 요청 / 권한 없음 / 로딩** — 셸 spec 특성상 해당 없음. 공통 규칙 따름.

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

**폰트 / 토큰**

- [ ] `@fontsource-variable/pretendard` 설치 + `src/main.tsx` 또는 `index.css` import
- [ ] `@fontsource-variable/geist` 제거 (package.json + import 라인)
- [ ] `src/index.css` `--font-sans: 'Pretendard Variable', sans-serif` 로 교체
- [ ] `src/index.css` `--rail`, `--rail-2` 신설 (라이트/다크 모두)
- [ ] `src/index.css` `@theme inline`에 `--color-rail`, `--color-rail-2` 연결
- [ ] `bg-rail` / `bg-rail-2` Tailwind 유틸이 실제 적용됨

**라우터 / 레이아웃**

- [ ] `src/components/layout/ServiceLayout.tsx` 신규 — RailSidebar + 자연 스크롤 컨텐츠 (`min-h-screen flex`)
- [ ] `src/components/layout/AdminLayout.tsx` 신규 — w-70 Sidebar + TopNav + `.app-shell` overflow:hidden 유지
- [ ] `src/router/index.tsx` — `AuthGuard` 아래 라우트를 현장/본사 두 브랜치로 분리 (각 브랜치에 layout 씌움)
- [ ] 기존 `src/components/layout/AppLayout.tsx` 제거 + `src/components/layout/index.ts` export 정리

**사이드바**

- [ ] `src/components/layout/sidebar/RailSidebar.tsx` 신규 — 68px 다크 sticky, 로고 · 아이콘 5개 flat · 프로필 아바타 하단
- [ ] 활성 스타일 — 좌측 2px `border-accent` 바 + `bg-rail-2` + 아이콘 색상 승격
- [ ] 아이콘 hover 툴팁 (라벨 우측) — radix tooltip 사용, 키보드 포커스에도 노출
- [ ] 프로필 아바타 클릭 → 기존 `ProfileBadge` 드롭다운 재사용 (동일 로그아웃 로직)
- [ ] `sidebar.config.ts` — `ServiceMenus`를 `MenuItemType[]` 5개 flat 구조로 변경 (순찰이력 / 코스/지점 / 근무자 / 배치관리 / 공지사항). 배치관리·근무자·공지사항 URL은 `paths.service.deployments` 등으로 예약 (paths.ts에 없으면 추가). 배치관리는 `badge?: () => number` 인터페이스 열어둠
- [ ] `Sidebar.tsx` — `isAdminArea` 분기 로직 제거, 본사 전용으로 단순화 (`AdminMenus` 고정 참조, `ADMIN` 뱃지는 유지)
- [ ] `Sidebar` 관련 기존 테스트 (`Sidebar.test.tsx`) — 본사 전용 단순화에 맞춰 갱신

**정책 / 회귀**

- [ ] 현장 사이트 페이지 자연 스크롤 동작 — 뷰포트보다 긴 페이지가 body 스크롤로 스크롤됨 (개별 페이지의 `overflow-hidden`은 그대로 두되, ServiceLayout이 이를 강제로 잘라내지 않음)
- [ ] 본사 사이트 (`/admin/*`) 셸 시각·기능 무변화 — `AdminLayout` = 기존 `AppLayout` 구조 100% 이식
- [ ] 로그인/랜딩/403/404 페이지 무영향 확인 (layout 밖)
- [ ] `paths.ts`에 `service.deployments` 등 미존재 라우트 추가 (사이드바 링크 대상)
- [ ] `docs/layout.md` §6 Open Q "AppLayout 영역 분기 구현 방식" → **해소** 표시 + 결정 사유 기록
- [ ] `docs/design-system.md` §1-1 하단 "신설 필요 토큰" 항목의 `--rail`/`--rail-2` → **해소** 표시
- [ ] `docs/design-system.md` D11 (Pretendard) — "로딩" 항목에 실제 채택 방식(`@fontsource-variable/pretendard`) 반영
- [ ] `npm run verify` exit 0
- [ ] `npm run test` 전체 통과 (기존 28건 + 신규 셸 관련 최소 회귀 테스트)

---

## 참고

- 관련 목업: [`docs/ui-mock/현장/*/*-신규.png`](../../../docs/ui-mock/현장/) (5개 화면 — 셸 시각 기준)
- 관련 데이터 모델: 해당 없음 (셸 전용)
- 관련 패턴: [`docs/layout.md`](../../../docs/layout.md) §0·§2·§3·§5-5
- 관련 결정: `design-system.md` D10(리디자인 방향) / D11(Pretendard)
