# 앱(모바일) API 실측 스펙 (app-api-spec.md)

> **이 문서의 지위**: 근무자 앱이 쓰는 **모바일 API 서버의 실제 응답을 호출로 실측**한 결과. `docs/swagger-app-api.json` 에는 응답 스키마가 하나도 없으므로(전부 `200 OK` / content 없음), **응답 형태에 관해서는 이 문서가 SSOT**다. 요청 DTO는 swagger가 SSOT.
>
> 웹 API(`/W/`)는 [`api-spec.md`](./api-spec.md) 를 본다. 이 문서는 **개발 전용 시뮬레이터**(근무자 동작을 API로 대신 실행하는 컨트롤러)를 만들기 위해 수집했다.
>
> | 항목 | 값 |
> |---|---|
> | 수집일 | 2026-11-18 |
> | baseURL | `http://123.2.156.230:5297` (테스트 서버 · 웹 API `:5231` 과 **별도 서버**, DB는 같다) |
> | swagger | 저장본 `docs/swagger-app-api.json` = 라이브 `/swagger/v1/swagger.json` (2026-11-18 수신) · 경로 73개 |
> | 계정 | 현장관리자 `600001`(사업장 34) · `600002`(사업장 35) / 근무자 `600101`~`600103`(사업장 34) / 본사 `000000`(웹 API 로만 사용) |
> | 범위 | **컨트롤러가 쓰는 묶음 57개 중 55개 실측**(조회 + 쓰기 + 오류). 미측정은 §7 |
> | 개인정보 | 토큰 값 · QR 서명 · 전화번호 뒷자리는 기록하지 않는다. 비밀번호는 저장소에 쓰지 않는다 |

---

## 1. 공통 규약 (실측 확정)

### 1-1. 경로

```
/api/v1/{Domain}/M/{sign/}{ActionName}
```

- `M` = Mobile 전용 (웹은 `W`). 웹과 **같은 이름의 API가 많지만 요청 · 응답 필드가 다르다** — 웹 타입을 그대로 쓰면 안 된다(예: 목록이 페이지가 아니라 커서)
- `sign` = 인증 필요. `sign` 없는 엔드포인트는 `POST /api/v1/Login/M/Login` 하나
- REST 아님 — path parameter 없음. 전부 query string 또는 body
- 도메인: `Login` `User` `UserPatrol` `Point` `Course` `History` `Healthcheck` `Notice` `Notify` `Keyword` `Emergency` `Geocode` `Tts`

### 1-2. 인증

- `Authorization: Bearer {accessToken}`
- 로그인 요청은 웹과 같다: `{ loginId, loginPw }`. 선택 값 `deviceType` · `fcmToken` · `voipToken` 은 **없어도 로그인된다**
- 로그인 성공 `code`: **`201` 현장관리자 / `202` 근무자** — 웹과 같은 의미. 🔴 **웹에서는 로그인할 수 없는 근무자(`202`)가 앱 서버에서는 로그인된다**
- 로그인 응답 `data` 는 **토큰 2개뿐**. 사용자 정보는 JWT 클레임 또는 `User/M/sign/MyProfile`
- JWT 클레임 구성은 웹과 **완전히 같다**(`userSeq`(문자열) · `loginId` · `userName` · `uuid` · `roleDisplay` · `role` · `nbf` · `exp` · `iss` · `aud`). `role`: `FieldManager` / `FieldWorker`
- **accessToken 수명 10800초(3시간)** — `exp - nbf` 실측
- **재발급**(`Login/M/sign/RefreshToken`): body `{ refreshToken }` + **Bearer 헤더 둘 다 필요**(헤더 없으면 401 + 빈 body). **refreshToken 은 회전하지 않는다**. 성공 `code` 는 `202`(근무자 계정으로 실측)
- **로그아웃**(`Login/M/sign/Logout`): refreshToken 만 무효가 된다. 🔴 **로그아웃 뒤에도 accessToken 은 만료 전까지 계속 통한다**(실측)
- 같은 계정으로 다시 로그인해도 **앞서 받은 토큰이 계속 유효**하다 — 한 근무자를 여러 번 로그인해도 서로 끊지 않는다

### 1-3. 응답 래퍼

웹과 같은 `{ message, data, code }` 래퍼. 조회 성공 `code` 는 `200`.

- 쓰기 성공의 `data` 는 대부분 **`true`** 하나다 — 🔴 **만든 것의 번호가 응답에 없다**(지점 · 코스 · 근무자 · 사업장 추가 모두). 번호가 필요하면 목록을 다시 읽어 이름으로 찾아야 한다
- 예외: `StartPatrol` 은 `data` 가 **회차 번호(`historySeq`, 정수)** 다

### 1-4. 목록 = 커서 방식 (🔴 웹과 다르다)

```ts
interface CursorList<T> {
  items: T[]
  lastCursor: number | null   // 마지막 줄의 번호. 다음 요청의 last○○Seq 로 넘긴다
  hasMore: boolean
}
```

- 요청: `pageSize` + `last{Xxx}Seq`(엔드포인트마다 이름이 다르다 — `lastUserSeq` · `lastPointSeq` · `lastCourseSeq` · `lastHistorySeq` · `lastDetailSeq` · `lastAssignmentSeq`)
- 최신순(번호 내림차순)으로 온다. `pageSize` 를 생략하면 지금 데이터(10건 안팎)는 한 번에 다 왔다 — **기본 크기는 확인하지 못했다**
- 커서가 아닌 **배열 그대로** 오는 목록도 있다: `GetAvailablePatrolList` · `GetClassificationPoint` · `GetGroupTree` · `GetTodayEmergencyList` · `GetNoticeList` · `GetFailedUserList`

### 1-5. 오류 응답 (3종이 섞여 있다)

| 종류 | 언제 | 형태 |
|---|---|---|
| (A) 래퍼 | 비즈니스 오류 · 토큰 없음/무효 | `{ message, data: null \| false, code }` — **`code` 가 HTTP status 와 같다**(400 · 401 · 403 · 404 · 409) |
| (B) ProblemDetails | 유효성 400 · 서버 500 | `errors` / `title` / `status` / `traceId`(400), `detail`(500). `message` 없음 |
| (C) 빈 body | **권한 없음 403**(근무자가 관리 API 호출), Bearer 없는 재발급 401 | 본문 길이 0 |

- 🔴 **웹과 다른 점**: 토큰 없음 · 무효 토큰의 401 이 웹은 빈 body 인데 **앱은 래퍼**(`"잘못된 요청입니다."`, `code: 401`)다
- 403 은 두 가지다 — **역할 권한 없음은 빈 body**, **업무 규칙상 금지는 래퍼**(예: `"현재 순찰 담당자만 인증할 수 있습니다."`)
- 문구가 뭉뚱그려진 경우가 많다: `"잘못된 요청입니다."` 가 없는 번호 조회(400) · 다른 사업장(403) · 토큰 없음(401)에 모두 쓰인다 → **`message` 로 분기하지 않는다**

### 1-6. multipart 요청

`AddUser` · `UpdateUser` · `CertificationPatrol` · `UpsertMemo` · `UpsertCourseHistory` · `UpsertPointHistory` 는 `multipart/form-data` 다(사진 첨부 때문).

- 중첩 필드는 **점 표기**로 보낸다: `memoInfo.memo`, `memo.memoSeq`, `memo.memo`
- 🔴 **빈 문자열을 보내면 400 이다** — `memoInfo.memo=""` → ProblemDetails `"The memo field is required."`. **메모가 없으면 필드를 아예 빼야 한다**
- swagger 는 `memoInfo.memo` · `memoInfo.attachInfo.image` 를 필수(`*`)로 적지만 **실제로는 둘 다 없어도 된다**

### 1-7. CORS (브라우저에서 직접 호출)

- 허용 출처는 **`http://123.2.156.229:5173` · `:5174` 둘뿐**이다(실측 2026-11-18). `localhost` 로 열면 차단된다
- 허용 헤더 `content-type` · `authorization`, `Access-Control-Allow-Credentials: true`
- 사전 요청(`OPTIONS`)은 허용 목록 밖 출처에도 204 를 주되 **허용 헤더만 붙이지 않는다** — 204 만 보고 통과로 판단하면 안 된다

---

## 2. 정수 값의 뜻 (실측)

