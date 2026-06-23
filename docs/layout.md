# 레이아웃 (layout.md)

> 본 프로젝트의 **레이아웃 셸**과 그 구성 요소 가이드.
> 디자인 토큰은 [`design-system.md`](./design-system.md), 컴포넌트는 [`components.md`](./components.md), 사용자 동선은 [`flow.md`](./flow.md) 참조.

---

## 0. 전체 셸 구조

```
┌─────────────────────────────────────────────────┐
│              .app-shell (전체 100vh)            │
│ ┌─────────┬─────────────────────────────────┐   │
│ │         │           TopNav                │   │
│ │ Sidebar ├─────────────────────────────────┤   │
│ │  w-70   │                                 │   │
│ │         │   Contents (Outlet)             │   │
│ │         │   bg-contents-background        │   │
│ └─────────┴─────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- `.app-shell` 유틸 = `display:flex; height:100vh; overflow:hidden;` (`src/index.css` 정의)
- 사이드바: 고정 폭 `w-70`
- 우측 컬럼: `flex flex-col min-h-0 flex-1` → TopNav + Contents(`flex-1 overflow-hidden`)
- 컨텐츠 영역은 자체 스크롤. 페이지 단위 패딩(보통 `p-8`)은 각 페이지가 결정.

---

## 1. AppLayout

`src/components/layout/AppLayout.tsx`

전체 셸을 그리고 `<Outlet />`을 컨텐츠 자리에 둔다. `AuthGuard` 통과 시 진입.

```tsx
// 인증 성공 → AppLayout → 페이지(Outlet)
<AuthGuard>
  <AppLayout />
