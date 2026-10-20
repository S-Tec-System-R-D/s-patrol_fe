# 037-point-history spec

> 위험도: **B** (조회 전용. `screens.md` §1-2 의 B 를 그대로 따른다)
> 관련 화면: 지점 순찰이력 목록 `/patrol/points` + **지점 인증 상세**(신규 라우트)
> Phase: `roadmap.md` Phase 3
> 목업: `docs/ui-mock/현장/순찰이력/03-point-history-list.html` · `04-point-history-detail.html`

> **WF-1-0 — 해당 없음.** 변경계를 호출하지 않는다. `History/*` 는 **GET 8종뿐**이다
> (swagger 전수, `spec 036` 확인). 그래서 목업 `04` 의 **확인 처리 · 기록 추가 · 원본
> 다운로드 · 인쇄 · CSV** 는 만들 수 없고 전부 범위에서 뺀다(036 과 같은 판단).

> 🔴 **이 spec 은 `024` 를 대체한다.** `024`·`025` 는 **번호 폐기**됐다(사용자 결정
> 2026-10-16, `roadmap.md` §7-1). 코스 쪽은 036 이 끝냈고 **지점 쪽이 037 이다.**

> 🔴 **상세는 모달이 아니라 페이지다**(사용자 결정 2026-10-19). `screens.md` §1-2 는
> "기록 상세(다이얼로그)" 로 적혀 있으나, 목업 `04` 의 구성(KPI 4종 · 2열 · 타임라인)이
> 모달 분량이 아니다. 036 이 코스에서 한 것과 같은 **목록 페이지 + 상세 페이지** 구조다.

---

## 0. Carry-over

### 직전 spec(`036-course-history`)에서 — "037 이 그대로 쓰는 공용 기반"

036 이 세웠다. **다시 만들지 않는다**(`036/tasks.md` 이월 블록).

| 자산 | 위치 | 037 이 쓰는 법 |
|---|---|---|
| 결과 뱃지 매핑 | `course-history/lib/historyBadge.ts` | `pointCheckBadge` **그대로**. ⚠️ 지점이력은 `status` **`3`·`4` 2종뿐**이다 |
| 시간초과 병기 | 같은 파일 `overtimeBadge()` | 결과와 **독립 축** — 뱃지 2개를 나란히. ⚠️ 필드명 **`overTimeYn`**(대문자 T, B-4) |
| 파라미터 변환 | `course-history/lib/courseHistoryListParams.ts` | 같은 모양으로 `pointHistoryListParams.ts`. `pageSize` 상한 100 · 1-based · 빈 값은 키 제거 |
| queryKeys 규약 | `course-history/queryKeys.ts` | 같은 계층(`lists`/`list`/`detail`) + **`siteSeq` 포함**(`data-model.md` §8) |
| 필터 조립 | `AppDatePicker`(기간 확장분) · `AppSelect` · `AppInput variant="search"` | 🔴 **신규 공용 컴포넌트 0개** — 036 이 기존 것으로 끝냈다 |
| 표 행 펼침 + 이미지 폴백 | `patterns.md` §15 · `CheckDetailMemo.tsx` | 상세 메모·사진에 같은 규칙. ⚠️ 응답 이름이 다르다(B-35) → **어댑터 1개** |
| 지점이력 메모 타입 | `course-history/types/checkDetail.ts` | `PointHistoryMemo`·`PointHistoryAttach` — **036 이 선언만 해 뒀다** |
| 소요시간 변환 | `course-history/lib/elapsed.ts` | `toSeconds`·`formatDuration`. ⚠️ `pauseTime` 은 목록 문자열 / 상세 숫자(B-5) |

### 폐기된 `024` 에서 받는 것 (`roadmap.md` §7-1 이월표)

