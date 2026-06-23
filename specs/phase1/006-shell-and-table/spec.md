# 006-shell-and-table spec

> 위험도: **B** (출처: `roadmap.md` §4 — 모든 항목 B. 가드·인증 위에서 동작하는 셸/공용 확장)
> 관련 화면: `docs/layout.md` §2~§6 (Open Q 해소), `docs/components.md` §9·§10 (AppTable 페이지네이션)
> Phase: roadmap.md Phase 1 (Layout Plus, 후반부 — 셸·테이블·AppButton)
>
> **분량 가이드**: B급 → 1·2·3축 + DoD (4축은 "공통 규칙 따름")

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `specs/phase1/005-auth-and-error-pages/`. `tasks.md` "다음 spec으로 이월" 블록에서 **본 spec이 흡수**할 항목:

- [ ] **403/404 액션 버튼 임시 `<Link>` 스타일** (005 이월) — 006 AppButton 마이그 직후 ForbiddenPage / NotFoundPage 액션을 `AppButton`(`variant="default"`)로 교체. → **본 spec US5(AppButton 마이그) 흡수**
- [ ] **MSW 환경 셋업 안내** (005 이월) — 다른 개발자 dev 환경 첫 진입 시 `.env.local`(`VITE_USE_MSW=true`) + `npx msw init public/` 필요. → **본 spec US6(개발자 안내) 흡수, README 또는 docs 1줄 추가로 처리**

본 spec 범위 외(다음 spec/Phase로 재이월):
- **admin placeholder 라우트** / **AdminLoginPage placeholder** (005 이월) → Phase 3 `/login` spec(현장 로그인 본 구현 동시 본사도) 또는 Phase 5 본사 영역 spec
- AppInput → AppFormField 마이그(Phase 3), MSW 핸들러 도메인 이관(Phase 3+), `useQueryParams` zod 통합(Phase 3 첫 사용처), react-query 기본 옵션·MutationCache 우회(Phase 3), 다중 탭 토큰 동기화 등(백엔드 연동 시점)
- **알림 시트 본문** (layout.md §6 Open Q) → Phase 2 공용 컴포넌트 확충

---

## User Stories

- **US1.** 뷰포트 폭 `lg` 미만(<1024px)에서 사이드바가 사라지고 TopNav 좌측에 햄버거가 표시되며, 햄버거 클릭 시 사이드바가 `ui/sheet`로 좌측 슬라이드. 라우트 이동 시 자동 닫힘.
- **US2.** `/admin/*` 진입 시 사이드바가 **본사용 메뉴(`AdminMenus`)** 로 자동 전환되고, 현장(`/*`)에서는 기존 `ServiceMenus`가 유지된다. (라우트 인벤토리 기준 — `screens.md §4`)
- **US3.** TopNav 좌측 "현재 메뉴명" 자리에 현재 라우트에 매칭되는 **메뉴 라벨**이 표시된다(하드코딩 제거).
- **US4.** ProfileBadge 클릭 시 드롭다운 메뉴(로그아웃 / 내 정보)가 열린다. `useMe` 기반으로 사용자명 노출.
- **US5.** AppTable에 페이지네이션 UI(이전/다음 + 페이지 번호 + 전체 표시)가 노출된다. 페이지 번호는 **1-based**(`data-model.md §2-1` 일치).
- **US6.** 기존 `@/components/Button` / `@/components/AppIconButton`을 `@/components/app/AppButton` / `@/components/app/AppIconButton`으로 **파일 이동 + 이름 정합화 + 11개 import 사이트 일괄 갱신**한다. 005의 403/404 액션도 임시 `<Link>` 스타일 → `AppButton`으로 교체.
- **US7.** 다른 개발자가 dev 환경 첫 진입 시 필요한 MSW 셋업 절차(`.env.local` + `npx msw init`)가 docs에 명시된다.

---

## 1. 목적

