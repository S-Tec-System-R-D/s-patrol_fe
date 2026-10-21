# 040-notice-write spec

> 위험도: **B** (`screens.md` §1-5 "공지사항 작성 / 수정 / 삭제 (모달)" — B)
> 관련 화면: 공지 목록 `/notice`(작성 모달) · 공지 상세 `/notice/:noticeSeq`(수정 모달 · 삭제)
> Phase: `roadmap.md` Phase 3 — `026-notice` 이월 ① "변경계 전환"
> 목업: 없음 — 026 화면(테이블 목록 + 상세 페이지)의 모달을 그대로 쓴다

---

## 0. Carry-over

### 직전 공지 spec(`026-notice`) `## 다음 spec으로 이월` ① 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| `AddNotice`·`UpsertNotice`·`DeleteNotice` WF-1-0 실측 | ✅ **완료(2026-10-21)** — `api-spec.md` §5-1-B "공지 3종" |
| 첨부 업로드(multipart) + OQ-12 | 🔴 **받는다.** OQ-12 는 실측으로 해소(확장자/내용 기준) |
| 앱 푸시 발송(`sendAppPush`) | 🔴 **체크박스 제거**(사용자 결정 ①) — 요청 필드가 없다. ✅ **웹 범위 아님 확정**(사용자 2026-10-21 — 테이블에 컬럼 없음, B-42 철회) |
| 폼 필드명 `content` → swagger 기준 | **받는다** — `description` |
| `isPin`(상단 고정) 선택 | **받는다** — 체크박스 추가(사용자 결정 ②) |
| `data-model.md` §5-3 요청 타입 교체 | **받는다** |
| ② T592 실서버 화면 확인 | 본 spec 의 dev:real 확인과 **같이 본다** |

---

## User Stories

- **US1.** 현장관리자가 목록에서 **공지를 작성**한다 — 제목 · 본문 · 상단 고정 · 첨부(이미지/파일). 저장하면 목록에 나온다.
- **US2.** 현장관리자가 상세에서 **공지를 수정**한다 — 제목 · 본문 · 상단 고정을 바꾸고, 기존 첨부를 지우거나 새 첨부를 붙인다. 저장하면 상세·목록이 갱신된다.
- **US3.** 현장관리자가 상세에서 **공지를 삭제**한다 — 확인 후 삭제되고 목록으로 돌아간다.

---

## 1. 목적

026 은 공지를 **조회만** 서버로 옮겼고 작성·수정·삭제는 콘솔 스텁이다. 본 spec 은 그 셋을 실서버
API 로 연결한다. 공지는 **프로젝트의 첫 multipart 쓰기**(첨부)라 FormData 조립 규칙을 한 곳에 두고
`patterns.md` 에 등재한다 — 다음 multipart 화면(근무자 사진)이 같은 규칙을 쓴다.

---

## 2. I/O

### 2-1. API (실측 확정 — `api-spec.md` §5-1-B 공지 3종)

| API | 요청(`multipart/form-data`) | 응답 |
|---|---|---|
| `POST Notice/W/sign/AddNotice` | `siteSeq` · `title` · `description` · `isPin` · `file`(반복) | `data: true` — 🔴 **ID 없음** |
| `PATCH Notice/W/sign/UpsertNotice` | `noticeSeq` · `title` · `description` · `isPin` · `attachList[i].attachSeq`/`.isRemove`/`.files` | `data: true` |
| `DELETE Notice/W/sign/DeleteNotice` | 쿼리 `?noticeSeq` | `data: true` |

```ts
// 🔴 swagger 이름 그대로(B4). 파일은 File 로 받고 FormData 변환은 빌더가 한다
interface AddNoticeRequest {
  siteSeq: number
  title: string
  description: string
  isPin: boolean
  file: File[]
}
interface UpsertNoticeRequest {
  noticeSeq: number
  title: string
  description: string
  isPin: boolean
  removeAttachSeqs: number[]   // → attachList[i].attachSeq + isRemove=true
  newFiles: File[]             // → attachList[j].files + isRemove=false, 항목당 1파일
}
```

