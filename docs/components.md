# 컴포넌트 카탈로그 (components.md)

> 본 프로젝트에서 사용하는 **앱 공용 컴포넌트** + **shadcn 원시 컴포넌트**의 사용 가이드.
> 디자인 토큰·컨벤션·접근성·콘텐츠 톤은 [`design-system.md`](./design-system.md) 참조.
> 레이아웃 / 상호작용 패턴은 [`layout.md`](./layout.md) / [`patterns.md`](./patterns.md) 참조.
>
> **원칙**
> - 새 화면은 **App* 컴포넌트 우선** 사용. shadcn `ui/*`는 App* 내부 구현용.
> - 도메인 전용 컴포넌트(`PointCard`, `ZoneTree` 등)는 본 문서 범위 아님(`features/{도메인}/components/*`).

---

## 0. 카탈로그 한눈에

| 컴포넌트 | 위치 | 용도 | 표준 여부 |
|---|---|---|---|
| `AppButton` | `components/Button.tsx` | 기본 액션 버튼 | ✅ 표준 |
| `AppIconButton` | `components/AppIconButton.tsx` | 아이콘 단독 버튼 | ✅ 표준 |
| `AppInput` | `components/app/AppInput.tsx` | 텍스트/검색/패스워드 인풋 | ✅ 표준 |
| `AppSelect` | `components/app/AppSelect.tsx` | 단일 선택 드롭다운 | ✅ 표준 |
| `AppDatePicker` | `components/app/AppDatePicker.tsx` | 날짜 **범위** 선택 | ✅ 표준 |
| `AppCheckbox` | `components/app/AppCheckbox.tsx` | 체크박스 | ✅ 표준 |
| `AppDialog` | `components/app/AppDialog.tsx` | 일반 다이얼로그(폼·정보) | ✅ 표준 |
| `AppAlertDialog` | `components/AppAlertDialog.tsx` | 확인/위험 액션 다이얼로그 | ✅ 표준 |
| `AppEmpty` | `components/app/AppEmpty.tsx` | 빈 상태 | ✅ 표준 |
| `AppTable` | `components/AppTable.tsx` | tanstack-table 래퍼 | ✅ 표준 |
| `AppPageHeader` | `components/app/AppPageHeader.tsx` | 페이지 상단 제목+부제+우측 액션 | ✅ 표준 |
| `AppFilterButton` | `components/app/AppFilterButton.tsx` | 드롭다운/팝오버 필터 트리거 | ✅ 표준 |
| `AppPagination` | `components/app/AppPagination.tsx` | 신규 페이지네이션(행수 선택+범위+이전/다음) | ✅ 표준 |
| `AppDetailCard` / `AppDetailRow` | `components/app/AppDetailCard.tsx` / `AppDetailRow.tsx` | 마스터-디테일 우측 상세 패널 | ✅ 표준 |
| `AppKpiCard` | `components/app/AppKpiCard.tsx` | 통계 타일(아이콘+라벨+숫자) | ✅ 표준 |
| `AppBadge` | `components/app/AppBadge.tsx` | 상태/결과 뱃지(시맨틱 5색) | ✅ 표준 |
| `ui/button` | `components/ui/button.tsx` | shadcn 원시 | ⛔ 신규 금지 (점진 제거) |
| `ui/dialog` | `components/ui/dialog.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/alert-dialog` | `components/ui/alert-dialog.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/tabs` | `components/ui/tabs.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/sheet` | `components/ui/sheet.tsx` | shadcn 원시 | 사이드 패널·알림 시트 |
| `ui/switch` | `components/ui/switch.tsx` | shadcn 원시 | 토글 직접 사용 가능 |
| `ui/dropdown-menu` | `components/ui/dropdown-menu.tsx` | shadcn 원시 | 컨텍스트 메뉴 직접 사용 가능 |
| `ui/select` | `components/ui/select.tsx` | shadcn 원시 | 내부 구현용 (`AppSelect` 전용) |
| `ui/popover` | `components/ui/popover.tsx` | shadcn 원시 | 팝오버 직접 사용 가능 (필터 팝오버 등) |
| `ui/calendar` | `components/ui/calendar.tsx` | react-day-picker 래퍼 | 내부 구현용 (`AppDatePicker` 전용) |

