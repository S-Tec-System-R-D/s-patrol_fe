# 027-point-screen-split tasks

> 입력: [`spec.md`](./spec.md) (위험도 **B** — 화면 단위로 크게 분할)
> 선행: `spec 022`(api 5종·훅·`queryKey` 규약·MSW 5종 — 전부 재사용)
> 태스크 ID는 022(T240~T304)에 이어 **T305**부터

---

## ⚠️ 분할 순서를 좌우한 제약 (착수 전 확인)

**네 가지가 순서를 강제했다. 모두 코드 실측으로 확인했다.**

1. 🔴 **Phase 1을 쪼갤 수 없다 — 라우트·목록·상세가 한 묶음이다.**
   목록을 테이블로 바꾸면 행 클릭이 **갈 곳(상세 라우트)** 을 필요로 하고, 상세 라우트가 생기면 우측 패널이 **중복**이 된다. 셋 중 하나만 하면 그 Phase 종료 시점에 화면이 깨진 상태다. 022 제약 3(MSW를 조회 전환과 같은 Phase에)과 같은 논리.

2. 🔴 **`PointList`·`PointListCard`가 사라지고 테이블 컬럼으로 대체된다.**
   `PointListCard.test.tsx` **11건 전부**가 그 컴포넌트에 걸려 있다. 테이블 컬럼 팩토리(`PointColumn.tsx`)로 옮기면서 **같은 관심사를 다시 고정**해야 한다(미사용 톤다운·뱃지 숨김·B-6 폴백). 지우고 끝내면 022에서 고정한 계약이 풀린다.

3. 🔴 **`PointDetail`은 재사용하되 prop이 바뀐다.**
   현재 `{ point, onDeleted }`를 받는 **카드**다. 페이지가 되면 `point`는 라우트 파라미터 조회 결과이고 `onDeleted`는 **목록으로 navigate**가 된다. `PointDetail.test.tsx` **8건**이 영향권이다. 🔴 **상세 카드 내부(`DetailRow`·`DetailSection`·`AuthMethodDisplay`·`ZoneRow`)는 그대로 쓴다** — `AuthMethodDisplay.test.tsx` 3건을 깨뜨리지 않는다(022 제약 2와 같은 취지).

4. 🔴 **필터(Phase 3)는 상세(Phase 2)와 독립이지만 Phase 1에 종속이다.**
   필터 바는 목록 페이지 안에 들어가므로 테이블 전환이 끝나야 자리가 생긴다. 반대로 상세 페이지와는 접점이 없다 → **Phase 2·3은 순서를 바꿔도 된다**(사용자 결정: 2 → 3).

**깨질 테스트 사전 계수**

| 파일 | 건수 | 시점 | 사유 |
|---|---|:-:|---|
| `PointListCard.test.tsx` | **11건 전부** | Phase 1 (T309) | 컴포넌트 제거 → 테이블 컬럼 테스트로 **이설** |
| `PointsPage.test.tsx` | **9건 전부** | Phase 1 (T310) | 마스터-디테일 전제(첫 행 자동 선택·우측 패널)가 사라진다 |
| `PointDetail.test.tsx` | **8건 중 5건** | Phase 2 (T315) | 삭제 성공 후 "선택 해제" → **"목록으로 navigate"** 로 바뀐다. 수정 모달 3건은 유지 |
| `AuthMethodDisplay.test.tsx` | **0건** | — | 🔴 prop 계약을 건드리지 않는다(제약 3) |
| `AddPointForm.test.tsx` · `EditPointForm.test.tsx` | **0건** | — | 🔴 **편집은 모달 유지**(규칙 10). 폼은 손대지 않는다 |

**재사용 — 손대지 않는 것**

`api/` 5종 · `hooks/` 2종 · `queryKeys.ts` · `lib/` 2종 · `types/` · `form/` 전부 · `components/detail/` 하위 4종(`PointDetail` 제외) · MSW 핸들러 5종

---

## Phase 1: 라우트 + 목록 테이블 전환 (🔴 한 묶음 — 쪼개면 화면이 깨진다)

