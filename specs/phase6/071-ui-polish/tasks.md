# 071-ui-polish tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 입력: 사용자 결정(2026-11-05) — 공용 버튼 · 타이틀 아이콘 · 빈 화면 정리.
> 태스크 ID 는 070 다음부터(T1177~).

| 항목 | 결정 |
|---|---|
| 삭제 버튼 | 연한 빨강 바탕 + 테두리 · 글자 `danger-foreground` · 호출부 `bg-card` 삭제 |
| 버튼 아이콘 | `AppButton` 전체 선 굵기 2(크기 그대로) |
| 최근 순찰 기록 결과 아이콘 | 연한 테두리 |
| 상세 타이틀 아이콘 | 44px `primary` 타일 · 제목 + 부제 왼쪽 |
| 목록 빈 화면 | 카드 틀 없이 남은 높이 세로 중앙 · 검색 결과 없음 · 오류도 같게 · 빈 화면 안 추가 버튼 없음 |
| 빈 화면 | 움직임 없음 · 기본 겹친 카드 · 순찰 기록 · 코스가 없을 때만 순찰 경로 그림 · 직접 그린 작은 표시 4곳도 `AppEmpty` 로 통일 |

---

- [x] T1177 삭제 버튼 in AppButton.tsx — `destructive` 연한 빨강 · 상세 5곳 `bg-card` 삭제
- [x] T1178 버튼 아이콘 선 굵기 2 in AppButton.tsx · design-system D5 예외
- [x] T1179 결과 아이콘 테두리 in UserPatrolCard.tsx
- [x] T1180 상세 타이틀 타일 in AppPageHeader.tsx · components.md
- [x] T1181 `AppEmpty` 다시 그림(`illustration` = `cards` · `route`) · `bounce-anim` 삭제 · design-system §4-3 · 인라인 oklch OQ 해소
- [x] T1182 순찰 빈 화면 `route` 적용 — 코스 구성도 · 코스 순찰 기록 · 진행 중 순찰 · 인증 내역 · 지점/코스 순찰이력 · 코스 목록 · 지점 순찰 기록 · 최근 인증 · 근무자 순찰 기록
- [x] T1183 근무자 배치 이력 빈 표시 `AppEmpty`(`cards`)로 통일
- [x] T1184 목록 화면 빈 상태 · 검색 결과 없음 · 오류 카드 틀 삭제 · 남은 높이 세로 중앙 — 현장 7화면 · 본사 2화면 · `ServiceLayout` · `AdminLayout` 세로 flex · 버튼은 `action` 으로
- [x] T1185 페이지 바탕 `--contents-bg` 밝기 0.97 · 푸른기는 넣지 않음(사용자 결정 2026-11-05) — 흰 카드와 구분
- [x] T1186 제목 크기 토큰 — 페이지 22px · 카드 16px(전체 화면)
- [x] T1187 카드 안쪽 여백 20px(`p-5`, 전체 카드)
- [x] T1188 `AppTable` 표 머리 흰 배경
- [x] T1189 상세 행 구분선 삭제 — `AppDetailRow` 두 모양 · 미인증·이상 이력(10-19 결정 뒤집음)
- [x] T1190 근무자 표 — 이름 아래 사번 두 줄 · 사번 열 삭제
- [x] T1191 코스 상세 지점 순서 — `xl` 지도 위 가로 칸 + 줄 안 연결선 + 줄바꿈 · 그 아래 세로 타임라인 + 최대 320px 스크롤 · 안내 문구 삭제
- [x] T1192 코스 상세 KPI 3칸 — 마지막 순찰 · 평균 소요시간(초과 횟수 + 최근 7회 막대) · 지점 인증률(최근 7회 곡선) · `AppKpiCard` `compact` · `aside` · 공용 툴팁 · `uncheckedByPoint` 삭제
- [x] T1193 KPI 페이지별 검토 — 대시보드는 지금 구조 유지 · 배치관리는 가벼운 확인만 남김
- [x] T1194 지점 상세 KPI 줄 삭제 — 값은 `순찰 인증 기록` 머리 · `소속 코스` 제목 옆 · 제목 16px · 여백 20px · `PointStats` · `toPatrolTicks` 삭제
- [x] T1195 순찰 이력 상세 KPI 줄 삭제 — 코스 평균 · 특이사항은 `순찰 정보` 로 · 구간 평균 간격 삭제 · 인증 내역 표 머리 흰 배경 · 제목 16px · `HistoryKpiRow` · `checkIntervals` 삭제 · mock 회차 103 시각 수정
- [x] T1196 사업장 전환 콘솔 에러 수정 — `ServiceLayout` 쿼리 구독 콜백이 자식 렌더 중 상태를 바꾸던 문제(e2e S8)