---

## 1. AppButton

기본 액션 버튼. variant 4종 + size 2종 + 아이콘 내장.

```tsx
import Button from '@/components/Button'
import { PlusIcon } from 'lucide-react'

<Button variant="default" size="fit" icon={PlusIcon}>지점 추가</Button>
<Button variant="sub">취소</Button>
<Button variant="destructive">삭제</Button>
<Button variant="dash" size="full" icon={PlusIcon}>지점 추가</Button>
```

**Props**

| Prop | 타입 | 기본 | 설명 |
|---|---|---|---|
| `variant` | `'default' \| 'sub' \| 'destructive' \| 'dash'` | `'default'` | 시각 강도/의미 |
| `size` | `'full' \| 'fit'` | `'fit'` | 너비 |
| `icon` | `LucideIcon` | — | 좌측/우측 아이콘 |
| `iconPosition` | `'left' \| 'right'` | `'left'` | — |
| `iconSize` | `number` | `16` | — |
| `iconStrokeWidth` | `number` | `1.5` | — |

**variant 가이드**

| variant | 사용처 |
|---|---|
| `default` | 주요 액션 (등록·저장·확인). 폼/모달 풋터의 메인 버튼 |
| `sub` | 보조 액션 (취소·뒤로·필터). 보더 + 투명 배경 |
| `destructive` | 삭제·운영중지 등 되돌리기 어려운 액션 |
| `dash` | "추가" CTA. 점선 보더 + 호버 시 point. 카드 리스트 하단의 "지점 추가" 등 |

> **shadcn `ui/button`을 새 화면에 직접 사용 금지.** (Decision D1)

---

## 2. AppIconButton

아이콘만 노출되는 사각 버튼. 테이블 행 액션, 헤더 우측 액션 등.

```tsx
import AppIconButton from '@/components/AppIconButton'
import { PencilIcon } from 'lucide-react'

<AppIconButton icon={PencilIcon} onClick={...} />
<AppIconButton icon={Trash2Icon} iconSize={14} className="text-danger" />
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | (필수) |
| `iconSize` | `number` | `16` |
| `className` | `string` | — |
| 기타 | `ButtonHTMLAttributes` | — |

- 기본 색은 `text-muted-foreground`. 강조 색은 `className`으로 지정(`text-danger`, `text-point`).
- 호버 시 `bg-muted`.

---

## 3. AppInput

"디자인된 인풋" 책임. 검색·패스워드 variant 내장.

> **004 D9 이후**: 폼 영역(`label` / `error` / `required`)은 **`AppFormField`로 분리**. AppInput에 그대로 두면 동작하지만 `@deprecated`. 신규 폼은 §3-1 패턴 사용.

```tsx
import AppInput from '@/components/app/AppInput'
import { AppFormField } from '@/components/app/AppFormField'

// ✅ 신규(004 D9 이후)
<AppFormField label="사번" required error={errors.employeeNumber?.message}>
  <AppInput placeholder="6자리" {...register('employeeNumber')} />
</AppFormField>

// 🟡 기존(@deprecated, 동작은 유지)
<AppInput label="사번" required placeholder="6자리" />
```

**Props**

| Prop | 타입 | 기본 | 비고 |
|---|---|---|---|
| `variant` | `'default' \| 'search' \| 'password'` | `'default'` | — |
| `label` | `string` | — | `@deprecated` 004 D9 — `AppFormField` 사용 |
| `error` | `string` | — | `@deprecated` 004 D9 — `AppFormField` 사용 |
| `required` | `boolean` | `false` | `@deprecated` 004 D9 — `AppFormField` 사용 |
| 기타 | `InputHTMLAttributes` | — | — |

**가이드**

- 검색 아이콘은 좌측 자동(`variant="search"`). 패스워드 토글은 우측 자동(`variant="password"`).
- react-hook-form과 함께 쓸 때 `register('field')`를 그대로 전달.
- 라벨/에러/필수 표시가 필요하면 `AppFormField`로 감싼다(§3-1).

---

## 3-1. AppFormField

폼 영역 컨테이너. `label / required / error / hint`를 책임지고, 자식으로 인풋 컨트롤(`AppInput`, Phase 2 `AppSelect` / `AppDatePicker` 등)을 받는다.

```tsx
import { AppFormField } from '@/components/app/AppFormField'
import AppInput from '@/components/app/AppInput'

