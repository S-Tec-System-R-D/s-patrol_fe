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
| `AppCheckbox` | `components/app/AppCheckbox.tsx` | 체크박스 | ✅ 표준 |
| `AppDialog` | `components/app/AppDialog.tsx` | 일반 다이얼로그(폼·정보) | ✅ 표준 |
| `AppAlertDialog` | `components/AppAlertDialog.tsx` | 확인/위험 액션 다이얼로그 | ✅ 표준 |
| `AppEmpty` | `components/app/AppEmpty.tsx` | 빈 상태 | ✅ 표준 |
| `AppTabs` | `components/AppTabs.tsx` | URL 연동 탭 | ✅ 표준 |
| `AppTable` | `components/AppTable.tsx` | tanstack-table 래퍼 | ✅ 표준 |
| `ui/button` | `components/ui/button.tsx` | shadcn 원시 | ⛔ 신규 금지 (점진 제거) |
| `ui/dialog` | `components/ui/dialog.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/alert-dialog` | `components/ui/alert-dialog.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/tabs` | `components/ui/tabs.tsx` | shadcn 원시 | 내부 구현용 |
| `ui/sheet` | `components/ui/sheet.tsx` | shadcn 원시 | 사이드 패널·알림 시트 |
| `ui/switch` | `components/ui/switch.tsx` | shadcn 원시 | 토글 직접 사용 가능 |
| `ui/dropdown-menu` | `components/ui/dropdown-menu.tsx` | shadcn 원시 | 컨텍스트 메뉴 직접 사용 가능 |

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

라벨·에러·필수 표시·검색·패스워드 토글까지 한 컴포넌트로.

```tsx
import AppInput from '@/components/app/AppInput'

<AppInput label="사번" required placeholder="6자리" />
<AppInput variant="search" placeholder="이름 검색" />
<AppInput variant="password" label="비밀번호" required />
<AppInput label="이름" error="이름을 입력해주세요" />
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `label` | `string` | — |
| `error` | `string` | — |
| `required` | `boolean` | `false` |
| `variant` | `'default' \| 'search' \| 'password'` | `'default'` |
| 기타 | `InputHTMLAttributes` | — |

**가이드**

- 라벨이 있으면 상단에 14px medium으로 노출. 필수는 `*`(danger).
- 에러가 있으면 하단에 12px danger.
- 검색 아이콘은 좌측 자동. 패스워드 토글은 우측 자동.
- react-hook-form과 함께 쓸 때 `register('field')`를 그대로 전달.

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

## 8. AppTabs

URL 기반 탭. path 모드(현재 라우트 일치) / query 모드(쿼리스트링).

```tsx
import AppTabs from '@/components/AppTabs'
import { LayersIcon, MapPinIcon } from 'lucide-react'

<AppTabs
  tabs={[
    { label: '구역', path: '/zones', icon: LayersIcon },
    { label: '지점', path: '/points', icon: MapPinIcon },
  ]}
/>
```

**Props**

| Prop | 타입 | 기본 |
|---|---|---|
| `tabs` | `{ label: string; path: string; icon: LucideIcon }[]` | (필수) |
| `mode` | `'path' \| 'query'` | `'path'` |
| `queryKey` | `string` | `'tab'` (query 모드일 때) |

**규칙**

- 활성 판단: `pathname.startsWith(tab.path)`.
- 아이콘 stroke 1.5 자동.
- 탭 클릭은 `navigate(path)`로 라우팅. `LocationLayout`, `PatrolLayout`에서 사용 중.

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

- 기본 pageSize 10. (현재 페이지네이션 UI 미노출 → §10 Open Q)
- 컬럼 정의는 도메인 디렉터리에 둔다(`features/{domain}/components/*Column.tsx`).
- 정렬 가능 헤더는 자동으로 정렬 아이콘 표시.
- 빈 상태 메시지: "데이터가 없습니다". 필요 시 컬럼 셀 안 커스터마이즈.

---

## 10. shadcn 원시 컴포넌트 사용 가이드

App* 컴포넌트로 커버되지 않는 경우만 shadcn 원시를 **직접** 사용한다.

| 컴포넌트 | 직접 사용 권장 시나리오 |
|---|---|
| `ui/sheet` | 우측 슬라이드 패널, 알림 시트(`AlarmSheet`), **모바일 사이드바**(layout.md §5-6), **우측 상세 패널 반응형 전환**(patterns.md §8) |
| `ui/switch` | 토글 단독 사용 (운영중/중지, 코스 활성화 등) |
| `ui/dropdown-menu` | 행 컨텍스트 메뉴, 트리 노드 메뉴 |
| `ui/tabs` | AppTabs로 처리 안 되는 비-라우트 탭 |
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

- [ ] `AppTable` **페이지네이션 UI** — 필요(확정). 현재 페이지 사이즈만 있고 UI 미노출. **추후 task**
- [ ] `AppSelect` — 미존재. 사업장 선택·권한 선택 등에 필요. **추후 task**
- [ ] `AppDatePicker` — 사업장 계약기간·이력 필터 등에 필요. **추후 task**
- [ ] **AppFormField 도입** — 폼 영역(label/error/required)을 별도 컴포넌트로 분리할지 결정 필요. 자세한 분석/결정은 [`design-system.md`](./design-system.md) §6 Open Q 참조
- [ ] **Toast 래퍼** — Toast 시스템 자체는 **sonner 확정**([`design-system.md`](./design-system.md) D6). App* 래퍼가 필요한지 여부만 추후 결정
