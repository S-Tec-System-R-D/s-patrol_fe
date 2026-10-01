# 017-select-and-datepicker spec

> 위험도: **B** (출처: roadmap.md §2 — Phase 2 주 위험도 B)
> 관련 화면: 공용 컴포넌트(특정 화면 없음). 소비처는 [`docs/screens.md`](../../../docs/screens.md) §1-2·§1-3·§1-4 목록 화면
> Phase: roadmap.md Phase 2 (공용 컴포넌트 확충)
>
> B급 — 1·2·3축 작성. 4축(엣지 케이스)은 "공통 규칙 따름".

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `016-redesign-regression` (Phase R 마감).

- [ ] **전역 디자인 토큰의 본사(`/admin/*`) side-effect** (016 발견, `roadmap.md` §13 등재) — 본 spec은 현장/본사 공용 primitive를 다루므로 토큰 스코프를 건드리지 않는다. **017 범위 밖 → Phase 5 착수 전 결정으로 계속 이월**
- [ ] **015 T110 브라우저 확인 최종 사용자 승인** (015→016 미해결 이월) — 017은 앱에 렌더되는 표면이 없어(소비처 018) 함께 확인할 수 없다. **미해결 유지 → 018로 이월**
- [x] **Phase R 이후 Phase 2/3/4 재산정** (`roadmap.md` §13 Open Q) — **본 spec에서 부분 해소**: Phase 2를 수요 확정분 2종(`AppSelect`·`AppDatePicker`)으로 좁히고, 나머지 3종은 수요 발생 시점으로 이동(§3 범위 밖 참조). Phase 3/4 재산정은 018 이후로 유지
- [ ] **공지 첨부파일 업로드/다운로드** (015→"Phase 2로 이월") — 수요 1곳뿐이라 본 spec에서 제외. **`/notice` 첨부 실동작 작업 시점으로 이월**

---

## User Stories

- US1. 개발자가 목록 필터·폼에서 선택 입력이 필요할 때, `AppSelect` 하나로 리디자인 톤에 맞는 단일 선택 컨트롤을 붙일 수 있다.
- US2. 개발자가 순찰이력의 기간 필터처럼 시작~종료 날짜가 필요할 때, `AppDatePicker`로 날짜 범위를 선택할 수 있다.
- US3. 현장관리자가 목록 화면 좌하단에서 페이지당 행 수를 고를 때, 브라우저 기본 드롭다운이 아니라 앱 디자인과 같은 셀렉트를 본다. *(2026-09-29 사용자 지시로 018 이연 → 017 범위 복귀)*

---

## 1. 목적

Phase R에서 현장 5개 화면의 UI를 신규 셸로 교체했으나, **선택 계열 컨트롤이 비어 있는 상태로 남았다.** 필터 트리거(`AppFilterButton`)는 10곳에 배치됐지만 전부 `no-op`이고, 열었을 때 안에 넣을 선택 UI가 없다.

본 spec은 **그 빈칸을 채우는 primitive 2종을 만든다.** 화면 로직(필터 팝오버 조립·URL 연동·목록 필터링)은 다루지 않으며, 그것은 018의 몫이다. 즉 017은 "부품", 018은 "조립"이다.

Phase 2 원안(roadmap §6)은 5개 항목이었으나, 코드 확인 결과 수요가 확정된 것은 2종뿐이다(§3 범위 밖 참조). 나머지는 수요가 단일 화면에 국한돼 **해당 화면 작업 시 함께 만드는 편이 A3(최소 변경)·A6(미래 확장 포인트 금지)에 맞다.**

> **~~소비처 없이 끝나는 spec~~ → 철회(2026-09-29, 사용자 지시).** 최초 계획은 `AppPagination` 교체를 018로 이연해 017을 소비처 없이 종료하는 것이었으나, "컴포넌트를 확인할 수 있는 화면이 없다"는 사용자 지적으로 **US3(`AppPagination` 행 수 셀렉트 → `AppSelect`)를 017 범위로 되돌렸다.** 따라서 `AppSelect`는 현장 5개 화면에서 즉시 확인 가능해지고, M2(시각 검증)가 `AppSelect` 범위에서 발동한다. `AppDatePicker`는 여전히 소비처가 없어 M2 대상이 아니며 018에서 확인한다.

---

## 2. I/O

### Input

**`AppSelect`**
- `options: { value: string; label: string }[]` — 선택지
- `value: string | undefined` / `onChange: (value: string) => void` — 제어 컴포넌트
- `placeholder?: string` — 미선택 시 표시
- `disabled?: boolean`
- 단일 선택만. **다중 선택은 미지원**(사용자 확정 — 필요해지면 기본값 `false`인 `multiple` prop으로 후행 확장, 기존 호출부 무변경)

**`AppDatePicker`**
- `value: { from?: Date; to?: Date }` / `onChange: (range: { from?: Date; to?: Date }) => void`
- `placeholder?: string`
- `disabled?: boolean`
- **범위 선택만.** 단일 날짜 선택은 현재 확정 수요 0곳이라 미구현(§3 범위 밖)

### Output
- 화면 전환: 없음 (표현 계층 컴포넌트)
- 상태 변화: 소비 측이 상태를 들고 콜백으로만 반영 — `AppPagination`의 기존 계약(`AppPagination.tsx:14-17` JSDoc "상태는 소비 측이 들고 콜백으로만 반영한다")과 동일
- 저장/외부 효과: 없음. **API 호출 없음** (실 백엔드·스웨거 미확보 상태와 무관하게 완결)

---

## 3. 제약

### 기술 제약