> **독립 테스트 기준**: `/points`가 전체 폭 테이블이고, 행을 누르면 `/points/:pointSeq`로 이동해 상세가 뜬다. **새로고침해도 그 상세가 유지된다.** 좌/우 2단이 남아 있지 않다. `npm run test` green.

- [x] T305 라우트 추가 in src/router/paths.ts · src/router/index.tsx — `pointDetail(pointSeq)` 빌더 + `pathPatterns.pointDetail = '/points/:pointSeq'`. 🔴 **`noticeDetail`(`paths.ts:13,52`)과 같은 모양**으로. 새 관례를 만들지 않는다(규칙 1)
- [x] T306 `CourseTabs` 활성 판정 수정 in src/features/zone/components/CourseTabs.tsx — 🔴 현재 `end` 때문에 **`/points/49`에서 "지점" 탭이 꺼진다**(규칙 14). `end` 제거 또는 `startsWith` 판정. ⚠️ `/zones`도 같은 문제를 갖게 되므로 **두 탭 모두** 확인
- [x] T307 [US2] 상세 페이지 **최소 골격** in src/pages/service/points/PointDetailPage.tsx — `useParams`로 `pointSeq` → `usePointDetail`. 기존 `PointDetail` 카드를 **그대로 얹는다**(본격 UI는 Phase 2). 없는 `pointSeq`·조회 실패는 **안내 + 목록 복귀 수단**(🔴 `/404`로 보내지 않는다 — §4)
- [x] T308 [US1] 테이블 컬럼 팩토리 신설 in src/features/points/components/PointColumn.tsx — **5컬럼**(지점명·인증수단·소속 코스·최근 순찰·사용여부). 🔴 설명·TAG ID 는 **상세 전용**(사용자 결정 2026-10-08 — 고르는 데 쓰이지 않고 폭만 먹는다). `patrol-points/components/PointColumn.tsx` 모양을 따른다. 🔴 **미사용이면 행 톤다운 + 사용여부 뱃지**(규칙 12), 미실측 인증수단 코드면 뱃지 숨김(022 승계)
- [x] T309 [US1] 목록 페이지 전환 in src/pages/service/points/PointsPage.tsx — `AppTable` + `hidePagination` + 외부 `AppPagination` 전체 부착(🔴 **OQ-022-E 해소**). `onRowClick` → `navigate(paths.service.pointDetail(seq))`. 🔴 **`PointList.tsx`·`PointListCard.tsx` 제거** + 우측 패널·첫 행 자동 선택 파생 제거
- [x] T310 [US1] 깨진 테스트 이설 in src/features/points/components/\_\_tests\_\_/PointColumn.test.tsx · src/pages/service/points/\_\_tests\_\_/PointsPage.test.tsx — 🔴 **`PointListCard.test.tsx` 11건을 버리지 않고 컬럼 테스트로 옮긴다**(제약 2 — 미사용 톤다운·뱃지 숨김·B-6 폴백). `PointsPage.test.tsx`는 "행 클릭 → 라우트 이동"·"빈 목록"·"조회 실패"로 재작성
- [x] T311 [US1] `PointTopNav` 재배치 in src/features/points/components/PointTopNav.tsx — 추가 버튼은 유지하되 **검색 input은 Phase 3에서 필터 바로 옮긴다.** 지금은 **자리만 정리**하고 비와이어드 상태를 유지한다(A3 — 한 번에 바꾸지 않는다)

## Phase 2: US2 — 상세 페이지 UI

> **독립 테스트 기준**: 상세 페이지에 뒤로가기·지점명 헤더·섹션·액션 풋터가 있고, 수정(모달)·삭제가 동작한다. **삭제 성공 → 목록 복귀 / 실패 → 상세 유지.** `npm run test` green.

