# 현장 대시보드 API 요청 — 백엔드 전달용

> 작성 2026-10-30 (`spec 067` 이월). 화면: 현장 사이트 `/dashboard`(로그인 후 첫 화면).
> 지금 화면은 **고정 데이터**로 그려져 있다 — 아래 API 가 생기면 연결한다. 화면 모양: `src/features/dashboard/types/index.ts`.
> 기존 API 실측: [`api-spec.md`](./api-spec.md) §5.
> 🔴 **진행 중인 순찰은 SSE 로 갱신한다**(결정 2026-10-30) — 처음에 **현재 상태를 조회**하고, 이후 변화는 **SSE 이벤트가 오면 화면을 바꾼다.** 주기 조회(30초)는 하지 않는다.

## 요청 요약

| # | 화면 영역 | 구분 | API(안) | 우선 | 기존 API 로 안 되는 이유 |
|:-:|---|---|---|:-:|---|
| 1-A | 진행 중인 순찰 — **현재 상태 조회** | 🆕 신규 | `GET History/W/sign/GetActiveCourseList?siteSeq` | P1 | `GetCourseHistory?eventType=0` 에 **기준 시간 · 지점 목록이 없다** — 지점은 `CheckDetails` 를 회차마다 따로 불러야 한다(N+1) |
| 1-B | 진행 중인 순찰 — **변화 알림** | 🆕 신규 | `GET History/W/sign/ActiveCourseStream?siteSeq` (SSE) | P1 | 없음 |
| 2 | 오늘 숫자(KPI 5칸) | 🆕 신규 | `GET History/W/sign/GetTodaySummary?siteSeq` | P1 | 완료 · 미완료는 `GetCourseHistory` 를 여러 번 불러야 셀 수 있고 **시간초과는 거를 방법이 없다**. 배치 · 복귀 요청 수도 여기에 함께 받는다(새로고침 1번 = 숫자 5칸 한 번에) |
| 3 | 최근 미완료 · 시간초과 | ✏️ 기존 확장 | `GET History/W/sign/GetPointHistory` + **`overTimeYn` 파라미터** | P2 | `status` 필터는 있지만 **시간초과로 거르는 파라미터가 없다** |
| 4 | 공지사항(최근 3건) | ✅ 기존 그대로 | `GetNoticeList?pageNumber=1&pageSize=3` | — | 확인만(아래 Q4) |
| 5 | KPI · 최근 기록 갱신 | — | **SSE 이벤트를 받으면** 2 · 3 을 다시 부른다(주기 조회 없음) | — | 아래 1-B "이벤트 → 화면" |

---

## API별 정리

처리 방식: **조회** = 화면을 열 때 1번 · **이벤트** = SSE 이벤트가 오면 · **계산** = 받은 값으로 화면이 계산(서버에 요청하지 않는다).

| # | 섹션 | 이 API 하나로 그리는 요소 | API | 처리 방식 | 데이터 |
|:-:|---|---|---|---|---|
| — | 머리 | 사업장명 부제 · 연결 상태 · 새로고침 버튼 | 없음 | 사업장명은 로그인 때 고른 값 · 연결 상태는 1-B 연결 여부 · 새로고침은 아래 조회 전부 다시 | — |
| 2 | KPI | `오늘 순찰` 묶음(오늘 완료 · 오늘 미완료 · 시간초과) · `배치 대기` 묶음(배치 요청 · 복귀 요청) | 🆕 `GetTodaySummary` | 조회 + `course-ended` 이벤트 때 다시 조회 · 새로고침 | 숫자 5개 |
| 1-A | 진행 중인 순찰 | 카드 목록 · 개수 · 코스명 · 순찰자 · `교대` · 시작 시각 · 경과/기준 · 시간 막대 · 지점 단계 뱃지 · 카드 → 회차 상세 | 🆕 `GetActiveCourseList` | 조회(화면 열 때 · SSE 다시 연결할 때). **계산**: 카드 순서 · `시간초과 +N분` · `건너뜀 N` · `n/N 지점` · `다음: 지점명` · 경과 1분마다 더하기 | 회차 배열(지점 배열 포함) |
| 1-B | 진행 중인 순찰 | 위 카드의 변화(추가 · 제거 · 지점 인증 · 교대 · 일시정지) | 🆕 `ActiveCourseStream`(SSE) | 이벤트 → 1-A 로 받은 데이터를 고친다 | 이벤트 6종 |
| 3 | 최근 미완료 · 시간초과 | 행 5개(시각 · 지점 · 코스 · 순찰자 · `미완료`/`시간초과` 뱃지 · 메모 아이콘 · 행 → 지점 인증 상세) | ✏️ `GetPointHistory` + `overTimeYn`(기존 확장) | 조회 2번(`status=3` · `overTimeYn=true`, 각 5건) → **계산**: 시간순으로 합쳐 겹치는 행 1개로 · 앞 5건. `point-checked` · `course-ended` 이벤트 때 다시 조회 | 기존 `PointHistoryRow` 목록 |
| 4 | 공지사항 | 행 3개(제목 · 날짜 · 고정 핀 · 행 → 공지 상세) | ✅ `GetNoticeList`(기존) | 조회만(실시간 불필요) | 기존 `NoticeRow` 목록 |

