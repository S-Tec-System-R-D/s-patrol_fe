# 018-patrol-history-filters tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 **B** — 화면 단위로 크게 분할.
> 태스크 ID는 017에 이어 `T147`~.
> Setup(primitive prop 확장) → Foundational(날짜 쿼리 직렬화) → US1(zones) → US2(points) → US3(페이지네이션 URL 이관) → Polish.

---

## Phase 1: Setup — primitive prop 확장

두 US 모두 선행. 필터 자리에 들어갈 컨트롤의 계약이 먼저 정해져야 화면 배선을 못 시작한다.

- [x] T147 `AppSelect`에 `icon`·`active` prop 추가 in src/components/app/AppSelect.tsx — `AppFilterButton.tsx:19-31`의 아이콘·`data-active` 강조 시각(`border-point`/`bg-point-bg`/`text-point-foreground`)을 옮긴다. **둘 다 optional** — 기존 호출부(`AppPagination.tsx:36-43`) 무변경 유지
- [x] T148 [P] `AppDatePicker`에 `active` prop 추가 in src/components/app/AppDatePicker.tsx — `CalendarIcon`은 `:60`에 이미 있어 `active`만. 강조 시각은 T147과 동일 토큰
- [x] T149 [P] primitive 테스트 보강 in src/components/app/__tests__/AppSelect.test.tsx, src/components/app/__tests__/AppDatePicker.test.tsx — `icon` 렌더 / `active` 시 강조 속성 / **prop 미전달 시 기존 외형 무변화** 3축 — `AppSelect` 3건 + `AppDatePicker` 2건 추가

## Phase 2: Foundational (모든 US 선행 blocking)

두 화면이 공유하는 날짜 ↔ 쿼리스트링 변환. 화면마다 따로 쓰면 `from`/`to` 해석이 갈릴 수 있어 한 곳에 둔다.

- [x] T150 날짜 범위 ↔ 쿼리스트링 변환 순수 함수 in src/lib/dateRangeQuery.ts — `AppDateRange`(`{from?,to?}` Date) ↔ `{from?,to?}`(`YYYY-MM-DD` 문자열) 양방향. 파싱 실패값은 `undefined`로 떨어뜨린다(spec §3 "알 수 없는 쿼리 값은 해당 필터만 무시"). `to`는 **해당 일자 포함** 비교가 되도록 일자 단위로 자른다
- [x] T151 T150 단위 테스트 in src/lib/__tests__/dateRangeQuery.test.ts — 왕복 변환 / 빈 값 / 잘못된 형식(`2026-13-45`·`2026-02-30`·`abc`·`20260501`) / `to` 경계(같은 날 23:59 포함) / 한쪽만 잘못된 경우 — 17건 추가

## Phase 3: US1 — `/patrol/zones` 코스 이력 필터

> **독립 테스트 기준** (= 세션 검증 게이트): `?result=COMPLETE`를 붙인 URL로 직접 진입하면 완료 행만 보이고 `AppPagination` 총 건수가 그 수와 같다. 기간·코스·결과를 함께 걸면 AND로 좁혀지고, "전체"를 고르면 해당 키가 URL에서 사라진다. 0건이면 `AppEmpty`가 보인다.

