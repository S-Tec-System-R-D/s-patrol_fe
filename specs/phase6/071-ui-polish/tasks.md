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
