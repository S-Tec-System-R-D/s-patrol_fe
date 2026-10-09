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

- [x] T312 [US2] 상세 페이지 레이아웃 in src/pages/service/points/PointDetailPage.tsx — 뒤로가기 + 지점명 헤더 + 기본정보·소속 코스·인증수단 섹션. 🔴 **`DetailRow`·`DetailSection`·`AuthMethodDisplay`·`ZoneRow`를 그대로 쓴다**(제약 3 — 테스트 3건 보존)
- [x] T313 [US2] `PointDetail` 카드 → 페이지 본문으로 정리 in src/features/points/components/detail/PointDetail.tsx — 카드 테두리·헤더를 페이지가 갖도록 넘기고 본문만 남긴다. ⚠️ **파일을 지우지 않는다** — 섹션 조립이 그대로 쓰이고, 지우면 테스트 8건이 통째로 사라진다
- [x] T314 [US2] 액션 풋터 + 모달 재배치 — 수정은 `AppDialog`(모달 유지, 규칙 10), 삭제는 `AppAlertDialog`. 🔴 **폼 2개는 손대지 않는다**(테스트 20건 보존)
- [x] T315 [US2] 삭제 후 이동 처리 — 🔴 **성공 시 `navigate(paths.service.points)`, 실패 시 머문다**(규칙 13). `PointDetail.test.tsx` 5건을 "선택 해제" → "navigate 호출"로 교체. 🔴 **실패 시 navigate가 호출되지 않는 것**을 명시 고정 — 거부인데 화면이 바뀌면 삭제된 것처럼 보인다
- [x] T316 [US2] [P] 상세 라우트 엣지 테스트 in src/pages/service/points/\_\_tests\_\_/PointDetailPage.test.tsx — 없는 `pointSeq`(400) → 안내 + 목록 복귀 수단 / 새로고침 시 유지 / 🔴 **`/404`로 가지 않음**

## Phase 3: US2 — 상세 확장 (목업 `지점상세-신규.html` 반영, 2026-10-09 추가)

> **독립 테스트 기준**: 상세에 **통계 3칸 · 순찰 인증 기록 · 같은 사업장의 다른 지점**이 있고, 기본정보가 8칸(4칸은 placeholder)이다. 변경 이력·QR 카드 **섹션이 남아 있고** 막힌 이유가 적혀 있다. `npm run test` green.
>
> 🔴 **왜 필터(Phase 4)보다 앞인가**: 상세 확장이 커졌고 사용자가 지금 상세를 보고 있다. 필터는 022 이월분이라 급하지 않고, 둘은 **서로 독립**이다(Phase 1에만 종속). **태스크 ID 는 그대로 두고 묶음 순서만 바꿨다** — ID 는 Phase 무관 일련번호다(템플릿 규약).
>
> ⚠️ **8섹션 중 2개는 placeholder 다.** 지우지 않는다(OQ-027-E) — 지우면 "설계에 없던 것" 이 되어 나중에 다시 논의해야 한다.

