# 002-lint-cleanup tasks

> 입력: 같은 폴더 `spec.md`
> 위험도: **B** → 규칙 카테고리별 phase, 같은 카테고리 내에서 파일별 task. 파일끼리는 `[P]` 병렬.
> 모든 task는 US1(=`verify` green 복구) 소속이므로 라벨 생략 없이 일괄 `[US1]`로 표기.

---

## 카테고리별 분포 (입력)

`npx eslint .` 출력 기준 — 19 errors + 10 warnings, 19개 파일.

| 카테고리 | errors | warnings | task phase |
|---|:-:|:-:|:-:|
| `prefer-const` | 1 | — | Phase 1 (자동 fix) |
| `@typescript-eslint/no-unused-vars` | 8 | — | Phase 2 |
| `@typescript-eslint/no-explicit-any` | 1 | — | Phase 2 |
| `react-refresh/only-export-components` | 4 | — | Phase 3 |
| `react-hooks/set-state-in-effect` | 4 | — | Phase 4 (동작 회귀 확인 대상) |
| `react-hooks/incompatible-library` | — | 4 | Phase 5 |
| `react-hooks/exhaustive-deps` | — | 6 | Phase 6 |

---

## Phase 1: 자동 fix

`--fix`로 안전하게 잡히는 것부터.

- [x] T001 [US1] `npx eslint . --fix` 실행 — `prefer-const` 1건 자동 해소 in src/router/guards/AuthGuard.tsx (isAuthentication)

## Phase 2: no-unused-vars / no-explicit-any

미사용 식별자 제거 + `any` 좁히기. 의미 변경 없음.

- [x] T002 [P] [US1] 미사용 변수 `variantStyles` 제거 in src/components/AppAlertDialog.tsx:18
- [x] T003 [P] [US1] 미사용 import 3건 제거 (`Icon`, `useSearchParams`, `queryKey`) in src/components/AppTabs.tsx (라인 1, 3, 18)
- [x] T004 [P] [US1] `any` → 정확한 타입(`unknown`+narrowing 우선) in src/components/AppTable.tsx:16
- [x] T005 [P] [US1] 미사용 파라미터 `note` 제거 in src/features/patrol-zones/components/PatrolSheet.tsx:138
- [x] T006 [P] [US1] 미사용 import `PatrolSheet` 제거 in src/features/patrol-zones/components/ZoneColumn.tsx:4
- [x] T007 [P] [US1] 미사용 import `Button` 제거 in src/features/zone/components/ZoneTopNav.tsx:1
- [x] T008 [P] [US1] 미사용 파라미터 `onEdit` 제거 in src/features/zone/components/point-card/ActiveMenu.tsx:20
- [x] T009 [P] [US1] 미사용 import `AppCheckbox` 제거 in src/features/zone/form/AddPointForm.tsx:13

## Phase 3: only-export-components 분리

상수/유틸을 같은 폴더의 별도 파일로 분리. import 경로 갱신.
**첫 사례(T010)에서 폴더 컨벤션 결정** (`./xxx.variants.ts` vs `./constants/xxx.ts`) → spec Open Q 해소 + CLAUDE.md B4 갱신.

- [x] T010 [US1] 상수(`buttonVariants`) 분리 in src/components/ui/button.tsx:67 → 같은 폴더 별도 파일. **컨벤션 결정 + 문서화 포함.**
- [x] T011 [P] [US1] 상수 분리 in src/components/ui/tabs.tsx:78 (T010 결정한 컨벤션 적용)
- [x] T012 [P] [US1] 상수/타입 분리 in src/features/zone/form/AddPointForm.tsx:17 (T010 결정한 컨벤션 적용)
- [x] T013 [P] [US1] 상수/타입 분리 in src/features/zone/form/EditPointForm.tsx:8 (T010 결정한 컨벤션 적용)

## Phase 4: set-state-in-effect 변환

`useState(() => init)` lazy init 또는 derived state로 전환. **렌더 결과 동등성 보존 필수**.
spec §4 엣지(비동기 도착 깜빡임) 주의 — 데이터 로딩 후 초기 선택이 필요한 경우 `?? items[0]` derived 우선.

- [x] T014 [P] [US1] effect 외부로 전환 (`useState` lazy init 또는 derived) in src/components/AppTabs.tsx:29
- [x] T015 [P] [US1] effect 외부로 전환 in src/features/auth/components/location/LocationTabs.tsx:22
- [x] T016 [P] [US1] effect 외부로 전환 (첫 항목 자동 선택) in src/pages/service/points/PointsPage.tsx:17
- [x] T017 [P] [US1] effect 외부로 전환 (첫 항목 자동 선택) in src/pages/service/zones/ZonesPage.tsx:35

## Phase 5: incompatible-library 회피

라이브러리별 전략이 다름.

- [x] T018 [P] [US1] RHF `watch('points')` → `useWatch({ name, control })` 치환 in src/features/zone/form/AddPointForm.tsx:47
- [x] T019 [P] [US1] points 폼의 RHF 호환성 점검 — `watch` 직접 호출이면 `useWatch`로, 아니면 사유 주석 + `eslint-disable-next-line` in src/features/points/form/AddPointForm.tsx:26
- [x] T020 [P] [US1] 동일 처리 in src/features/points/form/EditPointForm.tsx:26
- [x] T021 [P] [US1] `useReactTable` 라이브러리 한계 — `eslint-disable-next-line react-hooks/incompatible-library` + 사유 주석("TanStack Table API limit") in src/components/AppTable.tsx:25

## Phase 6: exhaustive-deps 정리

`reset` 등 누락 deps 추가 또는 effect 구조 재검토.

