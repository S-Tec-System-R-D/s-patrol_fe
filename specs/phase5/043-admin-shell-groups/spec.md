# 043-admin-shell-groups spec

> 위험도: **A** (`screens.md` §2-2 — 관리그룹 추가/수정/삭제가 A. 🔴 그룹 삭제는 하위 그룹·소속 사업장까지 함께 지운다 — B-51)
> 관련 화면: 본사 셸(`/admin/*` 전체) · 관리그룹 트리(사업장·관리자 화면 좌측) · 관리그룹 편집 모달 (~~본사 로그인의 사업장 선택 단계~~ — US4 철회)
> Phase: `roadmap.md` Phase 5 §9-0 — 3분할 중 첫 번째(043 → 044 → 045)
> 목업: `docs/ui-mock/본사관리자/S-Patrol-Admin v2 (standalone).html` — **레이아웃 · 배치 · 워크플로우만 참고**, 시각은 현장 리디자인 `App*` 컴포넌트로(사용자 지시 2026-10-22)

---

> ✅ **WF-1-0 실측 완료**(2026-10-22) — `api-spec.md` §5-1-B "관리그룹 3종" · B-49 ~ B-51 · B-1 재확인.
> 만든 그룹 4개(seq 7~10)·사업장 1개(seq 13)는 지웠고, 트리·기존 할당이 시작 전과 같음을 확인했다.

## 0. Carry-over

### 직전 spec(`042-deployments-real`) `## 다음 spec으로 이월` 에서

| 이월 항목 | 본 spec 처리 |
|---|---|
| ① 브라우저 확인 | ✅ 042 에서 완료 — 해당 없음 |
| ② 백엔드 회신 대기(이력 사유 · 복귀일 · B-48 · OQ-042-C) | **범위 외** — 배치관리 전용. 회신 오면 042 후속으로 |

### Phase 5 이월(`spec 021` → `roadmap.md` §9-1 "본사 사업장 선택")

| 이월 항목 | 본 spec 처리 |
|---|---|
| 본사 로그인에서 `siteSeq` 를 저장하지 않는다(`LoginForm.tsx:86`) | 🔴 **철회(사용자 결정 2026-10-23)** — **저장하지 않는 지금 동작이 맞다.** 사업장 선택은 현장관리자(소속 2개 이상)만 한다. 본사 3종은 로그인하면 본사 화면으로 바로 간다. "현장 사이트로 이동" 도 없다 |
| `AuthGuard` 의 본사 예외(`isAdmin`) 제거 | 🔴 **제거하지 않는다** — §3 규칙 7. 본사 계정은 `siteSeq` 가 없으므로 요구하면 본사에 못 들어간다 |

---

## User Stories

- **US1.** 본사 관리자가 `/admin/*` 에서 **현장 사이트와 같은 68px 레일 셸**로 사업장 · 관리자 메뉴를 오간다. TopNav 는 없다.
- **US2.** 본사 관리자가 사업장·관리자 화면 좌측의 **관리그룹 트리**에서 그룹을 골라 범위를 정한다. 넓은 화면(XL 이상)은 고정 패널, 좁은 화면은 경로 버튼 + 좌측 시트다. 고른 그룹은 URL 에 남는다.
- **US3.** 시스템관리자·Master 가 **관리그룹 편집 모달**에서 하위 그룹을 추가하고, 이름을 바꾸고, 삭제한다. 삭제 전에 함께 지워지는 하위 그룹·사업장 수를 본다.
- ~~**US4.** 본사 관리자가 로그인할 때 사업장을 고르고, 레일의 "현장 사이트로 이동" 으로 그 사업장의 현장 화면에 들어간다.~~ 🔴 **철회(사용자 결정 2026-10-23)** — 사업장 선택은 현장관리자만 한다. 본사 3종은 로그인 → 본사 화면 직행, 레일에 현장 이동 링크 없음(T776).

---

## 1. 목적

