# 055-mobile-review tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 053 · 054 이후 모바일 폭 점검에서 나온 수정.
> 입력: 사용자 점검 메모(2026-10-27) + 결정(같은 날 — 타임라인 `xl` 미만만 · 근무자 추가 순서 관리자와 동일 · `이 인증` 표시 · 지점 상세 목록은 그대로 · 배치관리 카드).
> 태스크 ID 는 054 다음부터(T978~).

---

## 점검 메모 ↔ 결정

| # | 화면 | 지금 | 결정 |
|---|---|---|---|
| 1 | 순찰이력 › 코스 순찰 상세 › 지점 인증 내역 | 7칸 표, 좁은 폭에서 옆으로 밀어야 읽힘 | `xl` 미만 세로 타임라인 |
| 2 | 순찰이력 › 지점 인증 상세 › 이 지점의 최근 인증 | 강조 = 지금 보는 인증. 색만으로는 "순찰기록이라 강조됐다" 로 읽힘 | 강조 행에 `이 인증` 글자 |
| 3 | 지점 상세 › 순찰 인증 기록 | 바 · 강조 없음 | 그대로 — 지금 보는 인증이 없어 강조 대상이 없다 |
| 4 | 근무자 추가 | 비밀번호 확인 없음 · 이름 → 사번 → 연락처 → 소속 → 비밀번호 | 관리자 추가와 같게 — 이름 · 연락처 → 사번 → 초기 비밀번호 → 비밀번호 확인 → 소속 |
| 5 | 배치관리 탭 | 가로 스크롤 시 세로 스크롤바 · 스크롤바 노출 | 세로 넘침 제거 · 스크롤바 숨김 |
| 6 | 배치관리 목록 | 목록 중 유일하게 카드 없음 | 카드 — 요청: 이름 + 요청일 / 경로 / 기간 / [승인][반려] · 이력: 이름 + 상태 / 경로 / 기간. **사유 없음**(사용자 결정 — 실제로 비어 온다) |
| 7 | 본사 관리그룹 선택 | `xl` 미만 좌측 시트 | 아래 시트 |
| 8 | 본사 관리그룹 편집 | [완료] = 닫기만(✕ 와 같음) | 삭제 — 추가 · 이름 변경 · 삭제는 각자 확인에서 바로 저장 |
| - | 키워드 설정 | 명세서 한 줄뿐 · 목업 · API · 화면 없음 | 해당 없음(053 점검 목록 오기재) |

---

## Phase 1: 수정

- [x] T978 [P] [US1] 타임라인 in src/features/patrol-zones/components/detail/CheckDetailTimeline.tsx(신규) + CheckDetailTable.tsx — 표 `hidden xl:block` · 타임라인 `xl:hidden`. 순번 칩 · 지점 · 시각 · 뱃지 · 구간 · 기록 펼침 버튼(행 전체가 아니라 버튼 — 스크롤 중 닿기만 해도 열리지 않게)
- [x] T979 [P] [US1] `이 인증` in src/features/patrol-points/components/detail/PointHistoryRecentCard.tsx
- [x] T980 [P] [US1] 근무자 추가 in src/features/workers/form/{schema.ts,AddWorkerForm.tsx} — `addWorkerFormSchema`(확인 칸 + 일치 검사). `addWorkerSchema` 는 그대로(관리자 스키마가 `.extend` 한다) · 문구 `초기 비밀번호` 로 통일
- [x] T981 [P] [US1] 배치 탭 in src/features/deployments/components/DeploymentBoard.tsx — 바닥선 `border-b` → 안쪽 그림자 · 탭 `-mb-px` 제거(1px 세로 넘침이 세로 스크롤바를 켰다) · `overflow-y-hidden` · `scrollbar-hidden`
- [x] T982 [P] [US1] 아래 시트 in src/features/groups/components/GroupFilterButton.tsx — `side="bottom"` · `max-h-[80vh]` · 위 모서리 둥글게
- [x] T983 [P] [US1] 완료 버튼 삭제 in src/features/groups/components/GroupEditDialog.tsx
- [x] T984 [US1] 배치관리 카드 in src/features/deployments/components/{DeploymentRequestCard,DeploymentHistoryCard}.tsx(신규) + DeploymentBoard.tsx — `renderCard` 3곳 · 요청 카드 버튼은 `DeploymentRequestActions stretch`(폭 절반씩 · `h-10`). 행 클릭이 없어 카드가 `div` 라 안에 버튼 가능
- [x] T989 [US1] 탭 줄 위치 in DeploymentBoard.tsx — 고른 탭이 줄 밖이면 탭 줄만 넘긴다(320px `?tab=out` 에서 `전출 이력` 이 숨었다). `scrollIntoView` 는 페이지까지 움직여 쓰지 않는다 · 대기 건수가 늦게 와 탭이 넓어지면 다시 맞춘다

## Phase 2: 검증 · 문서

- [x] T985 테스트 — 타임라인(순서 · 구간 · 펼침) · 표 단정은 `table` 안으로 좁힘(jsdom 은 둘 다 그린다 — 배치 테스트 2파일에 `findInTable` 등 헬퍼) · `이 인증` · 근무자 비밀번호 확인 불일치 · 근무자 목록 추가 흐름에 확인 칸 입력
- [x] T986 캡쳐 390 · 1280 — 타임라인 · 탭(세로 넘침 0) · 근무자 추가 · 최근 인증 · 아래 시트 · 관리그룹 편집 · 배치 카드 320 · 390(문서 폭 = 화면 폭) · 320 탭 위치(페이지 세로 이동 0)(임시 스크립트, 확인 후 삭제)
- [x] T987 문서(`patterns.md` §14 · `roadmap.md` 055 행) · `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) · `npm run test` 1463/1463
- [x] T990 [US1] 사용자 조정(2026-10-27) — 타임라인: 시각을 왼쪽으로 · 번호 · 지점명 + 인증수단 한 줄 · 결과 · 시간초과 · 구간은 아래 줄 · **완료는 뱃지 대신 번호 원 녹색**(미완료 빨강 + 뱃지 · 그 외 회색 + 뱃지 · 원에 결과 `sr-only`). 배치 카드 버튼: 폭 절반씩 `h-10` → 표와 같은 `h-8` 을 기간 줄 오른쪽(좁으면 다음 줄 오른쪽) · `DeploymentRequestActions` 의 `stretch` 제거. 캡쳐 320 · 390
- [x] T988 브라우저 확인(사용자)
