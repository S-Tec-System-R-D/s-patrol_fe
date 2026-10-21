# 041-worker-write spec

> 위험도: **B** (`screens.md` §1-4 "근무자 추가 / 수정 (모달)" — B)
> 관련 화면: 근무자 목록 `/users`(추가 모달) · 근무자 상세 `/users/:userSeq`(정보 수정 · 비밀번호 변경 · 삭제)
> Phase: `roadmap.md` Phase 4 — `038-workers` 이월 ② "변경계 전환"
> 목업: 없음 — 038 화면의 모달을 그대로 쓴다

---

## 0. Carry-over

### 직전 근무자 spec(`038-workers`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ② `AddUser`·`UpdateUser`·`RemoveUser` WF-1-0 실측 | ✅ **완료(2026-10-21)** — `api-spec.md` §5-1-B "근무자 3종". B-41 ① 해소로 현장관리자 토큰으로 쟀다 |
| ② OQ-038-C 비밀번호 | ✅ **결정**(사용자 ①): 관리자가 **새 비밀번호를 직접 지정**(`UpdateUser.loginPw`). 🔴 **정보 수정과 다른 버튼** |
| ② 추가 폼 권한 선택(`AddUser.codeSeq`) | ✅ **결정**(사용자 ②): **근무자(7) 고정**, 입력 없음. 🔴 실측상 빼면 500 이라(B-44) 항상 보낸다 |
| ② 사진(`image`·`isRemove`) | ✅ **결정**(사용자 ③): **범위 제외** — 화면에 사진 표시처 0건, URL 404(B-40) |
| ② 폼 필드명 → swagger | **받는다** — `loginId`·`loginPw`·`name`·`phone` |
| ① B-41 ② 상세 `codeName` | ⚠️ **관측됨**(2026-10-21) — 기본정보 카드 권한 행은 **범위 외**(이월). 타입만 응답 그대로 넓힌다 |
| 040 이월 ③ multipart 두 번째 소비처 | **받는다** — `toFormData` 를 `src/lib/` 로 옮긴다 |

---

## User Stories

- **US1.** 현장관리자가 목록에서 **근무자를 추가**한다 — 이름 · 사번 · 연락처 · 초기 비밀번호. 저장하면 목록에 나온다.
- **US2.** 현장관리자가 상세에서 **근무자 정보를 수정**한다 — 이름 · 연락처.
- **US3.** 현장관리자가 상세에서 **비밀번호를 변경**한다 — 새 비밀번호 지정(정보 수정과 별도 버튼).
- **US4.** 현장관리자가 상세에서 **근무자를 삭제**한다 — 확인 후 삭제되고 목록으로 돌아간다.

---

## 1. 목적

038 은 근무자를 **조회만** 서버로 옮겼고 추가·수정·비밀번호·삭제는 콘솔 스텁이다. 본 spec 은 넷을
실서버 API 로 연결한다. 🔴 **서버가 입력값을 거의 검사하지 않는다**(B-45 — 비밀번호 `12` 도 저장된다)
→ **화면 검증이 사실상 유일한 방어선**이다. 규칙은 로그인과 같게 둔다.

---

## 2. I/O

### 2-1. API (실측 확정 — `api-spec.md` §5-1-B 근무자 3종)

| API | 요청(`multipart/form-data`) | 응답 |
|---|---|---|
| `POST User/W/sign/AddUser` | `siteSeq` · **`codeSeq: 7`** · `loginId` · `loginPw` · `name` · `phone` | `data: true` — 🔴 ID 없음 |
| `POST User/W/sign/UpdateUser` | `userSeq` + 바꿀 것만(`name`·`phone` **또는** `loginPw`) | `data: true` |
| `DELETE User/W/sign/RemoveUser` | 쿼리 `?userSeq` | `data: true` |

```ts
interface AddUserRequest {
  siteSeq: number
  codeSeq: number      // 🔴 항상 7(근무자) — 빼면 500(B-44)
  loginId: string
  loginPw: string
  name: string
  phone: string        // 🔴 숫자만 보낸다 — 서버는 보낸 그대로 저장한다(B-45). 기존 데이터가 숫자만이다
}
interface UpdateUserRequest {
  userSeq: number
  name?: string
  phone?: string
  loginPw?: string
}
// 사진(`image`·`isRemove`)은 보내지 않는다 — 범위 제외(사용자 ③)
```

### 2-2. 응답 타입 갱신 (B4 — 실측 그대로)

`UserDetail` 에 **`codeName: string`** 추가 · `deviceType: string | null`. 화면에는 아직 쓰지 않는다.

### 2-3. 화면

**추가 모달**(목록 필터 줄 끝, 038 그대로) — 이름 · 사번 · 연락처 · 소속 사업장(읽기 전용) · 초기 비밀번호.
**정보 수정 모달**(상세 머리 "수정") — 이름 · 연락처 · 소속 사업장(읽기 전용).
**비밀번호 변경 모달**(상세 머리 "비밀번호 변경" — 구 "비밀번호" 초기화 확인창을 바꾼다) — 새 비밀번호 · 새 비밀번호 확인.
**삭제**(상세 머리 `AppAlertDialog`) — 확인 → 삭제 → 목록(replace).

