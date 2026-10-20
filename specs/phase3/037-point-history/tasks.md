# 037-point-history tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 036 이 **T528** 에서 끝났으므로 **T529** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **위험도 B → 화면 단위로 크게 쪼갠다.** 다만 **Phase 2(중복 통합)는 027 화면을 건드리므로**
> 잘게 두고 회귀 확인을 붙인다 — 036 이 공용 기반을 세울 때와 같은 이유다.

---

## Phase 1: Setup — 서버 모듈 (US1·US2 선행)

> **독립 테스트 기준**: `pointHistoryListParams` 단위 테스트가 `pageSize > 100` 을 깎고
> 빈 값에서 키를 빼는 것이 고정된다.

- [x] T529 `PointHistoryParams` 를 **목록·상세 양쪽이 쓰는 모양으로 넓힌다** in src/features/course-history/types/history.ts — 🔴 지금 두 곳에 **좁은 것과 없는 것**이 따로 있다: `points/types/history.ts` 는 `pointSeq` **필수**(027 전용), `course-history` 는 params 선언이 **없다**. `siteSeq` 필수 + 나머지 전부 옵셔널(`courseSeq`·`pointSeq`·`authMethod`·`status`·`fromDt`·`toDt`·`userName`·`courseName`·페이징)
- [x] T530 [P] `PointHistoryDetail` 타입 선언 in src/features/course-history/types/history.ts — `api-spec.md` §5-2 20번 **실측 그대로 전량**. ⚠️ 목록과 **다른 것 3개**를 주석으로 박는다: `overtimeYn`(소문자 t) · `authMethodName` null 이 **`'Unknown'`** · `pauseTime: number`(B-5)
- [x] T531 `pointHistoryListParams.ts` 신설 in src/features/course-history/lib/pointHistoryListParams.ts — 🔴 **`courseHistoryListParams.ts` 와 같은 모양**. `clampPageSize`·`toPageIndex`/`toPageNumber` 는 **재사용**하고 다시 만들지 않는다. URL 키: `from`·`to`·`course`·`auth`·`result`·`user`·`page`·`size`
- [x] T532 [P] `pointHistoryKeys` 추가 in src/features/course-history/queryKeys.ts — `lists`/`list(params)`/`detail(detailSeq)`. 🔴 **`siteSeq` 를 키에 포함**(규약 2 — 사업장 전환 시 이전 사업장 이력이 그대로 보인다). ⚠️ `detail` 은 `detailSeq` 가 전역 유일이라 `siteSeq` 불필요
- [x] T533 `getPointHistoryDetail.ts` 신설 in src/features/course-history/api/getPointHistoryDetail.ts — `GET History/W/sign/GetPointHistoryDetail?detailSeq`
- [x] T534 [P] `pointHistoryListParams` 테스트 in src/features/course-history/lib/__tests__/pointHistoryListParams.test.ts — 상한 100 · 1-based · 빈 값 키 제거 · 깨진 URL 수렴

## Phase 2: Foundational — 🔴 중복 통합 (027 화면이 함께 움직인다)

> **독립 테스트 기준**: `npm run test` green + 지점 상세(`/points/:pointSeq`)의 "순찰 인증
> 기록"·"2주 인증" KPI 가 **통합 전과 같은 값**을 그린다. 🔴 여기서 멈추고 확인한다 —
> 다음 Phase 로 넘어간 뒤 깨지면 원인이 두 겹이 된다.