- [x] T329 지점 순찰이력 api + 훅 in src/features/points/api/pointHistory.ts · src/features/points/hooks/usePointHistory.ts — `GET History/W/sign/GetPointHistory`. 🔴 **응답은 실측돼 있다**(`api-spec.md` §5-2 19번 `PointHistoryRow`). 파라미터는 `siteSeq`·`pointSeq`·`fromDt`·`toDt`·`pageNumber`·`pageSize`. `queryKey` 는 `data-model.md` §8 규약을 따른다(스코프 값 포함)
- [x] T330 30일 집계 순수함수 in src/features/points/lib/patrolSummary.ts — 🔴 **전용 집계 API 가 없다.** `PointHistoryRow[]` → 날짜별 버킷 + 총 횟수. 순수함수로 빼서 테스트한다(경계: 0건·하루 다건·기간 밖)
- [x] T331 [P] vitest in src/features/points/lib/__tests__/patrolSummary.test.ts
- [x] T332 MSW 핸들러 in src/mocks/handlers/points.ts — `GetPointHistory`. 🔴 **지점별로 다른 기록을 준다**(0건 지점 포함) — 전부 같으면 "기록 없음" 경로를 화면에서 볼 수 없다. 022 의 `resetPointStore` 와 같은 자리에 둔다
- [x] T333 [US2] 통계 3칸 in src/features/points/components/detail/PointStats.tsx — 30일 인증 / 최근 순찰 / 소속 코스. ⚠️ **목업의 "QR 발행" 4번째 칸은 뺀다**(B-23 — 발행 메타가 서버에 없다)
- [x] T334 [US2] 기본정보 확장 + 행 placeholder in src/features/points/components/detail/PointDetail.tsx — 8칸 2열. 🔴 **4칸은 점선 + `준비 중`**(지점 코드 B-21 · 상세 위치 B-20 · 등록/최근 수정 B-19). 사업장명은 021 저장값(`getSiteName()`)
- [x] T335 [US2] 순찰 인증 기록 섹션 in src/features/points/components/detail/PointPatrolLog.tsx — 날짜별 막대 + 목록. 0건이면 **빈 상태**(placeholder 아님 — 기능은 있고 데이터가 없는 것이다). "전체 기록" → `/patrol/points` 링크
- [x] T336 [US2] 같은 사업장의 다른 지점 in src/features/points/components/detail/SiblingPoints.tsx — `GetPointList(siteSeq)` 재사용. 현재 지점은 `현재` 표시 + 링크 제외. 코스 N 은 `usedCount`
- [x] T337 🔴 placeholder 2종 신설 in src/features/points/components/detail/PendingBlock.tsx — **행용**(값 자리 점선 + `준비 중`)과 **섹션용**(점선 카드 + 뱃지 + 사유 한 줄). 🔴 **`AppEmpty` 를 쓰지 않는다** — 변경 이력은 실제로 비어 있을 수도 있어 "데이터 없음" 과 섞이면 구분이 불가능하다. ⚠️ 공용(`components/app/`)으로 빼지 않는다 — 사례가 이 화면 2곳뿐이다(A6)
- [x] T338 [US2] 변경 이력 · QR 카드 **섹션 placeholder** 배치 — 각각 막힌 이유를 적는다(B-22 / B-23·OQ-022-D). 소속 코스의 **"코스에 추가" 버튼도 비활성 + 사유**(코스 편성 API 는 `spec 023`)
- [x] T339 [US2] 상세 2단 레이아웃 재배치 in src/pages/service/points/PointDetailPage.tsx — 좌(기본정보·소속 코스·순찰 인증 기록) / 우(인증 수단·변경 이력·같은 사업장 지점). `xl` 미만 1단
- [x] T340 [US2] [P] vitest in src/features/points/components/detail/__tests__/ · src/pages/service/points/__tests__/PointDetailPage.test.tsx — 통계 집계 표시 / 기록 0건 빈 상태 / 🔴 **placeholder 가 빈 상태와 다른 것** / 섹션이 지워지지 않은 것 / 형제 지점 목록

## Phase 4: US3 — 검색·필터·페이지 이동 (022 US5 이월)

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

## Phase 5: Polish

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
- **Phase 1 → Phase 2·3·4.** 🔴 **Phase 2·3(상세)와 Phase 4(필터)는 서로 독립**이다. 사용자 결정: 상세를 먼저(**2 → 3 → 4**)
- **T329 → T330 → T333·T335.** 이력 응답이 있어야 집계가 있고, 집계가 있어야 통계 칸이 있다
- **T332 → T335·T340.** MSW 핸들러가 그 화면·테스트의 전제다
- **T337 → T334·T338.** placeholder 컴포넌트가 선 뒤에 소비한다
- **T333~T338 → T339.** 섹션이 다 있어야 배치를 정한다
- **T312 → T313 → T314 → T315.** 전부 상세 페이지 한 자리를 만지므로 **병렬 금지**
- **T317 → T318·T319.** 공용 컴포넌트가 선 뒤에 소비한다
- **T319·T320 → T321 → T322·T323**
- **T325 → T326.** 캡쳐가 깨지지 않음을 확인한 뒤 브라우저 체크리스트를 돈다
- **T327·T328은 마지막.** 코드가 확정된 뒤 문서를 맞춘다
- `[P]` 끼리 병렬 가능: (T316) / (T318) / (T324·T327)

**Phase 간 요약**

```
Phase 1 (라우트 + 목록 테이블 — 🔴 한 묶음)
  ├─→ Phase 2 (상세 기본 UI) → Phase 3 (상세 확장 — 목업 반영)  ┐
  └─→ Phase 4 (필터·검색·페이지, 022 이월)                        ┘ 상세와 독립
                                                                   ↓
                                              Phase 5 (캡쳐·브라우저·문서)
```