<AppFormField label="이름" required error={errors.name?.message} hint="실명을 입력해주세요">
  <AppInput placeholder="홍길동" {...register('name')} />
</AppFormField>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `label` | `string` | — |
| `required` | `boolean` | `false` |
| `error` | `string` | — |
| `hint` | `string` | — |
| `children` | `ReactNode` | — |
| `className` | `string` | — |

**가이드**

- `error`가 있으면 하단에 12px danger, 없으면 `hint`를 12px secondary로 표시.
- `label`이 없으면 라벨 영역 자체를 미렌더(폼 외 인풋 케이스 호환).
- 도입 사유는 `design-system.md` D9 참조.

---

## 3-2. AppSelect

단일 선택 드롭다운. 017(Phase 2)에서 신설.

```tsx
import AppSelect from '@/components/app/AppSelect'

<AppSelect
  options={[
    { value: 'COMPLETE', label: '완료' },
    { value: 'INCOMPLETE', label: '미완료' },
  ]}
  value={result}
  onChange={setResult}
  placeholder="결과 선택"
/>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `options` | `{ value: string; label: string }[]` | — |
| `value` | `string` | `undefined`(= placeholder 표시) |
| `onChange` | `(value: string) => void` | — |
| `placeholder` | `string` | `'선택'` |
| `disabled` | `boolean` | `false` |
| `className` | `string` | — |
| `aria-label` | `string` | — (외부 라벨이 없을 때만) |
| `icon` | `LucideIcon` | — (018 추가, optional) |
| `active` | `boolean` | `false` (018 추가, optional) |

**가이드**

- **label / error / hint를 갖지 않는다.** 폼에서 쓸 땐 `AppFormField`로 감쌀 것(D9 분담).
- `icon`·`active`는 **필터 트리거로 쓸 때**만 준다(018 추가). `active`는 `AppFilterButton`과 동일한 강조 토큰(`border-point`/`bg-point-bg`/`text-point-foreground`)을 적용한다. 둘 다 optional이라 기존 호출부(`AppPagination`)는 외형이 변하지 않는다.
- 아이콘과 `SelectValue`는 한 `<span>`으로 묶여 있다 — `SelectTrigger` 기본 클래스의 `justify-between`(`ui/select.tsx:24`) 때문에 묶지 않으면 값이 가운데로 벌어진다.
- 트리거는 `<button role="combobox">`다. `<label>`로 감싸도 이름이 연결되지 않으므로, `AppFormField` 밖에서 쓸 땐 `aria-label`을 준다(예: `AppPagination`의 "페이지당 행 수").
- **다중 선택 미지원**(017 결정 — 확정 수요가 없었음). 필요해지면 기본값 `false`인 `multiple` prop으로 확장하며, 기존 호출부는 건드리지 않는다.
- 옵션이 많아도 `ui/select`의 스크롤 버튼이 처리하므로 별도 가상화는 불필요.

---

## 3-3. AppDatePicker

날짜 **범위** 선택. 017(Phase 2)에서 신설.

```tsx
import AppDatePicker from '@/components/app/AppDatePicker'

<AppDatePicker value={range} onChange={setRange} placeholder="기간 선택" />
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `value` | `{ from?: Date; to?: Date }` | — |
| `onChange` | `(range: { from?: Date; to?: Date }) => void` | — |
| `placeholder` | `string` | `'기간 선택'` |
| `disabled` | `boolean` | `false` |
| `className` | `string` | — |
| `active` | `boolean` | `false` (018 추가, optional) |

**가이드**

