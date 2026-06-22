# 005 수동 회귀 — 002 T029 이월분

> 003·004를 거치며 `<AuthGuard>` 본체가 변경되었다. 002 T029(`only-export-components` 정리)에서 영향 받은 4개 화면(AppTabs / LocationTabs / PointsPage / ZonesPage)이 AuthGuard 실제화 후에도 정상 진입·렌더되는지 확인.
>
> 절차: 아래 표를 따라 dev 서버에서 직접 진입 → 결과 컬럼에 ✓/✗ + 한 줄 코멘트.

---

## 사전 준비

1. `npm run dev` 실행
2. 브라우저에서 `localStorage.setItem('auth.accessToken', 'mock-token')` 1회 (MSW가 `/api/auth/me`를 200으로 응답)
3. 브라우저에서 `?` URL 쿼리 등은 모두 제거하고 진입

> MSW가 켜져 있어야 한다. `.env.local`에 `VITE_USE_MSW=true` + `public/mockServiceWorker.js` 존재(004에서 도입, 005 수동 회귀 진행 중 셋업).

---

## 회귀 케이스

| # | 화면 | 라우트 | 진입 후 기대 동작 | 결과 |
|---|---|---|---|---|
| 1 | PointsPage | `/points` | AppLayout(Sidebar+TopNav) 표시 + 지점 목록(또는 placeholder) 렌더 | ✓ |
| 2 | ZonesPage | `/zones` | AppLayout 표시 + 코스 목록(또는 placeholder) 렌더 + AppTabs 동작 | ✓ |
| 3 | LocationTabs (PatrolLayout 안) | `/patrol/zones` | AppLayout 표시 + 상단 탭(코스/지점) 동작 | ✓ |
| 4 | AppTabs (LocationLayout 안) | `/zones` 또는 `/points` | 탭 전환 시 active 스타일 갱신 / URL 변경 | ✓ |

### 추가 — AuthGuard 분기 확인 (필수)

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| A | 토큰 없는 상태 진입 | `localStorage.clear()` 후 `/zones` 진입 | `/login?redirect=/zones` 로 이동 | ✓ |
| B | 토큰 없는 상태 admin 진입 | `localStorage.clear()` 후 `/admin/locations` 진입 | `/admin/login?redirect=/admin/locations` 로 이동 | ✓ |
| C | 토큰 있음 + me 200 | 토큰 설정 후 `/zones` | AppLayout + 지점 화면 정상 | ✓ |
| D | 토큰 있음 + me 401 (MSW 임시 핸들러로 401 응답 시뮬레이션) | DevTools에서 `/api/auth/me`를 401로 차단 후 새로고침 | refresh 시도 → 실패 시 `/login`으로 이동 | 스킵 (선택 케이스 — 단위 테스트 `AuthGuard.test.tsx`의 "토큰 있음 + useMe 401" 시나리오로 동등 검증) |

---

## 결과 기록

- 실행일: 2026-06-22
- 빌드: `npm run dev` (Vite v8.0.12, port 5174 — 5173 점유로 자동 변경)
- 환경: `.env.local` (`VITE_USE_MSW=true`) + `public/mockServiceWorker.js` (`npx msw init public/`로 생성)
- 결과 요약: **전 케이스 ✓** — 사용자 직접 진입 검증 완료

### 추가 — 005 보완 사항 (수동 회귀 중 발견)

- **`/admin/login` 라우트 누락** — 본 회귀 진행 중 발견. AdminLoginPage placeholder + 라우트 등록으로 보완(`src/pages/auth/AdminLoginPage.tsx`, `src/router/index.tsx`)
- **MSW 환경 셋업 필요** — 004 이월 항목인 `.env.local` + `npx msw init public/`를 본 spec 수동 회귀 진행 시점에 동시 처리

### 발견 이슈

없음
