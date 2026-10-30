# 065-filter-unify tasks

> **경량 작업(spec 없음)** — `workflow-protocol.md` §0. API · 라우트 · URL 규약 변화 없음. 필터 트리거 겉모습 · 열리는 방식(팝오버 → 셀렉트)만.
> 사용자 질문(2026-10-30): 코스/지점만 다른 필터를 쓰는 이유 → 통일 결정.

## 결정 (사용자 확정 2026-10-30)

| 항목 | 결정 |
|---|---|
| 통일 대상 | 목록 필터를 **`AppSelect` 하나로** — 코스 · 지점(`AppFilterPopover` 4개)을 옮기고 `AppFilterPopover` · `AppFilterButton` 삭제 |
| 버튼 표시 | 미선택 = **필터 이름**(`권한`), 선택 = **`이름: 값`**(`권한: 현장 관리자`) — 옛 `AppFilterPopover` 표시를 `AppSelect` 로 옮겨 **7화면 13개 전부** 바뀐다 |
| 선택 강조 | 버튼: `AppSelect` 에 이미 있는 파란 강조(`data-[active=true]`) 그대로. **펼친 목록의 고른 항목: 옛 팝오버처럼 굵은 파란 글자 + 파란 체크 14px**(사용자 지적 — 처음엔 버튼 강조로 잘못 알아들었다) |

경위: 018 은 `AppSelect` 에 `icon` · `active` 를 붙여 필터로 썼고, 027 이 `AppFilterButton` 을 팝오버로 감싼 `AppFilterPopover` 를 새로 만들었다(`/patrol/points` · `/users` 죽은 버튼 7개를 채울 계획). 023 이 그 패턴을 승계했지만 정작 그 7개는 036 · 037 · 038 에서 `AppSelect` 로 갔다 → 같은 일을 하는 필터가 두 벌이 됐고, 064 의 톤 차이가 거기서 나왔다.

## 필터 13개

| 화면 | 필터 | 전 |
|---|---|---|
| 코스 `/zones` | 사용여부 · 교대 | `AppFilterPopover` → **`AppSelect`** |
| 지점 `/points` | 인증수단 · 사용여부 | `AppFilterPopover` → **`AppSelect`** |
| 코스 순찰이력 | 코스 · 결과 | `AppSelect` |
| 지점 순찰이력 | 코스 · 인증수단 · 결과 | `AppSelect` |
| 근무자 | 권한 · 근무 상태 | `AppSelect` |
| 배치관리(이력 탭) | 상태 | `AppSelect` |
| 본사 관리자 | 권한 | `AppSelect` |

---

## Phase 1: 수정

- [x] T1091 필터 표시 in src/components/app/AppSelect.tsx — `active` 를 넘길 때만 `SelectValue` 글자를 이름 · `이름: 값` 으로(이름 = `aria-label`, 호출부 9곳 그대로). 폼 안 셀렉트(`active` 없음)는 그대로. 🔄 펼친 목록의 고른 항목 `data-[state=checked]:font-semibold text-point` · 체크 14px(필터일 때만)
- [x] T1092 코스 · 지점 필터 교체 in src/features/courses/components/CourseFilters.tsx · src/features/points/components/PointFilters.tsx — `AppSelect` + `ALL_VALUE` 선택지 · 화면 경계 `undefined`(props 그대로 — 페이지 손대지 않음)
- [x] T1093 삭제 — src/components/app/AppFilterPopover.tsx · AppFilterButton.tsx · __tests__/AppFilterPopover.test.tsx

## Phase 2: 검증 · 문서

- [x] T1094 테스트 — `ZonesPage` · `PointsPage` 필터를 `button` → `combobox` 로 찾기 · `PatrolPointsPage` '인증수단' 이 필터 버튼에도 보여 표 머리글로 좁힘 · `AppSelect` 필터 표시 3건 추가
- [x] T1095 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) + `npm run test` 1501/1501 병렬 · `npm run e2e` 37/37 · 7화면 캡쳐(1280 · 390, 임시 스크립트 — 커밋 안 함)
- [x] T1096 문서 — `components.md`(카탈로그에서 `AppFilterButton` 삭제 · §3-2 필터 표시 규칙 · §9-2 삭제 기록) · `patterns.md` §16 폐기 표기 · `design-system.md` 주석 · `roadmap.md` 065 행

## 남은 것

- 390px 지점 순찰이력 — 필터 4개(기간 · 코스 · 인증수단 · 결과)가 이름 표시로 넓어져 **두 줄로 접힌다**(가로 넘침은 없음). 전에는 `전체` 라 더 짧았다.