| 출처 | 내용 | 처리 |
|---|---|---|
| `019/spec.md:14` | 018 T158·T160·T161 — 지점이력 필터 옵션·UI 배선·화면 테스트 | **본 spec 에서 종결**(US1) |
| `019/spec.md:15·16` | 018 T162·T163 페이지네이션 URL 이관 · T169 시각 검증 | **본 spec 지점 쪽 적용 → 018 완전 종결** |
| `030/tasks.md:140` | `PointHistoryCard` mock → 서버 매핑 | US1 |
| `034/spec.md:135` OQ-034-A | 이력 2화면 카드 골격 — 코스는 036 이 확정 | **지점 쪽을 본 spec 에서 확정 → OQ-034-A 종결** |
| `022` OQ-022-H · `023` DoD #15 | 구 `PointType`·`PointAuthenticationMethod` 소멸 자리 | 🔴 **본 spec 에서 지운다** — 036 단독으로는 못 지웠다(`patrol-points` 가 쓰고 있었다) |
| `patterns.md:539·545` | `/patrol/points` 필터 · 대기 중 5종 | US1 |
| `screens.md:55` | 지점 이력 필터 5종 · Export | US1. ⚠️ **Export 는 범위 밖**(엔드포인트 없음, 036 과 같은 처리) |

### 대기 중인 것

- ⏸ **`spec 035` P1·P2 12건** — 2026-10-15 전달, **반영·회신 대기**. 037 은 막히지 않는다(조회 전용).
- 🔴 **`historySeq` 회신 대기** — **US4 전체가 이것에 묶여 있다**(§2-4). US1~US3 은 묶이지 않는다.

---

## User Stories

- **US1.** 현장관리자가 **지점 순찰이력 목록**에서 기간·코스·인증수단·결과로 걸러 **서버
  데이터**를 본다 — 지금은 페이지 안에 박힌 mock 배열(`PatrolPointsPage.tsx:103`)을 보고 있다.
- **US2.** 목록의 한 행을 열어 **지점 인증 상세**에서 그 인증 1건의 정보와 **순찰자가 남긴
  메모·사진**을 본다.
- **US3.** 상세에서 **그 지점의 최근 인증 이력**과 **최근 14일 인증 추이**를 보고, 이번
  인증이 평소와 다른지 가늠한다.
- **US4.** 🔴 **(`historySeq` 선행)** 상세에서 **그 회차 안에서의 위치**를 본다 — 직전 지점
  간격 · 코스 내 순서 · 코스 내 위치 타임라인 · "코스 순찰 상세" 링크.

---

## 1. 목적

지점 순찰이력을 **mock → 서버**로 전환하고, 인증 1건을 여는 **상세 페이지를 신설**한다.
036 이 세운 공용 기반(뱃지·enum·파라미터 변환·필터 조립)을 **쓰기만** 한다 — 이 spec 이
공용 기반을 새로 세우는 자리는 **없다**.

그리고 **중복 선언을 한 곳으로 모은다**(사용자 결정 2026-10-19). `PointHistoryRow` 와
`fetchPointHistory` 가 **지금 두 곳에 있다** — `features/points/`(027 지점 상세용)와
`features/course-history/`(036). 037 이 세 번째를 만들면 **3중 분기**가 되고, 그것은 036 이
`PointResult` 에서 막 해소한 문제와 같은 종류다.

---

## 2. I/O

### 2-1. 라우트

| 화면 | 라우트 | 비고 |
|---|---|---|
| 지점 이력 목록 | `/patrol/points` | 유지 |
| **지점 인증 상세** | **`/patrol/points/:detailSeq`** (신규) | 🔴 **지점 관리 상세 `/points/:pointSeq` 와 다른 것이다** — 앞에 `/patrol` 이 붙고 **키가 `detailSeq`(인증 1건)** 다. `paths.ts` 에 `patrolPointDetail(detailSeq)` 추가 |

🔴 **키가 지점이 아니라 인증 1건이다.** 같은 지점이 하루에 여러 번 찍히고 **회차마다 결과가
다르다** — `pointSeq` 로 열면 "어느 인증인지" 가 사라진다. 036 이 `historySeq`(회차)로
간 것과 같은 이유다.

### 2-2. 목록 — `GET History/W/sign/GetPointHistory`

