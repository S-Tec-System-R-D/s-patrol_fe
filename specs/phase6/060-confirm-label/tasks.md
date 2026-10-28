# 060-confirm-label tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 059 OQ-059-C 해소.
> 입력: 확인 모달 13곳 전수 점검(2026-10-28) + 사용자 결정(같은 날 — 규칙대로 3곳 맞춤).
> 규칙: `patterns.md:111` "확인 버튼 라벨: 액션 이름 그대로". `AppAlertDialog` 기본값이 `'확인'` 이라 지정하지 않은 곳만 어긋났다.
> 태스크 ID 는 059 다음부터(T1054~).

---

## 점검 결과 ↔ 결정

| 화면 | 제목 | 전 | 후 |
|---|---|:-:|:-:|
| 현장 › 공지사항 상세 › 삭제 | 공지를 삭제하시겠습니까? | 확인 | **삭제** |
| 현장 › 순찰지점 상세 › 삭제 | 지점을 삭제하시겠습니까? | 확인 | **삭제** |
| 현장 › 근무자 상세 › 삭제 | 근무자를 삭제하시겠습니까? | 확인 | **삭제** |
| 나머지 10곳(코스 삭제 · 코스 토글 2 · NFC→QR · 반려 · 사업장 · 관리그룹 · 관리자 삭제 · 로그아웃) | — | 이미 액션 이름 | 그대로 |

제목(질문형) · 취소 버튼(`취소`)은 13곳 모두 같다.

---

## Phase 1: 수정

- [x] T1054 [P] 확인 버튼 `actionLabel="삭제"` in src/pages/service/{notice/NoticeDetailPage,points/PointDetailPage,users/UserDetailPage}.tsx

## Phase 2: 검증 · 문서

- [x] T1055 테스트 — `PointDetailPage.test.tsx` 확인 클릭을 모달 안 `삭제` 로 · 공지 · 근무자 상세 테스트의 `/삭제|확인/` → `'삭제'`(라벨을 고정) · e2e S3(`e2e/flow-service.pw.ts`) `확인` → `삭제`
- [x] T1056 `npm run verify` · `npm run test` 1481/1481 · `npm run e2e` 32/32(S3 = 공지 삭제를 브라우저에서 확인)
- [x] T1057 문서 — `roadmap.md` 060 행 · 059 OQ-059-C 해소 표기
