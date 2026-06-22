# 워크플로우 규약

이 프로젝트의 **모든 화면/기능 구현은 아래 절차를 따른다.**

---

## 0. 개요

### 사이클 (1~5)

```
WF-1 스펙 → WF-2 태스크 분할 → WF-3 구현 → WF-4 검증 → WF-5 통합
```

WF-00(개요)·WF-0(골격)은 `docs/`에서 이미 완료. 매 사이클 반복하지 않는다.

### spec 단위 정책 (하이브리드)

| Phase | spec 단위 | 예시 |
|---|---|---|
| **0~2** (인프라·셸·공용) | **테마 단위 묶음** 1 spec | `001-axios-and-query` (인터셉터 + react-query + sonner) |
| **3~5** (화면 작업) | **화면 단위 1:1** 1 spec | `012-login`, `013-zones`, ... |
| **6** (마감) | **체크리스트 1 spec** | `999-finalize` |

- 폴더: `specs/phase{N}/{NNN-feature-name}/` (`N`=roadmap Phase 0~6, `NNN`=Phase 무관 글로벌 일련번호 3자리)
- 템플릿은 Phase 무관 → `specs/_templates/`에 그대로 둔다(Phase 폴더 안에 두지 않음)
- Phase ↔ spec 매핑은 [`roadmap.md`](./roadmap.md) §3(소속 spec 컬럼)·§11에서 추적

### 사전 참조 문서 (단계별 기본)

각 단계 시작 시 **기본으로 봐야 하는 문서**만 명시. 추가 문서가 필요하면 AI가 요청하거나 사용자가 언급.

| 단계 | 기본 참조 |
|---|---|
| WF-1 스펙 | `roadmap.md`, `screens.md`, `flow.md`, `data-model.md`, **직전 spec의 `spec.md` + `tasks.md`** (Carry-over 작성용) |
| WF-2 태스크 분할 | 작성한 `spec.md`, `data-model.md`, `design-system.md` |
| WF-3 구현 | `tasks.md`, `components.md`, `design-system.md`, `patterns.md`, `layout.md` |
| WF-4 검증 | `spec.md` DoD, `CLAUDE.md` |
| WF-5 통합 | `tasks.md`, `roadmap.md`, `screens.md`, 본 문서 §5 갱신 체크리스트 |

---

## 1. 스펙 작성 (WF-1)

### 위치
`specs/phase{N}/{NNN-feature-name}/spec.md`
템플릿: `specs/_templates/spec.md`

### 위험도

- `roadmap.md` / `screens.md`에 명시된 위험도(A/B/C)를 **그대로 따른다**.
- spec 작성자가 임의 산정하지 않음.
- 수정이 필요해 보이면 spec 작성 전에 사용자에게 보고하고 결정 받음.

### 위험도별 분량

- **A급** (인증·권한·데이터 변형): 5축 풀 작성
- **B급** (일반 CRUD): 3축 (목적 / I/O / 제약). 엣지케이스는 "공통 규칙 따름"
- **C급** (정적): 한 줄

### spec.md 구조

```
# {NNN}-{feature} spec

## 0. Carry-over (직전 spec 핸드오프)   ← 첫 spec 외 의무
## User Stories
- US1. ...
- US2. ...

## 1. 목적
## 2. I/O
## 3. 제약 (기술 + 비즈니스)
## 4. 엣지 케이스       ← A급만 풀 작성
## 5. 완료 조건 (DoD)
- [ ] 검증 가능한 조건 1
- [ ] 검증 가능한 조건 2
```

- **User Stories**는 상단 별도 섹션. 5축(1~5)은 그대로 유지.
- `tasks.md`의 `[US?]` 라벨이 여기 US 번호와 매칭.
- US가 1개뿐이어도 명시적으로 `US1`로 표기(형식 일관).

### Carry-over 게이트 (첫 spec 제외 의무)

WF-1 진입 시 **직전 spec의 `tasks.md` 맨 아래 `## 다음 spec으로 이월` 블록을 먼저 열고**(없으면 `spec.md` Open Questions + `tasks.md` 본문 `[~]`를 직접 훑어), 본 spec `§0. Carry-over`에 다음을 옮겨 적는다.

1. 직전 spec의 미해결 **Open Question** 중 본 spec에서 다룰 것
2. 직전 spec의 **미완 태스크** (`[~]` 표시되었거나 한계 명시된 항목)
3. 직전 spec의 **DoD 미달 항목** (체크 못 한 완료 조건)

옮길 게 없으면 "없음"이라고 명시한다. 누락 = 형식 오류로 간주.

> Carry-over 항목은 본 spec의 DoD에 자연스럽게 흡수되거나, 명시적으로 "본 spec 범위 외 → {다음 spec ID}로 이월"이라고 처리한다.

### 게이트

- 정리본/요구사항에 명확히 적힌 것만 사용. **추측 금지**.
- 불확실하거나 빈칸 있으면 작성 전에 먼저 질문.
- 사용자 답 받은 후에 spec.md 생성.

### 공통 규칙은 spec에 적지 않는다

