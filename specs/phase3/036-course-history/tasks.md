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

- [ ] T488 🔴 순찰이력 서버 모듈을 `features/course-history/` 로 이동 in src/features/course-history/{types,api,hooks}/ — 지금 `features/courses` 안에 있다(`types/history.ts`·`api/getCourseHistory.ts`·`api/getPointHistory.ts`·`hooks/useCourseHistory.ts`·`lib/courseHistoryStats.ts`·`lib/historyRange.ts`). 🔴 **그 파일의 주석이 이 이동을 미리 적어 뒀다** — "`spec 025` 가 착수하면 그쪽이 주인이 된다"(`types/history.ts` 머리말). 코스 관리(023 B·C단)는 **import 경로만** 바뀐다. ⚠️ **대안**: 옮기지 않고 `features/courses` 에 두는 것 — 그러면 이력 화면이 **코스 관리 feature 안에** 살게 되고 037(지점이력)도 거기서 import 한다. **WF-3 plan-first 에서 사용자 확인을 받고 시작한다**
- [ ] T489 [P] 🔴 `CheckDetailRow` nullable 교정 in src/features/course-history/types/checkDetail.ts — `checkUserSeq`·`userName`·`overtimeYn` 을 `| null` 로. **실측 근거**: 인증이 찍히지 않은 행은 세 필드가 전부 null 이다(`api-spec.md` §5-2 17번). 🔴 **타입만 고치고 끝내지 않는다** — 기존 소비처(`courseAlerts.ts`·`CourseAlertList`)가 non-null 을 가정하고 있는지 함께 확인
- [ ] T490 [P] `PointHistoryMemo`·`PointHistoryAttach` 타입 신설 in src/features/course-history/types/checkDetail.ts — 037 이 쓴다(`memoList`/`attachList`/`attachPath`, `fileExt` 없음 — B-35). 036 은 선언만 하고 **쓰지 않는다**
- [ ] T491 🔴 결과 뱃지 **화면별 매핑** SSOT in src/features/course-history/lib/historyBadge.ts — ① 코스 상태(`0`·`1`·`2`) ② 코스 상세의 지점 상태(`0`·`1`·`3`무방문·`3`방문·`4`) ③ **`overTimeYn` 은 별 함수**(결과에 섞지 않는다) ④ `4` + `hasMemo` → `순찰기록` / `4` + `!hasMemo` → `이상없음`. 🔴 **공용 enum 으로 묶지 않는다** — 코스 `2`=미완료, 지점 `2`=순찰제외다
- [ ] T492 🔴 enum 3중 분기 해소 in src/types/enum.ts — `PointResult`(소비처 **0개**) 제거 또는 T491 로 수렴. 함께 정리: `PatrolZonesPage.tsx:28` 인라인 `PATROL_RESULT` · `features/patrol-zones/types/PatrolZoneResult.ts`. ⚠️ **`patrol-points` 쪽(`PatrolPointResultType`)은 건드리지 않는다** — 037 이 같은 작업을 하며 지운다(지금 끊으면 **037 에서 되돌릴 코드**를 더한다. 023 DoD #15 선례)

## Phase 2: Foundational (모든 US 선행 blocking)

> **독립 테스트 기준**: MSW 200 에서 훅이 서버 파라미터를 **그대로 실어 보내는 것**을
> 쿼리 가로채기로 확인. 🔴 **화면 결과가 아니라 나간 쿼리를 본다**(027 선례 — 화면만 보면
> "서버가 걸렀는지 우리가 걸렀는지" 알 수 없다).

- [ ] T493 목록 파라미터 변환 in src/features/course-history/lib/courseHistoryListParams.ts — URL 쿼리 ↔ `CourseHistoryParams`. 🔴 **`pageSize` 상한 100 을 이 한 곳에서 막는다**(`spec 027` 이 200 을 보내 **장애가 빈 상태로 읽혔다**). `courseListParams.ts` 와 같은 모양으로
- [ ] T494 목록 훅 in src/features/course-history/hooks/useCourseHistoryList.ts — 🔴 기존 `useCourseHistory`(코스 상세 B단, 기간 30일 고정)와 **다른 훅**이다. 그쪽은 KPI 집계용이고 이쪽은 **페이지네이션 목록**이다. ⚠️ `siteSeq === null` 이면 호출하지 않는다(B-9: 권한 밖도 200 이 와서 **장애가 정상 화면으로 보인다**)
- [ ] T495 [P] queryKeys 확장 in src/features/course-history/queryKeys.ts — `list(params)`·`detail(historySeq)`·`checkDetails(historySeq)`·`courseAverage(courseSeq)`. 🔴 `data-model.md` §8 규약 — **`siteSeq` 를 키에 넣는다**(URL 에 없으므로 키가 유일한 구분자)
- [ ] T496 [P] 상세 API 2종 in src/features/course-history/api/{getCourseHistoryDetail,getCourseHistoryCheckDetails}.ts — 조회계라 실측돼 있다(`api-spec.md` §5-1 16·17번)
- [ ] T497 상세 훅 in src/features/course-history/hooks/useCourseHistoryDetail.ts — 4개 호출을 묶는다(상세·CheckDetails·`GetCourseDetail`·코스 평균). 🔴 **`GetCourseDetail` 을 왜 부르는지 주석에 남긴다** — 미인증 핀의 좌표 출처다(§2-3)
- [ ] T498 코스 평균 계산 in src/features/course-history/lib/courseAverage.ts — `courseSeq` + `eventType=1`(완료만). 🔴 **미완료를 섞지 않는다**(소요 0·중단이 평균을 끌어내린다). ⚠️ `totalCount > 100` 이면 **"최근 100회 평균"** 으로 문구가 바뀐다(페이지 루프 금지)
- [ ] T499 [P] 구간 간격 계산 in src/features/course-history/lib/checkIntervals.ts — `CheckDetails` 의 `checkDt` 차이로 평균·최단·최장. 🔴 **`checkDt` 가 없는 행은 계산에서 빼고**, 뺀 건수를 호출부가 알 수 있게 반환한다
- [ ] T500 [P] MSW 핸들러 확장 in src/mocks/handlers/history.ts — 상세·CheckDetails 추가 + **실측 예외를 시드로 박는다**: `status 0` 진행 중 1건 · `userList: []` 1건 · 완료인데 `checkedCount: 0` 1건 · 미인증(무방문) 1건 · 좌표 없는 지점 1건. 🔴 **`GetPointHistory` 핸들러를 새로 선언하지 않는다** — `points.ts:217` 에 이미 있고, 중복 선언하면 MSW 가 앞의 것만 써 **조용히 0건**이 온다(023 사고)
- [ ] T501 [P] vitest — 공용 기반 in src/features/course-history/\_\_tests\_\_/{historyBadge,courseHistoryListParams,courseAverage,checkIntervals}.test.ts — 뱃지 조합(`4`+`overTime`+`memo` **동시 참** 포함) · `pageSize` 상한 · 평균에서 미완료 제외 · 간격에서 null 제외

## Phase 3: US1 — 코스 이력 목록 (서버 전환)

> **독립 테스트 기준**: MSW 200 에서 목록이 뜨고, 필터 4종 변경이 **URL 과 서버 쿼리**에
> 동시에 반영되며, 뒤로가기로 보존된다. **mock 배열이 0줄**임을 grep 으로 확인.

- [ ] T502 [US1] 🔴 페이지 재작성 in src/pages/service/patrol/zones/PatrolZonesPage.tsx — 597줄 중 **`zonePatrols` mock 배열(215행~)과 `PatrolDetailPanel`(183행~)을 삭제**한다. 마스터-디테일 → **목록 전용**(상세는 T506 의 별도 라우트). 🔴 **구조가 바뀌는 것이라 "매핑만 손본다" 가 아니다**(030 이 예상한 것보다 크다)
- [ ] T503 [US1] 컬럼 정의 in src/features/patrol-zones/components/ZoneColumn.tsx — 코스명 / 순찰자 / 시작 / 종료 / 소요 / 지점 인증 / 결과(**+시간초과 병기**) / 특이사항 **아이콘** / 열기. 🔴 **제거**: 서브텍스트 · dot 색상 · **정렬 화살표**(서버 정렬 파라미터가 없다 — 서버 페이징 중 클라 정렬은 **현재 페이지만 섞어 거짓이 된다**). ⚠️ 결과 컬럼은 **뱃지 2개가 들어가므로 폭을 늘린다**
- [ ] T504 [US1] 🔴 null 폴백 in src/features/patrol-zones/components/ZoneColumn.tsx — `userList: []`(**실측 19/54 = 35%**) · 진행 중이면 종료 일시를 `—` 가 아니라 **"진행 중"**(030 선례: `—` 는 값 누락으로 읽힌다) · 교대 **2명 이상** 표기
- [ ] T505 [US1] 필터·검색·페이지 URL 연동 in src/pages/service/patrol/zones/PatrolZonesPage.tsx — `useQueryParams` + 기간·코스(`courseSeq`)·결과(`eventType`)·순찰자명(`userName`, **300ms 디바운스**). 🔴 **"전체" 는 값이 아니라 해제**(`undefined`) — `ALL` 센티넬이 URL·서버로 새지 않는 것을 테스트로 고정(018·027 규약). **필터 변경 시 첫 페이지 복귀 + `replace`**. 🔴 **순찰자는 드롭다운이 불가능하다** — 현장 계정은 `UserList` 가 **403** 이라 선택 목록을 받을 수 없다(백엔드 요청 중)
- [ ] T506 [US1] [P] 카드 모드 매핑 in src/features/patrol-zones/components/ZoneHistoryCard.tsx — 030·034 골격 유지, 필드명만 서버로(**OQ-034-A 코스 쪽 확정**). 🔴 **구조를 새로 만들지 않는다**
- [ ] T507 [US1] [P] vitest in src/pages/service/patrol/zones/\_\_tests\_\_/PatrolZonesPage.test.tsx — 서버 쿼리 가로채기 · 필터→첫 페이지 복귀 · 뒤로가기 보존 · `ALL` 미노출 · `userList: []` 폴백 · 진행 중 행
- [ ] T508 [US1] 🔴 `filterCourseHistory.ts` 삭제 in src/features/patrol-zones/lib/filterCourseHistory.ts — **018 이월의 종결점**. 함께: `courseHistoryOptions.ts` 가 mock 기반이면 서버 옵션(`GetCourseList`)으로 교체. ⚠️ **클라이언트 필터 함수 0건**이 DoD #2 다

## Phase 4: US2 — 코스 순찰 상세 (골격)

> **독립 테스트 기준**: 목록 행 → 상세 진입, KPI 4종·순찰 정보·인증 내역 표가 뜨고,
> **없는 `historySeq`** 에서 빈 상태가 "삭제됐다" 로 **단정하지 않는다**(023 T375 선례).

- [ ] T509 [US2] 라우트 신설 in src/router/{paths.ts,index.tsx} — `patrolZoneDetail(historySeq)` = `/patrol/zones/:historySeq`. 🔴 **코스 관리 상세 `/zones/:courseSeq` 와 다르다** — 키가 **회차**다. `paths.ts:17` 의 `courseDetail` 과 나란히 두고 주석으로 구분을 남긴다
- [ ] T510 [US2] 상세 페이지 셸 in src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx — 목업 `02` 의 2열 골격(좌: 지도·인증 내역 / 우: 순찰 정보). 브레드크럼 + 헤더 뱃지(결과 + **시간초과**). 🔴 **`AppDetailCard`·`AppPageHeader` 재사용** — 새 셸을 만들지 않는다(023 DoD #17: 카드 셸은 머리 구성이 제각각이라 prop 6개짜리 추상화가 된다)
- [ ] T511 [US2] KPI 4종 in src/features/patrol-zones/components/detail/HistoryKpiRow.tsx — 지점 인증 / 소요시간 / 특이사항 / 구간 간격. 🔴 **소요시간에 "기준 충족" 판정을 넣지 않는다** — `totalMin` 이 검증되지 않고(B-31) 어긋난 데이터가 **전수 18건**이며 `totalMin: 0` 코스도 있다. **값만 나란히** 둔다(023 의 "인증률에 색을 입히지 않는다" 와 같은 판단). ⚠️ `AppKpiCard` 재사용(031)
- [ ] T512 [US2] 순찰 정보 카드 in src/features/patrol-zones/components/detail/HistoryInfoCard.tsx — 코스·순찰자·시작·종료·소요·지점 인증·인증수단 집계(QR n · NFC n). 🔴 **빼는 것**: 이력번호 · 사업장 동 · 교대조 · 단말 · 확인 처리(§3-8). `AppDetailRow` 재사용
- [ ] T513 [US2] 🔴 인증 내역 표 in src/features/patrol-zones/components/detail/CheckDetailTable.tsx — 순서(`orderNo`) / 지점 / 인증수단 / 인증시각 / 구간 / 결과 / 기록. 🔴 **미완료를 2종으로 구분**한다: `checkDt === null` → **미인증**("방문 기록이 없습니다") / `checkDt !== null` → **미완료**(인증 실패). 🔴 **위치 컬럼을 만들지 않는다**(층·위치 필드가 **어디에도 없다**). ⚠️ **미완료 행의 `checkDt` 는 숨긴다** — 인증 시각이 아니다(OQ-036-B)
- [ ] T514 [US2] [P] 상세 빈 상태·로딩 in src/pages/service/patrol/zones/PatrolZoneDetailPage.tsx — 🔴 **조회 중에 "삭제되었거나 접근할 수 없습니다" 가 뜨면 방금 지운 줄 안다**(023 T375). `isPending` 과 "없음" 을 구분한다
- [ ] T515 [US2] [P] vitest in src/pages/service/patrol/zones/\_\_tests\_\_/PatrolZoneDetailPage.test.tsx — 4개 호출 조립 · 미인증/미완료 2종 분기 · 없는 `historySeq` · `status 0`·`1` **전 필드 null** 에서 터지지 않음 · 완료인데 인증 0

## Phase 5: US3 — 상세 지도

> **독립 테스트 기준**: 인증 핀 + **미인증 회색 핀**이 함께 찍히고, 좌표 0개면 지도가
> 비표시되며, 범위 밖 좌표가 제외된다. 🔴 **타일 키 없이도 나머지 화면이 멀쩡하다**.

- [ ] T516 [US3] 🔴 좌표 병합 in src/features/patrol-zones/lib/historyCoords.ts — `CheckDetails`(인증 위치) + `GetCourseDetail.points[]`(지점 등록 좌표)를 `orderNo` 로 합친다. **인증 행은 인증 좌표, 미인증 행은 등록 좌표**. 🔴 **`features/courses/lib/courseCoords.ts` 의 범위 검사를 재사용한다**(B-33: `gpsLat: 123` 이 실재) — **새 유틸을 만들지 않는다**
- [ ] T517 [US3] 지도 카드 in src/features/patrol-zones/components/detail/HistoryMapCard.tsx — 🔴 **`CourseMapCard`(032)를 먼저 읽고 재사용 가능한지 판단한다.** 다른 점은 ① 핀이 **2종**(인증/미인증) ② 라벨에 **시각·인증수단** ③ 경로가 **실제 인증 순서**. 공용화가 prop 5개를 넘기면 **쪼개지 않고 복제**한다(030 T449·023 DoD #17 선례 — 갈라질 셸은 뽑지 않는다)
- [ ] T518 [US3] [P] 좌표 없음 안내 in src/features/patrol-zones/components/detail/HistoryMapCard.tsx — "좌표 없음 N개" 명시(032 선례). 🔴 **빠진 지점도 번호를 차지한다** — 3번이 비었다고 4번이 3번이 되면 **같은 지점을 화면마다 다른 번호**로 부른다
- [ ] T519 [US3] [P] vitest in src/features/patrol-zones/\_\_tests\_\_/historyCoords.test.ts — 미인증 행이 **등록 좌표로 채워지는 것** · 둘 다 없으면 제외 · 범위 밖 제외 · 좌표 0개 → 지도 비표시

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