- **범위 전용**(017 결정 — 단일 날짜 확정 수요 0곳). 단일이 필요해지면 그때 추가.
- `active`는 필터 트리거로 쓸 때의 선택 강조(018 추가). `CalendarIcon`은 이미 내장돼 있어 `icon` prop은 두지 않았다. 강조 토큰은 `AppSelect`·`AppFilterButton`과 동일.
- 값은 `Date` 객체로만 다룬다. **쿼리스트링 직렬화는 소비 측 책임** (`patterns.md` §6, `*Query`의 `from`/`to`).
- 트리거 라벨은 `yyyy-MM-dd ~ yyyy-MM-dd`. `to`가 없으면 시작일만 표시.
- 기존 선택값이 있으면 그 달로 열린다(`defaultMonth`). 없으면 이번 달.
- 달력 로케일은 한국어 고정(`react-day-picker/locale`의 `ko`).

---

## 4. AppCheckbox

라벨이 옆에 붙은 체크박스. 폼 필드와 동일 구조(label/error).

```tsx
import AppCheckbox from '@/components/app/AppCheckbox'

<AppCheckbox label="저장 시 앱 푸시 발송" />
<AppCheckbox label="동의" required error="필수 동의 항목입니다" />
```

**Props**

| Prop | 타입 |
|---|---|
| `label` | `string` |
| `error` | `string` |
| 기타 | `InputHTMLAttributes` (type 제외) |

---

## 5. AppDialog

일반 다이얼로그. 폼/정보 표시용. 위험 액션 확인용이 아니다(그쪽은 §6 AppAlertDialog).

```tsx
import AppDialog from '@/components/app/AppDialog'

<AppDialog
  title="지점 추가"
  description="새 순찰 지점을 등록합니다."
  trigger={<Button icon={PlusIcon}>지점 추가</Button>}
>
  <AddPointForm />
</AppDialog>

// 제어형
<AppDialog title="지점 수정" open={open} onOpenChange={setOpen}>
  <EditPointForm onDone={() => setOpen(false)} />
</AppDialog>
```

**Props**

| Prop | 타입 | 비고 |
|---|---|---|
| `title` | `string` | 필수 |
| `description` | `string` | 선택. 한 줄 부연 |
| `trigger` | `ReactNode` | 비제어형. `asChild`로 감쌈 |
| `open` / `onOpenChange` | `boolean` / `(o: boolean) => void` | 제어형 |
| `children` | `ReactNode` | 본문(폼) |

**규칙**

- 본문 최대 높이 `80vh`. 내부 스크롤 자동.
- 위험 액션(삭제 등)에는 사용하지 않는다 → AppAlertDialog.

---

## 6. AppAlertDialog

확인/위험 액션용. radix의 AlertDialog 래퍼. 아이콘 + 제목 + 설명 + 취소/확인 풋터.

```tsx
import AppAlertDialog from '@/components/AppAlertDialog'
import { Trash2Icon } from 'lucide-react'

<AppAlertDialog
  icon={Trash2Icon}
  variant="destructive"
  title="순찰 지점을 삭제하시겠습니까?"
  description="삭제된 데이터는 복구할 수 없습니다."
  actionLabel="삭제"
  onAction={handleDelete}
>
  <Button variant="destructive">삭제</Button>
</AppAlertDialog>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | — |
| `title` | `string` | (필수) |
| `description` | `string` | — |
| `variant` | `'default' \| 'destructive'` | `'default'` |
| `size` | `'default' \| 'sm'` | `'default'` |
| `cancelLabel` | `string` | `'취소'` |
| `actionLabel` | `string` | `'확인'` |
| `onAction` | `() => void` | (필수) |
| `open` / `onOpenChange` | 제어형 | — |
| `children` | `ReactNode` | 트리거 |

**규칙**

- `destructive`는 되돌리기 어려운 액션(삭제·운영중지·계약 해지 등).
- 메시지는 콘텐츠 톤 규칙(§4 design-system) 따름.

---

## 7. AppEmpty

빈 상태 일관 표시.

```tsx
import AppEmpty from '@/components/app/AppEmpty'
import { MapIcon } from 'lucide-react'

