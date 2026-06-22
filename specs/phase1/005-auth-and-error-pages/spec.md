# 005-auth-and-error-pages spec

> 위험도: **A** (출처: `roadmap.md` §4 — AuthGuard 실제화 = A, 401/403/404 = B지만 인증·권한 게이트와 결합되므로 본 spec 전체를 **A급**으로 작성)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md#3-공통--보조-화면) §3 (401·403·404), [`docs/flow.md`](../../../docs/flow.md) §0·§3-2
> Phase: roadmap.md Phase 1 (Layout Plus, 전반부 — 가드·라우팅 축)
>
> **분량 가이드**: A급 → 5축 풀 작성

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `specs/phase0/004-dev-infrastructure/` (Phase 0 종료). `tasks.md` 맨 아래 "다음 spec으로 이월" 블록 중 **본 spec이 흡수**할 항목:

- [ ] **AuthGuard 실제화** (004 이월) — 003 인증 인프라(`useMe` / `<RequireRole>` / 토큰 헬퍼 / `redirectToLogin` / 401 single-flight refresh) 위에 본체 연결. 영역별 분기는 `paths.adminLogin` / `paths.serviceLogin` + `isAdminArea`. → **본 spec US1**
- [ ] **`<RequireRole>` 라우트 가드 변형 필요 여부** (004 이월) — 라우트 단위 role 분기 패턴 결정. → **본 spec US2**에서 결정·반영
- [ ] **002 T029 수동 회귀** (004 이월 — AppTabs/LocationTabs/PointsPage/ZonesPage) — AuthGuard 실제화 후 동시 검증. → **본 spec DoD**에 흡수
- [ ] **003 인증 인프라 단위 테스트** (004 이월) — single-flight refresh / `<RequireRole>` 분기 / `redirectToLogin`. → 본 spec 작업 흐름에 자연 흡수. 단위 테스트 작성은 본 spec US1·US2 변경 위주로 좁힘.

본 spec 범위 외(다음 spec으로 재이월):
- 모바일 햄버거/Sidebar Sheet, 본사 사이드바 config, TopNav 메뉴명, ProfileBadge, AppTable 페이지네이션, **AppButton 마이그레이션** → `006-shell-and-table`
- AppInput → AppFormField 마이그(Phase 3 화면 spec), MSW 핸들러 도메인 이관(Phase 3+), `useQueryParams` zod 통합(Phase 3 첫 사용처), MSW init(별도 안내), 다중 탭 토큰 동기화 등(백엔드 연동 시점)

---

## User Stories

- **US1.** 비인증 사용자 또는 토큰이 만료된 사용자가 보호된 라우트(`/*` 또는 `/admin/*`)에 진입하면, 영역별 로그인 화면(`/login` 또는 `/admin/login`)으로 자동 리다이렉트되며 진입하려던 경로가 `?redirect=`로 보존된다.
- **US2.** 인증은 되었으나 권한이 없는 사용자(예: 현장관리자가 `/admin/*` 진입)가 접근 불가 라우트에 진입하면, **403 화면**으로 차단되고 본인 영역 홈으로의 복귀 동선이 제공된다.
- **US3.** 등록되지 않은 URL(`/*` 또는 `/admin/*` 영역의 비매핑 경로)로 접근하면 **404 화면**이 표시되며 본인 영역 홈 진입 동선이 제공된다.
- **US4.** 토큰 만료 → 자동 refresh 실패 흐름에서 사용자에게 **401 상태**(만료/재로그인 안내) 화면 또는 즉시 로그인 리다이렉트 둘 중 하나로 일관되게 처리된다.

> US4는 화면 컴포넌트로 노출할지(별도 401 페이지) vs 인터셉터의 즉시 리다이렉트로 끝낼지를 본 spec에서 결정한다 → §3 비즈니스 규칙 참고.

---

## 1. 목적

Phase 0에서 인증 인프라(`useMe` / 토큰 / `redirectToLogin` / 401 refresh / `<RequireRole>`)만 구축되어 있고 **AuthGuard는 `isAuthentication = true` 하드코딩 상태**다. 본 spec은:

1. AuthGuard를 **실제 토큰·사용자 상태 기반**으로 동작시키고
2. 라우트 단위 권한 분기 패턴(`<RequireRole>` 라우트 변형)을 결정·도입하고
3. 401/403/404 상태 화면을 라우터에 등록해

후속 Phase(3~5)의 모든 화면이 동일한 인증·권한 게이트 위에 안전하게 작업되도록 한다.

---

## 2. I/O

### Input

- **AuthGuard**
  - `useMe()` 캐시 (queryKey `['auth','me']`): `data` / `isLoading` / `isError`
  - `getAccessToken()` (`src/lib/auth/tokens.ts`)
  - 현재 라우트의 `location.pathname` (영역 판별용)
- **라우트 단위 권한 가드(예: `<RequireRoute roles=...>`)**
  - 진입 시점 `useMe` 결과 + 허용 role 배열
- **401/403/404 페이지**
  - 라우트 파라미터 없음. 표시 후 사용자 액션(홈 이동/로그인 재시도) 트리거

### Output

- **AuthGuard 분기**
  - 토큰 없음 또는 `useMe` 실패(`401 refresh도 실패`) → `redirectToLogin(currentPath)` 호출 → 영역별 로그인 화면 + `?redirect=` 보존
  - 토큰 있음 + `useMe` 로딩 → 로딩 fallback (현재는 단순 `null` / 최소 placeholder, 디테일 UX는 Phase 3에서 별도 패턴)
  - 토큰 있음 + `useMe` 성공 → `<AppLayout />` 렌더
- **라우트 권한 분기**
  - role 불일치 → `<Navigate to=403>` 또는 직접 403 컴포넌트 렌더 (§3 비즈니스 규칙에서 정책 확정)
- **상태 페이지 라우트 등록**
  - `*` (404) — 어느 영역에도 매핑되지 않는 경로
  - 403 / 401 — 가드 응답으로만 노출. 직접 URL 진입은 404로 흡수
- **외부 효과**
  - 토큰 무효 시 `clearTokens()` 호출 후 리다이렉트
  - react-query 캐시 `meQueryKey` invalidate

---

## 3. 제약

### 기술 제약

- **재사용 인프라(이미 존재, 그대로 사용)**
  - `src/features/auth/hooks/useMe.ts` — 본인 정보 훅
  - `src/features/auth/components/RequireRole.tsx` — UI 액션 권한 가드 (라우트 변형은 본 spec에서 신설)
  - `src/lib/auth/tokens.ts` — 토큰 헬퍼
  - `src/lib/auth/redirect.ts` — `redirectToLogin(currentPath)`
  - `src/router/paths.ts` — `paths.adminLogin` / `paths.serviceLogin` / `isAdminArea`
  - axios 인터셉터 (`src/lib/axios.ts`) — 401 single-flight refresh
- **수정 대상 파일**
  - `src/router/guards/AuthGuard.tsx` — `isAuthentication = true` 제거, 실제 분기 도입
  - `src/router/index.tsx` — 403/404 라우트 추가 (필요 시 401)
  - `src/features/auth/components/` — 라우트 가드 변형 신설 위치 (예: `RequireRoute.tsx` 또는 AuthGuard 내 role prop 통합)
  - `src/pages/errors/` (신설) — `NotFoundPage.tsx`, `ForbiddenPage.tsx`, (`UnauthorizedPage.tsx`는 §3 비즈니스 규칙 결정에 따라)
- **컴포넌트 컨벤션**
  - 새 페이지는 `AppEmpty` 또는 동등한 빈 상태 패턴 + `AppButton`(Phase 1 후반부 `006`에서 도입) 사용
  - 본 spec 작성 시점엔 AppButton 마이그가 미완 → **에러 페이지의 액션 버튼은 placeholder 수준**으로 두고 `006` 완료 후 동시 갱신 (또는 본 spec에서 임시 `<button>` + 최소 스타일)
  - `react-refresh/only-export-components` 회피: 라우트 외부 export 분리 규칙 유지(002 컨벤션)