**요청**: `siteSeq`(필수) · `fromDt` · `toDt` · `courseSeq` · `authMethod` · `status` ·
`userName` · `pageNumber`(1-based) · `pageSize`(**≤100**)

| 목업 요소 | 서버 필드 |
|---|---|
| 순찰일시(날짜 + 시각 2줄) | `checkDt` |
| 순찰지점 | `pointName` |
| 순찰코스 | `courseName` |
| 인증수단 뱃지 | `authMethod` · `authMethodName` |
| 순찰자 | `userName` |
| 구간 | `pauseTime`(`'HH:mm:ss'`) — ⚠️ **의미 미확정, OQ-037-A** |
| 결과 뱃지 | `status` + `hasMemo`(`pointCheckBadge`) |
| **시간초과 뱃지**(별도) | `overTimeYn` |
| 기록 | `hasMemo` — 🔴 **건수가 없다**(아래) |

**제거**(036 과 같은 근거):

- **지점명 서브텍스트**(`1F · 정문 출입구`) — 층·위치가 **목록 응답에 없다**
- **코스별 dot 색상** — 서버에 없고 프론트가 만들 근거도 없다(036 이 코스 목록에서 제거)
- **컬럼 정렬 화살표** — 서버 정렬 파라미터가 없다. 서버 페이징 중 클라 정렬은 **현재
  페이지만 섞어 거짓이 된다**
- **내보내기** — 엔드포인트 없음(`screens.md:55` 이월분을 여기서 닫는다)
- **기록 "N건"** → 🔴 **아이콘으로 바꾼다**. 목록은 `hasMemo: boolean` 뿐이고 건수를 붙이면
  **행마다 상세 조회(N+1)**다. 036 이 코스 목록에서 같은 판단을 했다(`ZoneColumn.tsx:143`)
- **기록 칸의 사유 문구**(`사유 미등록` · `공사 구간`) — 🔴 **그런 필드가 없다.** 메모는
  앱에서 고른 **키워드 조합 + 자유 입력**이고 "왜 미인증인지" 가 아니다(`api-spec.md` ④)
- **검색창의 "지점명"** — 서버는 `pointSeq` 정수만 받는다. 검색은 **순찰자명(`userName`)만**
  (사용자 결정 2026-10-19. 지점 셀렉트는 목업에 없어 넣지 않는다 — OQ-037-B)

**필터 4종**: 기간 · 순찰코스(`courseSeq`) · 인증수단(`authMethod` 9·10) · 결과(`status`)

🔴 **결과 필터 선택지는 2종이다** — `3 미완료` · `4 완료`. 목업의 5종(이상없음/순찰기록/
시간초과/미완료/순찰제외)은 **뱃지 표시용**이고 선택지가 아니다. `이상없음`↔`순찰기록` 은
`hasMemo` 파생이라 **서버에 보낼 값이 없고**, `시간초과` 는 독립 축, `순찰제외` 는 전 사업장
0건이다.

### 2-3. 상세 — 호출 2개 (US2·US3)

| # | 엔드포인트 | 쓰는 곳 |
|:-:|---|---|
| 1 | `GetPointHistoryDetail?detailSeq` | 헤더 · 기본정보 · **메모·사진** · 인증 결과 KPI |
| 2 | `GetPointHistory?pointSeq&fromDt&toDt` | **그 지점의 최근 인증 이력** 표 + **14일 추이** KPI |

🔴 **2번은 한 요청으로 두 자리를 채운다** — 036 이 `CheckDetails` 하나로 네 자리를 채운 것과
같다. 14일 추이를 위해 따로 부르지 않는다.

⚠️ **027 이 이미 같은 요청을 한다**(`PointPatrolLog` — 지점 상세의 "순찰 인증 기록").
🔴 **그래서 훅을 재사용하고 새로 만들지 않는다**(`usePointHistory`).

### 2-4. 상세 — 🔴 `historySeq` 가 막는 것 (US4)

`PointHistoryDetail` 에 **`courseSeq` 만 있고 `historySeq` 가 없다.** 아래 네 개가 **전부**
회차 식별자에 걸려 있다:

1. KPI **직전 지점 간격** — 같은 회차의 앞 지점 `checkDt` 가 필요
2. KPI **코스 내 순서**(4/8) — 그 회차의 편성·인증 순서가 필요
3. **코스 내 위치 타임라인** — 그 회차의 지점 목록이 필요
4. **"코스 순찰 상세" 링크** — `/patrol/zones/:historySeq` 로 보낼 키가 없다

받으면 **`CheckDetails(historySeq)` 1회로 네 개가 동시에** 열린다. 회신 전에는 **US4 를
착수하지 않는다** — 자리도 비워두지 않는다(빈 카드는 "데이터가 없다" 로 읽힌다).

### 2-5. 중복 통합 (사용자 결정 2026-10-19)

| 지금 | 037 이후 |
|---|---|
| `features/points/types/history.ts` — `PointHistoryRow`·`PointHistoryParams` | **삭제** → `course-history/types` 로 통합 |
| `features/points/api/pointHistory.ts` — `fetchPointHistory` | **삭제** → `course-history/api/getPointHistory.ts` |
| `features/course-history/types/history.ts` — 같은 `PointHistoryRow` | **남는 쪽** |

⚠️ **027 소비처 3곳이 함께 움직인다** — `points/hooks/usePointHistory.ts` ·
`points/components/detail/PointPatrolLog.tsx` · `points/lib/patrolSummary.ts`.
🔴 **회귀 확인이 필수다**(지점 상세의 인증 기록·2주 인증 KPI). `points/types/history.ts` 의
`PointHistoryParams` 는 `pointSeq` **필수**인 좁은 모양이라, 통합 타입은 **옵셔널로 넓히고
목록·상세 양쪽이 쓴다.**

---

## 3. 제약

### 3-1. 🔴 목록에 나타나지 않는 상태가 있다 (실측 2026-10-16)

`GetPointHistory` 는 **`checkDt` 가 있는 행만** 준다. 그래서 **`대기중`(0) · `진행중`(1) ·
"방문 기록 없는 미완료"** 는 이 화면에 **나타나지 않는다** — 코스 상세(`CheckDetails`)에만
있다. 뱃지 매핑은 그대로 쓰되(쓰이지 않는 분기를 끌고 다니는 것이지 틀린 것이 아니다)
**빈 상태 문구를 "없다" 로 단정하지 않는다.**

### 3-2. 🔴 미완료 행도 인증시각을 보여준다 (OQ-15 해소)

`checkDt` 는 **지점 인증 시간**이다(사용자 DB 확인 2026-10-19). 전에 "의미 미확정" 으로
숨기기로 했던 것(`OQ-036-B`)은 **해소됐다** — 미완료 행에도 시각을 적는다.
⚠️ 미완료 행은 `authMethod`·`authMethodName` 이 **비어 있다**(`''`) — 인증수단 칸을 비운다.

### 3-3. 🔴 같은 데이터에 이름이 셋 다 다르다 (B-35)

| | 코스(`CheckDetails`) | 지점(`PointHistoryDetail`) |
|---|---|---|
| 메모 배열 | `memos` | **`memoList`** |
| 첨부 배열 | `attaches` | **`attachList`** |
| 이미지 URL | `imagePath` | **`attachPath`** |
| 확장자 | `fileExt` | **없음** |

→ **어댑터 1개**를 만들어 `CheckDetailMemo` 가 쓰는 모양으로 맞춘다(`CLAUDE.md` B4 조건 ①
목록↔상세 필드명 차이). 🔴 **컴포넌트를 복제하지 않는다.**

### 3-4. 🔴 사진은 **빈 칸**이 된다 (B-40)

첨부 URL 이 **404** 다(2026-10-19 재측정에도 유효). 메모 **텍스트는 보이고** 사진만 안 온다
→ `onError` 폴백. 회신되면 **저절로 사라진다**. ⚠️ 첨부가 **여러 장인 메모가 실재**한다.

### 3-5. 메모에는 작성자·시각·처리상태가 없다

