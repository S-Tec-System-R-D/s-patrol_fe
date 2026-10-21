# 038-workers tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 026 이 **T595** 에서 끝났으므로 **T596** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **위험도 B → 화면 단위로 크게 쪼갠다.** 골격은 026 `NoticeListPage`·`NoticeDetailPage` 를 따르고,
> **새 공용 컴포넌트는 만들지 않는다**. 구조는 026 tasks 와 같은 6 Phase 다.

---

## Phase 1: Setup — 서버 모듈 (US1·US2 선행)

> **독립 테스트 기준**: `userListParams` 단위 테스트가 `siteSeq` 를 **`siteId`** 로 내보내고, 권한·근무
> 상태를 정수·불리언으로 바꾸며, 빈 값·깨진 값에서 키를 뺀다.

- [x] T596 서버 타입 선언 in src/features/workers/types/user.ts — `UserRow`·`UserDetail`·`UserListParams`. `api-spec.md` §8·9 **실측 그대로 전량**(안 쓰는 `deviceType`·`fcmToken`·`voipToken`·`image*` 포함). 🔴 **파일을 새로 둔다** — 구 `worker.ts` 는 소비처를 옮긴 뒤 T618 에서 지운다(지금 지우면 Phase 3 전까지 빌드가 깨진다). `UserListParams` 는 서버 이름 그대로(**`siteId`**·`searchKey`·`codeSeq`·`workYn` — B-12)
- [x] T597 [P] 권한 상수 in src/features/workers/lib/userRole.ts — `6` 현장 관리자 / `7` 현장 근무자(실측). 필터 선택지 + 뱃지 variant. 🔴 **서버 `codeName` 을 라벨로 쓰고** 상수는 필터 선택지에만 — 권한 코드 목록 API 가 미개발(§6-5)이라 선택지만 상수다
- [x] T598 [P] `userListParams.ts` in src/features/workers/lib/userListParams.ts — URL `q`·`role`·`work`·`page`·`size` → 서버 `searchKey`·`codeSeq`·`workYn`·`pageNumber`·`pageSize` + `siteId`. 🔴 `clampPageSize`·`parsePageNumber`·`omitIfAll`·`parseIntegerFilter` **재사용**(`course-history`). `work` 는 `'true'`/`'false'` 외에는 **키를 뺀다**
- [x] T599 [P] `userKeys` in src/features/workers/queryKeys.ts — `lists`/`list(params)`/`detail(userSeq)`. 🔴 목록 키에 **`siteId` 포함**(026 규약 — 사업장 전환 시 이전 사업장 사람이 남는다)
- [x] T600 [P] API 2종 in src/features/workers/api/getUserList.ts · src/features/workers/api/getUserDetail.ts — `GET User/W/sign/UserList` · `GET User/W/sign/UserDetail?userId=`. 🔴 **403 을 특별 처리하지 않는다** — 인터셉터가 주는 에러 그대로 "조회 실패" 로 간다(spec §2-1)
- [x] T601 [P] `userListParams` 테스트 in src/features/workers/lib/__tests__/userListParams.test.ts — `siteId` 이름 · 권한 정수 · `work` 불리언/무효 · 빈 값 키 제거 · 상한 100 · 1-based
- [x] T602 [P] 표시 헬퍼 in src/features/workers/lib/userFormat.ts — 연락처 하이픈(`01012345678` → `010-1234-5678`, 형식이 아니면 **원문 그대로**) · 근무 상태 라벨(`workYn`) + 테스트 in src/features/workers/lib/__tests__/userFormat.test.ts

## Phase 2: Foundational — 훅 · MSW · 라우트

> **독립 테스트 기준**: MSW 에서 목록·상세 핸들러가 **각각 1번만** 선언되어 있고, `siteId`·`searchKey`·
> `codeSeq`·`workYn`·페이징을 받아 걸러 준다. 🔴 `siteSeq` 로 보내면 **걸리지 않는다**(서버 이름을 지킨다).