005에서 AuthGuard·라우팅 게이트가 갖춰진 위에서, Phase 3 이후 화면 작업이 막힘 없이 진행되도록 **셸(사이드바/TopNav/ProfileBadge) 확장 + AppTable 페이지네이션 + AppButton 명명/위치 정합화**를 일괄 마감한다. 동시에 `layout.md` §6 Open Q 4건 중 3건(알림 시트 본문 제외)과 `components.md` §10 Open Q를 해소하고 `design-system.md` D1 Open Q "완료 시점"을 종결한다.

---

## 2. I/O

### Input

- **Sidebar (US1·US2)**
  - 뷰포트 폭(`window.matchMedia('(min-width: 1024px)')` 또는 Tailwind `lg:` 분기)
  - 현재 `location.pathname` → 영역 판별(`isAdminArea`)
- **TopNav 메뉴명 (US3)**
  - `location.pathname` → 라우트 ↔ 메뉴명 매핑 lookup (paths 상수 기반)
- **ProfileBadge (US4)**
  - `useMe()` 캐시: `data.name` / `data.role`
  - 로그아웃 액션 → 토큰 clear + 영역별 로그인 리다이렉트
- **AppTable 페이지네이션 (US5)**
  - tanstack-table `table.getState().pagination` (pageIndex 0-based 내부) → 표시 시 +1 (1-based)
  - 외부 prop으로 `pageSize` 받을 수 있게 (선택. 기본 10 유지)
- **AppButton 마이그 (US6)**
  - 기존 import 사이트 11곳 (zone form / points form / pages / detail 등)
- **MSW 안내 (US7)**
  - 005 수동 회귀 시 셋업한 절차

### Output

- **Sidebar**
  - `lg` 이상: 좌측 고정 사이드바(기존)
  - `lg` 미만: 햄버거 + Sheet 사이드바
  - 영역에 따라 `ServiceMenus` 또는 `AdminMenus` 렌더
- **TopNav**
  - 좌측 라벨: 라우트 매칭된 메뉴명 (예: `/zones` → "구역/지점", `/admin/locations` → "사업장 관리")
  - 비매칭(예: `/403`): 빈 문자열 또는 영역 기본명 (구체 결정은 §3 비즈니스 규칙)
- **ProfileBadge**
  - 드롭다운(`ui/dropdown-menu` 활용): 사용자명 + "내 정보"(placeholder) + "로그아웃"
- **AppTable**
  - 하단에 `이전 / 페이지 N / M / 다음 / 전체 N건` 형태 UI
  - 페이지 변경 시 내부 state 갱신(URL 쿼리스트링 연동은 본 spec 범위 외 — Phase 3 첫 사용처에서 `useQueryParams` 통합)
- **AppButton 마이그**
  - `src/components/Button.tsx` → `src/components/app/AppButton.tsx`
  - `src/components/AppIconButton.tsx` → `src/components/app/AppIconButton.tsx`
  - 11개 import 갱신
  - 005 403/404 액션 `<Link>` 임시 스타일 → `AppButton`(variant=default) 교체
- **MSW 안내**
  - `docs/` 또는 README에 "dev 첫 진입 절차" 섹션 1개 추가

---

## 3. 제약

### 기술 제약

- **재사용 인프라**
  - `ui/sheet` (`@/components/ui/sheet`) — 사이드바 Sheet 래핑
  - `ui/dropdown-menu` (`@/components/ui/dropdown-menu`) — ProfileBadge 메뉴
  - `useMe()` — ProfileBadge 사용자명
  - `clearTokens()` + `redirectToLogin()` — 로그아웃 액션
  - `paths.ts` + `isAdminArea` — 영역 판별, 메뉴명 매핑
  - tanstack-table 기본 페이지네이션 모델 (`getPaginationRowModel`은 이미 적용됨)