- [x] T535 소비처 3곳을 공용 타입으로 전환 in src/features/points/hooks/usePointHistory.ts · src/features/points/components/detail/PointPatrolLog.tsx · src/features/points/lib/patrolSummary.ts — import 를 `@/features/course-history/types` 로. 🔴 **동작은 바꾸지 않는다**(타입 출처만 옮긴다)
- [x] T536 `fetchPointHistory` 호출부를 한쪽으로 in src/features/points/hooks/usePointHistory.ts — `course-history/api/getPointHistory.ts` 를 쓴다
- [x] T537 🔴 **삭제 2파일** in src/features/points/types/history.ts · src/features/points/api/pointHistory.ts — T535·T536 뒤. ⚠️ `points/types/index.ts` 의 re-export 도 함께 정리한다
- [x] T538 구 `PointAuthenticationMethod`·`PatrolPoint` 타입 소멸 in src/features/patrol-points/types/PatrolPoint.ts — 🔴 **022 OQ-022-H · 023 DoD #15 의 종결점**. 036 은 `patrol-points` 가 쓰고 있어 못 지웠다. 남은 참조를 grep 으로 0건 확인하고 삭제
- [x] T539 [P] 027 회귀 테스트 확인 in src/features/points/lib/__tests__/patrolSummary.test.ts · src/features/points/components/detail/__tests__/ — 기존 테스트가 그대로 통과하는지. 🔴 **테스트를 고쳐서 통과시키지 않는다** — 고쳐야 한다면 통합이 동작을 바꾼 것이다

## Phase 3: US1 — 목록 서버 전환

> **독립 테스트 기준**: MSW 200 에서 서버 행이 그려지고, 필터 4종·검색·페이지가 URL 에
> 실려 새로고침·뒤로가기에 보존된다. `pageSize` 는 100 을 넘지 않는다.

- [x] T540 [US1] `usePointHistoryList` 훅 in src/features/course-history/hooks/usePointHistoryList.ts — `useCourseHistoryList.ts` 와 같은 모양(`siteSeq` 확보 → params 조립 → `pointHistoryKeys.list`)
- [x] T541 [US1] 🔴 **컬럼 재작성** in src/features/patrol-points/components/PointColumn.tsx — 서버 필드 기준 8컬럼: 순찰일시(날짜+시각 2줄) · 순찰지점 · 순찰코스 · 인증수단 · 순찰자 · 구간(`pauseTime`) · 결과(**뱃지 2개 병기**) · 기록(**아이콘**, 건수 아님). 🔴 `pointCheckBadge`·`overtimeBadge` **재사용** · 정렬 화살표 **없음** · 층·위치 서브텍스트 **없음** · 코스 dot **없음**
- [x] T542 [US1] 카드 모드 재작성 in src/features/patrol-points/components/PointHistoryCard.tsx — 서버 타입 + **034 타일 골격**(`030/tasks.md:140` · OQ-034-A 종결). ⚠️ **카드 안에 버튼을 둘 수 없다**(`patterns.md` §14) — 기록은 아이콘이므로 문제없다
- [x] T543 [US1] 🔴 **페이지 재작성** in src/pages/service/patrol/points/PatrolPointsPage.tsx — mock 배열(`pointPatrols` 132줄)·`PointPatrolType`·`PATROL_POINT_RESULT` **삭제**. 필터 바는 **036 `PatrolZonesPage` 와 같은 한 줄 배치**(검색 맨 앞 → `role="group"` 필터 → spacer). **내보내기 버튼 제거**
- [x] T544 [US1] 필터 4종 배선 in src/pages/service/patrol/points/PatrolPointsPage.tsx — 기간(`AppDatePicker`) · 코스(`AppSelect`, 옵션은 036 `courseOptions` 재사용) · 인증수단(`AppSelect` QR/NFC) · 결과(`AppSelect` **2종**) + 순찰자 검색(`AppInput variant="search"`) + 초기화 `AppIconButton`
- [x] T545 [US1] 🔴 서버 페이징 in src/pages/service/patrol/points/PatrolPointsPage.tsx — `AppPagination` + `manualPagination`. 🔴 **036 에서 `hidePagination` 이 클라이언트 페이징을 안 꺼서 10행으로 잘렸다** — 같은 함정이 이 화면에도 있다
- [x] T546 [US1] 조회 실패 / 0건 분리 in src/pages/service/patrol/points/PatrolPointsPage.tsx — `AppEmpty` 2종. 🔴 §3-1 때문에 **"없다" 로 단정하지 않는다**
- [x] T547 [US1] [P] MSW 핸들러 확장 in src/mocks/handlers/history.ts — 🔴 **새 핸들러를 선언하지 않는다.** 036 사고(`GetPointHistory` 핸들러 **두 번 선언**으로 앞의 것만 먹혀 조용히 0건)가 같은 파일에서 났다. 기존 것을 **필터·페이징까지 받도록 확장**
- [x] T548 [US1] [P] 화면 테스트 in src/pages/service/patrol/points/__tests__/PatrolPointsPage.test.tsx — 서버 행 렌더 · 필터→파라미터 · URL 보존 · 미완료 행(인증수단 빈 칸 + **시각 표시**) (**018 T158·T160·T161 종결**)
- [x] T549 [US1] 🔴 **삭제** in src/features/patrol-points/components/PatrolRecordDialog.tsx (+ 테스트) — 상세가 **페이지**가 되므로 기록 모달이 사라진다. ⚠️ T550 이후에 지운다(진입 수단이 먼저 있어야 한다)