본사 사이트는 Phase 1 의 옛 셸(사이드바 w-70 + TopNav)에 placeholder 하나만 있다. 본 spec 은 044(사업장)·045(관리자)가
올라설 **바닥**을 만든다 — 현장과 같은 레일 셸, 두 화면이 함께 쓰는 관리그룹 트리, 그룹 편집, 그리고 021 이 미뤄 둔 본사
사업장 선택. 🔴 원칙(사용자 결정 2026-10-22, `roadmap.md` §9-0): **서버에 있는 것만 동작시킨다. 없는 것은 자리를 두고
막아 두며(입력 `disabled`), 필요 여부를 판정해 요청으로 남긴다.**

---

## 2. I/O

### 2-1. API (실측 확정 — `api-spec.md` §5-1 · §5-1-B · §5-2)

| API | 요청 | 응답 `data` | 쓰는 곳 |
|---|---|---|---|
| `GET Login/W/sign/AdminSiteSelect` | — | `GroupNode`(루트 1개, 그룹·사업장 이중 재귀) | 트리 · 편집 모달 · 로그인 사업장 선택 |
| `POST Group/W/sign/AddGroup` | `{ parentGroupSeq, groupName, userSeq: [] }` | `true`(ID 미반환) | 하위 그룹 추가 |
| `PUT Group/W/sign/UpdateGroup` | `{ groupSeq, parentGroupSeq, groupName, userSeq }` | `true` | 이름 변경 |
| `DELETE Group/W/sign/DeleteGroup` | `?groupSeq` | `true` | 삭제 |
| `GET Group/W/sign/GetGroupAdminList` | `?groupSeq` | `GroupAdminRow[]` | 🔴 이름 변경 직전 **현재 할당 읽기 전용**(B-50) |

```ts
// api-spec.md §5-2 그대로. 어댑터 없음(B4) — 트리 화면은 이 모양을 그대로 쓴다
interface SiteNode { siteSeq: number; siteName: string; parentSiteSeq: number | null; children: SiteNode[] }
interface GroupNode {
  groupSeq: number; groupName: string; parentGroupSeq: number | null
  layer: number; depth: number          // 0 회사 · 1 본부 · 2 지사 (값이 같게 관측)
  sites: SiteNode[]; children: GroupNode[]
}
interface GroupAdminRow { userSeq: number; codeSeq: number; codeName: string; userName: string; isInclude: boolean }
interface AddGroupRequest { parentGroupSeq: number; groupName: string; userSeq: number[] }
interface UpdateGroupRequest { groupSeq: number; parentGroupSeq: number; groupName: string; userSeq: number[] }
```

- 🔴 **`GetGroupList` 는 쓰지 않는다** — 500(B-1). 트리 출처는 `AdminSiteSelect` 하나다.
- 🔴 **`UpdateGroup` 은 `userSeq` 를 항상 싣는다** — 빼면 할당이 전부 지워진다(B-50). 이름 변경 직전에 `GetGroupAdminList` 로
  `isInclude: true` 인 `userSeq` 를 모아 그대로 보낸다. `parentGroupSeq` 도 현재 값 그대로(이동 기능은 목업에 없다).
- 변경 성공 → 트리 쿼리 무효화. ID 를 주지 않으므로 새 그룹은 재조회로 나타난다.

### 2-2. 화면 — 본사 셸 (US1)

목업 `.rail` 구조를 현장 `RailSidebar` 로 옮긴다(`layout.md` §0-1 · §2-A 와 같은 치수).

- 상단: `SP` 로고 + **`ADMIN` 태그**(9px, 로고 아래).
- 메뉴 2개: **사업장**(`/admin/locations`, Building) · **관리자**(`/admin/admins`, Shield). 라벨은 툴팁.
- 하단: 알림 예약 자리 + 프로필(`ProfileBadge` rail 변형 재사용). ~~"현장 사이트로 이동"~~ 없음(US4 철회).
- TopNav 없음 · 페이지 자연 스크롤 · 페이지가 자기 헤더(`AppPageHeader`)를 그린다 — 현장과 같은 규칙.
- `/admin/admins` 는 이번에 **라우트 + placeholder** 만(045 가 채운다). 레일에 메뉴가 있으니 눌러서 404 가 나면 안 된다.

