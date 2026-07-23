# 008-redesign-shared-components spec

> 위험도: **B** (출처: [`docs/roadmap.md`](../../../docs/roadmap.md) §3 · Phase R R1 공용 컴포넌트)
> 관련 화면: 현장 사이트 전체 (`docs/screens.md` §1-2~§1-5) — 009~015가 소비할 공용 컴포넌트
> Phase: roadmap.md Phase R (Redesign) · R1
>
> **핵심**: 리디자인 목업(순찰이력·코스/지점·근무자·배치관리 4개 화면, `docs/ui-mock/현장/**/*-신규.png`)에서 반복 확인된 공용 UI를 컴포넌트화한다. **이 spec은 컴포넌트 신설/구현만** 다루고, 개별 화면(009~015)에 실제로 끼워 넣는 작업은 각 화면 spec에서 진행한다.
>
> **공통 규칙(토큰·콘텐츠 톤·반응형·에러 처리 등)은 적지 않는다.** `CLAUDE.md`/`design-system.md`에 이미 있음.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = **007-redesign-foundation** (Phase R, R0).

007의 `tasks.md` 이월 블록 5건을 확인한 결과, **전부 008 범위 외 다른 spec으로 명시 배정**되어 있어 008로 옮길 항목은 없음.

- `npm run typecheck` no-op(루트 tsconfig project-reference 이슈) → 007에서 별도 인프라 이슈로 사용자 보고 완료, 처리 spec 미정(008 범위 아님)
- pre-existing 타입 에러 3건(`PointDetail.tsx`, `PointNode.tsx`, `PatrolZonesPage.tsx`) → 009/011 등 해당 파일을 다루는 화면 spec에서 처리
- RailSidebar 배치관리 뱃지 카운트 미연결 → 014
- `/users`·`/deployments`·`/notice` 라우트 미등록 → 013/014/015
- 007 DoD 미달 항목 없음

**본 spec 범위 외로 이월 (그대로 유지)**

- AppTable ↔ AppPagination 실제 교체(각 화면 마이그레이션) → 009~015 개별 화면 spec (사용자 결정 2026-07-23: 008은 컴포넌트만 신설, 연동은 화면별)
- 알림 시트 본문(본사), shadcn `ui/button.tsx` 완전 제거, AppInput→AppFormField 마이그 잔여, 본사 사이트 리디자인 → 기존과 동일하게 각 Phase로 유지

---

## User Stories

- **US1.** 개발자로서, 009~015 화면을 만들 때 제목/부제 헤더를 매번 새로 짜지 않고 `AppPageHeader`를 재사용한다.
- **US2.** 개발자로서, 기간/코스/결과/상태 등 드롭다운 필터 트리거를 `AppFilterButton`으로 통일해 화면마다 다른 필터 버튼 스타일이 생기지 않는다.
- **US3.** 개발자로서, 목록의 페이지네이션을 "페이지당 행수 선택 + 현재 범위 표시 + 이전/다음"의 신규 디자인으로 표준화된 `AppPagination`으로 구현할 수 있다.
- **US4.** 개발자로서, 마스터-디테일 우측 패널(코스/근무자/구역 상세 등)을 `AppDetailCard`로 통일된 헤더·정보행·풋터 구조로 조립한다.
- **US5.** 개발자로서, 배치관리 등 대시보드성 화면의 상단 통계 타일을 `AppKpiCard`로 재사용한다.
- **US6.** 개발자로서, 순찰 결과·근무 상태·사용자 상태 등 모든 상태 뱃지를 시맨틱 5색(`success`/`point`/`warning`/`danger`/`muted`) 기반 `AppBadge` 하나로 렌더링한다.

---

## 1. 목적

리디자인 목업 6개(`순찰이력` 2종, `코스/지점관리` 2종, `배치관리`, `근무자`)에서 화면마다 반복 등장하는 6개 UI 조각 — 페이지 헤더, 필터 버튼, 페이지네이션, 상세 카드, KPI 카드, 상태 뱃지 — 를 공용 컴포넌트로 뽑아 `src/components/app/`에 신설한다. 009~015가 각자 페이지를 리디자인할 때 이 컴포넌트만 조립하면 되도록 만드는 것이 목적이며, 개별 화면 로직·데이터 연동은 다루지 않는다.