🔴 **Phase 3 는 2026-10-09 에 추가됐다.** 재구성 목업(`지점상세-신규.html`)이 생기면서 상세가 **8섹션**으로 커졌다. Phase 4(필터)와 **독립**이고, 사용자 결정으로 **상세를 먼저** 한다. 번호를 재배치했지만 **태스크 ID 는 그대로다**(Phase 무관 일련번호 — 템플릿 규약).

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

### Phase 2 완료 — 상세 페이지 UI (2026-10-08)

- T312~T316 완료. 신설 1파일(`PointDetailPage.test.tsx`) + 기존 3파일 수정
- `npm run verify` **0 errors** + `npm run test` **51 files / 413 tests green**(400 → **+13**)
- 🔴 **사전 계수가 빗나갔다 — 좋은 쪽으로.** `PointDetail.test.tsx` 5건이 깨질 것으로 봤는데 **0건 깨졌다.** 액션을 하단 풋터에서 헤더 우측으로 **옮기기만** 하고 **버튼 이름·`onDeleted` 계약을 그대로 뒀기** 때문이다. 테스트가 배치가 아니라 **동작**에 걸려 있어서 레이아웃 변경을 흡수했다 — 022에서 "이름으로 고른다"고 쓴 것이 여기서 값을 했다
- **액션을 헤더 우측으로 올렸다.** `patterns.md` §11(마스터-디테일의 액션 풋터)은 **우측 패널 전제**다. 전체 폭에서 하단 full-width 버튼 2개는 과하고, 본문이 길면 **스크롤 아래로 밀려 보이지 않는다**(패널은 높이가 고정이라 괜찮았다). → §11 의 "사용 화면" 에서 지점 상세를 빼고 **페이지 변형**을 절로 추가했다. 🔴 **023 코스 상세도 페이지가 되면 이쪽을 따르고, 그때 패턴으로 승격**한다(지금은 사례 1건 — A6)
- **본문을 2단으로 폈다**(`xl` 이상, 미만 1단). 340px 패널에서는 세로로 쌓을 수밖에 없었다. 방금 확정한 단일 breakpoint 규칙의 **첫 적용처**다
- 🔴 **중복 3건을 걷어냈다** — ① "이름" 행은 헤더 제목과 같은 값 ② "사용여부" 행은 헤더 뱃지로 올림(목록과 같은 표현) ③ 생성일은 022에서 이미 제거. 패널 헤더는 작아 티가 안 났지만 **페이지에서는 바로 위에 같은 값이 두 번 보인다.** 셋 다 "없다" 를 테스트로 고정했다 — 조용히 되살아나는 것을 막는다
- 🔴 **삭제 후 이동을 페이지 테스트로 고정했다**(T315) — 성공 시 목록 복귀 / **거부 시 머문다**. 022에서는 "선택 해제" 였고 027에서 "이동" 으로 바뀌어, 잘못하면 **거부에도 목록으로 튕긴다**. 거부인데 화면이 바뀌면 사용자는 삭제된 것으로 오해한다
- **없는 `pointSeq` 는 `/404` 가 아니다**(T316) — 안내 + **목록 복귀 수단**이 남는지까지 확인한다(막다른 길 방지). 숫자가 아닌 경로(`/points/abc`)는 **조회조차 하지 않는 것**도 고정했다
- ⚠️ 목업(`지점관리-신규.png`)과 갈라진 것이 **2건**이다 — 생성일(OQ-027-B)과 액션 위치. Phase 4 문서 작업(T327)에서 `screens.md` 에 명시한다
- 🔴 **Phase 2 종료 후 레이아웃 수정 2건**(사용자 결정 2026-10-08)
  - **한 카드 → 섹션별 카드 3개**(기본정보 · 인증 수단 · 소속 코스). 한 덩어리에 담으면 전체 폭에서 **세 섹션의 경계가 흐려진다** — 읽는 목적이 다르고 길이도 제각각이다. `xl` 이상 2단, 소속 코스만 전체 폭(개수 가변)
  - **브레드크럼 + 제목을 둘 다** 뒀다. 🔴 **질문이 둘이기 때문**이다 — 브레드크럼(`코스/지점 › 지점 상세`)은 "**어느 화면**인가", 제목(지점명 + 사용 뱃지)은 "**어느 지점**인가". 하나만 두면 반쪽이다: 브레드크럼만이면 어느 지점인지 카드를 읽어야 하고, 제목만이면 `정문 입구` 가 **지점인지 코스인지** 알 수 없다. 브레드크럼 첫 조각이 목록 링크를 겸해 **`← 목록으로` 를 흡수**했다(요소가 늘지 않는다)
  - 🔴 **구조가 한 번 더 갈렸다** — `PointDetail` 이 **순수 표시 본문**이 되고 제목·뱃지·액션·mutation 이 **페이지로** 갔다. 그 결과 `PointDetail.test.tsx` 의 **수정 3건·삭제 5건이 `PointDetailPage.test.tsx` 로 이동**했다(앞서 "0건 깨짐" 이라 적었던 것이 이 수정으로 결국 8건 이동이 됐다 — 레이아웃을 다시 바꾸면 주인도 바뀐다). 본문 테스트는 **섹션 3개·중복 없음**만 본다
  - 정리 후 **51 files / 411 tests green**(413 → 411: 중복 단언 2건이 통합됐다)