| 필드 | 값 | 뜻 |
|---|---|---|
| `authMethod` | `9` / `10` | QR / NFC |
| `codeSeq` | `6` / `7` | 현장 관리자 / 현장 근무자 |
| `courseStatusCode` (코스) | `0` / `1` / `2` | 대기중 / 순찰중 / 교대중 |
| `patrolStatus` (진행 중 회차) | `1` / `2` / `0` | 순찰 중 / 교대 요청 중 / 종료됨 |
| `detailStatus` (진행 중 회차의 지점 줄) | `0` / `1` / `3` / `4` | 아직 차례 아님 / **지금 차례** / 미완료(건너뜀 · 도중 종료) / 완료 |
| `status` (회차 이력) | `1` / `2` | 완료 / 미완료 |
| `status` (지점 이력) | `3` / `4` | 미완료 / 완료 |
| `gubun` (배치 목록 요청) | `0` / `1` | 배치 신청 / 복귀 신청 |
| `affiliation.assignApprovalStatus` | `0` / `1` / `2` | 배치 승인 대기 / 승인됨(배치 중) / 거절됨 |
| `affiliation.returnApprovalStatus` | `0` / `1` / `3` | 복귀 신청 없음 / 복귀 승인 대기 / 복귀 거절됨 |

- `pauseTime` 은 **진행 중 회차에서는 초(정수)**, **이력에서는 `"HH:mm:ss"` 문자열**이다
- `detailStatus` 의 `2` 는 나오지 않았다
- **근무자의 배치 단계는 `GET User/M/sign/DetailUser` 의 `affiliation` 하나로 구분된다**(실측 2026-11-18 · 근무자 본인 토큰으로도 읽힌다).
  배치와 무관하면 `affiliation: null`, 신청하는 순간 채워지고(`assignApprovalStatus: 0`), **복귀가 승인되면 다시 `null`** 이 된다 —
  그래서 `returnApprovalStatus: 2` 는 나오지 않는다. 🔴 **거절된 신청은 지워지지 않고 남는다**(`assignApprovalStatus: 2`) — 다음 신청으로 덮일 때까지
- 🔴 `affiliation.affiliationSiteSeq` 는 이름과 달리 **배치돼 가는(간) 사업장**이다. 원 소속은 `DetailUser.siteSeq`(배치 중에도 바뀌지 않는다)
- 웹 `User/W/sign/UserList` 의 `originSiteSeq` 는 **다른 사업장에서 배치돼 온 근무자만** 값이 있다(원 소속 번호). 그 사업장 소속이면 `null`

---

## 3. 흐름별 실측

### 3-1. 순찰 (정상 완료)

| 순서 | 호출 | 넣는 값 | 얻는 값 |
|---|---|---|---|
| 1 | `POST Login/M/Login` | 아이디 · 비밀번호 | 근무자 토큰 |
| 2 | `GET UserPatrol/M/sign/GetAvailablePatrolList` | `siteSeq` | 코스별 상태(대기중 · 순찰중 · 교대중)와 진행 중 회차 번호 |
| 3 | `PUT UserPatrol/M/sign/StartPatrol` | `{ courseSeq, siteSeq }` | **`data` = 회차 번호** |
| 4 | `GET UserPatrol/M/sign/GetMyActivePatrol` | 없음 | 회차 정보 + 지점 줄(`detailSeq` · `pointSeq` · `orderNo` · `authMethod` · `detailStatus`) |
| 5 | `GET Point/M/sign/DetailPoint` (지점마다) | `pointSeq` | 인증값(`qrCode` 또는 `nfcTagId`) · GPS |
| 6 | `POST UserPatrol/M/sign/CertificationPatrol` (지점마다) | `historySeq` · `detailSeq` · `skipYn=false` · `authMethod` · `authValue` · (`gpsLat` · `gpsLng` · `memoInfo.memo`) | `data: true` |

확인된 규칙:

- **근무 시작(`WorkStatusChanged`)은 필수가 아니다** — `workYn: false` 인 채로 순찰이 시작되고 끝난다
- **순서대로만 인증된다** — 다음 차례가 아닌 줄을 보내면 400 `"이전 순찰 지점을 먼저 인증해야 합니다."`
- **인증값은 서버가 검사한다** — 틀린 값 · 다른 지점의 값 · 인증 방식 불일치 모두 400 `"인증 값이 일치하지 않습니다."`. QR 은 지점 상세의 `qrCode` 전체 문자열, NFC 는 `nfcTagId` 를 그대로 보낸다
- 🔴 **GPS 는 검사하지 않는다** — 부산 좌표로도, 좌표 없이도 인증된다. 보낸 좌표는 이력의 `checkGpsLat` · `checkGpsLng` 에 그대로 남는다(안 보내면 `null`)
- **마지막 지점을 인증하면 자동으로 종료된다** — 종료 API를 부르지 않는다. 종료 시각 = 마지막 인증 시각, 회차 상태 `완료`
- 종료된 회차는 `GetMyActivePatrol` 이 `data: null` 이고, `GetStartPatrolInfo?historySeq=` 로는 계속 읽힌다(`patrolStatus: 0`)
- 한 근무자는 **순찰 하나만**(409 `"이미 다른 순찰을 진행 중입니다."`), 한 코스도 **회차 하나만**(409 `"이미 순찰 중인 코스입니다."`)
- 인증 · 종료는 **지금 담당자만** 된다 — 다른 근무자도, 현장관리자도 403(래퍼)

### 3-2. 순찰 변형

| 시나리오 | 방법 | 결과 (실측) |
|---|---|---|
| 미인증(건너뛰기) | `CertificationPatrol` 에 `skipYn=true` — 인증값 없이 `historySeq` · `detailSeq` 만 | 줄 상태 `3`(미완료). `checkDt` · 담당자는 기록되고 `authMethod` 는 `null` |
| 도중 종료 | `PUT UserPatrol/M/sign/EndPatrol?historySeq=` | 남은 줄이 전부 미완료가 되고 회차 `미완료` |
| 특이사항(메모) | 인증할 때 `memoInfo.memo`, 또는 나중에 `PATCH UserPatrol/M/sign/UpsertMemo` | 🔴 **지점 줄 하나에 메모 하나** — 두 번째 새 메모는 400. 고치려면 `memoSeq` 를 함께 보낸다 |
| 시간초과 | 전용 API 없음 — **실제로 기다린다** | 지점의 `courseMin` 을 넘겨 인증하면 그 줄 `overtimeYn: true`(1분 지점을 70초 뒤 인증해 확인) |
| 교대 | 아래 3-3 | |

- 🔴 **회차 단위 `overtimeYn` 은 지점 시간초과를 따라가지 않는다** — 지점 하나가 시간초과였는데 회차는 `false` 였다(회차 109). 코스 `totalMin` 기준으로 따로 판정하는 것으로 보인다(확인하지 못했다)
- **건너뛴 줄의 `checkDt`** 는 건너뛴 시각이다 — "인증 시각이 있으면 인증됐다" 고 읽으면 틀린다. 상태(`3` / `4`)로 판단한다

### 3-3. 교대

| 순서 | 누가 | 호출 | 결과 (실측) |
|---|---|---|---|
| 1 | 순찰 중인 A | `PUT UserPatrol/M/sign/RequestHandOver?historySeq=` | 회차 `patrolStatus: 2`, 코스 `교대중`, `pauseStartDt` 기록 |
| 2a | A | `PUT UserPatrol/M/sign/CancelHandOver?historySeq=&pauseTime=초` | 순찰 중으로 복귀. 넘긴 `pauseTime` 이 회차에 **더해진다** |
| 2b | 다른 근무자 B | `POST UserPatrol/M/sign/AcceptHandOver` `{ historySeq, pauseTime }` | 담당자가 B 로 바뀐다. A 의 `GetMyActivePatrol` 은 `null`, B 는 같은 회차를 받는다 |

확인된 규칙:

- **코스의 `switchYn` 이 켜져 있어야 한다** — 꺼진 코스는 400 `"교대가 허용되지 않은 순찰 코스입니다."`
- 교대 요청 중에는 **인증이 막힌다** — 409 `"교대 요청 중인 순찰입니다. 교대 요청을 취소해야 계속 인증할 수 있습니다."`
- 요청 · 취소는 **담당자 본인만**(남이 하면 404 `"진행 중인 순찰 정보를 찾을 수 없습니다."`), 수락은 **본인이 아닌 사람만**(본인은 400)
- 요청하지 않은 회차를 수락하면 409
- 🔴 **멈춘 시간(`pauseTime`)은 서버가 재지 않고 앱이 보낸 초를 더한다** — 취소 6초 + 수락 5초 → 회차 `pauseTime: 11`. 서버는 `pauseStartDt` 만 갖고 있다가 지운다
- 교대가 있었던 회차는 이력에 `handoverYn: true`. 지점 줄의 `checkUserName` 으로 누가 어느 지점을 인증했는지 구분된다
- 수락 뒤에도 `startUserSeq` · `prevUserSeq` 는 A 그대로다 — **지금 담당자는 코스 목록의 `currentUserSeq`** 로 본다