### 2-3. 화면 — 관리그룹 트리 (US2)

목업 `GroupFilterPanel` / `GroupFilterButton` / `GroupTree`.

| 폭 | 구성 |
|---|---|
| **XL 이상**(Tailwind `xl`, 1280px — 목업 기준과 같다) | 좌측 248px 고정 카드(sticky). 머리: `관리그룹`(**14px 굵게** — 사용자 지적 2026-10-22) + 단위 캡션(`사업장 수` 등) + **편집 아이콘 버튼**(`AppIconButton` + `SquarePenIcon`, 현장 코스 상세의 수정 버튼과 같다 — 사용자 지시 2026-10-22) |
| **XL 미만** | 필터 줄 맨 앞 **경로 버튼**(`본부 › 지사`, 마지막만 굵게) → 누르면 **좌측 시트**(`ui/sheet`)에 같은 트리(행 높이 44px). 고르면 닫힌다 |

- 행: 펼침 화살표(하위 있을 때) · 그룹명 · 우측 개수. 들여쓰기 18px/단계. 처음엔 **전부 펼침**. 선택 행 강조(배경·글자색).
- 🔴 단계 구분(사용자 결정 2026-10-23, T774): 하위가 있는 그룹은 **펼침 화살표만**, 본부는 **본부 아이콘**(`BuildingIcon`), 지사는 화살표 자리에 **네모 닷** + **글자 굵기**(회사 굵게 · 본부 중간 · 지사 보통). 세로 가이드선(T773)은 폐기. 지사 행 왼쪽 여백은 55px(T775).
- 개수는 **호출하는 화면이 정한다**(prop). 사업장 화면: 🔴 **지사 행에만 "N개"**(사용자 결정 2026-10-22) — 사업장은 **지사 아래에만 놓인다**(업무 규칙). 회사·본부 행의 합계는 그 그룹 자체의 사업장으로 오해되고, 숫자만 쓰면 "11번" 인지 "11개" 인지 헷갈린다(사용자 지적). ⚠️ 실서버 테스트 데이터는 회사·본부에도 사업장이 직접 붙어 있어 그 수는 표시되지 않는다.
- 선택은 URL **`?group={groupSeq}`**. 없거나 트리에 없는 값이면 **루트**로 본다(목업의 "유효하지 않으면 scope 로").
- 043 에서는 `/admin/locations` 에 트리 + 빈 본문("사업장 목록은 다음 단계에서") 으로 붙인다. 044 가 본문을 채운다.

### 2-4. 화면 — 관리그룹 편집 모달 (US3)

목업 `GroupEditModal` + `GroupFormModal` + `ConfirmModal`. 트리 머리의 **[편집]** 으로 연다(MANAGER 에게는 링크 자체가 없다).

**편집 모달**(600px, 제목 "관리그룹 편집", 설명 "그룹은 회사 › 본부 › 지사 3단계까지 만들 수 있습니다.", 푸터 [완료])
- 🔴 **구조가 곧 단계다**(재수정 2026-10-22 — 참고 `ui-mock/본사관리자/사업장/관리그룹-편집모달1·2.png`, 사용자 결정 "본부 카드 + 포인트바"):
  - **회사** = 머리 줄(이름 + 회색 "회사") + 오른쪽 `+ 본부 추가`. 이름 변경·삭제 없음.
  - **본부마다 카드 1개** — 머리에 **본부 아이콘**(T774, 포인트바 대체) + 이름 + 회색 "본부" + `[✎]` `[🗑]`. 카드 안에 지사들(배경 없음 T775, 없으면 "지사가 없습니다"), 카드 아래 `+ 지사 추가`.
  - **지사 행** — **네모 닷**(T774, 목록 트리와 같다 · 행 사이 간격 · 배경 없음 T775) + 이름 + 회색 "지사" + **"사업장 N개"** + `[✎]` `[🗑]`. 지사 아래로는 추가가 없다(🔴 서버는 깊이를 막지 않는다, B-49).
  - 단계 이름은 뱃지가 아니라 회색 작은 글씨(목업). 앞선 안(세로 가이드선 + 단계별 뱃지 색)은 폐기.