> ⚠️ `UpsertNoticeRequest` 의 `removeAttachSeqs`·`newFiles` 는 **화면용 모양**이다. 서버의 `attachList[]` 는
> 삭제 항목과 추가 항목이 한 배열에 섞이고 **추가는 항목당 1파일 + `isRemove=false` 필수**라(B-43) 그대로 들고 다니면
> 실수하기 쉽다 → **빌더 한 곳**에서 `attachList[]` 로 펼친다.

### 2-2. FormData 빌더 (신설 — 첫 multipart)

- `toFormData(fields, files)` 한 함수 — 원시값은 문자열로(`boolean` → `'true'/'false'`), 파일은 같은 키로 반복 append.
- `UpsertNotice` 는 별도 함수가 `attachList[i].*` 키를 만든다(삭제 먼저, 추가는 이어지는 인덱스).
- 🔴 `Content-Type` 을 **직접 넣지 않는다** — axios 가 boundary 를 붙인다(직접 넣으면 boundary 가 빠진다).
- `patterns.md` 에 "multipart 요청" 절로 등재.

### 2-3. 화면

**작성 모달**(목록 필터 줄 끝, 026 그대로) — 제목(필수) · 본문(필수) · **상단 고정 체크박스(기본 해제)** · 첨부 선택.
**수정 모달**(상세 머리) — 같은 폼, 기본값은 현재 값(`isPin` 포함). 기존 첨부 목록에 **삭제 표시**(되돌리기 가능) + 새 첨부 추가.
**삭제**(상세 머리 `AppAlertDialog`) — 확인 → 삭제 → 목록으로 이동.

**첨부 입력** — 이미지·파일을 **한 입력**으로 받는다(서버가 확장자로 나눈다). 선택한 파일은 이름·크기 목록 + 개별 제거.
- 허용: `png`·`jpg`·`jpeg`·`gif`·`webp`·`pdf`·`xlsx`·`docx`·`pptx`·`zip`·`txt`·`csv`(실측 통과 목록) — `accept` + 선택 시 검사.
- 🔴 **합계 28MB**(실측 추정 한도, OQ-19). 넘으면 선택 단계에서 막고 문구로 알린다(서버 400 은 사유가 안 나온다).

**성공 처리**
- 작성 → 모달 닫힘 + 토스트 + `noticeKeys.lists` 무효화. ID 를 주지 않으므로 **목록에 머문다**.
- 수정 → 모달 닫힘 + 토스트 + `lists`·`detail(noticeSeq)` 무효화.
- 삭제 → 토스트 + `lists` 무효화 + `detail` 제거 + 목록으로 navigate.

---

## 3. 제약

### 기술 제약

- 재사용: `AppDialog` · `AppAlertDialog` · `AppInput` · `AppCheckbox` · `AppButton` · 전역 `MutationCache` 오류 토스트(훅에서 중복 금지) · `getSiteSeq`.
- 신설: `features/notice/api/{addNotice,upsertNotice,deleteNotice}.ts` · `lib/formData.ts`(빌더) · 첨부 입력 컴포넌트(공지 폴더 안 — 수요 1건이라 공용화하지 않는다).
- MSW `mocks/handlers/notices.ts` 에 쓰기 3종 추가 — **상태 보유**(작성·수정·삭제가 목록·상세를 바꾼다, 023·039 선례 store + reset).
- 🔴 **비옵티미스틱** · **성공해야 모달이 닫힌다**(실패 시 입력 유지).

### 비즈니스 규칙

