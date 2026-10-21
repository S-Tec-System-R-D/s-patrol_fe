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

- [ ] T690 [US2] 🔴 **수정 제출** in src/features/workers/form/EditWorkerForm.tsx — `name`·`phone` 만 · `lists`·`detail` 무효화 · 실패 시 `detail` 재조회
- [ ] T691 [US2] 상세 연결 in src/pages/service/users/UserDetailPage.tsx — 수정 모달 open 제어
- [ ] T692 [US2] [P] 테스트 — 본문(비밀번호 없음) · 저장 → 상세 갱신

## Phase 4: US3·US4 — 비밀번호 변경 · 삭제

- [ ] T693 [US3] 비밀번호 폼 in src/features/workers/form/PasswordForm.tsx · schema.ts — 새 비밀번호 + 확인(`refine`) · `loginPw` 만
- [ ] T694 [US3] 상세 연결 — "비밀번호" 초기화 확인창 → **"비밀번호 변경" 버튼 + 모달**
- [ ] T695 [US4] 🔴 **삭제** in src/pages/service/users/UserDetailPage.tsx — 이동 먼저 → `detail` 제거 → `lists` 무효화 · 본인 계정 비활성
- [ ] T696 [US3][US4] [P] 테스트

## Phase 5: 마무리

- [ ] T697 `npm run verify` + `npm run test` (병렬)
- [ ] T698 브라우저 확인(mock) + 🔴 **dev:real**(만든 계정만 지운다)
- [ ] T699 캡쳐 — 추가 · 정보 수정 · 비밀번호 변경 모달
- [ ] T700 문서 — `data-model.md` · `screens.md` §1-4 · `roadmap.md` · `patterns.md` §17(소비처 2곳)
- [ ] T701 DoD 점검 + `## 다음 spec으로 이월`
