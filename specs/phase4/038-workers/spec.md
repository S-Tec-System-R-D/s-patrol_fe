# 038-workers spec

> 위험도: **B** (`screens.md` §1-4 근무자 행의 B 를 그대로 따른다)
> 관련 화면: 근무자 목록 `/users` + 근무자 상세 `/users/:userSeq`(신규 라우트)
> Phase: `roadmap.md` Phase 4 — 번호는 **맨 뒤(038)** 를 쓴다(027 선례. 예약된 번호가 없다)
> 목업: `docs/ui-mock/현장/근무자/근무자-신규.png`(테이블 + 우측 패널) — 🔴 **구조는 따르지 않는다**
> (아래 사용자 결정 ②). 컬럼·뱃지 어휘만 참고한다.

> **WF-1-0 — 해당 없음.** 이 spec 은 **조회계만 서버 타입으로 옮긴다**(026 과 같은 범위).
> 추가·수정·삭제·비밀번호(`AddUser`·`UpdateUser`·`RemoveUser`)는 **모달 UI 와 mock 동작을 그대로
> 둔다** — 전부 `multipart/form-data`(사진 첨부)이고, 아래 403 때문에 **현장관리자 권한으로 실측할
> 수조차 없다.** 변경계 전환 spec 에서 WF-1-0 을 수행한다.

---

## 🔴 전제 — 현장관리자는 근무자 API 가 403 이다

재실측 2026-10-21(GET 만):

| 계정 | `UserList` | `UserDetail` |
|---|:-:|:-:|
| 현장관리자 `333333` | **403**(빈 body) | **403** |
| 시스템관리자 `000000` | 200 | 200 |

`/users` 의 **주 사용자는 현장관리자**다. 그래서 서버로 붙이는 순간 실서버에서는 현장관리자에게
**조회 실패 화면**이 뜬다. 🔴 **사용자 결정(2026-10-21): 서버 타입·MSW 위에서 진행하고, 권한
개방을 백엔드에 요청한다**(→ `api-spec.md` B-41 신설). 열리면 **코드 변경 없이** 동작한다.
⚠️ 그 전까지 실서버 화면 확인은 **본사 계정**으로 한다(Admin 3종은 현장 사이트 진입 가능).

---

## 0. Carry-over

### 직전 spec(`026-notice`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ① 공지 변경계 전환 | **범위 외** — 공지 전용. 026 이월 그대로 |
| ② 026 T592 실서버 화면 확인 | **범위 외** — 사용자 확인 항목. 026 이월 그대로 |
| ③ B-40 첨부 404 | 🔴 **본 spec 에 걸릴 수 있다** — `UserDetail.imagePath` 도 `/UploadedFiles/users/...` 다. 단, 본 spec 은 **사진을 쓰지 않는다**(아래 §3) |
| ④ 본문 폭 상한 · 수정 버튼 위치 | **범위 외** — 공지 상세 전용 |
| 026 이 세운 자산 | 🔴 **재사용**: `AppTable` 열 `meta.className`(아이콘·아바타 열 폭) · 목록 골격(검색 → 필터 → spacer → 생성 버튼) · 상세 분기 4종 |

### 리디자인(`013-workers`) · `030` 이 남긴 것

- `screens.md` §1-4 "마스터-디테일" — 🔴 **본 spec 이 뒤집는다**(목록 + 상세 페이지).
- `030` **OQ-030-A** — `/users` 는 우측 400px 패널 때문에 좁은 폭 카드에서 **제외**됐다.
  패널이 사라지므로 **본 spec 에서 카드 모드를 붙여 종결**한다.

---

## User Stories

- **US1.** 현장관리자가 `/users` 에서 사업장 사람을 **테이블**로 보고, 검색·권한·근무 상태로 좁히고,
  페이지를 넘긴다. 필터·페이지는 URL 에 남는다.
- **US2.** 현장관리자가 행을 눌러 `/users/:userSeq` 에서 근무자 1명의 기본정보를 **다른 상세와 같은
  머리**로 본다.
- **US3.** 현장관리자가 목록에서 근무자를 추가하고, 상세에서 수정·비밀번호 변경·삭제한다 — **UI 와
  흐름만** 유지하고 저장은 mock 이다.

---

## 1. 목적

