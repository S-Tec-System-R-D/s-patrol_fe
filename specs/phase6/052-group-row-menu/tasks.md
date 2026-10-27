# 052-group-row-menu tasks

> **경량 작업**(`workflow-protocol.md` §0 — spec.md 없음). 관리그룹 편집 모달의 행 액션(이름 변경 · 삭제)을 ⋮ 메뉴로 접는다.
> 입력: 사용자 결정(2026-10-27 — "DropdownMenu로 진행").
> 태스크 ID 는 051 다음부터(T940~).
> 🔴 API · 데이터 흐름 · 확인 모달은 바꾸지 않는다 — 진입 경로만 아이콘 2개 → 메뉴 항목 2개.

---

## 결정 표 (사용자 결정 2026-10-27)

| # | 요소 | 결정 |
|---|---|---|
| 1 | 행 액션 | 본부 카드 머리 · 지사 행의 연필 · 휴지통 아이콘 → **⋮(`EllipsisVertical`) 하나**. 행마다 아이콘 2개가 반복돼 시끄러웠다 |
| 2 | 메뉴 종류 | Popover 가 아니라 **DropdownMenu**(`ui/dropdown-menu`) — 화살표 키 · `role="menu"` 가 따라온다 |
| 3 | 메뉴 항목 | `이름 변경` / 구분선 / `삭제`(빨간 글씨). 삭제 확인 모달은 그대로 |
| 4 | 회사(루트) · `+ 추가` | 그대로 — 회사는 메뉴 없음, 추가는 링크형 버튼 유지 |
| 5 | 메뉴 항목 커서 | `cursor-pointer`(사용자 요청 — 공용 `ui/dropdown-menu` 기본은 `cursor-default`, 이 모달 항목만) |

---

## Phase 1: 구현

- [x] T940 행 메뉴 in src/features/groups/components/GroupEditDialog.tsx — `editActions` 를 ⋮ DropdownMenu 로. `modal={false}`(메뉴에서 바로 AlertDialog 를 열 때 body `pointer-events: none` 잔류 회피). 트리거 `aria-label` = `{그룹명} 메뉴`
- [x] T941 테스트 in src/features/groups/components/__tests__/GroupEditDialog.test.tsx — `pickRowMenu`(⋮ 열기 → `menuitem` 클릭)로 이름 변경 · 삭제 경로 교체

## Phase 2: 검증 · 문서

- [x] T942 `npm run verify` green · `npm run test` 1451/1452 — 실패 1건은 `LocationsPage` "주소로 찾는다"(전체 스위트 부하에서 2.6초 → 대기 시간 초과, 파일 단독 16/16 통과 · 이번 변경과 무관)
- [x] T943 브라우저 확인(사용자 확인 2026-10-27) — ⋮ 열기 · 이름 변경 · 삭제 확인 모달 · 삭제 후 클릭이 막히지 않는지(pointer-events 잔류 없음)
- [x] T944 문서 — `components.md`(`GroupEditDialog`) · `screens.md` 관리그룹 행 · `roadmap.md`(052 행)