**검증(zod)** — 🔴 로그인 규칙과 같다(`auth/form/schema.ts`)
- 사번: 1~8자 / 비밀번호: 8자 이상 + 영문·숫자·특수 각 1+ / 연락처: `010-0000-0000`(기존) / 이름: 2자 이상(기존)

**성공 처리** — 공지(040)와 같다
- 추가 → 닫힘 + 토스트 + `lists` 무효화 · 목록에 머문다(ID 없음)
- 정보 수정 → 닫힘 + 토스트 + `lists`·`detail` 무효화
- 비밀번호 → 닫힘 + 토스트(무효화 없음 — 화면 값이 바뀌지 않는다)
- 삭제 → 이동 먼저(replace) → `detail` 제거 → `lists` 무효화

---

## 3. 제약

### 기술 제약

- 재사용: `AppDialog` · `AppAlertDialog` · `AppInput` · 전역 `MutationCache` 오류 토스트 · `formatPhone` · `getSiteSeq`.
- 이동: `features/notice/lib/formData.ts` 의 `toFormData` → **`src/lib/formData.ts`**(소비처 2곳). 공지 전용 `toUpsertNoticeFormData` 는 공지에 남긴다.
- 신설: `features/workers/api/{addUser,updateUser,removeUser}.ts` · `form/PasswordForm.tsx`.
- MSW `mocks/handlers/users.ts` 에 쓰기 3종 — **상태 보유** + `resetUserStore`(사번 중복 400 · 없는 ID 400 · 삭제 후 상세 404).
- 🔴 **비옵티미스틱** · **성공해야 모달이 닫힌다**.

### 비즈니스 규칙

- 추가는 **근무자(7)만** — 현장관리자 생성 수단을 화면에 두지 않는다.
- 🔴 **본인 계정은 삭제할 수 없게** 한다 — 목록에 관리자도 섞여 온다(038). `useMe().userSeq` 와 같으면 삭제 버튼 비활성.
- 사번 중복은 서버 문구("이미 사용중인 아이디입니다.")가 그대로 토스트로 나온다 — 따로 처리하지 않는다.
- 사번은 수정할 수 없다(요청 필드 없음).

---

## 4. 엣지 케이스

| 경우 | 처리 |
|---|---|
| 저장 연타 | 제출 버튼 `isPending` 동안 비활성 — 요청 1회 |
| 사번 중복 | 400 래퍼 → 전역 토스트(서버 문구) · 모달 유지 · 입력 유지 |
| 연락처 하이픈 | 입력은 `010-0000-0000`, 전송은 숫자만 |
| 비밀번호 확인 불일치 | zod `refine` — 확인 칸에 에러 |
| 다른 관리자가 이미 지운 근무자 수정·삭제 | 400 래퍼 → 토스트 + 상세 재조회(404 → 실패 화면) |
| 본인 계정 상세 | 삭제 버튼 비활성 |
| 사업장 미선택 | 추가 버튼 비활성 |

---

## 5. 완료 조건 (DoD)

**기반**
- [ ] 1. 요청 타입이 swagger 이름 — 폼 스키마의 `initialPassword` 0건
- [ ] 2. `toFormData` 가 `src/lib/` 에 있고 공지·근무자가 함께 쓴다
- [ ] 3. `UserDetail` 에 `codeName` · `deviceType: string | null`
- [ ] 4. MSW 쓰기 3종 + 상태 보유 + reset

**추가 (US1)**
- [ ] 5. 추가 → 목록에 나온다 · `codeSeq: 7` · 연락처 숫자만 · 모달 닫힘 · 토스트
- [ ] 6. 로그인과 같은 사번·비밀번호 규칙 · 사번 중복 시 모달 유지 · 연타 1회

**정보 수정 (US2)**
- [ ] 7. 이름·연락처만 보낸다(비밀번호 없음) · 상세·목록 갱신

**비밀번호 (US3)**
- [ ] 8. 별도 버튼·모달 · `loginPw` 만 보낸다 · 확인 불일치 거부

**삭제 (US4)**
- [ ] 9. 확인 → 삭제 → 목록 이동 · 사라짐 · 본인 계정은 비활성

**마무리**
- [ ] 10. `npm run verify` + `npm run test` green
- [ ] 11. 브라우저 확인(mock) + dev:real(만든 계정만 지운다)
- [ ] 12. 캡쳐 — 추가 · 정보 수정 · 비밀번호 변경 모달
- [ ] 13. 문서 — `data-model.md` · `screens.md` §1-4 · `roadmap.md`
- [ ] 14. `## 다음 spec으로 이월`

---

## Open Questions

- **OQ-041-A 서버 검증 부재**(B-45) — 앱·다른 경로로는 약한 비밀번호·형식 틀린 연락처가 들어온다. 백엔드 요청.
- **OQ-041-B `codeSeq` 필수 여부**(B-44) — 지금은 항상 7 을 보낸다.
- **OQ-041-C 상세 권한 행** — `codeName` 이 생겼다. 기본정보 카드에 붙일지는 이월(B-41 ② 의 `createDt` 와 함께).
