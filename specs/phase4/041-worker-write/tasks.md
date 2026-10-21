# 041-worker-write tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 040 이 **T680** 에서 끝났으므로 **T681** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **WF-1-0 실측 완료**(2026-10-21) — `api-spec.md` §5-1-B "근무자 3종" · B-44 · B-45. 만든 계정 12개는 전부 지웠다(사업장 7 목록 `[]`).

---

## Phase 1: 기반 — 타입 · FormData 이동 · API · MSW

> **독립 테스트 기준**: 공지 테스트가 이동 뒤에도 통과하고, MSW 에서 추가·수정·삭제가 목록·상세를 바꾼다(사번 중복 400 · 삭제 후 상세 404).

- [x] T681 요청 타입 + 응답 갱신 in src/features/workers/types/user.ts — `AddUserRequest` · `UpdateUserRequest` · `UserDetail.codeName` · `deviceType: string | null`. 상세 모양 테스트(`useUser.test.tsx` OQ-8)도 `codeName` 있음으로 갱신
- [x] T682 `toFormData` 이동 in src/lib/formData.ts — 공지 import 교체 · 테스트 이동(`toUpsertNoticeFormData` 는 공지에 남긴다). `undefined` 필드는 넣지 않게 넓혔다(부분 갱신 `UpdateUser`)
- [x] T683 [P] API 3종 in src/features/workers/api/ — `addUser.ts` · `updateUser.ts`(**POST**) · `removeUser.ts`. 사진이 없어 업로드 timeout 은 두지 않는다
- [x] T684 🔴 **상태 보유 MSW** in src/mocks/handlers/users.ts — 쓰기 3종 · `resetUserStore`
- [x] T685 [P] API + MSW 통합 테스트 in src/features/workers/api/__tests__/userWrite.test.ts

## Phase 2: US1 — 추가

> **독립 테스트 기준**: 추가하면 목록에 나오고 `codeSeq: 7`·연락처 숫자만 나간다. 사번 중복이면 모달이 남는다.

- [x] T686 [US1] 스키마 in src/features/workers/form/schema.ts — `loginId`·`loginPw` 는 **`loginSchema.shape` 를 그대로 재사용**(규칙 한 곳) · `initialPassword` 제거 · `toPhoneDigits`
- [x] T687 [US1] 🔴 **추가 제출** in src/features/workers/form/AddWorkerForm.tsx — 사번 입력 추가 · `addUser` · `lists` 무효화 · 성공해야 `onSuccess`
- [x] T688 [US1] 목록 연결 in src/pages/service/users/UsersPage.tsx — 모달 open 제어 · 사업장 미선택 시 버튼 비활성
- [x] T689 [US1] [P] 테스트 — 규칙 · multipart 본문(`codeSeq: 7` · 연락처 숫자만) · 성공/중복/연타(`WorkerForm.test.tsx` 5건) · 목록 흐름 2건(`UsersPage.test.tsx`)

## Phase 3: US2 — 정보 수정

- [x] T690 [US2] 🔴 **수정 제출** in src/features/workers/form/EditWorkerForm.tsx — `name`·`phone` 만 · `lists`·`detail` 무효화 · 실패 시 `detail` 재조회
- [x] T691 [US2] 상세 연결 in src/pages/service/users/UserDetailPage.tsx — 수정 모달 open 제어
- [x] T692 [US2] [P] 테스트 — 본문(`userSeq`·`name`·`phone` 숫자만, 비밀번호 없음) · 없는 근무자 · 상세 저장 → 닫힘 → 갱신(`WorkerForm.test.tsx` 2건 · `UserDetailPage.test.tsx` 1건)

## Phase 4: US3·US4 — 비밀번호 변경 · 삭제

- [x] T693 [US3] 비밀번호 폼 in src/features/workers/form/PasswordForm.tsx · schema.ts — 새 비밀번호 + 확인(`refine`) · `loginPw` 만
- [x] T694 [US3] 상세 연결 — "비밀번호" 초기화 확인창 → **"비밀번호 변경" 버튼 + 모달**
- [x] T695 [US4] 🔴 **삭제** in src/pages/service/users/UserDetailPage.tsx — 이동 먼저 → `detail` 제거 → `lists` 무효화 · 본인 계정 비활성
- [x] T696 [US3][US4] [P] 테스트 in src/pages/service/users/__tests__/UserDetailPage.test.tsx — 비밀번호: 다른 모달 · 불일치 거부 · `userSeq`+`loginPw` 만 · 로그인 규칙 / 삭제: 서버에서 사라짐 · 이미 지워진 근무자 → 상세에 머묾 · 본인 계정 잠금(5건, mock 2건 대체)

## Phase 5: 마무리

- [x] T697 `npm run verify` + `npm run test` (병렬)
- [x] T698 브라우저 확인(mock ✅ · 🔴 **dev:real** ✅ — 사용자 직접 2026-10-21)
- [-] T699 ~~캡쳐~~ — **생략(사용자 결정 2026-10-21)**. ⚠️ `users--상세` baseline 은 후속 레이아웃 변경(좌우 교체 · 액션 이동) 전 모습으로 남아 있다 → 다음 재촬영 때 교체
- [x] T700 문서 — `data-model.md` · `screens.md` §1-4 · `roadmap.md` · `patterns.md` §17(소비처 2곳)
- [x] T701 DoD 점검 + `## 다음 spec으로 이월`

### 종료 후 후속 (2026-10-21 — 사용자 요청)

- [x] 근무자 상세 **좌우 교체** — 좌 1/3 기본정보 · 우 2/3 최근 순찰 기록(`7ebf9f3`)
- [x] 기본정보 카드 **높이 fit**(`AppDetailCard` 의 `h-full` 때문에 행 높이까지 늘어났다 — `div` 로 감쌈) · 액션 3개를 **기본정보 카드 아래로**(`flex-auto` + nowrap) · 비밀번호 변경 **point 연한 톤**(`8687f58`)

---

## DoD 점검 (2026-10-21)

**13/14 + 생략 1** — #11 dev:real 은 사용자 확인(2026-10-21) · #12 캡쳐는 사용자 결정으로 생략.

## 다음 spec으로 이월

### ① dev:real 화면 확인 (#11) — ✅ 완료(사용자 확인 2026-10-21)

`npm run dev:real` + 현장관리자로 사업장 7 → `/users` 추가(사번 `99xxxxx`) → 상세 정보 수정 → 비밀번호 변경 → 삭제.
🔴 **만든 계정만** 지운다. 사업장 7 은 원래 목록이 비어 있다.

### ② 근무자 상세 배치 이력 카드 → `042` 배치 실서버 전환

swagger 갱신(2026-10-21)으로 `GET Assignment/W/sign/GetAssignmentHistory?userSeq` 가 생겼다. 🔴 **실서버에 배치 데이터가 0건**이라
행 모양을 실측할 수 없다 — 배치관리(039 가정 계약)와 **같은 데이터**라 042 에서 함께 실측·연결한다(사용자 합의).

### ③ 백엔드 회신 대기

- **B-44** `AddUser.codeSeq` 필수 여부 — 지금은 항상 7
- **B-45** 서버 입력 검증·연락처 정규화 — 앱 경로로는 약한 비밀번호·형식 틀린 연락처가 들어온다
- **B-41 ②** 상세 `codeSeq`·`createDt` — `codeName` 은 생겼다. 기본정보 카드 **권한·등록일 행**은 둘이 갖춰지면 붙인다(OQ-041-C)

### ④ 캡쳐 재촬영

`users--상세`(레이아웃 변경) · 근무자 모달 3장 — 다음 캡쳐 작업 때 함께.