### 3-4. 배치 · 복귀

| 순서 | 누가 | 호출 | 결과 (실측) |
|---|---|---|---|
| 1 | 근무자 본인(또는 현장관리자가 대신) | `POST User/M/sign/UserAssignment` `{ userSeq, fromSiteSeq, toSiteSeq, reason, startDt, endDt? }` | **받는 사업장**의 배치 신청 목록(`gubun=0`)에 뜬다 |
| 2 | 현장관리자 | `PUT User/M/sign/AssignmentApprove` `{ assignmentSeq, approved }` | 승인 → 근무자가 받는 사업장 소속으로 보인다 / 거절 → 목록에서 사라지고 흔적 없음 |
| 3 | 근무자 | `POST User/M/sign/UserAssignmentReturn` `{ assignmentSeq }` | **원 소속 사업장**의 복귀 신청 목록(`gubun=1`)에 뜬다 |
| 4 | 현장관리자 | `PUT User/M/sign/AssignmentReturnApprove` `{ assignmentSeq, approved }` | 승인 → 원 소속으로 복귀, 배치 이력 `completeYn: true` / 거절 → 배치 유지, 다시 요청할 수 있다 |

확인된 규칙:

- **배치 중인 근무자는 근무자 목록에서 사업장이 옮겨진다** — 원 소속(34) 목록에서 빠지고, 받는 사업장(35) 목록에 `affiliationSiteSeq: 34` · `assignedSiteSeq: 35` · `isAssigned: true` 로 나온다
- 근무자의 `UserSiteSelect` 도 받는 사업장으로 바뀐다
- 배치 이력(`GetAssignmentHistory`)에는 **승인된 배치만** 남는다 — 대기 · 거절은 나오지 않는다
- 신청 중이거나 배치 중이면 다시 신청할 수 없다(400). 같은 사업장으로는 400
- `endDt` 는 없어도 된다(`null`)
- 🔴 **승인자의 사업장을 검사하지 않는다** — 보내는 쪽(34) 관리자가 받는 쪽(35)으로 가는 배치를 승인했고, 받는 쪽(35) 관리자가 원 소속(34)에 뜬 복귀를 승인했다. 근무자 본인의 승인만 403(빈 body)
- 🔴 **배치 중에도 원 소속 사업장의 코스를 순찰할 수 있다** — 사업장 35 에 배치된 근무자가 사업장 34 의 코스를 시작했다(200)
- `UserAssignmentList` 의 `lastCursor` 가 **배치 목록에서는 `userSeq`**(179268), **복귀 목록에서는 `assignmentSeq`**(50)로 왔다 — 커서 기준이 서로 다르다

### 3-5. 사업장 구축

| 대상 | 호출 | 비고 (실측) |
|---|---|---|
| 지점 추가 | `POST Point/M/sign/AddPoint` `{ siteSeq, name, authMethod, useYn, memo?, nfcTagId?, gpsLat?, gpsLng? }` | QR 은 `qrCode` 를 **서버가 만든다**(`STSP1:{사업장}:{지점}:{시각}:{서명}`). 현장관리자만(근무자는 403 빈 body) |
| 지점 수정 | `PATCH Point/M/sign/UpdatePoint` | 보낸 필드만 바뀐다 |
| 코스 추가 | `POST Course/M/sign/AddCourse` `{ siteSeq, courseName, useYn, switchYn, totalMin, points: [{ pointSeq, orderNo, courseMin }] }` | |
| 코스 수정 | `PUT Course/M/sign/UpdateCourse` | **지점 목록 전체를 다시 보낸다**. 기존 지점은 `coursePointSeq` 를 함께, 새 지점은 없이 |
| 근무자 추가 | `POST User/M/sign/AddUser` (multipart) `siteSeq` · `codeSeq` · `loginId` · `loginPw` · `name` · `phone` | 아이디 중복은 400 `"이미 사용 중인 아이디입니다."` |
| 사업장 추가 | 🔴 앱 API 에 없다 — **웹 API** `POST Site/W/sign/AddSite`(본사 토큰) | `{ groupSeq, siteName, address, healthCheckYn, … }` |

확인된 규칙:

- 🔴 **NFC 지점을 태그 값 없이 만들 수 있다**(200) — 이런 지점은 인증할 값이 없어 순찰에서 통과시킬 수 없다(건너뛰기만 가능)
- 🔴 **NFC 태그 값이 겹치면 500**(ProblemDetails) — 유효성 오류가 500 으로 샌다(웹의 B-39 와 같다)
- 🔴 **코스에 들어 있는 지점을 지울 수 있다**(200) — 코스에서 조용히 빠지고 `orderNo` 에 빈 번호가 생긴다(1 · 3). 지난 회차의 `GetCourseHistory.pointCount` 도 3 → 2 로 줄어든다(`GetCourseHistoryList.pointCount` 는 3 그대로)
- 🔴 **순찰 중인 코스를 지울 수 있다**(200) — 진행 중이던 회차는 그대로 종료할 수 있고 이력에 `useYn: false` 로 남는다
- 지운 지점 · 코스를 상세로 조회하면 400 `"잘못된 요청입니다."`
- **본사 토큰으로 웹 API 의 사업장 추가 · 근무자 추가가 된다**(실측) — 구축 작업은 본사 계정 하나로 충분하다

---

## 4. 백엔드에 확인하거나 알릴 것

| # | 내용 | 영향 |
|---|---|---|
| M-1 | 인증 시 GPS 를 검사하지 않는다(멀리 떨어진 좌표 · 좌표 없음 모두 통과) | 의도인지 확인 |
| M-2 | `memoInfo.memo` 를 빈 문자열로 보내면 400 — swagger 는 필수로 표기하지만 실제로는 생략해야 통과 | swagger 표기 정정 요청 |
| M-3 | 로그아웃 뒤에도 accessToken 이 계속 통한다 | 의도인지 확인 |
| M-4 | 배치 · 복귀 승인에서 승인자의 사업장을 검사하지 않는다 | 권한 구멍 |
| M-5 | 배치 중인 근무자가 원 소속 사업장 코스를 순찰할 수 있다 | 의도인지 확인 |
| M-6 | 순찰 중인 코스 삭제, 코스에 속한 지점 삭제가 막히지 않는다. 지점을 지우면 지난 회차의 지점 수가 줄어든다 | 이력이 바뀐다 |
| M-7 | NFC 태그 중복이 500 으로 온다 | 400 + 문구 요청 |
| M-8 | NFC 지점을 태그 없이 만들 수 있다 | 웹의 B-13 과 같다 |
| M-9 | 지점 시간초과가 있어도 회차 `overtimeYn` 은 `false` | 판정 기준 확인 |
| M-10 | 멈춘 시간을 서버가 재지 않고 앱이 보낸 값을 더한다 | 앱이 틀린 값을 보내면 그대로 기록 |
| M-11 | 배치 목록과 복귀 목록의 `lastCursor` 기준이 다르다(`userSeq` / `assignmentSeq`) | 다음 페이지 요청이 어긋날 수 있다 |
| M-12 | 없는 코스로 순찰을 시작하면 `"등록된 순찰 지점이 없습니다."`, 없는 회차 조회는 200 + `data: null` | 문구 · 상태 불일치 |
| M-13 | 메모를 쓴 사람이 아닌 근무자도 메모를 지울 수 있다 | 의도인지 확인 |
| M-14 | 쓰기 응답에 만든 것의 번호가 없다 | 목록을 다시 읽어야 한다 |

---

## 5. 시뮬레이터용 테스트 데이터 (2026-11-18 기준)

실측하면서 만든 것이다. 시뮬레이터가 그대로 쓴다.

### 사업장 34 — WEB 테스트 사업장

