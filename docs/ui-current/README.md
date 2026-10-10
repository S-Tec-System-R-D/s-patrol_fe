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
| 캡쳐일 | **2026-10-10** (최초 2026-10-02) |
| 커밋 | `spec 027` Phase 5 (최초 `f0a552a`) |
| 뷰포트 | **1280 × 900** (PC 기준. 모바일 전용 UI 없음 — `CLAUDE.md B4`) |
| 캡쳐 범위 | **fullPage** (뷰포트 밖 영역 포함) |
| 테마 | 라이트 (`colorScheme: 'light'`) |
| 로케일 / TZ | `ko-KR` / `Asia/Seoul` |
| 배율 | `deviceScaleFactor: 1` |
| 데이터 | **MSW mock** (실 백엔드 아님) |
| 브라우저 | Chromium (`@playwright/test` 1.63.0) |
| 애니메이션 | **`reducedMotion: 'reduce'`** — 🔴 아래 참조 |
| 폰트 | `document.fonts.ready` 대기 후 촬영 |

---

## 🔴 바이트 비교로 회귀를 판단하지 말 것 (2026-10-10)

**같은 코드로 두 번 찍어도 1~2장은 ±1% 차이가 난다.** 매번 다른 파일이 흔들리는 것으로 보아
Chromium 렌더링 자체의 비결정성(안티앨리어싱·PNG 압축)이다. 그래서 **파일 크기·해시 비교는
신호가 아니라 잡음**이고, 비교는 **눈으로** 한다.

줄일 수 있는 원인 둘은 이미 제거했다:

| 원인 | 조치 | 증상 |
|---|---|---|
| `AppEmpty` 의 **무한 바운스 애니메이션** | `reducedMotion: 'reduce'`(config) | 빈 상태가 있는 화면이 **찍는 순간마다** 달랐다 |
| 웹폰트 늦은 적용 | `document.fonts.ready` 대기 | 글자 모양이 달라졌다 |

**의미 있는 회귀는 이런 것들이다** — 크기가 **수 KB 단위로** 변하거나, 화면 높이(세로 px)가
변하거나, 내용이 사라지는 것. 실제로 `spec 027` 재촬영에서 `deployments--대시보드` 가
**-6%(3.9KB)** 로 튀어 **배치관리가 빈 화면이 된 것**을 잡았다(아래 이력 참조).

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

`e2e/capture.pw.ts` 가 `localStorage` 에 토큰을 직접 주입해 `AuthGuard` 를 통과시킨다.
키는 `src/lib/auth/tokens.ts` · `src/lib/auth/site.ts` 와 일치해야 한다
(`auth.accessToken` / `auth.refreshToken` / `auth.siteSeq` / `auth.siteName`).

> 🔴 **`spec 021` 이후 `auth.siteSeq` 도 필요하다.** `AuthGuard` 가 현장 영역에서
> **사업장 미선택** 을 막기 때문에, 이 값이 없으면 보호 라우트가 전부 로그인으로 리다이렉트되어
> **캡쳐가 전부 로그인 화면이 된다.** 본사 영역(`/admin/*`) 은 이 체크에서 제외된다.
>
> ⚠️ `npm run capture` 는 `verify`/`test` 에 포함되지 않아 **자동 검증망 밖** 이다.
> 가드에 새 조건이 붙을 때마다 seed 를 함께 갱신해야 하고, 빠뜨리면 **다음 캡쳐까지 드러나지 않는다.**
> 020(토큰) 과 021(사업장) 에서 각각 한 번씩 이 함정을 밟았다.

> 🔴 **`spec 020` 이후 그 토큰은 진짜 JWT여야 한다.** 사용자 정보가 `/api/auth/me`(실재하지 않는
> 엔드포인트) 에서 **JWT 클레임** 으로 바뀌었다. 의미 없는 문자열을 넣으면 디코딩이 실패해
> `useMe` 가 `isError` 를 반환하고 **캡쳐가 전부 로그인 화면이 된다.**
> `capture.pw.ts` 안의 `makeAccessToken()` 이 클레임을 만들어 주며, 권한은 `dev.role` 이 아니라
> **토큰의 role 클레임** 이 정한다(`dev.role` 은 020에서 제거).

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

---

## 변경 이력

### 2026-10-10 — `spec 027` 재촬영 (12장 → 13장)

- **`points--목록+상세` → `points--목록` · `points--상세`** (1장 → 2장). 좌/우 마스터-디테일이
  **목록 페이지 + 상세 페이지**로 분리돼 한 화면에 담기지 않는다
- 🔴 **재촬영에서 실제 퇴행을 잡았다 — `deployments--대시보드` 가 빈 화면이었다**(0명/0명/이력 0건).
  배치 mock 이 사업장명을 `'강동 그랜드타워'` 로 하드코딩했는데 ① `spec 020` 이
  `/api/auth/me` 를 없애고 ② `spec 021` 이 `locationName` 을 **선택한 사업장**에서 가져오게
  바꿔, dev·캡쳐 seed(`강동 테크노타워`)와 어긋났다. 전출/전입 판정이 **문자열 비교**라
  전부 0건이 됐다. mock 데이터를 seed 에 맞춰 교정했다.
  ⚠️ **021 에서 들어온 결함인데 021·022 가 재촬영을 미뤄 지금에서야 드러났다** — baseline 이
  존재하는 이유 그 자체다
- 🔴 **덮어쓰기 전에 scratchpad 로 먼저 찍어 비교했다.** 바로 덮었으면 깨진 화면이 그대로
  기준이 됐다. 다음에도 이 순서를 지킬 것