- [x] T152 [US1] 코스 이력 필터 순수 함수 in src/features/patrol-zones/lib/filterCourseHistory.ts — `(rows, query) => rows`. `from`/`to`/`courseId`(코스명)/`result` AND 결합. 알 수 없는 `result` 값은 해당 조건만 무시
- [x] T153 [US1] [P] 코스·결과 옵션 유도 in src/features/patrol-zones/lib/courseHistoryOptions.ts — 코스는 목 데이터 `name` 중복 제거, 결과는 `ZoneColumn.tsx:13-16` `patrolResultBadge`의 키·라벨에서. 둘 다 맨 앞에 "전체"(value 빈 문자열) 추가
- [x] T154 [US1] T152·T153 단위 테스트 in src/features/patrol-zones/lib/__tests__/filterCourseHistory.test.ts — 단일 조건 4종 / AND 결합 / 알 수 없는 값 무시 / 0건
- [x] T155 [US1] `PatrolZonesPage` 필터 배선 in src/pages/service/patrol/zones/PatrolZonesPage.tsx — `AppFilterButton` 3개(`:67-69`) → `AppDatePicker` 1 + `AppSelect` 2로 교체. `useQueryParams`로 읽고 쓰기(**`{ replace: true }`** — spec §3), 필터 통과 행만 `AppTable`에 전달, `AppPagination.total`을 필터 후 건수로, 0건이면 `AppEmpty`, 필터 변경 시 `page` 1로 리셋, 선택된 필터에 `active`
- [x] T156 [US1] 화면 레벨 테스트 in src/pages/service/patrol/zones/__tests__/PatrolZonesPage.test.tsx — `MemoryRouter`의 `initialEntries`로 쿼리 있는 URL 직접 진입 복원 / 선택 시 URL 갱신 / "전체" 선택 시 키 제거

## Phase 4: US2 — `/patrol/points` 지점 이력 필터

> **독립 테스트 기준**: US1과 동일 기준을 5개 필터(기간·순찰코스·인증수단·순찰자·결과)에 적용. `?authenticationMethod=QR&result=NORMAL`로 직접 진입하면 두 조건을 모두 만족하는 행만 보인다.

- [ ] T157 [US2] 지점 이력 필터 순수 함수 in src/features/patrol-points/lib/filterPointHistory.ts — `from`/`to`/`courseId`(`zoneName`)/`authenticationMethod`/`workerId`(`worker`)/`result` AND 결합
- [ ] T158 [US2] [P] 코스·순찰자·인증수단·결과 옵션 유도 in src/features/patrol-points/lib/pointHistoryOptions.ts — 코스·순찰자는 목 데이터 중복 제거, 인증수단·결과는 `PointColumn.tsx:14-26` 뱃지맵에서. "전체" 선두 추가
- [ ] T159 [US2] T157·T158 단위 테스트 in src/features/patrol-points/lib/__tests__/filterPointHistory.test.ts — 단일 조건 6종 / AND 결합 / 알 수 없는 값 무시 / 0건
- [ ] T160 [US2] `PatrolPointsPage` 필터 배선 in src/pages/service/patrol/points/PatrolPointsPage.tsx — `AppFilterButton` 5개(`:64-68`) → `AppDatePicker` 1 + `AppSelect` 4로 교체. 나머지는 T155와 동일(`{ replace: true }` 포함). 이 화면은 상세 패널이 없어 0건 시 `AppEmpty`가 테이블 자리에 들어간다
- [ ] T161 [US2] 화면 레벨 테스트 in src/pages/service/patrol/points/__tests__/PatrolPointsPage.test.tsx — T156과 동일 3축 + 2개 조건 동시 진입

## Phase 5: US3 — 페이지네이션 URL 이관

> **독립 테스트 기준**: 두 화면에서 2페이지로 이동하면 URL에 `page=2`가 남고, 그 URL로 새로고침하면 2페이지가 복원된다. 행 수를 바꾸면 `pageSize`가 반영되며 `page`는 1로 리셋된다. 필터를 바꾸면 `page`가 1로 돌아간다. 이 모든 변경이 히스토리를 쌓지 않아 뒤로가기 한 번으로 화면을 벗어난다.
>
> US1·US2에서 필터만 URL에 올리고 페이지는 `useState`로 남겨두면 `patterns.md` §6("페이지 번호도 URL에 저장")을 어기고, 필터-페이지 리셋 로직이 두 곳으로 갈린다. 그래서 별도 US로 분리해 마지막에 한 번에 이관한다.