디자인 토큰·반응형·콘텐츠 톤·에러 처리 기본·검증 방식 등 **전역 규칙은 `CLAUDE.md` / `design-system.md`에 이미 있음.** spec엔 "이 화면 고유의 것"만.

---

## 2. 태스크 분할 (WF-2)

### 위치
같은 폴더 `specs/phase{N}/{NNN-feature-name}/tasks.md`
템플릿: `specs/_templates/tasks.md`

### 입력
`spec.md`를 받아 작성. 빈손으로 X.

### 태스크 한 줄 형식 (4요소 필수)

```
- [ ] T001 [P] [US1] 설명 in src/exact/path.ts
```

- 체크박스 `- [ ]`
- Task ID `T001` (3자리, Phase 무관 일련 번호)
- `[P]` — 병렬 가능(다른 파일·의존 없음). 없으면 순차
- `[US1]` — user story 소속 (해당 단계만)
- 설명 + **정확한 파일 경로** (누락 시 형식 오류)

### Phase 구조 (tasks.md 내부)

```
Phase 1: Setup
Phase 2: Foundational (모든 US 선행 blocking)
Phase 3+: US별 한 phase (우선순위 순)
  → 각 Phase 헤더에 "독립 테스트 기준" 명시 (= 세션 검증 게이트)
Phase N: Polish
```

### 의존성 섹션 (필수)

태스크 목록 뒤에:
```
## Dependencies & Execution Order
- T003, T004 모든 US 선행
- T005 → T006 순차
- [P] 끼리는 병렬 가능
```

### 위험도별 분할 밀도

- **A급**: 잘게 (검증 지점 많이). "검증 로직" / "제출 처리" / "에러 케이스" 따로
- **B급**: 화면 단위로 크게
- **C급**: 통째로 한 번에

---

## 3. 구현 (WF-3)

### 위임 4요소

위임 받을 때 다음을 확인:
1. **무엇을** — `tasks.md`의 T번호/Phase
2. **참조** — 어떤 문서/기준 구현체
3. **범위** — 어디까지만
4. **게이트** — 계획 먼저 또는 완료 보고

### 계획 먼저 게이트 (plan-first) — 필수

**코드 작성 전 구현 계획부터 제시.** 사용자 동의 후 구현.
- 어떤 파일을 만들고/수정할지
- 어떤 컴포넌트/훅/타입을 쓸지
- 외부 의존성·신규 패키지 여부

### 세션 단위

한 세션 = 한 user story (또는 한 화면). 여러 태스크 포함. user story 끝나면 세션 종료.

### 막힘 시 — 환각보다 멈춤

정보 부족 시 추측 진행 금지. 멈추고 질문.

### 3단 롤백 규칙

git 변경 상태: `편집 중` → `올림(stage)` → `저장 도장(commit)` → `공유(push)`. 변경이 어느 단계에 있느냐에 따라 롤백 방법이 다르다.

| 상황 | 단위 | 명령 예 | 실행 주체 |
|---|---|---|---|
| 태스크 중 명백 실수 | **1단 — 파일** | `git restore <file>` | AI 자동 OK |
| 검증 3회 실패 / 통째 폐기 | **2단 — user story** | `git restore .` (폐기) 또는 `git stash` (보존) | **사용자 지시 후 AI** |
| commit 이후 되돌리기 | **3단 — commit** | `git revert <commit해시>` | **사용자 지시 후 AI** |

**안전수칙**
- 금지: `git reset --hard`, `git push --force`. 본 프로젝트는 **항상 `revert`로 새 commit 덮기**.
- 사용자는 git 명령어 외울 필요 없음. "되돌려"라고만 말하면 AI가 현재 상태를 보고 적절한 단계로 처리.

---

## 4. 검증 루프 (WF-4) — 자동

### 1층 (태스크마다 자동, 보고 불필요)

**검증 시점별 도구 분담**

| 시점 | 도구 | 이유 |
|---|---|---|
| **파일 작성/편집 직후** (태스크 단위) | `mcp__ide__getDiagnostics(파일)` — IDE TS 서버 진단 1차 | 1~2초로 가볍고 증분 결과라 신선도 ↑. CLI tsc의 buildinfo 캐시로 놓치는 케이스를 즉시 잡음 |
| **Phase 경계** (여러 파일 변경 후) | `npm run verify` | 풀 typecheck + lint. 스코프 누락 없음 |
| **테스트 영향 있는 변경** | `vitest`(작성된 경우) | 런타임/회귀 |

**원칙**

- IDE 진단이 0건이어도 **Phase 끝과 DoD 직전에는 `npm run verify`를 반드시 한 번 실행**한다. IDE는 워크스페이스 스코프, CLI는 `tsconfig.app.json` include 스코프라 일치하지 않는 코너 케이스가 있다.
- IDE MCP가 비활성/미연결이면 1차도 `npm run verify`로 fallback.
- 에러 있으면 스스로 수정·재실행. 통과해야 다음 태스크 진행.

### 3회 실패 보류 규칙