- **재사용 컴포넌트**: `AppFormField`(label/error/hint 책임) — `AppSelect`/`AppDatePicker`는 "디자인된 인풋" 책임만 갖는다. `AppFormField.tsx:13,22`의 JSDoc이 이미 이 분담을 전제하고 있으므로 그 계약을 그대로 따른다.
- **신규 shadcn 원시 필요**: `src/components/ui/`에 `select.tsx`·`popover.tsx`·`calendar.tsx`가 **없음**(현재 alert-dialog/button/dialog/dropdown-menu/sheet/switch/tabs/tooltip 8종뿐). 추가 필요.
- **신규 패키지**: `react-day-picker` 미설치. shadcn `Calendar`가 이를 기반으로 하므로 `AppDatePicker`에 필요. **사용자 승인 완료(2026-09-29)** — WF-3에서 설치 후 tasks.md에 버전 기록.
- **radix 임포트 경로**: 이 프로젝트는 통합 `radix-ui` 패키지(v1.4.3)를 쓴다. `@radix-ui/react-*` 개별 패키지를 추가하지 않는다.
- **cva variants 분리**: variant가 생기면 `./{컴포넌트명}.variants.ts`로 분리 (CLAUDE.md B4, 002 결정).
- **토큰**: `design-system.md` §1 시맨틱 토큰 사용. 임의 색상 금지(012에서 `ZoneRow` 임의색 제거한 것과 동일 기준).

### 비즈니스 규칙

- 없음. 본 spec은 도메인 규칙이 없는 표현 계층 작업이다.
- 단, `AppDatePicker`가 만드는 값은 **018에서 `data-model.md`의 `*Query` 인터페이스(`from`/`to`)에 그대로 실릴 수 있는 형태**여야 한다(`patterns.md` §6 "쿼리스트링 키는 `*Query` 인터페이스와 일치"). 직렬화 자체는 018 책임.

### 범위 밖 (명시)

Phase 2 원안 5개 항목 중 **본 spec에서 제외하고 수요 발생 시점으로 이동**:

| 원안 항목 | 확정 수요 | 처리 |
|---|---|---|
| dnd-kit Provider | 1곳 (`/zones` 지점 드래그 정렬) | 해당 화면 실동작 작업 시 함께 |
| Notice 첨부 업로드 위젯 | 1곳 (`/notice`) | 해당 화면 첨부 실동작 작업 시 함께 |
| 알림 시트 본문 | **0곳 (현장)** | **Phase 5로 이동** — `AlarmSheet`는 `TopNav.tsx:26`에 있고 007에서 `TopNav`가 `AdminLayout` 전용이 됨. 현장 코드에 참조 0건 |

그 밖에 본 spec이 다루지 않는 것:
- 필터 팝오버 조립 / URL 쿼리스트링 연동 / 목록 필터링 → **018**
- `AppFilterButton` 10곳의 `no-op` 해소 → **018**
- `AppSelect` 다중 선택 → 수요 확인 시
- `AppDatePicker` 단일 날짜 → 수요 확인 시

---

## 4. 엣지 케이스

공통 규칙 따름 (B급). 단, 접근성 1건만 본 spec 고유 사항으로 명시:

- 키보드 조작: 두 컨트롤 모두 키보드만으로 열기·이동·선택·닫기가 가능해야 한다(radix 기본 동작 유지, 임의로 억제하지 않음).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [x] `AppSelect`가 `src/components/app/AppSelect.tsx`에 존재하고, 단일 선택·placeholder·disabled가 동작한다
- [x] `AppDatePicker`가 `src/components/app/AppDatePicker.tsx`에 존재하고, 범위(from~to) 선택이 동작한다
- [x] 두 컴포넌트가 `AppFormField`의 자식으로 들어갔을 때 label/error/hint가 정상 렌더된다
- [x] 두 컴포넌트 모두 키보드만으로 열기·선택·닫기가 가능하다 (테스트로 검증)
- [x] `react-day-picker` 설치 버전이 tasks.md에 기록된다 — 10.0.1
- [x] `docs/components.md`에 두 컴포넌트 사용 가이드가 추가된다 — §3-2 / §3-3
- [x] `docs/roadmap.md` §6이 재산정 결과(2종으로 축소 + 3종 이동)로 갱신되고, §12에 017 행이 추가된다
- [x] 단위 테스트 추가 (누적 81건 → **94건**)
- [x] `npm run verify` + `npm run test` green — 29 files / 94 tests
- [x] `AppPagination`의 행 수 셀렉트가 `AppSelect`로 교체되고, 기존 계약(`pageSizeOptions: number[]`·`onPageSizeChange(number)`)과 소비처 6곳이 무변경이다 *(US3, 2026-09-29 추가)*
- [ ] M2(시각 검증) — `AppSelect`는 US3로 소비처가 생겨 **발동**(현장 5개 화면 좌하단). 사용자 브라우저 확인 대기. `AppDatePicker`는 소비처 부재로 018

> 증거(파일:라인)는 `tasks.md`의 DoD 대조표 참조.

---

## 참고

- 관련 목업: `docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png` — 필터 트리거(닫힌 상태)와 좌하단 페이지당 행 수 셀렉트가 보임. **팝오버 열린 상태 목업은 없음**(018에서 표준 패턴으로 설계, 사용자 확정)
- 관련 데이터 모델: `data-model.md` §5-4 (이력 조회 쿼리 — 018에서 연동)
- 관련 패턴: `patterns.md` §6 (URL 쿼리스트링 필터·검색 — 018에서 적용)
- 관련 컴포넌트: `components.md` (AppFormField·AppPagination 기존 가이드)
- 소비처 현황(017 착수 시점): `AppFilterButton` 10곳 — `/patrol/zones` 3, `/patrol/points` 5, `/users` 2. 모두 `no-op`
