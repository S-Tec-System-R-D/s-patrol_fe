# 002-lint-cleanup spec

> 위험도: **B** (정비 — 데이터 변형 없음. CLAUDE.md/roadmap A 정의(인증·권한·데이터 변형)에 해당 안 함)
> 관련 화면: 없음 (인프라 정비). 손대는 파일은 §2 Input 표 참조.
> Phase: `roadmap.md` Phase 0 (분할 2번째 묶음)
>
> 본 spec은 001 작업 중 발견된 사전 lint 잔존 문제를 별도 spec으로 분리한 것이다. 001에서는 "본 spec 범위 밖"으로 처리됐으나, `npm run verify` 자체가 green이어야 후속 spec(003/004 이후)의 WF-4 검증 인프라가 막힘 없이 돌아간다.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `001-api-foundation`. 이월 블록(`tasks.md` §"다음 spec으로 이월")에서 옮김.

- [ ] **001 T014 — `npm run verify` 전체 미통과 (사전 lint 19 errors + 10 warnings)** → **본 spec의 핵심 목표**. §5 DoD에서 검증.
- [ ] 001 T011/T012 — `src/App.tsx` 데모 런타임 미검증 → **본 spec 범위 외**. `003-auth-foundation`으로 이월(인증 흐름 연결 + mock/MSW로 검증).
- [ ] 001 Open Q — react-query 기본 옵션 미세조정(`staleTime: 30_000` / `retry: 1` 잠정) → **본 spec 범위 외**. Phase 3 화면 작업 시 체감 후 확정.
- [ ] 001 Open Q — MutationCache 전역 toast vs 화면별 onError 우회 → **본 spec 범위 외**. 발생 시 검토.

---

## User Stories

- US1. 개발자가 `npm run verify`를 실행하면 → typecheck + lint 둘 다 green으로 통과해 WF-4 자동 검증 루프가 막히지 않는다.

---

## 1. 목적

001 완료 시점에 `npm run verify` 전체 실행이 사전 잔존 lint 위반(19 errors + 10 warnings)으로 실패한다. 이 상태가 유지되면 WF-4 1층 자동 검증("코드 변경 후 verify 자동 실행 + 에러 있으면 스스로 수정")이 매 태스크마다 무한 실패 보고를 낼 수밖에 없어 워크플로우가 멈춘다. 본 spec은 **기존 코드의 동작은 보존**하면서 lint 위반만 정합성 있게 해소해 `verify` green 상태를 복구한다.

---

## 2. I/O

### Input

`npm run lint` 결과 — **errors 19건 + warnings 10건**.

규칙별 분포(파일·라인 상세는 `tasks.md`에서):

| 규칙 | 카운트 | 처리 방향 |
|---|:-:|---|
| `@typescript-eslint/no-unused-vars` | 다수(errors) | 미사용 import/변수/파라미터 제거 |
| `@typescript-eslint/no-explicit-any` | 1 error | 정확한 타입으로 교체 (불가 시 좁힌 union/`unknown`) |
| `react-refresh/only-export-components` | 3 errors | 상수/유틸을 같은 폴더의 별도 파일로 분리 |
| `react-hooks/set-state-in-effect` | 3 errors | 초기 선택 로직을 `useState` lazy init 또는 derived state로 전환 (effect 외부) |
| `react-hooks/incompatible-library` | 1 error + 4 warnings | RHF `watch()` 메모이제이션 불가 케이스 — 콜백 내 직접 호출 또는 `useWatch` 사용으로 회피 |
| `react-hooks/exhaustive-deps` | warnings 다수 | `reset` 등 누락 deps 추가. 의존성 의미 변경 시 effect 구조 재검토. |
| `prefer-const` | 1 error | 자동 fix |

### Output

- 손댄 모든 파일에서 errors=0, warnings=0
- 외부 파일(본 spec이 손대지 않은 파일) 동작 변화 없음
- `npm run verify` → exit 0
- 동작 회귀 없음 (특히 set-state-in-effect를 derived/lazy init로 옮긴 페이지)

---

## 3. 제약

### 기술 제약

