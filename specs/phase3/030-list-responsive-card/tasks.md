# 030-list-responsive-card tasks

> 입력: 같은 폴더 [`spec.md`](./spec.md)
> 029 가 `T440` 으로 끝나 **`T441` 부터** 쓴다.
> `[P]` = 병렬 가능 · `[US1~2]` = user story 소속
> 위험도 **B** → 화면 단위로 크게. 다만 **공용 컴포넌트**를 건드리므로 회귀 확인은 잘게.

> 🔴 **이 spec 의 위험은 "안 바뀌어야 할 것이 바뀌는 것" 이다.** `AppTable` 소비처는 7곳이고
> 그중 **셋은 대상이 아니다**(`/users` · 카드 안의 표 2개). 기능을 더하는 일보다 **더하지
> 않은 곳이 그대로인지** 확인하는 데 무게가 실린다.

---

## Phase 1: 공용 — `AppTable` 카드 모드 (모든 화면 선행)

> **독립 테스트 기준**: 카드 prop 을 **주지 않은** 테이블은 DOM 이 그대로이고, 준 테이블만
> 카드가 함께 렌더된다. 둘 다 **같은 `rowModel`** 을 본다.

- [ ] T441 [US2] `AppTable` 에 **opt-in 카드 모드** — `renderCard?: (row: TData) => ReactNode` in src/components/AppTable.tsx
      - 🔴 행은 **`table.getRowModel()`** 에서 가져온다(정렬·페이지 공유)
      - 🔴 `onRowClick` · `rowClassName` 을 **같은 함수로** 적용한다 — 두 벌로 갈리면 한쪽만 고쳐진다
      - 🔴 분기는 **CSS**(`hidden xl:block` / `xl:hidden`). JS 폭 측정은 쓰지 않는다
      - 0건 문구(`데이터가 없습니다`)는 카드 쪽에도 **한 번만** 보이게 한다
- [ ] T442 [US2] 카드 모드 단위 테스트 in src/components/\_\_tests\_\_/AppTable.test.tsx
      - prop 없으면 **카드가 없다**(기존 소비처 보호) / 주면 테이블·카드 **둘 다** DOM 에 있다
      - 정렬·페이지가 **양쪽에 같이** 반영된다 · 카드 클릭이 `onRowClick` 을 부른다
- [ ] T443 [P] [US2] 🔴 **비대상 소비처 무변화 확인** — `CoursePatrolLog`(코스 상세 안) ·
      `DeploymentHistoryTabs`(배치 이력) · `UsersPage` 가 prop 을 받지 않는지 코드로 확인

## Phase 2: 화면별 카드 4벌

> **독립 테스트 기준**: 각 화면에서 카드가 렌더되고, **제목과 상태 뱃지**가 보이며 클릭이
> 상세로 간다. `xl` 이상에서는 기존 테이블이 그대로다.

- [ ] T444 [US1] `/zones` 카드 — 코스명 + 사용·교대 뱃지 / 지점 수 · 총 소요시간 / 최근 순찰 in src/features/courses/components/CourseCard.tsx
- [ ] T445 [P] [US1] `/points` 카드 — 지점명 + 사용·인증수단 뱃지 / 소속 코스 · 최근 순찰 in src/features/points/components/PointCard.tsx
- [ ] T446 [P] [US1] `/patrol/zones` 카드 — 코스명 + 결과 뱃지 / 시작~종료 일시 in src/features/patrol-zones/components/ZoneHistoryCard.tsx
- [ ] T447 [P] [US1] `/patrol/points` 카드 — 지점명 + 결과·인증 뱃지 / 코스 · 일시 · 순찰자 / 기록 건수 in src/features/patrol-points/components/PointHistoryCard.tsx
- [ ] T448 [US1] 4개 페이지에 `renderCard` 연결 in src/pages/service/{zones,points,patrol/zones,patrol/points}/*.tsx

## Phase 3: Polish

- [ ] T449 🔴 **공용 카드 셸 승격 판단** — 4벌이 같은 뼈대를 쓰는지 보고 **뽑을지 말지 결정한다.**
      ⚠️ **뽑지 않는 것도 결론이다**(023 DoD #17 선례 — 머리 구성이 제각각이면 prop 6개짜리
      추상화가 된다). 판단 근거를 `tasks.md` 에 남긴다
- [ ] T450 [P] 화면별 카드 테스트 — 각 1건 이상(제목·뱃지·클릭) in 각 feature `__tests__`
- [ ] T451 `npm run verify` + `npm run test` **병렬 실행**, 790 → 증가 확인
- [ ] T452 🔴 **캡쳐로 PC 폭 무변화 확인** — `CAPTURE_OUT` 으로 먼저 찍어 **4화면이 그대로인지**
      비교한다. 같으면 **덮지 않는다**(좁은 폭 캡쳐는 남기지 않는다 — OQ-030-B 종결)
- [ ] T453 브라우저 확인 — 창을 좁혀 4화면 전환 · 카드 클릭 · 페이지 이동 · 미사용 톤다운
- [ ] T454 문서 — `patterns.md` **반응형 목록 규약 신설**(프로젝트 첫 사례) · `components.md`
      `AppTable` 항목 · `screens.md` 4행 · `roadmap.md` §7-1·§12
- [ ] T455 DoD 10개 대조표 + `## 다음 spec으로 이월` 블록 in specs/phase3/030-list-responsive-card/tasks.md

---

## Dependencies & Execution Order

- **T441 → Phase 2 전부.** 카드 모드가 없으면 카드를 붙일 자리가 없다
- **T442·T443 은 T441 직후** — 🔴 **기존 소비처가 깨지지 않았는지 먼저 본다.** 화면 4개를
  만든 뒤에 확인하면 "어디서 깨졌는지" 를 역추적하게 된다
- **T444~T447 은 `[P]`** (서로 다른 파일). T448 은 그 뒤
- **T449 는 T444~T447 이 다 나온 뒤** — 네 벌을 **보고 나서** 판단한다. 먼저 뽑으면
  "뽑을 만한가" 를 모르는 채로 추상화하게 된다
- **Phase 3**: T450 `[P]` → T451 → T452 → T453 → T454 → T455

## 제약 (구현 중 지킬 것)

1. 🔴 **`xl` 이상 화면을 1px 도 바꾸지 않는다.** 이 spec 의 가치는 "좁을 때 쓸 수 있다" 인데,
   넓을 때가 바뀌면 **멀쩡하던 화면 4개를 흔든 것**이 된다. T452 캡쳐 비교가 이것을 건다.
2. 🔴 **카드 prop 을 주지 않은 소비처를 건드리지 않는다** — 특히 **카드 안의 표 2개**.
3. 🔴 **`data` 를 직접 돌지 않는다.** `table.getRowModel()` 만 쓴다(정렬·페이지 일치).
4. **카드에도 `rowClassName` 을 건다** — 미사용 톤다운이 테이블에만 있으면 좁은 폭에서
   미사용 지점이 **정상처럼 보인다**.
5. **상태는 글자로 전한다** — 색만으로 구분하지 않는다(뱃지 유지).
6. ⚠️ **이력 2화면의 필드명은 `spec 024`·`025` 에서 바뀐다**(아직 mock). 카드 **구조**를
   단순하게 유지해 그때 매핑만 손볼 수 있게 한다.
7. **테스트에서 DOM 이 두 벌이다** — `getByText` 가 2건을 잡는다. `within` 으로 영역을 좁힌다.

## 백엔드 대기

**없음.** 서버 요청이 **하나도 늘지 않는다** — 이미 받아 둔 행을 다르게 그릴 뿐이다.
