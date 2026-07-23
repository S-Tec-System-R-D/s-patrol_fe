# 007 수동 회귀 — Redesign Foundation 검증

> spec.md DoD "라우터 / 레이아웃", "사이드바", "정책 / 회귀" 항목 중 시각·행동 확인이 필요한 부분.
> 검증 방식: `npm run dev` + Playwright(headless Chromium) 자동 조작 + 스크린샷 대조. 사람 직접 진입 대신 자동화 스크립트로 각 케이스를 재현하고 결과를 기록.

---

## 사전 준비

1. `npm run dev` (port 5173)
2. `.env.local`(`VITE_USE_MSW=true`) + `public/mockServiceWorker.js`
3. 로그인은 dev 임시 버튼 사용 (`LoginPage`/`AdminLoginPage`의 "현장관리자로 진입" / "시스템관리자로 진입")

---

## 회귀 케이스

### US2 — 라우터 레벨 셸 분리

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 1 | 현장 라우트 → ServiceLayout | `/zones` 진입 | 68px 다크 레일 + TopNav 없음 | ✓ |
| 2 | 현장 라우트 → ServiceLayout | `/patrol/zones` 진입 | 동일 셸, 순찰이력 아이콘 활성 | ✓ |
| 3 | 현장 라우트 → ServiceLayout | `/points` 진입 | 동일 셸, 코스/지점 아이콘 활성 | ✓ |
| 4 | 본사 라우트 → AdminLayout | `/admin/locations` 진입 | w-70 Sidebar + TopNav + ADMIN 뱃지 | ✓ |
| 5 | AuthGuard가 Outlet만 렌더 | 인증 성공 시 렌더 트리 확인 | `AuthGuard`는 셸을 직접 그리지 않고 하위 브랜치(ServiceLayout/AdminLayout)가 셸을 그림 | ✓ (AuthGuard.test.tsx로 회귀 고정) |

### US3 — 본사 셸 무변화

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 6 | 본사 시각 무변화 | `/admin/locations` 진입 후 스크린샷 대조(006 상태 vs 007) | PATROL 로고 + ADMIN 뱃지 + 본사 관리 메뉴 2개 + TopNav(메뉴명·알림·프로필) 동일 | ✓ |
| 7 | 본사 콘솔 에러 없음 | 진입 시 브라우저 콘솔 확인 | 에러 0건 | ✓ |

### US1 — 현장 셸 진입

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 8 | 레일 5개 아이콘 flat | `/zones` 진입 | 순찰이력→코스/지점→근무자→배치관리→공지사항 순서로 아이콘 5개, 그룹 헤더 없음 | ✓ |
| 9 | 활성 스타일 | `/zones` 진입 | 2번째 아이콘(코스/지점)에 `bg-rail-2` + 좌측 액센트 바 | ✓ |
| 10 | hover 툴팁 | 3번째 아이콘(근무자) hover | 우측에 "근무자" 라벨 툴팁 노출 | ✓ |
| 11 | 프로필 드롭다운 우측 오픈 | 하단 프로필 아바타 클릭 | 드롭다운이 레일 우측으로 오픈(화면 밖으로 안 나감), 사용자명+내 정보+로그아웃 노출 | ✓ |
| 12 | 미구현 라우트 링크 | 배치관리 아이콘 클릭(`/deployments`, 013/014/015 이전) | 404 페이지로 이동(크래시 없음) — 013/014/015에서 실 페이지 연결 예정 | ✓ (의도된 동작) |

### 정책 — 폰트 / 토큰

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 13 | Pretendard 렌더 | 아무 현장 페이지 진입 | 한글 텍스트가 Pretendard Variable로 렌더(네트워크 탭에서 `PretendardVariable.woff2` 로드 확인) | ✓ |
| 14 | 페이지 자연 스크롤 | 콘텐츠가 긴 현장 페이지(`/patrol/zones`) 진입 | `ServiceLayout`이 `overflow:hidden`을 강제하지 않음(뷰포트 넘는 컨텐츠는 body 스크롤) | ✓ (셸 자체는 스크롤 제약 없음 확인. 개별 페이지 내부 레이아웃 조정은 009~015 범위) |

---

## 결과 기록

- 실행일: 2026-07-23
- 빌드: `npm run dev` (Vite, port 5173)
- 검증 도구: Playwright(headless Chromium, `npx playwright install chromium`으로 임시 설치 — 프로젝트 devDependency에는 추가하지 않음)
- 환경: `.env.local`(`VITE_USE_MSW=true`)
- 결과 요약: **전 케이스 ✓**, 콘솔 에러 0건

### 발견 사항

- **`npm run typecheck`(루트 `tsc --noEmit`) 사실상 no-op** — 루트 `tsconfig.json`이 `files: []` + project references 구조라 `-b` 플래그 없이는 아무 파일도 검사하지 않음. 실제 검사는 `npx tsc --noEmit -p tsconfig.app.json`으로 수행해야 함. 007 범위 밖의 pre-existing 에러 3건 발견(`PointDetail.tsx`, `PointNode.tsx`, `PatrolZonesPage.tsx`) — 007에서 손대지 않음. **별도 이슈로 사용자에게 보고 필요** (인프라 결함, 전체 프로젝트 영향).
- **`@fontsource-variable/pretendard`는 존재하지 않는 패키지명** — 공식 `pretendard` 패키지로 대체 채택(design-system.md D11 갱신).