- **동작 의미 보존 우선**. 단순 자동 fix(prefer-const, no-unused-vars 일부)는 그대로, 의미 변경 위험이 있는 케이스는 동등 동작을 유지하는 형태로 변환한다.
  - `set-state-in-effect`: effect 안에서 `setSelectedX(items[0])` 같은 "초기 선택" 패턴은 `useState(() => items[0])`(lazy init) 또는 `const selectedX = state ?? items[0]` 형태의 derived state로 옮긴다. **렌더 시점의 최종 화면 결과는 동일해야 한다.**
  - `react-hooks/incompatible-library` (RHF `watch()`): 컴포넌트 본문에서 직접 `watch('field')` 호출 → 메모이제이션 불가. 콜백/이펙트 내부 호출 또는 `useWatch({ name, control })`로 변경.
  - `only-export-components`: 같은 파일에서 상수·타입·유틸을 함께 export하던 부분을 인접 파일(`./xxx.constants.ts` 같은 식)로 분리. import 경로만 갱신.
- **외부 파일 손대지 않음**. lint 위반이 없는 파일은 건드리지 않는다(A3 최소 변경).
- **타입 변경은 최소 침습**. `no-explicit-any` 해소 시 가능하면 기존 함수 시그니처를 유지하고 좁힌 타입(`unknown` + narrowing) 우선.
- `--fix` 자동 적용 후 수동 정리 순서. 자동 fix로 잡힌 변경은 한 커밋, 수동 정리는 별 커밋 권장(롤백 용이).

### 비즈니스 규칙

- 정비 작업은 **UI/라우팅/도메인 로직 변경 금지**. 만약 set-state-in-effect 해소 과정에서 "초기 선택 동작 자체가 잘못 설계됐다"는 판단이 들어도, 본 spec에서는 동등 동작 보존만 한다. 재설계는 별 spec.

---

## 4. 엣지 케이스

공통 규칙 따름 (B급).

추가로 한 가지:
- **`set-state-in-effect` 변환 시 깜빡임 회귀**: lazy init은 마운트 1회만 계산되므로 `items`가 비동기로 도착하는 경우 `items[0]`이 `undefined`로 굳을 수 있다. derived state 또는 `items` 로딩 완료 후 1회만 동기화하는 패턴을 사용한다.

---

## 5. 완료 조건 (DoD)

- [ ] `npm run lint` errors = **0**
- [ ] 손댄 파일들의 warnings = **0** (외부 파일 warnings는 본 spec 범위 외이므로 남아도 무방)
- [ ] `npm run typecheck` 통과
- [ ] `npm run verify` 통합 통과 (exit 0) — 증거로 출력 1줄 메모
- [ ] `set-state-in-effect` 수정한 페이지(`PointsPage`, `ZonesPage` 외) 수동 1회 동작 확인 — 마스터-디테일 첫 진입 시 첫 항목이 자동 선택되는지 — 검증 위치(파일:라인) 명시
- [ ] `001/tasks.md` 이월 블록의 T014 항목 ✓ 표시 + 본 spec 링크

---

## 참고

- 직전 spec: `specs/phase0/001-api-foundation/`
- 로드맵: `roadmap.md` §3 Phase 0 ("사전 lint 정비" 행)
- 워크플로우: `workflow-protocol.md` WF-4 ("3회 실패 보류 규칙"이 verify 실패 상태에서 발동되지 않도록 본 spec이 선제 해소)
- 후속 spec: `003-auth-foundation`, `004-dev-infrastructure`

---

## Open Questions

- [ ] `set-state-in-effect`를 derived state로 옮길 때, URL 쿼리스트링 동기화가 함께 필요한 페이지가 있는지(예: `?selectedId=xxx`). `useQueryParams`는 004에서 정형화 예정이므로, 본 spec에서는 임시로 로컬 state만 쓰고 URL 동기화는 화면 spec에서 도입.
- [ ] `only-export-components` 분리 시 폴더 컨벤션 — `./xxx.constants.ts` vs `./constants/xxx.ts` 중 어느 쪽을 표준으로 둘지. 첫 사례 작업 시 결정 후 `CLAUDE.md` B4에 한 줄 추가.