- **테스트 인프라**
  - vitest + RTL + MSW 사용 (Phase 0 도입). AuthGuard 분기·라우트 가드 분기는 MSW로 `/api/auth/me` 200/401 시나리오 구성

### 비즈니스 규칙

- **영역 판별**: `isAdminArea(pathname)` 단일 기준. AuthGuard·redirect·라우트 가드 모두 동일 헬퍼 사용.
- **권한 매트릭스(roadmap §1 + CLAUDE.md B1)**
  - 근무자: WEB 접근 불가 → AuthGuard 진입 자체에서 차단(403)
  - 현장관리자: `/*`만 허용, `/admin/*` 진입 시 403
  - Admin 3종(시스템관리자/Master/Manager): 양쪽 모두 허용
- **권한 실패 시 처리** (screens.md §6 Open Q 해소 필요)
  - **본 spec 결정**: 403 화면을 명시 표시(자동 리다이렉트 X). 본인 영역 홈으로의 복귀 액션을 화면에 둠.
  - 사유: 자동 리다이렉트는 사용자 혼란 + 디버깅 어려움. 명시 페이지가 더 안전.
  - (반대 의견·재결정은 본 spec 검토 게이트에서 받음)
- **401 처리 방식 결정**: 별도 401 화면 컴포넌트는 **만들지 않는다**. 사유 — 401은 항상 인터셉터가 즉시 refresh 시도하고 실패 시 `redirectToLogin`이 로그인 화면으로 보낸다. 사용자가 401 상태 페이지에 머무를 시점이 사실상 없음. (예외: 새로고침 시 토큰만 살아있고 me 호출이 401 → refresh도 실패 → 로그인 페이지로 보냄. 이 흐름도 401 화면 불필요.)
- **`<RequireRole>` 라우트 변형 결정**: 별도 `<RequireRoute>` 신설 vs `<RequireRole>` 그대로 라우트에서 사용 vs AuthGuard에 `roles` prop 통합
  - **본 spec 권장안**: `<RequireRoute roles=[...]>` 신설 (`features/auth/components/RequireRoute.tsx`). 사유 — UI 액션용 `<RequireRole>`은 fallback 렌더 패턴, 라우트는 403 페이지 redirect 패턴으로 동작이 다름. 같은 이름으로 두 패턴을 섞으면 사용처에서 혼동. (이건 검토 게이트에서 사용자 OK 받기)
- **`?redirect=` 회복 동선**은 본 spec 범위 외(로그인 화면 = Phase 3 `/login` spec에서 처리). 본 spec은 **쓰는 쪽**만 보장.

---

## 4. 엣지 케이스 (A급 풀 작성)

- **토큰 있음 + `useMe` 200**: 정상 진입.
- **토큰 없음**: AuthGuard 진입 즉시 `redirectToLogin(currentPath)`. (`useMe` 호출 자체 안 함 — 불필요한 401 발생 회피)
- **토큰 있음 + `useMe` 401**: 인터셉터가 refresh 시도. 성공 시 retry → 200으로 흡수. 실패 시 `redirectToLogin`. AuthGuard는 그 사이 **로딩 상태**를 유지(깜빡임 방지).
- **토큰 있음 + `useMe` 500/네트워크 에러**: react-query `isError` true. AuthGuard는 401과 동일하게 `redirectToLogin`까지 보내면 사용자 경험이 나쁨. → **결정**: 500/네트워크는 별도 에러 메시지 표시 후 재시도 버튼 (Phase 0의 `AppErrorBoundary`와 결이 다름 — 가드 단위 처리). 본 spec에서 최소 구현: 콘솔 에러 + 로딩 무한 표시 회피용 fallback 메시지 1줄. 디테일 UX는 Phase 2.
- **권한 부족 — 현장관리자가 `/admin/*` 진입**: AuthGuard 통과(인증 OK) → 라우트 가드(`<RequireRoute>`)에서 403 페이지 렌더.
- **권한 부족 — Admin이 근무자 전용 화면 진입(해당 없음)**: 근무자 WEB 전용 화면 없음. 케이스 발생 안 함.
- **세션 중 role 변경(서버 측)**: 다음 `useMe` 갱신 시 반영. 본 spec은 추가 처리 없음(react-query staleTime 기본 사용).
- **다중 탭**: 다중 탭 토큰 동기화는 003 이월로 백엔드 연동 시점에 처리. 본 spec 범위 외.
- **404 — 등록 안 된 경로**: 인증 영역 안에서도 미매핑은 404. `/admin/존재안함` → AuthGuard 통과 + `<RequireRoute roles=[admin3종]>` 통과 + path 미매핑 → 404. 비인증 상태에서 `/admin/존재안함` → AuthGuard 차단 → 로그인 리다이렉트(404보다 인증 우선).
- **로딩 깜빡임**: 새로고침 시 `useMe` 로딩 동안 children을 렌더하지 않음(잠깐의 빈 화면 허용). 명시적 스피너는 본 spec 범위 외.
- **`?redirect=` 무한 루프**: redirect 파라미터가 다시 로그인 페이지를 가리키는 경우 — 로그인 화면(Phase 3)에서 처리. 본 spec은 가드 단계에서 무한 루프 발생할 수 없음(가드 안 → 가드 안 점프 없음).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필수**.