| 구분 | 번호 | 이름 | 비고 |
|---|---|---|---|
| 현장 관리자 | `userSeq 179267` | 강영석 | 아이디 `600001` |
| 현장 근무자 | `userSeq 179268` | 근무자1 | 아이디 `600101` |
| 현장 근무자 | `userSeq 179269` | 근무자2 | 아이디 `600102` |
| 현장 근무자 | `userSeq 179270` | 근무자3 | 아이디 `600103` |
| 지점 | `pointSeq 100` | 정문 | QR |
| 지점 | `pointSeq 101` | 후문 | QR |
| 지점 | `pointSeq 102` | 건물 우측 통로 | QR |
| 지점 | `pointSeq 103` | 건물 좌측 통로 | QR |
| 지점 | `pointSeq 104` | B1 주차장 | QR |
| 지점 | `pointSeq 105` | B2 주차장 | QR |
| 지점 | `pointSeq 106` | 시뮬 지점 1 | QR |
| 지점 | `pointSeq 108` | 시뮬 지점 3 (NFC) | NFC `SIM-NFC-0001` |
| 지점 | `pointSeq 109` | 시뮬 지점 4 (NFC) | NFC `SIM-NFC-0002` |
| 지점 | `pointSeq 110` | 시뮬 지점 2 | QR |
| 코스 | `courseSeq 91` | A동 순찰 | 교대 허용 · 총 28분 · 100(7분) → 102(7분) → 101(7분) → 103(7분) |
| 코스 | `courseSeq 92` | 야간 순찰 | 교대 미허용 · 총 0분 · 지점 없음 |
| 코스 | `courseSeq 93` | 시뮬 단축 코스 | 교대 허용 · 총 3분 · 106(1분) → 110(1분) → 108(1분) |
| 코스 | `courseSeq 94` | 시뮬 일반 코스 | 교대 허용 · 총 20분 · 100(5분) → 101(5분) → 106(5분) → 108(5분) |

### 사업장 35 — WEB 테스트 사업장2

| 구분 | 번호 | 이름 | 비고 |
|---|---|---|---|
| 현장 관리자 | `userSeq 179272` | 관리자2 | 아이디 `600002` |
| 현장 근무자 | — | 근무자1 ~ 근무자3 | 아이디 `600201` ~ `600203` — 시뮬레이터로 추가(2026-11-18) |
| 지점 | `pointSeq 111` ~ `113` | 시뮬 지점 1 ~ 3 | QR · NFC · QR — 시뮬레이터로 추가 |
| 코스 | `courseSeq 96` | 시뮬 코스 1 | 교대 허용 · 총 3분 · 113(1분) → 111(1분) → 112(1분) |
| 코스 | `courseSeq 97` | 시뮬 코스 2 | 교대 허용 · 총 2분 · 111(1분) → 113(1분) |

- 아이디 대역: 현장관리자 `600001`~, 근무자 `600101`~. 비밀번호는 저장소에 쓰지 않는다
- 실측으로 생긴 순찰 회차: `108`(정상 완료 · 메모) · `109`(시간초과 · 건너뛰기 · 교대 · 도중 종료) · `110`(삭제한 코스의 회차) · `111`(배치 중 시작 → 바로 종료)
- 실측으로 생긴 배치: `50`(승인 → 복귀 완료) · `51` · `52`(거절)
- 실측 중 지운 것: 지점 `107`(→ `110` 으로 다시 만듦) · 코스 `95` · 근무자 `600199`

---

## 6. 엔드포인트별 실측

> 응답은 실제로 받은 것 중 필드가 가장 많이 채워진 것을 실었다. 배열은 앞 2건만 남겼다. 오류 표의 (A) · (B) · (C) 는 §1-5 의 종류다.

### 6-1. Login

#### `POST Login/M/Login`

모바일 로그인

> 틀린 비밀번호 · 삭제된 계정 → 400 래퍼 `"아이디 또는 비밀번호가 올바르지 않습니다."`(구분되지 않는다). `loginPw` 누락 → 400 ProblemDetails. 응답의 토큰 값은 기록하지 않았다.

- 요청(토큰 없음): `{"loginId": "600101", "loginPw": "<생략>"}`

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "accessToken": "<생략>",
    "refreshToken": "<생략>"
  },
  "code": 202
}
```

#### `POST Login/M/sign/RefreshToken`

모바일 리프레시 토큰

> 성공 `code` 가 `202` 다(근무자 계정). 문구도 `"요청을 정상 처리하였습니다."` 로 다른 API와 다르다.

- 요청(근무자): `{"refreshToken": "<생략>"}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청을 정상 처리하였습니다.",
  "data": {
    "accessToken": "<생략>",
    "refreshToken": "<생략>"
  },
  "code": 202
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| Bearer 헤더 없이 | 401 | (C) 빈 body |
| 틀린 refreshToken | 401 | (A) `"세션이 만료되었거나 유효하지 않습니다."` · `data: null` |
| 로그아웃한 뒤 | 401 | (A) `"세션이 만료되었거나 유효하지 않습니다."` · `data: null` |

#### `POST Login/M/sign/Logout`

모바일 로그아웃

- 요청(근무자): 값 없음
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청을 정상 처리하였습니다.",
  "data": true,
  "code": 200
}
```

#### `GET Login/M/sign/AdminSiteSelect`

관리자 사업장 선택

> 현장 사용자(관리자 · 근무자) 토큰으로는 403 + 빈 body 다. 본사 계정으로는 실측하지 않았다.

| 상황 | HTTP | 응답 |
|---|---|---|
| 현장 사용자(관리자 · 근무자)가 호출 | 403 | (C) 빈 body |

#### `GET Login/M/sign/UserSiteSelect`

현장 사용자 사업장 선택

- 요청(현장관리자): 값 없음
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "siteSeq": 35,
    "siteName": "WEB 테스트 사업장2",
    "children": []
  },
  "code": 200
}
```


### 6-2. User

#### `GET User/M/sign/GetTodayPatrolCount`

금일 순찰 건수 + 근무중 여부 + 총 근무시간

- 요청(근무자): 값 없음
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "workYn": false,
    "patrolCount": 0
  },
  "code": 200
}
```

#### `POST User/M/sign/AddUser`

유저 추가

- 요청(현장관리자, multipart): `{"siteSeq": 34, "codeSeq": 7, "loginId": "600102", "loginPw": "<생략>", "name": "근무자2", "phone": "010****0002"}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 이미 있는 아이디 | 400 | (A) `"이미 사용 중인 아이디입니다."` · `data: false` |

#### `GET User/M/sign/UserList`

사용자 리스트 조회

> 배치 중인 근무자는 **받는 사업장** 목록에 나온다(§3-4).

- 요청(현장관리자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"userSeq": 179271, "codeSeq": 7, "codeName": "현장 근무자", "loginId": "600199", "userName": "삭제용", "phoneNumber": "010****0099", "image": null, "imageName": null, "workYn": false, "affiliationSiteSeq": 34, "affiliationSiteName": "WEB 테스트 사업장", "assignedSiteSeq": null, "assignedSiteName": null, "isAssigned": false},
      {"userSeq": 179270, "codeSeq": 7, "codeName": "현장 근무자", "loginId": "600103", "userName": "근무자3", "phoneNumber": "010****0003", "image": null, "imageName": null, "workYn": false, "affiliationSiteSeq": 34, "affiliationSiteName": "WEB 테스트 사업장", "assignedSiteSeq": null, "assignedSiteName": null, "isAssigned": false},
      "… 외 3건"
    ],
    "lastCursor": 179267,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET User/M/sign/DetailUser`

사용자 상세조회

> `affiliation` 은 배치 중일 때만 채워진다(평소 `null`). 아래는 배치 중 응답.

- 요청(현장관리자): `{"userSeq": 179268}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "userSeq": 179268,
    "codeSeq": 7,
    "codeName": "현장 근무자",
    "siteSeq": 34,
    "siteName": "WEB 테스트 사업장",
    "loginId": "600101",
    "userName": "근무자1",
    "phoneNumber": "010****0001",
    "image": null,
    "imageName": null,
    "workYn": false,
    "affiliation": {"assignmentSeq": 50, "affiliationSiteSeq": 35, "affiliationSiteName": "WEB 테스트 사업장2", "assignmentType": "SUBSTITUTE", "assignApprovalStatus": 1, "reason": "시뮬 배치 요청", "startDt": "2026-11-18T00:00:00", "endDt": "2026-11-25T00:00:00", "returnApprovalStatus": 0}
  },
  "code": 200
}
```

#### `POST User/M/sign/UpdateUser`

사용자 수정

> 🔴 전화번호 필드 이름이 추가(`phone`)와 다르게 `phoneNumber` 다.

- 요청(현장관리자, multipart): `{"userSeq": 179271, "name": "삭제용(수정)", "phoneNumber": "010****0098"}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `GET User/M/sign/MyProfile`

