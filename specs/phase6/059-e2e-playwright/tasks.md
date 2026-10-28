# 059-e2e-playwright tasks

> 입력: 같은 폴더 `spec.md`(위험도 **B** — 화면 단위로 크게)
> 태스크 ID 는 058 다음부터(T1037~).
> `[P]` = 병렬 가능(다른 파일 · 의존 없음). 없으면 순차.
> 🔴 `src/` 는 건드리지 않는다(DoD #4). 테스트 중 발견한 앱 버그는 고치지 않고 T1050 에서 OQ 로 남긴다.

---

## 파일 구성

| 파일 | 역할 |
|---|---|
| `playwright.config.ts` | 프로젝트 3개 — `capture`(지금 그대로) · `e2e-desktop`(1280) · `e2e-mobile`(390) |
| `e2e/support/fixtures.ts` | 모든 화면 공통 확인 — 콘솔 에러 · `pageerror` · `/api/` 4xx/5xx 수집, 테스트 끝에 0건 단언 · 390px 가로 넘침 검사 |
| `e2e/support/session.ts` | 로그인 폼으로 로그인(+ 사업장 선택 단계) · 목록 첫 행 열기 |
| `e2e/open-service.pw.ts` | 화면 열림 확인 — 현장 7화면 목록 · 상세 |
| `e2e/open-admin.pw.ts` | 화면 열림 확인 — 본사 사업장 · 관리자 × 3계정 |
| `e2e/guards.pw.ts` | 로그인 · 가드 5종 |
| `e2e/flow-service.pw.ts` | 기능 흐름 확인 S1~S5(현장) |
| `e2e/flow-admin.pw.ts` | 기능 흐름 확인 S6 · S7(본사) |

프로젝트별 대상: `capture` = `capture.pw.ts` 만 · `e2e-desktop` = `open-*` · `guards` · `flow-*` · `e2e-mobile` = `open-*` 만.

---

## Phase 1: Setup

- [x] T1037 설정 분리 in playwright.config.ts — 공통 `use`(애니메이션 멈춤 · ko-KR · Asia/Seoul · `webServer` 5174 · MSW) 유지 · 프로젝트 3개 + `testMatch` 분리 · 머리 주석에 e2e 사용법(무엇을 · 어떻게 돌리는지 · mock 상태는 새로 불러오면 사라진다)
- [x] T1038 스크립트 in package.json — `capture` → `playwright test --project=capture` · `e2e` → `playwright test --project=e2e-desktop --project=e2e-mobile`

## Phase 2: Foundational (모든 US 선행)

> **독립 테스트 기준**: 빈 테스트 1개로 fixture 가 콘솔 에러를 일부러 일으키면 실패하고, 없으면 통과(확인 뒤 지움)

- [x] T1039 [P] 공통 확인 fixture in e2e/support/fixtures.ts — `test.extend` 로 자동 적용 · 의도한 실패(가드 확인 등)는 테스트가 허용 목록으로 넘긴다 · `expectNoOverflow(page)`(`scrollWidth <= innerWidth`)
- [x] T1040 [P] 세션 헬퍼 in e2e/support/session.ts — `login(page, 사번)`(현장 `/login` · 본사 `/admin/login`, 비밀번호는 형식만 맞춘 고정값 — mock 은 사번만 본다) · 사업장 선택 단계에서 `테스트 사업장2-1`(🔴 첫 사업장(루트 6)은 mock 코스 0건이라 상세를 열 수 없다) · `openFirstRow(page)`(행이 없으면 **실패** — spec §4)

## Phase 3: US1 — 화면 열림 확인

> **독립 테스트 기준**: `npx playwright test --project=e2e-desktop --project=e2e-mobile open- guards` 통과

- [x] T1041 [P] [US1] 현장 7화면 in e2e/open-service.pw.ts — 레일 메뉴로 목록 이동 → 머리 제목 확인 → 첫 행 → 상세 머리 확인(배치관리는 목록만) · 390px 은 각 화면 `expectNoOverflow`
- [x] T1042 [P] [US1] 본사 in e2e/open-admin.pw.ts — `000000` · `111111` · `777777` 각각 사업장 목록 → 상세 → 관리자
- [x] T1043 [P] [US1] 가드 5종 in e2e/guards.pw.ts — 비로그인 → `/login` · 현장 → 본사 주소 = 403 · 본사 → 현장 주소 = 본사 홈 · 근무자 = 차단 안내 · 없는 주소 = 404 (desktop 만)

## Phase 4: US2 — 기능 흐름 확인 (desktop 만)

> **독립 테스트 기준**: `npx playwright test --project=e2e-desktop flow-` 통과. 쓰기 뒤 이동은 **클릭으로만**(새로 불러오면 mock 상태가 사라진다)

- [x] T1044 [US2] S1 지점 설명 바꾸기 → 지우기 · S2 코스 이름 바꾸기 in e2e/flow-service.pw.ts
- [x] T1045 [US2] S3 공지 작성 → 상세 → 삭제 in e2e/flow-service.pw.ts
- [x] T1046 [US2] S4 근무자 추가 · S5 배치 요청 승인 in e2e/flow-service.pw.ts
- [x] T1047 [P] [US2] S6 관리자 추가 → 삭제 · S7 비상연락망 추가 → 해제 in e2e/flow-admin.pw.ts

## Phase 5: US3 — 캡쳐 그대로

> **독립 테스트 기준**: `CAPTURE_OUT=<스크래치 폴더> npm run capture` 가 기존과 같은 장수를 찍는다

- [x] T1048 [US3] 캡쳐 회귀 — 임시 폴더에 찍어 `docs/ui-current/**` 와 장수 · 파일명 대조 + 눈으로 비교(바이트 비교 금지 — `docs/ui-current/README.md`). **baseline 은 덮지 않는다**

## Phase 6: Polish

- [x] T1049 `npm run e2e` 전체 2회 연속 통과(흔들림 확인) · 소요 시간 기록
- [x] T1050 발견한 앱 버그 정리 — 재현 · 화면 · 증상을 spec Open Questions 에(고치지 않음, DoD #8)
- [x] T1051 [P] 문서 — `workflow-protocol.md` §4 M6 도구 · CLAUDE.md A4(`npm run e2e`) · `roadmap.md` 059 행 · §12 매트릭스 · (058 뒤 미커밋분) `screens.md` §1-1 사업장 전환 · `roadmap.md` Phase 6 남은 항목
- [x] T1052 `npm run verify` + `npm run test` 병렬 · `src/` 변경은 테스트 파일 1개(OQ-059-E) — 처음엔 `LocationsPage.test.tsx` "주소로 찾는다" 가 전체 실행에서만 4회 연속 실패(300ms 디바운스 + `findByText` 1초). 결과 대기 3초로 고친 뒤 3회: 1481 · 1480(다른 테스트 부하 실패 1, OQ-059-F) · 1481
- [x] T1053 DoD 점검 + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- T1037 → T1038 → 나머지 전부(설정이 먼저).
- T1039 · T1040 병렬 → Phase 3 · 4 전부 선행.
- Phase 3: T1041 · T1042 · T1043 병렬.
- Phase 4: T1044 → T1045 → T1046(같은 파일) · T1047 은 병렬.
- Phase 5(T1048)는 T1037 뒤 언제든 — 캡쳐 설정을 바꾼 직후 보는 것이 좋다.
- Phase 6 은 전부 뒤. T1050 은 Phase 3 · 4 실행 결과가 입력.

---

## 결과

- `npm run e2e` **32건 통과 · 2회 연속**(66s · 67s). desktop 22(화면 열림 10 · 가드 5 · 기능 흐름 7) + mobile 10(화면 열림).
- 실패는 전부 **테스트 쪽**이었다 — 좁은 폭 카드 선택자가 관리그룹 버튼을 먼저 잡음 · 버튼 이름(`등록` · `확인` · `삭제` · `추가 (1)`) · 감춰진 체크박스. 앱 버그 0건(OQ-059-B).
- 캡쳐: 변경 전 · 후 설정으로 찍은 17장 픽셀 일치(설정 변경 영향 0). baseline 자체는 낡았다(OQ-059-D).
- `src/` 변경은 테스트 파일 1개(`LocationsPage.test.tsx` 결과 대기 3초 — OQ-059-E). 앱 코드 0줄.

## 다음 spec으로 이월

- **OQ-059-C** 삭제 확인 버튼 문구(`확인` / `삭제`) 통일 여부 — 콘텐츠 톤 판단.
- **OQ-059-D** 캡쳐 baseline 재촬영(`docs/ui-current/**`) — 046~058 화면 변경 반영.
- 실서버 조회 e2e(이번 범위 외 — 사용자 결정 2026-10-28 "mock 만").
- 사업장 전환(레일 버튼) — 새 spec(`screens.md` §1-1).
- **OQ-059-F** vitest 병렬 경합 부하 실패(1~5건 종류) — 이번엔 `adminGroupMutations.test.tsx` 1건. 무거운 테스트의 대기 시간 점검은 별도 작업.
- **OQ-057-A · OQ-057-B · OQ-056-A** 그대로(057 이월).
