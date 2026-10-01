# 017-select-and-datepicker tasks

> 입력: 같은 폴더 `spec.md`
> 위험도 **B** — 화면(컴포넌트) 단위로 크게 분할.
> 공유 기반이 없어(`AppFormField`는 기존 자산) 템플릿의 "Foundational" Phase는 생략. Setup → US1 → US2 → Polish.

---

## Phase 1: Setup — 원시 확보

두 US 모두 선행. shadcn 원시가 없으면 어느 쪽도 시작 못 함.

- [x] T129 `react-day-picker` 설치 + **설치된 버전을 본 파일 하단 "설치 기록"에 적는다** (spec §5 DoD 항목). 사용자 승인 완료(2026-09-29) — v10.0.1 설치, `package.json:28`
- [x] T130 [P] shadcn `select` 원시 추가 in src/components/ui/select.tsx — 통합 `radix-ui` 패키지에서 import (`@radix-ui/react-select` 개별 설치 금지, spec §3)
- [x] T131 [P] shadcn `popover` 원시 추가 in src/components/ui/popover.tsx — 통합 `radix-ui` 패키지에서 import
- [x] T132 shadcn `calendar` 원시 추가 in src/components/ui/calendar.tsx — T129·T131 선행. **v10은 shadcn 공식(v8/v9) 예제와 API가 다를 수 있어 설치본 타입(`dist/esm/UI.d.ts`, `types/selection.d.ts`)을 직접 확인 후 작성** — `UI` enum 구조는 v9와 동일, `mode="range"` + `DateRange{from,to}` 확인. 기본 스타일시트 미import + `classNames` 전량 오버라이드 방식

## Phase 2: US1 — AppSelect

> **독립 테스트 기준** (= 세션 검증 게이트): `AppFormField`의 자식으로 렌더했을 때 label/required/error/hint가 정상 노출되고, 옵션 선택 시 `onChange`가 선택값으로 1회 호출되며, `placeholder`(미선택)·`disabled`가 동작한다. 키보드만으로 열기→이동→선택→닫기가 가능하다.

- [x] T133 [US1] `AppSelect` 구현 in src/components/app/AppSelect.tsx — props는 spec §2 계약 그대로. 단일 선택만. label·error·hint는 갖지 않음(`AppFormField` 책임)
- [x] T134 [US1] `AppSelect` 단위 테스트 in src/components/app/__tests__/AppSelect.test.tsx — 6건 통과

## Phase 3: US2 — AppDatePicker

> **독립 테스트 기준**: 시작일 클릭 → 종료일 클릭 시 `onChange`가 `{ from, to }`로 호출된다. 미선택 시 `placeholder`가 보이고, `disabled`면 팝오버가 열리지 않는다. 키보드만으로 열기→날짜 이동→선택→닫기가 가능하다.

- [x] T135 [US2] `AppDatePicker` 구현 in src/components/app/AppDatePicker.tsx — `popover`+`calendar` 조합, 범위 전용, 표시 포맷은 `date-fns`
- [x] T136 [US2] `AppDatePicker` 단위 테스트 in src/components/app/__tests__/AppDatePicker.test.tsx — 7건 통과

## Phase 4: Polish

- [x] T137 [P] `docs/components.md`에 사용 가이드 추가 in docs/components.md — §0 카탈로그 표 5행 추가(App 2 + ui 3), §3-2 `AppSelect`(179행)·§3-3 `AppDatePicker`(216행) 신설
- [x] T138 [P] `docs/roadmap.md` 갱신 in docs/roadmap.md — §2 Phase 한눈에 행 수정, §6 재산정(§6-1 범위 2종 / §6-2 이동 3종), §12에 017 행 추가
- [x] T139 `npm run verify` + `npm run test` **병렬 실행** green 확인 (CLAUDE.md A4)
- [x] T140 DoD 대조표 작성(증거 파일:라인) + 본 파일 하단 "다음 spec으로 이월" 블록 작성

## Phase 5: US3 — AppPagination 행 수 셀렉트 교체 (2026-09-29 추가)