내 프로필 조회

- 요청(근무자): 값 없음
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "userSeq": 179268,
    "codeSeq": 7,
    "codeName": "현장 근무자",
    "loginId": "600101",
    "userName": "근무자1",
    "workYn": false,
    "phone": "010****0001",
    "image": null,
    "imageName": null
  },
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 토큰 없이 호출 | 401 | (A) `"잘못된 요청입니다."` · `data: null` |

#### `PUT User/M/sign/WorkStatusChanged`

근무중 상태변경 토글

- 요청(근무자): `{"workYn": true}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `DELETE User/M/sign/RemoveUser`

유저 삭제

- 요청(현장관리자): `{"userSeq": 179271}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 근무자가 호출 | 403 | (C) 빈 body |

#### `GET User/M/sign/GetGroupTree`

그룹 트리 조회

- 요청(현장관리자): 값 없음
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [
    {"groupSeq": 1, "groupName": "에스텍시스템", "parentGroupSeq": null, "layer": 0, "sites": [{"siteSeq": 1, "siteName": "강남우체국"}], "children": [{"groupSeq": 2, "groupName": "테스트사업장(수정)", "parentGroupSeq": 1, "layer": 1, "sites": [{"siteSeq": 2, "siteName": "테스트사업장"}], "children": [{"groupSeq": 3, "groupName": "강동지사", "parentGroupSeq": 2, "layer": 2, "sites": [{"siteSeq": 3, "siteName": "테테테(수정)1"}, "… 외 3건"], "children": []}]}, {"groupSeq": 4, "groupName": "test", "parentGroupSeq": 1, "layer": 1, "sites": [{"siteSeq": 5, "siteName": "테스트 사업장"}, "… 외 3건"], "children": [{"groupSeq": 12, "groupName": "지사1", "parentGroupSeq": 4, "layer": 2, "sites": [], "children": []}]}, "… 외 2건"]}
  ],
  "code": 200
}
```

#### `POST User/M/sign/UserAssignment`

사업장 배치 등록

- 요청(근무자): `{"userSeq": 179268, "fromSiteSeq": 34, "toSiteSeq": 35, "reason": "시뮬 배치 요청", "startDt": "2026-11-18T00:00:00", "endDt": "2026-11-25T00:00:00"}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 이미 신청 중인 근무자 | 400 | (A) `"이미 대치 신청 중이거나 대치 근무 중인 사용자입니다."` · `data: false` |
| 보내는 곳 = 받는 곳 | 400 | (A) `"원 소속 사업장과 대치 사업장은 같을 수 없습니다."` · `data: false` |

#### `POST User/M/sign/UserAssignmentReturn`

사업장 복귀 등록

- 요청(근무자): `{"assignmentSeq": 50}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 이미 복귀 신청 중 | 400 | (A) `"이미 복귀 승인 대기 중입니다."` · `data: false` |
| 없는 배치 번호 | 404 | (A) `"배치 정보를 찾을 수 없습니다."` · `data: false` |

#### `GET User/M/sign/UserAssignmentList`

사업장 배치 & 복귀 신청 조회 gubun = 0 : 배치 gubun = 1 : 복귀

- 요청(현장관리자): `{"siteSeq": 35, "gubun": 0}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"assignmentSeq": 52, "siteName": "WEB 테스트 사업장", "userSeq": 179269, "userName": "근무자2", "reason": "관리자가 대신 요청", "startDt": "2026-11-18T00:00:00", "endDt": "2026-11-20T00:00:00"}
    ],
    "lastCursor": 179269,
    "hasMore": false
  },
  "code": 200
}
```

#### `PUT User/M/sign/AssignmentApprove`

배치 허락 & 거절

- 요청(현장관리자): `{"assignmentSeq": 50, "approved": true}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 근무자가 호출 | 403 | (C) 빈 body |
| 이미 처리된 신청 | 400 | (A) `"이미 승인 또는 반려 처리된 배치입니다."` · `data: false` |

#### `PUT User/M/sign/AssignmentReturnApprove`

복귀 허락 & 거절

- 요청(현장관리자): `{"assignmentSeq": 50, "approved": false}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `GET User/M/sign/GetAssignmentHistory`

해당 사용자의 배치 이력 조회

- 요청(근무자): `{"userSeq": 179268}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"assignmentSeq": 50, "siteSeq": 35, "siteName": "WEB 테스트 사업장2", "startDt": "2026-11-18T00:00:00", "endDt": "2026-11-25T00:00:00", "completeYn": true, "completeDt": "2026-11-18T13:21:13"}
    ],
    "lastCursor": 50,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET User/M/sign/GetAssignCount`

해당 사업장에 들어온 배치 & 복귀 요청 건 수

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "assignmentCount": 0,
    "returnCount": 0
  },
  "code": 200
}
```

#### `GET User/M/sign/GetTodayEmergencyList`

금일 비상연락망 조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [
    {"userSeq": 179265, "userName": "이동희", "phoneNumber": "010********", "codeSeq": 3, "codeName": "관리자", "workYn": false}
  ],
  "code": 200
}
```

#### `GET User/M/sign/GetNoticeList`

해당 사업장 공지사항 최근 3건 조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [],
  "code": 200
}
```

#### `GET User/M/sign/GetSiteInfo`

사업장 정보 조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "siteSeq": 34,
    "siteName": "WEB 테스트 사업장",
    "tel": null,
    "address": "서울특별시 강남구 개포로 619 8층",
    "healthCheckYn": true,
    "healthCheckInterval": 60,
    "healthCheckTimeout": 3,
    "healthCheckRetry": 1,
    "healthCheckStartTime": "08:00:00",
    "healthCheckEndTime": "17:00:00",
    "parentSiteSeq": null,
    "createDt": "2026-11-17T11:04:34",
    "createUser": "이동희",
    "updateDt": "2026-11-17T11:05:37",
    "updateUser": "이동희",
    "detailList": [{"detailSeq": 18, "exceptionStartTime": "11:00:00", "exceptionEndTime": "12:30:00"}],
    "emergencyList": [
      {"userSeq": 179265, "userName": "이동희", "mon": true, "tue": true, "wed": true, "thu": true, "fri": true, "sat": true, "sun": true}
    ]
  },
  "code": 200
}
```


### 6-3. UserPatrol

#### `GET UserPatrol/M/sign/GetAvailablePatrolList`

해당 사업장에 순찰 가능한 리스트 조회 -> 순찰 가능한 리스트 조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [
    {"courseSeq": 94, "courseName": "시뮬 일반 코스", "switchYn": true, "totalMin": 20, "pointCount": 4, "courseStatusCode": 0, "courseStatusName": "대기중", "activeHistorySeq": null, "currentUserSeq": null, "currentUserName": null, "activeStartDt": null, "pauseStartDt": null, "lastHistorySeq": null, "lastEndDt": null, "lastUserSeq": null, "lastUserName": null},
    {"courseSeq": 93, "courseName": "시뮬 단축 코스", "switchYn": true, "totalMin": 3, "pointCount": 3, "courseStatusCode": 2, "courseStatusName": "교대중", "activeHistorySeq": 109, "currentUserSeq": 179269, "currentUserName": "근무자2", "activeStartDt": "2026-11-18T13:16:23", "pauseStartDt": "2026-11-18T13:17:51", "lastHistorySeq": 108, "lastEndDt": "2026-11-18T13:16:03", "lastUserSeq": 179268, "lastUserName": "근무자1"},
    "… 외 2건"
  ],
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 필수 `siteSeq` 누락 | 400 | (B) `{"siteSeq": ["The siteSeq field is required."]}` |
| `siteSeq=abc` | 400 | (B) `{"siteSeq": ["The value 'abc' is not valid."]}` |

#### `PUT UserPatrol/M/sign/StartPatrol`

순찰 시작

> `data` 가 회차 번호다.

- 요청(근무자): `{"courseSeq": 93, "siteSeq": 34}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": 108,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 다른 근무자가 순찰 중인 코스 | 409 | (A) `"이미 순찰 중인 코스입니다."` · `data: null` |
| 이미 순찰 중인 근무자가 다른 코스 시작 | 409 | (A) `"이미 다른 순찰을 진행 중입니다."` · `data: null` |
| 지점이 0개인 코스 | 400 | (A) `"등록된 순찰 지점이 없습니다."` · `data: null` |
| 없는 코스 번호 | 400 | (A) `"등록된 순찰 지점이 없습니다."` · `data: null` |
| 자기 소속이 아닌 사업장 번호 | 403 | (A) `"잘못된 요청입니다."` · `data: null` |