근무자는 리디자인(013) 때 **테이블 + 우측 400px 패널**로 만들어졌고, 그 뒤 지점(027)·코스(023)·
순찰이력(036·037)·공지(026)가 **목록 페이지 + 상세 페이지**로 자리 잡으면서 이 화면만 구조가 다르다.
본 spec 은 같은 골격으로 맞추고, mock 타입 위의 화면을 **서버 응답 타입 위로** 옮긴다(403 이 풀리면
그대로 동작하도록 — 026 과 같은 판단: mock 타입 위에 다시 만들면 전환 때 한 번 더 뜯는다).

---

## 2. I/O

### 2-1. 목록 `/users`

**요청** — `GET /api/v1/User/W/sign/UserList`

| 서버 파라미터 | URL 키 | 출처 |
|---|---|---|
| `siteId` ⚠️(`siteSeq` 아님, B-12) | — (URL 에 두지 않는다) | `getSiteSeq()` |
| `searchKey` | `q` | 검색창(디바운스). ⚠️ 대상 미실측(OQ-038-A) |
| `codeSeq` | `role` | 권한 필터 — `6` 현장 관리자 / `7` 현장 근무자 |
| `workYn` | `work` | 근무 상태 필터 — `true`/`false` |
| `originSiteSeq` | — | 쓰지 않는다(필터 수요 없음) |
| `pageNumber` | `page` | `AppPagination` (1-based) |
| `pageSize` | — (로컬 state) | 20 / 50 / 100 |

**응답** — `ApiListResponse<UserRow>` (`api-spec.md` §8, 실측 전량 선언)

```ts
interface UserRow {
  userSeq: number
  userName: string
  loginId: string
  codeSeq: number          // 6 현장 관리자 / 7 현장 근무자 (실측)
  codeName: string
  originSiteSeq: number | null
  originSiteName: string | null   // ⚠ OQ-7
  workYn: boolean
  createDt: string
}
```

**화면**
- 헤더(제목 + 부제) → 필터 줄(검색 → `role="group"` 권한·근무 상태·초기화 → spacer → **근무자 추가**) →
  `AppTable` → `AppPagination`. 026 목록과 같은 배치.
- 컬럼(초안): **이름**(아바타 이니셜) · **사번**(`loginId`) · **권한**(`codeName` 뱃지) · **근무 상태**
  (`workYn` → 근무 중 / 근무 종료) · **원소속**(아래 OQ-038-B) · **등록일**(`createDt` → `yyyy-MM-dd`) · 꺾쇠.
- `xl` 미만 `renderCard`(`WorkerCard` 신설) — **OQ-030-A 종결**.
- 상태 분기 4종: 조회 실패(다시 시도) / 로딩 / 0건(필터 유무로 문구 구분) / 목록.
  🔴 **403 은 "조회 실패" 로 보인다** — 문구를 "근무자를 불러오지 못했습니다" 로 두고 권한을 단정하지 않는다.
- 부제 `{사업장명} 소속 {totalCount}명` — 서버 `totalCount` 기준(필터가 걸리면 걸린 수).
- 행 클릭 → `/users/:userSeq`.

### 2-2. 상세 `/users/:userSeq`

**요청** — `GET /api/v1/User/W/sign/UserDetail?userId=` ⚠️(`userSeq` 아님, B-12)

**응답** — `ApiDetailResponse<UserDetail>` (`api-spec.md` §9)

```ts
interface UserDetail {
  userSeq: number
  loginId: string
  userName: string
  phone: string            // 하이픈 없음 → 표시 시 010-0000-0000
  siteSeq: number
  siteName: string
  workYn: boolean
  deviceType: string       // '0' — 의미 불명(OQ-6)
  fcmToken: boolean        // 토큰 값이 아니라 보유 여부
  voipToken: boolean
  imagePath: string | null
  imageName: string | null
  imageExt: string | null
}
```

**화면** — 026 공지 상세와 같은 머리
- 브레드크럼 `근무자 > 근무자 상세`.
- 머리 줄: 아바타 + 이름 + 근무 상태 뱃지 + 액션(**비밀번호** · **수정** · **삭제**). ⚠️ **부제 없음**(사용자 결정 2026-10-21) — 카드와 같은 값을 두 번 적었다.
- 몸: **기본정보 카드 하나** — 사번 · 연락처 · 소속 사업장 · 근무 상태.
  ⚠️ **권한·등록일을 적지 못한다** — 상세 응답에 `codeSeq`/`codeName`/`createDt` 가 **없다**(OQ-8).
  목록에서 넘겨받아 채우지 않는다(주소로 바로 들어오면 없는 값이 된다).
