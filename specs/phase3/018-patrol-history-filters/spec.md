# 018-patrol-history-filters spec

> 위험도: **B** (출처: screens.md §1-2 — `/patrol/zones`·`/patrol/points` 모두 B)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md) §1-2 순찰이력 (코스 이력 / 지점 이력)
> Phase: roadmap.md Phase 3 (현장 코어 △→✓)
>
> B급 — 1·2·3축 작성. 4축(엣지 케이스)은 "공통 규칙 따름" + 고유 2건만 명시.

---

## 0. Carry-over (직전 spec 핸드오프)

직전 spec = `017-select-and-datepicker` (Phase 2 마감). 출처: 해당 `tasks.md` "다음 spec으로 이월" 블록.

- [x] **`AppDatePicker` M2 시각 검증** (017 DoD 미달 1건 — 소비처 부재) — **본 spec에서 해소**. 두 이력 화면의 기간 필터가 첫 소비처이므로 §5 DoD에 M2로 편입
- [x] **`AppSelect` 다중 선택 / `AppDatePicker` 단일 날짜** (017 → "018에서 판단") — **본 spec에서 판단 완료: 확장하지 않는다.** 결과 필터를 **단일 선택 + "전체" 옵션**으로 확정(사용자 결정 2026-10-01). 단수형 쿼리 키(`result?: CourseResult`)를 쓰는 `data-model.md` §5-4 규격과도 일치하며, A6(미래 확장 포인트 금지)을 유지
- [ ] **015 T110 브라우저 확인 최종 사용자 승인** (015→016→017 계속 이월) — 본 spec의 M2에서 `/patrol/*` 두 화면을 열 때 함께 볼 수 있으나, 대상 화면(`/notice`)이 달라 자동 해소되지 않는다. **미해결 유지**
- [ ] **전역 디자인 토큰의 본사(`/admin/*`) side-effect** (`roadmap.md` §13) — 본 spec은 현장 화면만 건드리고 토큰 스코프를 변경하지 않는다. **범위 밖 → Phase 5 착수 전 결정으로 계속 이월**
- [ ] **공지 첨부 업로드/다운로드** — **범위 밖 → `/notice` 첨부 실동작 작업 시점으로 계속 이월**
- [ ] **dnd-kit Provider** — **범위 밖 → `/zones` 드래그 정렬 실동작 작업 시점으로 계속 이월**
- [ ] **알림 시트 본문** — 017에서 Phase 5(본사)로 이동 확정. **범위 밖**

---

## User Stories

- US1. 현장관리자가 코스 순찰이력에서 **기간·코스·결과**로 목록을 좁혀, 보려는 이력만 추린 상태로 본다.
- US2. 현장관리자가 지점 순찰이력에서 **기간·순찰코스·인증수단·순찰자·결과**로 목록을 좁혀 본다.
- US3. 현장관리자가 필터를 걸어둔 화면을 새로고침하거나 뒤로가기로 돌아오거나 링크를 공유해도 **같은 필터 결과를 다시 본다.**

---

## 1. 목적

Phase R(009·010)에서 두 이력 화면의 UI를 신규 셸로 교체하며 필터 트리거 8개를 배치했지만 **전부 `no-op`이다**(`PatrolZonesPage.tsx:67-69` 3개, `PatrolPointsPage.tsx:64-68` 5개). 017에서 그 안에 넣을 선택 primitive 2종(`AppSelect`·`AppDatePicker`)을 만들었으나 기간 필터 쪽은 아직 소비처가 없다.

본 spec은 **그 둘을 잇는다.** 트리거를 팝오버로 열고, 안에 017의 컨트롤을 조립하고, 선택값을 URL 쿼리스트링에 저장하고, 그 쿼리로 목록을 실제로 필터링한다. 즉 **017이 "부품", 018이 "조립 + 배선"**이다.

`useQueryParams`(`src/hooks/useQueryParams.ts`)는 004에서 read/update primitive만 만들고 파싱·기본값 처리를 "화면 spec(Phase 3 `/patrol/zones` 첫 사용처)"로 명시 이연해 두었다. **그 첫 사용처가 본 spec이다.**

---

## 2. I/O

### Input

**URL 쿼리스트링** — 키는 `data-model.md` §5-4 `CourseHistoryQuery` / `PointHistoryQuery`를 그대로 따른다(`patterns.md` §6 "쿼리스트링 키는 `*Query` 인터페이스와 일치").