`memoList` = `{memoSeq, memo, attachList}` 가 전부다. 목업 `04` 의 **"박지우 10:28" 은 행의
`userName`·`checkDt` 로 대체**하고, **"시설팀 접수" 같은 처리 상태는 뺀다**(필드가 없다).

### 3-6. 🔴 응답 두 쪽의 불일치를 호출부가 흡수한다

| 필드 | 목록 | 상세 |
|---|---|---|
| 시간초과 | `overTimeYn` (**대문자 T**) | `overtimeYn` (소문자) |
| 인증수단명 null | `''` | **`'Unknown'`** |
| `pauseTime` | `'HH:mm:ss'` | **`number`**(B-5) |

🔴 **`'Unknown'` 을 화면에 그대로 내보내지 않는다** — 영문이 섞이고 "알 수 없는 인증수단"
처럼 읽힌다. 인증이 없는 것이므로 **빈 칸**이다.

### 3-7. 🔴 "기준 충족" 판정을 하지 않는다

036 §3-4 와 같은 판단이다. `pauseTime` 의 의미가 미확정(OQ-037-A)이고 `totalMin` 은 어긋난
데이터가 실재한다(`spec 033` 보류) → **값을 나란히 보여주고 판정하지 않는다.** 목업 `04` 의
`상한 +6분` 같은 비교 문구는 **적지 않는다**.

### 3-8. 범위에서 빼는 것

**쓰기 API 가 없어서**: 확인 처리 · 기록 추가 · 사유 등록 · 원본 다운로드 · 인쇄 · CSV ·
내보내기
**필드가 없어서**: 이력번호(`PT-20260501-0418`) · 층·위치 · 처리담당자 · 처리 상태 ·
좌표 오차 · 단말
**근거가 없어서**: 코스별 dot 색 · 컬럼 정렬 · 목록 상단 요약 바(목업 CSS 에만 있고 HTML 에
쓰이지 않는다)
**다음으로**: 상세 헤더의 **이전/다음 pager**(목록 컨텍스트를 상세로 넘겨야 한다 — OQ-037-C)

---

## 4. 엣지 케이스

> B급이라 공통 규칙(`CLAUDE.md` 층 A · `design-system.md`)을 따른다. **실측에서 나온 것만** 적는다.

1. **미완료 행**(`status 3`, 45건 실재) — 인증수단 빈 칸 · `pauseTime` 이 `'00:00:00'` 일 수
   있다 · 결과 뱃지는 `미완료`. 🔴 시각은 **보여준다**(§3-2).
2. **`status 4` 인데 인증수단·좌표·순찰자가 전부 null** — 3건 실재(OQ-16). 터지지 않는다.
3. **`순찰제외`(2) 는 전 사업장 0건** — 매핑은 있지만 **실데이터로 확인할 수 없다**(OQ-18).
4. **`pageSize > 100` 은 400** 이다. 🔴 `spec 027` 이 200 을 보내 **장애가 빈 상태로 읽혔다**
   — 그 선례 때문에 `clampPageSize` 를 통과시킨다.
5. **조회 실패 ≠ 0건** — 둘을 다르게 그린다(022·027·023·036 승계).
6. **없는 `detailSeq`** — 상세 진입 실패 시 복귀 링크를 준다. 🔴 **"삭제되었거나" 라고
   단정하지 않는다**(036 T375 가 지적한 자리 — 조회 중에 뜨면 방금 지운 줄 안다).

---

## 5. 완료 조건 (DoD)

- [ ] 1. `/patrol/points` 가 **서버 데이터**로 뜬다. 🔴 **페이지 내 mock 배열 0줄**
      (`PatrolPointsPage.tsx` 의 `pointPatrols`·`PointPatrolType`·`PATROL_POINT_RESULT` 삭제)
- [ ] 2. 필터 4종(기간·코스·인증수단·결과) + 순찰자 검색이 **서버 파라미터**로 나가고
      **URL 에 보존**된다. 🔴 결과 선택지는 **2종**이다