## Phase 4: US2 — 지점 인증 상세 페이지

> **독립 테스트 기준**: MSW 200 에서 `/patrol/points/:detailSeq` 가 기본정보·메모·사진을
> 그리고, 없는 `detailSeq` 에서 복귀 링크가 뜬다.

- [x] T550 [US2] 라우트 추가 in src/router/paths.ts · src/router/index.tsx — `patrolPointDetail(detailSeq)` + `pathPatterns.patrolPointDetail`. 🔴 **`/points/:pointSeq` 와 다른 것**이라는 주석을 `patrolZoneDetail` 선례처럼 남긴다 — ⚠️ **`paths.ts` 만 했다(2026-10-19)**: 목록의 행 클릭이 경로를 만들려면 `paths` 가 먼저 필요했다. `router/index.tsx` 등록과 페이지는 Phase 4 다 → ✅ **`router/index.tsx` 등록까지 완료(2026-10-20)**
- [x] T551 [US2] `usePointHistoryDetail` 훅 in src/features/course-history/hooks/usePointHistoryDetail.ts
- [x] T552 [US2] 상세 페이지 골격 in src/pages/service/patrol/points/PatrolPointDetailPage.tsx — 목업 `04` 2열. 🔴 **KPI 는 US3 까지만**(인증 결과 · 14일 추이) — US4 2종은 자리도 만들지 않는다
- [x] T553 [US2] 기본정보 카드 in src/features/patrol-points/components/detail/PointHistoryInfoCard.tsx — `AppDetailCard`+`AppDetailRow` 재사용. 🔴 `'Unknown'` → **빈 칸**. 이력번호·층·위치·처리상태 **없음**
- [x] T554 [US2] 🔴 메모 어댑터 in src/features/patrol-points/lib/pointHistoryMemo.ts — `memoList`/`attachList`/`attachPath` → 코스 쪽 모양(B-35). **`fileExt` 가 없다**는 것까지 흡수. 🔴 **`CheckDetailMemo` 를 복제하지 않는다**
- [x] T555 [US2] 메모·사진 카드 in src/features/patrol-points/components/detail/PointHistoryMemoCard.tsx — `CheckDetailMemo` 재사용 + **onError 폴백**(B-40). ⚠️ 첨부 **여러 장** 처리
- [x] T556 [US2] [P] 어댑터 테스트 in src/features/patrol-points/lib/__tests__/pointHistoryMemo.test.ts — 빈 `memoList` · 첨부 0장 · 첨부 2장 · `fileExt` 없음
- [x] T557 [US2] [P] 상세 화면 테스트 in src/pages/service/patrol/points/__tests__/PatrolPointDetailPage.test.tsx — 없는 `detailSeq`(🔴 **"삭제되었다" 로 단정하지 않는다**) · 로딩 · 미완료 행

## Phase 5: US3 — 최근 인증 이력 + 14일 추이 (요청 1개)

> **독립 테스트 기준**: 요청이 **1개만** 늘고(`GetPointHistory?pointSeq`) 표와 추이가 **같은
> 응답**에서 나온다.