> 최초 계획에서 018로 이연했던 항목. "만든 컴포넌트를 확인할 수 있는 화면이 없다"는 사용자 지적으로 017 범위 복귀(spec §1 철회 주석).
> **독립 테스트 기준**: 목록 5개 화면 좌하단 행 수 셀렉트가 `AppSelect`로 렌더되고, 값 변경 시 `onPageSizeChange(number)`가 종전과 동일하게 호출된다. 소비처 6곳은 무변경.

- [x] T141 [US3] `AppSelect`에 `aria-label` prop 추가 in src/components/app/AppSelect.tsx — Radix 트리거는 `<button role="combobox">`라 `<label>` 감싸기가 무효. 한 화면에 인스턴스 2개인 곳(`DeploymentHistoryTabs`)이 있어 id 기반 `aria-labelledby` 대신 `aria-label` 선택
- [x] T142 [US3] `AppPagination` 네이티브 `<select>` → `AppSelect` 교체 in src/components/app/AppPagination.tsx — props 계약(`pageSizeOptions: number[]` / `onPageSizeChange(number)`) 무변경, 내부에서 `string` 변환만. 컴팩트 사이즈는 `className="h-7 w-auto text-xs"`
- [x] T143 [US3] `AppPagination` 테스트 갱신 in src/components/app/__tests__/AppPagination.test.tsx — `userEvent.selectOptions`는 Radix 트리거에 미작동 → 트리거 클릭 → 옵션 클릭 방식(`AppSelect.test.tsx` 패턴)
- [x] T144 [US3] [P] 문서 동기화 in docs/components.md — §3-2 Props에 `aria-label` 행 + 가이드, §9-3에 교체·사이즈 근거 명시, §12 Open Q의 `AppSelect`/`AppDatePicker` 2건 해소 처리(017 최초 반영 누락분)
- [x] T145 [US3] `npm run verify` + `npm run test` **병렬** 재실행 green
- [x] T146 [US3] **M2 시각 검증** — dev 서버 `/patrol/zones`·`/patrol/points`·`/users`·`/deployments`·`/notice` 좌하단 셀렉트 확인. **사용자 승인 완료(2026-10-01)**

---

## Dependencies & Execution Order

- T129 → T132 (react-day-picker 없으면 calendar 원시 불가)
- T131 → T132 (calendar는 popover 안에서 열림)
- T130, T131 = 서로 독립 `[P]`. T129와도 독립이라 함께 병렬 가능
- Phase 1 전체 → Phase 2·Phase 3 선행
- **Phase 2(US1)와 Phase 3(US2)는 서로 독립** — 실제로 단일 세션 순차 진행함
- T137, T138 = 서로 독립 `[P]`. 둘 다 Phase 2·3 완료 후
- T139 → T140
- T133(`AppSelect`) → T141 → T142 → T143 (Phase 5는 US1 산출물에 의존)
- T144 = T142와 독립 `[P]`. T145는 T142·T143 이후, T146은 T145 이후

---

## 구현 시 유의사항 (착수 전 예상 → 실제 결과)

- **jsdom + radix 포인터 이벤트** — *예상대로 발생했고 예정 경로로 해소*. T134 최초 실행에서 `target.hasPointerCapture is not a function` + `candidate?.scrollIntoView is not a function`으로 3건 실패. `src/test/setup.ts:22-29`에 jsdom 미구현 API stub을 추가해 해소(1회 수정, 3회 실패 보류 규칙 미발동).
- **A6 준수** — 두 컴포넌트 모두 확정 수요 기능만. variant·size·다중선택·단일날짜 미구현.

---

## 설치 기록

- `react-day-picker`: **10.0.1** (`package.json:28`, `^10.0.1`). 의존성 2개 추가.
  - shadcn 공식 Calendar 예제는 v8/v9 기준이라 그대로 복사하지 않고, 설치본 타입 정의를 읽어 v10 API에 맞춰 작성함.

---

## DoD 대조표 (WF-4 세션 풀세트)

spec.md §5 기준. 증거는 `파일:라인`.