- [ ] T312 [US2] 상세 페이지 레이아웃 in src/pages/service/points/PointDetailPage.tsx — 뒤로가기 + 지점명 헤더 + 기본정보·소속 코스·인증수단 섹션. 🔴 **`DetailRow`·`DetailSection`·`AuthMethodDisplay`·`ZoneRow`를 그대로 쓴다**(제약 3 — 테스트 3건 보존)
- [ ] T313 [US2] `PointDetail` 카드 → 페이지 본문으로 정리 in src/features/points/components/detail/PointDetail.tsx — 카드 테두리·헤더를 페이지가 갖도록 넘기고 본문만 남긴다. ⚠️ **파일을 지우지 않는다** — 섹션 조립이 그대로 쓰이고, 지우면 테스트 8건이 통째로 사라진다
- [ ] T314 [US2] 액션 풋터 + 모달 재배치 — 수정은 `AppDialog`(모달 유지, 규칙 10), 삭제는 `AppAlertDialog`. 🔴 **폼 2개는 손대지 않는다**(테스트 20건 보존)
- [ ] T315 [US2] 삭제 후 이동 처리 — 🔴 **성공 시 `navigate(paths.service.points)`, 실패 시 머문다**(규칙 13). `PointDetail.test.tsx` 5건을 "선택 해제" → "navigate 호출"로 교체. 🔴 **실패 시 navigate가 호출되지 않는 것**을 명시 고정 — 거부인데 화면이 바뀌면 삭제된 것처럼 보인다
- [ ] T316 [US2] [P] 상세 라우트 엣지 테스트 in src/pages/service/points/\_\_tests\_\_/PointDetailPage.test.tsx — 없는 `pointSeq`(400) → 안내 + 목록 복귀 수단 / 새로고침 시 유지 / 🔴 **`/404`로 가지 않음**

## Phase 3: US3 — 검색·필터·페이지 이동 (022 US5 이월)

> **독립 테스트 기준**: 검색어·인증수단·사용여부·페이지가 URL에 보존되고 **서버 파라미터로** 나간다. 🔴 **클라이언트 필터 함수가 0건**이다.
>
> ✅ **추측이 아니다** — Phase 8 R2에서 서버 필터 3종이 실제로 걸리는 것을 실측했다(`authMethod=9`→4건 / `useYn=false`→0건 / `searchKey=지점`→6건).

- [ ] T317 🔴 **`AppFilterPopover` 신설** in src/components/app/AppFilterPopover.tsx — 기존 `AppFilterButton`(시각 트리거)을 `Popover`로 감싸 **처음으로 동작하게** 만든다. 선택 시 라벨에 값 반영(`인증수단` → `인증수단: QR`) + `active` 상태 + "전체" 옵션. ⚠️ **`AppFilterButton`을 고치지 않는다** — `/patrol/points` 5개·`/users` 2개가 그 시각에 의존한다
- [ ] T318 [P] vitest in src/components/app/\_\_tests\_\_/AppFilterPopover.test.tsx — 열림/선택/라벨 반영/active/"전체" 선택 시 `undefined` 반환
- [ ] T319 [US3] 필터 바 조립 in src/features/points/components/PointFilters.tsx — 인증수단·사용여부 2종. 018 규약 승계: `ALL_VALUE`("전체"는 URL에 안 남김) + `setParams(..., { replace: true })` + **필터 변경 시 첫 페이지 복귀**(규칙 5)
- [ ] T320 [US3] 검색 연결 + 디바운스 in src/features/points/components/PointTopNav.tsx — `AppInput variant="search"`에 `value`/`onChange`. **300ms 디바운스**(규칙 6) — 없으면 글자 수만큼 요청이 나간다. URL 키는 `search`
- [ ] T321 [US3] URL↔쿼리 연결 in src/pages/service/points/PointsPage.tsx — `useQueryParams<'search' | 'authMethod' | 'useYn' | 'page'>` + `lib/pointListParams.ts` 변환(022 자산). 🔴 **변환은 그 한 자리에만**(규칙 8)
- [ ] T322 [US3] 빈 결과 처리 — 🔴 **필터 0건과 조회 실패를 다르게 그린다**(§4). "조건에 맞는 지점이 없습니다" vs "다시 시도"
- [ ] T323 [US3] [P] vitest in src/pages/service/points/\_\_tests\_\_/PointsPage.test.tsx — 검색어 입력 → URL 반영 + 요청 파라미터 / 필터 변경 시 첫 페이지 복귀 / 뒤로가기에서 필터 보존 / `ALL_VALUE`는 URL에 안 남음 / 필터 0건 ≠ 실패