- **수정 대상 파일**
  - `src/components/layout/sidebar/sidebar.config.ts` — `AdminMenus` export 추가 + 본사 라우트(`/admin/locations`, `/admin/admins`) 항목
  - `src/components/layout/sidebar/Sidebar.tsx` — 영역 판별 → `ServiceMenus` / `AdminMenus` 분기
  - `src/components/layout/AppLayout.tsx` (또는 신규 래퍼) — `lg` 미만 분기 + Sheet 사이드바 렌더
  - `src/components/layout/topnav/TopNav.tsx` — 메뉴명 lookup + 햄버거 통합
  - `src/components/layout/topnav/ProfileBadge.tsx` — dropdown-menu 통합
  - `src/components/AppTable.tsx` — 페이지네이션 UI footer 추가
  - `src/components/Button.tsx` → `src/components/app/AppButton.tsx` (이동·이름 변경)
  - `src/components/AppIconButton.tsx` → `src/components/app/AppIconButton.tsx` (이동)
  - import 사이트 11곳 + `src/pages/errors/ForbiddenPage.tsx` / `NotFoundPage.tsx` 액션
- **신규 파일**
  - `src/components/layout/menu-lookup.ts` (또는 동등 위치) — 라우트 → 메뉴명 매핑 SSOT
  - `README.md` 또는 `docs/dev-setup.md` — MSW 첫 진입 안내 (작은 chore)
- **테스트**
  - vitest: `menu-lookup` 매핑, AppTable 페이지네이션 UI 동작(다음/이전/페이지 번호), ProfileBadge 로그아웃 액션
  - 모바일 Sheet는 jsdom의 `matchMedia` mock으로 단위 테스트(렌더 분기) + 시각 검증은 dev 수동

### 비즈니스 규칙

- **영역별 사이드바 선택**: `isAdminArea(location.pathname)` 단일 기준.
- **본사 사이드바 메뉴 (라우트 인벤토리 기준 — screens.md §4)**:
  - `사업장 관리` → `/admin/locations` (activeUrl: `['/admin/locations']`)
  - `관리자 관리` → `/admin/admins` (activeUrl: `['/admin/admins']`)
  - 그룹 헤더: `"본사 관리"` (layout.md §2-2 본사 사이트 메뉴 명세)
- **TopNav 메뉴명 매핑**
  - 우선순위: 정확 매칭(`pathname === url`) → prefix 매칭(`pathname.startsWith(activeUrl[i])`) → 빈 문자열
  - 매핑 데이터는 sidebar.config의 `ServiceMenus` + `AdminMenus`에서 자동 도출 (DRY)
- **ProfileBadge 드롭다운**
  - "내 정보"는 placeholder(클릭 시 `console.log` 또는 비활성). 실 화면은 별도 spec.
  - "로그아웃": `clearTokens()` → react-query `meQueryKey` invalidate → 영역별 로그인으로 이동
- **AppTable 페이지네이션**
  - 페이지 번호 표시: `현재 페이지(1-based) / 전체 페이지`
  - 이전/다음 비활성 처리(첫/마지막 페이지)
  - 페이지 사이즈는 본 spec에서 prop 추가만(기본 10 유지)
  - URL 쿼리 연동은 Phase 3 첫 사용처에서 (본 spec 범위 외)
- **AppButton 마이그 (옵션 1 — 사용자 확정)**
  - `Button.tsx` → `app/AppButton.tsx`, default export 이름을 `AppButton`으로 변경
  - `AppIconButton.tsx` → `app/AppIconButton.tsx` 이동
  - 11개 import 사이트 일괄 갱신
  - `design-system.md` D1 §2-3 경로 표기 갱신, D1 Open Q "완료 시점" 종결(체크박스 [x])
  - shadcn `ui/button.tsx`는 그대로 유지(`dialog`/`sheet`/`alert-dialog` 내부 의존 — Phase 6에서 별도 검토)
- **모바일 Sidebar Sheet**
  - 라우트 이동 감지: `useLocation` + `useEffect` → Sheet `open` 상태 자동 false
  - 햄버거 아이콘: `MenuIcon` (lucide-react), `lg:hidden` 클래스로 노출 제어