- [x] `AppSelect` 존재 + 단일 선택·placeholder·disabled 동작 — src/components/app/AppSelect.tsx:24-50 / 검증 AppSelect.test.tsx:14,19,24,47
- [x] `AppDatePicker` 존재 + 범위(from~to) 선택 동작 — src/components/app/AppDatePicker.tsx:33-72 (`mode="range"` :59) / 검증 AppDatePicker.test.tsx:18,28
- [x] `AppFormField` 자식으로 label/error/hint 정상 렌더 — AppSelect.test.tsx:52, AppDatePicker.test.tsx:56
- [x] 두 컴포넌트 모두 키보드만으로 열기·선택·닫기 가능 — AppSelect.test.tsx:34, AppDatePicker.test.tsx:39
- [x] `react-day-picker` 설치 버전 기록 — 본 파일 "설치 기록" (10.0.1)
- [x] `docs/components.md` 사용 가이드 추가 — docs/components.md:179(§3-2), :216(§3-3) + §0 카탈로그 표
- [x] `docs/roadmap.md` §6 재산정 + §12 017 행 추가 — docs/roadmap.md:149(§6-1), :158(§6-2), :294(§12 행)
- [x] 단위 테스트 추가 — 81건 → **94건** (AppSelect 6 + AppDatePicker 7). 파일 27 → 29
- [x] `npm run verify` + `npm run test` green — verify 0 errors(경고 1건은 `public/mockServiceWorker.js` 기존 MSW 생성물, 본 spec 무관) / test 29 files, 94 tests 통과
- [x] `AppPagination` 행 수 셀렉트 `AppSelect` 교체 + 계약·소비처 무변경 — src/components/app/AppPagination.tsx:36-43 (`aria-label` :37), `AppSelect` prop 추가 src/components/app/AppSelect.tsx:18,33,38 / 검증 AppPagination.test.tsx:63-64. 소비처 6곳(`DeploymentHistoryTabs` 2, `DeploymentRequestList`, `NoticeList`, `PatrolPointsPage`, `PatrolZonesPage`, `UsersPage`) diff 0줄
- [x] M2(시각 검증) — `AppSelect`는 US3로 소비처가 생겨 **발동**, dev 서버 확인 **사용자 승인 완료(2026-10-01, T146)**. `AppDatePicker`는 여전히 소비처 부재 → 018

**DoD 미달 항목: 없음.** 017 범위 전체 충족(M2는 2026-10-01 사용자 승인). `AppDatePicker`의 M2는 소비처가 018에서 생기므로 해당 spec 소관.

---

## 다음 spec으로 이월

> 다음 spec(**018**, 순찰이력 필터 조립 + URL 연동)의 `§0 Carry-over` 입력원. 새 세션은 이 블록만 읽으면 됨.

- [x] **`AppPagination` 네이티브 `<select>` → `AppSelect` 교체** — **017에서 해소(Phase 5 / T141~T145)**. 최초에 018로 이연했으나 사용자 지시로 복귀
- [ ] **`AppDatePicker` M2 시각 검증** — 소비처가 아직 없음(필터 팝오버 조립이 018). 018에서 최초 시각 확인 → **018**
- [ ] **015 T110 브라우저 확인 최종 사용자 승인** — 015→016→017 계속 이월. 017 T146 dev 서버 확인 때 함께 볼 수 있으나, 승인 자체는 사용자 판단 → **미해결**
- [ ] **전역 디자인 토큰의 본사(`/admin/*`) side-effect** — `roadmap.md` §13 등재분, 017 무관. **Phase 5 착수 전 결정**으로 계속 이월
- [ ] **공지 첨부 업로드/다운로드** — 017에서 Phase 2 범위 밖으로 재분류. `/notice` 첨부 실동작 작업 시점으로 이월
- [ ] **dnd-kit Provider** — 017에서 Phase 2 범위 밖으로 재분류. `/zones` 드래그 정렬 실동작 작업 시점으로 이월
- [ ] **알림 시트 본문** — 017에서 **Phase 5(본사)로 이동** 확정. 현장 범위에서 제외됨
- [ ] **`AppSelect` 다중 선택 / `AppDatePicker` 단일 날짜** — 확정 수요 0곳이라 미구현. 018에서 필터를 실제 조립할 때 "결과" 필터에 복수 선택 수요가 드러나면 그때 확장(기본값 `false`인 `multiple` prop, 기존 호출부 무변경) → **018에서 판단**
