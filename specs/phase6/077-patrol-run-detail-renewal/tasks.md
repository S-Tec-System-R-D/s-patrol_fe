# 077-patrol-run-detail-renewal tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 076 T1279 다음 — **T1280~**.

## Phase 1 — 데이터

- [x] T1280 runTimeline — 순번 순 항목 · 이동시간 · 건너뜀(06→08) · 다음 지점 · 경과 + 단위 테스트
- [x] T1281 historyPins — 핀 5종(인증 · 미완료 · 미인증 · 다음 · 대기) · 좌표 없는 지점 이름

## Phase 2 — 화면

- [x] T1282 RunSummaryStrip — 시작 · 종료 · 소요(+기준) · 특이사항 n건(누르면 첫 기록)
- [x] T1283 RunTimeline — 시작/종료 줄 · 행(예외만 뱃지 · 이동시간 · 특이사항 한 줄 · 펼침 · 모두 펼치기 · 사진 +N · 다음 지점 · 경과) · 선택 행 강조 · 스크롤
- [x] T1284 HistoryMapCard — 오른쪽 열 · 핀 5종 범례 · 선택 핀 강조 · 핀 클릭 → 행 · 좌표 없는 지점 이름
- [x] T1285 PatrolZoneDetailPage — 머리(순찰자 · 교대 · 코스 상세) · 2열(타임라인 / 지도 + 교대 이력) · 표 · 순찰 정보 카드 · 평균 소요 삭제

## Phase 3 — 검증 · 문서

- [x] T1286 테스트 — runTimeline · RunTimeline · HistoryMapCard · 페이지
- [x] T1287 verify · test · e2e · 캡처(1280 · 390)
- [x] T1288 문서 — screens.md 순찰 상세 행 · roadmap 077 행