- [x] T558 [US3] 최근 인증 이력 표 in src/features/patrol-points/components/detail/PointHistoryRecentTable.tsx — 🔴 **`usePointHistory`(027) 재사용** — 같은 요청을 새 훅으로 다시 만들지 않는다. 현재 행 강조(`detailSeq` 일치)
- [x] ~~T559~~ 🔴 **만들지 않는다** — `spec 027` 의 `summarizePatrolHistory`(14일 버킷 + 분모)가 이미 같은 것을 센다. 신설하면 같은 숫자를 세는 함수가 두 벌이 되고 "미완료를 인증으로 세던" 결함(031 교정)이 한쪽에만 반영된다. ✅ **OQ-037-D 종결**(이미 14일이다). 원래 경로: src/features/patrol-points/lib/pointHistoryTrend.ts — 같은 응답에서 날짜별 집계. 🔴 **판정·기준 비교 없음**(§3-7). ⚠️ 기간 기준은 OQ-037-D
- [x] T560 [US3] 인증 결과 KPI in src/pages/service/patrol/points/PatrolPointDetailPage.tsx — `AppKpiCard` 재사용(031). 🔴 **색으로 판정하지 않는다**(023·036 승계)
- [x] T561 [US3] [P] **카드 테스트로 대체** in src/features/patrol-points/components/detail/__tests__/PointHistoryRecentCard.test.tsx — 집계는 `patrolSummary.test.ts`(027)가 이미 고정했다. 카드가 그 결과를 **어떻게 쓰는지**만 본다(강조 · 분모 표기 · 기간 밖 안내 · 실패 분기 · 요청 1개) — 0건 · 1건 · 기간 밖 · 미완료 섞임

## Phase 6: Polish

- [x] T562 [P] 로딩·빈 상태 3종 점검 — 목록·상세·최근 이력. 🔴 상세 빈 상태 문구가 **단정하지 않는지**
- [x] T563 `npm run verify` 0 + `npm run test` green (990 → 증가). 🔴 **병렬 실행**(`CLAUDE.md` A4)
- [ ] T564 🔴 **사용자 브라우저 확인**(`npm run dev:real`) — 목록 필터 4종·페이지 이동·상세 진입·메모·사진 폴백 + **027 지점 상세 회귀**
- [ ] T565 `npm run capture` — `현장/patrol-points--목록`·`patrol-points--상세` 교체. 🔴 **나머지는 덮지 않는다**(±1% Chromium 노이즈 — 다시 커밋하면 진짜 변경이 묻힌다. 036 선례)
- [x] T566 문서 동기화 — docs/screens.md §1-2·§4 · docs/flow.md · docs/design-system.md(지점이력 뱃지 매핑) · docs/patterns.md(§14 카드 소비처)
- [ ] T567 DoD 18개 대조표 + `## 다음 spec으로 이월` — **US4 미착수분**(`historySeq`)·Export·OQ 5건

---

## 🔴 US4 — 착수하지 않는다 (`historySeq` 백엔드 회신 대기)

`PointHistoryDetail` 에 `historySeq` 가 없어 **직전 지점 간격 · 코스 내 순서 · 코스 내 위치
타임라인 · "코스 순찰 상세" 링크** 네 개가 전부 막혀 있다(`spec.md` §2-4).

- 회신이 오면 `CheckDetails(historySeq)` **1회**로 네 개가 동시에 열린다 — 요청 1개 추가.
- 🔴 **자리를 비워두지 않는다.** 빈 카드는 "데이터가 없다" 로 읽힌다(036 이 지도에서 같은
  판단을 했다).
- 회신 시점에 **본 spec 에 Phase 를 추가**할지 별도 spec 으로 열지는 그때 정한다.

---

## Dependencies & Execution Order

- **T529 → T531·T532·T533** (타입이 먼저)
- **Phase 2(T535~T539) → Phase 3** 🔴 통합을 먼저 끝낸다. 목록을 새 타입 위에 올린 뒤
  통합하면 회귀 원인이 두 겹이 된다
- **T537 은 T535·T536 뒤** (삭제는 전환 후)
- **T540 → T541~T546**
- **T550 → T551 → T552 → T553·T554·T555**
- **T554 → T555 → T556**
- **T549 는 T550 뒤** (진입 수단이 먼저)
- **T558 은 Phase 2 뒤** (`usePointHistory` 가 공용 타입을 쓰고 있어야 한다)
- Phase 6 은 Phase 3~5 전부 완료 후. **T564 → T565** (브라우저 확인 뒤에 캡쳐)
- `[P]` 끼리 병렬 가능