- [ ] `src/router/guards/AuthGuard.tsx`에서 `isAuthentication = true` 하드코딩 제거 + 실 토큰/`useMe` 분기 도입
- [ ] AuthGuard가 토큰 없음 / `useMe` 실패 시 `redirectToLogin(currentPath)` 호출 (영역별 분기 확인)
- [ ] AuthGuard가 로딩 상태에서 children 렌더하지 않음(깜빡임 방지)
- [ ] 라우트 단위 권한 가드(`<RequireRoute>` 또는 동등 패턴) 컴포넌트 신설 및 1개 이상 적용 예시 등록
- [ ] 403 페이지(`ForbiddenPage`) 신설 + 라우트 등록 + 본인 영역 홈 복귀 액션
- [ ] 404 페이지(`NotFoundPage`) 신설 + `*` catch-all 라우트 등록 + 본인 영역 홈 진입 동선
- [ ] 401 별도 페이지는 **만들지 않음**(§3 비즈니스 규칙) — 의사결정 명시 docs 반영(`screens.md` §3 또는 §6 Open Q 갱신)
- [ ] `screens.md` §6 Open Q "권한 실패 시 리다이렉트 정책" 해소(본 spec 결정 = 403 명시 표시) 반영
- [ ] **002 T029 수동 회귀** — AppTabs / LocationTabs / PointsPage / ZonesPage 4개 화면이 AuthGuard 실제화 후에도 정상 진입·렌더되는지 확인 (체크리스트 결과 명시)
- [ ] vitest 단위 테스트 — AuthGuard 분기(토큰 없음 / 200 / 401) + `<RequireRoute>` 분기(role 일치/불일치) MSW 시나리오 기반 (최소 4 case)
- [ ] `npm run verify` exit 0
- [ ] `npm run test` 본 spec 추가 테스트 포함 전체 통과
- [ ] `docs/roadmap.md` §11 진행 추적 매트릭스에 `Phase 1 Layout Plus — 005 auth/error` 항목 추가 또는 갱신 (DoD 통과 시 ☑)

---

## 참고 (선택)

- 관련 문서:
  - `docs/screens.md` §3 (공통/보조 화면), §4 (라우트 매핑), §6 (Open Q — 권한 실패 정책)
  - `docs/flow.md` §0 (가드), §3-2 (401 흐름)
  - `docs/roadmap.md` §4 (Phase 1)
  - `specs/phase0/003-auth-foundation/` (인증 인프라 구축)
  - `specs/phase0/004-dev-infrastructure/` (paths SSOT / 이월 블록)
- 후속 spec(`006-shell-and-table`)이 본 spec 결과 위에서 동작:
  - TopNav/ProfileBadge가 `useMe` + AuthGuard 통과 가정으로 작성됨
  - 본사 사이드바 config(`AdminMenus`)는 본 spec의 라우트 가드 결정과 정합