<AppEmpty
  icon={MapIcon}
  title="선택된 구역이 없습니다"
  description="좌측에서 구역을 선택하거나 새로 생성해주세요"
/>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | `InboxIcon` |
| `title` | `string` | `'데이터가 없습니다'` |
| `description` | `string` | — |
| `action` | `ReactNode` | — (선택적 액션 버튼) |

**규칙**

- 페이지 전체가 빈 경우 + 상세 패널이 빈 경우 모두 동일 컴포넌트 사용.
- 메시지 패턴: 상태 + 다음 행동(콘텐츠 톤 §4-3).

---

## 8. (폐기) AppTabs

`components/AppTabs.tsx` — URL 기반 탭(path/query 모드). **011에서 삭제**(참조 0건). 라우터 레벨 레이아웃(`LocationLayout`)이 렌더하던 탭 방식은 009(`PatrolLayout` 폐기)에 이어 011에서 완전히 대체됨.

- **대체 패턴**: 각 페이지가 자신의 라우트 링크 탭을 직접 렌더(`NavLink` + `border-point` 강조). `PatrolHistoryTabs`(`features/patrol-zones/components/`), `CourseTabs`(`features/zone/components/`) 참조.
- **사유**: 라우터 레이아웃이 탭을 감싸면 페이지별 헤더(`AppPageHeader`)와 탭의 순서(헤더 → 탭 → 컨텐츠)를 페이지가 통제할 수 없어 리디자인 목업과 어긋남. 페이지 로컬 탭 컴포넌트가 순서 통제 + 라우트 그룹 평탄화(라우터 트리 단순화) 모두에 유리.

---

## 9. AppTable

`@tanstack/react-table` 래퍼. 정렬/검색/페이지네이션 내장.

```tsx
import AppTable from '@/components/AppTable'
import { zoneColumns } from '@/features/patrol-zones/components/ZoneColumn'

<AppTable
  columns={zoneColumns}
  data={zonePatrols}
  searchable
  onRowClick={(row) => setSelected(row)}
/>
```

**Props**

| Prop | 타입 | 비고 |
|---|---|---|
| `columns` | `ColumnDef<TData, any>[]` | tanstack 표준 |
| `data` | `TData[]` | — |
| `searchable` | `boolean` | global filter 인풋 노출 |
| `onRowClick` | `(row: TData) => void` | 행 클릭 시 콜백 |

**규칙**

- 기본 pageSize 10. 외부 `pageSize` prop 지원. 페이지네이션 UI(이전/다음 + N/M + 전체 N건)는 footer로 자동 노출 — 006에서 도입.
- 컬럼 정의는 도메인 디렉터리에 둔다(`features/{domain}/components/*Column.tsx`).
- 정렬 가능 헤더는 자동으로 정렬 아이콘 표시.
- 빈 상태 메시지: "데이터가 없습니다". 필요 시 컬럼 셀 안 커스터마이즈.
- **`data` prop은 안정된 배열 참조로 전달할 것(`useMemo`)** — 014에서 확인된 이슈: 렌더마다 `.filter()`/`.map()`으로 새 배열을 만들어 그대로 넘기면(특히 `pagination`/`onPaginationChange`를 컨트롤드로 함께 쓸 때) 실 브라우저에서 무한 재렌더 루프가 발생할 수 있다(jsdom 테스트로는 재현 안 됨 — 브라우저에서만 확인 필요). 원본 배열이 아닌 파생 배열을 넘길 때는 반드시 `useMemo([원본, ...의존값])`로 감쌀 것.

---

## 9-1. AppPageHeader

페이지 최상단 제목/부제/우측 액션. 008(R1)에서 신설.