#### `GET UserPatrol/M/sign/GetMyActivePatrol`

내가 현재 진행중인 순찰 조회 - 응답은 GetStartPatrolInfo와 동일 (없으면 data = null)

> 진행 중인 순찰이 없으면 `data: null`.

- 요청(근무자): 값 없음
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "historySeq": 109,
    "startDt": "2026-11-18T13:16:23",
    "endDt": null,
    "pauseStartDt": "2026-11-18T13:17:51",
    "pauseTime": 0,
    "courseName": "시뮬 단축 코스",
    "courseMemo": "시뮬레이터용 — 지점당 1분",
    "totalMin": 3,
    "startUserSeq": 179269,
    "startUserName": "근무자2",
    "switchYn": true,
    "patrolStatus": 2,
    "prevUserSeq": 179269,
    "prevUserName": "근무자2",
    "details": [
      {"detailSeq": 369, "coursePointSeq": 150, "pointSeq": 106, "pointName": "시뮬 지점 1", "pointMemo": null, "authMethod": 9, "courseMin": 1, "orderNo": 1, "detailStatus": 4, "checkUserSeq": 179269, "checkUserName": "근무자2", "overtimeYn": true, "checkDt": "2026-11-18T13:17:33", "memoList": [{"memoSeq": 63, "memo": "수정한 메모", "attachList": []}]},
      {"detailSeq": 370, "coursePointSeq": 151, "pointSeq": 107, "pointName": "시뮬 지점 2", "pointMemo": null, "authMethod": 9, "courseMin": 1, "orderNo": 2, "detailStatus": 3, "checkUserSeq": 179269, "checkUserName": "근무자2", "overtimeYn": false, "checkDt": "2026-11-18T13:17:33", "memoList": []},
      "… 외 1건"
    ]
  },
  "code": 200
}
```

#### `GET UserPatrol/M/sign/GetStartPatrolInfo`

진행중인 순찰정보 상세조회

> 끝난 회차도 읽힌다. 없는 번호는 200 + `data: null`.

- 요청(근무자): `{"historySeq": 106}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "historySeq": 106,
    "startDt": "2026-11-17T14:08:43",
    "endDt": "2026-11-17T14:09:18",
    "pauseStartDt": null,
    "pauseTime": 0,
    "courseName": "A동 순찰",
    "courseMemo": null,
    "totalMin": 28,
    "startUserSeq": 179267,
    "startUserName": "강영석",
    "switchYn": false,
    "patrolStatus": 0,
    "prevUserSeq": 179267,
    "prevUserName": "강영석",
    "details": [
      {"detailSeq": 358, "coursePointSeq": 146, "pointSeq": 100, "pointName": "정문", "pointMemo": null, "authMethod": 9, "courseMin": 7, "orderNo": 1, "detailStatus": 4, "checkUserSeq": 179267, "checkUserName": "강영석", "overtimeYn": false, "checkDt": "2026-11-17T14:09:01", "memoList": []},
      {"detailSeq": 359, "coursePointSeq": 147, "pointSeq": 102, "pointName": "건물 우측 통로", "pointMemo": null, "authMethod": 9, "courseMin": 7, "orderNo": 2, "detailStatus": 4, "checkUserSeq": 179267, "checkUserName": "강영석", "overtimeYn": false, "checkDt": "2026-11-17T14:09:09", "memoList": []},
      "… 외 2건"
    ]
  },
  "code": 200
}
```

#### `POST UserPatrol/M/sign/CertificationPatrol`

순찰 인증

> multipart. 건너뛰기는 `skipYn=true` 에 `historySeq` · `detailSeq` 만. 다른 지점의 인증값 · 틀린 인증값 → 400 `"인증 값이 일치하지 않습니다."`, 담당자가 아닌 근무자 → 403 `"현재 순찰 담당자만 인증할 수 있습니다."`. 사진 첨부(`memoInfo.attachInfo.image`)는 실측하지 않았다.

- 요청(근무자, multipart): `{"historySeq": 108, "detailSeq": 366, "skipYn": "false", "authMethod": 9, "authValue": "STSP1:34:106:1794975293:<서명>", "gpsLat": 37.4936, "gpsLng": 127.0781}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| `memoInfo.memo=""`(빈 문자열) | 400 | (B) `{"memoInfo.memo": ["The memo field is required."]}` |
| 차례가 아닌 지점 | 400 | (A) `"이전 순찰 지점을 먼저 인증해야 합니다."` · `data: false` |
| 틀린 인증값 · 다른 지점의 인증값 | 400 | (A) `"인증 값이 일치하지 않습니다."` · `data: false` |
| 인증 방식 불일치(QR 지점에 NFC) | 400 | (A) `"인증 값이 일치하지 않습니다."` · `data: false` |
| 담당자가 아닌 근무자 | 403 | (A) `"현재 순찰 담당자만 인증할 수 있습니다."` · `data: false` |
| 이미 인증한 지점 | 400 | (A) `"이미 처리된 순찰 지점입니다."` · `data: false` |
| 교대 요청 중에 인증 | 409 | (A) `"교대 요청 중인 순찰입니다. 교대 요청을 취소해야 계속 인증할 수 있습니다."` · `data: false` |
| 교대로 넘겨준 이전 담당자가 인증 | 403 | (A) `"현재 순찰 담당자만 인증할 수 있습니다."` · `data: false` |

#### `PUT UserPatrol/M/sign/EndPatrol`

순찰 종료 (중도 종료) - 남은 지점을 미완료 처리하고 순찰을 미완료로 닫음

- 요청(근무자): `{"historySeq": 109}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 이미 끝난 회차 | 409 | (A) `"이미 종료된 순찰입니다."` · `data: false` |
| 교대로 넘겨준 이전 담당자 | 403 | (A) `"현재 순찰 담당자만 종료할 수 있습니다."` · `data: false` |
| 현장관리자가 근무자의 순찰을 종료 | 403 | (A) `"현재 순찰 담당자만 종료할 수 있습니다."` · `data: false` |

#### `PATCH UserPatrol/M/sign/UpsertMemo`

메모 Upsert

- 요청(근무자, multipart): `{"detailSeq": 369, "memo": "나중에 붙인 메모"}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 메모가 이미 있는 줄에 `memoSeq` 없이 새 메모 | 400 | (A) `"잘못된 요청입니다."` · `data: false` |

#### `DELETE UserPatrol/M/sign/DeleteMemo`

메모 삭제

> 쓴 사람이 아닌 근무자도 지울 수 있었다(M-13).

- 요청(근무자): `{"memoSeq": 65}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 없는 메모 번호 | 400 | (A) `"잘못된 요청입니다."` · `data: false` |

#### `PUT UserPatrol/M/sign/RequestHandOver`

교대 요청 상태 등록 (코스를 교대중으로 변경)

- 요청(근무자): `{"historySeq": 109}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 담당자가 아닌 근무자 | 404 | (A) `"진행 중인 순찰 정보를 찾을 수 없습니다."` · `data: false` |
| 이미 교대 요청 중 | 409 | (A) `"이미 교대 가능한 상태입니다."` · `data: false` |
| 교대 허용이 꺼진 코스 | 400 | (A) `"교대가 허용되지 않은 순찰 코스입니다."` · `data: false` |

#### `PUT UserPatrol/M/sign/CancelHandOver`

교대 요청 취소 (요청자 본인만, 코스를 순찰중으로 복귀) - pauseTime: 멈춰있던 시간(초)

- 요청(근무자): `{"historySeq": 109, "pauseTime": 6}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 담당자가 아닌 근무자 | 404 | (A) `"진행 중인 순찰 정보를 찾을 수 없습니다."` · `data: false` |

#### `POST UserPatrol/M/sign/AcceptHandOver`

교대 수락

- 요청(근무자): `{"historySeq": 109, "pauseTime": 5}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 교대 요청이 없는 회차 | 409 | (A) `"이미 다른 사용자가 이어받았거나 교대 중인 코스가 아닙니다."` · `data: false` |
| 요청한 본인이 수락 | 400 | (A) `"현재 순찰자는 해당 순찰을 이어받을 수 없습니다."` · `data: false` |


### 6-4. Point

#### `POST Point/M/sign/AddPoint`

지점 등록