---

## 2. I/O

### Input

- **참조 목업** (시각 기준): `docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png`, `.../지점순찰이력-신규.png`, `docs/ui-mock/현장/코스-지점관리/코스관리-신규.png`, `.../지점관리-신규.png`, `docs/ui-mock/현장/배치관리/배치관리-신규.png`, `docs/ui-mock/현장/근무자/근무자-신규.png`
- **참조 문서**: `docs/design-system.md` §1-1(시맨틱 컬러 트리오 + 지점 결과 5종 매핑), `docs/patterns.md` §1(마스터-디테일), §11(마스터-디테일 액션 풋터)
- **현재 상태 (재사용/대체 대상)**: `src/components/AppTable.tsx`의 내장 `TablePagination`(전체 N건 + 이전/다음 + "X / Y" 텍스트) — 008은 이를 직접 수정하지 않고, 대체 가능하도록 여는 선까지만.

### Output — 신규 컴포넌트 6종 (`src/components/app/`)

| 컴포넌트 | 파일 | 핵심 Props | 비고 |
|---|---|---|---|
| `AppPageHeader` | `AppPageHeader.tsx` | `title`, `subtitle?`, `action?: ReactNode` | 페이지 최상단, 제목+부제+우측 액션(예: "근무자 추가" 버튼) |
| `AppFilterButton` | `AppFilterButton.tsx` | `icon?: LucideIcon`, `label`, `active?: boolean` | 드롭다운/팝오버 트리거 시각(아이콘+라벨+chevron). 내부 팝오버 콘텐츠는 소비 측(`radix-ui` Popover/DropdownMenu)이 구성 |
| `AppPagination` | `AppPagination.tsx` | `pageIndex`, `pageSize`, `total`, `onPageChange`, `onPageSizeChange`, `pageSizeOptions?: number[]` | 독립 컴포넌트(테이블 비의존). "페이지당 행수 [n] · a–b / 전체 N개 항목 · ‹ ›" |
| `AppDetailCard` | `AppDetailCard.tsx` | `icon?`, `title`, `badge?: ReactNode`, `footer?: ReactNode`, `children` | 마스터-디테일 우측 패널 컨테이너(헤더+바디 슬롯+풋터). 정보행은 아래 `AppDetailRow`로 바디 내부에서 조립 |
| `AppDetailRow` | `AppDetailRow.tsx` | `label`, `value: ReactNode` | `AppDetailCard` 바디 안에서 쓰는 key-value 한 줄(라벨 좌 / 값 우, 우측 정렬 tabular) |
| `AppKpiCard` | `AppKpiCard.tsx` | `icon: LucideIcon`, `label`, `value: ReactNode`, `unit?`, `tone?: 'point'|'success'|'warning'|'danger'` | 통계 타일(색상 원형 아이콘 배지 + 라벨 + 큰 숫자 + 단위) |
| `AppBadge` | `AppBadge.tsx` (+ `AppBadge.variants.ts`) | `variant: 'success'|'point'|'warning'|'danger'|'muted'`, `children` | `cva` 기반, 색만으로 상태 전달 금지 원칙에 따라 텍스트 children 필수 |

- `AppTable.tsx`에 `hidePagination?: boolean` prop 추가(옵션, 기본 `false`) — 화면이 `AppPagination`으로 직접 교체하고 싶을 때 내장 footer를 끌 수 있는 탈출구만 연다. 기존 사용처(마이그레이션 전) 동작은 100% 무변화.

---

## 3. 제약

### 기술 제약

- **재사용 컴포넌트**: `AppButton`(필터 버튼·페이지네이션 이전/다음 내부 구현), `ui/select` 또는 `ui/dropdown-menu`(페이지당 행수 선택), `ui/popover`/`ui/tooltip`(필터 버튼 트리거 연동은 소비 측 책임)
- **재사용 패턴**: `cva` variants는 `react-refresh/only-export-components` 회피를 위해 `AppBadge.variants.ts`로 분리 (CLAUDE.md B4 컨벤션, `button.tsx`/`button.variants.ts` 선례 따름)
- **토큰**: `AppBadge`/`AppKpiCard`는 `design-system.md` §1-1 시맨틱 트리오(`{semantic}`/`{semantic}-bg`/`{semantic}-foreground`)만 사용. 임의 hex/oklch 금지
- **사용 라이브러리**: `lucide-react`(아이콘), `class-variance-authority`(`AppBadge` variant), 기존 `radix-ui` 프리미티브 재사용(신규 패키지 추가 없음)
- **금지**: 개별 화면(009~015) 페이지 파일 수정, `AppTable` 내장 페이지네이션 UI 자체를 새 디자인으로 즉시 교체(연동은 각 화면 spec에서)

