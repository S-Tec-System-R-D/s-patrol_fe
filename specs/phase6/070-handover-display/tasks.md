# 070-handover-display tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 입력: 사용자 결정(2026-11-04) — 이력 상세에 교대 이력을 보이고, 대시보드는 교대가 일어난 지점 위에 표시한다.
> 태스크 ID 는 069 다음부터(T1166~).

---

- [x] T1166 교대 이력 조회 in src/features/course-history — `GetCourseHistoryHandOvers` API · 타입 · 훅(교대가 있는 회차만) · mock
- [x] T1167 회차 상세 `교대 이력` 타임라인 in HandOverTimelineCard.tsx — `순찰 정보` 아래 카드 · 사람별 담당 구간(`handOverSegments` — 교대 위치로 나누고 처리한 지점만) · 받은 사람이 처리 없이 끝나면 `처리한 지점 없음` · 교대 위치는 사람 사이 · 구조는 HeroUI Timeline 참고(패키지 없음) · 교대 회차의 `순찰자` 줄은 `시작 순찰자` · 교대 시각은 응답에 없어 적지 않는다 · 교대 기록을 못 받으면 카드 없이 `교대 N회` 만 · 테스트(사용자 결정 2026-11-04 — 몇 명이 교대할지 몰라 줄이 아니라 카드)
- [x] T1168 api-spec — `HandOverRow` 실측 · OQ-11 해소 · `userList` 설명 정정
- [x] T1170 지점 인증 내역 타임라인(`xl` 미만) 번호 원을 교대 이력과 통일 in CheckDetailTimeline.tsx — 옅은 바탕 + 테두리(사용자 결정 2026-11-05) · 교대 시각은 서버 요청 없이 적지 않는다
- [x] T1171 지점 인증 내역 타임라인 배치 변경 in CheckDetailTimeline.tsx — 시각 왼쪽 칸 없앰 · 뱃지(결과 · 시간초과 · 인증수단)는 지점명 바로 옆 · 시각 · 구간은 지점명 아래(사용자 요청 2026-11-05 — HeroUI 모바일 참고, 확인 중)
- [x] T1172 뱃지 라운드 `rounded-md` in AppBadge.variants.ts(전체, 사용자 결정 2026-11-05)
- [x] T1173 메모 패널 코멘트형 in CheckDetailMemo.tsx — 연한 바탕 하나 · 메타 뱃지 · 왼쪽 바 · 타임라인 테두리 칸 없앰 · 시각 뺌(표 · 타임라인 · 지점 상세 공용)
- [x] T1169 대시보드 지점 위 교대 표시 — 진행 중에도 교대 기록이 나온다(회차 101) · 뱃지 위 `교대` · 교대가 있는 카드만 조회(키에 횟수) · 위치를 모르면 이름 옆 뱃지
- [x] T1174 🔴 버그 수정: 카드 순찰자 = 마지막 교대를 받은 사람 — `users` 는 사람별 1번이라 A → B → A 에서 B 로 나왔다(회차 101)
- [x] T1176 상태 글자 대비 in index.css — `success` · `warning` · `danger` 의 `-foreground` 를 4.5 이상으로 어둡게 · 뱃지 글자 굵기 `font-medium`(사용자 결정 2026-11-05) · mock 회차 101 교대 기록
- [x] T1175 대시보드 현재 위치 효과 in CourseStepper.tsx · index.css — 번호 원 안 퍼짐이 거의 안 보여 뱃지 전체 바깥 링(4px · 2초)으로 변경 · 멈춘 회차는 끈다 · 움직임 줄이기 설정이면 끈다(사용자 결정 2026-11-05)