- [x] T603 훅 2종 in src/features/workers/hooks/useUserList.ts · src/features/workers/hooks/useUserDetail.ts — 026 `useNoticeList`·`useNoticeDetail` 과 같은 모양(`null` 이면 `enabled: false`)
- [x] T604 MSW 핸들러 신설 in src/mocks/handlers/users.ts · src/mocks/handlers/index.ts — 시드는 `workerData.ts` 를 **서버 형태로 옮긴다**. 🔴 **관리자 행(codeSeq 6) · 근무 종료 행 · 파견 행(originSiteSeq 有)** 이 모두 있게. `searchKey` 는 **이름 부분일치**(OQ-038-A 가정, T619 에서 교정). 없는 `userId` 는 400 + 래퍼(가정)
- [x] T605 [P] 훅·핸들러 테스트 in src/features/workers/hooks/__tests__/useUser.test.tsx — 필터 3종·페이징·`null` 미요청 · 상세·없는 ID 오류 (026 T574a 와 같은 게이트 증명)
- [x] T606 라우트 신설 — ✅ **`paths.ts` 만 했다**(2026-10-21, 함수 + 패턴). `router/index.tsx` 등록은 **T614 에서**(037 T550 선례) — in src/router/paths.ts · src/router/index.tsx — `userDetail(userSeq: number)` + `pathPatterns.userDetail = '/users/:userSeq'`. 상세 페이지는 T614 에서 만든다 — 그 전까지 라우트 등록은 **T614 와 함께**(빈 페이지를 노출하지 않는다)

## Phase 3: US1 — 목록 테이블화 + 서버 타입 전환

> **독립 테스트 기준**: MSW 200 에서 서버 행이 테이블로 그려지고, 검색·권한·근무 상태·페이지가 URL 에
> 실려 서버로 나간다. 우측 패널이 없다. 403 에서 "조회 실패" 가 뜬다.

- [x] T607 [US1] 컬럼 재작성 in src/features/workers/components/WorkerColumns.tsx — `ColumnDef<UserRow>`: 이름(`WorkerAvatar` + 이름) · 사번 · 권한(`codeName` 뱃지) · 근무 상태(점 + 라벨) · 원소속(Seq 있을 때만 `원소속 {이름}`, OQ-038-B) · 등록일 · 꺾쇠. 🔴 **정렬 off**(서버 페이징) · 연락처·사용자 상태 **없음**. ⚠️ `WorkerAvatar` 는 `id: string` 을 받는다 — `String(userSeq)` 로 넘기고 컴포넌트는 고치지 않는다
- [x] T608 [US1] [P] 카드 모드 in src/features/workers/components/WorkerCard.tsx — 034 골격: 아바타 타일 + 이름·권한 뱃지 + `사번 │ 근무 상태 │ 등록일` + 꺾쇠. 🔴 **OQ-030-A 종결**
- [x] T609 [US1] 🔴 **페이지 재작성** in src/pages/service/users/UsersPage.tsx — `workerData`·우측 `aside`·`WorkerDetailPanel` 제거. 026 배치: 헤더(제목 + `{사업장명} 소속 {totalCount}명`) → 필터 줄(검색 → `role="group"` 권한 `AppSelect`·근무 상태 `AppSelect`·초기화 → spacer → **근무자 추가**, `PointTopNav` 모양) → `AppTable`(`hidePagination` + `renderCard`) → `AppPagination`. ✅ 부제의 사업장명은 **`getSiteName()`(선택한 사업장)** — 확인해 보니 `useMe().locationName` 은 **JWT 클레임에 없어 항상 `undefined`**(020)라 구 화면의 부제는 **한 번도 나온 적이 없었다**
- [x] T610 [US1] 상태 분기 in src/pages/service/users/UsersPage.tsx — 조회 실패(다시 시도, 🔴 403 포함 — 권한을 단정하지 않는 문구) / 로딩 / 0건 2문구 / 목록
- [x] T611 [US1] [P] 화면 테스트 in src/pages/service/users/__tests__/UsersPage.test.tsx — 서버 행 렌더 · 서버에 없는 컬럼 없음 · 필터 3종 → 서버 파라미터(`siteId`·`searchKey`·`codeSeq`·`workYn`) · 필터 변경 시 첫 페이지 · 🔴 **403 → 조회 실패** · 0건 2문구 · 행 클릭 → 상세 경로 · 우측 패널 없음
- [x] T612 [US1] [P] 컬럼 테스트 갱신 in src/features/workers/components/__tests__/WorkerColumns.test.tsx — 🔴 **기존 3건은 구 타입 기준이라 대체**한다(배치중 뱃지·사용자 상태 라벨은 서버 근거가 없어 사라진다). 원소속 표시 조건 · 권한 뱃지 · 근무 상태

## Phase 4: US2 — 근무자 상세 페이지 (신설)

> **독립 테스트 기준**: MSW 200 에서 `/users/:userSeq` 가 머리·기본정보를 그리고, `/users/abc` 는 요청
> 없이 즉시 오류다. 배치 이력이 없다.