## 1-A. 진행 중인 순찰 현재 상태 — `GetActiveCourseList` 🆕

화면을 열 때 · SSE 를 다시 연결했을 때 부른다. 지금 순찰 중인 회차 전부(페이징 없음, 배열). 정렬은 화면이 한다.

| 필드 | 타입 | 뜻 | 화면 |
|---|---|---|---|
| `historySeq` | number | 회차 키 | 카드 → 회차 상세 |
| `courseSeq` | number | 코스 키 | — |
| `courseName` | string | 코스명 | 카드 제목 |
| `startDt` | string | 시작 시각 | `09:00 시작` |
| `elapsedSec` | number | **응답 시점** 경과 초(일시정지 제외) | `18분 / 30분` — 이후는 화면이 1분마다 더한다 |
| `pausedYn` | boolean | 지금 일시정지 중 | 정지 중이면 경과를 더하지 않는다 |
| `totalMin` | number | 코스 기준 소요 시간(분) | `/ 30분` · 막대 · 시간초과 판단 |
| `userList` | `{userSeq, userName}[]` | 순찰자(교대 시 복수, **지금 순찰자가 마지막**) | 순찰자 이름 |
| `handoverCount` | number | 교대 횟수 | `교대` 뱃지(1 이상) |
| `pointList` | 아래 배열 | 코스 지점 **편성 순서대로** | 지점 단계 뱃지 |

`pointList` 한 줄:

| 필드 | 타입 | 뜻 |
|---|---|---|
| `orderNo` | number | 순서 |
| `pointSeq` | number | 지점 키 |
| `pointName` | string | 지점명 |
| `status` | number | 지점 사전(0 대기 · 1 진행중 · 2 순찰제외 · 3 미완료 · 4 완료) — `CheckDetails` 와 같은 값 |
| `checkDt` | string \| null | 인증 시각 |

> 💡 시간초과는 화면이 `elapsedSec` · `totalMin` 으로 계산한다 — 그래서 **시간초과 이벤트는 필요 없다.**
> 💡 `GetCourseHistory?eventType=0` 행에 위 필드를 붙여 주셔도 된다 — 화면 쪽은 어느 쪽이든 맞출 수 있다.

## 1-B. 진행 중인 순찰 변화 — `ActiveCourseStream` (SSE) 🆕

`Content-Type: text/event-stream`. 사업장(`siteSeq`) 안의 회차에 변화가 생기면 보낸다.

| 이벤트(`event:`) | 언제 | `data`(JSON) | 화면 |
|---|---|---|---|
| `course-started` | 순찰 시작 | 1-A 한 줄 전체 | 카드 추가 · 오늘 숫자 다시 조회 |
| `point-checked` | 지점 인증 · 인증 실패 | `{historySeq, pointSeq, orderNo, status, checkDt}` | 그 지점 뱃지 색 · `n/N 지점` · 다음 지점 · 최근 기록 다시 조회 |
| `course-paused` / `course-resumed` | 일시정지 · 재개 | `{historySeq, elapsedSec}` | 경과 시간 멈춤 · 다시 셈 |
| `course-handover` | 교대 | `{historySeq, userList, handoverCount}` | 순찰자 이름 · `교대` 뱃지 |
| `course-ended` | 순찰 종료(완료 · 미완료) | `{historySeq, status}` (코스 사전 1 · 2) | 카드 제거 · 오늘 숫자 · 최근 기록 다시 조회 |
| (주석 `: ping`) | 30초마다 | — | 연결 유지(프록시가 끊지 않게) |

화면 쪽 처리(참고):
- **다시 연결되면 1-A 를 다시 부른다** — 끊긴 사이의 이벤트를 되돌려 받지 않아도 된다(`Last-Event-ID` 불필요).
- 사업장을 바꾸면 연결을 닫고 새 `siteSeq` 로 다시 연다.
- 오늘 숫자(2) · 최근 기록(3)은 **이벤트가 왔을 때만** 다시 조회한다(여러 이벤트가 몰리면 묶어서 1번).

## 2. 오늘 숫자 — `GetTodaySummary` 🆕