- [x] T022 [P] [US1] `mode`, `tabs` 누락 deps 추가 in src/components/AppTabs.tsx:31
- [x] T023 [P] [US1] `reset` deps 추가 in src/features/zone/form/AddPointForm.tsx:45
- [x] T024 [P] [US1] `reset` deps 추가 in src/features/zone/form/AddZoneForm.tsx:26
- [x] T025 [P] [US1] `reset` deps 추가 in src/features/zone/form/EditPointForm.tsx:31
- [x] T026 [P] [US1] `reset` deps 추가 in src/features/zone/form/EditZoneForm.tsx:25
- [x] T027 [P] [US1] 불필요 dep `ZoneTreeData` 제거 in src/pages/service/zones/ZonesPage.tsx:36

## Phase 7: Polish

- [x] T028 [US1] `npm run verify` 통합 통과 — exit 0 확인 + 출력 마지막 줄 메모(증거)
- [~] T029 [US1] set-state-in-effect 변경 4개 화면(AppTabs/LocationTabs/PointsPage/ZonesPage) 수동 회귀 1회 — 마스터-디테일 첫 항목 자동 선택 동등 동작 확인 — 검증 파일·라인 메모
  - 한계: 라우터·인증 가드(`AuthGuard`의 `isAuthentication = true`) 상태에서 브라우저로 확인해야 하나, 003-auth-foundation에서 라우터 흐름이 정리되기 전까지 안정적 수동 검증 어려움. 코드 변환 자체는 effect 의도와 동등(설명 주석 추가). → 003에서 인증 흐름 연결 후 함께 확인.
- [x] T030 [P] [US1] `specs/phase0/001-api-foundation/tasks.md` 이월 블록의 T014 항목에 ✓ 표시 + 본 spec 링크
- [x] T031 [P] [US1] CLAUDE.md B4 "명명" 절에 T010에서 결정한 컨벤션 1줄 추가 — only-export-components 분리 시 인접 파일 명명 규칙

---

## Dependencies & Execution Order

### Phase 간

- **T001(자동 fix) → 모든 후속**: 다른 위반과 충돌 없는 무해 변경이라 먼저.
- **Phase 2(no-unused) → Phase 3(only-export)**: 같은 파일을 다루는 케이스(예: zone/form/AddPointForm은 T009, T012, T018, T023이 동일 파일) 머지 충돌 방지를 위해 같은 파일은 phase 순서대로.
- **Phase 3(only-export) → Phase 6(deps)**: only-export 분리 시 effect도 함께 손볼 가능성 있으니 이쪽이 먼저.
- **Phase 4(set-state-in-effect)** 는 Phase 5/6과 같은 파일이 거의 없음 → 독립.
- **Phase 1~6 → Phase 7(Polish)**: verify·회귀·이월 처리는 마지막.

### 같은 파일 처리 순서 (머지 충돌 방지)

| 파일 | 관련 task (실행 순서) |
|---|---|
| `src/components/AppTabs.tsx` | T003 → T014 → T022 |
| `src/components/AppTable.tsx` | T004 → T021 |
| `src/features/zone/form/AddPointForm.tsx` | T009 → T012 → T018 → T023 |
| `src/features/zone/form/EditPointForm.tsx` | T013 → T025 |
| `src/pages/service/zones/ZonesPage.tsx` | T017 → T027 |

→ 위 5개 파일은 동일 파일 안에서 task 간 순차. 그 외 파일은 task 1개씩만 가지므로 자유.

### 병렬 가능

- Phase 2 (T002~T009) 서로 다른 파일 → 모두 `[P]`.
- Phase 3 T011~T013은 T010(컨벤션 결정) 후 병렬.
- Phase 4 T014~T017 → 서로 다른 파일이라 병렬, 단 각각 회귀 확인 필요(Phase 7 T029 종합).
- Phase 5 T018~T021 → 병렬.
- Phase 6 T022~T027 → 병렬 (단 동일 파일 충돌은 위 표 참조).

---

## 검증 체크 (각 phase 끝 자동)

- Phase 1·2 끝: `npx eslint <변경 파일>` 0건
- Phase 3 끝: `npx eslint <변경 파일>` + 임포트 깨짐 없음 (`npm run typecheck`)
- Phase 4 끝: 동등 동작 가설 검증 — `useEffect`가 사라졌고 첫 렌더에서 `selectedX`가 동일하게 결정되는지 코드로 확인
- Phase 5·6 끝: 해당 파일 lint 0건
- Phase 7 T028: `npm run verify` 전체 exit 0

---

## 다음 spec으로 이월

> 다음 spec의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [ ] **T029 수동 회귀 미완** — `set-state-in-effect`를 derived/lazy init으로 옮긴 4개 화면(AppTabs / LocationTabs / PointsPage / ZonesPage)의 브라우저 동작 회귀가 미확인. 코드 변환은 effect 의도와 동등하나 라우터·`AuthGuard` 흐름이 003에서 정리되기 전까지 안정적 수동 검증 어려움 → **003-auth-foundation**에서 인증 흐름 연결 후 동시 검증.
- [ ] **001 이월 잔여: T011/T012 런타임 미검증** (`src/App.tsx` 데모) — 본 spec 범위 외였음, 그대로 003으로 이월 → **003-auth-foundation**에서 처리.
- [ ] **001 이월 잔여: Open Q — react-query 기본 옵션** (`staleTime: 30_000`/`retry: 1`) → 그대로 Phase 3 화면 작업 시 확정.
- [ ] **001 이월 잔여: Open Q — MutationCache 전역 toast 우회** → 그대로 발생 시 검토.
- [ ] **본 spec Open Q — URL 쿼리스트링 동기화** (set-state 옮긴 페이지 중 URL 동기화가 필요한 화면 존재 가능성) → **004-dev-infrastructure**에서 `useQueryParams` 정형화와 함께 처리.