- 분기 4종(026 승계): 주소 오류(요청 안 함, 로딩보다 먼저) / 로딩 / 조회 실패(다시 시도 + 목록으로) / 정상.

### 2-3. 추가·수정·비밀번호·삭제 (mock 유지)

- **추가**(목록 필터 줄 끝): 지금 폼 그대로 — 제출은 콘솔 스텁.
- **수정**(상세 머리): 기본값을 `UserDetail` 의 `userName`·`phone` 에서 채운다(하이픈 형식으로 변환).
- **비밀번호**(상세 머리): 지금 "초기화" 확인 모달 그대로. ⚠️ 서버는 **초기화가 아니라 `UpdateUser.loginPw`
  로 새 값을 넣는 방식**이다 — 동작 정의는 변경계 spec 에서(OQ-038-C).
- **삭제**(상세 머리): 확인 → 목록으로. 실제 삭제 없음.

---

## 3. 제약

### 기술 제약

- 재사용: 026 과 같다 — `AppTable`(`hidePagination` + `renderCard` + 열 `meta.className`) · `AppPagination` ·
  `AppInput variant="search"` · `AppSelect` · `AppIconButton` · `AppEmpty` · `AppDetailCard` · `AppDetailRow` ·
  `AppBadge` · `AppDialog` · `AppAlertDialog` · `useQueryParams` · `useDebouncedCallback` · `getSiteSeq` ·
  `course-history` 의 페이징 헬퍼. `WorkerAvatar`(이니셜) 유지.
- 신설 위치: `features/workers/{api,hooks,lib,types,components}` + `queryKeys.ts` — 026 `features/notice` 와 같은 구조.
- **MSW 핸들러 신설**: `src/mocks/handlers/users.ts`. 기존 `workerData.ts` 시드를 서버 형태로 옮긴다
  (관리자 행 · 근무 종료 행 · 파견 행이 모두 있게).
- 라우트 신설: `paths.service.userDetail(userSeq: number)` + `pathPatterns.userDetail = '/users/:userSeq'`.
- 🔴 **사진(`imagePath`)을 쓰지 않는다** — 아바타는 이니셜 그대로. 사진은 B-40 으로 지금 열리지 않고,
  넣으면 폴백만 보인다. 수요가 생기면 `MemoAttach` 처럼 폴백을 전제로 붙인다.

### 비즈니스 규칙 / 결정

- 🔴 **서버에 없는 것은 화면에서 뺀다**(CLAUDE.md B4):
  - **사용자 상태(활성/비활성)** — 필드가 없다. 컬럼·필터·상세 행 모두 제거
  - **목록의 연락처** — 목록 응답에 없다(상세에만 `phone`). 행마다 상세를 부르면 N+1 → **상세에서만** 본다
  - **배치 변경 이력** — 백엔드 **미개발**(`api-spec.md` §6-5). 가짜 이력을 보여주지 않는다 → 상세에서
    제거하고 **배치관리 spec 으로 이월**
- 🔴 **관리자도 목록에 나온다**(사용자 결정 2026-10-21) — `UserList` 가 사업장 사람을 권한 구분 없이
  준다. 권한 컬럼 + 필터로 구분한다. 메뉴명 "근무자" 는 유지.
- 🔴 **권한 필터 선택지는 실측 값 2종**(`6`·`7`)이다 — 권한 코드 목록 API 는 미개발(§6-5)이라 상수로 둔다.
  거를 수 없는 값을 두지 않는다(037 결과 필터와 같은 판단).
- 검색 placeholder 는 **실측 전까지 "이름 검색"** — `searchKey` 대상 미실측(OQ-038-A).

---

## 4. 엣지 케이스

공통 규칙 따름(B급). 단, **403 은 조회 실패 분기로 떨어진다**(§2-1).

---

## 5. 완료 조건 (DoD)

**목록 (US1)**
- [ ] 1. `/users` 가 `UserList` 응답으로 `AppTable` 을 그린다 — `workerData` import 0건, 우측 패널 0건
- [ ] 2. 컬럼(이름·사번·권한·근무 상태·원소속·등록일) — 서버에 없는 연락처·사용자 상태가 없다
- [ ] 3. 필터 줄이 026 과 같은 배치(검색 → 권한·근무 상태·초기화 → spacer → 근무자 추가)
- [ ] 4. `q`·`role`·`work`·`page` 가 URL 에 있고 서버 파라미터(`searchKey`·`codeSeq`·`workYn`·`pageNumber`)로 나간다
- [ ] 5. `siteSeq` 는 URL 에 없고 서버에는 **`siteId`** 로 나간다
- [ ] 6. 상태 분기 4종 — 403 도 조회 실패로 그린다
- [ ] 7. `xl` 미만 카드(`WorkerCard`) — OQ-030-A 종결
- [ ] 8. 행 클릭 → `/users/:userSeq`

