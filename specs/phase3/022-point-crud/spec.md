# 022-point-crud spec

> 위험도: **A** (출처: `roadmap.md` §7 — "지점 추가/수정" A · "지점 삭제" A / `screens.md:75·76`)
> 관련 화면: [`docs/screens.md`](../../../docs/screens.md) §1-3 (코스/지점 — 순찰지점 목록·추가/수정·삭제)
> Phase: `roadmap.md` Phase 3 (§7-1 번호 SSOT — `022` 순찰지점)
> 선행: `spec 019`(응답 unwrap·`ApiError`) · `spec 020`(JWT·`role`) · `spec 021`(`siteSeq` 확보)
> 응답 근거: [`docs/api-spec.md`](../../../docs/api-spec.md) §1-5(`PagedData`) · §4(`authMethod`) · §5-2(10·11번 블록)
> 요청 DTO 근거: `docs/swagger-api.json` (`AddPointDto` / `UpdatePointDto`)

---

## 0. Carry-over (직전 spec = 021 핸드오프)

`specs/phase3/021-site-select/tasks.md` 맨 아래 이월 블록 기준.

**본 spec에서 해소한다**

- [ ] **`npm run capture` baseline 재촬영 여부** → 021은 seed만 고치고 판단을 넘겼다. 본 spec이 `/points` 목록을 mock→서버로 바꾸므로 baseline `현장/points--목록+상세` 1장이 **반드시 변한다**. 본 spec에서 재촬영한다.

**본 spec 범위 외 → 이월 유지**

