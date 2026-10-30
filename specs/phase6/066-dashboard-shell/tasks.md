# 066-dashboard-shell tasks

> **경량 작업(사용자 결정 2026-10-30)** — `workflow-protocol.md` §0 의 "새 화면 없음" 조건에는 어긋나지만, 본문이 placeholder 뿐이라 spec 없이 기록만 남긴다. API 변화 없음.
> 사용자 요청(2026-10-30): 현장관리자 로그인 시 코스/지점으로 가는데, 메인인 대시보드를 만들고 로그인 · 사업장 전환 후 그리로 보내자. 본문은 placeholder.

## 결정 (사용자 확정 2026-10-30)

| 항목 | 결정 |
|---|---|
| URL | **`/dashboard`** — `/` 는 랜딩(현장 로그인)이 쓴다 |
| 메뉴 | **맨 앞**, 이름 `대시보드`, 아이콘 `LayoutDashboard` — 레일 · floating nav 공용(`ServiceMenus`) |
| 현장 홈 | `/zones` → **`/dashboard`** — 로그인 착지 · 사업장 전환 착지 · 403/404 "홈으로"(`homePath`). 020 의 "현장 홈 = `/zones`" 를 뒤집는다 |
| 본문 | placeholder — 제목 · 사업장명 부제 · `AppEmpty`("대시보드 준비 중"). 무엇을 보여줄지는 미정 |
| 그대로 둔 것 | `ProgressPage`(진행 중인 순찰 현황, 라우트 미연결) — 대시보드와 별개 |

---

## Phase 1: 수정

- [x] T1097 경로 · 라우트 · 페이지 in src/router/paths.ts · src/router/index.tsx · src/pages/service/dashboard/DashboardPage.tsx — `paths.service.dashboard` · 현장 셸 첫 자식
- [x] T1098 메뉴 in src/components/layout/sidebar/sidebar.config.ts — 맨 앞 `대시보드`(6개)
- [x] T1099 홈 전환 in src/features/auth/lib/homePath.ts · loginResult.ts · src/components/layout/ServiceLayout.tsx — 로그인 착지 · 사업장 전환 이동 · 오버레이 해제 경로 확인을 `/dashboard` 로

## Phase 2: 검증 · 문서

- [x] T1100 테스트 — `homePath` · `loginResult` · `LandingLogin` · `LandingPage`(홈 라우트 `/dashboard`) · `ServiceLayout`(홈 probe `/dashboard`) · `RailSidebar` · `FloatingNav`(메뉴 6개) · e2e `open-landing`(착지) · `open-service`(대시보드 열림 1건 추가) · `flow-service` S8(전환 뒤 부제 사업장명 확인 → 코스/지점으로 가서 목록 확인)
  - 결과: `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) · `npm run test` 1501/1501 · `npm run e2e` 39/39. 브라우저 확인 완료(사용자, 2026-10-30)
- [x] T1101 문서 — `screens.md` §1-1 대시보드 행 · 사업장 전환 착지 · §4 라우트 · `flow.md` §0 다이어그램 · 사업장 전환 · 066 변경 메모 · 사이드바 다이어그램 · §4 OQ 종결 · `roadmap.md` 066 행
