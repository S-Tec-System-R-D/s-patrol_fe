# 062-landing tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 **B** — 화면 단위로 크게.

## 구현 방향 (WF-2 결정)

| 문제 | 방법 |
|---|---|
| 로그인 처리를 그대로 쓰면서 `/login` 을 안 바꾸기 | `LoginForm.tsx` 안에서 **안쪽 내용을 `LoginPanel` 로 떼고**, `LoginForm` 은 지금 틀(화면 가운데 카드) + `<LoginPanel>` 만 남긴다. `LoginForm` 의 이름 · props 그대로 → `LoginPage` · `AdminLoginPage` 손대지 않음 |
| 슬라이더 | 패키지 없이 컴포넌트 하나. 🔄 현재 장만 그리고 `key` 로 바꿔 끼워 페이드인(겹쳐 둘 이유가 없었다 — 텍스트 · 아이콘뿐). 5초 타이머 · 멈춤 조건 3개(일시정지 버튼 · hover/포커스 · reduced-motion) |
| 슬라이드 내용 교체 쉽게 | 문구 · 아이콘을 배열 하나(`slides.ts`)에 둔다 — 나중에 캡쳐 이미지 필드만 더한다 |

---

## Phase 1: Foundational

- [x] T1070 로그인 내용 분리 in src/features/auth/components/LoginForm.tsx — `LoginPanel`(제목 · 폼 · 사업장 선택 단계 · 처리 로직 전부) + `LoginForm`(틀 + `LoginPanel`). 동작 변화 0
- [x] T1071 [P] 슬라이드 데이터 in src/features/landing/slides.ts — 4장(순찰이력 · 코스/지점 · 배치관리 · 공지사항) 아이콘 · 제목 · 한 줄 설명(임시 — OQ-062-B)

## Phase 2: US1 — 랜딩 화면 · 로그인

> **독립 테스트 기준**: `/` 에서 `333333` 로그인 → 사업장 선택 → `/zones`. xl 미만 로그인만 · 390px 넘침 없음. `/login` · `/admin/login` 기존 테스트 green

- [x] T1072 [US1] 랜딩 페이지 in src/pages/auth/LandingPage.tsx — 회색 배경 · 큰 카드 좌우 반(왼쪽 `LoginPanel` · 오른쪽 슬라이더 `hidden xl:block`)
- [x] T1073 [US1] 라우트 `/`(공개 · 가드 없음) in src/router/index.tsx

## Phase 3: US2 — 슬라이드

> **독립 테스트 기준**: 5초마다 다음 장 · ← → · 점 표시 이동 · 일시정지 버튼 · hover/포커스 멈춤 · reduced-motion 이면 자동재생 없음

- [x] T1074 [US2] 슬라이더 in src/features/landing/components/LandingSlider.tsx — `--rail` 패널 · 아이콘 · 제목 · 설명 · 점 표시 · ← → · 일시정지

## Phase 4: 검증 · 문서

- [x] T1075 [P] 단위 테스트 in src/features/landing/components/__tests__/LandingSlider.test.tsx · src/pages/auth/__tests__/LandingPage.test.tsx(로그인 → 사업장 선택 → 착지)
- [x] T1076 [P] e2e 화면 열림 in e2e/open-landing.pw.ts — `/` 1280(분할) · 390(로그인만 · 넘침 없음) · `/` 에서 로그인
- [x] T1077 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` 1499/1499 병렬 · `npm run e2e` 36/36
- [x] T1078 브라우저 확인(1280 · 390 · mock — 사용자 확인 2026-10-30) — 🔄 확인 중 수정(사용자 2026-10-30): xl 미만을 작은 카드 → **xl 카드의 왼쪽 반 크기 그대로**(`max-w-[550px]` · `min-h-[640px]` · 안쪽 여백 `px-6 sm:px-16`) in src/pages/auth/LandingPage.tsx · 제목 "현장 로그인" 빼고 **S-Patrol** 굵게(`LoginPanel` `titleClassName` — 로그인 화면은 넘기지 않음) · 안내 "사업장 순찰 업무를 한곳에서 관리하세요"
- [x] T1079 문서 — `screens.md` 랜딩 행 · `flow.md` §0 · `roadmap.md` 062 행 · Phase 6 남은 항목에서 랜딩 제거

---

## Dependencies & Execution Order

- T1070 → T1072 · T1071 → T1074 → T1072 → T1073
- T1075 · T1076 은 Phase 2 · 3 뒤. T1077 → T1078 → T1079
- `[P]` 끼리 병렬 가능

---

## 다음 spec으로 이월

- **OQ-062-B** 슬라이드 확정 문구 · 비주얼 — 회사 쪽 자료가 오면 `src/features/landing/slides.ts` 만 바꾼다.
- 059 OQ(F) · 057 OQ(A · B) · 056 OQ(A)는 그대로 범위 외.