- [ ] 🔴 **실 서버 검증 5건**(020 이월 3 + 021 몫 2) → **의도적으로 미룬다**(사용자 결정 2026-10-07, 백엔드 담당자 휴가). 근거: 5건 모두 auth 레이어에 격리돼 있다 — `childSiteSeq` 필드명은 `siteOptions.ts:21` **1줄**, `role` 문자열은 `claims.ts:51·52` **2줄**. 022는 `getSiteSeq()`가 주는 `number`만 소비하고 `siteSeq`를 URL에 노출하지 않으므로(021 DoD #13) **그 값의 출처와 무관하게 동작한다.**
  - ⚠️ 단 **본 spec 자신의 변경계 실측**(OQ-022-A·B)이 백엔드를 요구하므로, 복귀 시 **5건 + 022 몫을 한 세션에서 묶어** 수행한다. 사내망 왕복은 1회로 끝낸다.
- [ ] **OQ-021-A `children` 0개 미실측** → 0개 계정 생성 필요. 변동 없음.
- [ ] **OQ-021-B `AdminSiteSelect` 평면 배열** → Phase 5 본사 영역. 그때 `AuthGuard`의 본사 예외(`!isAdmin`)를 함께 걷어낸다.
- [ ] **OQ-021-C 사업장 전환 UI** / **OQ-021-D 사업장 기억** → 미결정, 현행 유지.
- [ ] ⚠️ **`tsconfig.json`의 `"strict": true`가 `src`에 미적용** → 별도 spec. 022가 신규 파일을 늘리므로 **켤 때 고칠 양이 늘어난다**는 점만 기록한다(021 Phase 2 발견분).
- [ ] **OQ-F `AppInput` label-input 연결 끊김** → `AppFormField` 작업. 본 spec이 `AppInput`을 폼에서 계속 쓰므로 **악화되지도 해소되지도 않는다.**
- [ ] **OQ-D `role` 문자열 3종** / **OQ-A `roleDisplay`** / **OQ-C 로그인 상태로 `/login`** → 변동 없음.

---

## User Stories

- **US1.** 현장관리자가 `/points`에 들어가면 **선택한 사업장의 실제 순찰지점 목록**을 보고, 행을 고르면 그 지점의 상세 정보를 확인한다.
- **US2.** 현장관리자가 지점을 **추가**하면 목록에 즉시 반영된다.
- **US3.** 현장관리자가 지점을 **수정**하면(이름·설명·인증수단·NFC TAG ID·사용여부) 목록과 상세에 즉시 반영된다.
- **US4.** 현장관리자가 지점을 **삭제**하면 목록에서 사라지고 상세 패널이 비워진다. 사용 중인 코스가 있어 서버가 거부하면 그 사유를 본다.
- **US5.** 현장관리자가 **이름 검색·인증수단·사용여부**로 목록을 좁히고, 그 상태가 새로고침·뒤로가기에서 보존된다.

---

## 1. 목적

`/points`는 Phase R(012)에서 UI가 완성됐지만 데이터는 전부 mock이다(`features/points/mock/pointData.ts` 15건을 `PointsPage.tsx:9`가 직접 import). 본 spec은 이 화면을 실 백엔드에 연결하고, **변경계(POST/PATCH/DELETE)를 프로젝트에 처음 도입**한다.

🔴 **"변경계만 붙이기"는 성립하지 않는다.** `UpdatePointDto`는 `pointSeq: number`를 요구하는데 현재 mock은 `id: string`이고, 추가에 성공해도 목록이 mock이면 반영되지 않는다. 따라서 **조회계 전환이 변경계의 선행 조건**이며, 이는 선택이 아니라 구조적 사실이다.

| | 현재 (`types/point.ts`) | 서버 실측 (`api-spec.md` §5-2) |
|---|---|---|
| ID | `id: string` | `pointSeq: number` |
| 이름 | `title` | `pointName`(목록) / `name`(상세) 🔴 B-4 |
| 설명 | `description` | `memo` |
| 인증수단 | `'QR' \| 'NFC'` | `authMethod: 9\|10` + `authMethodName` |
| — | 없음 | `useYn` · `usedCount` · `qrCode` · `gpsLat/Lng` · `lastPatrol*` · `courseList` |

**범위 (사용자 결정 2026-10-07)**

- ✅ 포함: `features/points` + `/points` 화면의 조회·추가·수정·삭제, 검색·필터(서버 위임), MSW 핸들러
- ❌ 제외 — **지점 QR 다운로드**: 서버는 `qrCode` 문자열 payload(`STSP1:{siteSeq}:{pointSeq}:{epoch}:{base64url서명}`)만 주고 이미지를 주지 않는다. 프로젝트에 QR 렌더링 라이브러리가 없어 **신규 패키지 도입 + 렌더·다운로드 결정**이 필요하고, 이는 변경계 전환과 성격이 다르다. 022는 `qrCode` 값을 받아 보관·표시까지만.
- ❌ 제외 — **`features/zone` 쪽 point 타입 6파일**(`zone/types/point.ts`, `zone/form/AddPointForm.tsx`, `CourseDiagramCard`, `PointCard`, `PointNode`, `ZonesPage`): `/zones`의 point는 "코스에 속한 지점"이라 `GetClassificationPoint`·`ReorderCoursePoints` 등 **코스 API와 묶여 있다**. 022에서 건드리면 A3 위반 + `spec 023`과 충돌.

---

## 2. I/O

### Input

**API 5종** (`siteSeq`는 `getSiteSeq()`(021)에서 읽는다 — §3 규칙 6)

| 메서드 | 경로 | 파라미터 / 바디 |
|---|---|---|
| `GET` | `/api/v1/Point/W/sign/GetPointList` | query: `siteSeq`(**required**) · `authMethod` · `useYn` · `searchKey` · `pageNumber` · `pageSize` |
| `GET` | `/api/v1/Point/W/sign/DetailPoint` | query: `pointSeq` |
| `POST` | `/api/v1/Point/W/sign/AddPoint` | body `AddPointDto` |
| `PATCH` | `/api/v1/Point/W/sign/UpdatePoint` | body `UpdatePointDto` — 🔴 **`PUT`이 아니다**(§3 규칙 13) |
| `DELETE` | `/api/v1/Point/W/sign/DeletePoint` | query: `pointSeq` |

**응답**(실측 그대로 전량 선언 — `CLAUDE.md` B4)

```ts
// GetPointList → PagedData<PointRow>
interface PointRow {
  pointSeq: number
  pointName: string               // ← 목록은 pointName
  memo: string | null
  authMethod: number              // 9=QR / 10=NFC
  authMethodName: string
  usedCount: number               // 이 지점을 쓰는 코스 수
  useYn: boolean
  nfcTagId: string | null
  lastPatrolDt: string | null
}

// DetailPoint → PointDetail
interface PointDetail {
  pointSeq: number
  name: string                    // ← 상세는 name 🔴 목록과 불일치 (B-4)
  memo: string | null
  authMethod: number
  authMethodName: string
  qrCode: string | null
  nfcTagId: string | null
  gpsLat: number | null
  gpsLng: number | null
  useYn: boolean
  lastPatrolDt: string | null
  lastPatrolUserSeq: number | null
  lastPatrolUserName: string | null
  courseList: { courseSeq: number; courseName: string }[]
}
```

**요청 DTO**(swagger 실측)

```ts
// AddPointDto — required: authMethod, useYn
{ siteSeq, name, memo, authMethod, qrCode, nfcTagId, gpsLat, gpsLng, useYn }

// UpdatePointDto — required: pointSeq
{ pointSeq, name, memo, authMethod, reissueQrYn, nfcTagId, gpsLat, gpsLng, useYn }
```

**폼 필드** (`features/points/form/schema.ts`)

- 이름(required, 2자 이상) · 설명 · 인증수단(`QR`/`NFC`, required) · NFC TAG ID(`NFC`일 때 required, **14자리 HEX**) · **지점사용(`useYn`) — 신설**

**쿼리스트링** (`useQueryParams`, 018 패턴 승계)

- `search`(→ `searchKey`) · `authMethod` · `useYn` · `page`

### Output

- **화면**: 좌측 목록 + 우측 상세 패널(`patterns.md` §1 유지). 추가/수정은 `AppDialog` 모달, 삭제는 `AppAlertDialog`.
- **상태 변화**: 변경 성공 시 목록·상세 쿼리 무효화 → 재조회. 삭제 성공 시 선택 해제.
- **외부 효과**: 🔴 **본 spec이 프로젝트의 첫 서버 상태 변경이다**(§3 규칙 2).

---

## 3. 제약

### 기술 제약

- **재사용**: `AppDialog` · `AppAlertDialog` · `AppButton` · `AppInput`(`variant="search"`) · `AppSelect` · `AppBadge` · `AppEmpty` · `useQueryParams` · `lib/axios`(019) · `getSiteSeq`(021) · `notify`
- **유지**: `PointListCard` · `PointDetail` · `DetailSection`/`DetailRow` · `AuthMethodDisplay` · `AuthMethodSelector` · `ZoneRow` — 레이아웃은 Phase R(012)에서 확정됐다. 바인딩 소스만 바꾼다.
- **신규**: `features/points/api/*.ts`(5종) · `features/points/types/point.ts`(실측 타입으로 교체) · `features/points/lib/authMethod.ts`(정수↔표시 매핑) · `features/points/hooks/*`(react-query) · `src/mocks/handlers/points.ts`
- **라이브러리 추가 없음.** `@tanstack/react-query`는 이미 설치·`QueryClientProvider` 연결돼 있다(`main.tsx:23`).

### 비즈니스 규칙

1. 🔴 **조회계 전환이 변경계의 선행 조건이다**(§1). mock 타입 교체 → 목록·상세 조회 → 변경계 순서를 뒤집을 수 없다.

2. 🔴 **본 spec이 프로젝트의 첫 react-query 사용이다.** 실측: `useQuery`·`useMutation`·`queryKey` **전부 0건**. 004가 패키지·`QueryClientProvider`·`lib/queryClient.ts`를 깔았지만 모든 화면이 아직 mock 동기 import다. 따라서 **`queryKey` 규약을 본 spec이 세운다**:
   - 목록 `['points', siteSeq, listParams]` / 상세 `['point', pointSeq]`
   - `siteSeq`를 키에 **반드시 포함**한다 — 사업장이 바뀌면 다른 데이터인데 키가 같으면 이전 사업장 캐시가 보인다.
   - 변경 성공 시 `invalidateQueries({ queryKey: ['points'] })` + 수정은 `['point', pointSeq]`도 함께.
   - ⚠️ 이 규약은 `spec 023~026`이 그대로 따를 것이므로, 022에서 정한 모양이 **사실상 프로젝트 컨벤션**이 된다. `data-model.md` 또는 `patterns.md`에 1절로 남긴다(DoD #19).

3. **mutation 실패 토스트를 화면에서 중복 띄우지 않는다.** `lib/queryClient.ts:18-20`의 `MutationCache.onError`가 **모든 mutation 실패를 전역 `notify.error`로** 이미 띄운다. 화면에서 또 띄우면 토스트가 2개 뜬다. 폼 인라인 메시지가 필요한 경우만 추가로 다룬다.

4. 🔴 **마스터-디테일 구조가 바뀐다.** 현재 `PointsPage.tsx:15·36`은 목록 행 객체(`PointType`)를 그대로 `PointDetail`에 넘긴다. 서버는 **목록 행 ≠ 상세**이므로:
   - 선택 상태는 `selectedSeq: number | null`(`pointSeq`만) — `patterns.md` §1의 "행 선택 상태는 `useState`, URL에 안 박는다"는 유지한다.
   - 상세는 `DetailPoint(pointSeq)`로 **별도 조회**한다.
   - **첫 행 자동 선택**(`patterns.md` §1)은 `selectedSeq ?? items[0]?.pointSeq`로 **파생**시킨다. 현재의 lazy init(`points[0] ?? null`)은 데이터가 동기일 때만 성립하고, effect로 바꾸면 "로딩 완료 → setState → 재렌더" 한 박자가 생긴다.

5. **목록↔상세 필드명 불일치(B-4)에 어댑터를 만들지 않는다.** `PointRow`·`PointDetail`을 각각 실측 그대로 선언하고 소비처가 자기 타입을 쓴다 — `PointListCard`는 `pointName`만, `PointDetail`은 상세 필드 전부를 쓰고 **둘을 함께 받는 공용 컴포넌트가 없다**. 하나로 합치면 목록에 없는 필드(`qrCode`·`courseList`·`gps`)가 optional로 번져 "있는 줄 알고 바인딩"하는 함정이 생긴다. `CLAUDE.md` B4의 "셋 다 없으면 어댑터를 만들지 않는다"에 해당 — 합칠 **수요가 없다**.
   - ⚠️ 단 **`authMethod` 정수 ↔ 표시값은 어댑터가 필요하다**(B4 조건 ②). 폼의 `AuthMethodSelector`와 Enum SSOT(`types/enum.ts:25` `AuthMethod = 'QR' | 'NFC'`)는 문자열을 쓰는데 서버는 `9`/`10`을 주고받는다. `features/points/lib/authMethod.ts`에 **양방향 매핑**을 두고 한 자리에서만 변환한다.
   - 표시는 서버가 주는 `authMethodName`을 우선한다. 다만 `null` 표현이 `''`/`'Unknown'` 두 가지이므로(B-6) 비어 있으면 매핑표로 떨어진다.
   - ⚠️ **언제 합쳐야 하는가**(사용자 확인 2026-10-07 — "지금은 분리 유지"). 아래 셋 중 하나가 생기면 `pointDisplayName(row | detail)` **함수 1개**를 추가해 해결하고, 그때도 통일 뷰 타입은 만들지 않는다: ① 상세 로딩 중 목록 행의 이름을 헤더에 먼저 표시(스켈레톤 회피 — Phase 7에서 나올 수 있다) ② 낙관적 업데이트(목록을 폼 값으로 선반영) ③ 목록·상세를 **모두 받는** 공용 컴포넌트 신설. 현재 상세 하위 컴포넌트(`DetailRow`·`ZoneRow`·`DetailSection`)는 **point 객체를 받지 않고 primitive만** 받으므로 ③은 아직 0곳이다.

6. **`siteSeq`는 `getSiteSeq()`(021)에서 읽고 URL에 노출하지 않는다.** `GetPointList`의 **required** 파라미터이고 `AddPointDto`도 받는다 — 021이 확보한 값의 **첫 변경계 소비처**다.
   - `null`이면 조회를 **시도하지 않는다**(`enabled: false`). `AuthGuard`가 이미 막지만, 쿼리가 `siteSeq` 없이 나가면 `200` + 빈 목록이 돌아와 **"정상 응답인 빈 화면"**이 된다(`api-spec.md:211` B-9의 함정).

7. **페이지네이션은 서버가 주는 `PagedData`를 그대로 수용한다**(사용자 결정 2026-10-07 — "일단 기존 오는대로 받는게 좋을거같아").
   - 🔴 **요청 `pageNumber`는 1-based, `AppPagination`의 `pageIndex`는 0-based다**(`AppPagination.tsx:7` 주석). 변환은 **한 자리에서만** 한다. 응답 필드명도 `page`(요청은 `pageNumber`)로 다르다 — `api-spec.md` §1-5.
   - `pageSize` 서버 기본값은 **20**. 명시 전송한다(기본값에 의존하면 서버가 바뀔 때 조용히 달라진다).
   - **목록 영역의 페이지 이동 UI 배치는 확정하지 않는다** — 필터 추가로 레이아웃이 바뀔 수 있다는 사용자 판단이 있었다. 현 좌측 340px 구조를 유지하고 이동 수단만 둔다. 재배치는 OQ-022-E.

8. **검색·필터는 전부 서버에 위임한다**(사용자 결정 — "검색·필터 모두 연결"). `searchKey`·`authMethod`·`useYn`을 쿼리 파라미터로 보낸다.
   - 🔴 **클라이언트 필터 함수를 만들지 않는다.** 018이 `filterCourseHistory.ts`로 그 길을 갔다가 **"서버가 필터·페이징을 모두 제공"** 실측으로 **확정 폐기**했다(`roadmap.md` §12 018 행). 같은 실수를 반복하지 않는다.
   - URL 반영은 018 패턴을 승계한다: `useQueryParams` + `ALL_VALUE`("전체"는 URL에 남기지 않음) + `setParams(..., { replace: true })` + **필터 변경 시 첫 페이지로 복귀**(`PatrolZonesPage.tsx:76-80`).

9. **검색 input은 디바운스 300ms.** 매 타이핑마다 `queryKey`가 바뀌면 글자 수만큼 요청이 나간다. 현재 `PointTopNav.tsx:10`의 `AppInput variant="search"`는 `value`/`onChange`가 아예 없다(비와이어드).

10. **폼 필드 정합**
    - **`useYn`(지점사용) 추가** — `AddPointDto`의 **required**인데 현재 폼에 없다. `screens.md:75`도 "지점사용"을 폼 필드로 명시한다.
    - **`gpsLat`/`gpsLng`는 폼에 넣지 않고 전송하지 않는다.** GPS 값이 미관측이고 GPS 인증수단 코드도 확인되지 않았다(`api-spec.md` OQ-2). 추측으로 UI를 만들지 않는다(A1). nullable이라 생략 가능.
    - **`reissueQrYn`은 `false` 고정.** QR 재발급은 QR 기능 영역이고 본 spec 범위 외(§1). 체크박스를 만들지 않는다.

11. **NFC TAG ID는 14자리 HEX로 검증한다** — `/^[0-9A-Fa-f]{14}$/`. 현재는 `nfcTagId: z.string()` + "NFC인데 비어 있으면" refine뿐이라 형식 검증이 없다(`schema.ts:7`). `screens.md:75`가 요구하고 mock 데이터도 14자 HEX다.

12. **`AddPointForm`/`EditPointForm`을 통합하지 않는다.** 두 파일이 현재 70줄 거의 동일하지만 **DTO가 다르다** — Add는 `siteSeq`+`useYn` required, Update는 `pointSeq` required + `reissueQrYn`이고 메서드도 POST/PATCH다. 통합하면 분기가 폼 안으로 들어온다(A6). `schema.ts`는 공용으로 유지한다.
    - 🔴 **`EditPointForm`은 상세 값으로 초기화해야 한다.** 현재 `defaultValues`가 빈 문자열 고정이라(`EditPointForm.tsx:18-23`) **수정 폼인데 기존 값이 들어오지 않는다.**
    - **`AddPointForm.tsx:46·64`의 에러 바인딩 복붙 실수를 고친다** — `description`·`nfcTagId` 자리에 `errors.name?.message`가 들어가 있어 **NFC 형식 오류가 화면에 뜨지 않는다**. 규칙 11을 넣는 즉시 드러나는 결함이므로 같은 작업에 포함한다. (`EditPointForm`도 동일)

13. **`UpdatePoint`는 `PATCH`다.** `roadmap.md` §7-1의 "POST/PUT/DELETE" 표기는 오기이며 본 spec에서 교정한다(DoD #19). swagger 실측: `AddPoint`=POST / `UpdatePoint`=**PATCH** / `DeletePoint`=DELETE.

14. **삭제는 서버 응답을 실측해 분기한다**(사용자 결정). `usedCount > 0`(사용 중 코스가 있는 지점)을 **프론트에서 선제 차단하지 않는다** — "사용 중이면 삭제 불가"가 실제 서버 규칙인지 미확인이고, 추측으로 막으면 되는 동작을 막는다(A1). `DeletePoint`를 호출하고 서버가 거부하면 그 메시지를 노출한다. 실측 후 `usedCount` 기반 사전 경고를 넣을지 재검토(OQ-022-B).
    - 삭제 성공 시 **선택을 해제**한다. `selectedSeq`가 사라진 지점을 가리키면 상세 조회가 실패한다.

15. 🔴 **MSW Point 핸들러가 필수다.** `npm run dev`(mock 모드)와 `npm run capture`가 **둘 다 MSW 위에서** 돈다(`.env.capture`: `VITE_USE_MSW=true`). 핸들러 없이 전환하면 mock 모드에서 `/points`가 통째로 빈 화면이 되고 baseline `현장/points--목록+상세`가 깨진다.
    - ⚠️ **020(토큰 seed)·021(`siteSeq` seed)에 이어 세 번째로 같은 자리에서 터지는 함정이다.** `npm run capture`는 `verify`/`test`에 포함되지 않아 **자동 검증망 밖**이라 빼먹으면 다음 캡쳐까지 드러나지 않는다.
    - 핸들러는 **변경계도 제공**한다(POST/PATCH/DELETE) — 조회만 두면 mock 모드에서 추가/수정/삭제가 전부 에러 토스트가 된다.

16. **기존 mock 데이터는 버리지 않고 MSW 핸들러의 데이터 소스로 재사용한다** — `handlers/index.ts`의 004 방침("기존 `features/{points,zone}/mock/*` 데이터는 핸들러에서 import해 재사용"). 다만 **서버 스키마로 변환**해야 한다(`id`→`pointSeq` 등). `PointsPage`의 직접 import는 제거한다.

17. **`features/zone` 쪽 point 타입 6파일은 건드리지 않는다**(§1 범위, 사용자 결정). `PointType`이 당분간 두 벌 존재하게 되며, `spec 023`에서 정리한다.

---

## 4. 엣지 케이스

| 상황 | 처리 |
|---|---|
| `getSiteSeq()`가 `null` | 조회하지 않는다(`enabled: false`). `AuthGuard`(021)가 이미 로그인으로 보내므로 **방어 목적**이다. 규칙 6 — `siteSeq` 없이 쿼리가 나가면 `200`+빈 목록이 "정상 빈 화면"으로 그려진다 |
| 목록 **0건** (신규 사업장) | `AppEmpty`("지점을 생성해주세요"). 현재 우측 패널 빈 상태 문구를 유지하되, **목록 영역에도** 빈 상태가 필요하다 — 지금은 0건 처리가 없다(`PointList.tsx:14` 무조건 `map`) |
| 목록 조회 **실패** (네트워크·500) | 019 `ApiError` 메시지 표시 + 재시도 수단. 🔴 **빈 목록과 구분되게** — 둘 다 "아무것도 없음"으로 보이면 장애를 데이터 없음으로 오해한다 |
| 상세 조회 실패 / 삭제된 지점 선택 | 상세 패널에만 에러 표시. **목록은 유지**한다(목록까지 지우면 다른 지점으로 이동할 수단이 사라진다) |
| 🔴 **HTTP 200인데 `code`로 실패를 알리는 변경계 응답** | **OQ-022-A(=019 OQ-E) 실측 지점.** 019가 성공 판정을 HTTP 2xx 전담으로 바꿨으므로 이런 응답은 **조용히 성공 처리된다** — 변경계에서는 "저장 안 됐는데 됐다고 표시"가 된다. 실측 전까지 추측으로 분기를 넣지 않고(A1), 실측 후 `axios.ts` 인터셉터 또는 호출부에서 처리한다 |
| 추가·수정 **유효성 400** | ASP.NET **ProblemDetails**(B-3, `message` 없음)로 돌아온다. 019 `toApiError`가 이미 3종을 정규화하므로 **형태를 다시 분기하지 않는다**. 필드별 매핑이 필요한지는 실측 후 판단 |
| 삭제 — 사용 중 코스 존재(`usedCount > 0`) | 서버 응답대로 처리(규칙 14). 거부되면 메시지 노출 + 목록 유지. **프론트 선제 차단 없음** |
| 변경 **연타**(저장·삭제 버튼) | `isPending`으로 버튼 `disabled`. 모달은 성공 후에만 닫는다 — 먼저 닫으면 실패 시 입력값이 사라진다 |
| 수정 중 다른 지점 선택 | 모달이 열려 있으면 목록 선택을 막지 않되, 모달은 **열릴 때의 `pointSeq`를 고정**한다. 안 고정하면 저장이 **엉뚱한 지점에 적용된다** |
| 인증수단 `QR`→`NFC` 전환 | `nfcTagId` 입력 노출 + 14자리 HEX required. `NFC`→`QR`은 `nfcTagId`를 비운다(현재 `setValue('nfcTagId','')` 유지) |
| 서버 `authMethodName`이 `''` 또는 `'Unknown'` | B-6. 비어 있으면 `authMethod` 정수 → 매핑표로 떨어진다(규칙 5). `9`/`10` 외 값이면 원문 표시, **추측 라벨을 만들지 않는다** |
| `useYn: false`(미사용) 지점 | 목록에 표시하되 구분이 필요하다. 표시 방법은 OQ-022-G — 현재 `PointListCard`에 사용여부 표현이 없다 |
| `pageNumber` 초과 | `200` + `items: []`(에러 아님, `api-spec.md` §1-5). 필터 변경 시 첫 페이지 복귀(규칙 8)로 대부분 예방되지만, 삭제로 마지막 페이지가 비는 경우가 남는다 |
| 필터 결과에서 선택된 지점이 빠짐 | 018 선례(`PatrolZonesPage.tsx:85`)대로 상세 패널을 비운다 — 목록에 없는 행의 상세가 떠 있으면 안 된다 |

---

## 5. 완료 조건 (DoD)

WF-4에서 증거(`파일:라인`) 명시 필요.

- [ ] 1. `/points` 목록이 `GetPointList`(실 API / MSW) 결과를 렌더한다. `features/points/mock/pointData.ts` **직접 import가 0건**이다 (US1)
- [ ] 2. 행 선택 시 `DetailPoint(pointSeq)`를 별도 조회해 상세 패널을 채운다. 첫 진입 시 첫 행이 자동 선택된다 (US1, 규칙 4)
- [ ] 3. `siteSeq`가 `getSiteSeq()`에서 오고 **URL에 노출되지 않는다**. `null`이면 조회하지 않는다 (규칙 6)
- [ ] 4. 지점 **추가**(POST) 성공 → 모달 닫힘 + 목록에 반영 (US2)
- [ ] 5. 지점 **수정**(**PATCH**) 성공 → 목록·상세 모두 반영. `EditPointForm`이 **기존 값으로 초기화**된다 (US3, 규칙 12)
- [ ] 6. 지점 **삭제**(DELETE) 성공 → 목록에서 사라지고 선택이 해제된다 (US4)
- [ ] 7. 삭제가 서버에서 거부되면 그 메시지가 노출되고 목록이 유지된다. **프론트 선제 차단이 없다** (규칙 14)
- [ ] 8. `authMethod` 정수(9/10) ↔ 표시값(`QR`/`NFC`) 변환이 **한 파일에만** 있다 (규칙 5)
- [ ] 9. 검색(`searchKey`, 디바운스)·인증수단·사용여부 필터가 **서버 파라미터로** 나가고 URL에 보존된다. **클라이언트 필터 함수가 없다** (US5, 규칙 8·9)
- [ ] 10. `pageNumber`(1-based) ↔ `pageIndex`(0-based) 변환이 **한 자리에만** 있다. `pageSize=20`을 명시 전송한다 (규칙 7)
- [ ] 11. `useYn`이 추가 폼에 있고 전송된다. `gpsLat/Lng`·`reissueQrYn`은 **폼에 없다**(`reissueQrYn`은 `false` 고정) (규칙 10)
- [ ] 12. NFC TAG ID가 **14자리 HEX**로 검증되고, 그 오류가 **해당 필드에** 표시된다 (규칙 11·12 — 에러 바인딩 복붙 수정)
- [ ] 13. `queryKey` 규약이 `['points', siteSeq, params]` / `['point', pointSeq]`이고, 변경 성공 시 무효화된다 (규칙 2)
- [ ] 14. mutation 실패 토스트가 **1개만** 뜬다 (규칙 3 — 전역 `MutationCache` 중복 방지)
- [ ] 15. 🔴 MSW 핸들러가 Point **5종 전부**(목록·상세·추가·수정·삭제) 제공한다. `npm run dev`(mock)에서 CRUD가 끝까지 동작한다 (규칙 15)
- [ ] 16. `npm run verify` 0 errors + `npm run test` green
- [ ] 17. 🔴 `npm run capture` baseline 재촬영 — `현장/points--목록+상세`가 정상이고 **나머지 11장이 깨지지 않았다** (Carry-over)
- [ ] 18. 브라우저 확인(MSW 모드) — 목록·상세·추가·수정·삭제·검색·필터·페이지 이동
- [ ] 19. 문서 동기화: `roadmap.md`(§7-1 `UpdatePoint`=**PATCH** 교정 + §7 `/points` 행 ☑ + §12 행 추가) / `screens.md` §1-3 진행도 / `data-model.md` 또는 `patterns.md`에 **`queryKey` 규약 1절**(규칙 2) / `api-spec.md`(변경계 실측 결과 — 백엔드 복귀 후)

---

## Open Questions

| ID | 내용 |
|---|---|
| OQ-022-A | 🔴 **변경계에 "HTTP 200 + 실패 `code`" 응답이 있는가**(019 **OQ-E** 승계·실측 지점). 019가 성공 판정을 HTTP 2xx 전담으로 바꿔 이런 응답은 조용히 성공 처리된다 — 변경계에서는 "저장 안 됐는데 됐다고 표시"가 된다. **백엔드 복귀 후 Add/Update/Delete 각각 실측.** 존재하면 `axios.ts` 인터셉터 보강이 필요하고, 그건 019 영역이라 별도 판단 |
| OQ-022-B | **`usedCount > 0` 지점의 `DeletePoint` 서버 동작 미실측.** 거부하는가, 거부하면 어떤 형태(A 래퍼 / B ProblemDetails / 빈 body)인가. 실측 후 `usedCount` 기반 사전 경고(버튼 비활성·확인 문구 강화) 여부 재검토. `screens.md:76`의 "사용 중 코스 영향 확인 필요(Open Question)"가 이 항목 Phase 5에서 사전 안내를 구현했다가 되돌렸다 — 서버가 거부하지 않으면 안내가 틀린 정보가 된다. **→ 2026-10-08: 실 API 응답 확인 후 확정하기로 결정**(`tasks.md` "사용자 판단 3건"). |
| OQ-022-C | **GPS 인증수단 코드 미확인**(`api-spec.md` OQ-2 승계). `authMethod` 실측은 9=QR·10=NFC뿐인데 DTO에 `gpsLat`/`gpsLng`가 있다 → GPS 코드가 따로 있을 것. 확인되면 폼·`AuthMethodSelector`·`AuthMethodDisplay`에 3번째 수단 추가 |
| OQ-022-D | **QR 다운로드 + `reissueQrYn`** → 본 spec 제외(§1). 별도 spec에서 QR 렌더링 라이브러리 선정·DOM→이미지 변환·파일명 규칙·재발급 UI를 함께 다룬다. `axios.ts`의 blob 우회(`:124`)가 이미 있어 서버가 이미지를 주는 방식으로 바뀌면 그 길도 열려 있다 |
| OQ-022-E | **목록 페이지 이동 UI 배치.** 좌측 340px 컬럼에 `AppPagination`(행수 셀렉트+범위+이전/다음, `justify-between` 가로 레이아웃)이 맞지 않는다. 필터 추가로 레이아웃이 바뀔 수 있다는 사용자 판단(2026-10-07)에 따라 확정하지 않았다. 필터 UI가 들어간 뒤 재배치 검토 |
| OQ-022-F | **`authMethodName` null 표현 2종**(`''` / `'Unknown'`, B-6). 백엔드 통일 요청 대상. 프론트는 매핑표 폴백으로 양쪽을 수용해 두었다 |
| OQ-022-G | **`useYn: false`(미사용) 지점의 목록 표시 방법** 미결정. 현재 `PointListCard`에 사용여부 표현이 없다. 뱃지 / 흐리게 / 필터 기본값에서 제외 중 선택 — 목업 없음 **→ 2026-10-08: 실 API 응답 확인 후 확정하기로 결정**(`tasks.md` "사용자 판단 3건"). |
| OQ-022-H | **`features/zone` 쪽 `PointType` 중복.** 022 동안 지점 타입이 두 벌 존재한다(규칙 17). `spec 023`에서 코스 API와 함께 정리 |
| OQ-022-J | 🔴 **변경계 응답이 `ApiResponse` 래퍼가 아니면 성공이 실패로 보고된다.** `axios.ts:131-134`가 성공 응답마다 `isApiResponse`를 검사하고 실패하면 `throw new Error('알 수 없는 응답 형식')` 한다. 판정 기준은 `code`(number) + `message`(string) + `data` 키 **셋 다**(`responseShape.ts:22-26`)이므로, 변경계가 **204 No Content**이거나 `data` 없는 바디를 주면 **쓰기는 성공했는데 UI는 실패**가 된다 — 전역 토스트에 "알 수 없는 응답 형식"이 뜬다. 조회계 24종은 전부 래퍼로 실측됐지만 **변경계는 실측이 0건**이다(`api-spec.md` §5-1에 POST/PATCH/DELETE 행이 없다). ⚠️ OQ-022-A(200+실패 `code`)와 **다른 문제**다: A는 실패를 성공으로, J는 성공을 실패로 본다. 백엔드 복귀 시 Add/Update/Delete의 **실제 status code와 바디**를 함께 확인한다. 해당하면 019 영역(인터셉터)이라 별도 판단 |
| OQ-022-I | 🔴 **서버 응답에 생성일(`createdAt`)이 없다.** 현재 상세 카드는 "생성일" 행을 mock `createdAt`으로 채운다(`PointDetail.tsx:35`). `PointDetail` 실측에 해당 필드가 없고 `GetPointList`에도 없다 → ① 그 행을 **제거**하고 서버가 주는 `lastPatrolDt`·`lastPatrolUserName`(최근 순찰)으로 대체할지 ② 백엔드에 `createdAt` 추가를 요청할지. `CLAUDE.md` B4("우리가 설계했던 필드 중 서버에 없는 것은 화면에 실제로 바인딩되는지 확인 → 필요하면 백엔드에 요청, 불필요하면 제거")의 판단 지점. **구현 중 ①로 진행하고 필요성은 사용자 확인** **→ 2026-10-08: 실 API 응답 확인 후 확정하기로 결정**(`tasks.md` "사용자 판단 3건"). |

---

## 참고

- 실측 응답 타입: `docs/api-spec.md` §5-2 (10·11번 블록)
- 페이지네이션 규약: `docs/api-spec.md` §1-5 (요청 `pageNumber` 1-based ↔ 응답 `page`)
- `authMethod` enum: `docs/api-spec.md` §4
- 백엔드 수정 요청 관련: `docs/api-spec.md` §6-1 B-3(ProblemDetails) · B-4(필드명 불일치) · B-6(`authMethodName` null) · B-9(권한 밖 200+빈 목록)
- 요청 DTO: `docs/swagger-api.json` (`AddPointDto` / `UpdatePointDto`)
- 마스터-디테일 패턴: `docs/patterns.md` §1
- CRUD 모달 패턴: `docs/patterns.md` §2
- 필터·URL 선례(018): `src/pages/service/patrol/zones/PatrolZonesPage.tsx:59-85`
- 목업: `docs/ui-mock/현장/` — Phase R(012)에서 이미 반영됨. 신규 필드(`useYn`)는 목업 없음 → `design-system.md` 토큰으로 구성
