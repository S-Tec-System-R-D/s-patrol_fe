# 079-worker-detail-renewal tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 078 T1300 다음 — **T1301~**.

## Phase 1 — 데이터

- [x] T1301 회차 목록 훅 — `GetCourseHistory`(siteSeq · 14일 · userName) → `userList` 의 `userSeq` 로 거르기(D4)
- [x] T1302 집계 순수 함수 — 요약 5칸 · 날짜별 묶음 · 막대 색(정상 / 시간초과 / 미완료 포함) + 단위 테스트
- [x] T1303 mock — `GetCourseHistory` `userName` 부분 일치 · 근무자 회차(교대 · 미완료 · 특이사항 · 시간초과 섞기)

## Phase 2 — 화면

- [x] T1304 머리 — 이름 · 근무 상태 · 사업장명 · `⋯`(정보 수정 · 비밀번호 변경 · 근무자 삭제)
- [x] T1305 왼쪽 패널 — 기본정보 3행(근무 상태 삭제) + 배치 이력 이동
- [x] T1306 요약 5칸 + 14일 막대(숫자 없음 D1 · 클릭 → 날짜 필터 URL · 전체 보기)
- [x] T1307 회차 행(접힘) — 시간 · 코스 · 비율 막대 · 인증 n/m · 교대 · 시간초과 · 소요
- [x] T1308 회차 펼침 — CheckDetails · HandOvers(펼칠 때만) · 지점별 건너뜀/미인증 · 메모 · 교대 점선 · 순찰 상세 링크
- [x] T1309 `UserPatrolCard`(지점 이력 8건) 정리 · `전체 기록` → 코스 순찰이력

## Phase 3 — 검증 · 문서

- [x] T1310 테스트 — 페이지 · 거르기(동명 제거) · 막대 필터 · 펼침
- [x] T1311 verify · test · e2e · 캡처(1280 · 390)
- [x] T1312 문서 — screens.md 근무자 행 · roadmap 079 행 · 시안 파일 함께 커밋

## Dependencies & Execution Order

- T1301 · T1302 · T1303 → T1306 · T1307 → T1308
- T1304 · T1305 는 독립
- T1309 는 T1307 뒤 · Phase 3 는 마지막
