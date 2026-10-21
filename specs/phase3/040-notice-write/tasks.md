# 040-notice-write tasks

> 입력: 같은 폴더 `spec.md`
> 태스크 ID는 Phase 무관 일련 번호 — 039 가 **T659** 에서 끝났으므로 **T660** 부터.
> `[P]` = 병렬 가능. `[US1]` = user story 소속.
>
> **WF-1-0 실측 완료**(2026-10-21) — `api-spec.md` §5-1-B "공지 3종". 실측으로 만든 공지는 전부 지웠다(사업장 7 목록 `[]`).

---

## Phase 1: 기반 — 요청 타입 · FormData 빌더 · API · MSW

> **독립 테스트 기준**: 빌더가 `boolean` 을 `'true'/'false'` 로, 파일을 같은 키로 반복 append 하고, 수정 요청을
> `attachList[i]`(삭제 먼저 · 추가는 항목당 1파일 + `isRemove=false`)로 펼친다. MSW 에서 작성·수정·삭제가 목록·상세를 바꾼다.

- [x] T660 요청 타입 in src/features/notice/types/notice.ts — `AddNoticeRequest` · `UpsertNoticeRequest`(화면용 `removeAttachSeqs`·`newFiles`, spec §2-1)
- [x] T661 🔴 **FormData 빌더** in src/features/notice/lib/formData.ts — `toFormData` · `toUpsertNoticeFormData`. `Content-Type` 수동 지정 금지
- [x] T662 [P] 빌더 테스트 in src/features/notice/lib/__tests__/formData.test.ts
- [x] T663 [P] API 3종 in src/features/notice/api/ — `addNotice.ts` · `upsertNotice.ts` · `deleteNotice.ts`(반환 `void`). 🔴 **계획 수정**: axios 기본 timeout 5초로는 업로드(~30MB)가 끊긴다 → 업로드 2종만 요청별 `timeout: 60s`. 통합 테스트 `api/__tests__/noticeWrite.test.ts`
- [x] T664 🔴 **상태 보유 MSW** in src/mocks/handlers/notices.ts — 시드를 store 로 · 쓰기 3종(제목 없음 400 ProblemDetails · 없는 ID 400 래퍼 · 확장자로 image/file 분리) · `resetNoticeStore`. 🔴 **발견**: jsdom 의 `FormData`·`File` 은 MSW 로 넘어가며 파일 이름·내용이 사라진다 → `src/test/setup.ts` 에서 Node 기본 구현으로 교체(브라우저 무관 환경 공백). 핸들러는 `instanceof File` 대신 "문자열이 아니면 파일"

## Phase 2: US1 — 작성

> **독립 테스트 기준**: 작성하면 목록에 나오고(고정이면 맨 위) 모달이 닫힌다. 실패하면 모달·입력이 남는다. 허용 밖 확장자·30MB 이상은 선택 단계에서 막힌다.

- [x] T665 [US1] 폼 스키마 in src/features/notice/form/schema.ts — `content` → `description` · `sendAppPush` 제거 · `isPin` 추가 · 트림 필수
- [x] T666 [US1] 첨부 입력 in src/features/notice/form/NoticeAttachInput.tsx — 한 입력 · 이름·크기 목록 · 개별 제거 · 확장자/합계 용량 검사. 🔴 **계획 수정**: 상한을 **합계 28MB** 로 — 실측 29MB 거부 · 한도는 요청 전체 약 30,000,000 바이트(Kestrel 기본값)라 본문·경계 여유를 둔다. 규칙은 `lib/noticeAttach.ts`
- [x] T667 [US1] 🔴 **작성 제출** in src/features/notice/form/NoticeForm.tsx — `useMutation(addNotice)` · 비옵티미스틱 · `lists` 무효화 · 성공해야 `onSuccess`(모달 닫힘) · `isPending` 비활성
- [x] T668 [US1] 목록 연결 in src/pages/service/notice/NoticeListPage.tsx — 작성 모달 open 제어 + 사업장 미선택 시 버튼 비활성
- [x] T669 [US1] [P] 테스트 in src/features/notice/form/__tests__/NoticeForm.test.tsx — 필수 · 고정 기본 해제 · 첨부 차단 · 성공/실패 · 연타 + 목록 페이지 작성 흐름 2건(`NoticeListPage.test.tsx`)

