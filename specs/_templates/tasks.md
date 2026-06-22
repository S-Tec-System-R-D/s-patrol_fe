# {NNN}-{feature} tasks

> 입력: 같은 폴더 `spec.md` (빈손 작성 금지)
> 태스크 ID는 Phase 무관 일련 번호 `T001`~
> `[P]` = 병렬 가능. 없으면 순차.
> `[US1]` = user story 소속 (해당 Phase만)
>
> **위험도별 분할 밀도**
> - A급: 잘게(검증·제출·에러 분리)
> - B급: 화면 단위로 크게
> - C급: 통째로 한 번에

---

## Phase 1: Setup

기본 셋업·타입 정의 등 모든 작업 선행.

- [ ] T001 [P] 타입 정의 in src/features/{도메인}/types/{name}.ts
- [ ] T002 [P] zod 스키마 in src/features/{도메인}/form/{name}Schema.ts

## Phase 2: Foundational (모든 US 선행 blocking)

API 호출 헬퍼·공용 훅 등 user story들이 공유하는 기반.

- [ ] T003 API 호출 헬퍼 in src/features/{도메인}/api/{name}.ts
- [ ] T004 react-query 키 정의 in src/features/{도메인}/queryKeys.ts

## Phase 3: US1 — {요약}

> **독립 테스트 기준** (= 세션 검증 게이트): MSW로 200 응답 시 ... 동작 확인

- [ ] T005 [US1] 페이지/컴포넌트 in src/pages/.../...
- [ ] T006 [US1] ...

## Phase 4: US2 — {요약}

> **독립 테스트 기준**: MSW 401 시 ... 메시지 노출

- [ ] T007 [US2] ...

## Phase 5: Polish

- [ ] T008 [P] vitest 단위 테스트 in src/features/{도메인}/__tests__/{name}.test.ts
- [ ] T009 [P] 빈 상태·로딩 상태 점검

---

## Dependencies & Execution Order

- T001, T002 → 다른 모든 태스크 선행
- T003 → T005, T006, T007
- T004 → T005, T007
- `[P]` 끼리 병렬 가능
- Phase 3와 Phase 4는 user story 단위로 독립 진행. Phase 5는 모든 US 완료 후.