- 🔴 **Phase 2 종료 후 상세 UI 수정 4건**(사용자 결정 2026-10-08)
  1. **제목 줄 = 지도 아이콘 · 지점명 · 사용 뱃지.** `AppPageHeader` 에 `icon`·`titleSuffix` **선택 prop 2개**를 더했다(기존 호출부 무영향). 🔴 **`titleSuffix`(상태)와 `action`(액션)의 자리를 분리**했다 — 성격이 달라 섞으면 "뱃지를 누를 수 있나" 로 읽힌다. 023 코스 상세도 같은 모양이 될 것이라 공용에 뒀다
  2. **기본정보에 "지점명" 행 추가 — 제목과 중복이지만 허용**(사용자 판단). 기본정보 블록만 따로 읽거나 캡쳐할 때 이름이 없으면 무엇의 정보인지 알 수 없다. 🔴 **"사용여부" 는 여전히 본문에 두지 않는다** — 상태는 한 곳(제목 옆 뱃지)에서만
  3. **인증 수단 카드에 설명 한 줄.** `DetailSection` 에 `description` 선택 prop. 섹션 제목만으로 "무엇을 정하는 값인지" 알기 어려운 곳에만 쓴다
  4. **수정·삭제 버튼 배경 흰색**(`bg-card`). 두 variant 모두 `bg-transparent` 라 카드 밖 페이지 배경에서 떠 보였다. `/patrol/points` 의 내보내기 버튼이 같은 선례
  - ⚠️ **테스트 11건이 깨졌다 — 전부 같은 원인**: 지점명이 제목·본문 두 곳에 생겨 `findByText` 가 **중복으로 걸렸다**. `findByRole('heading', …)` 로 바꿔 해소. 🔴 **중복을 허용하기로 한 결정의 비용**이고, 앞으로 같은 화면에서 이름을 단언할 때는 역할로 골라야 한다
  - 정리 후 **51 files / 412 tests green**
- 🔴 **실제 렌더를 캡쳐해 검토한 뒤 수정 2건**(2026-10-08). playwright 로 1280·1100px 를 찍어 눈으로 봤다 — 코드만 읽어서는 안 보이던 것들이다
  - **A. 인증수단 세그먼트 → 값 표시.** `AuthMethodDisplay` 가 `AuthMethodSelector`(폼 필드)와 **똑같이 생겨** QR/NFC 2칸 중 하나가 강조된 모양이었다. 클릭만 안 될 뿐 **토글로 보인다** — 조회 화면에서 **선택되지 않은 값을 보여줄 이유가 없고** 그것이 오해를 만든다. 현재 값 하나만 뱃지로 그린다. 🔴 **컴포넌트를 지우지 않고 렌더만 바꿨다**(소비처·prop 계약 유지) — 테스트 3건은 "2칸 중 하나 강조" 전제라 **값 표시 기준으로 교체**했다. 022 제약 2(정수 prop 금지)는 그대로 지킨다
  - **B. `DetailRow` 를 좌측 2열로**(라벨 `w-24` 고정 + 값 바로 옆). `justify-between` 은 **340px 패널에서 만들어진 것**이고, 전체 폭에서 라벨-값 거리가 580~940px 까지 벌어져 눈이 따라가지 못했다. TAG ID 도 같은 행 형식으로 통일(카드마다 다른 모양을 쓰지 않는다)
  - 🔴 **"페이지 최대 폭 제한(C)" 은 철회했다** — 사용자 지적이 맞았다. ① `max-w-*` 선례가 코드에 **0건**이고 `layout.md` 에도 폭 규정이 없어 **이 화면만 좁아진다** ② **B 가 원인을 직접 제거**하므로 C 는 증상 치료다(둘 다 하면 과잉) ③ 폭 제한의 정당한 근거는 **산문**(45~75자)이고 라벨-값 목록은 표라 좌측 정렬이면 길어도 읽힌다. 남는 세로 여백은 **폭 문제가 아니라 정보량 문제**이며 다른 페이지도 데이터가 적으면 빈다. 전역 규칙으로 세울 거라면 `layout.md` 에 넣고 **모든 상세에 동시 적용**해야 한다 — 027 범위 밖
  - ⚠️ **미적용 2건** — 소속 코스를 `/zones` 링크로(D) · `ZoneRow` 의 의미 불명 점 제거(E). 사용자 판단 대기
  - ⚠️ **`DetailRow` 중복이 남아 있다** — `components/app/AppDetailRow`(공지·근무자·코스이력 3곳 사용)가 같은 일을 한다. **027 은 지점 쪽만 바꿨다.** 괜찮으면 그쪽으로 통합(사용자 결정: 1번 → 확인 후 2번)