- [ ] T162 [US3] `PatrolZonesPage`·`PatrolPointsPage`의 `PaginationState` `useState` → URL(`page` 1-based / `pageSize`) 이관 in src/pages/service/patrol/zones/PatrolZonesPage.tsx, src/pages/service/patrol/points/PatrolPointsPage.tsx — `AppPagination`의 기존 props 계약(`pageIndex` 0-based)은 무변경, **URL ↔ 컴포넌트 경계에서만 1-based 변환**(CLAUDE.md B4 "페이지 번호 1-based")
- [ ] T163 [US3] 페이지네이션 URL 테스트 in 위 두 화면 테스트 파일 — `page` 왕복 / `pageSize` 변경 시 `page` 리셋 / 필터 변경 시 `page` 리셋 / 범위 밖 `page`(`999`) 진입 시 빈 화면이 되지 않는지 / **히스토리 미적립**(필터·페이지를 여러 번 바꾼 뒤 엔트리가 1개인지)

## Phase 6: Polish

- [ ] T164 [P] `docs/screens.md` §1-2 갱신 in docs/screens.md — 두 행의 "필터 팝오버/URL 연동 ... Phase 3 이월" 문구 해소. Export는 미해소로 남기므로 그 부분만 유지
- [ ] T165 [P] `docs/roadmap.md` 갱신 in docs/roadmap.md — §12에 018 행 추가, **§13에 결과 enum 3중 분기 Open Q 등재**(SSOT `enum.ts` 소비처 0 / feature types dead / 페이지 인라인이 실사용 + `design-system.md` §1-1 뱃지 5종과 SSOT `PointResult` 충돌 → 스웨거 확보 후 결정)
- [ ] T166 [P] `docs/components.md` 갱신 in docs/components.md — §3-2 `AppSelect`에 `icon`·`active` 행, §3-3 `AppDatePicker`에 `active` 행. **필터 트리거는 primitive를 직접 쓰고 `AppFilterButton`으로 감싸지 않는다**는 근거를 §9 계열에 1~2줄로 명시(중첩 트리거 금지)
- [ ] T167 `npm run verify` + `npm run test` **병렬 실행** green 확인 (CLAUDE.md A4)
- [ ] T168 DoD 대조표 작성(증거 `파일:라인`) + 본 파일 하단 "다음 spec으로 이월" 블록 작성
- [ ] T169 **M2 시각 검증** — dev 서버에서 `/patrol/zones`·`/patrol/points` 필터 8개 동작·강조·목록 반영·0건 빈 상태 확인. **`AppDatePicker`의 첫 시각 검증**(017 이월분 해소). 015 T110(`/notice`)도 같은 세션에서 함께 볼 수 있음. **사용자 승인 필요**

---

## Dependencies & Execution Order

- T147 → T149 (`AppSelect` prop이 있어야 테스트 가능). T148도 → T149
- T147, T148 → T155, T160 (화면이 prop을 쓴다)
- T148 = T147과 다른 파일이라 `[P]`
- T150 → T151, T152, T157 (날짜 비교·파싱을 공유)
- Phase 1 + Phase 2 전체 → Phase 3·Phase 4 선행
- T152, T153 → T154 → T155 → T156
- T157, T158 → T159 → T160 → T161
- T153, T158 은 각 Phase 내에서 필터 함수와 독립 `[P]`
- **Phase 3(US1)과 Phase 4(US2)는 서로 독립** — 같은 패턴이라 순차 진행이 자연스럽지만 병렬 가능
- Phase 3 + Phase 4 → Phase 5 (두 화면 배선이 끝난 뒤 페이지네이션을 한 번에 이관)
- T162 → T163
- T164, T165, T166 서로 독립 `[P]`. 모두 Phase 5 완료 후
- T167 → T168 → T169

---

## 구현 시 유의사항 (착수 전 예상)

> 결과는 WF-4에서 "예상 → 실제"로 덧붙인다.