</AuthGuard>
```

**규칙**

- 페이지가 자체 헤더를 그리지 않는다(헤더는 TopNav가 담당).
- 페이지는 `<Outlet>` 안에서 `flex-1` 또는 그에 준하는 레이아웃을 가정한다.

---

## 2. Sidebar

`src/components/layout/sidebar/Sidebar.tsx` + `SidebarGroup`, `SidebarItem`, `SidebarToggle`, `sidebar.config.ts`

```
┌─────────────────┐
│ [🛡] PATROL     │  ← 헤더 (로고 + 사이트 뱃지)
├─────────────────┤
│   관리          │  ← 그룹 헤더
│   ◯ 순찰이력    │
│   ◯ 구역/지점   │
│                 │
│   알림          │
│   ◯ 공지사항    │
├─────────────────┤
│ [<] 접기        │  ← SidebarToggle (좌측 하단)
└─────────────────┘
```

### 2-1. 구성

| 요소 | 역할 |
|---|---|
| 헤더 | 브랜드 로고 + (본사 사이트) `ADMIN` 뱃지 |
| `SidebarGroup` | 그룹 헤더("관리" / "알림") + 그 안 아이템 묶음 |
| `SidebarItem` | 아이콘 + 라벨. 활성 시 좌측 보더 + accent 배경 |
| `SidebarToggle` | 좌측 하단 "접기" / 사이트 이동 링크 자리 |

### 2-2. 메뉴 정의 (`sidebar.config.ts`)

```ts
export interface MenuItemType {
  icon: LucideIcon
  title: string
  url: string
  activeUrl?: string[]    // 동일 영역의 여러 라우트를 한 메뉴로 묶을 때
}
export interface MenuGroupType {
  title: string
  groups: MenuItemType[]
}
```

- 현장 사이트 메뉴: `관리 > 순찰이력 / 구역·지점 / 사용자관리`, `알림 > 공지사항`.
- 본사 사이트 메뉴: `본사 관리 > 사업장 관리 / 관리자 관리` (별도 config 분리 필요 — §6 Open Q).

### 2-3. 활성 판단 규칙

- 우선순위: `activeUrl`(배열) > `url`(단일).
- 매칭: `pathname.startsWith(...)`.
- 예: 구역·지점 메뉴는 `activeUrl: ['/zones', '/points']`로 두 라우트 모두 활성.

### 2-4. 활성 스타일

- 활성: 좌측 보더 `border-l-2 border-primary` + `bg-sidebar-accent` + `text-sidebar-accent-foreground`.
- 비활성: `text-muted-foreground` + `hover:bg-sidebar-accent` + `hover:text-sidebar-accent-foreground`.
- 아이콘: stroke 1.5.

### 2-5. 접기/펼치기

- **사이드바 접기 기능은 1차 범위에서 제외**한다.
- 사유: 메뉴 수가 적고(본사 2 / 현장 4), PC 환경에서 사이드바 폭(280px)이 컨텐츠를 압박하지 않음. 접기를 운영하면 상태 관리·아이콘 only 모드·툴팁 등 부가 구현 비용이 큼.
- `SidebarToggle` 컴포넌트는 코드에 남아 있으나 본 가이드에서는 사용을 권장하지 않는다.
- 모바일 분할화면 대응은 §5에서 별도 처리.

---

## 3. TopNav

`src/components/layout/topnav/TopNav.tsx` + `ProfileBadge`, `AlarmSheet`

```
┌─────────────────────────────────────────────────┐
│ 현재 메뉴명                  [🔔] [👤 프로필]    │
└─────────────────────────────────────────────────┘
```

### 3-1. 구성

| 요소 | 역할 |
|---|---|
| 좌측 라벨 | 현재 진입한 메뉴 이름 (현재 하드코딩 — §6 Open Q) |
| `AlarmSheet` | 알림 아이콘 → 우측 `Sheet` 패널 |
| `ProfileBadge` | 사용자 아바타. 클릭 시 메뉴(로그아웃 등) — 미구현 |

### 3-2. 규칙

- 페이지가 자체 헤더를 그리지 않는다. 페이지명·브레드크럼·필터는 컨텐츠 내부에서 처리.
- 알림은 `Sheet`로 우측에서 슬라이드.
- 프로필 뱃지는 둥근 아바타(목업 기준 그라데이션 또는 이니셜).

---

## 4. 컨텐츠 영역

`<Outlet />`이 들어가는 자리. 페이지 단위로 자체 레이아웃 책임.

### 4-1. 단일 컬럼

```
┌──────────────────────────────────────┐
│  (페이지 컨텐츠 — p-8)               │
└──────────────────────────────────────┘
```

### 4-2. 마스터-디테일 (가장 흔한 패턴)

```
┌──────────────┬───────────────────────┐
│   목록       │   선택 항목 상세      │
│   (좌)       │   (우)                │
│   border-r   │                       │
└──────────────┴───────────────────────┘
```

- 좌 폭 권장: `w-300`(px) 또는 `flex-7 : flex-3` 비율(이력 목록 페이지).
- 좌측은 자체 스크롤(`overflow-hidden` + 내부 스크롤).
- 우측 빈 상태: `AppEmpty`.

### 4-3. 탭 레이아웃

`LocationLayout`(구역·지점) / `PatrolLayout`(순찰이력) — `AppTabs` + `<Outlet>` 조합.

```
┌──────────────────────────────────────┐
│  [탭1] [탭2]                         │
├──────────────────────────────────────┤
│  (탭의 자식 라우트 Outlet)           │
└──────────────────────────────────────┘
```

### 4-4. 좌측 트리 + 우측 테이블 (본사 사업장 관리)

```
┌──────────────┬───────────────────────┐
│ 관리그룹     │  사업장 테이블        │
│ 트리         │  (검색바 + 행)        │
│              │                       │
└──────────────┴───────────────────────┘
```

- 트리는 `features/zone/components/zone-tree/*` 패턴 참고.
- 사업장 행 클릭 → `/admin/locations/:id` 상세 페이지로 라우팅(브레드크럼 표시).

---

## 5. 페이지 공통 규칙

### 5-1. 페이지 헤더 (필요 시)

- 컨텐츠 영역 내부 상단에 둠. TopNav 사용 금지.
- 패턴: 좌측에 제목/브레드크럼, 우측에 주요 액션 버튼.
- 예: 사업장 상세 페이지의 "운영중지" 버튼.

### 5-2. 필터 바

- 페이지 상단(또는 테이블 위)에 가로 정렬.
- 좌: 검색 인풋(`AppInput variant="search"`) + 셀렉트들. 우: Export 등 우측 정렬 액션.
- 필터 상태는 URL 쿼리스트링.

### 5-3. 패딩

- 페이지 외곽: `p-8` (특히 이력 목록·코스 상세).
- 마스터-디테일의 좌측 컬럼은 패딩 없이 행 단위로 처리.

### 5-4. 스크롤

- 컨텐츠 영역은 `overflow-hidden` 컨테이너 안에서 **각자 스크롤**한다.
- 페이지 전체 스크롤(브라우저 스크롤)은 사용하지 않는다(`.app-shell`이 `overflow:hidden`).

### 5-5. 반응형 (PC 기본)

- PC 기준. 모바일 전용 기능은 만들지 않는다.
- 분할화면 대응 동선은 §5-6에서 상세.

### 5-6. 모바일 / 분할화면 레이아웃 (확정)

뷰포트 폭 **`lg` 미만(< 1024px)** 에서 사이드바 표시 방식을 전환한다.

```
[lg 이상 (>= 1024px)]              [lg 미만 (< 1024px)]
┌─────┬──────────────┐             ┌────────────────────┐
│ SB  │ TopNav        │             │ [☰] TopNav         │
│     ├──────────────┤             ├────────────────────┤
│     │ Contents      │             │  Contents          │
└─────┴──────────────┘             └────────────────────┘
                                    햄버거 클릭 → Sidebar Sheet
                                    (좌측 슬라이드, ui/sheet)
```

**규칙**

- `lg` 이상: 기존 그대로(좌측 고정 사이드바 + 우측 컬럼).
- `lg` 미만: 사이드바는 화면에서 빠지고, TopNav 좌측에 **햄버거 아이콘** 노출(`MenuIcon`, `lg:hidden`).
- 햄버거 클릭 → 사이드바 내용물을 **`ui/sheet`** 로 좌측에서 슬라이드.
- 라우트 이동 시 Sheet 자동 닫힘.
- 사이드바 자체 컴포넌트는 동일. Sheet는 래핑만 담당.

---

## 6. Open Questions

추후 task 계획 후 결정.

- [x] **본사 사이드바 config 분리** — **해소(006)**: `AdminMenus` export 추가(사업장 관리·관리자 관리). `Sidebar.tsx`가 `isAdminArea`로 자동 분기.
- [x] **TopNav 현재 메뉴명 동기화** — **해소(006)**: `menu-lookup.ts` 신설. `ServiceMenus` + `AdminMenus`에서 자동 도출(정확 매칭 > prefix 매칭 > 빈 문자열).
- [x] **ProfileBadge 메뉴** — **해소(006)**: shadcn `dropdown-menu` 기반 드롭다운. 사용자명(useMe) + 내 정보(placeholder) + 로그아웃(토큰 clear + invalidate + 영역별 로그인 이동).
- [ ] **알림 시트 본문** — 현재 비어 있음. 알림 목록 형태(읽음/안읽음·시간) 정의 필요. **Phase 2 공용 컴포넌트 확충**으로 이월.