- 🔴 **"관리자 M" 은 표시하지 않는다**(사용자 결정 2026-10-22, (a)) — 그룹마다 `GetGroupAdminList` 를 불러야 한다. 할당은 045.
- ⚠️ 규칙을 어긴 4단계 이상 그룹은 이 구조에 자리가 없어 그리지 않는다(실데이터에 없음).

**하위 추가 / 이름 변경**(400px 작은 모달, 편집 모달 위에 겹친다)
- 필드 하나 `그룹명`(autoFocus · Enter 제출 · 앞뒤 공백 제거 · 빈 값이면 버튼 비활성).
- 설명: 추가 = "'{부모}' 아래에 {본부|지사} 그룹을 만듭니다." / 변경 = "'{이름}' 그룹의 이름을 변경합니다."
- 🔴 **409 "동일한 위치에 같은 이름의 관리그룹이 이미 존재합니다."** 는 전역 토스트가 서버 문구 그대로 띄우고, **모달은 닫지 않는다**(성공해야 닫는다). 필드 아래 표시는 하지 않는다 — 전역 `MutationCache.onError` 규약 유지(사용자 결정 2026-10-22, 041 사번 중복과 같다).

**삭제 확인**(`AppAlertDialog`)
- 🔴 문구는 목업보다 강하게 — 서버가 **실제로 함께 지운다**(B-51): "'{이름}' 그룹을 삭제합니다. **하위 그룹 N개와 소속 사업장 N개도 함께 삭제됩니다.** 삭제된 데이터는 복구할 수 없습니다." (하위·사업장이 0이면 그 문장 생략)
- 개수는 트리에서 센다(하위 그룹 = 자손 그룹 수, 사업장 = 자기+자손 그룹의 사업장, `children` 포함).
- 삭제한 그룹이 현재 `?group` 이거나 그 조상이면 → 루트로 되돌린다.

### 2-5. ~~화면 — 본사 사업장 선택 (US4)~~ 🔴 **철회(사용자 결정 2026-10-23)**

> 본사 3종은 로그인하면 **사업장 선택 없이** `/admin/locations` 로 간다(`siteSeq` 저장 안 함). 아래는 철회 전 설계 기록이다.

`api-spec.md` §2-2 확정 규칙: 본사 = `AdminSiteSelect` · **트리의 사업장 노드** · **단일·복수 무관 항상 선택 화면**.

- 로그인 성공(`code 1xx`) → 토큰 저장 → `AdminSiteSelect` → **평탄화 어댑터**(그룹 트리를 깊이 우선으로 돌며 각 그룹의 `sites` 와 그 `children` 을 응답 순서대로 모은다) → 기존 `SiteSelectStep` 에 그대로 넘긴다.
- 선택 → `setSite` → 본사 홈(`/admin/locations`). 저장소·로그아웃 정리는 021 그대로.
- 🔴 **0개면 본사 사이트로 그냥 들어간다**(`siteSeq` 없음) — 현장과 다르다. 그룹·사업장이 하나도 없는 초기 상태에서 시스템관리자가 첫 사업장을 만들 수 있어야 한다. 이때 "현장 사이트로 이동" 은 비활성 + 툴팁 "선택한 사업장이 없습니다".
- 🔴 **호출 실패·403** 은 현장과 같다 — 토큰을 지우고 로그인 단계에 남는다.

---

## 3. 제약

### 기술 제약

