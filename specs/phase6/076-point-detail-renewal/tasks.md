# 076-point-detail-renewal tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 075 T1266 다음 — **T1270~**.

## Phase 1 — 데이터

- [x] T1270 patrolSummary — 버킷 · 총계에 `missed`(미완료) · 날짜별 묶음 `groupHistoryByDay` + 단위 테스트

## Phase 2 — 화면

- [x] T1271 PointMiniMap — 등록 좌표 핀 1개 · 좌표 없음 빗금 칸
- [x] T1272 PointDetail → 속성 패널(지도 · 기본정보 [수정] · 인증수단 · 소속 코스 · 사업장 · 설명 · 좌표 · TAG ID 복사 / QR 내려받기)
- [x] T1273 PointActivityCard — 요약 3칸 · 쌓은 막대(클릭 필터) · 날짜별 묶음 · 행 → 지점 인증 상세
- [x] T1274 PointDetailPage — 머리 `⋯`(삭제) · 2열(패널 고정 폭 + 기록) · 전환 스위치 · 소속 코스 카드 · PointPatrolLog 삭제

## Phase 3 — 검증 · 문서

- [x] T1275 테스트 — PointDetail · PointActivityCard · PointDetailPage · patrolSummary
- [x] T1276 verify · test · e2e · 캡처(1280 · 390)
- [x] T1277 문서 — screens.md 지점 상세 행 · roadmap 076 행

## Phase 4 — 검토 반영(2026-11-13)

- [x] T1278 날짜 줄 `누락 n` 삭제(행 · 막대와 중복) · 행 상태 → 순찰이력과 같은 뱃지(`pointCheckBadge`) · 요약 · 범례 `누락` → `미완료` · 테스트
- [x] T1279 정상 인증(`이상없음`)은 뱃지 없이 아이콘만 — 줄마다 반복돼 뱃지가 의미를 잃는다(사용자 결정 2026-11-13) · 테스트