## Phase 4: Polish

- [ ] T324 [P] 로딩 상태 점검 (022 T276 이월) — 목록·상세·변경 각각. 기존 선례(`AppEmpty`·`isPending` disabled)를 따르고 **새 패턴을 만들지 않는다**(A6)
- [ ] T325 🔴 `npm run capture` baseline 재촬영 in docs/ui-current/ (022 T277 이월) — `현장/points--목록+상세` **1장 → 2장**(`points--목록`·`points--상세`)으로 교체 + **나머지 9장 무변화 확인**. ⚠️ 020·021·022에 이어 **네 번째 같은 자리**다 — 🔴 재촬영 전 scratchpad 스크립트로 먼저 확인하고(021 T237 방식), baseline 덮어쓰기는 이상 없음을 확인한 뒤에 한다. 🔴 **상세 라우트가 추가돼 캡쳐 스크립트에 경로를 더해야 한다**
- [ ] T326 브라우저 확인(MSW 모드) (022 T278 이월) — 목록·상세·추가·수정·삭제·검색·필터·페이지 이동 + **분할화면 폭**. DoD #17
- [ ] T327 [P] 문서 4종 — `screens.md`(§1-3 재구성 반영 + **§4 라우트 매핑에 `/points/:pointSeq` 추가** + 🔴 **목업과 갈라진 사실 명시**, OQ-027-A) / `flow.md` §0(목록→상세 전이 추가) / `patterns.md`(**`AppFilterPopover` 등재** + §0 인덱스) / `roadmap.md` §7-1·§12. DoD #18
- [ ] T328 DoD 18개 대조표 작성 + 미충족 사유 명시 in specs/phase3/027-point-screen-split/tasks.md

---

## Dependencies & Execution Order

- **T305 → T307·T309.** 라우트가 없으면 상세 페이지도, 행 클릭 이동도 만들 수 없다
- **T307 → T309.** 🔴 **갈 곳이 먼저 있어야 한다.** 목록을 먼저 바꾸면 행 클릭이 빈 라우트로 간다
- **T308 → T309.** 컬럼 정의가 있어야 테이블을 조립한다
- **T309 → T310.** 구조가 바뀐 뒤에 테스트를 맞춘다
- **T306은 독립** `[P]` — 다만 Phase 1 안에서 끝낸다(상세 페이지에서 탭이 꺼진 채 Phase 2로 넘어가지 않는다)
- **Phase 1 → Phase 2·3.** 🔴 **Phase 2와 3은 서로 독립**이라 순서를 바꿔도 된다. 사용자 결정(2026-10-08): **2 → 3**
- **T312 → T313 → T314 → T315.** 전부 상세 페이지 한 자리를 만지므로 **병렬 금지**
- **T317 → T318·T319.** 공용 컴포넌트가 선 뒤에 소비한다
- **T319·T320 → T321 → T322·T323**
- **T325 → T326.** 캡쳐가 깨지지 않음을 확인한 뒤 브라우저 체크리스트를 돈다
- **T327·T328은 마지막.** 코드가 확정된 뒤 문서를 맞춘다
- `[P]` 끼리 병렬 가능: (T316) / (T318) / (T324·T327)

**Phase 간 요약**

```
Phase 1 (라우트 + 목록 테이블 — 🔴 한 묶음)
  ├─→ Phase 2 (상세 페이지 UI)        ┐
  └─→ Phase 3 (필터·검색·페이지)      ┘ 서로 독립 · 결정된 순서는 2 → 3
                                        ↓
                                   Phase 4 (캡쳐·브라우저·문서)
```

---