## Phase 3: US2 — 수정

> **독립 테스트 기준**: 기본값이 현재 값(`isPin` 포함)이고, 기존 첨부 삭제 표시/되돌리기 · 새 첨부가 한 요청으로 나가며 저장 후 상세가 갱신된다.

- [x] T670 [US2] 기존 첨부 목록 in src/features/notice/form/NoticeAttachInput.tsx — `imageList`+`fileList` 를 이름·확장자로 · 삭제 표시 토글(미리보기 없음, B-40)
- [x] T671 [US2] 🔴 **수정 제출** in src/features/notice/form/NoticeForm.tsx — `upsertNotice` · `lists`·`detail` 무효화. 실패 시 `detail` 만 무효화(지워진 공지면 상세가 실패 화면으로 바뀐다 — spec §4)
- [x] T672 [US2] 상세 연결 in src/pages/service/notice/NoticeDetailPage.tsx — 수정 모달 open 제어 · `notice` 전체 전달
- [x] T673 [US2] [P] 테스트 — 기본값 · 삭제 표시/되돌리기 · `attachList` 본문 검증 · 첨부 무변경이면 `attachList` 없음 · 없는 공지 · 상세 페이지 저장→닫힘→갱신(`NoticeForm.test.tsx` 4건 · `NoticeDetailPage.test.tsx` 1건)

## Phase 4: US3 — 삭제

> **독립 테스트 기준**: 확인 → 삭제 → 목록 이동, 목록에서 사라진다. 이미 삭제된 공지는 토스트 + 재조회.

- [x] T674 [US3] 🔴 **삭제** in src/pages/service/notice/NoticeDetailPage.tsx — 🔴 **계획 수정**: 훅 파일을 따로 두지 않고 페이지 안 `useMutation`(029 `PointDetailPage` 선례, 소비처 1곳). 이동 먼저(replace) → `detail` 제거 → `lists` 무효화 · 실패 시 상세 재조회 · 처리 중 삭제 버튼 비활성
- [x] T675 [US3] [P] 테스트 in src/pages/service/notice/__tests__/NoticeDetailPage.test.tsx — 삭제 → 목록 이동 · 서버에서 사라짐 · 취소 시 미전송 · 이미 지워진 공지 → 상세에 머묾 + 실패 화면

## Phase 5: 마무리

- [x] T676 `npm run verify` + `npm run test` (병렬)
- [~] T677 브라우저 확인(mock ✅ 사용자 직접 — 등록·수정·삭제) + 🔴 **dev:real**(⚠️ 미완 → 이월 ①)
- [x] T678 캡쳐 — `notice--작성` · `notice--수정`(삭제 표시 1건) 신설. 같은 테스트의 목록·상세는 픽셀 차이 0
- [x] T679 문서 — `patterns.md` multipart 절 · `data-model.md` §5-3 · `screens.md` §1-5 · `roadmap.md`
- [x] T680 DoD 점검 + `## 다음 spec으로 이월`

---

## DoD 점검 (2026-10-21)

**14/15 + 부분 1** — #12 브라우저 확인은 mock 만(사용자 직접), dev:real 미완.

## 다음 spec으로 이월

### ① dev:real 화면 확인 (#12 · 026 T592 함께)

`npm run dev:real` + 현장관리자로 사업장 7 → `/notice` 작성(첨부 이미지·파일 각 1) → 상세 수정(첨부 1 삭제 + 1 추가) → 삭제.
🔴 **만든 공지만** 지운다. 본사 계정으로 사업장 6 → `/notice/56`(026 T592 — 이미지 404 폴백).

### ② 백엔드 회신 대기

- **B-42** 앱 푸시 — 오면 체크박스를 되살릴지 판단(OQ-040-A)
- **OQ-19** 첨부 한도·허용 확장자 공식값 — 오면 `lib/noticeAttach.ts` 한 곳만 고친다(`hwp` 포함 여부)
- **B-43** 수정 첨부 형식 — 바뀌면 `toUpsertNoticeFormData` 한 곳만 고친다

### ③ multipart 두 번째 소비처 — 근무자 사진(`AddUser`·`UpdateUser`)

`toFormData` 는 공지 폴더에 있다. **두 번째 소비처가 생기면** `lib/` 공용으로 옮긴다(지금은 수요 1건 — A6).

