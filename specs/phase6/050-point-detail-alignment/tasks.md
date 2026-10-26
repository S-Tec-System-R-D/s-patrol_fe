# 050-point-detail-alignment tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 지점 인증 상세(`/patrol/points/:detailSeq`)의 골격을 순찰 상세(`/patrol/zones/:historySeq`)와 맞춘다.
> 입력: 사용자 결정(2026-10-26 — "결정을 뒤집는 건 괜찮아. 추천순으로").
> 태스크 ID 는 049 다음부터(T919~).
> 🔴 API · 데이터 흐름 · 라우트는 바꾸지 않는다 — 같은 상세 응답 1개 · 최근 인증 조회 그대로, 배치만 바뀐다.

---

## 결정 표 (사용자 결정 2026-10-26)

| # | 요소 | 결정 |
|---|---|---|
| 1 | 머리 | `AppPageHeader` 되살림 — 제목 지점명 · 부제 "이 인증 1건의 수행 내역입니다" · 결과 + 시간초과 뱃지. 🔴 037(2026-10-20) "타이틀 줄 없음" 을 뒤집음 |
| 2 | 요약 | 가로 7칸 스트립(+ `xl` 미만 kv 두 벌) → 우측 `인증 정보` kv 카드 한 벌. `순찰지점`(= 제목) · `결과`(= 뱃지) 행 제거 → 5행 |
| 3 | 2열 | 좌 2/3: 지도 → 순찰 기록 → 최근 인증 / 우 1/3: 인증 정보. 좁은 폭은 인증 정보가 먼저(`order`, 순찰 상세와 같음) |
| 4 | 지도 높이 | 220px → 320px(`HistoryMapCard` 와 같음) |
| 4-1 | 정보 카드 행 간격 | 행을 `flex flex-col` 로 한 번 감싸 구분선을 행 사이 가운데로(위·아래 6px) — `SiteInfoCard` · `UserInfoCard` 와 같은 모양. 순찰 상세 `순찰 정보` 카드도 함께(사용자 결정 2026-10-26) |
| 4-2 | 행 여백 | 공용 `AppDetailRow`(between) `py-1.5` → `py-3`(행 사이 12px → 24px) — 4-1 후 브라우저에서 빽빽했다(`py-2.5` 도 거쳐 봤다). between 을 쓰는 카드 5곳(인증 정보 · 순찰 정보 · 사업장 기본정보 · 헬스체크 · 근무자 기본정보) 함께(사용자 결정 2026-10-26) |
| 4-3 | 코스·지점 기본정보 | `CourseInfo` · `PointDetail` 기본정보 행 `fixed` → `between`(우측 1/3 칸이라 `fixed` 근거 없음). 공용 between 값 칸 `min-w-0 break-words text-right` · 라벨 `shrink-0`(긴 `설명` 대비). 관리자 상세 모달 · NFC TAG ID 는 `fixed` 유지(사용자 결정 2026-10-26) |
| 5 | 유지 | KPI 줄 없음(10-20 판단 그대로) · 순찰 상세는 골격을 바꾸지 않음(4-1 행 간격만) |

---

## Phase 1: 구현

- [x] T919 `PointHistorySummaryBar` → `PointHistoryInfoCard` in src/features/patrol-points/components/detail/PointHistoryInfoCard.tsx — `AppDetailCard` 5행 · 인증시각 한 줄(초 포함)
- [x] T920 페이지 골격 in src/pages/service/patrol/points/PatrolPointDetailPage.tsx — 머리 · 2열 순서 · `order`
- [x] T921 지도 높이 in src/features/patrol-points/components/detail/PointLocationMapCard.tsx
- [x] T926 정보 카드 행 감싸기 in src/features/patrol-points/components/detail/PointHistoryInfoCard.tsx · src/features/patrol-zones/components/detail/HistoryInfoCard.tsx
- [x] T927 행 여백 in src/components/app/AppDetailRow.tsx
- [x] T928 코스·지점 기본정보 행 in src/features/courses/components/detail/CourseInfo.tsx · src/features/points/components/detail/PointDetail.tsx · src/components/app/AppDetailRow.tsx(값 칸 줄바꿈)
- [x] T922 테스트 in src/pages/service/patrol/points/__tests__/PatrolPointDetailPage.test.tsx — 스트립 단언 → 머리 · 카드 단언

## Phase 2: 검증 · 문서

- [x] T923 `npm run verify` + `npm run test` green (128 파일 · 1443 테스트)
- [x] T924 브라우저 확인(사용자 확인 2026-10-26) — `/patrol/points/:detailSeq`(완료 · 좌표 있음 / 미완료 · 좌표 없음) · 좁은 폭 순서 · 순찰 상세와 나란히 비교 · 행 여백(사업장 상세 · 근무자 상세 회귀 포함) · 코스 상세 · 지점 상세 기본정보(긴 `설명` · 토글 행)
- [x] T925 문서 — `screens.md` 지점 인증 상세 행 · `roadmap.md`(050 행)
