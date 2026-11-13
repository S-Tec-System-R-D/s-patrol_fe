# 075-course-inline-point-create tasks

> 입력: [`spec.md`](./spec.md). 태스크 ID 는 074 T1254 다음 — **T1260~**.

## Phase 1 — 데이터

- [x] ~~T1260 새 지점 찾기(전 · 후 후보 비교)~~ — **뺌**(D1 — 자동 체크 안 함, 사용자 결정 2026-11-13)
- [x] T1260a mock `GetClassificationPoint` — 지점 저장소에서 읽기 · 미사용 제외(`classificationCandidates` in src/mocks/handlers/points.ts) · courseApi 테스트 건수 10 → 9

## Phase 2 — 화면

- [x] T1261 AddPointForm — `defaultName` · `hideUseYn`(사용 고정) · `onSuccess(name)`, 지점 탭 동작 그대로 in src/features/points/form/AddPointForm.tsx
- [x] T1262 AddCoursePointDialog — `고르기 ↔ 만들기` 화면 전환 · `+ 새 지점 만들기` · 검색 0건이면 `'검색어' 새 지점 만들기` · 설명 줄 안내 · 성공 후 후보 다시 받고 검색창에 이름 · 지점 0건 링크 → 버튼
- [x] T1263 캐시 무효화 — `pointKeys.lists`(폼) · `courseKeys.classificationPoints`(창)

## Phase 3 — 검증 · 문서

- [x] T1264 테스트 — AddCoursePointDialog(검색어로 만들기 · 만든 뒤 이름 검색 · 자동 체크 없음 · useYn true · 실패 시 입력 유지 · ← 돌아가기) · AddPointForm(onSuccess 이름 · hideUseYn)
- [x] T1265 verify · test · e2e · 캡처(1280 · 390)
- [x] T1266 문서 — screens.md 코스 상세 행 · roadmap 075 행
