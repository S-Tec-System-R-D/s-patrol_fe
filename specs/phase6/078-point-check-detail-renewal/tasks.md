# 078-point-check-detail-renewal tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 077 T1289 다음 — **T1290~**.

## Phase 1 — 화면

- [x] T1290 머리 — 결과(인증 / 건너뜀 / 미인증) · 특이사항 · 시간초과 뱃지 · 부제(순찰자 · 시각 · 수단) · `지점 상세`
- [x] T1291 배치 — 특이사항 있음: 순찰 기록 왼쪽 · 지도 + 인증 정보 오른쪽 / 없음: 지도 왼쪽 · 인증 정보 오른쪽
- [x] T1292 인증 정보 4행(구간 삭제) · PointLocationMapCard 패널용(`bare`)
- [x] T1293 최근 14일 한 줄 요약(PointRecentSummaryLine) · PointHistoryRecentCard 삭제

## Phase 2 — 검증 · 문서

- [x] T1294 테스트 — 페이지(두 배치 · 뱃지 · 부제 · 구간 없음 · 한 줄 요약)
- [x] T1295 verify · test · e2e · 캡처(1280 · 390)
- [x] T1296 문서 — screens.md 지점 인증 상세 행 · roadmap 078 행

## Phase 3 — 수정 (2026-11-16)

- [x] T1297 좌표 없음 — 오른쪽 패널 지도 자리 안내 · 메모도 없으면 왼쪽 순찰 기록 빈 상태(D5)
- [x] T1298 최근 14일 한 줄 삭제(D6) · PointRecentSummaryLine 삭제
- [x] T1299 테스트 · verify · test · e2e · screens
- [x] T1300 비어 있는 이유(D7) — 건너뜀 · 미인증: 인증수단 `인증하지 않음` · 지도 자리 `인증하지 않아 위치가 없습니다` / 완료인데 없음: `-` · `인증 시점 좌표가 없습니다` · 테스트