- 다음: Phase 3(상세 확장) → Phase 4(필터)

### Phase 3 완료 — 상세 확장 (2026-10-09)

- T329~T340 완료. 신설 8파일(이력 타입·api·훅 · 집계 함수+테스트 · 통계 · 순찰기록 · 형제지점 · placeholder) + 기존 5파일 수정
- `npm run verify` **0 errors** + `npm run test` **52 files / 432 tests green**(412 → **+20**)
- 🔴🔴 **`npm run typecheck` 가 아무것도 검사하지 않고 있었다 — 이번에 발견해 고쳤다.** 루트 `tsconfig.json` 이 `files: []` + `references` 구조라 **`tsc --noEmit`(비-build 모드)는 참조 프로젝트를 건드리지 않는다.** `tsc -b` 로 바꾸니 **에러 5건**이 나왔다. 그중 **3건은 기존 문제**로, 언제 들어왔는지 모른 채 통과하고 있었다:
  - `zone-tree/PointNode.tsx` — `features/zone/types` 는 `PointType` 을 re-export 하지 않는데(`ZonePointType` 만) 거기서 import 하고 있었다 → **끊긴 import**
  - `EditPointForm.test.tsx` — `authMethodName: null` 전달. 타입은 `string` 이다(서버는 `''`/`'Unknown'` 으로 준다 — B-6)
  - `jwt.test.ts` — `AccessTokenClaims` → `Record<string, unknown>` 직접 단언(인덱스 시그니처 없음)
  - ⚠️ **021 이월의 "`strict` 가 `src` 에 미적용" 보다 심각한 문제였다** — strict 여부가 아니라 **검사 자체가 0건**이었다. 그 이월 항목은 이걸로 해소된다
