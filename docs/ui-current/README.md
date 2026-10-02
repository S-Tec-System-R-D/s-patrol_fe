# UI baseline 캡쳐 (ui-current)

> **목적**: 실 API 연동(`spec 019~`) 착수 **직전의 구현 상태**를 고정한다.
> 연동으로 데이터 형태가 바뀌면 화면도 따라 바뀌는데, 그때 "원래 어땠는지" 비교할 **시작점**이 필요하다.
>
> **`docs/ui-mock/` 과 혼동하지 말 것** — 저쪽은 *의도*(1차 목업), 이쪽은 *현재 구현 결과*다.

---

## 캡쳐 조건 (고정)

조건이 다르면 비교가 무의미해진다. 재캡쳐 시 아래를 반드시 동일하게 유지한다.

| 항목 | 값 |
|---|---|
| 캡쳐일 | **2026-10-02** |
| 커밋 | **`f0a552a`** (`feat : 코스 순찰이력 필터 조립 + URL 연동 (018 Phase 3)`) |
| 뷰포트 | **1280 × 900** (PC 기준. 모바일 전용 UI 없음 — `CLAUDE.md B4`) |
| 캡쳐 범위 | **fullPage** (뷰포트 밖 영역 포함) |
| 테마 | 라이트 (`colorScheme: 'light'`) |
| 로케일 / TZ | `ko-KR` / `Asia/Seoul` |
| 배율 | `deviceScaleFactor: 1` |
| 데이터 | **MSW mock** (실 백엔드 아님) |
| 브라우저 | Chromium (`@playwright/test` 1.63.0) |

---

## 재캡쳐 방법

```bash
npm run capture
```

playwright가 dev 서버를 **직접 띄우고**(`--mode capture`, 포트 5174) 캡쳐 후 내린다.
별도로 `npm run dev` 를 띄워둘 필요 없다.

### `--mode capture` 인 이유 (중요)

`.env.local` 의 `VITE_API_BASE_URL`(실 백엔드 IP)이 적용되면 **캡쳐가 깨진다.**
MSW 핸들러는 상대 경로(`/api/...`)로 등록돼 페이지 origin에 매칭되는데, base URL이 채워지면
요청이 외부 origin으로 나가 가로채지지 않는다 → `useMe` 실패 → `AuthGuard`가 로그인으로 리다이렉트.

그래서 `.env.capture` 를 두고 `--mode capture` 로 띄운다.
Vite env 로딩 순서상 `.env.[mode]` 가 `.env.local` 보다 **뒤에 로드되어 이긴다.**

> 같은 함정을 `vitest` 에서도 겪었다. 그쪽은 `vitest.config.ts` 의 `test.env` 로 고정해뒀다.

### 인증 처리

실 로그인 폼이 아직 없고 `/login` 은 **개발용 placeholder** 라서,
`e2e/capture.pw.ts` 가 `localStorage` 에 토큰·role 을 직접 주입해 `AuthGuard` 를 통과시킨다.
키는 `src/lib/auth/tokens.ts` 와 일치해야 한다 (`auth.accessToken` / `auth.refreshToken` / `dev.role`).

---

## 캡쳐 목록 (12장)

### 현장 사이트 `/*` — 10장

| 파일 | 라우트 | 비고 |
|---|---|---|
| `현장/patrol-zones--목록.png` | `/patrol/zones` | 초기 상태. 상세 패널 비어 있음 |
| `현장/patrol-zones--상세선택.png` | `/patrol/zones` | 첫 행 클릭 → 순찰 정보 + 타임라인 |
| `현장/patrol-points--목록.png` | `/patrol/points` | 전체 폭 테이블(상세 패널 없는 화면) |
| `현장/zones--목록+다이어그램.png` | `/zones` | 첫 코스 **자동 선택**. 경로 다이어그램 + 지점 순서·편집 카드 |
| `현장/points--목록+상세.png` | `/points` | 첫 지점 **자동 선택**. 상세 카드 |
| `현장/users--목록.png` | `/users` | 초기 상태. 상세 패널 비어 있음 |
| `현장/users--상세선택.png` | `/users` | 첫 행 클릭 → 근무자 상세 |
| `현장/deployments--대시보드.png` | `/deployments` | KPI + 요청 + 이력 |
| `현장/notice--목록.png` | `/notice` | 리스트형 |
| `현장/notice--상세.png` | `/notice/4` | 별도 상세 페이지(우측 패널 아님) |

### 공통 — 2장

| 파일 | 라우트 | 비고 |
|---|---|---|
| `공통/403.png` | `/403` | 권한 없음 |
| `공통/404.png` | `/no-such-page` | catch-all 라우트(`path: '*'`) |

---

## 캡쳐하지 않은 것과 그 이유

| 대상 | 이유 |
|---|---|
| `/login`, `/admin/login` | **개발용 placeholder**(진입 버튼 하나). `spec 019` 에서 통째로 교체되므로 baseline 비교 가치가 없다 |
| `/progress` 순찰 진행현황 | `ProgressPage.tsx` 는 존재하나 **라우터에 등록돼 있지 않다**. 접근 불가 |
| `/admin/*` 본사 사이트 | `AdminPlaceholderPage` 뿐. 리디자인·구현 미시작 |
| `/settings/keywords` 환경설정 | 라우트 미정 |
| 모달류 (지점 추가/수정, 코스 추가/수정, 근무자 추가 등) | 1차 baseline에서 제외. 트리거 셀렉터가 화면마다 달라 스크립트가 취약해진다. 필요하면 2차로 추가 |

---

## 관련 파일

| 파일 | 역할 |
|---|---|
| `playwright.config.ts` | 캡쳐 조건·dev 서버 기동 설정 |
| `e2e/capture.pw.ts` | 캡쳐 스크립트. 확장자가 `.pw.ts` 인 이유는 vitest가 집어가지 않게 하기 위함 |
| `.env.capture` | 캡쳐 전용 env (base URL 비움 + MSW 강제) |