| 화면 | 키 | 값 형식 | 트리거 |
|---|---|---|---|
| 공통 | `from` / `to` | `YYYY-MM-DD` | 기간 선택 (`AppDatePicker` 범위) |
| 공통 | `page` / `pageSize` | 1-based 정수 / 정수 | `AppPagination` |
| `/patrol/zones` | `courseId` | 코스 식별값 | 코스 (`AppSelect`) |
| `/patrol/zones` | `result` | `COMPLETE` \| `INCOMPLETE` \| `IN_PROGRESS` | 결과 (`AppSelect`) |
| `/patrol/points` | `courseId` | 코스 식별값 | 순찰코스 (`AppSelect`) |
| `/patrol/points` | `authenticationMethod` | `QR` \| `NFC` | 인증수단 (`AppSelect`) |
| `/patrol/points` | `workerId` | 순찰자 식별값 | 순찰자 (`AppSelect`) |
| `/patrol/points` | `result` | `NORMAL` \| `RECORDED` \| `TIMEOUT` \| `INCOMPLETE` \| `EXCLUDED` | 결과 (`AppSelect`) |

**필터 옵션 목록의 출처**

- 결과 / 인증수단: **해당 페이지의 인라인 enum + 뱃지맵 라벨**(`ZoneColumn.tsx:13-16` / `PointColumn.tsx:14-26`). → §3 "결과 enum" 참조
- 코스 / 순찰자: **목 데이터에서 중복 제거해 유도**(`zoneName`·`name`·`worker`). 별도 목록 API를 만들지 않는다.

### Output

- 화면 전환: 없음. 같은 라우트에서 쿼리스트링만 변한다.
- 상태 변화:
  - 테이블 데이터 = 필터 통과 행만. `AppPagination`의 `total`도 **필터 후 건수**로 바뀐다.
  - 필터 값이 하나라도 바뀌면 **`page`를 1로 리셋**한다(필터 결과가 현재 페이지보다 짧아 빈 화면이 되는 것을 막음).
  - 필터가 걸린 트리거는 `active` prop으로 강조되고(§3 참조), 라벨에 선택값이 보인다.
  - 통과 행이 0건이면 `AppEmpty`(`patterns.md` §7).
- 저장/외부 효과: **없음. API 호출 없음** — 백엔드·스웨거 미확보 상태이므로 필터링은 클라이언트에서 목 데이터에 대해 수행한다(사용자 결정 2026-10-01).

---

## 3. 제약

### 기술 제약

- **재사용 컴포넌트/훅 (신규 공용 컴포넌트를 만들지 않는다)**: `AppSelect`·`AppDatePicker`(017), `AppPagination`, `AppEmpty`, `useQueryParams`.
- **필터 트리거는 primitive 자체를 쓴다 — `AppFilterButton`으로 감싸지 않는다** (2026-10-01 정정).
  - 017 primitive 2종은 **이미 자체 트리거를 품고 있다**: `AppSelect`는 Radix `SelectTrigger`(`AppSelect.tsx:38`, `role="combobox"` 버튼), `AppDatePicker`는 `PopoverTrigger`(`AppDatePicker.tsx:46`).
  - 따라서 `AppFilterButton`을 트리거로 두고 그 안에 넣으면 **버튼 안에 버튼**이 되어 중첩 인터랙티브 요소가 생기고 클릭이 두 번 필요해진다. 본 spec 초안의 "트리거가 팝오버로 열리고 안에서 고른다"는 전제는 성립하지 않으므로 폐기한다.
  - 대신 두 화면의 필터 자리에 `AppSelect`(6곳)·`AppDatePicker`(2곳)를 **직접 배치**한다. `AppFilterButton` 8곳은 이 두 화면에서 빠진다.
- **목업 시각을 지키기 위해 017 primitive에 prop 2개를 추가한다** (사용자 결정 2026-10-01).
  - `AppSelect`: `icon`(`LucideIcon`) + `active`(boolean) — `AppFilterButton.tsx:19-31`의 아이콘·강조 시각(`data-active` → `border-point`/`bg-point-bg`)을 그대로 옮긴다.
  - `AppDatePicker`: `active`만 추가(`CalendarIcon`은 `AppDatePicker.tsx:60`에 이미 있음).
  - 두 prop 모두 **선택적(optional)이라 기존 호출부는 무변경**이다(`AppPagination.tsx:36-43` 포함). A6의 "미래 확장 포인트 금지"에 걸리지 않는 이유: 확정 수요 8곳이 지금 생겼기 때문.