- [x] T613 [US2] 기본정보 카드 in src/features/workers/components/detail/UserInfoCard.tsx — `AppDetailCard` + `AppDetailRow`: 사번 · 연락처(하이픈) · 소속 사업장 · 근무 상태. 🔴 **권한·등록일 없음**(상세 응답에 없다, OQ-8) — 빈 행을 두지 않는다
- [x] T614 [US2] 🔴 **상세 페이지 신설** in src/pages/service/users/UserDetailPage.tsx · src/router/index.tsx — 026 골격: 브레드크럼(`근무자 > 근무자 상세`) → 머리(`WorkerAvatar` + 이름 + 근무 상태 뱃지 + 부제 `사번 · 소속` + 액션 3종: 비밀번호 `AppAlertDialog` · 수정 `AppDialog` · 삭제 `AppAlertDialog` → 목록) → 기본정보 카드. 분기 4종(🔴 주소 오류를 로딩보다 먼저). 라우트 등록(T606) 함께. ⚠️ 머리 줄은 **직접 짰다** — `AppPageHeader` 의 `icon` 이 lucide 아이콘만 받아 아바타를 넣을 수 없다. 🔴 **T618 의 `WorkerDetailPanel.tsx` 삭제를 여기서 앞당겼다** — 폼 입력 타입(T616)이 바뀌면 컴파일이 안 되고, 목록 재작성(T609)으로 소비처가 0건이 됐다(026 `NoticeDetailView` 와 같다)
- [x] T615 [US2] [P] 화면 테스트 in src/pages/service/users/__tests__/UserDetailPage.test.tsx — 정상 · 연락처 하이픈 · 배치 이력 없음 · 권한/등록일 행 없음 · `/users/abc` 요청 0건 · 조회 실패(다시 시도 + 목록으로) · 수정 모달 기본값 · 삭제 → 목록

### Phase 4 사용자 수정 (2026-10-21)

- [x] T615a [US2] 🔴 **머리 줄 부제 제거** in src/pages/service/users/UserDetailPage.tsx — `사번 · 소속` 이 기본정보 카드와 겹쳐 카드에 새로 남는 값이 **연락처 하나뿐**이었다. 값은 카드에 모은다(A안) — 상세 응답의 권한·등록일(B-41)이 생기면 들어갈 자리도 카드다

## Phase 5: US3 — 폼 입력 타입 (mock 유지)

> **독립 테스트 기준**: 수정 모달이 `UserDetail` 의 이름·연락처(하이픈 형식)로 채워진다. 검증 규칙
> 테스트는 고치지 않고 통과한다.

- [x] T616 [US3] 수정 폼 입력 타입 in src/features/workers/form/EditWorkerForm.tsx — prop 을 `user: Pick<UserDetail, 'userName' | 'phone'>` 로. 연락처는 **하이픈 형식으로 변환해** 채운다(스키마가 `010-0000-0000` 이다 — 변환하지 않으면 열자마자 검증 에러). 🔴 **스키마 필드명(`name`·`phone`·`initialPassword`)은 바꾸지 않는다** — 요청 DTO 는 변경계 spec 에서(026 T587 과 같은 판단). 🔴 **계획 외 1건**: 추가·수정 폼의 "소속 사업장" 칸이 `useMe().locationName`(JWT 에 없어 항상 `undefined`)이라 **늘 빈칸이었다** → 수정은 `UserDetail.siteName`, 추가는 `getSiteName()`. Pick 에 `siteName` 추가
- [x] T617 [US3] [P] 폼 테스트 갱신 in src/features/workers/form/__tests__/WorkerForm.test.tsx — 기본값 출처만 바뀐다. 하이픈 없는 `phone` 이 변환되어 들어오는지 1건 추가

## Phase 6: Polish