**상세 (US2)**
- [ ] 9. `/users/:userSeq` 가 `UserDetail`(`userId` 파라미터)로 그려진다
- [ ] 10. 브레드크럼 + 머리 줄(아바타·이름·근무 상태·액션 3종) + 기본정보 카드
- [ ] 11. 연락처는 하이픈 형식으로 보인다
- [ ] 12. 주소 오류는 요청 없이 즉시 · 조회 실패는 다시 시도 + 목록으로
- [ ] 13. 배치 변경 이력이 없다(가짜 데이터 0건)

**추가·수정·비밀번호·삭제 (US3)**
- [ ] 14. 추가(목록) · 수정(상세, `UserDetail` 기본값) · 비밀번호 · 삭제(→ 목록) 흐름이 유지된다

**정리**
- [ ] 15. 구 타입(`Worker`·`WorkerSummary`·`WorkerAssignmentHistoryItem`) · `WorkerDetailPanel` · `workerData.ts`
      소비처 0건 삭제. `enum.ts` 의 `UserStatus`·`WorkStatus` 는 **다른 소비처를 확인한 뒤** 판단
- [ ] 16. `npm run verify` + `npm run test` green
- [ ] 17. 캡쳐 baseline(`users--목록` 교체 · `users--상세선택` → `users--상세` 로 이름·성격 변경)
- [ ] 18. 실서버 화면 확인 — **본사 계정**(403 이 풀리기 전)
- [ ] 19. 백엔드 요청 정리 — `api-spec.md` B-41(현장관리자 403) 신설 + OQ 실측 결과
- [ ] 20. 문서 동기화 — `screens.md`(§1-4 행·결정 블록·§4 라우트) · `patterns.md`(§1 마스터-디테일 사용 화면) ·
      `flow.md`(근무자 흐름) · `data-model.md`(근무자 타입·엔드포인트) · `roadmap.md`(038 행·§12) · `components.md`(필요 시)
- [ ] 21. `## 다음 spec으로 이월` — 변경계 전환 · 배치 이력 · OQ 잔여

---

## Open Questions

- ✅ **OQ-038-A 해소(T619)**: **이름 + 사번** 부분일치, 연락처 ✗ → placeholder `이름·사번 검색`. (원문) **`searchKey` 검색 대상** — 이름/사번/연락처 중 무엇인지 미실측. 본사 계정 GET 으로 확인하고
  placeholder 를 맞춘다(026 OQ-026-A 와 같은 절차).
- ✅ **OQ-038-B 해소(T619)**: **배치 온 사람의 소속지**다 — 소속지 목록에는 안 나오고 상세 `siteSeq` 는 소속지를 준다(OQ-7 해소). (원문) **원소속(`originSiteSeq`/`originSiteName`) 의미**(= `api-spec.md` OQ-7) — 실측: 대부분 행이
  **Seq `null` + Name = 현재 사업장명**이고, 1행만 **Seq `11` + 다른 사업장명**이다. 가설: **Seq 가 있으면
  다른 사업장에서 파견 온 사람**. 🔴 확정 전까지 **값을 해석하지 않고** Seq 가 있을 때만 `원소속 {이름}` 을
  보여준다 — 백엔드에 의미 확인을 요청한다.
- **OQ-038-C 비밀번호 동작** — 화면은 "초기화" 인데 서버는 `UpdateUser.loginPw` 로 **새 값 지정**이다.
  초기화(임의값 발급 + 안내)인지 관리자가 직접 지정인지 — 변경계 spec 에서 결정.
- **OQ-8 상세의 권한·등록일 부재** — 상세에 `codeSeq`·`codeName`·`createDt` 가 없다. 백엔드 요청(B-41 에 묶는다).

---

## 참고

- 응답 실측: `api-spec.md` §8·9 · B-12 · OQ-6·7·8 · §6-5
- 골격 참조: `pages/service/notice/NoticeListPage.tsx` · `NoticeDetailPage.tsx`(026)
- 패턴: `patterns.md` §1(마스터-디테일 → 사용 화면에서 `/users` 제외) · §14(반응형 카드)
