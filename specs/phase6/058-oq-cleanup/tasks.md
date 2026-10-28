# 058-oq-cleanup tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 057 이후 남은 OQ · 미개발 점검에서 나온 정리.
> 🔴 §0 조건 1(mock 변경 없음)의 예외 — mock 2곳은 **실서버 실측에 맞추는 것**이고 앱 동작은 바뀌지 않아 사용자 결정(2026-10-28)으로 경량에 넣었다.
> 입력: 사용자 결정(2026-10-28) + B-15 실서버 재측정(같은 날, 테스트 지점 87).
> 태스크 ID 는 057 다음부터(T1031~).

---

## 점검 항목 ↔ 결정

| # | 항목 | 지금 | 결정 |
|---|---|---|---|
| 1 | 비밀번호 찾기 | ✗ 미개발(명세 없음) | **만들지 않음** — 상위 담당자가 바꿔 준다(근무자 041 · 관리자 056) |
| 2 | 순찰지점 목록 페이지네이션 OQ | 열림 | 종결 — 서버 페이징 + `AppPagination` 이미 있음 |
| 3 | 헬스체크 · 비상연락망 IA OQ | 열림 | 종결 — 사업장 상세에서 카드가 따로 놓였다(044 · 057) |
| 4 | OQ-045-A 회사(루트) 그룹 할당 | 미실측 · 표시만 | 종결 — 서버 예비 구조. **프론트는 회사를 바꾸지 않는다**(이미 막혀 있음 — 이름 · 삭제 · 할당 변경 없음) |
| 5 | OQ-049-A 순찰 기록 mock 미완료 행 | 모든 행 `QR`/`NFC` | 실측대로 — 미완료 `authMethod: null` · `authMethodName: ''` |
| 6 | B-15 지점 수정 시 값 비우기 | 서버가 `null`·`''` 무시(설명이 안 지워짐) | ✅ **서버 해소 확인** — mock · 주석 · 문서 반영. 프론트 요청은 그대로(원래 `memo: null` 을 보냈다) |
| - | 사업장 전환(레일 버튼) | 로그아웃 → 재로그인 | 별도 작업(새 spec) — 여기서 하지 않음 |

### B-15 재측정 (2026-10-28, 지점 87 · 현장 계정)

| 보낸 것 | 결과 |
|---|---|
| `memo: ""` | 200 · 지워짐 |
| `memo: null` | 200 · 지워짐 |
| `authMethod: 9` + `nfcTagId: null` | 200 · 지워짐 |
| `authMethod: 9` + `nfcTagId: ""` | 200 · 지워짐 |
| 복원 `memo: "설명원본2"` | 200 · 원래 값. TAG ID(예전 시험 잔여 `STEC-T6-CHANGED-03`)는 되돌리지 않음 — QR 지점이라 쓰이지 않는다 |

미재측정: 좌표 비우기(웹 입력란 없음) · QR→NFC 시 `qrCode` 잔존.

---

## Phase 1: 수정

- [x] T1031 [P] mock 미완료 행 in src/mocks/handlers/points.ts(`buildHistory`) — `authMethod: null` · `authMethodName: ''`(OQ-049-A)
- [x] T1032 [P] mock 값 비우기 in src/mocks/handlers/points.ts(`patchText` · `UpdatePoint` 주석) — 생략만 유지, `null`·`''`·공백은 비움(B-15 해소)
- [x] T1033 [P] 주석 정정 — `PointDetail.tsx` · `useChangeAuthMethod.ts`(QR 전환 때 `nfcTagId` 를 안 보내는 이유 = 재사용) · 코스 쪽 "지점과 반대" 6곳(`updateCourse.ts` · `CourseInfo.tsx` · `EditCourseForm.tsx` · `updateCourseBody.ts` · `types/request.ts` · `mocks/handlers/courses.ts`)

## Phase 2: 검증 · 문서

- [x] T1034 문서 — `api-spec.md`(B-15 해소 · UpdatePoint · UpdateCourse · 전환 표 · OQ-045-A) · `screens.md`(지점 추가/수정 △ 사유 · 비밀번호 찾기 행 · §6 OQ 3건) · `roadmap.md`(058 행 · Phase 6 남은 항목) · 049 이월 OQ-049-A
- [x] T1035 `npm run verify` · `npm run test`
- [x] T1036 브라우저 확인(mock) — 지점 수정 모달에서 설명 지우고 저장 → 비어 있음 · 근무자 상세 순찰 기록 미완료 행에 인증수단 글자 없음 (사용자)