- 교체: `components/layout/AdminLayout.tsx`(레일 셸) · `sidebar.config.ts` 의 `AdminMenus`(그룹형 → flat 2개, 현장 `ServiceMenus` 와 같은 모양).
- 🔴 **`RailSidebar` 를 두 사이트가 함께 쓴다** — 메뉴 · 상단 태그 · 하단 링크만 다르다. 배치 대기 뱃지 훅(`useDeploymentSummary`)은 **현장에서만** 돈다(본사에서 `GetAssignmentCount` 를 부르지 않는다). 나누는 방식은 WF-3 plan-first 에서 정한다.
- 🔴 **옛 본사 셸 삭제** — `Sidebar` · `SidebarGroup` · `SdebarItem` · `SidebarToggle` · `MobileSidebar` · `TopNav` · `AlarmSheet` · `menu-lookup` 과 그 테스트. 사용처가 `AdminLayout` 하나뿐임을 grep 으로 확인했다(2026-10-22). `ProfileBadge` 는 레일이 쓰므로 남긴다.
- 신설: `features/groups/` — `api/`(변경 3종 · `GetGroupAdminList`) · `hooks/`(트리 쿼리 · 변경 훅) · `queryKeys.ts` · `lib/groupTree.ts`(순회 · 경로 · 자손 · 셈 — 순수 함수) · `components/`(트리 · 패널 · 시트 버튼 · 편집 모달 · 폼 모달).
- `AdminSiteSelect` 조회 함수와 `GroupNode`·`SiteNode` 타입은 **한 곳**에 둔다(로그인과 트리가 같이 쓴다). 위치는 plan-first 에서.
- MSW: `AdminSiteSelect` 트리(실측 모양, 3단계) + Group 변경 3종 **상태 보유**(추가·이름변경·연쇄 삭제가 트리를 바꾼다) + 409 · reset. `GetGroupAdminList`.
- 재사용: `AppDialog` · `AppAlertDialog` · `AppFormField` · `AppInput` · `AppButton` · `AppIconButton` · `AppBadge` · `AppPageHeader` · `AppEmpty` · `ui/sheet` · `ui/tooltip` · `useQueryParams` · `SiteSelectStep` · `setSite`/`getSiteSeq`.
- 🔴 **비옵티미스틱** — 변경 성공 후 재조회로 트리를 그린다(ID 미반환이라 낙관적으로 그릴 수도 없다).

### 비즈니스 규칙

1. **그룹 편집은 시스템관리자·Master** 만 — `MANAGER` 에게는 [편집] 링크를 그리지 않는다(목업). 서버 권한은 현장관리자 403 만 실측(Master·Manager 계정 없음 — OQ-043-A).
2. **3단계 제한은 화면이 지킨다** — `layer 2`(지사) 행에는 [+] 가 없다. 서버는 막지 않는다(B-49).
3. **부모 없는 그룹을 만들지 않는다** — 추가는 반드시 트리 행의 [+] 에서 시작하므로 `parentGroupSeq` 가 늘 있다(B-49 ②).
4. **루트(`parentGroupSeq: null`)는 이름 변경·삭제 불가**.
5. **이름 변경은 할당을 보존한다** — `GetGroupAdminList` 를 먼저 읽는다. 그 조회가 실패하면 **저장하지 않는다**(빈 배열로 보내면 할당이 지워진다).
6. **삭제는 연쇄다** — 확인 문구에 함께 지워지는 하위 그룹·사업장 수를 반드시 쓴다(B-51 회신 전까지).
7. 🔴 **`AuthGuard` 본사 예외는 유지한다** — 본사 화면은 `siteSeq` 를 쓰지 않고, 본사 계정은 사업장을 고르지 않는다(US4 철회). 현장 영역의 `siteSeq` 필수 규칙은 그대로라, 본사 계정이 사업장 없이 현장 URL 로 가면 현장 로그인으로 간다(021 동작).
8. Manager 의 트리 범위는 **서버 응답 그대로** — `AdminSiteSelect` 가 Manager 에게 무엇을 주는지 미실측이다(OQ-043-A). 화면이 따로 자르지 않는다.