- 🔴 **mock 정합 결함 1건 — 캡쳐로 발견.** 통계 "최근 순찰"(`toMockPoint` 의 고정 날짜)과 순찰 기록 목록(오늘 기준 생성)이 **다른 날짜**였다. `lastPatrolDt` 를 **이력에서 파생**하도록 바꿨다 — 실 서버는 같은 데이터에서 나오므로 mock 도 한 출처에서 뽑아야 한다. **mock 이 실 서버보다 이상하게 굴면 디버깅이 두 배가 된다**
- 🔴 **전용 집계 API 가 없어 클라이언트가 센다.** `lib/patrolSummary.ts` 순수함수 + 테스트 10건으로 경계를 전부 고정했다(0건 · 하루 다건 · 시작일 포함 · 하루 밖 제외 · 미래 · 깨진 날짜). 화면에서는 "숫자가 좀 이상한데" 로만 보여 원인을 못 찾는 종류다. ⚠️ 기간이 길어지면 **서버 집계를 요청**해야 한다(지금은 `pageSize: 200` 한 페이지 가정)
- 🔴 **기준일을 `useMemo` 로 고정했다.** `new Date()` 를 렌더마다 만들면 `queryKey` 가 매번 바뀌어 **무한 재조회**가 된다
- `queryKey` 루트를 `'point-history'` 로 **따로 뒀다** — 지점을 수정·삭제해도 이력은 안 바뀌므로 `lists`·`detail` 무효화에 딸려 들어가면 불필요한 재조회다
- **MSW 는 지점마다 다른 이력을 준다**(3의 배수는 0건). 전부 같게 주면 **"기록 없음" 경로를 화면에서 한 번도 볼 수 없다** — 022 가 미사용·미순찰 지점을 심어 둔 것과 같은 이유
- **placeholder 2종**(`PendingBlock`) — 행용/섹션용. 🔴 **`AppEmpty` 를 쓰지 않는다**: 변경 이력은 실제로 비어 있을 수도 있어 섞이면 "기록이 없는 것" 인지 "기능이 없는 것" 인지 구분이 불가능하다. 섹션 placeholder 는 **막힌 이유(B 번호)를 반드시 적는다**
- 인증 수단을 본문에서 떼어 `PointAuthCard` 로 분리(우측 컬럼). 본문은 "무엇을 그릴지" 만 알고 **2단 배치는 페이지가 정한다**
- ⚠️ **미적용 2건**(사용자 판단 대기) — 소속 코스를 `/zones` 링크로(D) · `ZoneRow` 의 의미 불명 점 제거(E)
- 🔴 **브라우저 확인 후 수정 2건**(사용자 결정 2026-10-10)
  - **"같은 사업장의 다른 지점" 섹션 제거.** 상세에서 다른 지점으로 건너뛰는 동선은 **목록이 이미 한다** — 사이드에 10건을 쌓아 두면 본문보다 길어지고, 지점이 많은 사업장에서는 더 나빠진다. `SiblingPoints.tsx` 삭제. "없다" 를 테스트로 고정했다
  - 🔴 **"인증 수단" 섹션을 기본정보 행으로 녹이고, 우측 카드를 수단별로 분기**했다(`PointCredentialCard`). 값 하나(QR/NFC)뿐인 섹션을 따로 둘 이유가 없었고, 우측 카드는 **그 수단이 실제로 쓰는 자격증명**을 맡는 쪽이 역할이 분명하다
    - **NFC** → **TAG ID 실 데이터**(placeholder 아님 — `nfcTagId` 는 022에서 실측). TAG ID 가 없으면 등록 안내(B-13 — 서버가 강제하지 않는다)
    - **QR** → placeholder(B-23 발행 메타 없음 + OQ-022-D QR 생성)
    - 🔴 **둘을 같은 "준비 중" 으로 묶지 않는 것이 핵심이다** — 묶으면 **되는 것(NFC)까지 안 되는 것처럼** 보인다
  - ⚠️ **"최근 순찰" 행도 기본정보에서 뺐다** — 통계 칸과 **같은 값**이다. 기본정보는 8칸을 유지한다(지점명·지점코드·사업장·상세위치·설명·인증수단·등록·최근수정)
  - `DetailRow` 의 `value` 를 `ReactNode` 로 넓혔다(뱃지를 넣기 위해)
- 🔴 **브라우저 확인 후 수정 2건 (2026-10-10, 2차)**
  - **차트를 `recharts` 로 교체**(사용자 결정 — 라이브러리 신규 도입 `recharts@3.10.1`). 직접 그린 div 막대는 **축·눈금·툴팁이 없어 "차트만 보고는 아무것도 파악할 수 없었다"**(사용자 지적). 이제 x축 일자·y축 정수 눈금·호버 툴팁(날짜 + N회)이 있다. 🔴 **프로젝트의 첫 차트라 `components.md` 에 컨벤션 8줄을 등재**했다 — 색은 CSS 변수(다크 모드), 단일 계열은 범례 없음, 축 양 끝 필수 라벨, 정수 눈금, 이중 축 금지 등
    - ✅ 팔레트 검증 통과(`dataviz` 검증 스크립트): 밝기 밴드·채도 하한·표면 대비 3:1
    - 🔴 **캡쳐로 또 잡았다** — `interval` 에 맡겼더니 **마지막 날(= 오늘)에 라벨이 없었다.** 기간의 양 끝을 모르면 "최근 30일" 이 어디부터인지 알 수 없다 → `ticks` 배열로 양 끝 포함 직접 지정
  - **인증수단 뱃지 크기 조정** — `px-3 py-1.5` 가 행보다 커서 그 줄만 튀었다. 행 높이에 맞춰 `px-1.5 py-0.5 text-[11px]` + 아이콘 12px
- 다음: Phase 4(T317~T323) — 검색·필터·페이지 이동. 🔴 `AppFilterPopover` 신설이 가장 큰 덩어리