- 요청(현장관리자): `{"siteSeq": 34, "name": "시뮬 지점 1", "memo": null, "authMethod": 9, "gpsLat": 37.4936, "gpsLng": 127.0781, "useYn": true}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 근무자가 호출 | 403 | (C) 빈 body |

#### `GET Point/M/sign/GetPointList`

지점 리스트 조회

- 요청(현장관리자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"pointSeq": 110, "pointName": "시뮬 지점 2", "memo": null, "authMethod": 9, "authMethodName": "QR", "usedCount": 1, "useYn": true, "nfcTagId": null},
      {"pointSeq": 109, "pointName": "시뮬 지점 4 (NFC)", "memo": "태그 나중에 등록", "authMethod": 10, "authMethodName": "NFC", "usedCount": 0, "useYn": true, "nfcTagId": "SIM-NFC-0002"},
      "… 외 8건"
    ],
    "lastCursor": 100,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET Point/M/sign/DetailPoint`

지점 상세 조회

> `qrCode` 서명 부분은 가렸다. NFC 지점은 `qrCode: null`.

- 요청(현장관리자): `{"pointSeq": 106}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "pointSeq": 106,
    "name": "시뮬 지점 1",
    "memo": null,
    "authMethod": 9,
    "authMethodName": "QR",
    "qrCode": "STSP1:34:106:1794975293:<서명>",
    "nfcTagId": null,
    "gpsLat": 37.4936,
    "gpsLng": 127.0781,
    "useYn": true,
    "lastPatrolDt": "2026-11-18T13:17:33",
    "lastPatrolUserSeq": 179269,
    "lastPatrolUserName": "근무자2",
    "courseList": [{"courseSeq": 93, "courseName": "시뮬 단축 코스"}, {"courseSeq": 94, "courseName": "시뮬 일반 코스"}]
  },
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 없는 지점 번호 | 400 | (A) `"잘못된 요청입니다."` · `data: null` |
| 삭제한 지점 | 400 | (A) `"잘못된 요청입니다."` · `data: null` |

#### `PATCH Point/M/sign/UpdatePoint`

지점 수정

- 요청(현장관리자): `{"pointSeq": 109, "name": "시뮬 지점 4 (NFC)", "memo": "태그 나중에 등록", "reissueQrYn": false, "clearNfcTagYn": false}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 다른 지점이 쓰는 NFC 태그 값 | 500 | (B) `서버에서 요청을 처리하지 못하였습니다. 잠시후 다시 시도해주세요.` |

#### `DELETE Point/M/sign/DeletePoint`

지점 삭제

- 요청(현장관리자): `{"pointSeq": 107}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```


### 6-5. Course

#### `POST Course/M/sign/AddCourse`

코스 추가

- 요청(현장관리자): `{"siteSeq": 34, "courseName": "시뮬 단축 코스", "memo": "시뮬레이터용 — 지점당 1분", "useYn": true, "switchYn": true, "totalMin": 3, "points": [{"pointSeq": 106, "orderNo": 1, "courseMin": 1}, {"pointSeq": 107, "orderNo": 2, "courseMin": 1}, {"pointSeq": 108, "orderNo": 3, "courseMin": 1}]}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `PUT Course/M/sign/UpdateCourse`

코스 수정

- 요청(현장관리자): `{"siteSeq": 34, "courseSeq": 91, "courseName": "A동 순찰", "memo": null, "useYn": true, "switchYn": true, "totalMin": 28, "points": [{"pointSeq": 100, "coursePointSeq": 146, "orderNo": 1, "courseMin": 7}, {"pointSeq": 102, "coursePointSeq": 147, "orderNo": 2, "courseMin": 7}, {"pointSeq": 101, "coursePointSeq": 148, "orderNo": 3, "courseMin": 7}, {"pointSeq": 103, "coursePointSeq": 149, "orderNo": 4, "courseMin": 7}]}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `GET Course/M/sign/GetClassificationPoint`

코스 추가시 지점 조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [
    {"pointSeq": 100, "pointName": "정문", "memo": null, "authMethod": 9, "authMethodName": "QR"},
    {"pointSeq": 101, "pointName": "후문", "memo": null, "authMethod": 9, "authMethodName": "QR"},
    "… 외 4건"
  ],
  "code": 200
}
```

#### `GET Course/M/sign/GetCourseList`

코스 전체조회

- 요청(현장관리자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"courseSeq": 95, "courseName": "시뮬 삭제용 코스", "useYn": true, "switchYn": false, "totalMin": 2, "courseStatusCode": 0, "courseStatusName": "대기중", "pointCount": 2, "history": null},
      {"courseSeq": 94, "courseName": "시뮬 일반 코스", "useYn": true, "switchYn": true, "totalMin": 20, "courseStatusCode": 0, "courseStatusName": "대기중", "pointCount": 4, "history": null},
      "… 외 3건"
    ],
    "lastCursor": 91,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET Course/M/sign/GetCourseDetail`

코스 상세조회

- 요청(근무자): `{"courseSeq": 91}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "courseSeq": 91,
    "courseName": "A동 순찰",
    "memo": null,
    "totalMin": 28,
    "switchYn": false,
    "useYn": true,
    "historySeq": 106,
    "historyUserSeq": 179267,
    "historyUserName": "강영석",
    "historyEndDt": "2026-11-17T14:09:18",
    "points": [
      {"coursePointSeq": 146, "pointSeq": 100, "pointName": "정문", "authMethod": 9, "orderNo": 1, "useYn": true, "courseMin": 7, "gpsLat": 37.4935781, "gpsLng": 127.0780402},
      {"coursePointSeq": 147, "pointSeq": 102, "pointName": "건물 우측 통로", "authMethod": 9, "orderNo": 2, "useYn": true, "courseMin": 7, "gpsLat": 37.4935765, "gpsLng": 127.0780408},
      "… 외 2건"
    ]
  },
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 삭제한 코스 | 400 | (A) `"잘못된 요청입니다."` · `data: null` |

#### `GET Course/M/sign/GetCourseHistoryList`

코스 이력 리스트 조회

- 요청(현장관리자): `{"courseSeq": 93}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"historySeq": 109, "status": 2, "statusName": "미완료", "overtimeYn": false, "startDt": "2026-11-18T13:16:23", "endDt": "2026-11-18T13:18:04", "patrolMinute": 1, "currentUserSeq": 179270, "currentUserName": "근무자3", "pointCount": 3, "memoCount": 1},
      {"historySeq": 108, "status": 1, "statusName": "완료", "overtimeYn": false, "startDt": "2026-11-18T13:15:25", "endDt": "2026-11-18T13:16:03", "patrolMinute": 0, "currentUserSeq": 179268, "currentUserName": "근무자1", "pointCount": 3, "memoCount": 1}
    ],
    "lastCursor": 108,
    "hasMore": false
  },
  "code": 200
}
```

#### `POST Course/M/sign/GetPointInfo`

지점 직접 등록시 인증 값에 해당하는 지점 값 조회

> 인증값으로 지점을 찾는다. 없으면 200 + `data: null`.

- 요청(근무자): `{"siteSeq": 34, "authMethod": 9, "authValue": "STSP1:34:106:1794975293:<서명>"}`
- 200 을 받은 호출자: 근무자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "pointSeq": 106,
    "pointName": "시뮬 지점 1",
    "memo": null,
    "authMethod": 9,
    "qrCode": "STSP1:34:106:1794975293:<서명>",
    "nfcTagId": null,
    "gpsLat": 37.4936,
    "gpsLng": 127.0781,
    "useYn": true
  },
  "code": 200
}
```

#### `DELETE Course/M/sign/DeleteCourse`

코스 삭제

> 🔴 쿼리 이름이 `courseId` 다(`courseSeq` 아님).

- 요청(현장관리자): `{"courseId": 95}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```


### 6-6. History

#### `GET History/M/sign/GetCourseHistory`

코스별 이력조회

- 요청(현장관리자): `{"siteSeq": 34, "courseSeq": 93, "fromDt": "2026-11-18", "toDt": "2026-11-18"}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"historySeq": 109, "courseSeq": 93, "courseName": "시뮬 단축 코스", "useYn": true, "startDt": "2026-11-18T13:16:23", "endDt": "2026-11-18T13:18:04", "status": 2, "statusName": "미완료", "overtimeYn": false, "pointCount": 2, "checkedCount": 1, "pauseTime": "00:00:11", "actualElapsedTime": "00:01:30", "hasMemo": true, "userList": [{"userSeq": 179269, "userName": "근무자2"}]},
      {"historySeq": 108, "courseSeq": 93, "courseName": "시뮬 단축 코스", "useYn": true, "startDt": "2026-11-18T13:15:25", "endDt": "2026-11-18T13:16:03", "status": 1, "statusName": "완료", "overtimeYn": false, "pointCount": 2, "checkedCount": 2, "pauseTime": "00:00:00", "actualElapsedTime": "00:00:38", "hasMemo": true, "userList": [{"userSeq": 179268, "userName": "근무자1"}]}
    ],
    "lastCursor": 108,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET History/M/sign/GetCourseHistoryDetail`

