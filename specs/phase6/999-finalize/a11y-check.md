# 999 — 접근성 점검 (T866)

> 기준: `design-system.md` §3. 2026-10-23 코드 전수(grep + 대표 파일 확인). 🔴 **수정 범위는 사용자 판단**(OQ-999-A) — 이 문서는 목록이다.

## 결과 요약

| # | 항목 | 결과 | 비고 |
|:-:|---|---|---|
| 1 | 폼 라벨 ↔ 입력칸 연결 | ✅ **해소**(T862 · T863) | `AppInput` · `AppFormField` · `AppSelect`(필드 안) — OQ-F |
| 2 | 에러 `aria-invalid` · 설명 연결 | ✅ **해소**(T862 · T863) | 에러 문구가 `aria-describedby` 로 읽힌다 |
| 3 | 아이콘 전용 버튼의 이름 | ✅ 누락 0 | `AppIconButton` 전 사용처에 `aria-label` |
| 4 | 이미지 대체 텍스트 | ✅ 누락 0 | 첨부 이미지는 파일명 · 폴백 문구 |
| 5 | 포커스 표시 | ✅ 전역 처리 | `index.css` base `outline-ring/50` — 직접 만든 `<button>`(22파일)도 브라우저 포커스 윤곽이 토큰 색으로 나온다. 개별 `focus-visible` 없음은 결함 아님 |
| 6 | 트리 · 펼침 `aria-expanded` | ✅ | 관리그룹 트리 · 표 행 펼침(036) |
| 7 | 색만으로 상태 전달 | ✅ | 상태 뱃지는 글자 동반 · 담당 그룹 고르기의 배경색은 체크 상태와 함께 |
| 8 | 🔴 **표 행 클릭의 키보드 접근** | ❌ **결함** | 아래 |

## 8. 표 행 클릭 — 키보드로 열 수 없다

> ✅ **해소(2026-10-26, `047-table-row-keyboard`)** — 아래 수정안 그대로 `AppTable` 에 반영했다. 아래는 당시 기록.

- `AppTable` 의 `onRowClick` 은 `<tr onClick>` 만 건다(`src/components/AppTable.tsx:174`) — `tabIndex` · Enter/Space 처리가 없다.
- → **키보드 사용자는 목록에서 상세로 갈 수 없다.** 좁은 폭 카드는 `button` 이라 괜찮다(같은 파일 207행 주석).
- 영향: `onRowClick` 을 쓰는 목록 전부 — 사업장 · 관리자 · 근무자 · 지점 · 코스 · 순찰이력 2종 · 공지.
- 선례: `CheckDetailTable`(036)은 `tabIndex` + Enter/Space 로 이미 해결해 두었다(135행 주석).
- 수정안: `onRowClick` 이 있을 때만 행에 `tabIndex={0}` · `onKeyDown`(Enter/Space) · 포커스 표시. 공용 1곳 · 겉모습 무변화(포커스 윤곽만).
