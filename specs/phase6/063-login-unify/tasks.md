# 063-login-unify tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 **B** — 화면 단위로 크게.

## 구현 방향

| 문제 | 방법 |
|---|---|
| `/login` 을 쓰는 곳이 여럿(가드 · 로그아웃 · 401 · 403/404 · `homePath`) | 전부 `paths.serviceLogin` 상수다 → 값만 `/` 로. 코드 사용처는 그대로 |
| 두 로그인이 같은 틀 | 062 랜딩의 틀을 `LoginLanding`(안내 문구 prop) 으로 옮기고, `LandingPage` · `AdminLoginPage` 가 문구만 다르게 쓴다 |
| 쓸 곳이 없어지는 것 | `LoginPage.tsx` · `LoginForm`(작은 카드 틀) 삭제. 파일은 `LoginPanel.tsx` 로 이름을 맞춘다 |

---

## Phase 1: US1 · US2

- [x] T1080 [US1] 경로 in src/router/paths.ts(`serviceLogin` = `/`) · src/router/index.tsx(`/login` → `<Navigate to="/" replace />` · `LoginPage` 라우트 삭제)
- [x] T1081 [US2] 틀 공용화 in src/features/landing/components/LoginLanding.tsx(062 `LandingPage` 의 틀) · src/pages/auth/LandingPage.tsx · src/pages/auth/AdminLoginPage.tsx
- [x] T1082 정리 — src/pages/auth/LoginPage.tsx 삭제 · src/features/auth/components/LoginForm.tsx → LoginPanel.tsx(작은 카드 틀 삭제). 🔄 두 화면 모두 제목을 굵게 써서 062 의 `titleClassName` 을 지우고 제목 기본을 `font-bold` 로

- [x] T1087 [US3] 다른 사이트 계정 차단(구현 중 추가 — 사용자 2026-10-30) in src/features/auth/lib/loginResult.ts(`resolveLoginOutcome(code, area)` · `blocked.link`) · src/features/auth/components/LoginPanel.tsx(`area` · 안내 옆 링크) · LoginLanding.tsx · LandingPage.tsx · AdminLoginPage.tsx · 테스트(loginResult · LandingLogin · LandingPage · AdminLoginPage — 020 의 "본사 계정 → 본사 홈" · "현장 코드 → 현장 홈" 테스트를 차단으로 뒤집음)

## Phase 2: 검증 · 문서

- [x] T1083 테스트 대상 `/login` → `/` in src/pages/auth/__tests__/LoginPage.test.tsx(→ LandingLogin.test.tsx · `LandingPage`) · AdminLoginPage.test.tsx(제목) · AuthGuard · LogoutButton · RequireRoute · homePath 테스트 · e2e/support/session.ts · e2e/guards.pw.ts
- [x] T1084 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` 1504/1504 병렬 · `npm run e2e` 37/37(가드 `/login` → `/` 1건 추가) — T1087 반영 후 재실행
- [x] T1085 브라우저 확인(`/` · `/login` · `/admin/login` · 1280 · 390 — 사용자 확인 2026-10-30) — 🔄 확인 중 수정(사용자 2026-10-30): 본사 제목 옆 **`관리자` 배지**(`LoginPanel` `titleBadge` · `bg-rail` 둥근 배지 · 읽기 이름 "S-Patrol 관리자") in src/features/auth/components/LoginPanel.tsx · LoginLanding.tsx · AdminLoginPage.tsx
- [x] T1086 문서 — `screens.md` · `flow.md`(규칙 · 다이어그램 4곳) · `overview.md` · `CLAUDE.md` B1 · `roadmap.md` 063 행

---

## Dependencies & Execution Order

- T1080 · T1081 → T1082 → T1083 → T1084 → T1085 → T1086

---

## 다음 spec으로 이월

- **OQ-062-B** 슬라이드 · 안내 문구(현장 · 본사) 확정 — 그대로.
- 059 OQ(F) · 057 OQ(A · B) · 056 OQ(A)는 그대로 범위 외.