### 비즈니스 규칙

- **뱃지 시맨틱 매핑은 `design-system.md` §1-1 표를 그대로 따른다** — 008은 매핑표를 확정하지 않고 이미 존재하는 5종 시맨틱(`success`/`point`/`warning`/`danger`/`muted`)만 컴포넌트로 구현한다. "어느 화면의 어느 라벨이 어느 variant인가"(예: 코스 이력의 `진행중` 뱃지 색상)는 해당 라벨을 실제로 쓰는 화면 spec(009 등)이 `design-system.md` 매핑표를 참조해 결정 — **008은 5개 색 프리미티브만 제공, 라벨-색 매핑 확정은 미포함**.
- **지점 순찰이력 결과 5종**(이상없음/순찰기록/시간초과/미완료/순찰제외)은 이미 `design-system.md` §1-1에 시맨틱 매핑이 확정돼 있으므로 그대로 `AppBadge` variant로 대응(신규 매핑 결정 불필요).

---

## 4. 엣지 케이스

공통 규칙 따름 (B급).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [ ] `src/components/app/AppPageHeader.tsx` 신규 — title/subtitle/action props, 목업 시각과 일치(제목 bold + 부제 muted 1줄 + 우측 action 슬롯)
- [ ] `src/components/app/AppFilterButton.tsx` 신규 — icon+label+chevron 트리거, `active` 시 강조 스타일
- [ ] `src/components/app/AppPagination.tsx` 신규 — 페이지당 행수 선택 + "a–b / 전체 N개 항목" + 이전/다음(화살표만, 페이지 번호 버튼 없음). 첫/마지막 페이지에서 이전/다음 비활성
- [ ] `src/components/app/AppDetailCard.tsx` + `AppDetailRow.tsx` 신규 — 헤더(아이콘+제목+선택적 뱃지) / children 바디 / 선택적 footer 슬롯 구조
- [ ] `src/components/app/AppKpiCard.tsx` 신규 — 아이콘 원형 배지(tone별 색) + 라벨 + 큰 숫자 + 단위
- [ ] `src/components/app/AppBadge.tsx` + `AppBadge.variants.ts` 신규 — `cva` 5 variant(`success`/`point`/`warning`/`danger`/`muted`), 색만으로 상태 전달 금지(텍스트 children 필수) 접근성 규칙 반영
- [ ] `src/components/AppTable.tsx` — `hidePagination?: boolean` prop 추가, 미지정 시 기존 동작 100% 무변화(회귀 없음)
- [ ] `docs/components.md` — 6개 신규 컴포넌트 카탈로그(§0 표 + 개별 섹션) 추가
- [ ] vitest 단위 테스트 — 최소 `AppPagination`(경계값: 첫/마지막 페이지 비활성, pageSize 변경 시 pageIndex 리셋 여부) + `AppBadge`(variant별 클래스) 신규 작성
- [ ] `npm run verify` exit 0
- [ ] `npm run test` 전체 통과 (기존 + 신규)

---

## 참고

- 관련 목업: `docs/ui-mock/현장/순찰이력/*-신규.png`, `docs/ui-mock/현장/코스-지점관리/*-신규.png`, `docs/ui-mock/현장/배치관리/배치관리-신규.png`, `docs/ui-mock/현장/근무자/근무자-신규.png`
- 관련 데이터 모델: 해당 없음(순수 프레젠테이션 컴포넌트, 데이터 바인딩은 009~015)
- 관련 패턴: `docs/patterns.md` §1(마스터-디테일), §11(마스터-디테일 액션 풋터), §6(URL 쿼리스트링 필터·검색 — `AppFilterButton` 트리거 대상)
- 관련 결정: `design-system.md` §1-1(시맨틱 트리오 + 지점 결과 5종 매핑)
