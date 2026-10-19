# 036-course-history tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — **T488 부터**(032 가 T487 에서 끝났다)
> `[P]` = 병렬 가능. 없으면 순차. `[US1]` = user story 소속
>
> **위험도 B → 화면 단위로 크게 쪼갠다.** 다만 **Phase 2 는 037 이 그대로 쓸 기반**이라
> 그 안에서는 검증 지점을 나눠 뒀다(여기서 틀리면 두 화면이 함께 틀린다).

---

## Phase 1: Setup — 타입·enum 정리

> **독립 테스트 기준**: `npm run verify` 0 + 기존 테스트 green. **화면은 아직 안 바뀐다.**

- [x] T488 🔴 순찰이력 서버 모듈을 `features/course-history/` 로 이동 in src/features/course-history/{types,api,hooks}/ — 지금 `features/courses` 안에 있다(`types/history.ts`·`api/getCourseHistory.ts`·`api/getPointHistory.ts`·`hooks/useCourseHistory.ts`·`lib/courseHistoryStats.ts`·`lib/historyRange.ts`). 🔴 **그 파일의 주석이 이 이동을 미리 적어 뒀다** — "`spec 025` 가 착수하면 그쪽이 주인이 된다"(`types/history.ts` 머리말). 코스 관리(023 B·C단)는 **import 경로만** 바뀐다. ⚠️ **대안**: 옮기지 않고 `features/courses` 에 두는 것 — 그러면 이력 화면이 **코스 관리 feature 안에** 살게 되고 037(지점이력)도 거기서 import 한다. **WF-3 plan-first 에서 사용자 확인을 받고 시작한다** — ✅ **옮겼다**(사용자 확인 후 진행). 6개 파일 전부 `features/course-history/` 로. 코스 관리(023 B·C단)는 import 경로만 바뀌었다
- [x] T489 [P] 🔴 `CheckDetailRow` **신설** in src/features/course-history/types/checkDetail.ts — ✅ **"교정" 이 아니라 "신설" 이었다**(2026-10-16 확인): `CheckDetails` 를 호출하는 코드가 **아직 없다**(023 의 `courseAlerts.ts` 가 "요청을 더 하지 않는다" 로 명시). **기존 소비처 0개 = 리스크 0.** 처음부터 `checkUserSeq`·`userName`·`overtimeYn` 을 `| null` 로 선언했다(실측 근거: 인증이 찍히지 않은 행은 세 필드가 전부 null). 상태별 필드 실태표와 미완료 2종 판별을 주석에 박았다
- [x] T490 [P] `PointHistoryMemo`·`PointHistoryAttach` 타입 신설 in src/features/course-history/types/checkDetail.ts — 037 이 쓴다(`memoList`/`attachList`/`attachPath`, `fileExt` 없음 — B-35). 036 은 선언만 하고 **쓰지 않는다**
- [x] T491 🔴 결과 뱃지 **화면별 매핑** SSOT in src/features/course-history/lib/historyBadge.ts — ① 코스 상태(`0`·`1`·`2`) ② 코스 상세의 지점 상태(`0`·`1`·`3`무방문·`3`방문·`4`) ③ **`overTimeYn` 은 별 함수**(결과에 섞지 않는다) ④ `4` + `hasMemo` → `순찰기록` / `4` + `!hasMemo` → `이상없음`. 🔴 **공용 enum 으로 묶지 않는다** — 코스 `2`=미완료, 지점 `2`=순찰제외다
- [x] T492 🔴 enum 3중 분기 — **dead 선언 제거분** in src/types/enum.ts — `CourseResult`·`courseResultLabel`·`PointResult`·`pointResultLabel` **4개 전부 소비처 0개**였다(확인 2026-10-16). 제거 + `historyBadge.ts` 로 가는 주석을 남겼다. 🔴 **문자열 사전 자체가 서버와 모양이 맞지 않았다** — 결과는 정수 `status` 이고 `overTimeYn`·`hasMemo` 와의 **조합으로 유도**된다. 사전을 SSOT 로 두면 번역 어댑터가 생기고 그 어댑터가 곧 조합 규칙이라 **사전 쪽이 군더더기가 된다**
- [x] T492-B 🔴 나머지 2곳은 **Phase 3 에서 지운다** in src/pages/service/patrol/zones/PatrolZonesPage.tsx · src/features/patrol-zones/types/{PatrolZone,PatrolZoneResult}.ts — ⚠️ **지금 지울 수 없다**: `PATROL_RESULT` 는 mock 배열 **38곳**이 쓰고 `PatrolZoneResult` 는 그 mock 타입이 쓴다. **T502 가 mock 을 지우면 함께 사라진다** — 먼저 끊으면 화면이 깨지고 T502 에서 되돌린다. ⚠️ **`patrol-points` 쪽(`PatrolPointResultType`)은 건드리지 않는다** — 037 이 같은 작업을 하며 지운다(023 DoD #15 선례) — ✅ **T502 가 mock 을 지우며 함께 사라졌다**(예측대로). `src/features/patrol-zones/types/` 디렉토리 자체가 없어졌고 `PatrolZonesPage.tsx` 잔존 참조 0건. `patrol-points` 쪽은 037 몫으로 남겼다

## Phase 2: Foundational (모든 US 선행 blocking)

> **독립 테스트 기준**: MSW 200 에서 훅이 서버 파라미터를 **그대로 실어 보내는 것**을
> 쿼리 가로채기로 확인. 🔴 **화면 결과가 아니라 나간 쿼리를 본다**(027 선례 — 화면만 보면
> "서버가 걸렀는지 우리가 걸렀는지" 알 수 없다).
>
> ✅ **Phase 2 완료(2026-10-16)** — `verify` 0 errors / `test` **887 → 920**(+33, 90 files).
> 화면은 바뀌지 않았다. 🔴 **계획이 바뀐 것 2건**은 T493·T497 에 적었다.

- [x] T493 목록 파라미터 변환 in src/features/course-history/lib/courseHistoryListParams.ts — URL 쿼리 ↔ `CourseHistoryParams`. ✅ `clampPageSize` 가 **상한 100 을 한 곳에서** 막는다(`spec 027` 이 200 을 보내 **장애가 빈 상태로 읽혔다**). ✅ `orderRange` 로 **기간 순서를 보장**한다 — `from > to` 는 에러가 아니라 **200 + 0건**이라 뒤집히면 "이력 없음" 으로 보인다. 🔴 **계획 외 1건**: `ALL_VALUE` 가 **네 번째 사본**이 될 상황이어서 `src/lib/listQuery.ts` 로 **공용 승격**했다(사용자 결정 2026-10-16). `spec 027` 이 "세 번째 소비처가 생기면 검토" 로, `023` T373 이 "함께 판단한다" 로 적어 둔 시점이 지나 있었다. 기존 3곳은 **import + re-export 한 줄**로 바꿔 소비처를 전혀 건드리지 않았다. ⚠️ **변환 함수는 올리지 않았다** — 도메인마다 필터 집합이 달라 공용화하면 키 이름 매핑표를 넘기게 된다(A6)
- [x] T494 목록 훅 in src/features/course-history/hooks/useCourseHistoryList.ts — 🔴 기존 `useCourseHistory`(코스 상세 B단, 기간 30일 고정)와 **다른 훅**이다. 그쪽은 KPI 집계용이고 이쪽은 **페이지네이션 목록**이다. ⚠️ `siteSeq === null` 이면 호출하지 않는다(B-9: 권한 밖도 200 이 와서 **장애가 정상 화면으로 보인다**)
- [x] T495 [P] queryKeys 확장 in src/features/course-history/queryKeys.ts — `list(params)`·`detail(historySeq)`·`checkDetails(historySeq)`·`courseAverage(courseSeq)`. 🔴 `data-model.md` §8 규약 — **`siteSeq` 를 키에 넣는다**(URL 에 없으므로 키가 유일한 구분자)
- [x] T496 [P] 상세 API 2종 in src/features/course-history/api/{getCourseHistoryDetail,getCourseHistoryCheckDetails}.ts — 조회계라 실측돼 있다(`api-spec.md` §5-1 16·17번). 🔴 **`CourseHistoryDetail` 타입이 아직 없었다** — `types/history.ts` 에 신설했다(목록과 `overTimeYn`·`pauseTime` 이 어긋나는 것을 어댑터 없이 실측대로 선언)
- [x] T497 상세 훅 in src/features/course-history/hooks/{useCourseHistoryDetail,useCourseAverage}.ts — 🔴 **계획을 바꿨다: 4호출 묶음 → 2호출 + 별 훅**(2026-10-16 구현 판단). ① **`GetCourseDetail` 은 여기서 부르지 않는다** — 부르면 `course-history → courses` **역방향 의존**이 생겨 T488 에서 `elapsed.ts` 까지 옮겨 정리한 한 방향(**코스 관리 → 이력**)을 되돌린다. 페이지(`pages/`)가 기존 **`useCourseDetail` 을 재사용**해 합친다(A6: 022·027·023 이 쓰던 훅이고 캐시도 공유된다). ② **코스 평균은 `useCourseAverage` 로 분리** — 평균은 **코스 단위**라 회차가 바뀌어도 값이 같은데, 상세에 묶으면 `historySeq` 마다 100건을 다시 받는다
- [x] T498 코스 평균 계산 in src/features/course-history/lib/courseAverage.ts — `courseSeq` + `eventType=1`(완료만). 🔴 **미완료를 섞지 않는다**(소요 0·중단이 평균을 끌어내린다). ⚠️ `totalCount > 100` 이면 **"최근 100회 평균"** 으로 문구가 바뀐다(페이지 루프 금지)
- [x] T499 [P] 구간 간격 계산 in src/features/course-history/lib/checkIntervals.ts — `checkDt` 차이로 평균·최단·최장. 🔴 **`checkDt` 없는 행 제외 + 제외 건수 반환**(조용히 빼면 8개 지점 코스의 평균이 2개로 계산됐는데도 평균처럼 보인다). 🔴 **계획 외 판단**: `orderNo` 가 아니라 **`checkDt` 로 정렬**한다 — ① 서버가 `orderNo` 중복을 저장한다(032 에서 확인) ② 간격은 **실제로 찍힌 순서**의 차이다(편성 순서로 빼면 음수가 나온다)
- [x] T500 [P] MSW 핸들러 확장 in src/mocks/handlers/history.ts — 상세·CheckDetails 핸들러 + `userName` 부분검색 필터 추가. ✅ **목록 쪽 실측 예외 5종은 023 이 이미 심어 뒀다**(`userList: []` · 완료인데 인증 0 · 시 단위 소요 · 진행 중 · 기간 밖) — 다시 만들지 않고 **CheckDetails 쪽 예외를 새로 심었다**: `status 0`·`1` **전 필드 null** · 미완료 **무방문/방문 2종** · 메모+첨부(**404 URL 그대로**) · `attaches: null` · **좌표 없는 인증 행**. 🔴 상세는 목록 시드에서 **파생**시킨다(따로 적으면 목록과 어긋나고 그 어긋남이 화면 버그처럼 보인다) + **`statusName` 을 넣지 않고 `overTimeYn` 대문자로** 내린다(mock 이 불일치를 맞춰 주면 코드가 영원히 모른다). 🔴 **`GetPointHistory` 는 새로 선언하지 않았다** — `points.ts` 가 이미 소유한다(023 사고 재발 방지)
- [x] T501 [P] vitest — 공용 기반 in src/features/course-history/lib/\_\_tests\_\_/{historyBadge,courseHistoryListParams,courseAverage,checkIntervals}.test.ts — **33건 신설**(887 → 920). 뱃지 조합(`4`+`overTime`+`memo` **동시 참** = 실측 `detailSeq 85`) · 미완료 2종 분기 · `pageSize` 상한 · 기간 swap · 모르는 코드 통과(A1) · 시 단위 소요 · 평균 null(0 이 아니다) · `partial` · 간격 null 제외·`checkDt` 정렬

## Phase 3: US1 — 코스 이력 목록 (서버 전환)

> **독립 테스트 기준**: MSW 200 에서 목록이 뜨고, 필터 4종 변경이 **URL 과 서버 쿼리**에
> 동시에 반영되며, 뒤로가기로 보존된다. **mock 배열이 0줄**임을 grep 으로 확인.
>
> ✅ **Phase 3 완료(2026-10-16)** — `verify` 0 errors / `test` **920 → 916**(88 files).
> 🔴 **줄어든 것이 맞다**: 죽은 mock 테스트 **15건을 지우고**(`filterCourseHistory` 12 ·
> `PatrolTimeline` 3) 서버 기준으로 **11건을 새로 썼다**(목록 8→15 · 카드 3→7). 지운 테스트는
> **지운 코드를 검증하던 것**이다. 🔴 **T509(라우트)를 Phase 3 으로 끌어왔다**(사용자 결정
> 2026-10-16) — 목록의 행 클릭이 죽어 있으면 브라우저 확인이 반쪽이다.

- [x] T502 [US1] 🔴 페이지 재작성 in src/pages/service/patrol/zones/PatrolZonesPage.tsx — **597 → 320줄**. mock 배열(24건)·`PatrolDetailPanel`·`selectedPatrol`·`ZonePatrolType`·`PointPatrolType`·`PATROL_RESULT` 전부 삭제. 마스터-디테일 → **목록 전용**. 구조는 `ZonesPage.tsx`(023) 를 미러링했다 — `error → pending → 필터0건 → 전체0건 → 테이블+페이지네이션` **5분기**
- [x] T503-B 🔴 **정렬 비활성화**(브라우저 확인 2026-10-16 에서 **빠뜨린 것이 드러났다**) in src/features/patrol-zones/components/ZoneColumn.tsx — "정렬 화살표를 만들지 않는다" 고 적었지만 **화살표가 남아 있었다.** 원인은 `AppTable` 이 `getSortedRowModel` 을 **전역으로 켜 두고** TanStack 이 `accessorKey` 컬럼의 `getCanSort()` 를 **기본 true** 로 보기 때문이다 — 컬럼에서 아무것도 안 하면 **켜진다.** `enableSorting: false` 를 **map 으로 일괄** 적용했다(컬럼마다 적으면 새 컬럼에서 빠뜨린다). 🔴 **테스트도 틀렸다**: 아이콘을 `queryByRole('button')` 으로 찾았는데 헤더는 `th` 이고 아이콘은 **접근성 이름 없는 svg** 라 **켜져 있어도 통과했다** → **헤더 클릭 후 첫 행이 그대로인지**로 바꿨다(수정을 되돌려 실패를 확인했다)
- [x] T503-C 🔴 **브라우저 확인 반영 4건**(사용자 2026-10-16) in src/pages/service/patrol/zones/PatrolZonesPage.tsx · src/components/ui/calendar.tsx · src/features/patrol-zones/components/{ZoneColumn,ZoneHistoryCard}.tsx — ① **필터를 한 줄로**(검색 + 필터가 2열로 접혀 "검색은 필터와 다른 것" 처럼 보였다) → `CourseTopNav` 와 **같은 배치**로: 검색이 맨 앞·그룹 밖, 필터는 `contents` 그룹 안 ② **기간 선택 범위가 안 보였다** — `range_middle` 이 `bg-accent` 라 본문 글자색과 명도가 비슷해 **사이 날짜가 사라져 보였다** → `point-bg`/`point-foreground`(design-system §1-1 강조 트리오) ③ **초기화를 아이콘 버튼으로** — 글자 버튼이 필터 컨트롤과 같은 무게로 보여 **"네 번째 필터"** 처럼 읽혔다. `aria-label` 은 남긴다. 🔴 **빈 상태의 초기화 버튼은 제거** — 툴바 아이콘이 항상 보이는 자리에 있어 **같은 버튼이 두 개**가 된다(023 은 그 아이콘이 없어서 뒀던 것) ④ 🔴 **진행 중 종료 일시를 `—` 로 — `spec 030` 의 규칙을 뒤집었다**: 030 의 "`—` 는 값 누락으로 읽힌다" 는 **결과 컬럼이 없던 4컬럼 시절**의 판단이고, 지금은 같은 행·카드에 **`진행중` 뱃지**가 있어 맥락이 있다. 같은 말을 두 칸에서 하면 종료 일시 칸이 **상태 칸처럼** 읽힌다 → `spec.md` §4 엣지 1 · `screens.md` §1-2 함께 정정
- [x] T503-D 🔴 **T503-C 의 2건을 재수정**(사용자 재확인 2026-10-16) in src/components/ui/calendar.tsx · src/components/app/AppSelect.tsx — ① **기간 범위 글자가 여전히 흰색이었다**: react-day-picker 는 범위의 **사이 날짜에도 `selected` 를 함께 붙인다.** 그래서 `selected` 의 `text-primary-foreground`(흰색)와 `range_middle` 이 **같은 특이도로 충돌**했고, 승자는 Tailwind 가 CSS 를 찍는 순서에 달려 있었다 — 하늘색 배경 + 흰 글자가 되어 **글자가 사라져 보였다.** `!`(Tailwind v4 는 **접미사**)로 못 박았다. ✅ **빌드 산출 CSS 를 열어 `color:var(--point-foreground)!important` 가 찍힌 것을 확인**했다(같은 버그 두 번째라 추측으로 두지 않았다) ② **코스·결과 트리거의 긴 값이 두 줄로 접혀 깨졌다** — 목록 필터는 트리거 폭이 `w-auto` 라 코스명이 길면 접힌다. `whitespace-nowrap` + `truncate`. ⚠️ `AppSelect` 소비처는 **이 페이지 1곳**이라 회귀 범위가 없다(확인)
- [x] T503-E 🔴 **반응형 카드 재설계**(목업 "반응형카드"·"반응형카드2" 2종 검토, 사용자 결정 2026-10-16) in src/features/patrol-zones/components/ZoneHistoryCard.tsx · src/components/app/AppBadge.variants.ts — **1안 채택 + `spec 034` 골격으로 다듬었다**(`타일 + [이름 + 작은 뱃지] + 지표 줄 + 꺾쇠`). 🔴 **2안은 데이터로 받칠 수 없다**: ① **지점 점 다이어그램** — 지점별 상태는 `CheckDetails(historySeq)` 에만 있어 목록에서는 **행마다 추가 요청**이고, 개수만으로 찍으면 **점 위치가 순서를 암시**하는데 어느 지점이 빠졌는지는 모른다(거짓이 된다 — 023 의 "인증률에 색을 입히지 않는다" 와 같은 자리) ② **`순찰제외` 뱃지** — **지점 사전**(`2`)이라 코스 카드에 올 수 없고(B-7) 실데이터도 0건 ③ 1안의 **`대기중`·`22:00 예정`** 도 불가(코스 사전에 대기중이 없고 예정 시각 필드도 없다). 🔴 **목업에서 바꾼 것**: 아바타 → **아이콘 타일**(순찰자 없는 이력 **35%** 라 아바타를 축으로 쓰면 **3건 중 1건은 축이 사라진다**) · 우측 세로 라벨 → **지표 줄 한 줄**(라벨 후치 `1/3 인증`, 넘치면 줄바꿈) · **진행 막대 제거**(030 규칙 5 — 좁은 폭에는 고르는 데 쓰는 값만. 테이블에는 유지) · 타일은 **한 색**(결과는 뱃지가 말한다) · **날짜를 자르지 않는다**(이력은 여러 날에 걸쳐 있어 "언제" 가 선택 기준이다). ⚠️ **계획 외 1건**: `CARD_BADGE` 가 **네 번째 사본**이 될 상황이라 `AppBadge.variants.ts` 로 **공용 승격**(`ALL_VALUE` 와 같은 처리) — 🔴 `tailwind-merge` 함정 설명이 **사본마다 복제돼 있었다**(한쪽만 고쳐지면 나머지가 틀린 설명이 된다). 카드 테스트 **7 → 10건**
- [x] T503 [US1] 컬럼 정의 in src/features/patrol-zones/components/ZoneColumn.tsx — 코스명 / 순찰자 / 시작 / 종료 / 소요 / 지점 인증 / 결과(**+시간초과 병기**) / 특이사항 **아이콘** / 열기. 🔴 **제거**: 서브텍스트 · dot 색상 · **정렬 화살표**(서버 정렬 파라미터가 없다 — 서버 페이징 중 클라 정렬은 **현재 페이지만 섞어 거짓이 된다**). ⚠️ 결과 컬럼은 **뱃지 2개가 들어가므로 폭을 늘린다**
- [x] T504 [US1] 🔴 null 폴백 in src/features/patrol-zones/components/ZoneColumn.tsx — `userList: []`(**실측 19/54 = 35%**) · 진행 중이면 종료 일시를 `—` 가 아니라 **"진행 중"**(030 선례: `—` 는 값 누락으로 읽힌다) · 교대 **2명 이상** 표기
- [x] T505 [US1] 필터·검색·페이지 URL 연동 in src/pages/service/patrol/zones/PatrolZonesPage.tsx — 🔴 **`replace: true` 를 뗐다**(동작 변경, 사용자 승인): 027 실측에서 `replace` 면 필터를 걸고 뒤로가기를 눌렀을 때 **필터 이전이 아니라 아예 이전 화면으로 튄다**. 023 과 같은 규약으로 맞췄다. 🔴 **코스 옵션은 `GetCourseList?pageSize=100`**(`lib/courseHistoryFilters.ts` 신설 — 이전 판은 **mock 행에서 코스명을 모았고** 값도 이름이었다. 서버 필터는 `courseSeq` 를 받고 **이름은 중복될 수 있다**) — `useQueryParams` + 기간·코스(`courseSeq`)·결과(`eventType`)·순찰자명(`userName`, **300ms 디바운스**). 🔴 **"전체" 는 값이 아니라 해제**(`undefined`) — `ALL` 센티넬이 URL·서버로 새지 않는 것을 테스트로 고정(018·027 규약). **필터 변경 시 첫 페이지 복귀 + `replace`**. 🔴 **순찰자는 드롭다운이 불가능하다** — 현장 계정은 `UserList` 가 **403** 이라 선택 목록을 받을 수 없다(백엔드 요청 중)
- [x] T506 [US1] [P] 카드 모드 매핑 in src/features/patrol-zones/components/ZoneHistoryCard.tsx — 030·034 골격 유지, 필드명만 서버로(**OQ-034-A 코스 쪽 확정**). 🔴 **구조를 새로 만들지 않는다**
- [x] T507 [US1] [P] vitest in src/pages/service/patrol/zones/\_\_tests\_\_/PatrolZonesPage.test.tsx — **8 → 15건**. `server.events` 로 **나간 쿼리를 가로채** 검증한다(화면만 보면 서버가 걸렀는지 우리가 걸렀는지 알 수 없다). 필터 5종 전송 · `ALL` 미노출 · 첫 페이지 복귀 · **`pageSize` 상한** · 실패≠0건≠필터0건 · 행 클릭 이동 · 실측 예외 4종(순찰자 미지정 · 진행 중 · 뱃지 2개 병기 · 완료인데 인증 0). 카드 테스트도 **3 → 7건**
- [x] T508 [US1] 🔴 **삭제 7파일** — `lib/filterCourseHistory.ts`(+테스트) **018 이월의 종결점** · `lib/courseHistoryOptions.ts`(mock 에서 코스 유도) · `components/PatrolTimeline.tsx`(+테스트) · `types/PatrolZone.ts` · `types/PatrolZoneResult.ts`. ✅ **클라이언트 필터 함수 0건**(DoD #2). ✅ **T492-B 해소** — `PATROL_RESULT`·`PatrolZoneResult` 가 mock 과 함께 사라졌다. ⚠️ `PatrolTimeline` 은 목업 `02` 에 타임라인이 없어 지웠다 — 지점 상세(`04`)의 "코스 내 위치" 는 **037 소관**이고 mock 타입 기반이라 그때 새로 만든다. ✅ **`patrol-points` 는 영향 없다**(자기 페이지의 타입을 쓴다 — 확인 2026-10-16)
- [x] T509 [US2] 라우트 신설 in src/router/{paths.ts,index.tsx} · src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx — 🔴 **Phase 4 에서 Phase 3 으로 끌어왔다**(사용자 결정). 빈 껍데기를 두지 않으려고 **상세 응답으로 채울 수 있는 것부터** 채웠다: 브레드크럼 · 헤더(결과 + 시간초과 뱃지) · **순찰 정보 카드**(T512 선취분) · 로딩/실패 분기. 🔴 **"기준 충족" 판정 없이** 소요시간과 기준을 나란히 적는다(B-31). ⚠️ KPI 4종 · 인증 내역 표 · 지도 · 메모는 Phase 4~6 이 채운다

## Phase 4: US2 — 코스 순찰 상세 (골격)

> **독립 테스트 기준**: 목록 행 → 상세 진입, KPI 4종·순찰 정보·인증 내역 표가 뜨고,
> **없는 `historySeq`** 에서 빈 상태가 "삭제됐다" 로 **단정하지 않는다**(023 T375 선례).
>
> ✅ **Phase 4 완료(2026-10-16)** — `verify` 0 errors / `test` **919 → 933**(+14).
> 상세가 **요청 3개**(상세 · 인증 내역 · 코스 평균)로 조립된다. 지도(Phase 5)가 들어올
> 좌측 자리를 2열 골격으로 비워 뒀다.

- [x] T510 [US2] 상세 **2열 골격** in src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx — `lg:grid-cols-3` 으로 좌(인증 내역 + **Phase 5 지도 자리**) 2칸 · 우(순찰 정보) 1칸. 좁은 폭에서는 한 줄로 쌓인다. 🔴 **`GetCourseDetail` 은 Phase 5 에서 이 페이지가 직접 부른다** — 훅 안에서 부르면 `course-history → courses` 역방향 의존이 생긴다(T497 판단)
- [x] T511 [US2] KPI 4종 in src/features/patrol-zones/components/detail/HistoryKpiRow.tsx — 지점 인증(**segments 바 + 미인증 지점명**) · 소요시간(**판정 없음**, 기준·코스 평균을 hint 로) · 특이사항(메모/사진 수) · 구간 평균 간격(**range 바** = 최단~최장 안의 평균). 🔴 **없는 값을 `0` 으로 적지 않는다** — 간격을 만들 수 없으면 `—` 이고 **바도 그리지 않는다**(`0분` 은 "0분 만에 돌았다" 로 읽힌다). 🔴 **`totalMin: 0` 이면 "기준 0분" 이 아니라 "기준 미설정"** — 설정 안 됨과 0분은 다르다. 🔴 **뺀 행 수를 밝힌다**(`인증 시각이 없는 N개 제외`) — 지점 인증 / 소요시간 / 특이사항 / 구간 간격. 🔴 **소요시간에 "기준 충족" 판정을 넣지 않는다** — `totalMin` 이 검증되지 않고(B-31) 어긋난 데이터가 **전수 18건**이며 `totalMin: 0` 코스도 있다. **값만 나란히** 둔다(023 의 "인증률에 색을 입히지 않는다" 와 같은 판단). ⚠️ `AppKpiCard` 재사용(031)
- [x] T512 [US2] 순찰 정보 카드 in src/features/patrol-zones/components/detail/HistoryInfoCard.tsx — 페이지가 2열로 커져 **컴포넌트로 분리**했다. **인증수단 집계(QR n · NFC n)** 추가 — `CheckDetails` 에서 세므로 **요청은 늘지 않는다**. 🔴 인증이 0건이면 집계 줄을 **만들지 않는다**(`QR 0 · NFC 0` 은 정보가 없다). 🔴 **빼는 것**: 이력번호 · 사업장 동 · 교대조 · 단말 · 확인 처리(§3-8)
- [x] T513 [US2] 🔴 인증 내역 표 in src/features/patrol-zones/components/detail/CheckDetailTable.tsx — ✅ **미완료 2종 구분**(무방문 → `미인증` / 방문 → `미완료`) · 결과 + **시간초과 병기** · 기록 아이콘 · 위치 컬럼 없음. 🔴 **미완료 행의 `checkDt` 를 인증시각 칸에 쓰지 않는다**(OQ-15 — 의미 미확정). 🔴 **순번은 `orderNo` 그대로**(서버가 중복을 저장하지만 배열 위치로 다시 매기면 **같은 지점을 화면마다 다른 번호**로 부른다). 🔴 **구간은 `checkDt` 순으로 뺀다** — `lib/checkGaps` 신설(편성 순서로 빼면 음수가 나온다). 🔴 **`AppTable` 을 쓰지 않았다** — 카드 안에 들어가는 고정 표라 페이지네이션·카드 모드·정렬이 전부 불필요하고, 넘기면 **끄는 prop 만 늘어난다**(A6) — 순서(`orderNo`) / 지점 / 인증수단 / 인증시각 / 구간 / 결과 / 기록. 🔴 **미완료를 2종으로 구분**한다: `checkDt === null` → **미인증**("방문 기록이 없습니다") / `checkDt !== null` → **미완료**(인증 실패). 🔴 **위치 컬럼을 만들지 않는다**(층·위치 필드가 **어디에도 없다**). ⚠️ **미완료 행의 `checkDt` 는 숨긴다** — 인증 시각이 아니다(OQ-036-B)
- [x] T514 [US2] [P] 상세 빈 상태·로딩 in src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx — 상세·인증 내역 **각각** 로딩/실패/빈 상태를 가른다. 🔴 **인증 행이 0건인 회차가 실재한다**(완료인데 `checkedCount: 0`) — 그래서 "없음" 과 "못 불러옴" 을 섞으면 **사실과 장애를 구분할 수 없다**. KPI 자리까지 스켈레톤으로 채워 로딩 → 본문 전환에서 레이아웃이 튀지 않게 했다
- [x] T515 [US2] [P] vitest in src/pages/service/patrol/zones/\_\_tests\_\_/PatrolZoneDetailPage.test.tsx — **11건 신설** + `checkGaps` **3건**(총 +14). 조립 · 미인증/미완료 2종 · **미완료 `checkDt` 미표시** · `status 0`·`1` 전 필드 null · **판정 문구 없음** · `기준 미설정` · 인증수단 집계 · 인증 0건 ≠ 실패 · 없는 회차 · `orderNo` 유지. ⚠️ 작성 중 `지점 인증`·`소요시간` 라벨이 **KPI 와 정보 카드 양쪽에** 있어 `getByText` 가 걸렸다 — 목업 `02` 도 양쪽에 두므로 **중복이 아니라 역할 분담**이다(KPI 는 구성, 카드는 값)

## Phase 5: US3 — 상세 지도

> ◩ **T516·T519 완료(2026-10-19)** — 좌표 병합 + 단위 테스트 19건. `verify` 0 errors /
> `test` **933 → 950**(+17, 90 files). 🔴 **계획 2건을 정정했다**: 조인 키 `orderNo` → **`pointSeq`**
> (사용자 결정) · 핀 번호는 **`orderNo` 유지**(032 의 배열 위치를 따르지 않는다 — 같은 페이지의
> 인증 내역 표가 `orderNo` 를 쓴다). 남은 것은 T517·T518(지도 카드).

> **독립 테스트 기준**: 인증 핀 + **미인증 회색 핀**이 함께 찍히고, 좌표 0개면 지도가
> 비표시되며, 범위 밖 좌표가 제외된다. 🔴 **타일 키 없이도 나머지 화면이 멀쩡하다**.

- [x] T516 [US3] 🔴 좌표 병합 in src/features/patrol-zones/lib/historyCoords.ts — `CheckDetails`(인증 위치) + `GetCourseDetail.points[]`(지점 등록 좌표)를 🔴 **`pointSeq` 로 합친다**(사용자 결정 2026-10-19 — 계획의 `orderNo` 를 정정했다: ① 서버가 `orderNo` 를 정규화하지 않아 둘 다 `1` 로 저장될 수 있고 ② `GetCourseDetail` 은 **현재 편성**이라 순찰 뒤 재배치되면 `orderNo 3` 이 다른 지점이 된다. 등록 좌표는 **원시 지점에 붙어 있으니** 지점의 정체로 찾는다. 틀린 조인은 **에러 없이 그럴듯한 핀**을 찍는다). **인증 행은 인증 좌표, 미인증 행은 등록 좌표**. 🔴 **핀 번호는 `orderNo` 다**(배열 위치가 아니다) — 같은 페이지의 인증 내역 표(T513)가 `orderNo` 를 순서 컬럼에 쓰므로 다시 매기면 **표의 3번과 지도의 3번이 달라진다**. 032 가 배열 위치를 쓴 것은 그 화면에 나란한 번호가 없었기 때문이다. 🔴 **핀 색은 `status` 가 정한다 — 좌표 출처와 독립**(OQ-16: 완료인데 좌표 null 인 행 3건이 실재해, 출처로 색을 정하면 **완료가 회색 "미인증" 으로** 읽힌다). 🔴 **`features/courses/lib/courseCoords.ts` 의 범위 검사를 재사용한다**(B-33: `gpsLat: 123` 이 실재) — **새 유틸을 만들지 않는다**
- [ ] T517 [US3] 지도 카드 in src/features/patrol-zones/components/detail/HistoryMapCard.tsx — 🔴 **`CourseMapCard`(032)를 먼저 읽고 재사용 가능한지 판단한다.** 다른 점은 ① 핀이 **2종**(인증/미인증) ② 라벨에 **시각·인증수단** ③ 경로가 **실제 인증 순서**. 공용화가 prop 5개를 넘기면 **쪼개지 않고 복제**한다(030 T449·023 DoD #17 선례 — 갈라질 셸은 뽑지 않는다)
- [ ] T518 [US3] [P] 좌표 없음 안내 in src/features/patrol-zones/components/detail/HistoryMapCard.tsx — "좌표 없음 N개" 명시(032 선례). 🔴 **빠진 지점도 번호를 차지한다** — 3번이 비었다고 4번이 3번이 되면 **같은 지점을 화면마다 다른 번호**로 부른다
- [x] T519 [US3] [P] vitest in src/features/patrol-zones/\_\_tests\_\_/historyCoords.test.ts — 미인증 행이 **등록 좌표로 채워지는 것** · 둘 다 없으면 제외 · 범위 밖 제외 · 좌표 0개 → 지도 비표시

## Phase 6: US4 — 메모·사진

> **독립 테스트 기준**: 메모 있는 행을 펼치면 본문이 보이고, **사진 URL 이 404 여도**
> 레이아웃과 메모 텍스트가 멀쩡하다.

- [ ] T520 [US4] 메모 펼침 패널 in src/features/patrol-zones/components/detail/CheckDetailMemo.tsx — `memos[].memo` 본문. 🔴 **작성자·시각은 메모에 없다** — **행의 `userName`·`checkDt`** 로 대체한다(실측 확정: `memos` = `{memoSeq, memo, attaches}` 3필드가 전부). 🔴 **"처리 상태"(시설팀 접수 등) 칸을 만들지 않는다** — 필드가 없다. **`spec 023` C단이 남긴 자리를 여기서 채운다**
- [ ] T521 [US4] 🔴 사진 썸네일 + onError 폴백 in src/features/patrol-zones/components/detail/CheckDetailMemo.tsx — **B-40: 첨부 URL 이 404 다**(실측: 순찰 2건·공지 1건 전부, 토큰 무관). "이미지를 불러올 수 없습니다" 를 표시한다. ⚠️ **폴백 없이 두면** 깨진 이미지만 뜨고 **원인을 화면에서 알 수 없다**. ⚠️ `attaches` 는 **nullable**(빈 배열이 아니라 `null`)
- [ ] T522 [US4] [P] vitest in src/features/patrol-zones/\_\_tests\_\_/CheckDetailMemo.test.tsx — `attaches: null` · 이미지 onError → 폴백 문구 · 메모 0건 행은 펼침 버튼이 없음

## Phase 7: Polish

- [ ] T523 [P] 로딩 상태 점검 — 목록·상세·지도 각각. 🔴 **기존 선례를 따르고 새 패턴을 만들지 않는다**(`AppEmpty`·`isPending`, A6)
- [ ] T524 `npm run verify` 0 + `npm run test` green — **883 → 증가**. 🔴 **`verify` 와 `test` 를 병렬 실행한다**(CLAUDE.md A4)
- [ ] T525 🔴 사용자 **브라우저 확인(`dev:real`, 실 서버)** — 목록 필터 4종·페이지 이동·상세 진입·지도 2종 핀·메모·사진 폴백. ⚠️ **mock 에서만 보면 안 된다** — `status 0`·`userList: []`·404 는 **실데이터의 모양**이다
- [ ] T526 `npm run capture` baseline in docs/ui-current/ — `현장/patrol-zones--목록` 교체 + **상세 1장 신규** + 🔴 **나머지 무변화 확인**(±1% 는 Chromium 노이즈 — 다시 커밋하면 진짜 변경이 묻힌다). **T525 가 T526 보다 먼저**(눈으로 보고 자리를 정한 뒤에 찍는다 — 032·034 순서)
- [ ] T527 [P] 문서 동기화 — `screens.md` §1-2(컬럼·라우트) · `flow.md`(상세 라우트 추가) · `design-system.md`(**화면별 뱃지 매핑표** + 뱃지 2개 병기 규칙) · `components.md` · `patterns.md`(서버 필터 패턴)
- [ ] T528 DoD 18개 대조표 + `## 다음 spec으로 이월` — 🔴 **037 이 쓸 공용 기반 목록**을 명시한다(뱃지 매핑·파라미터 변환·queryKeys 규약·필터 조립)

---

## Dependencies & Execution Order

- **T488 → Phase 1 나머지 전부.** 파일을 옮기고 나서 타입을 고친다(반대로 하면 두 번 고친다)
- **T489·T490·T491 은 `[P]`** (서로 다른 파일). **T492 는 T491 뒤** — 뱃지 SSOT 가 생겨야 인라인 상수를 수렴시킬 수 있다
- **Phase 1 → Phase 2 전부**
- **T493 → T494 → T497**. **T495·T496·T500 은 `[P]`**
- **T498·T499 는 `[P]`** (T497 과 독립 — 계산 함수다)
- **Phase 2 → Phase 3·4·5·6 전부** (공용 기반이 blocking)
- **Phase 3** 는 T502 → T503 → T504 → T505 순차. **T506·T507 은 `[P]`**. **T508 은 T505 뒤**
  (필터가 서버로 옮겨간 것을 확인한 뒤에 클라 필터를 지운다 — 먼저 지우면 화면이 빈다)
- **Phase 4** 는 T509 → T510 → (T511·T512·T513) → T514. 셋은 서로 `[P]` 지만 **T510 셸이 먼저**
- **Phase 5 는 Phase 4 뒤** — 🔴 **지도는 상세가 뜬 다음이다.** 먼저 붙이면 "안 보이는 이유" 가
  좌표인지 타일인지 **데이터가 안 온 것인지** 구분할 수 없다(032 의 Phase 1 = 좌표 정제 선례)
- **T516 → T517 → T518**. **T519 는 `[P]`**
- **Phase 6 은 T513 뒤** (인증 내역 행이 있어야 펼칠 자리가 있다). T520 → T521, **T522 는 `[P]`**
- **Phase 7 은 전부 완료 후.** 🔴 **T525(브라우저) → T526(캡쳐)** 순서를 지킨다

## 제약 (구현 중 지킬 것)

1. 🔴 **새 공용 컴포넌트를 만들지 않는다.** `AppTable`·`AppFilterPopover`·`AppDatePicker`·
   `AppKpiCard`·`AppDetailCard`·`AppDetailRow`·`AppPagination` 이 전부 있다.
2. 🔴 **`pageSize` 는 어디서도 100 을 넘기지 않는다**(T493 한 곳에서 막는다).
3. 🔴 **`siteSeq` 없이 호출하지 않는다** — 권한 밖도 200 이 와서(B-9) **장애가 정상 화면으로 보인다**.
4. 🔴 **판정하지 않는다.** 소요시간 기준 충족·인증률 색·"완료 = 전 지점 인증" 전부 금지 —
   근거 데이터(`totalMin`·`courseMin`·`pointCount` 분모)를 **확신할 수 없다**.
5. 🔴 **서버 정렬이 없으므로 정렬 UI 를 만들지 않는다.** 서버 페이징 중 클라 정렬은 거짓이다.
6. **MSW 핸들러를 중복 선언하지 않는다** — 앞의 것만 써서 **조용히 0건**이 온다(023 사고).
7. `leaflet` 인스턴스를 정리한다(`map.remove()`) — 라우트를 오가며 쌓이면 이벤트가 샌다.

## 백엔드 대기

**없다 — 036 은 회신 없이 완결된다.** 단 두 가지가 **화면에 남는다**:

| 항목 | 036 에서 | 회신 후 |
|---|---|---|
| **B-40**(첨부 404) | onError 폴백 — 메모 텍스트는 보인다 | 폴백이 안 뜨는 것으로 확인 |
| **OQ-15**(미완료 `checkDt` 의미) | 숨긴다 | 의미가 확정되면 표기 결정 |

🔴 **`historySeq` 요청은 037 의 선행이다**(036 과 무관) — 코스 상세는 `historySeq` 로 진입하므로
회차를 이미 알고 있다. 막히는 쪽은 **지점 인증 상세**다.