```tsx
import AppPageHeader from '@/components/app/AppPageHeader'
import Button from '@/components/app/AppButton'
import { PlusIcon } from 'lucide-react'

<AppPageHeader
  title="근무자"
  subtitle="강동 테크노타워 소속 근무자 8명"
  action={<Button icon={PlusIcon}>근무자 추가</Button>}
/>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `title` | `string` | (필수) |
| `subtitle` | `string` | — |
| `action` | `ReactNode` | — (우측 정렬 슬롯, 보통 주요 액션 버튼) |

---

## 9-2. AppFilterButton

기간/코스/결과 등 드롭다운·팝오버 필터의 트리거 시각. 008(R1)에서 신설.

```tsx
import AppFilterButton from '@/components/app/AppFilterButton'
import { CalendarIcon } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

<Popover>
  <PopoverTrigger asChild>
    <AppFilterButton icon={CalendarIcon} label="기간 선택" active={!!range} />
  </PopoverTrigger>
  <PopoverContent>{/* 필터 콘텐츠는 소비 측이 구성 */}</PopoverContent>
</Popover>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | — |
| `label` | `string` | (필수) |
| `active` | `boolean` | `false` — 선택된 필터 강조(테두리+배경 point) |
| 기타 | `ButtonHTMLAttributes` | — |

**규칙**

- 트리거 시각만 제공. 팝오버/드롭다운 콘텐츠 조립은 소비 측(각 화면) 책임.
- `asChild`로 radix `PopoverTrigger`/`DropdownMenuTrigger`에 감쌀 수 있도록 ref를 전달한다.
- **`AppSelect`·`AppDatePicker`를 `AppFilterButton`으로 감싸지 않는다**(018 결정). 둘은 이미 자체 트리거 버튼을 갖고 있어 감싸면 **버튼 안에 버튼**이 되어 DOM이 무효가 되고 포커스·키보드 동작이 깨진다. 그래서 두 primitive에 `icon`·`active`를 직접 추가해 필터 트리거로 쓴다(§3-2·§3-3).
- `AppFilterButton`은 **자체 트리거가 없는 커스텀 팝오버 필터**에만 쓴다. 현재 소비처는 `/users` 2곳.

---

## 9-3. AppPagination

리디자인 페이지네이션(페이지당 행수 선택 + 현재 범위 + 이전/다음). 008(R1)에서 신설. **기존 `AppTable` 내장 페이지네이션과 별개** — 테이블 라이브러리 비의존 독립 컴포넌트.

페이지당 행 수 컨트롤은 017에서 네이티브 `<select>` → `AppSelect`로 교체했다.

```tsx
import AppPagination from '@/components/app/AppPagination'

<AppPagination
  pageIndex={pageIndex}
  pageSize={pageSize}
  total={total}
  onPageChange={setPageIndex}
  onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0) }}
/>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `pageIndex` | `number` | (필수, 0-based) |
| `pageSize` | `number` | (필수) |
| `total` | `number` | (필수) |
| `onPageChange` | `(pageIndex: number) => void` | (필수) |
| `onPageSizeChange` | `(pageSize: number) => void` | (필수) |
| `pageSizeOptions` | `number[]` | `[10, 25, 50]` |

**규칙**

- 페이지 번호 버튼 없음 — "a–b / 전체 N개 항목" 텍스트 + 화살표만.
- `pageSize` 변경 시 `pageIndex`를 0으로 리셋하는 책임은 **소비 측**에 있다(컴포넌트는 콜백만 발행).
- 행 수 셀렉트는 `AppSelect` + `aria-label="페이지당 행 수"` + `className="h-7 w-auto text-xs"`(기본 `h-8 w-full text-sm`은 페이지네이션 밀도에 과함). 값은 `number` ↔ `string` 변환만 하고 계약(`pageSizeOptions: number[]`)은 그대로 유지한다.
- `AppTable`에서 이 컴포넌트로 전환하려면 `<AppTable hidePagination>` + 페이지 상태를 직접 들고 `AppPagination`을 별도 렌더 (마이그레이션은 009~015 각 화면에서 개별 진행, `data-model.md` §2-1 1-based API 페이지 번호와 pageIndex(0-based) 변환 주의).

---

## 9-4. AppDetailCard / AppDetailRow

마스터-디테일 우측 상세 패널 표준 컨테이너(`patterns.md` §1, §11). 008(R1)에서 신설.

```tsx
import AppDetailCard from '@/components/app/AppDetailCard'
import AppDetailRow from '@/components/app/AppDetailRow'
import AppBadge from '@/components/app/AppBadge'
import { LayersIcon } from 'lucide-react'