코스 이력 상세조회

- 요청(근무자): `{"historySeq": 106}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "historySeq": 106,
    "courseSeq": 91,
    "courseName": "A동 순찰",
    "createDt": "2026-11-17T14:08:43",
    "startDt": "2026-11-17T14:08:43",
    "endDt": "2026-11-17T14:09:18",
    "status": 1,
    "statusName": "완료",
    "overtimeYn": false,
    "completedPointCount": 4,
    "totalPointCount": 4,
    "pauseTime": "00:00:00",
    "actualElapsedTime": "00:00:35",
    "handoverYn": false,
    "totalMin": 28,
    "detailList": [
      {"detailSeq": 358, "pointSeq": 100, "pointName": "정문", "orderNo": 1, "checkDt": "2026-11-17T14:09:01", "overTimeYn": false, "pauseTime": "00:00:00", "status": 4, "statusName": "완료", "checkUserSeq": 179267, "checkUserName": "강영석", "authMethod": 9, "authMethodName": "QR", "checkGpsLat": 37.4935778, "checkGpsLng": 127.0780377, "pointGpsLat": 37.4935781, "pointGpsLng": 127.0780402, "memoList": []},
      {"detailSeq": 359, "pointSeq": 102, "pointName": "건물 우측 통로", "orderNo": 2, "checkDt": "2026-11-17T14:09:09", "overTimeYn": false, "pauseTime": "00:00:00", "status": 4, "statusName": "완료", "checkUserSeq": 179267, "checkUserName": "강영석", "authMethod": 9, "authMethodName": "QR", "checkGpsLat": 37.4935816, "checkGpsLng": 127.078053, "pointGpsLat": 37.4935765, "pointGpsLng": 127.0780408, "memoList": []},
      "… 외 2건"
    ]
  },
  "code": 200
}
```

#### `PATCH History/M/sign/UpsertCourseHistory`

이력 수정

- 요청(현장관리자, multipart): `{"historySeq": 109, "detailSeq": 369, "memo.memoSeq": 63, "memo.memo": "이력에서 고친 메모"}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

#### `GET History/M/sign/GetPointAssignHistory`

지점인증 이력조회

- 요청(근무자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "items": [
      {"detailSeq": 365, "courseSeq": 91, "pointSeq": 103, "pointName": "건물 좌측 통로", "checkDt": null, "userSeq": null, "userName": null, "authMethod": null, "authMethodName": "", "status": 3, "statusName": "미완료", "overTimeYn": false, "hasMemo": false, "pauseTime": "00:00:00"},
      {"detailSeq": 364, "courseSeq": 91, "pointSeq": 101, "pointName": "후문", "checkDt": "2026-11-17T14:16:55", "userSeq": 179268, "userName": "근무자1", "authMethod": null, "authMethodName": "", "status": 3, "statusName": "미완료", "overTimeYn": false, "hasMemo": false, "pauseTime": "00:00:00"},
      "… 외 6건"
    ],
    "lastCursor": 358,
    "hasMore": false
  },
  "code": 200
}
```

#### `GET History/M/sign/GetPointAssignHistoryDetail`

지점인증 상세조회

- 요청(현장관리자): `{"detailSeq": 366}`
- 200 을 받은 호출자: 근무자 · 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": {
    "detailSeq": 366,
    "pointSeq": 106,
    "pointName": "시뮬 지점 1",
    "overtimeYn": false,
    "hasMemo": true,
    "status": 4,
    "statusName": "완료",
    "courseSeq": 93,
    "courseName": "시뮬 단축 코스",
    "userSeq": 179268,
    "userName": "근무자1",
    "pauseTime": "00:00:00",
    "checkDt": "2026-11-18T13:15:39",
    "authMethod": 9,
    "authMethodName": "QR",
    "memoList": [{"memoSeq": 65, "memo": "이력에서 붙인 메모", "attachList": []}]
  },
  "code": 200
}
```

#### `PATCH History/M/sign/UpsertPointHistory`

지점 이력 수정

> **끝난 회차의 완료된 지점만** 고칠 수 있다.

- 요청(현장관리자, multipart): `{"detailSeq": 366, "memo.memo": "이력에서 붙인 메모"}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": true,
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 건너뛴(미완료) 지점 줄 | 404 | (A) `"요청한 지점 이력이 존재하지 않습니다."` · `data: false` |
| 도중 종료로 미완료가 된 지점 줄 | 400 | (A) `"종료된 이력의 완료된 지점만 수정할 수 있습니다."` · `data: false` |


### 6-7. Healthcheck

#### `POST Healthcheck/M/sign/Respond`

생체확인 확인 응답

> ⚠️ **미측정** (§7)

#### `POST Healthcheck/M/sign/TriggerTest`

생체확인 즉시 발사 (테스트용) - 정규 슬롯을 기다리지 않고 지금 한 번 보낸다

> ⚠️ **미측정** (§7)

#### `GET Healthcheck/M/sign/GetFailedUserList`

생체확인 미응답자 명단 조회 - slotDt 를 주면 그 슬롯, 없으면 가장 최근 마감 슬롯

> 현장관리자만(근무자는 403 빈 body).

- 요청(현장관리자): `{"siteSeq": 34}`
- 200 을 받은 호출자: 현장관리자

```json
{
  "message": "요청이 정상 처리되었습니다.",
  "data": [],
  "code": 200
}
```

| 상황 | HTTP | 응답 |
|---|---|---|
| 현장 사용자(관리자 · 근무자)가 호출 | 403 | (C) 빈 body |
| 근무자가 호출 | 403 | (C) 빈 body |

---

## 7. 미측정

### 실측 범위 안에서 남은 것

| 대상 | 사유 |
|---|---|
| `POST Healthcheck/M/sign/TriggerTest` · `POST Healthcheck/M/sign/Respond` | 사업장 34 비상연락망에 실제 관리자가 등록돼 있어, 응답이 없으면 그 사람에게 알림 · 전화가 갈 수 있다. 백엔드에 동작을 확인한 뒤 실측한다 |
| 사진 첨부(`CertificationPatrol` · `UpsertMemo` · 이력 메모 · 근무자 사진) | 글자만 보냈다. `attachList` 는 빈 배열만 봤다 |
| `Login/M/sign/AdminSiteSelect` 성공 응답 | 본사 계정으로 앱 서버에 로그인해 보지 않았다 |
| 목록의 기본 `pageSize` | 데이터가 적어 한 번에 다 왔다 |
| `detailStatus: 2` | 나오지 않았다 |

### 범위 밖 (필요해질 때 실측)

| 엔드포인트 | 설명 |
|---|---|
| `GET Emergency/M/sign/GetEmergency` | 비상연락망 조회 |
| `GET Geocode/M/sign/ReverseGeocode` | 좌표 → 주소 변환 |
| `POST Keyword/M/sign/AddKeyword` | 키워드 추가 |
| `GET Keyword/M/sign/GetKeyword` | 사업장 키워드 조회 |
| `PUT Keyword/M/sign/UpdateKeyword` | 키워드 수정 |
| `DELETE Keyword/M/sign/DeleteKeyword` | 키워드 삭제 |
| `POST Notice/M/sign/AddNotice` | 공지사항 추가 |
| `GET Notice/M/sign/GetNoticeList` | 공지사항 조회 |
| `GET Notice/M/sign/DetailNotice` | 공지사항 상세조회 |
| `PATCH Notice/M/sign/UpsertNotice` | 공지사항 수정 |
| `DELETE Notice/M/sign/DeleteNotice` | 공지사항 삭제 |
| `GET Notify/M/sign/GetUnReadList` | 안읽은 알림 리스트 조회 |
| `PUT Notify/M/sign/SetUnRead` | 안읽은 알림 읽음 처리 |
| `GET Notify/M/sign/GetAllNotifyList` | 모든 알림 리스트 조회 |
| `GET Tts/M/sign/DownloadTtsVoice` | Download TTS voice file |