---

## 진행 기록

### ✅ Phase 1~3 완료 (2026-10-19) — 목록까지

**검증**: `npm run verify` 0 errors · `npm run test` **999 → 1020** (93 files, 전부 green).
🔴 **027 테스트를 한 줄도 고치지 않았다** — Phase 2 통합이 동작을 바꾸지 않았다는 증거다
(고쳐야 했다면 통합이 동작을 바꾼 것이다, T539).

**계획 밖에서 나온 것 3건**

| | 내용 | 판단 |
|---|---|---|
| ① | `PointHistoryParams` 가 036 쪽에도 **이미 있었다**(`pointSeq`·`authMethod`·`userName` 이 빠진 좁은 판) | 신설이 아니라 **넓히기**였다(T529). 통합 대상이 "두 곳" 이 아니라 **"좁은 것과 더 좁은 것"** 이었다 |
| ② | `omitIfAll`·`parseIntegerFilter` 가 `courseHistoryListParams` 의 **module-private** 였다 | 사본을 만들지 않고 **export** 했다. "빈 값은 키를 뺀다" 규약이 두 곳에서 갈리면 027 이 200 을 보낸 종류의 사고가 난다 |
| ③ | `toDateQuery` 가 `PatrolZonesPage` **안에** 있었다(036) | 037 이 **두 번째 소비처**라 `course-history/lib/historyRange.ts` 로 **승격**했다. 승격하면서 `date-fns format` + 같은 모듈 `DATE_FORMAT` 으로 통일 |

**mock 셸을 걷어낸 분량**: 페이지 mock 배열 132줄 + `PointPatrolType`·`PointRecordType`·
`PATROL_POINT_RESULT`·`PointAuthMethodType` + 컬럼 파일이 export 하던 **뱃지 맵 2개**
(`patrolPointResultBadge`·`pointAuthMethodBadge` — 036 이 해소한 enum 3중 분기와 같은 모양) +
`PatrolRecordDialog`(+테스트) + `patrol-points/types/PatrolPoint.ts`.

**🔴 지금 상태의 한 가지 구멍**: 행 클릭이 `/patrol/points/:detailSeq` 로 가는데 **라우트가
아직 없다**(T550 부분 진행) → **404**. Phase 4 에서 닫는다.

**브라우저 확인은 아직 하지 않았다**(T564, Phase 6).

### ✅ Phase 4 완료 (2026-10-20) — 지점 인증 상세 페이지

**검증**: `npm run verify` 0 errors · `npm run test` **1020 → 1040** (95 files, 전부 green).

**🔴 스펙의 틀린 기술을 하나 고쳤다 — `pauseTime`**

`spec.md` §3-6 과 T530 에 **"상세는 `number`(B-5)"** 로 적었는데 **틀렸다.** `api-spec.md`
§5-2 20번 실측은 `PointHistoryDetail.pauseTime: string` 이다 — **B-5 의 숫자는 `GetCourseHistoryDetail`
(코스) 쪽 이야기**였다. 지점 상세까지 숫자로 굳히면 **분을 초로 읽는 코드**가 들어간다.
→ 타입·주석·정보카드를 전부 문자열(`formatElapsed`)로 교정했다. **목록과 같은 변환 함수**다.
🔴 **036 의 B-번호를 그대로 옮겨 적다가 생긴 오류**다(실측을 다시 보지 않았다) — spec 을 쓸 때
`api-spec.md` 블록을 직접 열어 확인해야 하는 종류.

**🔴 테스트가 실제 결함을 잡았다 — 끝나지 않는 로딩**

`/patrol/points/abc` 처럼 **`detailSeq` 가 숫자가 아니면** 쿼리가 `enabled: false` 라
**영원히 `isPending`** 이고, 로딩 분기에 걸려 **스켈레톤이 끝까지 남았다.** 사용자는 "느리다"
고 읽고 기다리는데 **요청은 애초에 나가지 않았다** — 조회 실패보다 나쁜 상태다(끝이 없다).
→ 주소 오류를 **로딩보다 먼저** 분기하고, 그 화면에는 **"다시 시도" 를 주지 않는다**(같은
주소로 또 실패한다). ⚠️ `enabled: false` 와 로딩이 같은 `isPending` 으로 오는 것은
react-query 규약이라 **호출부가 구분해야 한다** — 이력 2화면 중 코스 상세도 같은 모양이므로
**036 쪽도 같은 구멍일 수 있다**(확인 대상, Phase 6 브라우저 확인에 포함).