---

## 4. 엣지 케이스 (A급)

| 경우 | 처리 |
|---|---|
| 트리 조회 실패 | 패널 자리에 실패 표시 + [다시 시도]. 본문은 그대로 그린다 |
| 트리 로딩 | 패널 스켈레톤(행 4개) |
| `?group` 이 숫자가 아님 / 트리에 없음 | 루트로 본다(URL 은 고치지 않는다 — 다음 선택 때 덮인다) |
| 그룹명 공백만 | 제출 버튼 비활성 |
| 같은 이름(409) | 토스트에 서버 문구 · 모달 유지 |
| 그 사이 다른 사람이 지운 그룹을 수정·삭제(400 "관리그룹이 존재하지 않습니다.") | 토스트 + 트리 재조회 + 작은 모달 닫기 |
| 이름 변경 직전 `GetGroupAdminList` 실패 | 저장하지 않고 토스트(규칙 5) |
| 추가·변경·삭제 연타 | 처리 중 제출 버튼 비활성 — 요청 1회 |
| 삭제한 그룹이 선택돼 있었음 | `?group` → 루트 |
| 넓은 화면에서 시트를 연 채 XL 로 커짐 | 시트를 닫는다(패널이 대신한다) |
| 본사 로그인(`/login` · `/admin/login` 어디서든) | 사업장 선택 없이 본사 홈(US4 철회) |

---

## 5. 완료 조건 (DoD)

**셸 (US1)**
- [x] 1. `/admin/*` 가 레일 셸이다 — `ADMIN` 태그 · 메뉴 2개 · 프로필(~~하단 이동 링크~~ US4 철회). TopNav 없음 · 자연 스크롤
- [x] 2. 본사에서 `GetAssignmentCount` 요청 0건(MSW 테스트)
- [x] 3. 옛 셸 파일 8종 + 테스트 삭제 · import 0건(grep)
- [x] 4. `/admin/admins` placeholder 로 열린다

**트리 (US2)**
- [x] 5. XL 이상 고정 패널 / 미만 경로 버튼 + 좌측 시트 · 같은 트리
- [x] 6. `?group` 저장 · 새로고침 보존 · 잘못된 값 = 루트
- [x] 7. 숫자 = 하위 포함 사업장 수(사업장 `children` 포함) — `groupTree.ts` 단위 테스트

**편집 (US3)**
- [x] 8. 편집 모달 — 단계 기호(본부 아이콘 · 지사 네모 닷, T774) · 사업장 수 · `layer 2` 에 [+] 없음 · 루트 잠금 · MANAGER 에게 링크 없음
- [x] 9. 추가 → `AddGroup` 바디(`parentGroupSeq` 있음 · `userSeq: []`) → 트리에 나타남
- [x] 10. 🔴 이름 변경 → `GetGroupAdminList` 후 `UpdateGroup` 바디에 **현재 할당 `userSeq`** 가 실린다 · 그 조회 실패 시 요청 0건
- [x] 11. 409 → 토스트에 서버 문구 · 모달 유지
- [x] 12. 🔴 삭제 확인 문구에 하위 그룹·사업장 수 · 삭제 후 트리에서 자손까지 사라짐 · 선택 중이었으면 루트

**본사 로그인 (US4 철회)**
- [x] 13. 본사 3종 로그인 → 사업장 선택 없이 `/admin/locations` · 레일에 현장 이동 링크 없음
- ~~14.~~ · ~~15.~~ 철회(US4)

**마무리**
- [x] 16. `npm run verify` + `npm run test` green
- [x] 17. 브라우저 확인(사용자 확인 2026-10-23) — mock(XL 이상·미만 둘 다) + 🔴 dev:real(본사 계정 로그인 → 트리 · 그룹 추가·이름 변경·삭제는 `테스트그룹` 아래 임시 그룹으로, 끝에 삭제)
- [x] 18. 문서 — `layout.md`(본사 셸 = 레일) · `screens.md` §2 · `flow.md` §2 · `data-model.md` §3-2 · §4-2 · §5-2(그룹 부분을 서버 기준으로) · `components.md`(트리) · `roadmap.md`
- [x] 19. `## 다음 spec으로 이월`