## 구현 시 유의사항 (착수 전 예상)

> 결과는 WF-4에서 "예상 → 실제"로 덧붙인다.

- 🔴 **T309가 가장 큰 덩어리다.** 한 파일에서 우측 패널 제거 + 테이블 조립 + 네비게이션이 동시에 일어난다. 중간에 멈추면 typecheck가 red다 — 제약 1 그대로
- 🔴 **T310에서 "테스트를 지우고 싶은 충동"이 온다.** 11건이 사라지는 컴포넌트에 걸려 있다. **이설이 목적**이다 — 022에서 고정한 계약(미사용 톤다운·뱃지 숨김·B-6 폴백)이 테이블에서도 유효한지가 핵심이고, 지우면 그 계약이 조용히 풀린다
- **T313이 애매할 수 있다.** `PointDetail`을 "페이지 본문"으로 남길지 페이지에 흡수할지는 구현하며 판단한다. 다만 **테스트 8건을 살리는 쪽**을 기본으로 한다
- **T317의 범위가 번질 수 있다.** `AppFilterPopover`에 날짜 범위·다중 선택까지 넣고 싶어지는데, 027이 쓰는 것은 **단일 선택 2종뿐**이다. 나머지는 소비처가 생길 때 넓힌다(A6). `/patrol/points`의 기간·순찰자 필터는 **024 몫**
- **T325는 네 번째 같은 자리다.** 020(토큰 seed)·021(`siteSeq` seed)·022(이월)에 이어서다. 이번엔 **라우트가 하나 늘어** 캡쳐 스크립트 수정이 함께 필요하다 — 빼먹으면 상세 baseline이 아예 안 찍힌다
- **반응형은 이번에 확정하지 않는다**(OQ-027-D). 분할화면에서 **카드형 리스트로 갈 가능성**이 있어(사용자 2026-10-08) 컬럼 숨김 우선순위를 지금 굳히면 버리게 된다. Phase 4 브라우저 확인에서 실제 폭을 보고 **다음 spec에서 결정**한다

---

## 진행 기록

> WF-3 각 Phase 완료 시 추가한다.

### Phase 1 완료 — 라우트 + 목록 테이블 전환 (2026-10-08)