**어댑터 1개로 끝냈다**: `toCheckDetailRow`(`memoList`→`memos` · `attachList`→`attaches` ·
`attachPath`→`imagePath` · `userSeq`→`checkUserSeq` · `overtimeYn` 철자). `CheckDetailMemo`
**복제 0건** — 036 이 그 안에 쌓은 판단(메타 1회 · 첨부별 폴백 · `pre-line` · 처리상태 없음)이
한 벌로 유지된다. 🔴 `fileExt` 는 **파일명에서 추측해 채우지 않았다**(서버 값과 우리 추측이
같은 필드에 섞인다).

**MSW 상세 핸들러를 추가했다**(계획 밖, T547 의 연장) — 🔴 **목록과 같은 시드**(`buildHistory`)
에서 만든다. 따로 선언하면 "목록에서 고른 행과 상세가 어긋난다" 는 버그가 mock 에서
재현되지 않는다. 응답의 어긋난 세 자리(`overtimeYn` 소문자 · `'Unknown'` · `memoList`)를
**그대로 재현**했다 — mock 이 관대하면 어댑터가 정말 필요한지 드러나지 않는다.

### ✅ Phase 5 완료 (2026-10-20) — US3 최근 인증 + 14일 추이

**검증**: `npm run verify` 0 errors · `npm run test` **1040 → 1051** (96 files, 전부 green).

**🔴 계획대로 하지 않은 것 하나 — 집계 함수를 새로 만들지 않았다**

T559 는 `pointHistoryTrend.ts` 신설이었는데, 열어 보니 **`spec 027` 이 같은 것을 이미 갖고
있었다**: `summarizePatrolHistory`(14일 버킷 + 완료/대상 분모)와 `PatrolBarChart`(추세 라인).
만들었다면 **같은 숫자를 세는 함수가 두 벌**이 되고, "미완료를 인증으로 세던" 결함
(031 에서 교정)이 **한쪽에만 반영된 상태**가 된다. 🔴 **계획보다 코드가 맞았다**(A3·A6).
→ ✅ **OQ-037-D(14일 vs 30일) 종결**: `SUMMARY_DAYS` 가 이미 14일이고(사용자 결정
2026-10-10 — 30개 막대에는 날짜를 다 못 붙여 읽을 수 없었다) 목업 `04` 와 같다.

**요청은 1개만 늘었다.** `GetPointHistory?pointSeq` 하나로 KPI 점등·추세 라인·최근 목록
세 자리를 채운다. 🔴 **페이지와 카드가 같은 훅을 부르는데 요청은 1개**다 — `pointKeys.history`
키가 같아 react-query 가 합친다. props 로 내려주지 않은 이유: 카드에 `summary`·`rows`·
`isPending`·`isError`·`refetch` 를 넘기면 계약이 5개가 되고(030 기준) 카드가 **자기 실패
분기를 스스로 그릴 수 없게** 된다.

**KPI 는 2칸이다**(목업은 4칸) — 직전 지점 간격·코스 내 순서는 `historySeq` 가 없어
만들 수 없다. 🔴 **빈 칸을 두지 않았다**(036 지도·031 증감 뱃지와 같은 판단).
🔴 **헤더 뱃지와 겹치는 것이 아니다**(036 선례): 뱃지=결과 한 단어 / KPI=구성(메모·사진,
14일 점등) / 정보 카드=값(시각·수단·구간). 점등과 추세 라인도 **031 이 정한 분담**이라
같은 데이터를 두 번 그리는 것이 아니다.

**실측 경계 하나를 화면이 말한다**: 이번 인증이 **14일 밖**이면 목록에 없어 강조할 행이
없다 → 그 사실을 적는다(조용히 넘기면 "빠졌다" 로 읽힌다).

### ✅ 036 같은 구멍 수정 (2026-10-20)