| 필드 | 타입 | 뜻 | 화면 칸 |
|---|---|---|---|
| `completedCount` | number | 오늘 시작한 회차 중 **완료** | 오늘 완료 |
| `incompleteCount` | number | 오늘 시작한 회차 중 **미완료** | 오늘 미완료 |
| `overtimeCount` | number | 오늘 회차 중 **시간초과**(Q2 에서 범위 확정) | 시간초과 |
| `pendingAssignmentCount` | number | 대기 중 **배치 요청** 수(`GetAssignmentCount.pendingCount` 와 같은 값) | 배치 요청 |
| `pendingReturnCount` | number | 대기 중 **복귀 요청** 수(`GetAssignmentCount.pendingReturnCount` 와 같은 값 — 원소속 사업장에서 센다) | 복귀 요청 |

> 🔴 **숫자 5칸을 한 API 로 받는다**(결정 2026-11-02) — 새로고침 1번에 5칸이 함께 바뀐다. 화면은 `오늘 순찰`(3칸) · `배치 대기`(배치 요청 · 복귀 요청 2칸) 묶음 카드 2개로 보인다. 사이드 메뉴 배치 뱃지도 요청 + 복귀를 합쳐 보일 예정이라 같은 값을 쓴다.
> 기존 `GetAssignmentCount` 는 배치관리 화면 · 사이드 메뉴 뱃지가 그대로 쓴다 — **같은 값이 두 API 에 있으니 같은 기준으로 세 주세요.**

## 3. 최근 미완료 · 시간초과 — `GetPointHistory` 확장 ✏️

| 추가 파라미터 | 타입 | 뜻 |
|---|---|---|
| `overTimeYn` | boolean(선택) | `true` 면 **시간초과 행만**, `false` 면 시간초과 아닌 행만, 없으면 지금처럼 전체 |

- 🔴 **추가는 이 파라미터 하나뿐이다** — 응답(`PagedData<PointHistoryRow>`) · 다른 파라미터 · 정렬(최근 순)은 그대로. 기존 `status` 필터와 같은 모양의 **일반 필터**라 지점 순찰이력 목록에서도 쓸 수 있다.
- 화면은 두 번 부른다: `status=3&pageSize=5`(미완료) · `overTimeYn=true&pageSize=5`(시간초과) → 시간순으로 합치고, 미완료이면서 시간초과인 행(같은 `detailSeq`)은 하나로, 앞 5건.
- 경위: `api-spec.md` B-34 에서 이 필터 요청을 **철회**했었다(2026-10-12 — 쓰는 화면이 없었다). 대시보드가 쓰는 화면이 되어 다시 요청한다.

---

## JSON 형식

모든 응답은 기존 래퍼 `{ "message": string, "data": T, "code": 200 }` 안에 온다. 아래는 `data` 부분이다.

### 1-A. `GET History/W/sign/GetActiveCourseList?siteSeq=7` 🆕

```json
[
  {
    "historySeq": 103,
    "courseSeq": 3,
    "courseName": "C코스",
    "startDt": "2026-11-02T08:20:00",
    "elapsedSec": 3480,
    "pausedYn": false,
    "totalMin": 45,
    "userList": [{ "userSeq": 31, "userName": "박민수" }],
    "handoverCount": 0,
    "pointList": [
      { "orderNo": 1, "pointSeq": 60, "pointName": "정문", "status": 4, "checkDt": "2026-11-02T08:24:10" },
      { "orderNo": 2, "pointSeq": 61, "pointName": "로비", "status": 4, "checkDt": "2026-11-02T08:29:40" },
      { "orderNo": 3, "pointSeq": 62, "pointName": "옥상", "status": 0, "checkDt": null }
    ]
  },
  {
    "historySeq": 101,
    "courseSeq": 2,
    "courseName": "B코스",
    "startDt": "2026-11-02T08:55:00",
    "elapsedSec": 1380,
    "pausedYn": false,
    "totalMin": 40,
    "userList": [
      { "userSeq": 33, "userName": "최근무" },
      { "userSeq": 32, "userName": "김철수" }
    ],
    "handoverCount": 1,
    "pointList": [
      { "orderNo": 1, "pointSeq": 70, "pointName": "주차장", "status": 4, "checkDt": "2026-11-02T08:58:00" },
      { "orderNo": 2, "pointSeq": 71, "pointName": "창고", "status": 0, "checkDt": null },
      { "orderNo": 3, "pointSeq": 72, "pointName": "전기실", "status": 4, "checkDt": "2026-11-02T09:12:30" },
      { "orderNo": 4, "pointSeq": 73, "pointName": "옥상", "status": 0, "checkDt": null }
    ]
  }
]
```

### 1-B. `GET History/W/sign/ActiveCourseStream?siteSeq=7` (SSE) 🆕