---

## 4. 엣지 케이스

공통 규칙 따름. 다만 본 spec 고유:

- AppButton 마이그 중 일부 사이트가 임시 build 깨질 수 있음 → 한 PR/commit에서 이동·rename·import 갱신을 묶어서 처리.
- TopNav 메뉴명 매핑에서 비매칭 경로(`/403`, `/404`)는 빈 문자열 노출.
- ProfileBadge 로그아웃 시 react-query 캐시 invalidate 누락 방지(이후 다른 화면에서 stale `useMe` 사용 위험).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [ ] `src/components/layout/sidebar/sidebar.config.ts`에 `AdminMenus` export 추가 + 본사 메뉴 2건 (`사업장 관리`, `관리자 관리`)
- [ ] `Sidebar.tsx`가 `isAdminArea` 분기로 `ServiceMenus`/`AdminMenus` 자동 전환
- [ ] AppLayout 또는 동등 래퍼에서 `lg` 미만 분기로 햄버거 + Sheet 사이드바 렌더 (시각 검증은 dev 수동)
- [ ] TopNav 좌측 라벨이 현재 라우트의 메뉴명으로 동적 변경 (정확 매칭 + prefix 매칭)
- [ ] ProfileBadge가 dropdown-menu 기반 드롭다운 노출 + 로그아웃 액션(토큰 clear + meQueryKey invalidate + 영역별 로그인 이동)
- [ ] AppTable 페이지네이션 UI(이전/다음/페이지 N/M/전체 N건)가 테이블 하단 노출, 1-based 표시
- [ ] `src/components/Button.tsx` → `src/components/app/AppButton.tsx` 이동 + default export 이름 `AppButton`
- [ ] `src/components/AppIconButton.tsx` → `src/components/app/AppIconButton.tsx` 이동
- [ ] 11개 import 사이트 갱신(grep 결과 `@/components/Button` / `@/components/AppIconButton` 0건)
- [ ] 005의 ForbiddenPage/NotFoundPage 액션 임시 `<Link>` → `AppButton`(`variant="default"`) 교체
- [ ] `docs/design-system.md` D1 §2-3 경로 갱신 + D1 Open Q "완료 시점" 체크박스 [x] 종결
- [ ] `docs/layout.md` §6 Open Q 3건(본사 사이드바 / TopNav 메뉴명 / ProfileBadge 메뉴) 해소 표시 [x]
- [ ] `docs/components.md` §10 Open Q "AppTable 페이지네이션 UI" 해소 표시 [x]
- [ ] MSW 첫 진입 절차 docs 추가 (README 또는 docs/dev-setup.md 1개 섹션)
- [ ] vitest 단위 테스트 — 메뉴명 lookup(매칭/비매칭), AppTable 페이지네이션 동작(다음/이전/경계), ProfileBadge 로그아웃 액션 (최소 5 case 추가)
- [ ] `npm run verify` exit 0
- [ ] `npm run test` 전체 통과
- [ ] `docs/roadmap.md` §11 갱신 — `1 Layout Plus — 006 shell/table ☑`, `1 Layout Plus` 전체 ☑

---

## 참고 (선택)

- 관련 문서:
  - `docs/layout.md` §2·§3·§5·§6 (사이드바 / TopNav / 모바일 / Open Q)
  - `docs/components.md` §9·§10 (AppTable + Open Q)
  - `docs/design-system.md` D1 (AppButton 단일 표준)
  - `docs/screens.md` §2·§4 (본사 라우트 인벤토리)
  - `docs/data-model.md` §2-1 (1-based 페이지)
- 후속 spec(Phase 3+) 화면이 본 spec 결과 위에서 동작:
  - 페이지네이션 URL 쿼리 연동은 Phase 3 `/patrol/zones` spec에서 `useQueryParams`와 통합
  - 본사 사이드바 실 화면은 Phase 5 본사 영역 spec