`PatrolZoneDetailPage` 도 **`historySeq` 가 숫자가 아니면 로딩 스켈레톤이 끝까지 남았다.**
🔴 **전수 확인 결과 036 만의 실수였다** — `spec 023`(`ZoneDetailPage`)·`spec 027`
(`PointDetailPage`)은 `detail.isPending && seq !== null` 로 **이미 막아 뒀는데** 036 이 그
가드를 빼먹었다. 037 이 같은 화면을 만들며 테스트로 잡았다.
→ 주소 오류를 로딩보다 먼저 분기 + **회귀 테스트 1건 추가**(요청이 0건인 것까지 고정).
문구는 027 선례를 따랐다("주소가 올바르지 않습니다. 목록에서 다시 선택해주세요.").

### ✅ T562·T563·T566 완료 (2026-10-20) — 문서 동기화

**로딩·빈 상태(T562)**: 3화면 전부 **조회 중 / 조회 실패 / 0건**을 각각 다르게 그린다.
🔴 **상세는 분기가 4개다**(주소 오류 · 로딩 · 실패 · 메모 없음) — 주소 오류를 로딩보다 먼저
두는 것이 Phase 4 에서 고친 자리다. 최근 인증 카드는 **자기 실패 분기를 스스로** 그린다
(상세 본문은 이미 떠 있어 페이지 단위 실패와 섞으면 이 지점이 한 번도 안 찍힌 것처럼 읽힌다).

**문서 7건 동기화(T566)** — 계획은 4건이었는데 **3건이 더 나왔다**:

| 문서 | 내용 |
|---|---|
| `screens.md` | §1-2 지점 이력 행 갱신 · **기록 상세(다이얼로그) 행 → 지점 인증 상세 페이지 행**(✗→✓) · Export 행에 "엔드포인트 없음" · §4 라우트 매핑에 `/patrol/points/:detailSeq` 추가 · §6 Open Q(진입 방식이 모달→페이지로 **다시 바뀐 사유**) |
| `flow.md` | 사이드바 트리·시나리오 도식에 상세 노드 추가 · 🔴 **S3 제목에서 "→ Export" 를 뺐다**(엔드포인트가 없다) · 탭 그룹에 상세 진입 규약 추가 |
| `design-system.md` | §1-1 ② 제목을 **"지점 인증 결과(2화면 공용)"** 으로 · 🔴 **결과 필터가 2종인 이유**(거를 수 없는 값을 선택지에 두면 "0건" 이 거짓 신호가 된다) |
| `patterns.md` | §6 "그대로 썼다" 기록(**사본 0개**, import) · §6 규칙 8 에 14일/30일이 다른 이유 · §9 **상세 라우트에는 탭을 그리지 않는다** · §14 카드 소비처 · §15 소비처 2곳 · §16 **`AppFilterPopover` 소비처는 `/points` 하나로 남는다** |
| **`api-spec.md`**(계획 밖) | 🔴 **B-5 를 정정했다** — "상세는 number" 가 **코스 전용**임을 명시(037 이 이 행을 읽고 지점 상세까지 숫자로 적었던 자리) · `GetPointHistoryDetail` 블록에 **`historySeq` 없음**을 박았다(US4 차단 사유) |
| **`roadmap.md`**(계획 밖) | §7-1 037 상태 ◩ · §12 진행 매트릭스에 037 행 · §13 Open Q **"뱃지 5종 ↔ status 불일치" 종결** |
| **`design-system.md` 타이포 표**(계획 밖) | ⚠️ **삭제된 컴포넌트가 소비처로 남아 있었다** — `PatrolTimeline`(036 삭제)·`PatrolRecordDialog`(037 삭제)가 4행에 걸쳐 있었다. 🔴 `text-meta` 는 **소비처가 0곳**이 됐다(토큰은 남기고 사유를 적었다) |

🔴 **036 이 남긴 문서 부채를 함께 갚았다** — `PatrolTimeline` 은 036 에서 지웠는데 타이포 표
4곳이 그대로였다. 같은 종류로 `flow.md` 의 "지점 상세 **패널**"(027 이 페이지로 바꿨다)도 고쳤다.