- [x] T618 🔴 **삭제** — ✅ `workerData.ts`·`worker.ts` 삭제(`WorkerDetailPanel` 은 T614 에서 앞당김). `enum.ts` 는 근무자 전용 `WorkStatus`·`workStatusLabel` 만 지웠다 — `UserStatus`·`userStatusLabel` 은 `auth/types/me.ts` 가 다시 내보내고 본사(관리자) 도메인 값이라 남긴다. 원래 경로 in src/features/workers/components/WorkerDetailPanel.tsx · src/features/workers/mocks/workerData.ts · src/features/workers/types/worker.ts — grep 소비처 **0건** 확인 후. ⚠️ `src/types/enum.ts` 의 `UserStatus`·`WorkStatus`·라벨은 **다른 소비처를 확인한 뒤** 판단(`features/auth/types/me.ts` 가 `FieldRole` 을 쓴다 — 건드리지 않는다)
- [x] T619 OQ-038-A·B 실측 in docs/api-spec.md — ✅ **A: 이름 + 사번**(연락처 ✗ → `이름·사번 검색`) · **B: 배치 온 사람의 소속지**(소속지 목록에 안 나옴, 상세 `siteSeq` = 소속지 → MSW 에 `listedSiteSeq` 를 두어 재현) · 상세 없는 ID 는 **404**(공지는 400). 원래 계획 — **본사 계정** GET 만: `searchKey` 가 이름/사번/연락처 중 무엇을 거르는지 · `originSiteSeq` 가 있는 행의 의미(사업장 11 의 목록에서 같은 사람이 어떻게 보이는지). 결과로 placeholder·MSW·원소속 표시를 교정. 🔴 한글 검색은 **Python `urlencode`** 로 보낸다(026 T590 — Git Bash `curl` 은 인코딩이 깨진다)
- [x] T620 백엔드 요청 정리 in docs/api-spec.md — 🔴 **B-41 신설**: 현장관리자 `UserList`·`UserDetail` 403(현장 사이트 근무자 화면의 주 사용자) + 상세에 `codeSeq`·`codeName`·`createDt` 부재(OQ-8). 변경계 3종도 같은 권한일 가능성을 **미실측으로** 적는다
- [x] T621 `npm run verify` 0 + `npm run test` green(1106 → **1154**, 104 files). 🔴 **병렬 실행**
- [~] T622 🔴 **사용자 브라우저 확인** — mock 화면 + **실서버는 본사 계정**으로 사업장 6(6명) — ◩ **mock 화면은 사용자가 Phase 3 에서 확인했다**(2026-10-21, 상세는 캡쳐로 확인 후 부제 제거 1건). ⚠️ **실서버 화면 확인은 아직** — 본사 계정 · 사업장 6
- [x] T623 `npm run capture` — `현장/users--목록` 교체 · `users--상세선택` → **`users--상세`**(이름·성격 변경, `e2e/capture.pw.ts` 수정). 🔴 나머지는 **바이트 대조만** 하고 덮지 않는다(026 T593)
- [x] T624 문서 동기화 — docs/screens.md(§1-4 행·결정 블록·§4 라우트) · docs/patterns.md(§1 사용 화면에서 `/users` 제외) · docs/flow.md(근무자 흐름) · docs/data-model.md(근무자 타입·엔드포인트·OQ) · docs/roadmap.md(038 행·§12) · docs/ui-current/README.md · `030` OQ-030-A 종결 표시
- [x] T625 DoD 21개 대조표 + `## 다음 spec으로 이월` in specs/phase4/038-workers/tasks.md — 변경계 전환(추가·수정·비밀번호·삭제·사진 · OQ-038-C) · 배치 이력(→ 배치관리) · B-41 회신 대기

---

## Dependencies & Execution Order

- **T596 → 나머지 전부** (타입이 먼저)
- **T597·T598·T599·T600·T602** 는 T596 뒤 병렬. **T601** 은 T598 뒤
- **T603 → T609 · T614** (훅이 화면보다 먼저)
- **T604 → T605 · T611 · T615** (화면 테스트는 MSW 위에서 돈다)
- **T606 의 `paths` → T609**(행 클릭 경로) · **라우트 등록은 T614 와 함께**
- **T607·T608 → T609 → T610 → T611**
- **T613 → T614 → T615**
- **T616 은 T614 와 함께** — 상세의 수정 모달이 `UserDetail` 을 넘긴다
- **T618 은 Phase 3~5 뒤** 🔴 삭제는 전환 후
- **T619 는 T621 앞** — 실측으로 placeholder·MSW 가 바뀌면 테스트가 함께 바뀐다
- Phase 3(US1)과 Phase 4(US2)는 T603~T606 이후 **독립 진행 가능**. Phase 6 은 모든 US 뒤

---

## DoD 대조표 (T625)