- **필터 로직은 순수 함수로 분리**한다. 페이지 JSX 안에 인라인하지 않는다 — 단위 테스트 대상이기 때문. 위치는 각 feature 폴더(`features/patrol-zones/`·`features/patrol-points/`)의 기존 구조를 따른다.
- **`useQueryParams`는 확장하지 않는다.** 파싱·기본값은 화면(또는 feature) 측 함수가 담당한다. 004의 이연 문구는 "화면 spec에서 도입"이며, 훅 자체에 zod를 넣으라는 뜻이 아니다. 훅을 건드리면 004 소비처 전체가 영향권에 들어가므로 A3 위반.
- **결과 enum — 현 페이지 인라인 값을 유지한다** (사용자 결정 2026-10-01). 아래 3중 분기를 본 spec에서 통합하지 않는다.
  - `src/types/enum.ts`의 `CourseResult`(`COMPLETE`/`PROCESSING`/`INCOMPLETE`)·`PointResult`(`PENDING`/`RUNNING`/`SKIP`/`NORMAL`/`RECORDED`/`TIMEOUT`) — **소비처 0곳**
  - `features/patrol-zones/types/PatrolZone.ts`·`PatrolZoneResult.ts`·`features/patrol-points/types/PatrolPoint.ts` — SSOT와 일치하나 **소비처 0곳(dead)**
  - 페이지 인라인 `PATROL_RESULT`(`...IN_PROGRESS`)·`PATROL_POINT_RESULT`(`...INCOMPLETE`/`EXCLUDED`) — **실제 렌더되는 값**
  - 통합하려면 "`design-system.md` §1-1의 지점 뱃지 5종(미완료·순찰제외 포함)"과 "SSOT `PointResult`(미완료 없음, `PENDING`/`RUNNING` 있음)" 중 어느 쪽이 실제 규격인지 **백엔드 확정이 필요**하다. 스웨거 미확보 상태에서 고르면 추측이 된다(A1). → §5 DoD에서 `roadmap.md` §13 Open Q로 등재
- **코스/순찰자 쿼리 값**: 목 데이터에 ID가 없어 **이름을 식별값 자리에 넣는다.** 키 이름은 `data-model.md` §5-4 규격(`courseId`·`workerId`)을 유지해 API 연동 시 값만 ID로 바뀌게 한다.
- **팝오버 열린 상태 목업이 없다**(017 spec에서 사용자 확정). 닫힌 상태 트리거만 `docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png`에 있다. 열린 상태는 표준 패턴으로 설계하고, 두 화면에서 동일하게 쓴다.
- **날짜 경계**: `from`/`to`는 **해당 일자를 포함**한다(`to`는 그날 23:59:59까지). 목 데이터가 `Date` 객체(시·분 포함)이므로 일자 단위 비교로 맞춘다.

### 비즈니스 규칙

- 필터는 **AND 결합**이다. 여러 필터를 걸면 전부 만족하는 행만 남는다.
- 미선택(쿼리 키 부재) = 해당 조건 **무시**. "전체"를 고르면 키를 지운다(`useQueryParams`가 `undefined`·`''`를 키 삭제로 처리 — `useQueryParams.ts:48-50`).
- 알 수 없는 쿼리 값(사용자가 URL을 손으로 고친 경우)은 **해당 필터만 무시**하고 화면은 정상 렌더한다. 에러를 띄우지 않는다.
- **목록 상태(필터·`page`·`pageSize`) 변경은 히스토리를 쌓지 않는다** — `useQueryParams`의 `{ replace: true }`를 쓴다 (사용자 결정 2026-10-01).
  - 근거 1: `patterns.md` §9가 "탭은 URL 라우트로 표현 → **뒤로가기 보존**"을 규칙으로 두고 있다. `PatrolHistoryTabs`는 `NavLink`로 두 이력 화면을 오가므로(`PatrolHistoryTabs.tsx:28-30`), 필터가 히스토리를 쌓으면 뒤로가기가 다른 탭으로 돌아가지 못해 이 규칙이 깨진다.
  - 근거 2: `AppDatePicker`는 `onSelect`를 시작일·종료일 클릭마다 호출하므로(`AppDatePicker.tsx:65`) 기간 1회 선택당 히스토리가 2개 쌓인다. 필터 3~5개를 조정하면 화면을 벗어나려 뒤로가기를 7~10번 눌러야 한다.
  - 새로고침·링크 공유 재현(US3)은 URL에 값이 남으므로 `replace`로도 그대로 성립한다.

### 범위 밖 (명시)

- **`/users` 필터 2곳**(`UsersPage.tsx:51-52` 근무 상태·사용자 상태) — 상태 enum 계열이고 쿼리 규격이 다른 문서 소관. **별도 spec으로 분리**(사용자 결정 2026-10-01)
- **Export(`내보내기`) 버튼 실동작** — `screens.md` §1-2에서 별도 항목(✗). 두 화면 공용 액션이라 별도 작업
- **검색 입력** — 009/010/013과 동일하게 비와이어드 유지. 두 화면에 검색 입력 UI 자체가 아직 없다
- **결과 enum 3중 분기 통합 / dead 타입 파일 제거** — 위 기술 제약 참조. Open Q 등재만
- **react-query·MSW 연동** — API 미확보. 필터 함수를 순수하게 유지해 연동 시 호출부만 교체되게 한다
- **목 데이터를 feature `mocks/` 폴더로 이동** — 필터 함수는 데이터를 인자로 받는 순수 함수라 이동이 필요 없다. A3
- **`AppFilterButton` 삭제 / `/users` 2곳 교체** — 두 이력 화면에서만 빠진다. `UsersPage.tsx:51-52`는 그대로 두고 컴포넌트도 지우지 않는다(`/users` spec 소관)