<AppDetailCard
  icon={LayersIcon}
  title="B동 순찰코스"
  badge={<AppBadge variant="danger">미완료</AppBadge>}
  footer={<Button variant="destructive" size="full">근무자 삭제</Button>}
>
  <AppDetailRow label="시작 일시" value="2026-05-01 10:00:00" />
  <AppDetailRow label="종료 일시" value="2026-05-01 10:45:00" />
  <AppDetailRow label="지점 수" value="8개" />
  {/* 타임라인 등 추가 섹션은 children으로 자유 배치 */}
</AppDetailCard>
```

**Props (`AppDetailCard`)**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | — |
| `title` | `string` | (필수) |
| `badge` | `ReactNode` | — 헤더 하단 상태 뱃지(보통 `AppBadge`) |
| `footer` | `ReactNode` | — 하단 액션 풋터(비밀번호/수정/삭제 등) |
| `children` | `ReactNode` | (필수) 바디 — `AppDetailRow` 등 자유 조립 |

**Props (`AppDetailRow`)**

| Prop | 타입 |
|---|---|
| `label` | `string` |
| `value` | `ReactNode` |

**규칙**

- 바디는 고정 스키마가 아니라 children 슬롯 — 정보행(`AppDetailRow`) 외 타임라인 등 도메인 컴포넌트도 그대로 끼워 넣을 수 있다.
- 빈 상태(미선택)는 `AppDetailCard`가 아니라 `AppEmpty`를 사용한다 — 단, 카드 경계(`rounded-lg border border-border bg-card p-4`)는 유지하도록 감싼다(patterns.md §1, 010에서 결정).

---

## 9-5. AppKpiCard

통계 타일(아이콘 원형 배지 + 라벨 + 큰 숫자 + 단위). 008(R1)에서 신설.

```tsx
import AppKpiCard from '@/components/app/AppKpiCard'
import { ArrowRightIcon } from 'lucide-react'

<AppKpiCard icon={ArrowRightIcon} label="배치 나간 인원" value={1} unit="명" tone="point" />
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `icon` | `LucideIcon` | (필수) |
| `label` | `string` | (필수) |
| `value` | `ReactNode` | (필수) |
| `unit` | `string` | — |
| `tone` | `'point' \| 'success' \| 'warning' \| 'danger'` | `'point'` |

---

## 9-6. AppBadge

상태/결과 뱃지. `design-system.md` §1-1 시맨틱 5색(`success`/`point`/`warning`/`danger`/`muted`) 기반. 008(R1)에서 신설.