```text
event: course-started
data: { …1-A 한 줄과 같은 모양… }

event: point-checked
data: {"historySeq":103,"pointSeq":62,"orderNo":3,"status":4,"checkDt":"2026-11-02T09:19:05"}

event: course-paused
data: {"historySeq":103,"elapsedSec":3600}

event: course-resumed
data: {"historySeq":103,"elapsedSec":3600}

event: course-handover
data: {"historySeq":101,"userList":[{"userSeq":33,"userName":"최근무"},{"userSeq":32,"userName":"김철수"}],"handoverCount":1}

event: course-ended
data: {"historySeq":103,"status":1}

: ping
```

### 2. `GET History/W/sign/GetTodaySummary?siteSeq=7` 🆕

```json
{
  "completedCount": 12,
  "incompleteCount": 1,
  "overtimeCount": 2,
  "pendingAssignmentCount": 2,
  "pendingReturnCount": 1
}
```

### 3. `GET History/W/sign/GetPointHistory?siteSeq=7&overTimeYn=true&pageNumber=1&pageSize=5` ✏️

응답은 **지금과 같다**(`PagedData<PointHistoryRow>`) — 추가는 `overTimeYn` 파라미터뿐. 미완료는 기존 `status=3` 으로 따로 부른다.

```json
{
  "items": [
    {
      "detailSeq": 2000,
      "courseSeq": 2,
      "courseName": "B코스",
      "pointSeq": 2,
      "pointName": "창고",
      "checkDt": "2026-11-02T08:47:00",
      "userSeq": 32,
      "userName": "김철수",
      "authMethod": 10,
      "authMethodName": "NFC",
      "status": 4,
      "statusName": "완료",
      "overTimeYn": true,
      "hasMemo": false,
      "pauseTime": "00:00:00"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalCount": 1,
  "totalPages": 1
}
```

### 4. `GET Notice/W/sign/GetNoticeList?siteSeq=7&pageNumber=1&pageSize=3` ✅ 기존

```json
{
  "items": [
    {
      "noticeSeq": 5,
      "title": "사업장 출입 보안 수칙",
      "description": "사업장 출입 시 반드시 출입증을 패용해 주시기 바랍니다.",
      "userSeq": 101,
      "userName": "이현장",
      "isPin": true,
      "createDt": "2026-10-15T09:00:00",
      "attachCount": 0
    }
  ],
  "page": 1,
  "pageSize": 3,
  "totalCount": 5,
  "totalPages": 2
}
```

---

## 확인 부탁드리는 것

| # | 질문 | 왜 필요한가 |
|:-:|---|---|
| Q1 | 앱이 지점을 **순서대로** 찍게 강제하나요? | 화면은 "마지막 인증 지점보다 앞인데 미인증" 을 **건너뜀**(주황)으로 표시한다. 순서 자유라면 이 표시를 바꾼다 |
| Q2 | 시간초과 숫자는 **오늘 끝난 회차만** 세나요, **진행 중 초과**도 넣나요? | 진행 중 초과는 아래 카드에도 나와 두 번 셀 수 있다. 화면 제안: 끝난 회차만 |
| Q3 | **미인증**(가지 않은 지점, `checkDt` 없음)도 3번 목록에 넣을 수 있나요? 넣는다면 시각은 회차 종료 시각? | `GetPointHistory` 는 `checkDt` 있는 행만 준다(실측) — 지금은 "갔는데 인증 실패" 만 나온다 |
| Q4 | `GetNoticeList` 가 **고정 공지를 먼저** 주나요? | 화면은 위 3건만 보여주고 고정 공지에 핀을 단다 |
| Q5 | SSE **인증 방식** — 지금처럼 `Authorization: Bearer` 헤더로 받아 주실 수 있나요? | 브라우저 기본 `EventSource` 는 **헤더를 못 붙인다.** 화면은 `fetch` 로 스트림을 읽어 헤더를 붙일 수 있으니 **헤더 그대로가 제일 간단하다.** 쿼리(`?access_token=`)나 쿠키 방식이면 알려 주세요 |
| Q6 | SSE 연결 중 **토큰이 만료되면**(3시간) 어떻게 되나요? | 화면은 401 을 받으면 토큰을 재발급하고 다시 연결한다. 만료 시 서버가 연결을 끊어 주는지 확인 |
| Q7 | 응답 버퍼링 · 타임아웃 — 운영 프록시(IIS/nginx 등)에서 스트림이 **바로 흘러가나요?** | 버퍼링되면 이벤트가 늦게 온다. 연결 유지 시간 상한도 알려 주세요 |
| Q8 | 교대 기록(`GetCourseHistoryHandOvers`) 구조 | 테스트 DB 에 교대 데이터가 없어 빈 배열만 봤다(`api-spec.md` OQ-11). 1번의 `handoverCount` · 순찰자 순서와 같은 값인지 |

## 테스트 데이터 부탁

- 진행 중인 회차 2건 이상(그중 1건은 기준 시간 초과) — 지금 테스트 DB 의 `eventType=0` 은 **0건**이다.
- 교대가 있는 회차 1건.