- **`AppTable`이 자체 페이지네이션 상태를 받는 구조** — 두 화면이 `pagination`/`onPaginationChange`를 내려주고 있다(`PatrolZonesPage.tsx:85-87`). URL 이관 시 `AppTable` 계약을 건드리지 않고 페이지 쪽에서만 변환하는 게 목표. `AppTable`을 고쳐야 하는 상황이 되면 **멈추고 보고**(A3 — 소비처가 두 화면 밖에도 있음)
- **목 데이터가 페이지 파일 인라인** — 필터 함수는 데이터를 인자로 받는 순수 함수라 이동 불필요(spec §3 범위 밖). 다만 `features/*/components/*`가 페이지 파일에서 타입을 import하는 **의존 방향 역전**이 이미 있어(7곳), 새 `lib/` 파일도 같은 방향을 따르게 된다. 정리는 본 spec 범위 밖 — 필요하면 Open Q로 등재
- **jsdom + Radix Select** — 017 T134에서 겪은 `hasPointerCapture`/`scrollIntoView` 미구현 문제는 `src/test/setup.ts:22-29` stub으로 이미 해소됨. 화면 레벨 테스트에서 재발하지 않을 것으로 예상
- **URL 갱신 시 히스토리 오염** — *착수 전 결정 완료(2026-10-01)*. 목록 상태 변경은 전부 `{ replace: true }`(`useQueryParams.ts:54`). 근거는 spec §3 비즈니스 규칙 참조(`patterns.md` §9 뒤로가기 보존 규칙 + `AppDatePicker`의 2회 `onSelect`). **T155·T160·T162가 같은 규칙을 공유**하므로 세 태스크에서 따로 판단하지 않는다

---

## 진행 기록

### Phase 1~2 완료 (2026-10-01)

- T147~T151 완료. 테스트 **94건 → 116건**(+22: `AppSelect` 3 · `AppDatePicker` 2 · `dateRangeQuery` 17), 파일 29 → 30
- `npm run verify` 0 errors(경고 1건은 `public/mockServiceWorker.js` 기존 MSW 생성물) + `npm run test` 30 files / 116 tests green
- **구현 중 판단 1건**: `AppSelect`의 `SelectTrigger`는 기본 클래스에 `justify-between`이 있어(`ui/select.tsx:24`) 아이콘·값·chevron 3형제를 그냥 두면 값이 가운데로 벌어진다. 아이콘과 `SelectValue`를 `<span className="flex min-w-0 items-center gap-1.5">`로 묶어 chevron만 우측으로 밀리게 했다(`AppSelect.tsx:50-54`). 아이콘 없는 기존 호출부도 같은 span을 타지만 자식이 하나뿐이라 외형 변화 없음 — T149 3번째 테스트로 고정
- 다음: Phase 3(US1, T152~T156) → 완료

### Phase 3 완료 — US1 `/patrol/zones` (2026-10-01)

- T152~T156 완료. 테스트 **116건 → 136건**(+20: 필터·옵션 12 · 화면 8), 파일 30 → 32
- `npm run verify` 0 errors + `npm run test` 32 files / 136 tests green
- **구현 중 판단 2건**
  1. **"전체" 값에 빈 문자열을 쓸 수 없다** — Radix Select는 `SelectItem`의 빈 문자열 값을 선택 해제용으로 예약해 허용하지 않는다. 계획 단계에서 `value: ''`로 적었으나 센티넬 `ALL_VALUE = 'ALL'`(`courseHistoryOptions.ts:21`)로 바꾸고, **URL에는 쓰지 않는다** — 화면 경계의 `selectValue()`가 `undefined`로 바꿔 키를 지운다(`PatrolZonesPage.tsx`). 테스트로 고정(`filterCourseHistory.test.ts` "전체 센티넬은 빈 문자열이 아니다", 화면 테스트 "전체 선택 시 키 제거")
  2. **0건 처리** — `AppTable`은 자체적으로 tbody에 "데이터가 없습니다" 셀을 넣지만(`AppTable.tsx:117-121`), `patterns.md` §7과 spec DoD에 맞춰 **테이블 자리를 `AppEmpty`로 교체**했다(0건이면 `AppPagination`도 숨김). `AppTable` 자체는 무변경 — 다른 화면 영향 없음
- **부수 개선 1건**: 선택된 이력이 필터에서 빠지면 우측 상세 패널도 함께 비운다(`activePatrol` 유도). 필터로 사라진 행의 상세가 남아 있는 상태를 막기 위함
- `AppFilterButton`은 이 화면에서 빠졌고 `/users` 2곳에는 그대로 남아 있다(spec §3 범위 밖)
- 다음: Phase 4(US2, T157~T161) `/patrol/points`
