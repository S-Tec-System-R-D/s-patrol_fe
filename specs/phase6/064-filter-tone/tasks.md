# 064-filter-tone tasks

> **경량 작업(spec 없음)** — `workflow-protocol.md` §0. API · 동작 · 라우트 변화 없음, 겉모습만.
> 사용자 지적(2026-10-30): 코스/지점 목록 필터가 아무것도 고르지 않았을 때 아이콘 · 글자색이 다른 필터와 다르다.

## 결정

| 항목 | 코스/지점(`AppFilterButton`) 전 | 기준(`AppSelect` 필터 트리거) | 결정 |
|---|---|---|---|
| 미선택 글자색 | 진한 먹(`text-foreground`) | `text-muted-foreground` | 기준에 맞춘다 |
| 앞 아이콘 | 14px · 불투명 | 16px · 60% | 기준에 맞춘다 |
| 화살표 | 14px · `text-muted-foreground` | 16px · 60% | 기준에 맞춘다 |

원인: `AppSelect` 는 2026-10-20 에 미선택 톤을 기간 필터와 맞췄는데 `AppFilterButton` 은 그때 빠졌다.

---

## Phase 1: 수정

- [x] T1088 미선택 톤 · 아이콘 in src/components/app/AppFilterButton.tsx — `data-[active=false]:text-muted-foreground` · 아이콘 · 화살표 16px `opacity-60`

## Phase 2: 검증 · 문서

- [x] T1089 `npm run verify`(경고 1 = 기존 `mockServiceWorker.js`) · 관련 테스트 580/580(components/app · courses · points · 페이지) · 전 · 후 캡쳐 비교(`/zones` 사용여부 ↔ `/users` 권한 — 같은 톤)
- [x] T1090 문서 — `components.md` §9-2(소비처 정정 · 톤 규칙) · `roadmap.md` 064 행