- 동일 태스크에서 검증이 **3회 연속 실패**하면:
  1. 작업을 **보류**로 표시 (완료 처리 X)
  2. 실패 원인·시도한 해결책·필요한 결정사항을 정리해 **사용자에게 보고**
  3. 사용자 결정 받기 전까지 다음 태스크로 넘어가지 않음

### 세션 풀세트 (user story 완료 시, 보고 필수)

1. `npm run verify` **(의무, IDE 진단으로 대체 X)**
2. `vitest` 실행 (작성된 테스트)
3. **`spec.md` DoD 대조표 작성**:
   ```
   [x] 완료조건1 — 처리 위치: src/file.ts:23
   [x] 완료조건2 — 처리 위치: src/another.ts:45
   [ ] 완료조건3 — 누락. 보완 중.
   ```
   - 증거(파일/라인) 명시 필수
   - 못 대면 안 한 것
4. `CLAUDE.md` 컨벤션 위반 점검

→ 네 가지 모두 통과해야 "완료" 보고. 미충족은 스스로 보완·반복(3회 한도 적용).

### 검증 통과 못 한 코드를 완료라고 보고하지 않는다.

---

## 5. 통합 (WF-5)

### commit 메시지 컨벤션

```
<type>: <짧은 설명> (US?)

- 변경 요점 1
- 변경 요점 2

spec: specs/phase{N}/{NNN-feature}/spec.md
```

**type 목록**

| type | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 (동작 변화 없음) |
| `docs` | 문서 변경 |
| `chore` | 빌드·설정·인프라 |
| `style` | 포맷팅 (동작 변화 없음) |
| `test` | 테스트 |
| `perf` | 성능 |

**규칙**
- 1행 제목 50자 내, **한국어**, 마침표 없음
- 본문 선택. user story 라벨 `(US1, US2)` 가능
- `spec: ...` 끝줄로 spec 추적 가능

### 사용자 게이트 (자동 금지)

- commit/push는 **사용자 명시 지시 후에만**
- `"commit해"` = commit만. `"push해"` = commit + push (이미 commit돼 있으면 push만)
- 자동 commit·자동 push 금지

### 세션 종료 시 작업

1. `specs/phase{N}/{feature}/tasks.md`의 체크박스 닫기
2. **`tasks.md` 맨 아래 `## 다음 spec으로 이월` 블록 작성** (아래 규칙) — 다음 spec의 `§0 Carry-over` 입력원
3. `docs/roadmap.md` §11 진행 추적 매트릭스 갱신
4. `docs/screens.md` 진행도 ✗/△/✓ 갱신
5. 아래 **변경 docs 갱신 체크리스트** 검토 후 해당 문서 갱신

### "다음 spec으로 이월" 블록 (필수)

이월 내용이 `tasks.md` 본문에 `[~]`로 흩어지면 다음 세션이 일일이 훑어야 한다. 그래서 **세션 종료 시 한 곳에 모은다.** `tasks.md` 맨 아래에:

```
## 다음 spec으로 이월

> 다음 spec의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] {미완 태스크/한계 — 예: T011 런타임 미검증 (라우터 미연결)} → {처리할 spec ID 또는 "미정"}
- [ ] {해소 못 한 Open Question} → {처리할 spec ID}
- [ ] {DoD 미달 항목} → {처리할 spec ID}
```

- 이월할 게 없으면 "없음"이라고 명시한다.
- 본문 `[~]` 항목·`spec.md` Open Questions·미달 DoD를 빠짐없이 옮긴다.

### 변경 docs 갱신 체크리스트

| 변경 종류 | 갱신 대상 |
|---|---|
| DTO 추가/변경 | `data-model.md` §3, §4, §5 |
| 라우트 신설/변경 | `screens.md` §4, `flow.md` 사이트맵 |
| 새 App* 컴포넌트 추가 | `components.md` |
| 디자인 토큰 추가/변경 | `design-system.md` §1 |
| 새 상호작용 패턴 등장 | `patterns.md` (3개 화면 이상 반복 시) |
| 레이아웃 구조 변경 | `layout.md` |
| 결정사항 변경 (D1~D8 등) | `design-system.md` §5 |
| Phase 진행 변동 | `roadmap.md` §11, `screens.md` |
| 의사결정 누적 (Open Q 해소) | 해당 문서 Open Q 섹션 |

### 다음 세션은 새 컨텍스트로

화면 끝나면 세션 갈아 새 user story 시작.

---

## 핵심 원칙 요약

- **추측 금지**: 불확실하면 코드 전 질문.
- **최소 변경**: 요청과 무관한 코드·포맷·주석 건드리지 않음.
- **재사용 우선**: 새 컴포넌트 만들기 전 `src/components/` 재사용 가능 여부 확인.
- **검증 후 완료**: 자가검증 통과한 것만 "완료" 보고.
- **명시 후 반영**: commit/push는 사용자 지시 후.
- **3회 실패 보류**: 무한 재시도 금지. 보류 + 사용자 보고.
- **revert만 사용**: `reset --hard`·`push --force` 금지.
- **충돌 시 우선순위**: 정확성 > 검증 > 최소변경 > 명료성.
