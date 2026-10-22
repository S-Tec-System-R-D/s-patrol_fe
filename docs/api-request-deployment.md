# 배치관리 API 요청 — 백엔드 전달용

> 작성 2026-10-21 (`spec 039`) · 갱신 2026-10-22 (`spec 042` — 구현된 API 실측 후) · **2026-10-22 2차 — 상태 필터·복귀 대기 건수 반영 확인**
> 화면: 현장 사이트 `/deployments` · 근무자 상세 `/users/:userSeq`.
> 실측 결과: [`api-spec.md`](./api-spec.md) §5-1-B "배치 10종" · B-46 ~ B-48.

## 🔴 남은 요청 (2026-10-22 재실측 기준)

- `GetAssignmentInHistory` / `GetAssignmentOutHistory` - **사유**(`reason`)
- `GetAssignmentReturnList` - **복귀일** — 근무자가 앱에서 복귀 요청할 때 입력받아야 생긴다(앱 쪽 API)

## 함께 부탁드리는 것 (B-48)

- `AssignmentApprove`·`AssignmentReturnApprove` 에서 `approved` 를 빼면 **반려로 처리**된다(bool 기본값) — 400 이 안전하다. 웹은 항상 보낸다.
- 배치 요청 종료일 < 시작일이면 **500** 이다(앱 경로) — 400 으로.
- 오류 문구 오타: `"이미 대치 신청 중이거나 대치 근무 중인 사용자입니다."` → `"배치"`.

## 참고 — 요약 숫자의 의미

✅ `pendingReturnCount` 반영(2026-10-22) — 복귀 요청 탭 뱃지를 이 값으로 바꿨다(원소속 사업장 기준).

`GetAssignmentCount` 의 `outCount`·`inCount` 는 **시작 전(배치예정)도 센다**(실측). 화면은 "배치예정 포함" 으로 표기했다.
"지금 나가/와 있는 인원" 으로 바꿀 계획이면 알려 주세요 — 문구를 되돌린다.

---

## 반영 현황 (2026-10-21 원 요청 → 2026-10-22 실측)

| # | 원 요청 | 결과 |
|:-:|---|---|
| 1 | 배치 요청 목록 | ✅ `GetAssignmentList` — 배열(페이징 없음) · 근무자 ✅(2026-10-22) |
| 2 | 배치 요청 승인 | ✅ `AssignmentApprove`(`approved: true`) |
| 3 | 배치 요청 거부(사유 필수) | ◩ `AssignmentApprove`(`approved: false`) — **사유 필드 없음** → 화면에서 사유 입력 제거(사용자 결정) |
| 4 | 복귀 요청 목록 | ◩ `GetAssignmentReturnList` — 근무자 ✅ · **복귀일 없음** |
| 5 | 복귀 요청 승인 | ✅ `AssignmentReturnApprove` |
| 6 | 복귀 요청 거부(사유 필수) | ◩ 같은 API `approved: false` — 사유 없음 |
| 7 | 전입 이력(이름 검색 · 상태 필터) | ◩ `GetAssignmentInHistory` — 이름 검색 ✅ · 상태 값 ✅ · 상태 필터 ✅(2026-10-22 2차) · **사유 ❌** |
| 8 | 전출 이력 | ◩ `GetAssignmentOutHistory` — 7번과 같다 |
| 9 | 근무자별 배치 이력 | ✅ `GetAssignmentHistory?userSeq` · 상태 필터 ✅ |
| 10 | 배치 현황 요약 | ✅ `GetAssignmentCount` — 복귀 대기 건수 ✅ `pendingReturnCount`(2026-10-22 2차) · 배치예정 포함 |
