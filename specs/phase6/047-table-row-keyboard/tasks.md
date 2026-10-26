# 047-table-row-keyboard tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). OQ-999-A 해소 — 표 행을 키보드로 연다.
> 입력: `999-finalize/a11y-check.md` §8 수정안 + 사용자 결정(2026-10-26 "진행").
> 태스크 ID 는 046 다음부터(T896~).
> 🔴 API · 데이터 흐름 · 라우트는 바꾸지 않는다 — `AppTable` 행에 접근성 속성 · 키 처리 · 포커스 표시만.

---

## 결정 표 (사용자 결정 2026-10-26)

| # | 요소 | 결정 |
|---|---|---|
| 1 | 범위 | 공용 `AppTable` **한 곳** — `onRowClick` 을 쓰는 목록 8곳(사업장 · 관리자 · 근무자 · 지점 · 코스 · 순찰이력 2종 · 공지)이 함께 고쳐진다 |
| 2 | 동작 | `onRowClick` 이 있을 때만 행에 `tabIndex={0}` · Enter/Space = 클릭. 없으면 지금과 완전히 같다 |
| 3 | 겉모습 | 키보드 포커스일 때만 윤곽 + hover 와 같은 배경. 마우스 사용 시 무변화 |
| 4 | 선례 | `CheckDetailTable`(036) 과 같은 방식 — Space 는 스크롤을 막는다 |

---

## Phase 1: 구현

- [x] T896 행 키보드 in src/components/AppTable.tsx — `onRowClick` 있을 때만 `tabIndex={0}` · `onKeyDown`(Enter/Space → `onRowClick`, Space `preventDefault`) · `focus-visible` 윤곽. 🔴 행 안쪽 버튼 · 링크에서 누른 키는 행으로 처리하지 않는다(`event.target === event.currentTarget`)
- [x] T897 테스트 in src/components/__tests__/AppTable.test.tsx — Tab 으로 행 포커스 → Enter · Space 가 `onRowClick` · `onRowClick` 없으면 `tabIndex` 없음 · 안쪽 버튼의 Enter 는 행 클릭이 아님. 기존 "카드도 `button`" 테스트는 행이 먼저 포커스되므로 카드에 직접 포커스하도록 고친다

## Phase 2: 검증 · 문서

- [x] T898 `npm run verify` + `npm run test` 병렬 green
- [x] T899 브라우저 확인 — 목록 8곳에서 Tab → 행 윤곽 → Enter 로 상세(관리자는 모달) · 마우스 클릭 겉모습 무변화
- [x] T900 문서 — `999-finalize/a11y-check.md` §8(해소 표기) · `999-finalize/spec.md` 이월 표 OQ-999-A · `design-system.md` §3(접근성) · `roadmap.md` §12(047 행)