- 제목·본문 필수(swagger `required` · 서버는 제목만 ProblemDetails 로 막는다). 공백만은 거부(트림).
- 🔴 **수정으로 제목·본문을 비울 수 없다**(서버가 `''` 무시) — 폼이 필수라 화면에서 생기지 않는다.
- 상단 고정은 개수 제한 없음(서버 미검사) — 화면도 막지 않는다.
- 앱 푸시 UI 없음 — 웹 범위가 아니다(B-42 철회).

---

## 4. 엣지 케이스

| 경우 | 처리 |
|---|---|
| 저장 연타 | 제출 버튼 `isPending` 동안 비활성 — 요청 1회 |
| 첨부 합계 28MB 초과 | 선택 단계에서 거부 + 문구. 요청 보내지 않음 |
| 허용 밖 확장자 | 선택 단계에서 거부 + 문구 |
| 확장자만 맞고 내용이 다른 파일 | 서버 400 → 전역 토스트, 모달 유지 |
| 다른 관리자가 이미 삭제한 공지 수정·삭제 | 400 래퍼 → 토스트 + 상세 재조회(없는 공지 상태로 그려진다) |
| 수정 시 같은 첨부를 삭제 표시 후 되돌림 | 요청에 넣지 않는다 |
| 수정 시 바뀐 것 없음 | 그대로 보낸다(부분 갱신이라 무해) — 막지 않는다 |
| 사업장 미선택 | 작성 버튼 비활성(쿼리와 같은 기준) |

---

## 5. 완료 조건 (DoD)

**기반**
- [x] 1. 요청 타입이 swagger 이름(`description`·`isPin`·`file`)이다 — `content`·`sendAppPush` 0건
- [x] 2. FormData 빌더 단위 테스트 — boolean 문자열화 · 파일 반복 · `attachList[i]` 펼침(삭제 먼저 · 추가 항목당 1파일 + `isRemove=false`)
- [x] 3. `Content-Type` 수동 지정 0건
- [x] 4. MSW 쓰기 3종 + 상태 보유 + reset

**작성 (US1)**
- [x] 5. 작성 → 목록에 나온다(상단 고정이면 맨 위) · 모달 닫힘 · 토스트
- [x] 6. 상단 고정 기본 해제 · 첨부 선택/제거 · 확장자·용량 선택 단계 차단
- [x] 7. 실패 시 모달 유지 + 입력 유지 · 연타 1회

**수정 (US2)**
- [x] 8. 기본값이 현재 값(`isPin` 포함) · 기존 첨부 삭제 표시/되돌리기 · 새 첨부 추가
- [x] 9. 저장 → 상세·목록 갱신 · 모달 닫힘

**삭제 (US3)**
- [x] 10. 확인 → 삭제 → 목록 이동 · 목록에서 사라짐

**마무리**
- [x] 11. `npm run verify` + `npm run test` green
- [x] 12. 브라우저 확인(mock ✅ 사용자 직접 — 등록·수정·삭제) + **dev:real 확인** ✅(사용자, 2026-10-21)(작성→수정→삭제 자기 정리, 026 T592 함께)
- [x] 13. 캡쳐 — 작성 모달 · 수정 모달(첨부 있음)
- [x] 14. 문서 — `patterns.md` multipart 절 · `data-model.md` §5-3 · `screens.md` §1-5 · `roadmap.md`
- [x] 15. `## 다음 spec으로 이월`

---

## Open Questions

- ~~**OQ-040-A 앱 푸시**~~ — ✅ **해소**: 웹에서 표시할 필요가 없고 `notice` 테이블에 해당 컬럼도 없다(사용자 확인 2026-10-21). 되살리지 않는다.
- **OQ-040-B 첨부 한도 공식값** — OQ-19. 지금은 합계 28MB · 확장자 실측 목록으로 막는다. `hwp` 허용 여부 미확정(샘플 불완전).
- **OQ-040-C 첨부 URL 404**(B-40) — 수정 모달의 기존 첨부는 **이름·확장자로만** 보여 주고 미리보기를 하지 않는다(404 폴백 불필요).