---

## 다음 spec으로 이월

| 항목 | 넘기는 곳 | 내용 |
|---|---|---|
| 사업장 목록 본문 | **044** | `/admin/locations` 우측은 지금 빈 상태(`AppEmpty`). 트리 `?group` 을 필터로 받는다 |
| OQ-043-E 사업장은 지사 아래에만 | **044** | 사업장 추가·수정의 소속 그룹 선택지 = 지사만. 서버가 강제하는지 `AddSite`/`UpdateSite` 실측 |
| 트리 재사용(관리자 화면) | **045** | `GroupFilterPanel`/`Button` 을 `unitLabel="관리자"` + 관리자용 `count` 로. 그룹 단위 할당은 `UpdateGroup.userSeq`(교체, B-50) |
| OQ-043-A Master·Manager 실측 | 계정 생기면 | Manager 의 `AdminSiteSelect` 범위 · Group 쓰기 권한 · Manager `role` 문자열 |
| B-49 · B-50 · B-51 회신 | 백엔드 | 깊이·부모 검증 없음 / `userSeq` 생략=비우기 / 연쇄 삭제. 회신 오면 화면 방어 단순화 |
| 4단계 이상 그룹 | 관찰 | 서버가 막지 않아 생길 수 있으나 편집 모달에 자리가 없어 그리지 않는다(트리에는 보인다). 실데이터 0건 |
| 로그인 `?redirect=` 미사용 | 범위 외 발견 | 가드가 붙이는 `?redirect=` 를 `LoginForm` 이 읽지 않는다 — 항상 코드 기준 홈으로 간다. 필요하면 별도 spec |

---

## Open Questions

- **OQ-043-A Master·Manager 실측 불가** — 테스트 계정이 시스템관리자뿐이다. Manager 의 `AdminSiteSelect` 범위 · Master/Manager 의 Group 변경 권한 · Manager JWT `role` 문자열(`api-spec.md` OQ-1) 모두 미실측. 화면은 목업 규칙(MANAGER 편집 불가)만 건다. 계정이 생기면 재실측.
- **OQ-043-B 연쇄 삭제가 의도인가**(B-51) — 회신 전까지 강한 경고 문구로 버틴다. "사업장이 있으면 삭제 불가" 로 바뀌면 400 문구를 그대로 띄우는 쪽으로 단순해진다.
- **OQ-043-C 사이트 간 이동 링크** — 해소(2026-10-23): 본사 → 현장 링크는 **두지 않는다**(사용자 결정). 현장 → 본사 링크도 범위 외.
- **OQ-043-E 사업장은 지사 아래에만**(업무 규칙, 사용자 전달 2026-10-22) — 044 사업장 추가·수정의 소속 그룹 선택지를 **지사만**으로 제한하는 근거. 실서버 테스트 데이터는 규칙과 다르다(회사·본부에 사업장이 직접 있음). 서버가 강제하는지는 044 WF-1-0 에서 `AddSite`/`UpdateSite` 로 확인한다.
- ~~**OQ-043-D 본사 사업장 선택지 표시**~~ (US4 철회로 소멸) — 021 규칙대로 사업장명만 평면 나열한다. 사업장이 많아지면 그룹 경로 보조 표기가 필요할 수 있다(`SiteOption` 확장). 지금은 실데이터 11개.

---

## 참고

- 목업 소스(추출): `GroupTree` · `GroupFilterPanel` · `GroupFilterButton` · `GroupEditModal` · `GroupFormModal` · `Rail`
- 실측: `api-spec.md` §5-1-B "관리그룹 3종" · §2-2 사업장 선택 규칙 · §5-2 `GroupNode`
- 결정: `roadmap.md` §9-0