- T305~T311 완료. 신설 3파일(`PointDetailPage.tsx` · `PointColumn.tsx` · `PointColumn.test.tsx`) + **제거 3파일**(`PointList.tsx` · `PointListCard.tsx` · `PointListCard.test.tsx`) + 기존 5파일 수정
- `npm run verify` **0 errors** + `npm run test` **49 files / 397 tests green**(395 → **+2**)
- ✅ **깨질 테스트 사전 계수가 정확히 맞았다** — `PointListCard` 11건 전부(파일째 로드 실패), `PointsPage` 9건 중 **5건**. `AuthMethodDisplay` 3건·폼 20건은 **무변경**(제약 3 준수 효과)
- 🔴 **테스트를 이설했지 버리지 않았다.** `PointColumn.test.tsx` **14건**(11 → +3) — 022가 고정한 계약 3개(미사용 구분·뱃지 숨김·B-6 폴백)를 테이블 기준으로 다시 묶고, 날짜 포맷·깨진 날짜·`'Unknown'` 폴백을 더했다. 카드 고유였던 번호 뱃지 강조·`selected` prop 2건은 **선택 개념이 사라져** 따라오지 않았다
- 🔴 **계획 외 결함 1건 — `pointColumns()` 를 렌더마다 호출하면 행이 통째로 리마운트된다.** `cell` 함수의 참조가 매번 바뀌고 `flexRender` 가 그것을 **새 컴포넌트 타입**으로 보아 React 가 언마운트→리마운트한다. 화면은 같아 보이지만 DOM 노드가 교체돼 ① 포커스·선택이 날아가고 ② 재조회마다 깜빡인다. **테스트가 "찾은 노드가 document 에서 분리됨" 으로 잡아냈다** — `useMemo` 로 해소. ⚠️ **`/patrol/points` 도 같은 모양**(`pointColumns(setSelectedRecord)` 인라인)이라 024에서 확인 대상
- **미사용 지점 표시가 뱃지로 승격됐다.** 340px 제약이 사라져 "사용/미사용" 컬럼이 들어갔고, 022에서 넣은 `sr-only` 는 제거했다 — 뱃지가 `design-system.md` §3("색만으로 상태 전달 금지")을 정식으로 충족하므로 중복 낭독이 된다
- **022의 파생 2개가 함께 사라졌다** — "첫 행 자동 선택" 과 "선택이 목록에서 빠지면 비우기". 선택 개념이 URL 로 옮겨가 목록은 목록만 그린다
- `CourseTabs` 의 `end` 를 뺐다. 🔴 **`/zones` 도 `spec 023` 에서 같은 구조가 되므로 둘 다 미리 맞췄다**
- `PointTopNav` 는 **자리만 정리**했다(검색창 고정 폭 + 추가 버튼 우측). 와이어링은 Phase 3 — 지금 옮기면 필터 바가 들어올 때 또 옮긴다(A3)
- ⚠️ **상세 페이지는 최소 골격이다**(기존 `PointDetail` 카드를 그대로 얹음). 헤더·액션 풋터·섹션 재배치는 Phase 2
- 🔴 **Phase 1 종료 후 컬럼 2개를 뺐다**(사용자 결정 2026-10-08) — 설명·TAG ID 는 목록에서 지점을 고르는 데 쓰이지 않고 둘 다 길어 폭만 먹는다. **상세 전용**으로 돌렸고 테이블은 5컬럼이 됐다. "목록에 나오지 않는다" 를 테스트로 고정했다(되돌아오는 것을 막는다). 부수 효과로 분할화면 여유가 생겨 OQ-027-D 가 쉬워졌다
- 🔴 **Phase 1 종료 후 UI 수정 2건**(사용자 결정 2026-10-08)
  - **추가 버튼: 아이콘 → 아이콘 + 라벨**(`[+ 지점 생성]`), `xl` 미만에서는 아이콘만. `AppIconButton` → `AppButton` 으로 바꾸고 라벨을 `hidden xl:inline` 으로 감쌌다. 🔴 **`aria-label` 을 남겼다** — 라벨이 숨는 폭에서 버튼에 접근 가능한 이름이 사라지는데, **넓은 폭에서는 멀쩡해 보여 조용히 회귀한다.** 테스트 3건으로 고정(⚠️ jsdom 은 Tailwind 를 적용하지 않아 **숨김 자체는 검증 불가** — 브라우저 확인 T326 몫)
  - **반응형 단계를 `xl` 하나로 확정** → `design-system.md` §2-5 에 기록. 대응 대상이 "모바일 전용" 이 아니라 **PC 분할화면** 하나라 "편다/덜어낸다" 두 상태면 충분하다. ⚠️ **적용은 새 코드부터** — 기존 `sm`/`md`/`lg` 사용처가 **25곳**(sm 14·md 9·lg 2) 있어 일괄 변경은 화면 전반 재검증을 부른다. 그 화면을 손볼 때 함께 정리하고, `patterns.md` §8 의 `xl` 기준은 이미 일치함을 명시했다
  - **추가 버튼 hover 교정** — `hover:bg-point-bg/80` 이 **투명도를 낮추는** 것이라 `--point-bg`(oklch 0.955, 거의 흰색)가 흰 배경에 **더 묻혔다.** 상호작용이 아니라 비활성처럼 읽힌다 → `hover:bg-point/20`(한 단계 진하게). 🔴 **재발할 종류라 `design-system.md` §2-6 에 규칙으로 남겼다** — 솔리드 버튼의 `hover:bg-primary/90` 이 통하는 것은 원색이 어두워서지 같은 규칙이 아니다. 같은 패턴은 코드에 이 한 곳뿐이었다(grep 확인)
- 다음: Phase 2(T312~T316) — 상세 페이지 UI. 🔴 T312~T315가 **한 파일을 만져 순차**