- [ ] 3. 페이지네이션이 URL 에 실리고 `pageSize` **≤100** 을 테스트가 고정한다
      (**018 T162·T163 종결**)
- [ ] 4. 결과 뱃지 + **시간초과 뱃지 병기**. 🔴 `historyBadge.ts` 를 **재사용**(새 매핑 0개)
- [ ] 5. 🔴 **중복 통합** — `features/points/types/history.ts`·`api/pointHistory.ts` **삭제**,
      소비처 3곳이 공용 타입을 쓴다. 구 `PointAuthenticationMethod` 소멸
      (**022 OQ-022-H · 023 DoD #15 종결**)
- [ ] 6. 좁은 폭 카드가 **서버 타입**으로 렌더되고 034 타일 골격을 따른다
      (**OQ-034-A 종결** · `030/tasks.md:140` 종결)
- [ ] 7. `/patrol/points/:detailSeq` 신설 + 목록 행에서 진입 + 없는 `detailSeq` 처리
- [ ] 8. 상세 기본정보 — 지점·코스·순찰자·인증시각·인증수단·결과. 🔴 `'Unknown'` 미노출
- [ ] 9. 상세 메모·사진 — 어댑터 1개로 `CheckDetailMemo` **재사용**(컴포넌트 복제 0건) +
      **onError 폴백**
- [ ] 10. 상세 "최근 인증 이력" + "14일 추이" 가 **요청 1개**로 채워진다
      (`usePointHistory` 재사용)
- [ ] 11. 🔴 **판정 문구 0건** — 소요·간격에 기준 비교를 적지 않는다(§3-7)
- [ ] 12. null 안전 — 미완료 행 · 인증수단 null · `pauseTime` 깨짐에서 테스트가 통과한다
- [ ] 13. `npm run verify` 0 + `npm run test` green (현재 990 → 증가)
- [ ] 14. 🔴 **027 회귀 확인** — 지점 상세의 "순찰 인증 기록"·2주 인증 KPI 가 통합 후에도
      같다(DoD #5 의 대가)
- [ ] 15. 사용자 **브라우저 확인**(실 서버 `dev:real`)
- [ ] 16. `npm run capture` — `현장/patrol-points--*` 교체 + **나머지 무변화 확인**
- [ ] 17. 문서 동기화 — `screens.md` §1-2·§4 · `flow.md` · `design-system.md`(지점이력 뱃지
      매핑) · `patterns.md`(§9 탭 · §14 카드 소비처)
- [ ] 18. `## 다음 spec으로 이월` 블록 — **US4 미착수분**(`historySeq`)과 Export 를 명시

---

## 6. Open Questions

- [ ] **OQ-037-A. `pauseTime` 의 의미.** 목업의 "구간 +7분" 자리에 넣을 값인데 **무엇을 센
      시간인지 문서에 없다**(목록 `'HH:mm:ss'` / 상세 `number`, B-5). 🔴 **의미가 확정될
      때까지 컬럼 제목을 "구간" 으로 두고 판정하지 않는다.** 백엔드 확인 대상.
- [ ] **OQ-037-B. 지점명 검색·지점 필터.** 서버가 `pointSeq` 정수만 받아 **텍스트 검색이
      불가능**하다(목업 검색창은 "지점명 · 순찰자"). 지점 셀렉트를 넣으면 옵션 조회가
      요청 1개 늘고 목업에 없는 칩이 생긴다 → **넣지 않고 수요를 본다**(A6).
- [ ] **OQ-037-C. 상세의 이전/다음 pager.** 목록의 정렬·필터 컨텍스트를 상세로 넘겨야 한다
      (URL 로? 캐시로?). 전례가 없어 **본 spec 범위 밖**으로 둔다.
- [ ] **OQ-037-D. 14일 추이의 기간 기준.** 목업은 14일 고정이다. `spec 023` B단이 30일
      고정을 쓴 선례가 있어 **둘이 갈린다** — 화면에서 보고 맞춘다.
- [ ] **OQ-037-E. `순찰제외`(2) 를 실데이터로 확인할 수 없다**(전 사업장 0건, = OQ-18).