| # | 조건 | 판정 | 증거 |
|:-:|---|:-:|---|
| 1 | `/users` 가 `UserList` 로 `AppTable` — `workerData` 0건, 우측 패널 0건 | ✅ | `UsersPage.tsx` · 테스트 "우측 상세 패널이 없다" · `workerData.ts` 삭제 |
| 2 | 컬럼 6종 — 연락처·사용자 상태 없음 | ✅ | `WorkerColumns.tsx` · 테스트 "서버에 없는 컬럼이 없다" |
| 3 | 필터 줄 026 배치 | ✅ | 검색 → 권한·근무 상태·초기화 → spacer → 추가 · 테스트 "추가 버튼은 필터 줄에" |
| 4 | `q`·`role`·`work`·`page` → `searchKey`·`codeSeq`·`workYn`·`pageNumber` | ✅ | 테스트 "서버 이름의 파라미터로 실린다" |
| 5 | `siteSeq` 는 URL 에 없고 서버엔 `siteId` | ✅ | 같은 테스트(`siteSeq` null 단언) · `userListParams.test.ts` |
| 6 | 상태 분기 4종 — 403 도 조회 실패 | ✅ | `UsersPage.test.tsx` "상태 분기" 4건 |
| 7 | `xl` 미만 카드 — OQ-030-A 종결 | ✅ | `WorkerCard.tsx` · 030 spec·`patterns.md` 종결 표시 |
| 8 | 행 클릭 → `/users/:userSeq` | ✅ | 테스트 "행을 누르면 상세 페이지로" |
| 9 | 상세가 `UserDetail`(`userId`)로 | ✅ | 테스트 "상세는 서버 이름 userId 로 요청한다" |
| 10 | 브레드크럼 + 머리 줄 + 기본정보 카드 | ✅ | `UserDetailPage.tsx` (부제는 사용자 결정으로 제거 — T615a) |
| 11 | 연락처 하이픈 | ✅ | `userFormat.test.ts` · 상세 테스트 |
| 12 | 주소 오류 즉시 · 조회 실패 다시 시도 + 목록으로 | ✅ | 상세 테스트 "상태 분기" 3건(403 포함) |
| 13 | 배치 변경 이력 없음 | ✅ | 테스트 "권한·등록일·배치 이력이 없다" |
| 14 | 추가·수정·비밀번호·삭제 흐름 | ✅ | 목록 "모달을 연다" · 상세 "수정 모달이 서버 값으로" · "비밀번호 확인 모달" · "삭제 → 목록" |
| 15 | 구 타입·패널·`workerData` 삭제, enum 판단 | ✅ | T618 |
| 16 | `verify` + `test` green | ✅ | 0 errors · **1154 passed**(104 files) |
| 17 | 캡쳐 baseline | ✅ | `users--목록` 교체 · `users--상세` 신설(`상세선택` 삭제) · 나머지 바이트 대조 |
| 18 | 실서버 화면 확인(본사 계정) | ◩ | mock 화면 확인 ✅ · ⚠️ **실서버 미실시**(T622) |
| 19 | 백엔드 요청 정리 | ✅ | `api-spec.md` **B-41** 신설 · OQ-7 해소 · OQ-8 → B-41 · 실측 블록 §8·9 |
| 20 | 문서 동기화 | ✅ | T624 — screens · patterns · flow · data-model · roadmap · ui-current README · 030 spec |
| 21 | 이월 블록 | ✅ | 아래 |

**판정: 21개 중 ✅ 20 · ◩ 1(#18).**

---

## 다음 spec으로 이월

### ① 🔴 B-41 회신 대기 — 현장관리자 403

회신되면 **코드 변경 없이** 현장관리자에게 목록·상세가 보인다. 그때 확인할 것:
- 현장관리자 토큰으로 `UserList`(자기 사업장) · `UserDetail` 200
- `UserDetail` 에 `codeName`·`createDt` 가 추가됐으면 **기본정보 카드에 권한·등록일 행**을 붙인다(OQ-8)

### ② 변경계 전환 — 추가·수정·비밀번호·삭제

- `AddUser` · `UpdateUser` · `RemoveUser` — 🔴 **WF-1-0 실측부터**(지금은 현장관리자 권한으로 찍을 수조차 없다 — B-41 선행)
- 전부 **multipart/form-data**(사진 `image`) · `UpdateUser.isRemove` 의 의미(사진 삭제?) 미확인
- **OQ-038-C 비밀번호** — 화면은 "초기화" 인데 서버는 `UpdateUser.loginPw` 로 **새 값 지정**이다
- 추가 폼의 **권한 선택**(`AddUser.codeSeq`) — 지금 폼에 없다
- 폼 스키마 필드명(`name`·`phone`·`initialPassword`) → swagger 기준으로

### ③ 배치관리로 넘기는 것

- **배치 변경 이력** — 038 이 상세에서 지웠다(백엔드 미개발, 가짜 데이터). 배치 API 가 생기면 근무자 상세에 **카드로** 붙인다
- 🔴 **원소속 = 배치 온 사람의 소속지**(실측) — 배치관리 화면이 "지금 이 사업장에 와 있는 사람" 을 보여줄 때 같은 필드를 쓴다

### ④ 실서버 화면 확인 (T622)

`npm run dev:real` + **본사 계정 `000000`** → 사업장 6 → `/users`(6명, 관리자 2 · 배치 온 사람 1) → 행 클릭 → 상세.
