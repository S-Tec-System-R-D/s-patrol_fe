# 006 수동 회귀 — Phase 1 종료 조건 검증

> roadmap.md §4 Phase 1 종료 조건 3건:
> 1. 모바일에서 사이드바 동작 확인 (US1)
> 2. 새 화면이 페이지네이션 컴포넌트 그대로 사용 가능 (US5)
> 3. 비인증 진입 시 라우트별 적절한 로그인 화면으로 리다이렉트 (005에서 검증 완료, 본 spec에서 재확인)

---

## 사전 준비

005와 동일:
1. `npm run dev` 실행
2. 토큰 케이스 검증 시 Console에 `localStorage.setItem('auth.accessToken', 'mock-token')`
3. `.env.local`(`VITE_USE_MSW=true`) + `public/mockServiceWorker.js` 셋업

---

## 회귀 케이스

### US1 — 모바일 햄버거 + Sidebar Sheet

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 1 | PC 폭에서 사이드바 노출 | viewport ≥1024px(lg) | 좌측 고정 사이드바 노출, 햄버거는 보이지 않음 | ✓ |
| 2 | 모바일 폭에서 사이드바 숨김 | viewport <1024px(예: 800px) | 좌측 사이드바 숨김, TopNav 좌측에 햄버거 노출 | ✓ |
| 3 | 햄버거 클릭 시 Sheet | 햄버거 클릭 | 좌측에서 Sheet 슬라이드(사이드바 동일 내용 노출) | ✓ |
| 4 | Sheet 안 메뉴 클릭 시 자동 닫힘 | Sheet 안 메뉴 항목 클릭 | Sheet 닫히고 해당 라우트로 이동 | ✓ |

### US2 — 본사 사이드바 분기

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 5 | 현장 영역 → ServiceMenus | `/zones` 진입 | 사이드바: "관리(순찰이력/구역·지점)" + "알림(공지사항)". `ADMIN` 뱃지 X | ✓ |
| 6 | 본사 영역 → AdminMenus | `/admin/locations` 진입 | 사이드바: "본사 관리(사업장 관리/관리자 관리)" + 헤더 우측 `ADMIN` 뱃지 | 스킵 (MSW default role=FIELD_MANAGER, admin role 검증은 단위 테스트로 대체) |

### US3 — TopNav 메뉴명 동적

| # | 케이스 | URL | 기대 결과 | 결과 |
|---|---|---|---|---|
| 7 | 정확 매칭 | `/zones` | TopNav 좌측 "구역/지점" | ✓ |
| 8 | prefix 매칭 | `/patrol/points` | TopNav 좌측 "순찰이력" (`activeUrl`로 매칭) | ✓ |
| 9 | admin 정확 매칭 | `/admin/locations` | TopNav 좌측 "사업장 관리" | 스킵 (admin role MSW 핸들러 수정 필요 — 단위 테스트로 대체) |
| 10 | 비매칭 | `/403` | TopNav 좌측 빈 문자열 | ✓ |

### US4 — ProfileBadge 드롭다운

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 11 | 드롭다운 노출 | 우상단 프로필 아바타 클릭 | "홍길동(또는 useMe 응답 이름)" / "내 정보(disabled)" / "로그아웃" 노출 | ✓ |
| 12 | 로그아웃 — 현장 | `/zones`에서 로그아웃 클릭 | `localStorage` 토큰 사라짐 + `/login`으로 이동 | ✓ |
| 13 | 로그아웃 — admin | `/admin/locations`에서 로그아웃 클릭 | `/admin/login`으로 이동 | 스킵 (admin role 진입 자체가 차단 — 단위 테스트로 대체) |

### US5 — AppTable 페이지네이션 (외부 사용처 0건 — 직접 확인은 단위 테스트로 대체)

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 14 | 단위 테스트 통과 | `npm run test src/components/__tests__/AppTable.test.tsx` | 3 case green | ☑ (자동) |

### US6 — 005 액션 AppButton 교체

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 15 | 403 페이지 액션 | 토큰+FIELD_MANAGER role로 `/admin/locations` 진입 → `/403` 이동 후 "홈으로 이동" 클릭 | AppButton(variant default) 스타일 + 클릭 시 `/zones` 진입 | ✓ |
| 16 | 404 페이지 액션 | `/zzz-not-exist` 진입 → "홈으로 이동" 클릭 | AppButton 스타일 + 본인 영역 홈으로 진입 | ✓ |

### Phase 1 종료 조건 — 005 재확인

| # | 케이스 | 절차 | 기대 결과 | 결과 |
|---|---|---|---|---|
| 17 | 비인증 진입 시 로그인 리다이렉트 | `localStorage.clear()` 후 `/zones` 진입 | `/login?redirect=/zones`로 이동 | ✓ |

---

## 결과 기록

- 실행일: 2026-06-23
- 빌드: `npm run dev` (Vite v8.0.12, port 5175 — 5173/5174 점유)
- 환경: `.env.local`(`VITE_USE_MSW=true`) + `public/mockServiceWorker.js`
- 결과 요약: **케이스 6·9·13(admin role 진입) 스킵 외 전 케이스 ✓** — 사용자 직접 진입 검증 완료

### 발견 이슈 + 보완

- **이슈 1 — MobileSidebar Sheet 우측 공백** (검증 중 발견)
  - 증상: lg 미만에서 햄버거 클릭 시 SheetContent가 ~384px(`sm:max-w-sm`)로 노출 + 내부 Sidebar는 `w-70`(280px) 고정 → 우측 ~104px 공백
  - 원인: shadcn `SheetContent`의 기본 클래스 `data-[side=left]:w-3/4 sm:max-w-sm`이 살아남음. 추가 `w-70` 클래스가 data-variant 충돌 해결을 못 함
  - 수정: `MobileSidebar.tsx`의 SheetContent className을 `data-[side=left]:w-70 sm:data-[side=left]:max-w-70`으로 변경 → 280px 고정 + 우측 공백 제거 ✓