---

## 4. 엣지 케이스

공통 규칙 따름 (B급). 본 화면 고유 2건만 명시:

- **기간 역순 선택**: 사용자가 종료일을 시작일보다 앞서 고르는 경우 — `react-day-picker`의 `mode="range"` 기본 동작(범위 재시작)을 그대로 쓰고 임의로 보정하지 않는다.
- **필터 결과 0건**: 빈 테이블이 아니라 `AppEmpty`를 보여주고, 필터를 풀 수 있다는 걸 알 수 있게 한다(`patterns.md` §7).

---

## 5. 완료 조건 (DoD)

WF-4 검증에서 **증거(파일:라인) 명시 필요**.

- [ ] `/patrol/zones`의 필터 3개(기간 범위·코스·결과)가 열리고 값을 고를 수 있다
- [ ] `/patrol/points`의 필터 5개(기간·순찰코스·인증수단·순찰자·결과)가 열리고 값을 고를 수 있다
- [ ] 필터 자리에 `AppSelect`·`AppDatePicker`가 직접 들어가고, **트리거 중첩(버튼 안 버튼)이 없다**
- [ ] `AppSelect`에 `icon`·`active`, `AppDatePicker`에 `active` prop이 추가되고 **기존 호출부가 무변경**이다
- [ ] 선택값이 `data-model.md` §5-4 규격 키(`from`/`to`/`courseId`/`result`/`authenticationMethod`/`workerId`)로 URL에 반영된다
- [ ] 페이지 번호·행 수(`page`/`pageSize`)도 URL에 반영된다 (`patterns.md` §6)
- [ ] 쿼리가 있는 URL로 **직접 진입**했을 때 필터가 그 상태로 복원된다 (새로고침·링크 공유 재현)
- [ ] 목록 상태 변경이 히스토리를 쌓지 않는다 — 필터를 여러 번 바꾼 뒤 뒤로가기 **한 번**으로 화면/탭을 벗어난다
- [ ] 필터가 목록에 실제로 반영된다 — 통과 행만 보이고 `AppPagination`의 총 건수도 필터 후 값이다
- [ ] 필터 변경 시 `page`가 1로 리셋된다
- [ ] 여러 필터가 AND로 결합된다
- [ ] "전체" 선택 시 해당 쿼리 키가 URL에서 제거된다
- [ ] 알 수 없는 쿼리 값이 들어와도 해당 필터만 무시되고 화면이 정상 렌더된다
- [ ] 필터가 걸린 트리거가 `active`로 강조되고 라벨에 선택값이 보인다 (목업의 아이콘·강조 시각 유지)
- [ ] 필터 결과 0건에서 `AppEmpty`가 보인다
- [ ] 필터 함수가 순수 함수로 분리되고 단위 테스트가 붙는다 (누적 94건 → 증가)
- [ ] `npm run verify` + `npm run test` green (병렬 실행, CLAUDE.md A4)
- [ ] `docs/screens.md` §1-2의 두 행에서 "필터 팝오버/URL 연동 ... Phase 3 이월" 문구가 해소된다
- [ ] `docs/roadmap.md` §12에 018 행이 추가되고, §13에 **결과 enum 3중 분기 Open Q**가 등재된다
- [ ] **M2(시각 검증)** — dev 서버에서 두 화면의 필터 동작 확인. **`AppDatePicker`의 첫 시각 검증**이므로 017에서 이월된 M2도 여기서 해소. 사용자 승인 필요

---

## 참고

- 관련 목업: `docs/ui-mock/현장/순찰이력/코스순찰이력-신규.png` (필터 트리거 닫힌 상태만. 열린 상태 목업 없음)
- 관련 데이터 모델: `data-model.md` §5-4 (`CourseHistoryQuery` / `PointHistoryQuery`)
- 관련 패턴: `patterns.md` §6 (URL 쿼리스트링 필터·검색), §7 (빈 상태)
- 관련 컴포넌트: `components.md` §3-2 `AppSelect` / §3-3 `AppDatePicker` / `AppFilterButton` / `AppPagination`
- 선행 spec: `017-select-and-datepicker` (primitive 2종), `009`·`010` (두 화면 신규 셸), `004` (`useQueryParams`)
