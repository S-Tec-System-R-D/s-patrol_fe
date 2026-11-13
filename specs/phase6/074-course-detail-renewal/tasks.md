# 074-course-detail-renewal tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 073 T1226 다음 — **T1230~**.

## Phase 1 — 데이터

- [x] T1230 회차 집계 in src/features/courses/lib/courseRunStats.ts — 시간대별 개수 · 순찰 시간대 문구 · 근무자별(교대 양쪽 · 근무자 없음) + 단위 테스트
- [x] T1231 지점별 인증률 자리표시 in src/features/courses/lib/pointRateStub.ts — 🔴 OQ-074-A, API 없음
- [x] T1232 미인증 조회(`useUncheckedPoints`) · 이상 이력(`courseAlerts` · `CourseAlertList`) · 토글 확인 모달(`CourseToggleDialog`) 삭제

## Phase 2 — 화면

- [x] T1233 머리 `수정` · `⋯` 메뉴(삭제) in ZoneDetailPage.tsx
- [x] T1234 순찰 경로 카드 in CourseRouteCard.tsx — `CourseMapCard` 를 카드 없이 쓰는 모드 · `CoursePointList` 대체
- [x] T1235 기본정보 글자만 in CourseInfo.tsx · 수정 모달에 교대 · 사용 스위치 in EditCourseForm.tsx
- [x] T1236 시간대별 순찰 · 근무자별 카드 in CourseHourlyCard.tsx · CourseWorkerCard.tsx
- [x] T1237 최근 순찰 기록 in CoursePatrolLog.tsx — 10건 · 막대 · 누락 · 상태 + 초과 · 전체 보기 · 행 클릭
- [x] T1238 회차 상세 모달 in CourseRunDialog.tsx

## Phase 3 — 검증 · 문서

- [x] T1239 테스트 갱신(ZoneDetailPage · CourseInfo · CoursePatrolLog · 새 컴포넌트)
- [x] T1240 verify · test(1,526) · e2e(39 — S2 코스 이름 바꾸기는 머리 `수정` 으로 고침) · 캡처 1280 / 1600 / 390 · 회차 모달
- [x] T1242 다듬기 — 순찰 시간대는 하루를 고리로 보고 가장 긴 빈 구간을 뺀다(야간 순찰 23–10시) · 진행 중 회차는 누락 `-`
- [x] T1241 문서 — screens.md 코스 상세 행 · roadmap 074 행

## Phase 4 — 사용자 검토 반영 (2026-11-13)

- [x] T1243 기본정보 — `앱 코스 목록에 노출` 문구 삭제 · `수정` 을 머리에서 카드 제목 줄로(머리에는 `⋯` 만) in CourseInfo.tsx · ZoneDetailPage.tsx
- [x] T1244 편성 편집 → 모달(640px) · 바꾼 내용이 있으면 바깥 클릭 / Esc 에 `변경 내용을 버리시겠습니까?` · `취소` 는 묻지 않음 in ZoneDetailPage.tsx · CoursePointEditor.tsx(카드 틀 · 제목 제거, `onDirtyChange`)
- [x] T1245 순찰 경로 — 미사용 지점은 번호 자리 자물쇠 + 행 회색(뱃지 삭제) · 번호는 배열 위치(지도 핀과 같음, 1 · 2 · 🔒 · 4) · 미사용은 최저 인증률 강조에서 뺌 in CourseRouteCard.tsx
- [x] T1246 시간대별 — 시마다 바탕 칸 · 가장 많은 시만 진하게 · 6시간 점선 눈금 · 막대마다 툴팁 · `가장 많은 시간` 줄 in CourseRunStatCards.tsx
- [x] T1247 회차 모달 — 제목 `text-lg` + 상태 뱃지는 제목 오른쪽(AppDialog `titleSuffix` · `titleClassName`) · 순번 회색 · 누락은 빨강 · 진행 중이면 `남은 지점 n`(누락 아님) · 지점 기록 0건이면 `이 회차의 지점 기록이 없습니다` · mock 102 지점 3건 채움
- [x] T1248 근무자별 — 🔴 인증률은 혼자 끝낸 회차만 · 교대 회차는 회차 수에만(`· 교대 n`) — 회차 합계를 양쪽에 넣으면 3곳 찍고 넘긴 사람도 6/6 이 된다(사용자 결정 ③) in courseRunStats.ts
- [x] T1249 verify 0 · test 1,526 · e2e 39 · 캡처(scratchpad course/r2-*)

## Phase 5 — 2차 검토 반영 (2026-11-13)

- [x] T1250 회차 모달 아래 줄 — `‹ ›` 아이콘 버튼 + `i / n` 왼쪽 · `상세 보기 →` 는 오른쪽 끝(AppLinkButton 모양 · 링크 유지) · 키보드 ← / → in CourseRunDialog.tsx
- [x] T1251 머리 `⋯` 흰 배경(이 화면만 · 공용 AppIconButton 그대로) in ZoneDetailPage.tsx
- [x] T1252 편성 편집 행 개편(Atlassian · PatternFly · WCAG 2.2 끌기 대안 참고) — 경로 카드와 같은 번호 동그라미 · 미사용 🔒 + 행 회색 · 인증수단 작은 글자 · 상자 → 구분선 · 행 `⋯` 메뉴(위로 · 아래로 이동 · 편성에서 제거) · 끄는 행은 그림자 카드(DragOverlay, 🔴 body 포털 — 모달 transform 때문에 어긋남) + 놓일 자리 점선 칸 · 번호는 끄는 동안 바로 바뀜 · 구간시간 `[ n 분 ]` · 640px 미만 두 줄 in CoursePointEditor.tsx + 테스트(메뉴 이동)
- [x] T1254 편성 편집에서 인증수단 삭제(여기서 못 바꾸는 지점 속성 · 순서와 무관 — 경로 카드 · 지점 추가 후보에는 남김) · 모든 폭 한 줄(390 에서 이름 약 120px)
- [x] T1253 verify 0 · test 1,527 · e2e 39 · 캡처(scratchpad course/r4-*)