```tsx
import AppBadge from '@/components/app/AppBadge'

<AppBadge variant="success">완료</AppBadge>
<AppBadge variant="danger">미완료</AppBadge>
<AppBadge variant="warning">순찰제외</AppBadge>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `variant` | `'success' \| 'point' \| 'warning' \| 'danger' \| 'muted'` | `'muted'` |
| `children` | `ReactNode` | (필수) — 색만으로 상태 전달 금지, 텍스트 항상 동반 |

**규칙**

- 라벨→variant 매핑은 화면별로 다르다(예: 코스 이력 `진행중`, 지점 이력 `순찰기록` 등). 각 화면 spec이 `design-system.md` §1-1 매핑표를 참조해 결정 — `AppBadge`는 색 프리미티브만 제공.
- `cva` variants는 `AppBadge.variants.ts`에 분리(`react-refresh/only-export-components` 회피, CLAUDE.md B4).

---

## 10. shadcn 원시 컴포넌트 사용 가이드

App* 컴포넌트로 커버되지 않는 경우만 shadcn 원시를 **직접** 사용한다.

| 컴포넌트 | 직접 사용 권장 시나리오 |
|---|---|
| `ui/sheet` | 우측 슬라이드 패널, 알림 시트(`AlarmSheet`), **모바일 사이드바**(layout.md §5-6), **우측 상세 패널 반응형 전환**(patterns.md §8) |
| `ui/switch` | 토글 단독 사용 (운영중/중지, 코스 활성화 등) |
| `ui/dropdown-menu` | 행 컨텍스트 메뉴, 트리 노드 메뉴 |
| `ui/tabs` | 비-라우트 탭(URL과 무관한 단순 전환) |
| `ui/dialog` / `ui/alert-dialog` | App* 안에서만 사용. 직접 사용 지양 |

---

## 11. 신규 컴포넌트 추가 기준

새 App* 컴포넌트를 만들 때 다음 기준 모두 충족 시.

1. 같은 패턴이 **3개 이상 화면**에서 반복된다.
2. shadcn 원시만으로는 토큰/라벨/에러 처리가 매번 중복된다.
3. 도메인 비-의존 (특정 사업장/지점/근무자에 종속 X).

> 만족 안 하면 `features/{도메인}/components/`에 도메인 컴포넌트로 둔다.

---

## 12. Open Questions

신규 컴포넌트 개발·기존 컴포넌트 수정은 **추후 task 계획 후 결정**한다.

- [x] `AppTable` **페이지네이션 UI** — **해소(006)**: footer로 이전/다음 + 페이지 N/M(1-based) + 전체 N건 노출. `pageSize` prop 지원. URL 쿼리 연동은 Phase 3 첫 사용처(`/patrol/zones`)에서 `useQueryParams`와 통합.
- [x] `AppSelect` — **해소(017)**: §3-2 참조. 단일 선택 전용, `AppFormField`와 분담.
- [x] `AppDatePicker` — **해소(017)**: §3-3 참조. 범위(from~to) 전용, 단일 날짜는 수요 발생 시.
- [ ] **Toast 래퍼** — Toast 시스템 자체는 **sonner 확정**([`design-system.md`](./design-system.md) D6). App* 래퍼가 필요한지 여부만 추후 결정

> AppFormField 도입은 004 D9에서 해소(§3-1 참고).

---

## 차트 (recharts) — 2026-10-10 도입

> 첫 사용처: 지점 상세의 **순찰 인증 기록**(`features/points/components/detail/PatrolBarChart.tsx`).
> 프로젝트의 **첫 차트**라 이 파일이 사실상 컨벤션이 된다.

**왜 라이브러리인가** — 직접 그린 div 막대는 **축·눈금·툴팁이 없어 읽히지 않았다**(실제
캡쳐로 확인). 그 셋은 직접 만들면 금방 어설퍼지는 종류다. 사용자 결정으로 `recharts` 도입.

### 규칙

1. **형태는 데이터의 일이 정한다.** 하루 단위 이산 횟수 → **막대**. 선 그래프는 점 사이를
   이어 "연속적으로 변한다" 고 말하는데, 순찰은 **그날 있었거나 없었거나**다.
2. 🔴 **색은 CSS 변수로 칠한다**(`fill="var(--color-point)"`). 하드코딩하면 **다크 모드에서
   따라오지 않는다**.
3. **단일 계열이면 범례를 두지 않는다** — 제목이 곧 범례다. 계열이 2개 이상이면 범례 필수.
4. 🔴 **축 양 끝(첫·마지막)을 반드시 라벨링한다.** `interval` 에 맡기면 끝이 잘려 **"오늘"
   에 라벨이 없는** 일이 생긴다(2026-10-10 실제 발생). `ticks` 배열로 직접 고른다.
5. **횟수·개수 축은 `allowDecimals={false}`** — 0.5회 눈금이 생기면 안 된다.
6. **grid·axes 는 뒤로 물린다** — 가로 점선만, 축선 없음, 라벨은 `muted-foreground`.
7. **툴팁은 기본 제공한다**(마크보다 큰 히트 영역). 숫자는 **계열 색이 아니라 본문 잉크**로
   쓴다 — 색은 막대가 들고 있다.
8. **이중 축(y축 2개)을 만들지 않는다.** 단위가 다른 두 값은 차트를 나눈다.
