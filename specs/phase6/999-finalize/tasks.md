# 999-finalize tasks

> 입력: 같은 폴더 `spec.md`. 마감 체크리스트 — 가드 변경(US2)만 A급으로 잘게, 나머지는 점검 · 정정 단위.
> 태스크 ID 는 045 다음부터(T858~). `[P]` = 병렬 가능 · `[US?]` = spec User Story.
> 🔴 **US4(문구)는 목록 → 사용자 확인 → 수정** 순서다. 확인 전에 문구를 고치지 않는다.

---

## Phase 1: US2 — 권한 매트릭스 (가드 변경)

> **독립 테스트 기준**: 본사 계정(SYSTEM · MASTER · MANAGER) + 현장 URL → `/admin/locations`(남은 `siteSeq` 가 있어도) · 현장관리자 + `/admin/*` → `/403` · 토큰 없음 · 근무자 · 모르는 role 은 지금 동작 그대로.

- [x] T858 [US2] 🔴 본사 → 현장 차단 in src/router/guards/AuthGuard.tsx — 토큰 있음 + 현장 영역 + `role` 이 본사 3종이면 `/admin/locations` 로 `replace`. 🔴 `siteSeq` 검사보다 **먼저**(본사는 `siteSeq` 가 없어 지금은 현장 로그인으로 튕긴다)
- [x] T859 [US2] [P] 가드 테스트 in src/router/guards/__tests__/AuthGuard.test.tsx — 본사 3종 × 현장 URL → 본사 홈 · 남은 `siteSeq` 무시 · 토큰 없음 / 모르는 role / 현장관리자는 그대로
- [x] T860 [US2] [P] 매트릭스 테스트 in src/features/auth/components/__tests__/RequireRoute.test.tsx — 본사 라우트 3개(`/admin/locations` · `/admin/locations/:id` · `/admin/admins`) × 4권한(본사 3 통과 · 현장관리자 `/403`)
- [x] T861 [US2] 문서 in CLAUDE.md(B1) · docs/flow.md(§0) — "Admin 3종 양쪽 진입" → 본사 화면만 · 현장관리자 `/admin/*` = `/403` 확정("정책 미정" 삭제)

## Phase 2: US3 — 접근성

> **독립 테스트 기준**: `getByLabelText('사번')` 이 입력칸을 찾는다 · 에러가 있으면 `aria-invalid="true"` + 에러 문구가 설명으로 읽힌다 · 렌더 결과 클래스 무변화.

- [x] T862 [US3] 🔴 `AppInput` 연결 in src/components/app/AppInput.tsx — `useId`(호출부 `id` 우선) · `label htmlFor` · 에러 시 `aria-invalid` + `aria-describedby` · 겉모습 무변화(속성만)
- [x] T863 [US3] `AppFormField` 연결 in src/components/app/AppFormField.tsx — 자식 컨트롤에 `id`(· 에러 시 `aria-*`)를 잇는다. 방법(cloneElement / context)은 구현 시 사용처 4곳을 보고 정한다
- [x] T864 [US3] [P] 단위 테스트 in src/components/app/__tests__/AppInput.test.tsx(신설) · AppFormField.test.tsx(신설) — 라벨 조회 · `id` 우선 · 에러 aria · password · search variant
- [x] T865 [US3] [P] 대표 폼 테스트 전환 in src/features/workers/form/__tests__/WorkerForm.test.tsx · src/pages/admin/admins/__tests__/AdminsPage.test.tsx — placeholder 우회 → 라벨 조회(045 의 OQ-F 주석 제거)
- [x] T866 [US3] §3 점검 in specs/phase6/999-finalize/a11y-check.md(신설) — 포커스 링 · 색만으로 상태 · 키보드 · `aria-expanded` 를 화면별로 훑어 어긋남 목록(OQ-999-A — 수정 범위는 사용자 판단)

## Phase 3: US4 — 콘텐츠 톤

> **독립 테스트 기준**: 위반 목록이 사용자 확인을 받았고, 확인된 항목만 고쳐졌다 · 관련 테스트의 문구 단언이 새 문구와 맞다.

- [x] T867 [US4] 위반 목록 in specs/phase6/999-finalize/tone-check.md(신설) — `design-system.md` §4 6개 규칙별로 grep(확인 문구 · `AppEmpty` title/description · 에러 · 값 없음 `—` · 단위 · 호칭) → 파일:줄 · 현재 문구 · 규칙 · 제안
- [x] T868 [US4] 🔴 사용자 확인(OQ-999-B) — 결정된 문구와 충돌하는 항목은 항목별로 묻는다
- [x] T869 [US4] 수정 in (T868 에서 확정된 파일들) — 값 없음 `—` → `-` 포함 · 테스트 단언 동기화

## Phase 4: US1 — 진행도 실사

> 맨 뒤에 둔다 — Phase 1~3 결과(권한 · 접근성)가 진행도에 들어간다.
> **독립 테스트 기준**: `screens.md` 에 사유 없는 ✗/△ 가 없다 · 끝난 행이 ✗ 로 남아 있지 않다.

- [x] T870 [US1] 실사 in docs/screens.md — ✗/△ 12행을 라우트 · 컴포넌트 · API 호출로 확인 → 재판정 + 막힌 사유. "순찰지점 삭제"(022) · "비밀번호 변경"(041) 정정 · §3 공통(로딩/에러/빈 상태 · 토스트)의 △ 판정
- [x] T871 [US1] [P] 정리 — src/features/patrol-zones/mock(빈 폴더) 삭제

## Phase 5: 검증 · 문서 · Phase 6 종료

- [x] T872 `npm run verify` + `npm run test` 병렬 green
- [x] T873 브라우저 확인 — 본사 계정(`000000` · `111111` · `777777`)으로 `/zones` 직접 입력 → 본사 홈 · 현장관리자(`333333`)로 `/admin/admins` → 403 · 폼 라벨 클릭 시 입력칸 포커스 · 바뀐 문구
- [x] T874 [P] 문서 — `roadmap.md`(§10 판정 · Phase 매트릭스 · **Phase 6 종료**) · `design-system.md`(§3 결과 · §6 OQ 정리 · D9 의 OQ-F 해소 표기)
- [x] T875 DoD 점검 + `## 다음 spec으로 이월`

---

## Dependencies & Execution Order

- Phase 1 · 2 · 3 은 서로 독립 — 순서는 위험도 순(가드 → 공용 컴포넌트 → 문구).
- Phase 1: T858 → T859 · T860(병렬) → T861.
- Phase 2: T862 → T863 → T864 · T865(병렬). T866 은 언제든.
- Phase 3: T867 → 🔴 T868(사용자) → T869. T869 는 T865 뒤(같은 테스트 파일 · 문구 단언).
- Phase 4 는 Phase 1~3 뒤. Phase 5 는 전부 뒤.
